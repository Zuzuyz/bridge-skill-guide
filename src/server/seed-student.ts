import { prisma } from "./db.server";

async function main() {
  const user = await prisma.user.findUnique({
    where: {
      email: "shreyasi@gmail.com",
    },
    include: {
      studentProfile: true,
    },
  });

  if (!user || !user.studentProfile) {
    throw new Error(
      "Student account not found. Register the test account first.",
    );
  }

  const skills = [
    { name: "Python", score: 92, confidence: 98, demand: "High" },
    { name: "SQL", score: 81, confidence: 96, demand: "High" },
    { name: "React", score: 74, confidence: 89, demand: "Growing" },
    { name: "Machine Learning", score: 58, confidence: 85, demand: "High" },
    { name: "AWS", score: 46, confidence: 76, demand: "Growing" },
  ];

  for (const item of skills) {
    const skill = await prisma.skill.upsert({
      where: {
        name: item.name,
      },
      update: {
        demand: item.demand,
      },
      create: {
        name: item.name,
        demand: item.demand,
      },
    });

    await prisma.studentSkill.upsert({
      where: {
        studentId_skillId: {
          studentId: user.studentProfile.id,
          skillId: skill.id,
        },
      },
      update: {
        score: item.score,
        confidence: item.confidence,
      },
      create: {
        studentId: user.studentProfile.id,
        skillId: skill.id,
        score: item.score,
        confidence: item.confidence,
      },
    });
  }

  await prisma.studentProfile.update({
    where: {
      id: user.studentProfile.id,
    },
    data: {
      targetRole: "AI Engineer",
      readiness: 72,
    },
  });

  console.log("Student data seeded successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });