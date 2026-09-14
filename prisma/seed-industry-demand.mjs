import { PrismaClient } from "@prisma/client";
import { seedCareers } from "./seed-careers.mjs";

const prisma = new PrismaClient();

// Seed Industry Demand mappings for Careers and Skills
export async function seedIndustryDemand() {
  console.log("------------------------------------------");
  console.log("Seeding Industry Demand Data (DEMO dataset)");
  console.log("------------------------------------------");

  // Ensure Careers and Skills are seeded first
  await seedCareers();

  // Fetch all careers with required skills
  const careers = await prisma.career.findMany({
    include: {
      requiredSkills: {
        include: { skill: true }
      }
    }
  });

  if (careers.length === 0) {
    console.warn("No careers found to seed industry demand for.");
    return;
  }

  let totalDemandRecordsCreated = 0;
  const now = new Date();
  const validUntil = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000); // 180 days validity

  // Benchmark demand templates based on skill importance
  for (const career of careers) {
    for (const reqSkill of career.requiredSkills) {
      const importance = reqSkill.importance; // 1-5
      const skillName = reqSkill.skill.name.toLowerCase();

      // Determine realistic demand level & score based on skill nature & importance
      let demandLevel = "STABLE";
      let demandScore = 65;

      if (importance === 5) { // Core skill
        if (
          skillName.includes("python") ||
          skillName.includes("machine learning") ||
          skillName.includes("javascript") ||
          skillName.includes("react") ||
          skillName.includes("sql") ||
          skillName.includes("aws") ||
          skillName.includes("kubernetes") ||
          skillName.includes("cloud security")
        ) {
          demandLevel = "HIGH";
          demandScore = Math.floor(Math.random() * 6) + 93; // 93-98
        } else {
          demandLevel = "HIGH";
          demandScore = Math.floor(Math.random() * 8) + 88; // 88-95
        }
      } else if (importance === 4) { // Very Important
        if (
          skillName.includes("docker") ||
          skillName.includes("fastapi") ||
          skillName.includes("typescript") ||
          skillName.includes("pandas") ||
          skillName.includes("scikit") ||
          skillName.includes("terraform") ||
          skillName.includes("figma")
        ) {
          demandLevel = "GROWING";
          demandScore = Math.floor(Math.random() * 8) + 80; // 80-87
        } else {
          demandLevel = "GROWING";
          demandScore = Math.floor(Math.random() * 8) + 72; // 72-79
        }
      } else if (importance === 3) { // Important
        demandLevel = "GROWING";
        demandScore = Math.floor(Math.random() * 10) + 70; // 70-79
      } else if (importance === 2) { // Useful
        if (skillName.includes("llm") || skillName.includes("langchain") || skillName.includes("vector")) {
          demandLevel = "EMERGING";
          demandScore = Math.floor(Math.random() * 10) + 60; // 60-69
        } else {
          demandLevel = "STABLE";
          demandScore = Math.floor(Math.random() * 10) + 50; // 50-59
        }
      } else { // Nice to Have (1)
        demandLevel = "STABLE";
        demandScore = Math.floor(Math.random() * 15) + 35; // 35-49
      }

      // Upsert demand record with sourceType: DEMO
      await prisma.industryDemand.upsert({
        where: {
          careerId_skillId_sourceType: {
            careerId: career.id,
            skillId: reqSkill.skill.id,
            sourceType: "DEMO"
          }
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
          notes: `Seeded demand record for ${reqSkill.skill.name} in ${career.title} (Prototype dataset)`
        },
        update: {
          demandLevel,
          demandScore,
          collectedAt: now,
          validUntil,
          notes: `Seeded demand record for ${reqSkill.skill.name} in ${career.title} (Prototype dataset)`
        }
      });

      totalDemandRecordsCreated++;
    }
  }

  console.log(`✅ Seeded ${totalDemandRecordsCreated} IndustryDemand records across ${careers.length} careers.`);
}

// Allow direct execution
if (process.argv[1]?.endsWith("seed-industry-demand.mjs")) {
  seedIndustryDemand()
    .catch((err) => {
      console.error("Failed to seed industry demand:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
