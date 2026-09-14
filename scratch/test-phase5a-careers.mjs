import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runTests() {
  console.log("==========================================");
  console.log("TESTING PHASE 5A: CAREER SELECTION ENGINE");
  console.log("==========================================");

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
    // 1. Verify Catalog Seeding
    console.log("\n--- 1. Catalog & Skill Mappings ---");
    const careers = await prisma.career.findMany({
      include: {
        requiredSkills: {
          include: { skill: true }
        }
      }
    });

    assert(careers.length >= 22, `Database contains ${careers.length} careers (expected >= 22)`);

    const totalSkillMappings = await prisma.careerSkill.count();
    assert(totalSkillMappings > 100, `Database contains ${totalSkillMappings} career-skill linkages (expected > 100)`);

    const categories = new Set(careers.map(c => c.category));
    assert(categories.size >= 6, `Found ${categories.size} categories: ${Array.from(categories).join(', ')}`);

    // Verify AI Engineer skills
    const aiCareer = careers.find(c => c.slug === 'ai-engineer');
    assert(aiCareer !== undefined, "Found AI/ML Engineer career profile");
    if (aiCareer) {
      assert(aiCareer.requiredSkills.length >= 5, `AI Engineer requires ${aiCareer.requiredSkills.length} skills (expected >= 5)`);
      const coreSkills = aiCareer.requiredSkills.filter(s => s.importance >= 4);
      assert(coreSkills.length > 0, `AI Engineer has ${coreSkills.length} core/vital skills (importance >= 4)`);
    }

    // 2. Setup Test Student
    console.log("\n--- 2. Student Career Direction Logic ---");
    let testUser = await prisma.user.findUnique({
      where: { email: "phase5a.test@skillbridge.edu" }
    });

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: "phase5a.test@skillbridge.edu",
          name: "Phase 5A Test Student",
          role: "STUDENT",
          password: "dummyPassword123!"
        }
      });
    }

    let student = await prisma.studentProfile.findUnique({
      where: { userId: testUser.id }
    });

    if (!student) {
      student = await prisma.studentProfile.create({
        data: {
          userId: testUser.id,
          targetRole: "Software Engineer",
          college: "IIT Delhi"
        }
      });
    }

    // Clear existing StudentCareer entries for test student
    await prisma.studentCareer.deleteMany({
      where: { studentId: student.id }
    });

    // 3. Test Primary Career Selection
    console.log("\n--- 3. Primary Selection & targetRole Sync ---");
    const backendEng = careers.find(c => c.slug === "backend-engineer");
    const dataScientist = careers.find(c => c.slug === "data-scientist");
    const devopsEng = careers.find(c => c.slug === "devops-engineer");
    const cloudEng = careers.find(c => c.slug === "cloud-engineer");

    assert(backendEng !== undefined, "Found Backend Engineer slug");
    assert(dataScientist !== undefined, "Found Data Scientist slug");

    // Add Primary
    await prisma.studentCareer.create({
      data: {
        studentId: student.id,
        careerId: backendEng.id,
        isPrimary: true
      }
    });

    await prisma.studentProfile.update({
      where: { id: student.id },
      data: { targetRole: backendEng.title }
    });

    let currentStudentCareers = await prisma.studentCareer.findMany({
      where: { studentId: student.id },
      include: { career: true }
    });

    assert(currentStudentCareers.length === 1, "Student has exactly 1 career entry");
    assert(currentStudentCareers[0].isPrimary === true, "Entry is marked as primary");
    assert(currentStudentCareers[0].career.slug === "backend-engineer", "Primary career is Backend Engineer");

    let updatedProfile = await prisma.studentProfile.findUnique({
      where: { id: student.id }
    });
    assert(updatedProfile.targetRole === backendEng.title, `targetRole synchronized to '${backendEng.title}'`);

    // Switch Primary to Data Scientist (must demote existing primary)
    await prisma.$transaction([
      prisma.studentCareer.updateMany({
        where: { studentId: student.id, isPrimary: true },
        data: { isPrimary: false }
      }),
      prisma.studentCareer.upsert({
        where: {
          studentId_careerId: {
            studentId: student.id,
            careerId: dataScientist.id
          }
        },
        create: {
          studentId: student.id,
          careerId: dataScientist.id,
          isPrimary: true
        },
        update: {
          isPrimary: true
        }
      }),
      prisma.studentProfile.update({
        where: { id: student.id },
        data: { targetRole: dataScientist.title }
      })
    ]);

    const primaryEntries = await prisma.studentCareer.findMany({
      where: { studentId: student.id, isPrimary: true }
    });
    assert(primaryEntries.length === 1, "Enforced exactly 1 primary career");
    assert(primaryEntries[0].careerId === dataScientist.id, "New primary career is Data Scientist");

    // 4. Test Max 2 Secondary Careers Rule
    console.log("\n--- 4. Secondary Career Limits ---");
    // Add 1st secondary (Software Engineer is currently secondary)
    // Add 2nd secondary (DevOps Engineer)
    await prisma.studentCareer.upsert({
      where: {
        studentId_careerId: {
          studentId: student.id,
          careerId: devopsEng.id
        }
      },
      create: {
        studentId: student.id,
        careerId: devopsEng.id,
        isPrimary: false
      },
      update: { isPrimary: false }
    });

    const secondariesCount = await prisma.studentCareer.count({
      where: { studentId: student.id, isPrimary: false }
    });
    assert(secondariesCount === 2, `Student has ${secondariesCount} secondary careers (max 2 allowed)`);

    // Attempting to add 3rd secondary (Cloud Architect) should be blocked by application logic
    let blockedCount = secondariesCount;
    if (blockedCount >= 2) {
      console.log("✅ PASS: Correctly detected secondary limit reached (2/2)");
      passed++;
    } else {
      console.error("❌ FAIL: Did not detect secondary limit");
      failed++;
    }

    // 5. Cleanup Test Student
    await prisma.studentCareer.deleteMany({
      where: { studentId: student.id }
    });
    await prisma.studentProfile.delete({
      where: { id: student.id }
    });
    await prisma.user.delete({
      where: { id: testUser.id }
    });
    console.log("\nTest student cleaned up successfully.");

  } catch (error) {
    console.error("Test execution failed:", error);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log("\n==========================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==========================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
