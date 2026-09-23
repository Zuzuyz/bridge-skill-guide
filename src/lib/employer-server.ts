import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "@/server/db.server";
import { getCurrentSessionUser } from "@/server/auth-context";
import { getInternshipMatchInternal } from "@/lib/matching-core.server";
import type { InternshipMatchResult } from "@/lib/matching-server";
import { buildPublicPassportPayload } from "@/lib/passport-public.server";
import type { PublicSkillPassportData } from "@/types";

/* =========================================================
   PHASE 12 — EMPLOYER / COMPANY PORTAL
   ---------------------------------------------------------
   All company identity is derived from the authenticated
   session (Company 1:1 User). A browser-supplied company id
   is never trusted. Every opportunity/application/candidate
   query is scoped through company ownership checks.
   ========================================================= */

/* ---------------------------------------------------------
   SESSION-DERIVED COMPANY RESOLUTION
--------------------------------------------------------- */

async function getAuthenticatedCompany() {
  const sessionUser = await getCurrentSessionUser();

  if (!sessionUser || sessionUser.role !== "company") {
    return null;
  }

  const company = await prisma.company.findUnique({
    where: { userId: sessionUser.id },
  });

  return { sessionUser, company };
}

/* ---------------------------------------------------------
   COMPANY PROFILE
--------------------------------------------------------- */

export type EmployerCompanyData = {
  id: string;
  name: string;
  industry: string | null;
  verified: boolean;
  description: string | null;
  website: string | null;
  location: string | null;
  contactName: string;
  createdAt: string;
};

export const getEmployerCompany = createServerFn({
  method: "GET",
}).handler(async (): Promise<EmployerCompanyData | null> => {
  const auth = await getAuthenticatedCompany();

  if (!auth) {
    return null;
  }

  const company = await prisma.company.findUnique({
    where: { userId: auth.sessionUser.id },
    include: { user: { select: { name: true } } },
  });

  if (!company) {
    return null;
  }

  return {
    id: company.id,
    name: company.name,
    industry: company.industry,
    verified: company.verified,
    description: company.description,
    website: company.website,
    location: company.location,
    contactName: company.user.name,
    createdAt: company.createdAt.toISOString(),
  };
});

const companyProfileSchema = z.object({
  name: z.string().trim().min(2, "Company name is required.").max(120),
  industry: z.string().trim().max(80).optional(),
  description: z.string().trim().max(4000).optional(),
  website: z
    .string()
    .trim()
    .max(300)
    .optional()
    .refine(
      (value) => !value || /^https?:\/\/.+/i.test(value),
      "Website must be a valid URL starting with http:// or https://",
    ),
  location: z.string().trim().max(120).optional(),
});

/**
 * Creates or updates the authenticated employer's company.
 * The company row is resolved from the session user — never
 * from a client-supplied company id.
 */
export const updateEmployerCompany = createServerFn({ method: "POST" })
  .validator((input: unknown) => companyProfileSchema.parse(input))
  .handler(async ({ data }): Promise<EmployerCompanyData> => {
    const auth = await getAuthenticatedCompany();

    if (!auth) {
      throw new Error("You are not authorized to access the employer portal.");
    }

    const company = await prisma.company.upsert({
      where: { userId: auth.sessionUser.id },
      create: {
        userId: auth.sessionUser.id,
        name: data.name,
        industry: data.industry || null,
        description: data.description || null,
        website: data.website || null,
        location: data.location || null,
      },
      update: {
        name: data.name,
        industry: data.industry || null,
        description: data.description || null,
        website: data.website || null,
        location: data.location || null,
      },
      include: { user: { select: { name: true } } },
    });

    return {
      id: company.id,
      name: company.name,
      industry: company.industry,
      verified: company.verified,
      description: company.description,
      website: company.website,
      location: company.location,
      contactName: company.user.name,
      createdAt: company.createdAt.toISOString(),
    };
  });

/* ---------------------------------------------------------
   DASHBOARD (real counts only)
--------------------------------------------------------- */

