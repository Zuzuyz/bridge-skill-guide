import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "@/server/db.server";
import { getCurrentSessionUser } from "@/server/auth-context";
import { loadStudentRoadmap } from "@/lib/roadmap-core.server";
import {
  computeFacultyStudentOutcomes,
  type FacultyOutcomeRow,
} from "@/lib/outcome-core.server";

/* =========================================================
   PHASE 14 — FACULTY PORTAL (SERVER-ONLY)
   ---------------------------------------------------------
   Reused engines (no duplicated formulas):
   - authorization: the existing session primitive
     (getCurrentSessionUser) + the Company/College
     1:1 profile resolution pattern (employer-server,
     college-analytics-server)
   - readiness: the persisted StudentProfile.readiness
     column, written exclusively by the existing
     calculateStudentReadiness engine
   - skill gaps: the SkillGap table, populated
     exclusively by the Phase 7 engine
     computeCareerSkillGap
   - roadmap: loadStudentRoadmap, the existing Phase 8
     loader (roadmap-core.server.ts) — single source of
     truth, not recreated
   ========================================================= */

/* ---------------------------------------------------------
   SESSION-DERIVED FACULTY RESOLUTION (authorization core)

   Faculty identity is ALWAYS derived from the HttpOnly
   session — a browser-supplied studentId/collegeId/facultyId
   is never trusted. A faculty member is a User with the
   FACULTY role and a 1:1 FacultyProfile (mirrors the
   Company/College pattern). Their scope is DIRECT ASSIGNMENT:
   only students whose StudentProfile.facultyId equals this
   FacultyProfile id. Students are assigned exclusively by
   the student's own College admin (college-admin-server.ts);
   a faculty member can never assign themselves students and
   no student is visible merely for sharing a college.
--------------------------------------------------------- */

type FacultyResolution =
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "no-faculty-profile" }
  | {
      status: "ok";
      faculty: {
        id: string;
        name: string;
        title: string | null;
        department: string | null;
        collegeId: string | null;
        collegeName: string | null;
      };
      scope: { facultyId: string };
    };

async function resolveFacultyForSession(): Promise<FacultyResolution> {
  const sessionUser = await getCurrentSessionUser();

  if (!sessionUser) {
    return { status: "unauthenticated" };
  }

  if (sessionUser.role !== "faculty") {
    return { status: "forbidden" };
  }

  const facultyProfile = await prisma.facultyProfile.findUnique({
    where: { userId: sessionUser.id },
    include: { college: { select: { name: true } } },
  });

  if (!facultyProfile) {
    return { status: "no-faculty-profile" };
  }

  // Direct-assignment scope: only students explicitly assigned
  // to this faculty profile. No college-name fallback — a
  // faculty member with zero assignments sees zero students.
  return {
    status: "ok",
    faculty: {
      id: facultyProfile.id,
      name: sessionUser.name,
      title: facultyProfile.title,
      department: facultyProfile.department,
      collegeId: facultyProfile.collegeId,
      collegeName: facultyProfile.college?.name ?? null,
    },
    scope: { facultyId: facultyProfile.id },
  };
}

/* ---------------------------------------------------------
   FACULTY DASHBOARD
--------------------------------------------------------- */

export type FacultyDashboardData = {
  students: number;
  studentsWithGaps: number;
  averageReadiness: number | null;
  computedReadinessCount: number;
  projectsInFlight: number;
  internshipParticipants: number;
  pendingSupportNeeds: number;
  assessmentAttempts: number;
  hasAnyStudentData: boolean;
};

