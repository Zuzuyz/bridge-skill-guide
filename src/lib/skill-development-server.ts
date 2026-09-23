import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/server/db.server";
import { getAuthenticatedStudentProfile } from "@/server/auth-context";
import { ASSESSMENTS_CATALOG, LEARNING_CATALOG, INDUSTRY_PROGRAMS } from "@/server/assessment-data";
import { SkillGapStatus } from "@prisma/client";
import { getSkillCategory } from "@/lib/local-skill-extractor";
import { calculateStudentReadiness } from "@/server/readiness";

// Industry benchmark standards for common target roles
export const ROLE_BENCHMARKS: Record<string, { skill: string; benchmark: number; importance: "CORE" | "CRITICAL" | "RECOMMENDED" }[]> = {
  "Full-Stack Engineer": [
    { skill: "React", benchmark: 80, importance: "CRITICAL" },
    { skill: "TypeScript", benchmark: 75, importance: "CRITICAL" },
    { skill: "Python", benchmark: 70, importance: "CORE" },
    { skill: "SQL", benchmark: 75, importance: "CORE" },
    { skill: "Docker", benchmark: 65, importance: "RECOMMENDED" },
    { skill: "AWS", benchmark: 60, importance: "RECOMMENDED" },
    { skill: "System Design", benchmark: 70, importance: "CORE" },
    { skill: "Aptitude & Problem Solving", benchmark: 75, importance: "CRITICAL" },
  ],
  "AI/ML Engineer": [
    { skill: "Python", benchmark: 85, importance: "CRITICAL" },
    { skill: "Machine Learning", benchmark: 80, importance: "CRITICAL" },
    { skill: "Deep Learning", benchmark: 75, importance: "CORE" },
    { skill: "SQL", benchmark: 70, importance: "CORE" },
    { skill: "FastAPI", benchmark: 65, importance: "RECOMMENDED" },
    { skill: "Docker", benchmark: 60, importance: "RECOMMENDED" },
    { skill: "Logical Reasoning", benchmark: 80, importance: "CRITICAL" },
    { skill: "Mathematics & Statistics", benchmark: 80, importance: "CORE" },
  ],
  "Backend Developer": [
    { skill: "Python", benchmark: 80, importance: "CRITICAL" },
    { skill: "SQL", benchmark: 85, importance: "CRITICAL" },
    { skill: "FastAPI", benchmark: 75, importance: "CORE" },
    { skill: "PostgreSQL", benchmark: 80, importance: "CORE" },
    { skill: "Docker", benchmark: 70, importance: "CORE" },
    { skill: "AWS", benchmark: 65, importance: "RECOMMENDED" },
    { skill: "Aptitude & Problem Solving", benchmark: 75, importance: "CORE" },
  ],
  "Data Scientist": [
    { skill: "Python", benchmark: 85, importance: "CRITICAL" },
    { skill: "SQL", benchmark: 80, importance: "CRITICAL" },
    { skill: "Machine Learning", benchmark: 80, importance: "CRITICAL" },
    { skill: "Data Visualization", benchmark: 75, importance: "CORE" },
    { skill: "Statistics", benchmark: 80, importance: "CRITICAL" },
    { skill: "Logical Reasoning", benchmark: 75, importance: "CORE" },
  ],
  "Software Engineer": [
    { skill: "Python", benchmark: 80, importance: "CRITICAL" },
    { skill: "Data Structures & Algorithms", benchmark: 85, importance: "CRITICAL" },
    { skill: "SQL", benchmark: 75, importance: "CORE" },
    { skill: "React", benchmark: 70, importance: "CORE" },
    { skill: "System Design", benchmark: 70, importance: "CORE" },
    { skill: "Aptitude & Problem Solving", benchmark: 80, importance: "CRITICAL" },
  ],
};

export const getSkillDevelopmentData = createServerFn({
  method: "GET",
}).handler(async () => {
  const student = await getAuthenticatedStudentProfile({
    user: true,
    skills: {
      include: { skill: true },
    },
    skillGaps: {
      include: { skill: true },
    },
    roadmapItems: {
      orderBy: { step: "asc" },
    },
    credentials: {
      orderBy: { issuedAt: "desc" },
    },
    assessmentAttempts: {
      orderBy: { completedAt: "desc" },
      include: { assessment: true },
    },
    enrollments: {
      include: { program: true },
    },
    studentCareers: {
      include: { career: true },
    },
  });

  if (!student) {
    return null;
  }

  // 1. Current Student Skills Map
  const studentSkillsMap = new Map<string, { score: number; evidence?: string | null; confidence?: number | null }>();
  student.skills.forEach((s) => {
    studentSkillsMap.set(s.skill.name.toLowerCase(), {
      score: s.score,
      evidence: s.evidence,
      confidence: s.confidence,
    });
  });

  // 2. Benchmarks comparison for target role
  // Real career direction: Phase 5 primary StudentCareer first, then the
  // profile's own targetRole field, else null — no invented career.
  const primaryCareerEntry = student.studentCareers.find((sc) => sc.isPrimary);
  const targetRole = primaryCareerEntry?.career.title ?? student.targetRole ?? null;

  // Benchmarks are defined per role. If the student's real role has no
  // benchmark set, the comparison is honestly empty — never another
  // role's benchmark set.
  const benchmarkRules = targetRole ? (ROLE_BENCHMARKS[targetRole] ?? []) : [];

  const benchmarkComparison = benchmarkRules.map((b) => {
    const studentSkill = studentSkillsMap.get(b.skill.toLowerCase());
    const currentScore = studentSkill ? studentSkill.score : 0;
    const gap = Math.max(0, b.benchmark - currentScore);

    let status: "MET" | "NEAR" | "GAP";
    if (currentScore >= b.benchmark) {
      status = "MET";
    } else if (currentScore >= b.benchmark - 20) {
      status = "NEAR";
    } else {
      status = "GAP";
    }

    return {
      skill: b.skill,
      importance: b.importance,
      requiredScore: b.benchmark,
      currentScore,
      gap,
      status,
    };
  });

  // 3. Assessment Catalog with Student Attempts
  const assessmentsWithStatus = ASSESSMENTS_CATALOG.map((assess) => {
    const attempt = student.assessmentAttempts.find(
      (att) => att.assessment.title === assess.title || att.assessment.skillName.toLowerCase() === assess.skillName.toLowerCase()
    );

    const isCompleted = !!attempt;
    const score = attempt?.score ?? null;
    const passed = attempt?.passed ?? (attempt ? attempt.score >= assess.benchmarkScore : false);

    return {
      id: assess.id,
      title: assess.title,
      skillName: assess.skillName,
      category: assess.category,
      description: assess.description,
      durationMinutes: assess.durationMinutes,
      totalQuestions: assess.questions.length,
      benchmarkScore: assess.benchmarkScore,
      isCompleted,
      score,
      passed,
      lastAttemptAt: attempt?.completedAt ? attempt.completedAt.toISOString() : null,
    };
  });

  // 4. Personalized Learning Resources
  // Identify student gap skills
  const gapSkillNames = student.skillGaps.map((g) => g.skill.name.toLowerCase());
  const lowScoreSkills = benchmarkComparison.filter((b) => b.status === "GAP" || b.status === "NEAR").map((b) => b.skill.toLowerCase());
  const prioritySkills = new Set([...gapSkillNames, ...lowScoreSkills]);

  const recommendedResources = LEARNING_CATALOG.map((res: (typeof LEARNING_CATALOG)[number]) => {
    const isDirectGap = prioritySkills.has(res.skill.toLowerCase());
    return {
      ...res,
      isPriority: isDirectGap,
    };
  }).sort((a: { isPriority: boolean }, b: { isPriority: boolean }) => (b.isPriority ? 1 : 0) - (a.isPriority ? 1 : 0));

  // 5. Industry Programs with student enrollment status
  const enrolledProgramIds = new Set(student.enrollments?.map((e) => e.programId) || []);
  const industryProgramsWithEnrollment = INDUSTRY_PROGRAMS.map((prog) => ({
    ...prog,
    isEnrolled: enrolledProgramIds.has(prog.id),
  }));

  // 6. Skill Wallet Items (Credentials + Badges + Projects)
  const walletCredentials = student.credentials.map((cred) => ({
    id: cred.id,
    title: cred.title,
    type: cred.type,
    issuer: cred.issuer,
    score: cred.score,
    verificationCode: cred.url || `SB-${cred.type.slice(0, 3)}-${cred.id.slice(0, 6).toUpperCase()}`,
    issuedAt: cred.issuedAt.toISOString(),
  }));

  // If no credentials yet, provide default initial onboarding badge if profile exists
  if (walletCredentials.length === 0) {
    walletCredentials.push({
      id: "cred-welcome",
      title: "SkillBridge Verified Scholar",
      type: "BADGE",
      issuer: "SkillBridge University Guild",
      score: student.readiness,
      verificationCode: `SB-SCHOLAR-${student.id.slice(0, 6).toUpperCase()}`,
      issuedAt: new Date().toISOString(),
    });
  }

  // 7. Top Matching Internships for Readiness
  const internships = await prisma.internship.findMany({
    take: 3,
    include: {
      company: true,
      requiredSkills: { include: { skill: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const matchingOpportunities = internships.map((internship) => {
    const reqSkills = internship.requiredSkills.map((s) => s.skill.name.toLowerCase());
    let matchScore = 50;
    if (reqSkills.length > 0) {
      let matchedCount = 0;
      reqSkills.forEach((req) => {
        if (studentSkillsMap.has(req)) {
          const score = studentSkillsMap.get(req)!.score;
          if (score >= 60) matchedCount++;
        }
      });
      matchScore = Math.round(50 + (matchedCount / reqSkills.length) * 45);
    }

    return {
      id: internship.id,
      role: internship.role,
      company: internship.company.name,
      location: internship.location || "Remote",
      stipend: internship.stipend || "Paid",
      matchScore: Math.min(98, matchScore),
      requiredSkills: internship.requiredSkills.map((s) => s.skill.name),
    };
  });

  return {
    student: {
      id: student.id,
      name: student.user.name,
      email: student.user.email,
      targetRole,
      readiness: student.readiness,
      college: student.college,
    },
    skills: student.skills.map((s) => {
      const isVerified = s.evidence?.includes("Verified via SkillBridge") ?? false;
      return {
        id: s.skill.id,
        name: s.skill.name,
        score: s.score,
        confidence: s.confidence,
        evidence: s.evidence,
        category: getSkillCategory(s.skill.name),
        isVerified,
      };
    }),
    benchmarkComparison,
    assessments: assessmentsWithStatus,
    recommendedResources,
    industryPrograms: industryProgramsWithEnrollment,
    walletCredentials,
    roadmap: student.roadmapItems.map((item) => ({
      id: item.id,
      step: item.step,
      skill: item.skill,
      status: item.status,
      difficulty: item.difficulty,
      duration: item.duration,
      resource: item.resource,
      project: item.project,
    })),
    matchingOpportunities,
  };
});

export const getAssessmentDetails = createServerFn({
  method: "GET",
})
  .validator((assessmentId: string) => assessmentId)
  .handler(async ({ data: assessmentId }) => {
    const assessDef = ASSESSMENTS_CATALOG.find((a) => a.id === assessmentId);
    if (!assessDef) {
      throw new Error(`Assessment ${assessmentId} not found`);
    }

    // Do not leak correctAnswer to frontend during test
    const sanitizedQuestions = assessDef.questions.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      difficulty: q.difficulty,
      topic: q.topic,
    }));

    return {
      id: assessDef.id,
      title: assessDef.title,
      skillName: assessDef.skillName,
      category: assessDef.category,
      description: assessDef.description,
      durationMinutes: assessDef.durationMinutes,
      totalQuestions: assessDef.questions.length,
      benchmarkScore: assessDef.benchmarkScore,
      questions: sanitizedQuestions,
    };
  });

export interface SubmitAssessmentInput {
  assessmentId: string;
  answers: Record<string, number>; // questionId -> chosen option index (0..3)
  timeSpentSeconds: number;
}

export const submitAssessment = createServerFn({
  method: "POST",
})
  .validator((input: SubmitAssessmentInput) => input)
  .handler(async ({ data }) => {
    const student = await getAuthenticatedStudentProfile({
      user: true,
      skills: { include: { skill: true } },
      skillGaps: { include: { skill: true } },
    });

    if (!student) {
      throw new Error("Student authentication required");
    }

    const assessDef = ASSESSMENTS_CATALOG.find((a) => a.id === data.assessmentId);
    if (!assessDef) {
      throw new Error(`Assessment ${data.assessmentId} not found`);
    }

    // Evaluate answers
    let correctCount = 0;
    const totalCount = assessDef.questions.length;
    const breakdown = assessDef.questions.map((q) => {
      const chosen = data.answers[q.id];
      const isCorrect = chosen !== undefined && chosen === q.correctAnswer;
      if (isCorrect) correctCount++;

      return {
        id: q.id,
        question: q.question,
        options: q.options,
        selectedOption: chosen !== undefined ? chosen : -1,
        correctAnswer: q.correctAnswer,
        isCorrect,
        difficulty: q.difficulty,
        topic: q.topic,
        explanation: q.explanation,
      };
    });

    // Score calculation (0-100)
    const score = Math.round((correctCount / totalCount) * 100);
    const passedBenchmark = score >= assessDef.benchmarkScore;

    // Ensure Assessment record exists in DB
    let dbAssessment = await prisma.assessment.findUnique({
      where: { title: assessDef.title },
    });

    if (!dbAssessment) {
      dbAssessment = await prisma.assessment.create({
        data: {
          title: assessDef.title,
          skillName: assessDef.skillName,
          category: assessDef.category,
          description: assessDef.description,
          durationMinutes: assessDef.durationMinutes,
          totalQuestions: assessDef.questions.length,
          passingScore: assessDef.benchmarkScore,
        },
      });
    }

    // Record Assessment Attempt
    await prisma.assessmentAttempt.create({
      data: {
        studentId: student.id,
        assessmentId: dbAssessment.id,
        score,
        percentage: score,
        correctCount,
        totalCount,
        passed: passedBenchmark,
        details: breakdown as any,
      },
    });

    // Find or create Skill in DB
    let skill = await prisma.skill.findUnique({
      where: { name: assessDef.skillName },
    });
    if (!skill) {
      skill = await prisma.skill.create({
        data: {
          name: assessDef.skillName,
          demand: "High Demand",
        },
      });
    }

    // Upsert StudentSkill with verified score
    const evidenceText = `Verified via SkillBridge Adaptive Assessment (${score}% accuracy, ${correctCount}/${totalCount} questions correct).`;
    const now = new Date();
    await prisma.studentSkill.upsert({
      where: {
        studentId_skillId: {
          studentId: student.id,
          skillId: skill.id,
        },
      },
      update: {
        score: Math.max(score, (student.skills.find((s) => s.skill.name === assessDef.skillName)?.score || 0)),
        confidence: 98,
        evidence: evidenceText,
        evidenceSource: "Assessment",
        verificationLevel: "ASSESSMENT_VERIFIED",
        assessmentScore: score,
        lastVerifiedAt: now,
        lastDemonstratedAt: now,
      },
      create: {
        studentId: student.id,
        skillId: skill.id,
        score,
        confidence: 98,
        evidence: evidenceText,
        evidenceSource: "Assessment",
        verificationLevel: "ASSESSMENT_VERIFIED",
        assessmentScore: score,
        lastVerifiedAt: now,
        lastDemonstratedAt: now,
      },
    });

    // Update SkillGap if exists and resolved
    const gapItem = student.skillGaps.find((g) => g.skill.name.toLowerCase() === assessDef.skillName.toLowerCase());
    if (gapItem) {
      await prisma.skillGap.update({
        where: { id: gapItem.id },
        data: {
          score,
          status: score >= 70 ? SkillGapStatus.STRONG : SkillGapStatus.NEEDS_IMPROVEMENT,
        },
      });
    }

    // Generate Credential & Badge if passed benchmark or >= 70%
    const verificationCode = `SB-${assessDef.skillName.slice(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
    if (score >= 70) {
      await prisma.credential.create({
        data: {
          studentId: student.id,
          title: `${assessDef.skillName} Certified Practitioner`,
          type: "ASSESSMENT",
          issuer: "SkillBridge Assessment Guild",
          score,
          skills: [assessDef.skillName],
          url: verificationCode,
        },
      });

      if (score >= 85) {
        await prisma.credential.create({
          data: {
            studentId: student.id,
            title: `${assessDef.skillName} Master Badge`,
            type: "BADGE",
            issuer: "SkillBridge Center of Excellence",
            score,
            skills: [assessDef.skillName],
            url: `SB-BADGE-${Math.floor(100000 + Math.random() * 900000)}`,
          },
        });
      }
    }

    // Recalculate Student Overall Readiness with authoritative unified engine
    const { readiness: updatedReadiness } = await calculateStudentReadiness(student.id);

    await prisma.studentProfile.update({
      where: { id: student.id },
      data: { readiness: updatedReadiness },
    });

    return {
      success: true,
      score,
      correctCount,
      totalCount,
      passedBenchmark,
      proficiency: score >= 80 ? "Advanced Mastery" : score >= 60 ? "Intermediate Proficient" : "Foundational",
      verificationCode: score >= 70 ? verificationCode : null,
      breakdown,
      newReadiness: updatedReadiness,
    };
  });

export const enrollProgram = createServerFn({
  method: "POST",
})
  .validator((programId: string) => programId)
  .handler(async ({ data: programId }) => {
    const student = await getAuthenticatedStudentProfile();
    if (!student) {
      throw new Error("Student authentication required");
    }

    const progDef = INDUSTRY_PROGRAMS.find((p) => p.id === programId);
    if (!progDef) {
      throw new Error("Program not found");
    }

    // Ensure IndustryProgram exists in DB
    let dbProg = await prisma.industryProgram.findFirst({
      where: { title: progDef.title },
    });

    if (!dbProg) {
      dbProg = await prisma.industryProgram.create({
        data: {
          id: progDef.id,
          company: progDef.company,
          title: progDef.title,
          duration: progDef.duration,
          description: progDef.description,
          skills: progDef.skills,
          certificate: progDef.certificate,
          eligibility: progDef.eligibility,
          url: progDef.url,
        },
      });
    }

    // Create Enrollment if not exists
    await prisma.learningEnrollment.upsert({
      where: {
        studentId_programId: {
          studentId: student.id,
          programId: dbProg.id,
        },
      },
      update: {
        status: "ENROLLED",
      },
      create: {
        studentId: student.id,
        programId: dbProg.id,
        status: "ENROLLED",
      },
    });

    return { success: true, message: `Successfully enrolled in ${progDef.title}` };
  });