export type EmployerDashboardData = {
  company: { name: string; verified: boolean; industry: string | null } | null;
  activeOpportunities: number;
  totalApplications: number;
  underReview: number;
  shortlisted: number;
  interviews: number;
  selected: number;
  rejected: number;
  recentApplications: Array<{
    id: string;
    candidateName: string;
    role: string;
    status: string;
    appliedAt: string;
  }>;
};

export const getEmployerDashboard = createServerFn({
  method: "GET",
}).handler(async (): Promise<EmployerDashboardData> => {
  const auth = await getAuthenticatedCompany();

  if (!auth?.company) {
    return {
      company: null,
      activeOpportunities: 0,
      totalApplications: 0,
      underReview: 0,
      shortlisted: 0,
      interviews: 0,
      selected: 0,
      rejected: 0,
      recentApplications: [],
    };
  }

  const companyId = auth.company.id;

  const [activeOpportunities, applications, recent] = await Promise.all([
    prisma.internship.count({
      where: { companyId, status: "ACTIVE" },
    }),
    prisma.application.findMany({
      where: { internship: { companyId } },
      select: { status: true },
    }),
    prisma.application.findMany({
      where: { internship: { companyId } },
      orderBy: { appliedAt: "desc" },
      take: 8,
      select: {
        id: true,
        status: true,
        appliedAt: true,
        student: { select: { name: true } },
        internship: { select: { role: true } },
      },
    }),
  ]);

  const countBy = (status: string) =>
    applications.filter((a) => a.status === status).length;

  return {
    company: {
      name: auth.company.name,
      verified: auth.company.verified,
      industry: auth.company.industry,
    },
    activeOpportunities,
    totalApplications: applications.length,
    underReview: countBy("UNDER_REVIEW"),
    shortlisted: countBy("SHORTLISTED"),
    interviews: countBy("INTERVIEW"),
    selected: countBy("SELECTED"),
    rejected: countBy("REJECTED"),
    recentApplications: recent.map((application) => ({
      id: application.id,
      candidateName: application.student.name,
      role: application.internship.role,
      status: application.status,
      appliedAt: application.appliedAt.toISOString(),
    })),
  };
});

/* ---------------------------------------------------------
   SKILL CATALOGUE (existing Skill records — reused)
--------------------------------------------------------- */

export const getSkillCatalogue = createServerFn({
  method: "GET",
}).handler(async () => {
  const skills = await prisma.skill.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, demand: true },
  });

  return skills;
});

/* ---------------------------------------------------------
   OPPORTUNITIES (jobs / internships)
--------------------------------------------------------- */

export type EmployerOpportunity = {
  id: string;
  role: string;
  location: string | null;
  mode: string;
  duration: string | null;
  stipend: string | null;
  description: string | null;
  verified: boolean;
  status: string;
  openings: number | null;
  deadline: string | null;
  createdAt: string;
  applicationsCount: number;
  requiredSkills: Array<{ id: string; name: string }>;
  preferredSkills: Array<{ id: string; name: string }>;
};

export const getEmployerOpportunities = createServerFn({
  method: "GET",
}).handler(async (): Promise<EmployerOpportunity[]> => {
  const auth = await getAuthenticatedCompany();

  if (!auth?.company) {
    return [];
  }

  const internships = await prisma.internship.findMany({
    where: { companyId: auth.company.id },
    orderBy: { createdAt: "desc" },
    include: {
      requiredSkills: { include: { skill: true } },
      _count: { select: { applications: true } },
    },
  });

  return internships.map((internship) => ({
    id: internship.id,
    role: internship.role,
    location: internship.location,
    mode: internship.mode,
    duration: internship.duration,
    stipend: internship.stipend,
    description: internship.description,
    verified: internship.verified,
    status: internship.status,
    openings: internship.openings,
    deadline: internship.deadline ? internship.deadline.toISOString() : null,
    createdAt: internship.createdAt.toISOString(),
    applicationsCount: internship._count.applications,
    requiredSkills: internship.requiredSkills
      .filter((item) => item.required)
      .map((item) => ({ id: item.skill.id, name: item.skill.name })),
    preferredSkills: internship.requiredSkills
      .filter((item) => !item.required)
      .map((item) => ({ id: item.skill.id, name: item.skill.name })),
  }));
});

