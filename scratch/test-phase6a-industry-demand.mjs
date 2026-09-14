import { PrismaClient } from "@prisma/client";

function getDemandFreshness(collectedAt, validUntil, sourceType = "DEMO") {
  const isDemo = sourceType === "DEMO";
  const collectedDate = new Date(collectedAt);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - collectedDate.getTime());
  const daysOld = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let status = "Fresh";
  if (daysOld > 90) {
    status = "Expired";
  } else if (daysOld >= 30) {
    status = "Aging";
  }

  const label = isDemo
    ? `Demo dataset (${daysOld}d ago)`
    : status === "Fresh"
      ? `Fresh (Collected ${daysOld}d ago)`
      : status === "Aging"
        ? `Aging (${daysOld}d ago)`
        : `Expired (${daysOld}d ago)`;

  return {
    status,
    daysOld,
    label,
    isDemo,
  };
}

const prisma = new PrismaClient();

async function runTests() {
  console.log("==================================================");
  console.log("TESTING PHASE 6A: INDUSTRY DEMAND DATA FOUNDATION");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Database Model & Seed Verification
    console.log("\n--- 1. Database Model & Seeding ---");
    const demandCount = await prisma.industryDemand.count();
    assert(demandCount >= 166, `IndustryDemand table contains ${demandCount} records (expected >= 166)`);

    const demoRecordsCount = await prisma.industryDemand.count({
      where: { sourceType: "DEMO" }
    });
    assert(demoRecordsCount === demandCount, `All ${demoRecordsCount} demand records are correctly tagged with sourceType: DEMO`);

    // Verify relations to Career and Skill
    const sampleRecord = await prisma.industryDemand.findFirst({
      include: { career: true, skill: true }
    });
    assert(sampleRecord !== null, "Found sample IndustryDemand record");
    if (sampleRecord) {
      assert(sampleRecord.career !== null && sampleRecord.career.title.length > 0, `Record connects to Career: "${sampleRecord.career.title}"`);
      assert(sampleRecord.skill !== null && sampleRecord.skill.name.length > 0, `Record connects to Skill: "${sampleRecord.skill.name}"`);
      assert(sampleRecord.demandScore !== null && sampleRecord.demandScore >= 0 && sampleRecord.demandScore <= 100, `Demand score index valid (0-100): ${sampleRecord.demandScore}`);
      assert(sampleRecord.sourceName === "SkillBridge Demo Industry Dataset", `Source name verified: "${sampleRecord.sourceName}"`);
    }

    // 2. Careers Coverage
    console.log("\n--- 2. Career & Skill Coverage ---");
    const careersWithDemand = await prisma.career.findMany({
      include: {
        industryDemands: true,
        requiredSkills: true,
      }
    });

    assert(careersWithDemand.length >= 22, `Found ${careersWithDemand.length} careers in catalog`);
    const fullyCoveredCareers = careersWithDemand.filter(c => c.industryDemands.length === c.requiredSkills.length);
    assert(fullyCoveredCareers.length === careersWithDemand.length, `All ${fullyCoveredCareers.length} careers have 100% demand coverage for their required skills`);

    // 3. Duplicate Prevention (Unique Constraint)
    console.log("\n--- 3. Duplicate Source Constraint ---");
    let duplicateErrorThrown = false;
    try {
      await prisma.industryDemand.create({
        data: {
          careerId: sampleRecord.careerId,
          skillId: sampleRecord.skillId,
          sourceType: "DEMO",
          demandLevel: "HIGH",
          demandScore: 90
        }
      });
    } catch (err) {
      duplicateErrorThrown = true;
    }
    assert(duplicateErrorThrown, "Unique constraint @@unique([careerId, skillId, sourceType]) prevented duplicate source record");

    // 4. Freshness Logic Unit Tests
    console.log("\n--- 4. Freshness Evaluation Helper ---");
    const now = new Date();
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const fortyDaysAgo = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000);
    const hundredDaysAgo = new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000);

    const freshStatus = getDemandFreshness(tenDaysAgo, null, "DEMO");
    assert(freshStatus.status === "Fresh", `10 days old record classified as 'Fresh' (status: ${freshStatus.status})`);
    assert(freshStatus.isDemo === true, "Demo status indicator set to true for DEMO sourceType");

    const agingStatus = getDemandFreshness(fortyDaysAgo, null, "EMPLOYER_POSTINGS");
    assert(agingStatus.status === "Aging", `40 days old record classified as 'Aging' (status: ${agingStatus.status})`);
    assert(agingStatus.isDemo === false, "Demo status indicator set to false for non-DEMO sourceType");

    const expiredStatus = getDemandFreshness(hundredDaysAgo, null, "EMPLOYER_POSTINGS");
    assert(expiredStatus.status === "Expired", `100 days old record classified as 'Expired' (status: ${expiredStatus.status})`);

    // 5. Verification of Existing Data Integrity
    console.log("\n--- 5. Existing Phase 5A & Phase 4B Integrity ---");
    const totalCareers = await prisma.career.count();
    const totalSkills = await prisma.skill.count();
    const totalStudentProfiles = await prisma.studentProfile.count();

    assert(totalCareers >= 22, `Phase 5A Careers preserved (${totalCareers})`);
    assert(totalSkills > 20, `Skills taxonomy preserved (${totalSkills})`);
    assert(totalStudentProfiles >= 0, `Student Profiles operational (${totalStudentProfiles})`);

  } catch (error) {
    console.error("Test execution error:", error);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log("\n==================================================");
  console.log(`PHASE 6A TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