export const getFacultyDashboard = createServerFn({
  method: "GET",
}).handler(async (): Promise<
  { status: "ok"; faculty: FacultyResolutionOkFaculty; data: FacultyDashboardData } | FacultyFailure
> => {
  const resolution = await resolveFacultyForSession();

  if (resolution.status !== "ok") {
    return resolution;
  }

  const scope = resolution.scope;

  const [
    students,
    studentsWithGaps,
    readinessRows,
    projectsInFlight,
    internshipParticipants,
    assessmentAttempts,
  ] = await Promise.all([
    prisma.studentProfile.count({ where: scope }),
    prisma.studentProfile.count({
      where: {
        ...scope,
        skillGaps: { some: { status: { not: "STRONG" } } },
      },
    }),
    prisma.studentProfile.findMany({
      where: scope,
      select: { readiness: true },
    }),
    prisma.projectSubmission.count({
      where: {
        student: scope,
        status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
      },
    }),
    prisma.application.findMany({
      where: { student: { studentProfile: scope } },
      select: { studentId: true },
    }),
    prisma.assessmentAttempt.count({ where: { student: scope } }),
  ]);

  const withReadiness = readinessRows.filter((r) => r.readiness > 0);

  const data: FacultyDashboardData = {
    students,
    studentsWithGaps,
    averageReadiness:
      withReadiness.length > 0
        ? Math.round(
            withReadiness.reduce((sum, r) => sum + r.readiness, 0) /
              withReadiness.length,
          )
        : null,
    computedReadinessCount: withReadiness.length,
    projectsInFlight,
    internshipParticipants: new Set(
      internshipParticipants.map((a) => a.studentId),
    ).size,
    pendingSupportNeeds:
      studentsWithGaps + projectsInFlight,
    assessmentAttempts,
    hasAnyStudentData: students > 0,
  };

  return {
    status: "ok",
    faculty: resolution.faculty,
    data,
  };
});

/* ---------------------------------------------------------
   MY STUDENTS
--------------------------------------------------------- */

export type FacultyStudentSummary = {
  id: string;
  name: string;
  college: string | null;
  readiness: number | null;
  primaryCareer: string | null;
  gapCount: number;
  projectCount: number;
  internshipApplications: number;
  assessmentAttempts: number;
};

export const getFacultyStudents = createServerFn({
  method: "GET",
}).handler(async (): Promise<
  { status: "ok"; faculty: FacultyResolutionOkFaculty; students: FacultyStudentSummary[] } | FacultyFailure
> => {
  const resolution = await resolveFacultyForSession();

  if (resolution.status !== "ok") {
    return resolution;
  }

  const profiles = await prisma.studentProfile.findMany({
    where: resolution.scope,
    orderBy: [{ readiness: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      college: true,
      readiness: true,
      user: { select: { name: true } },
      skills: { select: { id: true } },
      skillGaps: { where: { status: { not: "STRONG" } }, select: { id: true } },
      projectSubmissions: { select: { id: true } },
      studentCareers: {
        where: { isPrimary: true },
        include: { career: { select: { title: true } } },
        take: 1,
      },
      _count: { select: { assessmentAttempts: true } },
    },
  });

  const applicationRows = await prisma.application.findMany({
    where: { student: { studentProfile: resolution.scope } },
    select: { studentId: true },
  });

  const applicationsByStudent = new Map<string, number>();
  for (const row of applicationRows) {
    applicationsByStudent.set(
      row.studentId,
      (applicationsByStudent.get(row.studentId) ?? 0) + 1,
    );
  }

  return {
    status: "ok",
    faculty: resolution.faculty,
    students: profiles.map((profile) => ({
      id: profile.id,
      name: profile.user.name,
      college: profile.college,
      readiness: profile.readiness > 0 ? profile.readiness : null,
      primaryCareer: profile.studentCareers[0]?.career.title ?? null,
      gapCount: profile.skillGaps.length,
      projectCount: profile.projectSubmissions.length,
      internshipApplications: applicationsByStudent.get(profile.id) ?? 0,
      assessmentAttempts: profile._count.assessmentAttempts,
    })),
  };
});

/* ---------------------------------------------------------
   SHARED STUDENT-SCOPED AUTHORIZATION
   ---------------------------------------------------------
   The single funnel every student-detail read and every
   intervention mutation passes through: resolve the student
   by id ONLY if it is assigned to this faculty, so a
   tampered/unknown id returns not_found and never leaks
   whether an unrelated student exists.
--------------------------------------------------------- */

type FacultyFailure =
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "no-faculty-profile" };