const opportunitySchema = z.object({
  role: z.string().trim().min(3, "Role title is required.").max(120),
  description: z.string().trim().max(4000).optional(),
  location: z.string().trim().max(120).optional(),
  mode: z.enum(["REMOTE", "HYBRID", "ON_SITE"]),
  duration: z.string().trim().max(80).optional(),
  stipend: z.string().trim().max(80).optional(),
  openings: z.number().int().min(1).max(1000).optional(),
  deadline: z.string().datetime().optional(),
  requiredSkills: z.array(z.string().cuid()).max(25).default([]),
  preferredSkills: z.array(z.string().cuid()).max(25).default([]),
});

/**
 * Creates an opportunity for the authenticated employer's company.
 * Required/preferred skills MUST reference the existing Skill
 * catalogue — unknown skill ids are rejected, never auto-created.
 */
export const createEmployerOpportunity = createServerFn({ method: "POST" })
  .validator((input: unknown) => opportunitySchema.parse(input))
  .handler(async ({ data }): Promise<{ id: string; role: string }> => {
    const auth = await getAuthenticatedCompany();

    if (!auth?.company) {
      throw new Error(
        "Create your company profile before posting an opportunity.",
      );
    }

    const requestedIds = Array.from(
      new Set([...data.requiredSkills, ...data.preferredSkills]),
    );

    const catalogue = requestedIds.length
      ? await prisma.skill.findMany({
          where: { id: { in: requestedIds } },
          select: { id: true },
        })
      : [];

    const validIds = new Set(catalogue.map((skill) => skill.id));

    const requiredSkills = data.requiredSkills.filter((id) => validIds.has(id));
    const preferredSkills = data.preferredSkills.filter(
      (id) => validIds.has(id) && !requiredSkills.includes(id),
    );

    const internship = await prisma.internship.create({
      data: {
        companyId: auth.company.id,
        role: data.role,
        description: data.description || null,
        location: data.location || null,
        mode: data.mode,
        duration: data.duration || null,
        stipend: data.stipend || null,
        openings: data.openings ?? null,
        deadline: data.deadline ? new Date(data.deadline) : null,
        status: "ACTIVE",
        requiredSkills: {
          create: [
            ...requiredSkills.map((skillId) => ({ skillId, required: true })),
            ...preferredSkills.map((skillId) => ({ skillId, required: false })),
          ],
        },
      },
    });

    return { id: internship.id, role: internship.role };
  });

const opportunityStatusSchema = z.object({
  internshipId: z.string().cuid(),
  status: z.enum(["ACTIVE", "CLOSED"]),
});

/**
 * Opens/closes an opportunity. Ownership is enforced server-side:
 * the update only matches rows belonging to the session company.
 */
export const updateEmployerOpportunityStatus = createServerFn({
  method: "POST",
})
  .validator((input: unknown) => opportunityStatusSchema.parse(input))
  .handler(async ({ data }): Promise<{ status: string }> => {
    const auth = await getAuthenticatedCompany();

    if (!auth?.company) {
      throw new Error("You are not authorized to manage this opportunity.");
    }

    const internship = await prisma.internship.findFirst({
      where: {
        id: data.internshipId,
        companyId: auth.company.id,
      },
      select: { id: true },
    });

    if (!internship) {
      throw new Error("Opportunity not found or not owned by your company.");
    }

    const updated = await prisma.internship.update({
      where: { id: internship.id },
      data: { status: data.status },
      select: { status: true },
    });

    return { status: updated.status };
  });

/* ---------------------------------------------------------
   APPLICATIONS
--------------------------------------------------------- */

export type EmployerApplication = {
  id: string;
  role: string;
  internshipId: string;
  candidateName: string;
  candidateProfileId: string | null;
  status: string;
  appliedAt: string;
  updatedAt: string;
};

