import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/server/db";

/* =========================================================
   GET ALL INTERNSHIPS
========================================================= */

export const getInternships = createServerFn({
  method: "GET",
}).handler(async () => {
  const internships = await prisma.internship.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      company: true,
      requiredSkills: {
        include: {
          skill: true,
        },
      },
    },
  });

  return internships.map((internship) => ({
    id: internship.id,
    role: internship.role,
    company: internship.company.name,
    location: internship.location ?? "Not specified",
    mode: internship.mode,
    duration: internship.duration ?? "Not specified",
    stipend: internship.stipend ?? "Not specified",
    description: internship.description ?? "",
    verified: internship.verified,

    skills: internship.requiredSkills.map(
      (item) => item.skill.name,
    ),
  }));
});

/* =========================================================
   GET SINGLE INTERNSHIP
========================================================= */

export const getInternshipById = createServerFn({
  method: "GET",
})
  .validator((id: string) => id)
  .handler(async ({ data }) => {
    console.log(
      "Loading internship with ID:",
      data,
    );

    const internship =
      await prisma.internship.findUnique({
        where: {
          id: data,
        },
        include: {
          company: true,
          requiredSkills: {
            include: {
              skill: true,
            },
          },
        },
      });

    if (!internship) {
      console.error(
        "Internship not found:",
        data,
      );

      throw new Error(
        "Internship not found.",
      );
    }

    console.log(
      "Internship found:",
      internship.role,
    );

    return {
      id: internship.id,
      role: internship.role,
      company: internship.company.name,
      location:
        internship.location ??
        "Not specified",
      mode: internship.mode,
      duration:
        internship.duration ??
        "Not specified",
      stipend:
        internship.stipend ??
        "Not specified",
      description:
        internship.description ??
        "",
      verified:
        internship.verified,

      skills:
        internship.requiredSkills.map(
          (item) =>
            item.skill.name,
        ),
    };
  });