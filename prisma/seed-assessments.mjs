import { createRequire } from 'module';
const require = createRequire('/Users/shubhamsingh/Desktop/bridge-skill-guide/package.json');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { ASSESSMENTS_CATALOG } = await import('/Users/shubhamsingh/Desktop/bridge-skill-guide/src/server/assessment-data.ts');

async function seed() {
  console.log("Seeding assessments to PostgreSQL...");

  for (const item of ASSESSMENTS_CATALOG) {
    let skill = await prisma.skill.findFirst({
      where: { name: { equals: item.skillName, mode: "insensitive" } },
    });

    if (!skill) {
      skill = await prisma.skill.create({
        data: {
          name: item.skillName,
          demand: "High",
        },
      });
      console.log(`Created skill: ${item.skillName}`);
    }

    const existingAssessment = await prisma.assessment.findUnique({
      where: { title: item.title },
      include: { questions: true },
    });

    let assessmentId = existingAssessment?.id;

    if (!existingAssessment) {
      const created = await prisma.assessment.create({
        data: {
          title: item.title,
          skillName: item.skillName,
          skillId: skill.id,
          category: item.category,
          description: item.description,
          difficulty: item.benchmarkScore >= 80 ? "INTERMEDIATE" : "BEGINNER",
          passingScore: item.benchmarkScore,
          durationMinutes: item.durationMinutes,
          totalQuestions: item.questions.length,
          status: "PUBLISHED",
        },
      });
      assessmentId = created.id;
      console.log(`Created assessment: ${item.title}`);
    } else {
      // Update passing score and skillId if needed
      await prisma.assessment.update({
        where: { id: existingAssessment.id },
        data: {
          skillId: skill.id,
          passingScore: item.benchmarkScore,
          totalQuestions: item.questions.length,
        }
      });
    }

    // Seed questions
    const questionCount = await prisma.assessmentQuestion.count({
      where: { assessmentId },
    });

    if (questionCount === 0) {
      for (let i = 0; i < item.questions.length; i++) {
        const q = item.questions[i];
        if (!q) continue;
        await prisma.assessmentQuestion.create({
          data: {
            assessmentId,
            question: q.question,
            questionType: "MCQ",
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            points: 10,
            order: i + 1,
            difficulty: q.difficulty,
            topic: q.topic,
          },
        });
      }
      console.log(`Seeded ${item.questions.length} questions for: ${item.title}`);
    } else {
      console.log(`Assessment ${item.title} already has ${questionCount} questions.`);
    }
  }

  console.log("Assessment seeding completed successfully!");
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