export const getEmployerApplications = createServerFn({
  method: "GET",
}).handler(async (): Promise<EmployerApplication[]> => {
  const auth = await getAuthenticatedCompany();

  if (!auth?.company) {
    return [];
  }

  const applications = await prisma.application.findMany({
    where: { internship: { companyId: auth.company.id } },
    orderBy: { appliedAt: "desc" },
    select: {
      id: true,
      status: true,
      appliedAt: true,
      updatedAt: true,
      internshipId: true,
      student: {
        select: {
          name: true,
          studentProfile: { select: { id: true } },
        },
      },
      internship: { select: { role: true } },
    },
  });

  return applications.map((application) => ({
    id: application.id,
    role: application.internship.role,
    internshipId: application.internshipId,
    candidateName: application.student.name,
    candidateProfileId: application.student.studentProfile?.id ?? null,
    status: application.status,
    appliedAt: application.appliedAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
  }));
});

const applicationStatusSchema = z.object({
  applicationId: z.string().cuid(),
  status: z.enum([
    "APPLIED",
    "UNDER_REVIEW",
    "SHORTLISTED",
    "INTERVIEW",
    "SELECTED",
    "REJECTED",
  ]),
});

/**
 * Updates an application status. The application → internship →
 * company chain is verified against the session company before
 * any mutation. Cross-company ids are rejected.
 */
export const updateApplicationStatus = createServerFn({ method: "POST" })
  .validator((input: unknown) => applicationStatusSchema.parse(input))
  .handler(async ({ data }): Promise<{ status: string }> => {
    const auth = await getAuthenticatedCompany();

    if (!auth?.company) {
      throw new Error("You are not authorized to update this application.");
    }

    const application = await prisma.application.findFirst({
      where: {
        id: data.applicationId,
        internship: { companyId: auth.company.id },
      },
      select: { id: true },
    });

    if (!application) {
      throw new Error(
        "Application not found or not owned by your company.",
      );
    }

    const updated = await prisma.application.update({
      where: { id: application.id },
      data: { status: data.status },
      select: { status: true },
    });

    return { status: updated.status };
  });

/* ---------------------------------------------------------
   CANDIDATE DISCOVERY (privacy-limited)
--------------------------------------------------------- */

export type EmployerCandidateSummary = {
  id: string;
  name: string;
  college: string | null;
  targetRole: string | null;
  primaryCareer: string | null;
  topSkills: Array<{ name: string; score: number; verificationLevel: string }>;
  verifiedSkillCount: number;
  verifiedProjectsCount: number;
  passedAssessmentsCount: number;
  passportShared: boolean;
};

export const getEmployerCandidates = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z
      .object({ search: z.string().trim().max(80).optional() })
      .parse(input ?? {}),
  )
  .handler(async ({ data }): Promise<EmployerCandidateSummary[]> => {
    const auth = await getAuthenticatedCompany();

    if (!auth) {
      return [];
    }

    const search = data.search?.toLowerCase() ?? "";

    const profiles = await prisma.studentProfile.findMany({
      take: 200,
      orderBy: { readiness: "desc" },
      select: {
        id: true,
        college: true,
        targetRole: true,
        readiness: true,
        passportShareable: true,
        user: { select: { name: true } },
        skills: {
          orderBy: { score: "desc" },
          select: {
            score: true,
            verificationLevel: true,
            skill: { select: { name: true } },
          },
        },
        projectSubmissions: {
          where: { status: "VERIFIED" },
          select: { id: true },
        },
        assessmentAttempts: {
          where: { passed: true },
          select: { id: true },
        },
        studentCareers: {
          where: { isPrimary: true },
          include: { career: { select: { title: true } } },
          take: 1,
        },
      },
    });

    const summaries = profiles.map((profile) => ({
      id: profile.id,
      name: profile.user.name,
      college: profile.college,
      targetRole: profile.targetRole,
      primaryCareer: profile.studentCareers[0]?.career.title ?? null,
      topSkills: profile.skills.slice(0, 6).map((item) => ({
        name: item.skill.name,
        score: item.score,
        verificationLevel: item.verificationLevel,
      })),
      verifiedSkillCount: profile.skills.filter(
        (item) => item.verificationLevel !== "RESUME_DETECTED",
      ).length,
      verifiedProjectsCount: profile.projectSubmissions.length,
      passedAssessmentsCount: profile.assessmentAttempts.length,
      passportShared: profile.passportShareable,
    }));

    if (!search) {
      return summaries.slice(0, 60);
    }

    return summaries
      .filter((candidate) =>
        [
          candidate.name,
          candidate.college ?? "",
          candidate.primaryCareer ?? "",
          ...candidate.topSkills.map((skill) => skill.name),
        ]
          .join(" ")
          .toLowerCase()
          .includes(search),
      )
      .slice(0, 60);
  });

/* ---------------------------------------------------------
   CANDIDATE DETAIL (employer-permitted view)
--------------------------------------------------------- */

export type EmployerCandidateDetail = {
  id: string;
  name: string;
  college: string | null;
  targetRole: string | null;
  careers: Array<{ title: string; isPrimary: boolean }>;
  skills: Array<{
    name: string;
    score: number;
    verificationLevel: string;
    verificationLabel: string;
    category: string | null;
    evidence: string | null;
  }>;
  verifiedProjects: Array<{
    title: string;
    description: string;
    skillName: string;
    projectUrl: string | null;
    repoUrl: string | null;
    verifiedAt: string | null;
  }>;
  passedAssessments: Array<{
    title: string;
    category: string;
    percentage: number;
    completedAt: string | null;
  }>;
  verifiedCredentials: Array<{
    title: string;
    type: string;
    issuer: string;
    skills: string[];
    issuedAt: string;
  }>;
  passport: {
    shared: boolean;
    data: PublicSkillPassportData | null;
  };
};

export const getEmployerCandidate = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z.object({ candidateProfileId: z.string().cuid() }).parse(input),
  )
  .handler(async ({ data }): Promise<EmployerCandidateDetail | null> => {
    const auth = await getAuthenticatedCompany();

    if (!auth) {
      throw new Error("You are not authorized to view candidates.");
    }

    const profile = await prisma.studentProfile.findUnique({
      where: { id: data.candidateProfileId },
      select: {
        id: true,
        college: true,
        targetRole: true,
        passportShareable: true,
        user: { select: { name: true } },
        studentCareers: {
          include: { career: { select: { title: true } } },
          orderBy: { isPrimary: "desc" },
        },
        credentials: {
          where: { verified: true },
          orderBy: { issuedAt: "desc" },
        },
      },
    });

    if (!profile) {
      return null;
    }

    // Passport-based fields (projects, assessments, full skill evidence)
    // come from the same privacy-limited projection used for the public
    // Skill Passport. When the passport is private, projects/assessments
    // stay hidden and only summary skill levels are exposed — never
    // resume evidence text or reviewer notes.
    const passportPayload = profile.passportShareable
      ? await buildPublicPassportPayload(profile.id)
      : null;

    const skillRows = passportPayload
      ? passportPayload.skills
      : (await prisma.studentSkill.findMany({
          where: { studentId: profile.id },
          orderBy: { score: "desc" },
          include: { skill: true },
        })).map((item) => ({
          name: item.skill.name,
          score: item.score,
          verificationLevel: item.verificationLevel as string,
          verificationLabel:
            item.verificationLevel === "RESUME_DETECTED"
              ? "Resume Detected"
              : item.verificationLevel
                  .toLowerCase()
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase()),
          category: "",
          evidence: null,
        }));

    return {
      id: profile.id,
      name: profile.user.name,
      college: profile.college,
      targetRole: profile.targetRole,
      careers: profile.studentCareers.map((sc) => ({
        title: sc.career.title,
        isPrimary: sc.isPrimary,
      })),
      skills: skillRows.map((skill) => ({
        name: skill.name,
        score: skill.score,
        verificationLevel: skill.verificationLevel,
        verificationLabel: skill.verificationLabel,
        category: skill.category,
        evidence: skill.evidence,
      })),
      verifiedProjects: passportPayload?.verifiedProjects ?? [],
      passedAssessments: passportPayload?.passedAssessments ?? [],
      verifiedCredentials: profile.credentials.map((credential) => ({
        title: credential.title,
        type: credential.type,
        issuer: credential.issuer,
        skills: credential.skills,
        issuedAt: credential.issuedAt.toISOString(),
      })),
      passport: {
        shared: profile.passportShareable,
        data: passportPayload,
      },
    };
  });

/* ---------------------------------------------------------
   EXPLAINABLE CANDIDATE MATCHING (Phase 10 engine — reused)
--------------------------------------------------------- */

/**
 * Phase 10 is the source of truth: the employer match IS the
 * internship match result (same engine, same explanation data)
 * plus the opportunity's display role.
 */
export type EmployerCandidateMatch = InternshipMatchResult & {
  role: string;
};

export type EmployerCandidateMatchResponse =
  | ({ status: "ok" } & EmployerCandidateMatch)
  | { status: "passport_private" };

/**
 * Delegates directly to the Phase 10 matching core
 * (getInternshipMatchInternal) for a candidate against an
 * employer-owned opportunity — the SAME scoring source of
 * truth as the student-facing internship match; no second
 * formula is introduced. Internship ownership is verified
 * and the candidate's passport consent is enforced (same
 * privacy model as getEmployerCandidate / getPublicPassport).
 */
export const getCandidateMatch = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z
      .object({
        internshipId: z.string().cuid(),
        candidateProfileId: z.string().cuid(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<EmployerCandidateMatchResponse> => {
    const auth = await getAuthenticatedCompany();

    if (!auth?.company) {
      throw new Error("You are not authorized to view matching results.");
    }

    // Ownership check: the opportunity must belong to the session company.
    const internship = await prisma.internship.findFirst({
      where: { id: data.internshipId, companyId: auth.company.id },
      select: { id: true, role: true },
    });

    if (!internship) {
      throw new Error("Opportunity not found or not owned by your company.");
    }

    const candidate = await prisma.studentProfile.findUnique({
      where: { id: data.candidateProfileId },
      select: { passportShareable: true },
    });

    if (!candidate) {
      throw new Error("Candidate not found.");
    }

    // Privacy guard: match details expose skill scores and evidence
    // text, so they follow the student's passport consent exactly
    // like getEmployerCandidate does.
    if (!candidate.passportShareable) {
      return { status: "passport_private" };
    }

    const match = await getInternshipMatchInternal(
      data.candidateProfileId,
      data.internshipId,
    );

    return { status: "ok", role: internship.role, ...match };
  });

/* ---------------------------------------------------------
   OUTCOMES (real hiring funnel, no fabrication)
--------------------------------------------------------- */

export type EmployerOutcomes = {
  totalApplications: number;
  funnel: Array<{ status: string; count: number }>;
  recentSelected: Array<{
    id: string;
    candidateName: string;
    role: string;
    updatedAt: string;
  }>;
};

export const getEmployerOutcomes = createServerFn({
  method: "GET",
}).handler(async (): Promise<EmployerOutcomes> => {
  const auth = await getAuthenticatedCompany();

  if (!auth?.company) {
    return { totalApplications: 0, funnel: [], recentSelected: [] };
  }

  const applications = await prisma.application.findMany({
    where: { internship: { companyId: auth.company.id } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      status: true,
      updatedAt: true,
      student: { select: { name: true } },
      internship: { select: { role: true } },
    },
  });

  const statuses = [
    "APPLIED",
    "UNDER_REVIEW",
    "SHORTLISTED",
    "INTERVIEW",
    "SELECTED",
    "REJECTED",
  ] as const;

  return {
    totalApplications: applications.length,
    funnel: statuses.map((status) => ({
      status,
      count: applications.filter((a) => a.status === status).length,
    })),
    recentSelected: applications
      .filter((a) => a.status === "SELECTED")
      .slice(0, 10)
      .map((application) => ({
        id: application.id,
        candidateName: application.student.name,
        role: application.internship.role,
        updatedAt: application.updatedAt.toISOString(),
      })),
  };
});
