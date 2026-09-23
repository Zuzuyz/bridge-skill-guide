import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/server/db.server";
import { getCurrentSessionUser } from "@/server/auth-context";
import {
  getDemandFreshness,
  selectCurrentIndustryDemandBySkillId,
} from "@/lib/industry-demand-selector.server";
import {
  computeCollegeOutcomeAnalytics,
  type OutcomeEcosystemAnalytics,
} from "@/lib/outcome-core.server";

/* =========================================================
   PHASE 13 — COLLEGE ANALYTICS (SERVER-ONLY)
   ---------------------------------------------------------
   Every number on the college dashboard is a real Prisma
   aggregation over the student records visible to the
   authenticated college. Reused engines (no duplicated
   formulas):
   - readiness:  the persisted StudentProfile.readiness
                 column, written exclusively by the existing
                 calculateStudentReadiness engine
                 (src/server/readiness.ts)
   - skill gaps: the SkillGap table, populated exclusively
                 by the Phase 7 engine
                 computeCareerSkillGap
                 (src/lib/skill-gap-core.server.ts)
   - demand:     selectCurrentIndustryDemandBySkillId +
                 getDemandFreshness, the existing Phase 6
                 demand-selection rules
                 (src/lib/industry-demand-selector.server.ts)
   ========================================================= */

/* ---------------------------------------------------------
   SESSION-DERIVED COLLEGE RESOLUTION (authorization core)
   No URL or college id is ever accepted from the client.
   The dashboard is scoped to the College row linked to the
   session user (User 1:1 College — the same session-derived
   resolution pattern as the Phase 12 company resolver).
   Server-side role enforcement: only COLLEGE (or platform
   ADMIN) roles may read college analytics.
   --------------------------------------------------------- */

type CollegeResolution =
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "no-college-profile" }
  | { status: "ok"; collegeId: string; collegeName: string };

async function resolveCollegeForSession(): Promise<CollegeResolution> {
  const sessionUser = await getCurrentSessionUser();

  if (!sessionUser) {
    return { status: "unauthenticated" };
  }

  if (sessionUser.role !== "college" && sessionUser.role !== "admin") {
    return { status: "forbidden" };
  }

  const college = await prisma.college.findUnique({
    where: { userId: sessionUser.id },
    select: { id: true, name: true },
  });

  if (!college) {
    return { status: "no-college-profile" };
  }

  return { status: "ok", collegeId: college.id, collegeName: college.name };
}

/* ---------------------------------------------------------
   STUDENT SCOPE (the college → student join key)
   ---------------------------------------------------------
   The existing schema has no College↔Student FK. The ONLY
   available link is StudentProfile.college (free text), so a
   college's scope is the set of students whose college field
   matches the college's registered name (case-insensitive).
   Students with no college set are in nobody's scope, and
   nothing in this filter can be client-controlled.

   Note: StudentProfile is 1:1 with User and only ever created
   for student accounts (src/server/auth.ts), so no extra role
   filter is required on profile queries.
   --------------------------------------------------------- */

function studentScope(collegeName: string) {
  return {
    college: { equals: collegeName, mode: "insensitive" as const },
  };
}

/* ---------------------------------------------------------
   ANALYTICS RESULT TYPES
   --------------------------------------------------------- */

export type CollegeStudentAnalytics = {
  hasStudentData: boolean;
  totalStudents: number;
  activeStudents: number; // profiles updated in the last 30 days
  studentsWithSkills: number;
  studentsWithPrimaryCareer: number;
  studentsWithVerifiedProjects: number;
  studentsWithApplications: number;
  studentsWithAssessments: number;
};

export type CollegeSkillAnalytics = {
  hasSkillData: boolean;
  totalSkillRecords: number;
  verifiedSkillRecords: number;
  skills: Array<{
    name: string;
    studentCount: number;
    avgScore: number | null;
    verifiedCount: number;
  }>;
};

export type CollegeSkillGapAnalytics = {
  hasSkillGapData: boolean;
  gaps: Array<{
    name: string;
    needsImprovement: number;
    missing: number;
    avgScore: number;
  }>;
};

export type CollegeCareerAnalytics = {
  hasCareerData: boolean;
  careers: Array<{
    title: string;
    primaryCount: number;
    totalSelections: number;
  }>;
};

