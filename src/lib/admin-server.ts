import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/server/db.server";
import { getCurrentSessionUser } from "@/server/auth-context";

/* =========================================================
   PLATFORM ADMIN STATS (real counts only)
   ---------------------------------------------------------
   The /admin/dashboard route previously rendered hardcoded
   marketing numbers ("120K learners", "450 partner
   colleges", "1,200 hiring partners"). Every value below is
   now a real Prisma count over the PostgreSQL database.
   Zeros are real zeros, displayed honestly. Access is
   restricted to the authenticated ADMIN role.
   ========================================================= */

export type PlatformAdminStats = {
  students: number;
  companies: number;
  colleges: number;
  internships: number;
  activeInternships: number;
  applications: number;
  verifiedSkills: number;
  projectSubmissions: number;
  assessmentAttempts: number;
  outcomes: number;
  employerFeedback: number;
};

export const getPlatformAdminStats = createServerFn({
  method: "GET",
}).handler(async (): Promise<PlatformAdminStats | null> => {
  const sessionUser = await getCurrentSessionUser();

  if (!sessionUser || sessionUser.role !== "admin") {
    return null;
  }

  const [
    students,
    companies,
    colleges,
    internships,
    activeInternships,
    applications,
    allSkills,
    projectSubmissions,
    assessmentAttempts,
    outcomes,
    employerFeedback,
  ] = await Promise.all([
    prisma.studentProfile.count(),
    prisma.company.count(),
    prisma.college.count(),
    prisma.internship.count(),
    prisma.internship.count({ where: { status: "ACTIVE" } }),
    prisma.application.count(),
    prisma.studentSkill.findMany({
      select: { verificationLevel: true },
    }),
    prisma.projectSubmission.count(),
    prisma.assessmentAttempt.count(),
    prisma.outcome.count(),
    prisma.employerFeedback.count(),
  ]);

  return {
    students,
    companies,
    colleges,
    internships,
    activeInternships,
    applications,
    verifiedSkills: allSkills.filter(
      (row) => row.verificationLevel !== "RESUME_DETECTED",
    ).length,
    projectSubmissions,
    assessmentAttempts,
    outcomes,
    employerFeedback,
  };
});
