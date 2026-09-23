import { prisma } from "@/server/db.server";

/* =========================================================
   PHASE 15 — OUTCOME CORE (SERVER-ONLY PLAIN FUNCTIONS)
   ---------------------------------------------------------
   Follows the project's matching-core.server.ts /
   roadmap-core.server.ts convention: createServerFn
   wrappers (client-safe) live in outcome-server.ts, while
   these plain server functions are imported ONLY by other
   server modules (college analytics, faculty portal).

   The OUTCOME TRANSITIONS table is the single source of
   truth for the application-status → outcome lifecycle —
   reused by both the createServerFn enforcement in
   outcome-server.ts and the analytics consumers below.
   ========================================================= */

export const ALLOWED_OUTCOME_TRANSITIONS: Record<
  string,
  readonly string[]
> = {
  INTERNSHIP_COMPLETED: ["SELECTED"],
  JOB_OFFER: ["INTERVIEW", "SELECTED"],
  HIRED: ["SELECTED", "JOB_OFFER"],
  NOT_SELECTED: [
    "APPLIED",
    "UNDER_REVIEW",
    "SHORTLISTED",
    "INTERVIEW",
  ],
  WITHDRAWN: [
    "APPLIED",
    "UNDER_REVIEW",
    "SHORTLISTED",
    "INTERVIEW",
    "SELECTED",
    "JOB_OFFER",
  ],
};

export const OUTCOME_LABELS: Record<string, string> = {
  INTERNSHIP_COMPLETED: "Internship Completed",
  JOB_OFFER: "Job Offer",
  HIRED: "Hired",
  NOT_SELECTED: "Not Selected",
  WITHDRAWN: "Withdrawn",
};

/**
 * Which outcome types are currently recordable for an
 * application in the given status — pure helper shared by
 * the server functions and analytics.
 */
export function allowedOutcomeTypes(applicationStatus: string): string[] {
  return Object.entries(ALLOWED_OUTCOME_TRANSITIONS)
    .filter(([, allowedFrom]) => allowedFrom.includes(applicationStatus))
    .map(([type]) => type);
}

export type OutcomeEcosystemAnalytics = {
  hasOutcomeData: boolean;
  totalOutcomes: number;
  verifiedOutcomes: number;
  byType: Array<{ type: string; label: string; count: number }>;
  positiveOutcomes: number;
  notSelected: number;
  withdrawn: number;
  hasFeedbackData: boolean;
  feedbackCount: number;
  feedbackAverages: {
    technicalSkills: number | null;
    communication: number | null;
    problemSolving: number | null;
    professionalism: number | null;
    roleReadiness: number | null;
  };
  hiringSkills: {
    hasData: boolean;
    skills: Array<{ name: string; studentCount: number }>;
  };
};

const OUTCOME_RATE_TYPES = [
  "INTERNSHIP_COMPLETED",
  "JOB_OFFER",
  "HIRED",
] as const;

/* ---------------------------------------------------------
   COLLEGE ANALYTICS EXTENSION (consumed by Phase 13)
   ---------------------------------------------------------
   Aggregated outcome/feedback metrics for the college's
   student scope — the same scope semantics as Phase 13
   (StudentProfile.college case-insensitive match; students
   with no college are in nobody's scope). Aggregated only:
   no individual student rows leave the server.
--------------------------------------------------------- */