export type CollegeReadinessAnalytics = {
  hasReadinessData: boolean;
  averageReadiness: number | null;
  distribution: Array<{ label: string; count: number }>;
  sampleSize: number;
  /** Students actually included in averageReadiness (readiness > 0). */
  computedReadinessCount: number;
};

export type CollegeDemandAnalytics = {
  hasDemandData: boolean;
  totalDemandRecords: number;
  currentRecords: number;
  expiredRecords: number;
  demoRecords: number;
  topSkills: Array<{
    name: string;
    demandLevel: string;
    confidence: string;
    freshness: string;
    sourceType: string;
    isDemo: boolean;
  }>;
};

export type CollegeInternshipAnalytics = {
  hasInternshipData: boolean;
  totalOpportunities: number;
  activeOpportunities: number;
  applications: number;
  applicationsByStatus: Array<{ status: string; count: number }>;
  studentParticipants: number;
};

export type CollegeProjectAnalytics = {
  hasProjectData: boolean;
  totalSubmissions: number;
  byStatus: Array<{ status: string; count: number }>;
  verifiedProjects: number;
};

export type CollegeOutcomeAnalytics = {
  hasOutcomeData: boolean;
  selected: number;
  rejected: number;
  activePipeline: number;
  credentialsIssued: number;
  verifiedCredentials: number;
  assessmentAttempts: number;
  passedAttempts: number;
};

export type CollegeAnalyticsResult =
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "no-college-profile" }
  | {
      status: "ok";
      college: { name: string };
      overview: {
        totalStudents: number;
        activeStudents: number;
        verifiedSkills: number;
        averageReadiness: number | null;
        platformInternships: number;
        projects: number;
        applications: number;
        hasAnyStudentData: boolean;
      };
      students: CollegeStudentAnalytics;
      skills: CollegeSkillAnalytics;
      skillGaps: CollegeSkillGapAnalytics;
      careers: CollegeCareerAnalytics;
      readiness: CollegeReadinessAnalytics;
      demand: CollegeDemandAnalytics;
      internships: CollegeInternshipAnalytics;
      projects: CollegeProjectAnalytics;
      outcomes: CollegeOutcomeAnalytics;

      /* Phase 15 — outcome & employer-feedback ecosystem,
         computed by the shared outcome service over the same
         college scope. */
      outcomeEcosystem: OutcomeEcosystemAnalytics;
    };

/* ---------------------------------------------------------
   SHARED CONSTANT TABLES (mirror existing Prisma enums)
   --------------------------------------------------------- */

const VERIFIED_LEVELS = [
  "ASSESSMENT_VERIFIED",
  "PROJECT_VERIFIED",
  "INSTITUTION_VERIFIED",
  "EMPLOYER_VERIFIED",
] as const;

function isVerifiedLevel(level: string): boolean {
  return (VERIFIED_LEVELS as readonly string[]).includes(level);
}

const APPLICATION_STATUSES = [
  "APPLIED",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "INTERVIEW",
  "SELECTED",
  "REJECTED",
] as const;

const PROJECT_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "VERIFIED",
  "REJECTED",
] as const;

const READINESS_BANDS = [
  { label: "80–100", min: 80, max: 100 },
  { label: "60–79", min: 60, max: 79 },
  { label: "40–59", min: 40, max: 59 },
  { label: "1–39", min: 1, max: 39 },
  { label: "0", min: 0, max: 0 },
] as const;

const APPLICATION_STATUS_LABELS: Record<string, string> = {
  APPLIED: "Applied",
  UNDER_REVIEW: "Under Review",
  SHORTLISTED: "Shortlisted",
  INTERVIEW: "Interview",
  SELECTED: "Selected",
  REJECTED: "Rejected",
};

/* Presentation-only ordering for the demand list (no new demand
   score): the real DemandLevel enum ranked HIGH first / LOW last,
   then confidence, then name for determinism. */
const DEMAND_LEVEL_RANK: Record<string, number> = {
  HIGH: 5,
  GROWING: 4,
  EMERGING: 3,
  STABLE: 2,
  LOW: 1,
};

const DEMAND_CONFIDENCE_RANK: Record<string, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

/* =========================================================
   MAIN SERVER FUNCTION
   ========================================================= */

export const getCollegeAnalytics = createServerFn({ method: "GET" })
  .handler(async (): Promise<CollegeAnalyticsResult> => {
    const resolution = await resolveCollegeForSession();

    if (resolution.status !== "ok") {
      return resolution;
    }

    const collegeName = resolution.collegeName;
    const scope = studentScope(collegeName);

    /* ---------- Aggregate student counts (DB-side) -------- */

    const [
      totalStudents,
      activeStudents,
      studentsWithSkills,
      studentsWithPrimaryCareer,
      studentsWithVerifiedProjects,
      studentsWithApplications,
      studentsWithAssessments,
    ] = await Promise.all([
      prisma.studentProfile.count({ where: scope }),
      prisma.studentProfile.count({
        where: {
          ...scope,
          updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.studentProfile.count({
        where: { ...scope, skills: { some: {} } },
      }),
      prisma.studentProfile.count({
        where: { ...scope, studentCareers: { some: { isPrimary: true } } },
      }),
      prisma.studentProfile.count({
        where: { ...scope, projectSubmissions: { some: { status: "VERIFIED" } } },
      }),
      prisma.studentProfile.count({
        where: { ...scope, user: { applications: { some: {} } } },
      }),
      prisma.studentProfile.count({
        where: { ...scope, assessmentAttempts: { some: {} } },
      }),
    ]);

    const hasStudentData = totalStudents > 0;

    /* ---------- Skill analytics (real distribution) ------- */

    const skillRows = hasStudentData
      ? await prisma.studentSkill.findMany({
          where: { student: scope },
          select: {
            score: true,
            verificationLevel: true,
            skill: { select: { name: true } },
          },
        })
      : [];

    const skillMap = new Map<
      string,
      { studentCount: number; scoreSum: number; verifiedCount: number }
    >();

    for (const row of skillRows) {
      const entry = skillMap.get(row.skill.name) ?? {
        studentCount: 0,
        scoreSum: 0,
        verifiedCount: 0,
      };
      entry.studentCount += 1;
      entry.scoreSum += row.score;
      if (isVerifiedLevel(row.verificationLevel)) {
        entry.verifiedCount += 1;
      }
      skillMap.set(row.skill.name, entry);
    }

    const skillList = [...skillMap.entries()]
      .map(([name, agg]) => ({
        name,
        studentCount: agg.studentCount,
        avgScore:
          agg.studentCount > 0
            ? Math.round(agg.scoreSum / agg.studentCount)
            : null,
        verifiedCount: agg.verifiedCount,
      }))
      .sort(
        (a, b) =>
          b.studentCount - a.studentCount || a.name.localeCompare(b.name),
      )
      .slice(0, 12);

    const verifiedSkillRecords = skillRows.filter((row) =>
      isVerifiedLevel(row.verificationLevel),
    ).length;

    /* ---------- Skill-gap analytics (Phase 7 SkillGap) ---- */

    const gapRows = hasStudentData
      ? await prisma.skillGap.findMany({
          where: { student: scope },
          select: {
            score: true,
            status: true,
            skill: { select: { name: true } },
          },
        })
      : [];

    const gapMap = new Map<
      string,
      { needsImprovement: number; missing: number; scoreSum: number; count: number }
    >();

    for (const row of gapRows) {
      const entry = gapMap.get(row.skill.name) ?? {
        needsImprovement: 0,
        missing: 0,
        scoreSum: 0,
        count: 0,
      };
      if (row.status === "NEEDS_IMPROVEMENT") entry.needsImprovement += 1;
      if (row.status === "MISSING") entry.missing += 1;
      entry.scoreSum += row.score;
      entry.count += 1;
      gapMap.set(row.skill.name, entry);
    }

    const gapList = [...gapMap.entries()]
      .filter(([, agg]) => agg.needsImprovement + agg.missing > 0)
      .map(([name, agg]) => ({
        name,
        needsImprovement: agg.needsImprovement,
        missing: agg.missing,
        avgScore:
          agg.count > 0 ? Math.round(agg.scoreSum / agg.count) : 0,
      }))
      .sort(
        (a, b) =>
          b.missing + b.needsImprovement - (a.missing + a.needsImprovement) ||
          a.name.localeCompare(b.name),
      )
      .slice(0, 12);

    /* ---------- Career analytics -------------------------- */

    const careerRows = hasStudentData
      ? await prisma.studentCareer.findMany({
          where: { student: scope },
          select: { isPrimary: true, career: { select: { title: true } } },
        })
      : [];

    const careerMap = new Map<
      string,
      { primaryCount: number; totalSelections: number }
    >();

    for (const row of careerRows) {
      const entry = careerMap.get(row.career.title) ?? {
        primaryCount: 0,
        totalSelections: 0,
      };
      entry.totalSelections += 1;
      if (row.isPrimary) entry.primaryCount += 1;
      careerMap.set(row.career.title, entry);
    }

    const careerList = [...careerMap.entries()]
      .map(([title, agg]) => ({ title, ...agg }))
      .sort(
        (a, b) =>
          b.primaryCount - a.primaryCount ||
          b.totalSelections - a.totalSelections ||
          a.title.localeCompare(b.title),
      )
      .slice(0, 12);

    /* ---------- Readiness (reused engine's data) ---------- */

    // The persisted StudentProfile.readiness column is written
    // exclusively by the existing calculateStudentReadiness
    // engine (resume upload / skill-development flows). This
    // function only aggregates that engine's output — no
    // readiness formula lives here. A 0 readiness means the
    // student's engine run has not produced verified evidence
    // yet, and is displayed honestly as such.
    const readinessRows = hasStudentData
      ? await prisma.studentProfile.findMany({
          where: scope,
          select: { readiness: true },
        })
      : [];

    const withReadiness = readinessRows.filter((r) => r.readiness > 0);
    const hasReadinessData = withReadiness.length > 0;

    const averageReadiness =
      withReadiness.length > 0
        ? Math.round(
            withReadiness.reduce((sum, r) => sum + r.readiness, 0) /
              withReadiness.length,
          )
        : null;

    const distribution = READINESS_BANDS.map((band) => ({
      label: band.label,
      count: readinessRows.filter(
        (r) => r.readiness >= band.min && r.readiness <= band.max,
      ).length,
    }));

    /* ---------- Industry demand (existing Phase 6 rules) -- */

    // Demand scoped to careers the college's students actually
    // selected; selection/freshness logic is entirely the
    // existing selector's (real before demo, current before
    // expired, confidence-ranked).
    const demandRows = await prisma.industryDemand.findMany({
      where: {
        career: { studentCareers: { some: { student: scope } } },
      },
      select: {
        id: true,
        skillId: true,
        careerId: true,
        demandLevel: true,
        confidence: true,
        sourceType: true,
        collectedAt: true,
        validUntil: true,
        skill: { select: { name: true } },
      },
    });

    const selectedDemand = selectCurrentIndustryDemandBySkillId(demandRows);

    const demandTopSkills = [...selectedDemand.entries()]
      .map(([, selected]) => {
        // The selector returns its narrow SelectableIndustryDemand
        // shape; re-join the selected record to the full demand row
        // for display fields (skill name, level, confidence).
        const full = demandRows.find((row) => row.id === selected.id);
        if (!full) return null;
        const freshness = getDemandFreshness(
          full.collectedAt,
          full.validUntil,
          full.sourceType,
        );
        return {
          name: full.skill.name,
          demandLevel: full.demandLevel,
          confidence: full.confidence ?? "LOW",
          freshness: freshness.label,
          sourceType: full.sourceType,
          isDemo: freshness.isDemo,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort(
        (a, b) =>
          (DEMAND_LEVEL_RANK[b.demandLevel] ?? 0) -
            (DEMAND_LEVEL_RANK[a.demandLevel] ?? 0) ||
          (DEMAND_CONFIDENCE_RANK[b.confidence] ?? 0) -
            (DEMAND_CONFIDENCE_RANK[a.confidence] ?? 0) ||
          a.name.localeCompare(b.name),
      )
      .slice(0, 12);

    const currentRecords = selectedDemand.size;

    // Expired = raw demand rows the existing freshness rules mark
    // Expired. The selector can never select an expired record, so a
    // current record is never counted as expired.
    const expiredDemandRecords = demandRows.filter(
      (row) =>
        getDemandFreshness(row.collectedAt, row.validUntil, row.sourceType)
          .status === "Expired",
    ).length;

    /* ---------- Internship analytics ---------------------- */

    // Applications are college-scoped through the applicant's
    // StudentProfile. Internship opportunities are platform-wide
    // (no college relation exists in the schema) and are labeled
    // as such in the UI — never presented as this college's.
    const applicationRows = hasStudentData
      ? await prisma.application.findMany({
          where: { student: { studentProfile: scope } },
          select: { status: true, studentId: true },
        })
      : [];

    const applicationsByStatus = APPLICATION_STATUSES.map((status) => ({
      status,
      label: APPLICATION_STATUS_LABELS[status],
      count: applicationRows.filter((a) => a.status === status).length,
    }));

    const studentParticipants = new Set(applicationRows.map((a) => a.studentId))
      .size;

    const [totalOpportunities, activeOpportunities] = await Promise.all([
      prisma.internship.count(),
      prisma.internship.count({ where: { status: "ACTIVE" } }),
    ]);

    /* ---------- Project analytics ------------------------- */

    const projectRows = hasStudentData
      ? await prisma.projectSubmission.findMany({
          where: { student: scope },
          select: { status: true },
        })
      : [];

    const projectByStatus = PROJECT_STATUSES.map((status) => ({
      status,
      count: projectRows.filter((p) => p.status === status).length,
    }));

    /* ---------- Outcome analytics ------------------------- */

    const [credentialsIssued, verifiedCredentials, assessmentAttempts, passedAttempts] =
      hasStudentData
        ? await Promise.all([
            prisma.credential.count({ where: { student: scope } }),
            prisma.credential.count({ where: { student: scope, verified: true } }),
            prisma.assessmentAttempt.count({ where: { student: scope } }),
            prisma.assessmentAttempt.count({
              where: { student: scope, passed: true },
            }),
          ])
        : [0, 0, 0, 0];

    const selectedCount =
      applicationsByStatus.find((s) => s.status === "SELECTED")?.count ?? 0;
    const rejectedCount =
      applicationsByStatus.find((s) => s.status === "REJECTED")?.count ?? 0;

    /* ---------- Response ---------------------------------- */

    // Phase 15: outcome/feedback ecosystem analytics from the
    // shared outcome service (same scope, aggregated only).
    const outcomeEcosystem = await computeCollegeOutcomeAnalytics(scope);

    return {
      status: "ok" as const,
      college: { name: collegeName },
      overview: {
        totalStudents,
        activeStudents,
        verifiedSkills: verifiedSkillRecords,
        averageReadiness,
        platformInternships: totalOpportunities,
        projects: projectRows.length,
        applications: applicationRows.length,
        hasAnyStudentData: hasStudentData,
      },
      students: {
        hasStudentData,
        totalStudents,
        activeStudents,
        studentsWithSkills,
        studentsWithPrimaryCareer,
        studentsWithVerifiedProjects,
        studentsWithApplications,
        studentsWithAssessments,
      },
      skills: {
        hasSkillData: skillRows.length > 0,
        totalSkillRecords: skillRows.length,
        verifiedSkillRecords,
        skills: skillList,
      },
      skillGaps: {
        hasSkillGapData: gapList.length > 0,
        gaps: gapList,
      },
      careers: {
        hasCareerData: careerList.length > 0,
        careers: careerList,
      },
      readiness: {
        hasReadinessData,
        averageReadiness,
        distribution,
        sampleSize: readinessRows.length,
        computedReadinessCount: withReadiness.length,
      },
      demand: {
        hasDemandData: demandTopSkills.length > 0,
        totalDemandRecords: demandRows.length,
        currentRecords,
        expiredRecords: expiredDemandRecords,
        demoRecords: [...selectedDemand.values()].filter(
          (record) => record.sourceType === "DEMO",
        ).length,
        topSkills: demandTopSkills,
      },
      internships: {
        hasInternshipData:
          totalOpportunities > 0 || applicationRows.length > 0,
        totalOpportunities,
        activeOpportunities,
        applications: applicationRows.length,
        applicationsByStatus,
        studentParticipants,
      },
      projects: {
        hasProjectData: projectRows.length > 0,
        totalSubmissions: projectRows.length,
        byStatus: projectByStatus,
        verifiedProjects:
          projectByStatus.find((s) => s.status === "VERIFIED")?.count ?? 0,
      },
      outcomes: {
        hasOutcomeData:
          applicationRows.length > 0 ||
          credentialsIssued > 0 ||
          assessmentAttempts > 0,
        selected: selectedCount,
        rejected: rejectedCount,
        activePipeline: applicationRows.length - selectedCount - rejectedCount,
        credentialsIssued,
        verifiedCredentials,
        assessmentAttempts,
        passedAttempts,
      },
      outcomeEcosystem,
    };
  });