type FacultyResolutionOkFaculty = {
  id: string;
  name: string;
  title: string | null;
  department: string | null;
  collegeId: string | null;
  collegeName: string | null;
};

export type FacultyStatus = FacultyFailure["status"];

async function resolveAuthorizedStudent(
  faculty: { id: string; collegeName: string | null },
  studentProfileId: string,
) {
  return prisma.studentProfile.findFirst({
    where: {
      id: studentProfileId,
      facultyId: faculty.id,
    },
    select: { id: true },
  });
}

/* ---------------------------------------------------------
   STUDENT DETAIL
--------------------------------------------------------- */

const ROADMAP_STATUS_LABELS: Record<string, string> = {
  COMPLETE: "Completed",
  CURRENT: "In progress",
  UPCOMING: "Upcoming",
};

export type FacultyStudentDetail = {
  id: string;
  name: string;
  college: string | null;
  readiness: number | null;
  careers: Array<{ title: string; isPrimary: boolean }>;
  skills: Array<{
    name: string;
    score: number;
    verificationLevel: string;
  }>;
  skillGaps: Array<{
    name: string;
    status: string;
    score: number;
  }>;
  assessments: Array<{
    title: string;
    category: string;
    percentage: number;
    passed: boolean;
    attemptNumber: number;
    completedAt: string | null;
  }>;
  projects: Array<{
    id: string;
    title: string;
    status: string;
    skillName: string;
    submittedAt: string;
    score: number | null;
  }>;
  internships: Array<{
    id: string;
    role: string;
    company: string;
    status: string;
    appliedAt: string;
  }>;
  roadmap: {
    hasRoadmap: boolean;
    careerTitle: string | null;
    items: Array<{
      step: number;
      skill: string;
      status: string;
      statusLabel: string;
      activityType: string | null;
      priority: number | null;
    }>;
  };
  /* Phase 15 — outcome records for this student (authorized
     scope only). Employer-writtenFeedback is private employer
     information and is deliberately excluded. */
  outcomes: FacultyOutcomeRow[];
  notes: Array<{
    id: string;
    note: string;
    createdAt: string;
  }>;
};

export const getFacultyStudent = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z.object({ studentProfileId: z.string().cuid() }).parse(input),
  )
  .handler(async ({ data }): Promise<
    | { status: "ok"; faculty: FacultyResolutionOkFaculty; student: FacultyStudentDetail }
    | { status: "not_found" }
    | FacultyFailure
  > => {
    const resolution = await resolveFacultyForSession();

    if (resolution.status !== "ok") {
      return resolution;
    }

    const student = await resolveAuthorizedStudent(
      resolution.faculty,
      data.studentProfileId,
    );

    if (!student) {
      return { status: "not_found" };
    }

    const [
      profile,
      applicationRows,
      roadmap,
      outcomes,
    ] = await Promise.all([
      prisma.studentProfile.findUnique({
        where: { id: data.studentProfileId },
        select: {
          id: true,
          college: true,
          readiness: true,
          user: { select: { name: true } },
          studentCareers: {
            include: { career: { select: { title: true } } },
            orderBy: { isPrimary: "desc" },
          },
          skills: {
            orderBy: { score: "desc" },
            select: {
              score: true,
              verificationLevel: true,
              skill: { select: { name: true } },
            },
          },
          skillGaps: {
            where: { status: { not: "STRONG" } },
            select: { status: true, score: true, skill: { select: { name: true } } },
          },
          assessmentAttempts: {
            orderBy: { startedAt: "desc" },
            take: 10,
            select: {
              percentage: true,
              passed: true,
              attemptNumber: true,
              completedAt: true,
              assessment: { select: { title: true, category: true } },
            },
          },
          projectSubmissions: {
            orderBy: { submittedAt: "desc" },
            select: {
              id: true,
              title: true,
              status: true,
              skillName: true,
              submittedAt: true,
              score: true,
            },
          },
        },
      }),
      prisma.application.findMany({
        where: { studentId: student.id },
        orderBy: { appliedAt: "desc" },
        select: {
          id: true,
          status: true,
          appliedAt: true,
          student: {
            select: {
              name: true,
              studentProfile: { select: { id: true } },
            },
          },
          internship: {
            select: { role: true, company: { select: { name: true } } },
          },
        },
      }),
      loadStudentRoadmap(student.id),
      computeFacultyStudentOutcomes(student.id),
    ]);

    if (!profile) {
      return { status: "not_found" };
    }

    const notes = await prisma.facultyNote.findMany({
      where: {
        facultyId: resolution.faculty.id,
        studentId: student.id,
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, note: true, createdAt: true },
    });

    return {
      status: "ok",
      faculty: resolution.faculty,
      student: {
        id: profile.id,
        name: profile.user.name,
        college: profile.college,
        readiness: profile.readiness > 0 ? profile.readiness : null,
        careers: profile.studentCareers.map((sc) => ({
          title: sc.career.title,
          isPrimary: sc.isPrimary,
        })),
        skills: profile.skills.map((s) => ({
          name: s.skill.name,
          score: s.score,
          verificationLevel: s.verificationLevel,
        })),
        skillGaps: profile.skillGaps.map((g) => ({
          name: g.skill.name,
          status: g.status,
          score: g.score,
        })),
        assessments: profile.assessmentAttempts.map((a) => ({
          title: a.assessment.title,
          category: a.assessment.category,
          percentage: a.percentage,
          passed: a.passed,
          attemptNumber: a.attemptNumber,
          completedAt: a.completedAt ? a.completedAt.toISOString() : null,
        })),
        projects: profile.projectSubmissions.map((p) => ({
          id: p.id,
          title: p.title,
          status: p.status,
          skillName: p.skillName,
          submittedAt: p.submittedAt.toISOString(),
          score: p.score,
        })),
        internships: applicationRows.map((a) => ({
          id: a.id,
          role: a.internship.role,
          company: a.internship.company.name,
          status: a.status,
          appliedAt: a.appliedAt.toISOString(),
        })),
        roadmap: roadmap
          ? {
              hasRoadmap: true,
              careerTitle: roadmap.careerTitle,
              items: roadmap.roadmap.map((item) => ({
                step: item.step,
                skill: item.skill,
                status: item.status,
                statusLabel: ROADMAP_STATUS_LABELS[item.status] ?? item.status,
                activityType: item.activityType,
                priority: item.priority,
              })),
            }
          : {
              hasRoadmap: false,
              careerTitle: null,
              items: [],
            },
        notes: notes.map((n) => ({
          id: n.id,
          note: n.note,
          createdAt: n.createdAt.toISOString(),
        })),
        outcomes,
      },
    };
  });

/* ---------------------------------------------------------
   AGGREGATED SKILL GAPS (Phase 7 SkillGap, scoped)
--------------------------------------------------------- */

export type FacultySkillGapSummary = {
  studentName: string;
  studentProfileId: string;
  primaryCareer: string | null;
  skill: string;
  status: string;
  score: number;
};

