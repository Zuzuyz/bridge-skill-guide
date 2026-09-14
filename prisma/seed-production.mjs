import { PrismaClient } from "@prisma/client";
import { seedCareers } from "./seed-careers.mjs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { ASSESSMENTS_CATALOG, CODING_ASSESSMENTS_CATALOG, SQL_ASSESSMENTS_CATALOG } = await import(
  "../src/server/assessment-data.ts"
);

const prisma = new PrismaClient();

async function seedAll() {
  console.log("=== [SkillBridge Production Seed] Starting Full DB Seed ===");

  // 1. Careers & Career Skills
  console.log("\n[1/4] Seeding Careers & CareerSkill linkages...");
  await seedCareers();

  // 2. Industry Demand (Phase 6A)
  console.log("\n[2/4] Seeding Industry Demand Data (Phase 6A)...");
  const careers = await prisma.career.findMany({
    include: {
      requiredSkills: {
        include: { skill: true },
      },
    },
  });

  let totalDemandRecords = 0;
  const now = new Date();
  const validUntil = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);

  for (const career of careers) {
    for (const reqSkill of career.requiredSkills) {
      const importance = reqSkill.importance;
      const skillName = reqSkill.skill.name.toLowerCase();

      let demandLevel = "STABLE";
      let demandScore = 70;

      if (importance === 5) {
        demandLevel = "HIGH";
        demandScore = Math.floor(Math.random() * 8) + 90;
      } else if (importance === 4) {
        demandLevel = "GROWING";
        demandScore = Math.floor(Math.random() * 8) + 80;
      } else if (importance === 3) {
        demandLevel = "GROWING";
        demandScore = Math.floor(Math.random() * 10) + 70;
      } else if (importance === 2) {
        if (skillName.includes("llm") || skillName.includes("langchain") || skillName.includes("vector")) {
          demandLevel = "EMERGING";
          demandScore = Math.floor(Math.random() * 10) + 60;
        } else {
          demandLevel = "STABLE";
          demandScore = Math.floor(Math.random() * 10) + 50;
        }
      } else {
        demandLevel = "STABLE";
        demandScore = Math.floor(Math.random() * 15) + 35;
      }

      await prisma.industryDemand.upsert({
        where: {
          careerId_skillId_sourceType: {
            careerId: career.id,
            skillId: reqSkill.skill.id,
            sourceType: "DEMO",
          },
        },
        create: {
          careerId: career.id,
          skillId: reqSkill.skill.id,
          demandLevel,
          demandScore,
          sourceType: "DEMO",
          sourceName: "SkillBridge Demo Industry Dataset",
          sourceUrl: null,
          collectedAt: now,
          validUntil,
          notes: `Seeded demand record for ${reqSkill.skill.name} in ${career.title} (Prototype dataset)`,
        },
        update: {
          demandLevel,
          demandScore,
          collectedAt: now,
          validUntil,
          notes: `Seeded demand record for ${reqSkill.skill.name} in ${career.title} (Prototype dataset)`,
        },
      });

      totalDemandRecords++;
    }
  }
  console.log(`✓ Seeded ${totalDemandRecords} IndustryDemand records across ${careers.length} careers.`);

  // 3. Assessments Catalog
  console.log("\n[3/4] Seeding Assessment Catalog...");
  const allAssessments = [
    ...(ASSESSMENTS_CATALOG || []).map((a) => ({ ...a, type: "MCQ" })),
    ...(CODING_ASSESSMENTS_CATALOG || []).map((a) => ({ ...a, type: "CODING" })),
    ...(SQL_ASSESSMENTS_CATALOG || []).map((a) => ({ ...a, type: "SQL" })),
  ];

  let assessmentsCount = 0;
  for (const item of allAssessments) {
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
    }

    let existingAssessment = await prisma.assessment.findUnique({
      where: { title: item.title },
    });

    if (!existingAssessment) {
      existingAssessment = await prisma.assessment.create({
        data: {
          title: item.title,
          skillName: item.skillName,
          skill: { connect: { id: skill.id } },
          category: item.category || "Technical",
          type: item.type || "MCQ",
          description: item.description,
          durationMinutes: item.durationMinutes,
          totalQuestions: item.totalQuestions || item.questions.length,
          passingScore: item.benchmarkScore || 70,
          language: "language" in item ? item.language : null,
          status: "PUBLISHED",
        },
      });
      assessmentsCount++;
    }

    const questionCount = await prisma.assessmentQuestion.count({
      where: { assessmentId: existingAssessment.id },
    });

    if (questionCount === 0) {
      for (let i = 0; i < item.questions.length; i++) {
        const q = item.questions[i];
        if (!q) continue;

        await prisma.assessmentQuestion.create({
          data: {
            assessmentId: existingAssessment.id,
            question: q.question,
            questionType: item.type || "MCQ",
            options: "options" in q ? q.options : [],
            correctAnswer: "correctAnswer" in q ? q.correctAnswer : 0,
            explanation: q.explanation || "",
            difficulty: q.difficulty || "MEDIUM",
            topic: q.topic || item.skillName,
            order: i,
            starterCode: "starterCode" in q ? q.starterCode : null,
            solutionCode: "solutionCode" in q ? q.solutionCode : null,
            language: "language" in item ? item.language : null,
            functionSignature: "functionSignature" in q ? q.functionSignature : null,
            constraints: "constraints" in q ? q.constraints : null,
            sampleInput: "sampleInput" in q ? q.sampleInput : null,
            sampleOutput: "sampleOutput" in q ? q.sampleOutput : null,
            dbSchema: "dbSchema" in q ? q.dbSchema : null,
            initialDbData: "initialDbData" in q ? q.initialDbData : null,
            testCases: "testCases" in q && q.testCases ? q.testCases : undefined,
          },
        });
      }
    }
  }
  console.log(`✓ Seeded/verified ${allAssessments.length} assessments and questions catalog.`);

  // 4. Verified Internships & Companies
  console.log("\n[4/4] Seeding Verified Internships...");
  const internshipsData = [
    {
      role: "AI/ML Intern",
      company: "HyperScale AI",
      industry: "Artificial Intelligence",
      location: "Bengaluru",
      mode: "HYBRID",
      duration: "6 Months",
      stipend: "₹25,000",
      description: "Work on applied machine learning systems and production AI workflows.",
      verified: true,
      skills: ["Python", "SQL", "Machine Learning", "AWS"],
    },
    {
      role: "Data Science Intern",
      company: "Quantum Data Labs",
      industry: "Data Science",
      location: "Pune",
      mode: "REMOTE",
      duration: "4 Months",
      stipend: "₹20,000",
      description: "Analyze real-world datasets and build data-driven machine learning solutions.",
      verified: true,
      skills: ["Python", "Pandas", "SQL"],
    },
    {
      role: "Cloud Engineering Intern",
      company: "OrbitStack",
      industry: "Cloud Computing",
      location: "Hyderabad",
      mode: "ON_SITE",
      duration: "6 Months",
      stipend: "₹22,000",
      description: "Build cloud infrastructure and automation workflows using modern DevOps tools.",
      verified: true,
      skills: ["AWS", "Docker", "Python"],
    },
    {
      role: "Full Stack Developer Intern",
      company: "Nexis Technologies",
      industry: "Software Engineering",
      location: "Bengaluru",
      mode: "HYBRID",
      duration: "6 Months",
      stipend: "₹24,000",
      description: "Build scalable web applications and REST APIs using modern full-stack technologies.",
      verified: true,
      skills: ["React", "Node.js", "SQL", "TypeScript"],
    },
    {
      role: "Cybersecurity Analyst Intern",
      company: "SecureGrid",
      industry: "Cybersecurity",
      location: "Delhi NCR",
      mode: "HYBRID",
      duration: "3 Months",
      stipend: "₹18,000",
      description: "Assist with vulnerability scans, log analysis, and threat intelligence.",
      verified: true,
      skills: ["Networking", "Linux", "Python"],
    },
  ];

  for (const item of internshipsData) {
    let companyUser = await prisma.user.findFirst({
      where: { email: `${item.company.toLowerCase().replace(/[^a-z0-9]/g, "")}@skillbridge-partner.test` },
    });

    if (!companyUser) {
      companyUser = await prisma.user.create({
        data: {
          name: item.company,
          email: `${item.company.toLowerCase().replace(/[^a-z0-9]/g, "")}@skillbridge-partner.test`,
          password: "demo_password_not_for_direct_login",
          role: "COMPANY",
          company: {
            create: {
              name: item.company,
              industry: item.industry,
              verified: item.verified,
            },
          },
        },
      });
    }

    const companyProfile = await prisma.company.findUnique({
      where: { userId: companyUser.id },
    });

    if (companyProfile) {
      let internship = await prisma.internship.findFirst({
        where: {
          companyId: companyProfile.id,
          role: item.role,
        },
      });

      if (!internship) {
        internship = await prisma.internship.create({
          data: {
            companyId: companyProfile.id,
            role: item.role,
            location: item.location,
            mode: item.mode,
            duration: item.duration,
            stipend: item.stipend,
            description: item.description,
            verified: item.verified,
          },
        });
      }

      // Link skills through requiredSkills (InternshipSkill relation)
      for (const skillName of item.skills) {
        const skill = await prisma.skill.upsert({
          where: { name: skillName },
          update: {},
          create: { name: skillName, demand: "High" },
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
  }
  console.log(`✓ Verified internships and companies seeded`);

  console.log("\n=== [SkillBridge Production Seed] Completed Successfully! ===");
}

seedAll()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
