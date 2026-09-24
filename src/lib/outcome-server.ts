import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "@/server/db.server";
import { getCurrentSessionUser } from "@/server/auth-context";
import {
  ALLOWED_OUTCOME_TRANSITIONS,
  OUTCOME_LABELS,
  allowedOutcomeTypes,
} from "@/lib/outcome-core.server";

/* =========================================================
   PHASE 15 — OUTCOMES / FEEDBACK ECOSYSTEM (SERVER FUNCTIONS)
   ---------------------------------------------------------
   Client-safe createServerFn wrappers only (the plain
   server-side computations — transitions, college/faculty
   analytics — live in outcome-core.server.ts, following the
   matching-core.server.ts / roadmap-core.server.ts
   convention).

   Authorization (mirrors the Phase 12/14 resolvers):
   - identity is ALWAYS derived from the HttpOnly session —
     browser-supplied student/company/opportunity ids are
     only ever used as *references* after server-side
     ownership checks
   - outcome/feedback rows are created ONLY through the
     authorized chains below (never from typed-in ids)

   Lifecycle rules (reuse the EXISTING Application status
   state machine — no second lifecycle; see
   ALLOWED_OUTCOME_TRANSITIONS in outcome-core.server.ts):
   - INTERNSHIP_COMPLETED ← SELECTED
   - JOB_OFFER            ← INTERVIEW | SELECTED
   - HIRED                ← SELECTED | JOB_OFFER (existing Outcome)
   - NOT_SELECTED         ← APPLIED..INTERVIEW (active states)
   - WITHDRAWN            ← any state (student-side action)
   - PROJECT_COMPLETED / PLACEMENT / CERTIFICATION_COMPLETED
     are deliberately NOT employer-recordable: project and
     certification verification already exist as first-class
     persisted state (ProjectSubmission.VERIFIED,
     Credential.verified), and PLACEMENT is an aggregate,
     not an action.

   Skill evidence: employer feedback is stored in its own
   EmployerFeedback table and exposed as an ADDITIONAL
   evidence source. StudentSkill.score / verificationLevel /
   employerVerification are NEVER written by this module.
   ========================================================= */

/* ---------------------------------------------------------
   SHARED SESSION RESOLUTION
--------------------------------------------------------- */

async function getAuthenticatedCompanyProfile() {
  const sessionUser = await getCurrentSessionUser();

  if (!sessionUser || sessionUser.role !== "company") {
    return null;
  }

  return prisma.company.findUnique({
    where: { userId: sessionUser.id },
  });
}

async function getAuthenticatedStudentProfileStrict() {
  const sessionUser = await getCurrentSessionUser();

  if (!sessionUser || sessionUser.role !== "student") {
    return null;
  }

  return prisma.studentProfile.findUnique({
    where: { userId: sessionUser.id },
  });
}

/* ---------------------------------------------------------
   TYPES
--------------------------------------------------------- */

export type OutcomeData = {
  id: string;
  type: string;
  typeLabel: string;
  status: string;
  occurredAt: string;
  notes: string | null;
  company: { id: string; name: string } | null;
  internshipRole: string | null;
  createdAt: string;
};

export type EmployerFeedbackSummary = {
  id: string;
  companyName: string;
  internshipRole: string | null;
  technicalSkillsRating: number | null;
  communicationRating: number | null;
  problemSolvingRating: number | null;
  professionalismRating: number | null;
  roleReadinessRating: number | null;
  writtenFeedback: string | null;
  createdAt: string;
};

export type StudentOutcomesData = {
  outcomes: OutcomeData[];
  feedback: EmployerFeedbackSummary[];
};

/* ---------------------------------------------------------
   STUDENT — OWN OUTCOMES + PERMITTED FEEDBACK
--------------------------------------------------------- */

export const getStudentOutcomes = createServerFn({
  method: "GET",
}).handler(async (): Promise<StudentOutcomesData> => {
  const student = await getAuthenticatedStudentProfileStrict();

  if (!student) {
    return { outcomes: [], feedback: [] };
  }

  const [outcomes, feedback] = await Promise.all([
    prisma.outcome.findMany({
      where: { studentId: student.id },
      orderBy: { occurredAt: "desc" },
      include: {
        company: { select: { id: true, name: true } },
        internship: { select: { role: true } },
      },
    }),
    prisma.employerFeedback.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: "desc" },
      include: {
        company: { select: { name: true } },
        internship: { select: { role: true } },
      },
    }),
  ]);

  return {
    outcomes: outcomes.map((outcome) => ({
      id: outcome.id,
      type: outcome.type,
      typeLabel: OUTCOME_LABELS[outcome.type] ?? outcome.type,
      status: outcome.status,
      occurredAt: outcome.occurredAt.toISOString(),
      notes: outcome.notes,
      company: outcome.company,
      internshipRole: outcome.internship?.role ?? null,
      createdAt: outcome.createdAt.toISOString(),
    })),
    feedback: feedback.map((item) => ({
      id: item.id,
      companyName: item.company.name,
      internshipRole: item.internship?.role ?? null,
      technicalSkillsRating: item.technicalSkillsRating,
      communicationRating: item.communicationRating,
      problemSolvingRating: item.problemSolvingRating,
      professionalismRating: item.professionalismRating,
      roleReadinessRating: item.roleReadinessRating,
      writtenFeedback: item.writtenFeedback,
      createdAt: item.createdAt.toISOString(),
    })),
  };
});

/* ---------------------------------------------------------
   EMPLOYER — OUTCOMES + FEEDBACK FOR ITS OWN OPPORTUNITIES
--------------------------------------------------------- */

export type CompanyOutcomeRow = {
  id: string;
  candidateName: string;
  candidateProfileId: string;
  role: string;
  internshipId: string;
  type: string;
  typeLabel: string;
  status: string;
  occurredAt: string;
  notes: string | null;
};

export type CompanyFeedbackRow = {
  id: string;
  candidateName: string;
  candidateProfileId: string;
  role: string;
  internshipId: string;
  ratings: {
    technicalSkills: number | null;
    communication: number | null;
    problemSolving: number | null;
    professionalism: number | null;
    roleReadiness: number | null;
  };
  writtenFeedback: string | null;
  createdAt: string;
};

export type CompanyOutcomesEcosystemData = {
  company: { id: string; name: string } | null;
  eligible: Array<{
    applicationId: string;
    internshipId: string;
    role: string;
    candidateName: string;
    candidateProfileId: string;
    applicationStatus: string;
    allowedOutcomeTypes: string[];
  }>;
  outcomes: CompanyOutcomeRow[];
  feedback: CompanyFeedbackRow[];
};

export const getCompanyOutcomesEcosystem = createServerFn({
  method: "GET",
}).handler(async (): Promise<CompanyOutcomesEcosystemData> => {
  const company = await getAuthenticatedCompanyProfile();

  if (!company) {
    return {
      company: null,
      eligible: [],
      outcomes: [],
      feedback: [],
    };
  }

  const applications = await prisma.application.findMany({
    where: { internship: { companyId: company.id } },
    orderBy: { appliedAt: "desc" },
    select: {
      id: true,
      status: true,
      studentId: true,
      internshipId: true,
      internship: { select: { role: true } },
      student: {
        select: { name: true, studentProfile: { select: { id: true } } },
      },
    },
  });

  const [outcomes, feedback] = await Promise.all([
    prisma.outcome.findMany({
      where: { companyId: company.id },
      orderBy: { occurredAt: "desc" },
      include: {
        student: { include: { user: { select: { name: true } } } },
        internship: { select: { id: true, role: true } },
      },
    }),
    prisma.employerFeedback.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: "desc" },
      include: {
        student: { include: { user: { select: { name: true } } } },
        internship: { select: { id: true, role: true } },
      },
    }),
  ]);

  return {
    company: { id: company.id, name: company.name },
    eligible: applications.map((application) => ({
      applicationId: application.id,
      internshipId: application.internshipId,
      role: application.internship.role,
      candidateName: application.student.name,
      candidateProfileId: application.student.studentProfile?.id ?? "",
      applicationStatus: application.status,
      // Computed server-side from the single transition source of
      // truth so the UI never offers an invalid option and never
      // needs to import server modules.
      allowedOutcomeTypes: allowedOutcomeTypes(application.status),
    })),
    outcomes: outcomes.map((outcome) => ({
      id: outcome.id,
      candidateName: outcome.student.user.name,
      candidateProfileId: outcome.studentId,
      role: outcome.internship?.role ?? "—",
      internshipId: outcome.internshipId ?? "",
      type: outcome.type,
      typeLabel: OUTCOME_LABELS[outcome.type] ?? outcome.type,
      status: outcome.status,
      occurredAt: outcome.occurredAt.toISOString(),
      notes: outcome.notes,
    })),
    feedback: feedback.map((item) => ({
      id: item.id,
      candidateName: item.student.user.name,
      candidateProfileId: item.studentId,
      role: item.internship?.role ?? "—",
      internshipId: item.internshipId ?? "",
      ratings: {
        technicalSkills: item.technicalSkillsRating,
        communication: item.communicationRating,
        problemSolving: item.problemSolvingRating,
        professionalism: item.professionalismRating,
        roleReadiness: item.roleReadinessRating,
      },
      writtenFeedback: item.writtenFeedback,
      createdAt: item.createdAt.toISOString(),
    })),
  };
});

/* ---------------------------------------------------------
   EMPLOYER — RECORD OUTCOME (authorized chain + lifecycle)
--------------------------------------------------------- */

const outcomeInputSchema = z.object({
  applicationId: z.string().cuid(),
  type: z.enum([
    "INTERNSHIP_COMPLETED",
    "JOB_OFFER",
    "HIRED",
    "NOT_SELECTED",
    "WITHDRAWN",
  ]),
  notes: z.string().trim().max(2000).optional(),
});

/**
 * Records an outcome for the authenticated company's OWN
 * application. The chain application → internship → company
 * is verified server-side; a forged applicationId fails
 * with "not found". Transitions are validated against the
 * existing Application.status state machine, and duplicates
 * of the same outcome type for one application are rejected.
 */
export const createOutcome = createServerFn({ method: "POST" })
  .validator((input: unknown) => outcomeInputSchema.parse(input))
  .handler(
    async ({
      data,
    }): Promise<{ ok: true; outcomeId: string; typeLabel: string }> => {
      const company = await getAuthenticatedCompanyProfile();

      if (!company) {
        throw new Error(
          "You are not authorized to record outcomes.",
        );
      }

      // Ownership chain: application must belong to an opportunity
      // owned by the SESSION company. A forged applicationId for
      // another company's application resolves to nothing here.
      const application = await prisma.application.findFirst({
        where: {
          id: data.applicationId,
          internship: { companyId: company.id },
        },
        select: { id: true, status: true, studentId: true, internshipId: true },
      });

      if (!application) {
        throw new Error(
          "Application not found among your company's applications.",
        );
      }

      // Outcome.studentId / EmployerFeedback.studentId reference
      // StudentProfile, while Application.studentId references User.
      // Resolve the real StudentProfile id from the application's
      // User id — never copy the User id into the profile-keyed FK.
      const applicantProfile = await prisma.studentProfile.findUnique({
        where: { userId: application.studentId },
        select: { id: true },
      });

      if (!applicantProfile) {
        throw new Error(
          "The applicant does not have a student profile.",
        );
      }

      // Lifecycle guard: the outcome type must be permitted by the
      // application's CURRENT status (no NOT_SELECTED → HIRED, no
      // outcomes for students who never participated, etc.).
      const allowedFrom =
        ALLOWED_OUTCOME_TRANSITIONS[data.type] ?? [];

      if (!allowedFrom.includes(application.status)) {
        throw new Error(
          `An outcome of type ${data.type} cannot be recorded while the application status is ${application.status}.`,
        );
      }

      // No duplicate outcome types for the same application.
      const duplicate = await prisma.outcome.findFirst({
        where: {
          applicationId: application.id,
          type: data.type,
        },
        select: { id: true },
      });

      if (duplicate) {
        throw new Error(
          "This outcome has already been recorded for this application.",
        );
      }

      const outcome = await prisma.outcome.create({
        data: {
          studentId: applicantProfile.id,
          companyId: company.id,
          internshipId: application.internshipId,
          applicationId: application.id,
          type: data.type,
          status: "RECORDED",
          notes: data.notes || null,
        },
        select: { id: true },
      });

      return {
        ok: true,
        outcomeId: outcome.id,
        typeLabel: OUTCOME_LABELS[data.type] ?? data.type,
      };
    },
  );

/* ---------------------------------------------------------
   EMPLOYER — SUBMIT FEEDBACK (authorized chain)
--------------------------------------------------------- */

const ratingField = z
  .number()
  .int()
  .min(1)
  .max(5)
  .optional()
  .or(z.literal(null));

const feedbackInputSchema = z.object({
  applicationId: z.string().cuid(),
  technicalSkillsRating: ratingField,
  communicationRating: ratingField,
  problemSolvingRating: ratingField,
  professionalismRating: ratingField,
  roleReadinessRating: ratingField,
  writtenFeedback: z.string().trim().max(4000).optional(),
});

/**
 * Submits employer feedback for the authenticated company's
 * OWN application. Stored in EmployerFeedback — StudentSkill
 * rows are never touched, so existing verified evidence stays
 * intact and employer feedback becomes an ADDITIONAL evidence
 * source. One feedback record per application.
 */
export const createEmployerFeedback = createServerFn({ method: "POST" })
  .validator((input: unknown) => feedbackInputSchema.parse(input))
  .handler(
    async ({ data }): Promise<{ ok: true; feedbackId: string }> => {
      const company = await getAuthenticatedCompanyProfile();

      if (!company) {
        throw new Error(
          "You are not authorized to submit employer feedback.",
        );
      }

      const application = await prisma.application.findFirst({
        where: {
          id: data.applicationId,
          internship: { companyId: company.id },
        },
        select: { id: true, studentId: true, internshipId: true },
      });

      if (!application) {
        throw new Error(
          "Application not found among your company's applications.",
        );
      }

      // Outcome.studentId / EmployerFeedback.studentId reference
      // StudentProfile, while Application.studentId references User.
      // Resolve the real StudentProfile id from the application's
      // User id — never copy the User id into the profile-keyed FK.
      const applicantProfile = await prisma.studentProfile.findUnique({
        where: { userId: application.studentId },
        select: { id: true },
      });

      if (!applicantProfile) {
        throw new Error(
          "The applicant does not have a student profile.",
        );
      }

      const hasAnyRating =
        data.technicalSkillsRating != null ||
        data.communicationRating != null ||
        data.problemSolvingRating != null ||
        data.professionalismRating != null ||
        data.roleReadinessRating != null ||
        Boolean(data.writtenFeedback);

      if (!hasAnyRating) {
        throw new Error(
          "Provide at least one rating or written feedback.",
        );
      }

      const existing = await prisma.employerFeedback.findFirst({
        where: { applicationId: application.id },
        select: { id: true },
      });

      if (existing) {
        throw new Error(
          "Feedback has already been submitted for this application.",
        );
      }

      const feedback = await prisma.employerFeedback.create({
        data: {
          companyId: company.id,
          studentId: applicantProfile.id,
          internshipId: application.internshipId,
          applicationId: application.id,
          technicalSkillsRating: data.technicalSkillsRating ?? null,
          communicationRating: data.communicationRating ?? null,
          problemSolvingRating: data.problemSolvingRating ?? null,
          professionalismRating: data.professionalismRating ?? null,
          roleReadinessRating: data.roleReadinessRating ?? null,
          writtenFeedback: data.writtenFeedback || null,
        },
        select: { id: true },
      });

      return { ok: true, feedbackId: feedback.id };
    },
  );