export async function computeCollegeOutcomeAnalytics(
  scope: { college: { equals: string; mode: "insensitive" } },
): Promise<OutcomeEcosystemAnalytics> {
  const [outcomes, feedback] = await Promise.all([
    prisma.outcome.findMany({
      where: { student: scope },
      select: { type: true, status: true },
    }),
    prisma.employerFeedback.findMany({
      where: { student: scope },
      select: {
        technicalSkillsRating: true,
        communicationRating: true,
        problemSolvingRating: true,
        professionalismRating: true,
        roleReadinessRating: true,
      },
    }),
  ]);

  const byType = Object.keys(OUTCOME_LABELS).map((type) => ({
    type,
    label: OUTCOME_LABELS[type] ?? type,
    count: outcomes.filter((o) => o.type === type).length,
  }));

  const positiveOutcomes = outcomes.filter((o) =>
    (OUTCOME_RATE_TYPES as readonly string[]).includes(o.type),
  ).length;

  const average = (values: Array<number | null>) => {
    const present = values.filter((v): v is number => v != null);
    return present.length > 0
      ? Math.round(
          (present.reduce((sum, v) => sum + v, 0) / present.length) * 10,
        ) / 10
      : null;
  };

  const feedbackAverages = {
    technicalSkills: average(feedback.map((f) => f.technicalSkillsRating)),
    communication: average(feedback.map((f) => f.communicationRating)),
    problemSolving: average(feedback.map((f) => f.problemSolvingRating)),
    professionalism: average(feedback.map((f) => f.professionalismRating)),
    roleReadiness: average(feedback.map((f) => f.roleReadinessRating)),
  };

  /* ---------- Top hiring skills ----------
     DEFINITION (documented per spec §17): for students with a
     VERIFIED HIRED or JOB_OFFER outcome, count each student's
     StudentSkill rows (the verified skill profile that
     supported the outcome). Ranked by distinct-student count.
     This is NOT "most frequent skill" — the population is
     exclusively students with verified positive outcomes. */
  const hiringSkillRows =
    positiveOutcomes > 0
      ? await prisma.studentSkill.findMany({
          where: {
            student: {
              college: scope.college,
              outcomes: {
                some: {
                  type: { in: ["HIRED", "JOB_OFFER"] },
                  status: "VERIFIED",
                },
              },
            },
          },
          select: { skill: { select: { name: true } }, studentId: true },
        })
      : [];

  const hiringSkillMap = new Map<string, Set<string>>();
  for (const row of hiringSkillRows) {
    const set = hiringSkillMap.get(row.skill.name) ?? new Set<string>();
    set.add(row.studentId);
    hiringSkillMap.set(row.skill.name, set);
  }

  const hiringSkills = [...hiringSkillMap.entries()]
    .map(([name, students]) => ({ name, studentCount: students.size }))
    .sort(
      (a, b) =>
        b.studentCount - a.studentCount || a.name.localeCompare(b.name),
    )
    .slice(0, 8);

  return {
    hasOutcomeData: outcomes.length > 0,
    totalOutcomes: outcomes.length,
    verifiedOutcomes: outcomes.filter((o) => o.status === "VERIFIED").length,
    byType,
    positiveOutcomes,
    notSelected: byType.find((t) => t.type === "NOT_SELECTED")?.count ?? 0,
    withdrawn: byType.find((t) => t.type === "WITHDRAWN")?.count ?? 0,
    hasFeedbackData: feedback.length > 0,
    feedbackCount: feedback.length,
    feedbackAverages,
    hiringSkills: {
      hasData: hiringSkills.length > 0,
      skills: hiringSkills,
    },
  };
}

/* ---------------------------------------------------------
   FACULTY EXTENSION (consumed by Phase 14 detail page)
   ---------------------------------------------------------
   Authorized faculty may see outcome/progress facts for
   students in their college scope — outcome records only.
   Employer-writtenFeedback is PRIVATE employer information
   and is deliberately excluded.
--------------------------------------------------------- */

export type FacultyOutcomeRow = {
  type: string;
  typeLabel: string;
  status: string;
  occurredAt: string;
  companyName: string;
  internshipRole: string | null;
};

export async function computeFacultyStudentOutcomes(
  studentId: string,
): Promise<FacultyOutcomeRow[]> {
  const outcomes = await prisma.outcome.findMany({
    where: { studentId },
    orderBy: { occurredAt: "desc" },
    select: {
      type: true,
      status: true,
      occurredAt: true,
      company: { select: { name: true } },
      internship: { select: { role: true } },
    },
  });

  return outcomes.map((outcome) => ({
    type: outcome.type,
    typeLabel: OUTCOME_LABELS[outcome.type] ?? outcome.type,
    status: outcome.status,
    occurredAt: outcome.occurredAt.toISOString(),
    companyName: outcome.company.name,
    internshipRole: outcome.internship?.role ?? null,
  }));
}