export const getFacultySkillGaps = createServerFn({
  method: "GET",
}).handler(async (): Promise<
  { status: "ok"; faculty: FacultyResolutionOkFaculty; gaps: FacultySkillGapSummary[] } | FacultyFailure
> => {
  const resolution = await resolveFacultyForSession();

  if (resolution.status !== "ok") {
    return resolution;
  }

  const gapRows = await prisma.skillGap.findMany({
    where: {
      student: resolution.scope,
      status: { not: "STRONG" },
    },
    orderBy: [{ score: "asc" }, { skill: { name: "asc" } }],
    select: {
      status: true,
      score: true,
      skill: { select: { name: true } },
      student: {
        select: {
          id: true,
          user: { select: { name: true } },
          studentCareers: {
            where: { isPrimary: true },
            include: { career: { select: { title: true } } },
            take: 1,
          },
        },
      },
    },
  });

  return {
    status: "ok",
    faculty: resolution.faculty,
    gaps: gapRows.map((gap) => ({
      studentName: gap.student.user.name,
      studentProfileId: gap.student.id,
      primaryCareer:
        gap.student.studentCareers[0]?.career.title ?? null,
      skill: gap.skill.name,
      status: gap.status,
      score: gap.score,
    })),
  };
});

/* ---------------------------------------------------------
   CAREER READINESS (persisted engine output only)
--------------------------------------------------------- */

export type FacultyReadinessRow = {
  studentProfileId: string;
  studentName: string;
  primaryCareer: string | null;
  readiness: number;
};

export const getFacultyReadiness = createServerFn({
  method: "GET",
}).handler(async (): Promise<
  { status: "ok"; faculty: FacultyResolutionOkFaculty; rows: FacultyReadinessRow[] } | FacultyFailure
> => {
  const resolution = await resolveFacultyForSession();

  if (resolution.status !== "ok") {
    return resolution;
  }

  const profiles = await prisma.studentProfile.findMany({
    where: {
      ...resolution.scope,
      readiness: { gt: 0 },
    },
    orderBy: { readiness: "desc" },
    select: {
      id: true,
      readiness: true,
      user: { select: { name: true } },
      studentCareers: {
        where: { isPrimary: true },
        include: { career: { select: { title: true } } },
        take: 1,
      },
    },
  });

  return {
    status: "ok",
    faculty: resolution.faculty,
    rows: profiles.map((profile) => ({
      studentProfileId: profile.id,
      studentName: profile.user.name,
      primaryCareer: profile.studentCareers[0]?.career.title ?? null,
      readiness: profile.readiness,
    })),
  };
});

/* ---------------------------------------------------------
   PROJECTS (existing ProjectSubmission data)
--------------------------------------------------------- */

export const getFacultyProjects = createServerFn({
  method: "GET",
}).handler(async (): Promise<
  { status: "ok"; faculty: FacultyResolutionOkFaculty; projects: Array<{
    id: string;
    title: string;
    studentName: string;
    studentProfileId: string;
    status: string;
    skillName: string;
    submittedAt: string;
    score: number | null;
  }> } | FacultyFailure
> => {
  const resolution = await resolveFacultyForSession();

  if (resolution.status !== "ok") {
    return resolution;
  }

  const projects = await prisma.projectSubmission.findMany({
    where: { student: resolution.scope },
    orderBy: { submittedAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      skillName: true,
      submittedAt: true,
      score: true,
      student: {
        select: { id: true, user: { select: { name: true } } },
      },
    },
  });

  return {
    status: "ok",
    faculty: resolution.faculty,
    projects: projects.map((project) => ({
      id: project.id,
      title: project.title,
      studentName: project.student.user.name,
      studentProfileId: project.student.id,
      status: project.status,
      skillName: project.skillName,
      submittedAt: project.submittedAt.toISOString(),
      score: project.score,
    })),
  };
});

/* ---------------------------------------------------------
   ASSESSMENTS (existing AssessmentAttempt data)
--------------------------------------------------------- */

