import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/server/db";
import { getAuthenticatedStudentProfile } from "@/server/auth-context";

/* =========================================================
   GET MY APPLICATIONS
   ========================================================= */

export const getMyApplications = createServerFn({
  method: "GET",
}).handler(async () => {
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

  return applications.map((application) => ({
    id: application.id,
    internshipId: application.internshipId,
    role: application.internship.role,
    company: application.internship.company.name,
    location: application.internship.location,
    mode: application.internship.mode,
    stipend: application.internship.stipend,
    status: application.status,
    appliedAt: application.appliedAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
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