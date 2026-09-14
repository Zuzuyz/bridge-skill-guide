import { prisma } from "./db";

const internships = [
  {
    role: "AI/ML Intern",
    company: "HyperScale AI",
    industry: "Artificial Intelligence",
    location: "Bengaluru",
    mode: "HYBRID" as const,
    duration: "6 Months",
    stipend: "₹25,000",
    description:
      "Work on applied machine learning systems and production AI workflows.",
    verified: true,
    skills: ["Python", "SQL", "Machine Learning", "AWS"],
  },
  {
    role: "Data Science Intern",
    company: "Quantum Data Labs",
    industry: "Data Science",
    location: "Pune",
    mode: "REMOTE" as const,
    duration: "4 Months",
    stipend: "₹20,000",
    description:
      "Analyze real-world datasets and build data-driven machine learning solutions.",
    verified: true,
    skills: ["Python", "Pandas", "SQL"],
  },
  {
    role: "Cloud Engineering Intern",
    company: "OrbitStack",
    industry: "Cloud Computing",
    location: "Hyderabad",
    mode: "ON_SITE" as const,
    duration: "6 Months",
    stipend: "₹22,000",
    description:
      "Build cloud infrastructure and automation workflows using modern DevOps tools.",
    verified: true,
    skills: ["Python", "AWS", "SQL"],
  },
];

async function main() {
  /*
   * Create one demo company user for each company.
   */
  for (const item of internships) {
    const email = `${item.company
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}@skillbridge.demo`;

    const user = await prisma.user.upsert({
      where: {
        email,
      },
      update: {},
      create: {
        name: item.company,
        email,
        password: "demo-company-password",
        role: "COMPANY",
      },
    });

    const company = await prisma.company.upsert({
      where: {
        userId: user.id,
      },
      update: {
        name: item.company,
        industry: item.industry,
        verified: true,
      },
      create: {
        userId: user.id,
        name: item.company,
        industry: item.industry,
        verified: true,
      },
    });

    const existingInternship =
      await prisma.internship.findFirst({
        where: {
          companyId: company.id,
          role: item.role,
        },
      });

    const internship =
      existingInternship ??
      (await prisma.internship.create({
        data: {
          companyId: company.id,
          role: item.role,
          location: item.location,
          mode: item.mode,
          duration: item.duration,
          stipend: item.stipend,
          description: item.description,
          verified: item.verified,
        },
      }));

    for (const skillName of item.skills) {
      const skill = await prisma.skill.upsert({
        where: {
          name: skillName,
        },
        update: {},
        create: {
          name: skillName,
        },
      });

      await prisma.internshipSkill.upsert({
        where: {
          internshipId_skillId: {
            internshipId: internship.id,
            skillId: skill.id,
          },
        },
        update: {},
        create: {
          internshipId: internship.id,
          skillId: skill.id,
          required: true,
        },
      });
    }
  }

  console.log("Internship data seeded successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });