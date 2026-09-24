import { prisma } from "@/server/db.server";
import {
  resolveCollegeForSession,
  studentScope,
  type CollegeResolution,
} from "@/lib/college-analytics-core.server";
/* =========================================================
   STUDENT–FACULTY ASSIGNMENT (SERVER-ONLY CORE)
   ---------------------------------------------------------
   The College Admin assigns students to faculty members.
   Reused engines (no second authorization system):
   - authorization: resolveCollegeForSession() — the same
     Phase 13 session-derived College resolution (HttpOnly
     cookie → role check → College row linked to the session
     user). No college id is ever accepted from the client.
   - student scope: studentScope() — the same college →
     student join key used by Phase 13 analytics.

   Validation guarantees (all server-side):
   - Faculty: must be a FacultyProfile whose collegeId equals
     the session college's id → a forged facultyProfileId for
     another college's faculty is rejected.
   - Student: must resolve inside the college's name scope →
     a forged studentProfileId for another college's student
     is rejected.
   - Faculty members can never assign themselves students and
     students can never change their own assignment: these
     functions are reachable only through the COLLEGE/admin
     role check inside resolveCollegeForSession().
   - Unassignment (facultyId = null) is always supported; an
     unassigned student keeps full portal access (no student
     server function requires an assignment).

   SERVER-ONLY (imports src/server/db.server). The
   client-safe wrapper college-admin-server.ts loads these
   functions via dynamic import inside createServerFn
   handlers — the same pattern as matching-server.ts /
   skill-gap-server.ts — so no src/server import ever
   reaches the client bundle.
   ========================================================= */

/* ---------------------------------------------------------
   FACULTY MEMBERS IN MY COLLEGE
--------------------------------------------------------- */

export type CollegeFacultyRow = {
  id: string;
  name: string;
  title: string | null;
  department: string | null;
  studentCount: number;
};

export type CollegeFacultyResult =
  | {
      status: "ok";
      college: { id: string; name: string };
      faculty: CollegeFacultyRow[];
    }
  | Exclude<CollegeResolution, { status: "ok" }>;

export async function getCollegeFacultyCore(): Promise<CollegeFacultyResult> {
  const resolution = await resolveCollegeForSession();

  if (resolution.status !== "ok") {
    return resolution;
  }

  const faculty = await prisma.facultyProfile.findMany({
    where: { collegeId: resolution.collegeId },
    orderBy: { user: { name: "asc" } },
    select: {
      id: true,
      title: true,
      department: true,
      user: { select: { name: true } },
      _count: { select: { students: true } },
    },
  });

  return {
    status: "ok",
    college: { id: resolution.collegeId, name: resolution.collegeName },
    faculty: faculty.map((row) => ({
      id: row.id,
      name: row.user.name,
      title: row.title,
      department: row.department,
      studentCount: row._count.students,
    })),
  };
}

/* ---------------------------------------------------------
   STUDENTS IN MY COLLEGE (+ their current assignment)
--------------------------------------------------------- */

export type CollegeStudentRow = {
  id: string;
  name: string;
  readiness: number | null;
  primaryCareer: string | null;
  assignedFaculty: { id: string; name: string } | null;
};

export type CollegeStudentsResult =
  | {
      status: "ok";
      college: { id: string; name: string };
      students: CollegeStudentRow[];
    }
  | Exclude<CollegeResolution, { status: "ok" }>;

export async function getCollegeStudentsCore(): Promise<CollegeStudentsResult> {
  const resolution = await resolveCollegeForSession();

  if (resolution.status !== "ok") {
    return resolution;
  }

  const profiles = await prisma.studentProfile.findMany({
    where: studentScope(resolution.collegeName),
    orderBy: { user: { name: "asc" } },
    select: {
      id: true,
      readiness: true,
      user: { select: { name: true } },
      faculty: { select: { id: true, user: { select: { name: true } } } },
      studentCareers: {
        where: { isPrimary: true },
        include: { career: { select: { title: true } } },
        take: 1,
      },
    },
  });

  return {
    status: "ok",
    college: { id: resolution.collegeId, name: resolution.collegeName },
    students: profiles.map((profile) => ({
      id: profile.id,
      name: profile.user.name,
      readiness: profile.readiness > 0 ? profile.readiness : null,
      primaryCareer: profile.studentCareers[0]?.career.title ?? null,
      assignedFaculty: profile.faculty
        ? { id: profile.faculty.id, name: profile.faculty.user.name }
        : null,
    })),
  };
}

/* ---------------------------------------------------------
   ASSIGN / UNASSIGN (mutations)
--------------------------------------------------------- */

export type AssignResult = { ok: true } | { ok: false; error: string };

function authFailureMessage(resolution: CollegeResolution): string {
  switch (resolution.status) {
    case "unauthenticated":
      return "Please log in with a college account to manage assignments.";
    case "forbidden":
      return "You are not authorized to manage student assignments.";
    default:
      return "College administration has not been provisioned for this account.";
  }
}

/**
 * Assigns a student of THIS college to a faculty member of
 * THIS college. Both entities must resolve inside the
 * session college's scope or nothing is written.
 */
export async function assignStudentCore(data: {
  studentProfileId: string;
  facultyProfileId: string;
}): Promise<AssignResult> {
  const resolution = await resolveCollegeForSession();

  if (resolution.status !== "ok") {
    return { ok: false, error: authFailureMessage(resolution) };
  }

  const faculty = await prisma.facultyProfile.findFirst({
    where: {
      id: data.facultyProfileId,
      collegeId: resolution.collegeId,
    },
    select: { id: true },
  });

  if (!faculty) {
    return { ok: false, error: "Faculty member not found in your college." };
  }

  const student = await prisma.studentProfile.findFirst({
    where: {
      id: data.studentProfileId,
      ...studentScope(resolution.collegeName),
    },
    select: { id: true },
  });

  if (!student) {
    return { ok: false, error: "Student not found in your college." };
  }

  await prisma.studentProfile.update({
    where: { id: student.id },
    data: { facultyId: faculty.id },
  });

  return { ok: true };
}

/**
 * Clears a student's faculty assignment (facultyId = null).
 * The student must resolve inside the session college's
 * scope; the student keeps full portal access unassigned.
 */
export async function unassignStudentCore(data: {
  studentProfileId: string;
}): Promise<AssignResult> {
  const resolution = await resolveCollegeForSession();

  if (resolution.status !== "ok") {
    return { ok: false, error: authFailureMessage(resolution) };
  }

  const student = await prisma.studentProfile.findFirst({
    where: {
      id: data.studentProfileId,
      ...studentScope(resolution.collegeName),
    },
    select: { id: true },
  });

  if (!student) {
    return { ok: false, error: "Student not found in your college." };
  }

  await prisma.studentProfile.update({
    where: { id: student.id },
    data: { facultyId: null },
  });

  return { ok: true };
}