export const getFacultyAssessments = createServerFn({
  method: "GET",
}).handler(async (): Promise<
  { status: "ok"; faculty: FacultyResolutionOkFaculty; attempts: Array<{
    id: string;
    studentName: string;
    studentProfileId: string;
    title: string;
    category: string;
    percentage: number;
    passed: boolean;
    attemptNumber: number;
    completedAt: string | null;
  }> } | FacultyFailure
> => {
  const resolution = await resolveFacultyForSession();

  if (resolution.status !== "ok") {
    return resolution;
  }

  const attempts = await prisma.assessmentAttempt.findMany({
    where: { student: resolution.scope },
    orderBy: { startedAt: "desc" },
    take: 100,
    select: {
      id: true,
      percentage: true,
      passed: true,
      attemptNumber: true,
      completedAt: true,
      student: { select: { user: { select: { name: true } }, id: true } },
      assessment: { select: { title: true, category: true } },
    },
  });

  return {
    status: "ok",
    faculty: resolution.faculty,
    attempts: attempts.map((attempt) => ({
      id: attempt.id,
      studentName: attempt.student.user.name,
      studentProfileId: attempt.student.id,
      title: attempt.assessment.title,
      category: attempt.assessment.category,
      percentage: attempt.percentage,
      passed: attempt.passed,
      attemptNumber: attempt.attemptNumber,
      completedAt: attempt.completedAt ? attempt.completedAt.toISOString() : null,
    })),
  };
});

/* ---------------------------------------------------------
   INTERNSHIPS (existing Application data)
--------------------------------------------------------- */

export const getFacultyInternships = createServerFn({
  method: "GET",
}).handler(async (): Promise<
  { status: "ok"; faculty: FacultyResolutionOkFaculty; applications: Array<{
    id: string;
    studentName: string;
    studentProfileId: string | null;
    role: string;
    company: string;
    status: string;
    appliedAt: string;
  }> } | FacultyFailure
> => {
  const resolution = await resolveFacultyForSession();

  if (resolution.status !== "ok") {
    return resolution;
  }

  const applications = await prisma.application.findMany({
    where: { student: { studentProfile: resolution.scope } },
    orderBy: { appliedAt: "desc" },
    select: {
      id: true,
      status: true,
      appliedAt: true,
      student: {
        select: {
          name: true,
          studentProfile: { select: { id: true } },
        },
      },
      internship: {
        select: { role: true, company: { select: { name: true } } },
      },
    },
  });

  return {
    status: "ok",
    faculty: resolution.faculty,
    applications: applications.map((application) => ({
      id: application.id,
      studentName: application.student.name,
      studentProfileId: application.student.studentProfile?.id ?? null,
      role: application.internship.role,
      company: application.internship.company.name,
      status: application.status,
      appliedAt: application.appliedAt.toISOString(),
    })),
  };
});

/* ---------------------------------------------------------
   INTERVENTIONS — LEARNING RESOURCE RECOMMENDATIONS
   ---------------------------------------------------------
   Reuses the existing entities: an existing IndustryProgram
   row plus the student's existing LearningEnrollment
   (the same model the student-facing skill-development flow
   uses). No fake resources, no second recommendation table.
--------------------------------------------------------- */

export const getFacultyInterventions = createServerFn({
  method: "GET",
}).handler(async (): Promise<
  | {
      status: "ok";
      faculty: FacultyResolutionOkFaculty;
      students: Array<{ id: string; name: string }>;
      programs: Array<{
        id: string;
        title: string;
        company: string;
        skills: string[];
      }>;
    }
  | FacultyFailure
> => {
  const resolution = await resolveFacultyForSession();

  if (resolution.status !== "ok") {
    return resolution;
  }

  const [students, programs] = await Promise.all([
    prisma.studentProfile.findMany({
      where: resolution.scope,
      orderBy: { user: { name: "asc" } },
      select: { id: true, user: { select: { name: true } } },
    }),
    prisma.industryProgram.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, title: true, company: true, skills: true },
    }),
  ]);

  return {
    status: "ok",
    faculty: resolution.faculty,
    students: students.map((s) => ({ id: s.id, name: s.user.name })),
    programs: programs.map((p) => ({
      id: p.id,
      title: p.title,
      company: p.company,
      skills: p.skills,
    })),
  };
});

