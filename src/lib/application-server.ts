import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/server/db.server";
import { getAuthenticatedStudentProfile } from "@/server/auth-context";

/* =========================================================
   GET MY APPLICATIONS
   ========================================================= */

/** Nested Application → Internship → Company contract consumed
    by ApplicationsPage (mirrors the real Prisma relations). */
export type MyApplicationRow = {
  id: string;
  status: string;
  appliedAt: string;
  updatedAt: string;
  internship: {
    id: string;
    role: string;
    location: string | null;
    mode: string;
    stipend: string | null;
    company: {
      id: string;
      name: string;
    };
  };
};

export const getMyApplications = createServerFn({
  method: "GET",
}).handler(async (): Promise<MyApplicationRow[]> => {
  const student = await getAuthenticatedStudentProfile();

  if (!student) {
    throw new Error("No student profile found.");
  }

  const applications = await prisma.application.findMany({
    where: {
      studentId: student.userId,
    },
    orderBy: {
      appliedAt: "desc",
    },
    include: {
      internship: {
        include: {
          company: true,
        },
      },
    },
  });

  /* Nested contract consumed by ApplicationsPage:
     Application → Internship → Company. The query above already
     includes these relations; the previous mapping flattened them
     (top-level role/company), so the page crashed reading
     app.internship.role. The shape now mirrors the real
     relations — no fake data, and the payload contains only this
     student's own applications (scoped by the authenticated
     session above). */
  return applications.map((application) => ({
    id: application.id,
    status: application.status,
    appliedAt: application.appliedAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
    internship: {
      id: application.internship.id,
      role: application.internship.role,
      location: application.internship.location,
      mode: application.internship.mode,
      stipend: application.internship.stipend,
      company: {
        id: application.internship.company.id,
        name: application.internship.company.name,
      },
    },
  }));
});

/* =========================================================
   APPLY TO INTERNSHIP
   ========================================================= */

export const applyToInternship = createServerFn({
  method: "POST",
})
  .validator((internshipId: string) => internshipId)
  .handler(async ({ data: internshipId }) => {
    const student = await getAuthenticatedStudentProfile();

    if (!student) {
      throw new Error(
        "No student profile found. Please register a student account first.",
      );
    }

    /* -------------------------------------------------------
       Check internship
       ------------------------------------------------------- */

    const internship = await prisma.internship.findUnique({
      where: {
        id: internshipId,
      },
    });

    if (!internship) {
      throw new Error("Internship not found.");
    }

    /* -------------------------------------------------------
       Check duplicate application
       ------------------------------------------------------- */

    const existingApplication = await prisma.application.findUnique({
      where: {
        studentId_internshipId: {
          studentId: student.userId,
          internshipId,
        },
      },
    });

    if (existingApplication) {
      return {
        id: existingApplication.id,
        status: existingApplication.status,
        alreadyApplied: true,
      };
    }

    /* -------------------------------------------------------
       Create application
       ------------------------------------------------------- */

    const application = await prisma.application.create({
      data: {
        studentId: student.userId,
        internshipId,
        status: "APPLIED",
      },
    });

    return {
      id: application.id,
      status: application.status,
      alreadyApplied: false,
    };
  });