const recommendSchema = z.object({
  studentProfileId: z.string().cuid(),
  programId: z.string().cuid(),
});

/**
 * Recommends an EXISTING IndustryProgram to an authorized
 * student by upserting the student's EXISTING
 * LearningEnrollment row — the same model the student's own
 * skill-development enrollment flow writes. The student must
 * resolve inside the faculty's college scope or nothing is
 * written (a tampered id is refused, never auto-created).
 */
export const recommendProgram = createServerFn({ method: "POST" })
  .validator((input: unknown) => recommendSchema.parse(input))
  .handler(
    async ({
      data,
    }): Promise<{ ok: true; enrollmentId: string; created: boolean }> => {
      const resolution = await resolveFacultyForSession();

      if (resolution.status !== "ok") {
        throw new Error(
          "You are not authorized to recommend programs as faculty.",
        );
      }

      const student = await resolveAuthorizedStudent(
        resolution.faculty,
        data.studentProfileId,
      );

      if (!student) {
        throw new Error(
          "Student not found in your authorized scope.",
        );
      }

      const program = await prisma.industryProgram.findUnique({
        where: { id: data.programId },
        select: { id: true },
      });

      if (!program) {
        throw new Error("Program not found.");
      }

      const enrollment = await prisma.learningEnrollment.upsert({
        where: {
          studentId_programId: {
            studentId: student.id,
            programId: program.id,
          },
        },
        update: { status: "ENROLLED" },
        create: {
          studentId: student.id,
          programId: program.id,
          status: "ENROLLED",
        },
      });

      return {
        ok: true,
        enrollmentId: enrollment.id,
        created: true,
      };
    },
  );

/* ---------------------------------------------------------
   INTERVENTIONS — FACULTY NOTES (faculty-private)
   ---------------------------------------------------------
   FacultyNote is written and read ONLY through this
   authorized funnel; the studentId must resolve inside the
   faculty's college scope. Notes are never exposed to the
   student-facing app (no student server function reads
   FacultyNote) and are never shared across faculty.
--------------------------------------------------------- */

const noteSchema = z.object({
  studentProfileId: z.string().cuid(),
  note: z.string().trim().min(1, "Note cannot be empty.").max(4000),
});

export const addFacultyNote = createServerFn({ method: "POST" })
  .validator((input: unknown) => noteSchema.parse(input))
  .handler(
    async ({ data }): Promise<{ ok: true; noteId: string }> => {
      const resolution = await resolveFacultyForSession();

      if (resolution.status !== "ok") {
        throw new Error("You are not authorized to add faculty notes.");
      }

      const student = await resolveAuthorizedStudent(
        resolution.faculty,
        data.studentProfileId,
      );

      if (!student) {
        throw new Error("Student not found in your authorized scope.");
      }

      const note = await prisma.facultyNote.create({
        data: {
          facultyId: resolution.faculty.id,
          studentId: student.id,
          note: data.note,
        },
        select: { id: true },
      });

      return { ok: true, noteId: note.id };
    },
  );

export const deleteFacultyNote = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ noteId: z.string().cuid() }).parse(input))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const resolution = await resolveFacultyForSession();

    if (resolution.status !== "ok") {
      throw new Error("You are not authorized to manage faculty notes.");
    }

    // Scoped delete: only the authoring faculty's own note,
    // for a student still inside their scope.
    const note = await prisma.facultyNote.findFirst({
      where: {
        id: data.noteId,
        facultyId: resolution.faculty.id,
        student: resolution.scope,
      },
      select: { id: true },
    });

    if (!note) {
      throw new Error("Note not found.");
    }

    await prisma.facultyNote.delete({ where: { id: note.id } });

    return { ok: true };
  });
