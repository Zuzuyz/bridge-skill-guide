import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/server/db";
import { getAuthenticatedStudentProfile } from "@/server/auth-context";
import {
  ASSESSMENTS_CATALOG,
  CODING_ASSESSMENTS_CATALOG,
  SQL_ASSESSMENTS_CATALOG,
  type AssessmentDef,
  type CodingAssessmentDef,
  type SqlAssessmentDef,
} from "@/server/assessment-data";
import { calculateStudentReadiness } from "@/server/readiness";
import {
  VERIFICATION_PREFERENCE_ORDER,
  type VerificationLevel,
} from "@/types";
import { executeCode, sanitizeTestCasesForClient, type TestCase } from "@/lib/code-execution-server";
import { executeSqlQuery, validateSqlSafety } from "@/lib/sql-execution-server";

/**
 * Ensures demo assessments from the catalog are synced and present in PostgreSQL.
 * Seeds MCQ, CODING, and SQL assessments.
 */
async function ensureAssessmentsSeeded() {
  // Seed MCQ assessments
  const mcqCount = await prisma.assessment.count({ where: { type: "MCQ" } });
  if (mcqCount < ASSESSMENTS_CATALOG.length) {
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
      }

      const existingAssessment = await prisma.assessment.findUnique({
        where: { title: item.title },
        include: { questions: true },
      });

      if (!existingAssessment) {
        const created = await prisma.assessment.create({
          data: {
            title: item.title,
            skillName: item.skillName,
            skillId: skill.id,
            type: "MCQ",
            category: item.category,
            description: item.description,
            difficulty: item.benchmarkScore >= 80 ? "INTERMEDIATE" : "BEGINNER",
            passingScore: item.benchmarkScore,
            durationMinutes: item.durationMinutes,
            totalQuestions: item.questions.length,
            status: "PUBLISHED",
          },
        });

        for (let i = 0; i < item.questions.length; i++) {
          const q = item.questions[i];
          if (!q) continue;
          await prisma.assessmentQuestion.create({
            data: {
              assessmentId: created.id,
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
      } else if (existingAssessment.questions.length === 0) {
        for (let i = 0; i < item.questions.length; i++) {
          const q = item.questions[i];
          if (!q) continue;
          await prisma.assessmentQuestion.create({
            data: {
              assessmentId: existingAssessment.id,
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
      }
    }
  }

  // Seed CODING assessments
  await seedCodingAssessments();

  // Seed SQL assessments
  await seedSqlAssessments();
}

/**
 * Seeds coding assessment challenges into the database.
 */
async function seedCodingAssessments() {
  for (const item of CODING_ASSESSMENTS_CATALOG) {
    let skill = await prisma.skill.findFirst({
      where: { name: { equals: item.skillName, mode: "insensitive" } },
    });
    if (!skill) {
      skill = await prisma.skill.create({
        data: { name: item.skillName, demand: "High" },
      });
    }

    const existing = await prisma.assessment.findUnique({
      where: { title: item.title },
      include: { questions: true },
    });

    if (!existing) {
      const created = await prisma.assessment.create({
        data: {
          title: item.title,
          skillName: item.skillName,
          skillId: skill.id,
          type: "CODING",
          language: item.language,
          category: item.category,
          description: item.description,
          difficulty: "INTERMEDIATE",
          passingScore: item.benchmarkScore,
          durationMinutes: item.durationMinutes,
          totalQuestions: item.questions.length,
          status: "PUBLISHED",
        },
      });

      for (let i = 0; i < item.questions.length; i++) {
        const q = item.questions[i];
        if (!q) continue;
        await prisma.assessmentQuestion.create({
          data: {
            assessmentId: created.id,
            question: q.question,
            questionType: "CODING",
            language: "python",
            points: 20,
            order: i + 1,
            difficulty: q.difficulty,
            topic: q.topic,
            explanation: q.explanation,
            starterCode: q.starterCode,
            solutionCode: q.solutionCode,
            functionSignature: q.functionSignature,
            constraints: q.constraints,
            sampleInput: q.sampleInput,
            sampleOutput: q.sampleOutput,
            testCases: q.testCases as any,
          },
        });
      }
    }
  }
}

/**
 * Seeds SQL assessment challenges into the database.
 */
async function seedSqlAssessments() {
  for (const item of SQL_ASSESSMENTS_CATALOG) {
    let skill = await prisma.skill.findFirst({
      where: { name: { equals: item.skillName, mode: "insensitive" } },
    });
    if (!skill) {
      skill = await prisma.skill.create({
        data: { name: item.skillName, demand: "High" },
      });
    }

    const existing = await prisma.assessment.findUnique({
      where: { title: item.title },
      include: { questions: true },
    });

    if (!existing) {
      const created = await prisma.assessment.create({
        data: {
          title: item.title,
          skillName: item.skillName,
          skillId: skill.id,
          type: "SQL",
          language: item.language,
          category: item.category,
          description: item.description,
          difficulty: "INTERMEDIATE",
          passingScore: item.benchmarkScore,
          durationMinutes: item.durationMinutes,
          totalQuestions: item.questions.length,
          status: "PUBLISHED",
        },
      });

      for (let i = 0; i < item.questions.length; i++) {
        const q = item.questions[i];
        if (!q) continue;
        await prisma.assessmentQuestion.create({
          data: {
            assessmentId: created.id,
            question: q.question,
            questionType: "SQL",
            language: "sql",
            points: 20,
            order: i + 1,
            difficulty: q.difficulty,
            topic: q.topic,
            explanation: q.explanation,
            solutionCode: q.solutionCode,
            dbSchema: q.dbSchema,
            initialDbData: q.initialDbData,
            sampleInput: q.sampleInput,
            sampleOutput: q.sampleOutput,
            constraints: q.constraints,
          },
        });
      }
    }
  }
}

export interface AssessmentSummaryItem {
  id: string;
  title: string;
  skillName: string;
  category: string;
  type: string;
  language?: string | null | undefined;
  description: string;
  difficulty: string;
  passingScore: number;
  durationMinutes: number;
  totalQuestions: number;
  status: string;
  studentStatus: {
    verificationLevel: VerificationLevel;
    verificationLabel: string;
    isVerified: boolean;
    currentSkillScore: number;
    highestAttemptScore?: number | undefined;
    hasPassed: boolean;
    attemptCount: number;
    lastAttemptAt?: string | undefined;
  };
}

/**
 * Retrieves all available assessments and annotations for the current authenticated student.
 */
export const getAvailableAssessments = createServerFn({
  method: "GET",
}).handler(async (): Promise<{
  assessments: AssessmentSummaryItem[];
  stats: {
    totalAvailable: number;
    completed: number;
    passed: number;
    verifiedSkillsCount: number;
  };
}> => {
  await ensureAssessmentsSeeded();

  const student = await getAuthenticatedStudentProfile({
    skills: { include: { skill: true } },
    assessmentAttempts: {
      include: { assessment: true },
      orderBy: { completedAt: "desc" },
    },
  });

  const assessments = await prisma.assessment.findMany({
    where: { status: "PUBLISHED" },
    include: {
      skill: true,
      _count: {
        select: { questions: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const studentSkillsMap = new Map(
    student?.skills.map((s) => [
      s.skill.name.toLowerCase(),
      {
        level: s.verificationLevel,
        score: s.score,
        assessmentScore: s.assessmentScore,
      },
    ]) ?? []
  );

  let completedCount = 0;
  let passedCount = 0;

  const items: AssessmentSummaryItem[] = assessments.map((a) => {
    const studentSkill = studentSkillsMap.get(a.skillName.toLowerCase());
    const rawLevel = studentSkill?.level || "RESUME_DETECTED";
    const isVerified =
      rawLevel === "ASSESSMENT_VERIFIED" ||
      rawLevel === "PROJECT_VERIFIED" ||
      rawLevel === "INSTITUTION_VERIFIED" ||
      rawLevel === "EMPLOYER_VERIFIED";

    const attemptsForThis =
      student?.assessmentAttempts.filter(
        (att) => att.assessmentId === a.id || att.assessment.skillName.toLowerCase() === a.skillName.toLowerCase()
      ) || [];

    const attemptCount = attemptsForThis.length;
    if (attemptCount > 0) {
      completedCount++;
    }

    const hasPassed = attemptsForThis.some((att) => att.passed);
    if (hasPassed) {
      passedCount++;
    }

    const highestScore =
      attemptsForThis.length > 0
        ? Math.max(...attemptsForThis.map((att) => att.score))
        : undefined;

    const firstAttempt = attemptsForThis[0];
    const lastAttemptAt =
      firstAttempt && firstAttempt.completedAt
        ? firstAttempt.completedAt.toISOString()
        : undefined;

    const verificationLabel =
      rawLevel === "ASSESSMENT_VERIFIED"
        ? "Assessment Verified"
        : rawLevel === "PROJECT_VERIFIED"
          ? "Project Verified"
          : rawLevel === "INSTITUTION_VERIFIED"
            ? "Institution Verified"
            : rawLevel === "EMPLOYER_VERIFIED"
              ? "Employer Verified"
              : "Resume Detected";

    return {
      id: a.id,
      title: a.title,
      skillName: a.skillName,
      category: a.category,
      type: a.type,
      language: a.language,
      description: a.description,
      difficulty: a.difficulty,
      passingScore: a.passingScore,
      durationMinutes: a.durationMinutes,
      totalQuestions: a._count.questions || a.totalQuestions,
      status: a.status,
      studentStatus: {
        verificationLevel: rawLevel,
        verificationLabel,
        isVerified,
        currentSkillScore: studentSkill?.score ?? 0,
        highestAttemptScore: highestScore,
        hasPassed,
        attemptCount,
        lastAttemptAt,
      },
    };
  });

  const verifiedSkillsCount =
    student?.skills.filter(
      (s) =>
        s.verificationLevel === "ASSESSMENT_VERIFIED" ||
        s.verificationLevel === "PROJECT_VERIFIED" ||
        s.verificationLevel === "INSTITUTION_VERIFIED" ||
        s.verificationLevel === "EMPLOYER_VERIFIED"
    ).length ?? 0;

  return {
    assessments: items,
    stats: {
      totalAvailable: items.length,
      completed: completedCount,
      passed: passedCount,
      verifiedSkillsCount,
    },
  };
});

/**
 * Sanitized question representation sent to browser (no answers or explanations leaked).
 */
export interface SanitizedQuestion {
  id: string;
  order: number;
  question: string;
  questionType: string;
  options: string[];
  points: number;
  difficulty: string;
  topic?: string | null | undefined;
  // Coding assessment fields (sanitized — no solution code, no hidden test cases)
  starterCode?: string | null | undefined;
  functionSignature?: string | null | undefined;
  constraints?: string | null | undefined;
  sampleInput?: string | null | undefined;
  sampleOutput?: string | null | undefined;
  language?: string | null | undefined;
  visibleTestCases?: Array<{ input: string; expectedOutput: string; explanation?: string }>;
  // SQL assessment fields (sanitized — no solution query)
  dbSchema?: string | null | undefined;
  initialDbData?: string | null | undefined;
}

export interface AssessmentDetailData {
  id: string;
  title: string;
  skillName: string;
  category: string;
  description: string;
  difficulty: string;
  passingScore: number;
  durationMinutes: number;
  totalQuestions: number;
  totalPoints: number;
  type: string;
  language?: string | null | undefined;
  questions: SanitizedQuestion[];
  previousAttemptsCount: number;
  bestScore?: number | undefined;
  hasPassedBefore: boolean;
}

/**
 * Fetches assessment detail with sanitized questions.
 * For CODING/SQL assessments, includes starter code/schema but strips solutions and hidden test cases.
 */
export const getAssessmentById = createServerFn({
  method: "GET",
})
  .validator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<AssessmentDetailData> => {
    await ensureAssessmentsSeeded();

    const student = await getAuthenticatedStudentProfile({
      assessmentAttempts: {
        where: { assessmentId: data.id },
        orderBy: { score: "desc" },
      },
    });

    const assessment = await prisma.assessment.findUnique({
      where: { id: data.id },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!assessment) {
      throw new Error(`Assessment with ID "${data.id}" not found.`);
    }

    const previousAttempts = student?.assessmentAttempts || [];
    const hasPassedBefore = previousAttempts.some((a) => a.passed);
    const bestScore =
      previousAttempts.length > 0 && previousAttempts[0] ? previousAttempts[0].score : undefined;

    const totalPoints = assessment.questions.reduce((acc, q) => acc + q.points, 0);

    const sanitizedQuestions: SanitizedQuestion[] = assessment.questions.map((q, idx) => {
      const base: SanitizedQuestion = {
        id: q.id,
        order: q.order || idx + 1,
        question: q.question,
        questionType: q.questionType,
        options: q.options,
        points: q.points,
        difficulty: q.difficulty,
        topic: q.topic,
      };

      // Add coding-specific fields (no solutionCode, no hidden test cases)
      if (q.questionType === "CODING") {
        base.starterCode = q.starterCode;
        base.functionSignature = q.functionSignature;
        base.constraints = q.constraints;
        base.sampleInput = q.sampleInput;
        base.sampleOutput = q.sampleOutput;
        base.language = q.language;
        const allTestCases = (q.testCases as unknown as Array<{ input: string; expectedOutput: string; isHidden: boolean; explanation?: string }>) || [];
        base.visibleTestCases = allTestCases
          .filter((tc) => !tc.isHidden)
          .map((tc) => ({
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            ...(tc.explanation !== undefined ? { explanation: tc.explanation } : {}),
          }));
      }

      // Add SQL-specific fields (no solutionCode)
      if (q.questionType === "SQL") {
        base.dbSchema = q.dbSchema;
        base.initialDbData = q.initialDbData;
        base.constraints = q.constraints;
        base.sampleInput = q.sampleInput;
        base.sampleOutput = q.sampleOutput;
        base.language = q.language;
      }

      return base;
    });

    return {
      id: assessment.id,
      title: assessment.title,
      skillName: assessment.skillName,
      category: assessment.category,
      description: assessment.description,
      difficulty: assessment.difficulty,
      passingScore: assessment.passingScore,
      durationMinutes: assessment.durationMinutes,
      totalQuestions: assessment.questions.length,
      totalPoints,
      type: assessment.type,
      language: assessment.language,
      questions: sanitizedQuestions,
      previousAttemptsCount: previousAttempts.length,
      bestScore,
      hasPassedBefore,
    };
  });

export interface SubmitAssessmentInput {
  assessmentId: string;
  answers: Record<string, number>; // questionId -> chosen option index
  timeSpentSeconds: number;
}

export interface QuestionBreakdownResult {
  id: string;
  question: string;
  options: string[];
  selectedOption: number;
  correctAnswer: number;
  isCorrect: boolean;
  pointsEarned: number;
  pointsPossible: number;
  difficulty: string;
  topic?: string | null | undefined;
  explanation?: string | null | undefined;
}

export interface AssessmentResultResponse {
  attemptId: string;
  assessmentId: string;
  assessmentTitle: string;
  skillName: string;
  score: number;
  percentage: number;
  pointsEarned: number;
  totalPoints: number;
  passed: boolean;
  passingScore: number;
  correctCount: number;
  totalCount: number;
  timeSpentSeconds: number;
  attemptNumber: number;
  completedAt: string;
  verificationLevel: VerificationLevel;
  verificationLabel: string;
  isVerified: boolean;
  newReadiness?: number | undefined;
  breakdown: QuestionBreakdownResult[];
}

/**
 * Server-side evaluation of student assessment attempt.
 * Strictly calculates score from database questions and enforces verification rules.
 */
export const submitAssessmentAttempt = createServerFn({
  method: "POST",
})
  .validator((input: SubmitAssessmentInput) => input)
  .handler(async ({ data }): Promise<AssessmentResultResponse> => {
    const student = await getAuthenticatedStudentProfile({
      user: true,
      skills: { include: { skill: true } },
      skillGaps: { include: { skill: true } },
      assessmentAttempts: { where: { assessmentId: data.assessmentId } },
    });

    if (!student) {
      throw new Error("Student authentication required.");
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id: data.assessmentId },
      include: {
        questions: { orderBy: { order: "asc" } },
        skill: true,
      },
    });

    if (!assessment) {
      throw new Error(`Assessment "${data.assessmentId}" not found.`);
    }

    const attemptNumber = student.assessmentAttempts.length + 1;

    // Server-side scoring
    let pointsEarned = 0;
    let totalPoints = 0;
    let correctCount = 0;
    const totalCount = assessment.questions.length;

    const breakdown: QuestionBreakdownResult[] = [];
    const answersToCreate: Array<{
      questionId: string;
      selectedOption: number | null;
      isCorrect: boolean;
      pointsEarned: number;
    }> = [];

    for (const q of assessment.questions) {
      totalPoints += q.points;
      const selected = data.answers[q.id];
      const hasSelected = selected !== undefined && selected !== null && selected >= 0;
      const isCorrect = hasSelected && selected === q.correctAnswer;
      const earned = isCorrect ? q.points : 0;

      if (isCorrect) {
        correctCount++;
        pointsEarned += earned;
      }

      breakdown.push({
        id: q.id,
        question: q.question,
        options: q.options,
        selectedOption: hasSelected ? selected : -1,
        correctAnswer: q.correctAnswer,
        isCorrect,
        pointsEarned: earned,
        pointsPossible: q.points,
        difficulty: q.difficulty,
        topic: q.topic,
        explanation: q.explanation,
      });

      answersToCreate.push({
        questionId: q.id,
        selectedOption: hasSelected ? selected : null,
        isCorrect,
        pointsEarned: earned,
      });
    }

    const percentage = totalPoints > 0 ? Math.round((pointsEarned / totalPoints) * 100) : 0;
    const passed = percentage >= assessment.passingScore;
    const now = new Date();

    // 1. Create AssessmentAttempt
    const attempt = await prisma.assessmentAttempt.create({
      data: {
        studentId: student.id,
        assessmentId: assessment.id,
        score: percentage,
        percentage,
        passed,
        startedAt: new Date(Date.now() - (data.timeSpentSeconds || 60) * 1000),
        completedAt: now,
        attemptNumber,
        timeSpentSeconds: data.timeSpentSeconds || 0,
        correctCount,
        totalCount,
        details: breakdown as any,
      },
    });

    // 2. Create AssessmentAnswer records
    for (const ans of answersToCreate) {
      await prisma.assessmentAnswer.create({
        data: {
          attemptId: attempt.id,
          questionId: ans.questionId,
          selectedOption: ans.selectedOption,
          isCorrect: ans.isCorrect,
          pointsEarned: ans.pointsEarned,
        },
      });
    }

    // 3. Find or ensure skill exists
    let skill = assessment.skill;
    if (!skill) {
      skill = await prisma.skill.findFirst({
        where: { name: { equals: assessment.skillName, mode: "insensitive" } },
      });
      if (!skill) {
        skill = await prisma.skill.create({
          data: {
            name: assessment.skillName,
            demand: "High",
          },
        });
      }
    }

    // 4. Update StudentSkill Verification
    const existingStudentSkill = student.skills.find(
      (s) => s.skill.name.toLowerCase() === assessment.skillName.toLowerCase()
    );

    let finalVerificationLevel: VerificationLevel = "RESUME_DETECTED";

    if (passed) {
      finalVerificationLevel = "ASSESSMENT_VERIFIED";

      if (existingStudentSkill) {
        const currentOrder =
          VERIFICATION_PREFERENCE_ORDER[existingStudentSkill.verificationLevel] || 1;
        const assessmentOrder = VERIFICATION_PREFERENCE_ORDER["ASSESSMENT_VERIFIED"];

        // Never downgrade higher tiers (e.g. PROJECT_VERIFIED, INSTITUTION_VERIFIED, EMPLOYER_VERIFIED)
        const targetLevel: VerificationLevel =
          currentOrder > assessmentOrder
            ? existingStudentSkill.verificationLevel
            : "ASSESSMENT_VERIFIED";

        finalVerificationLevel = targetLevel;

        const newScore = Math.max(existingStudentSkill.score, percentage);
        const newAssessmentScore = Math.max(existingStudentSkill.assessmentScore || 0, percentage);

        await prisma.studentSkill.update({
          where: { id: existingStudentSkill.id },
          data: {
            score: newScore,
            confidence: Math.max(existingStudentSkill.confidence || 80, 95),
            verificationLevel: targetLevel,
            assessmentScore: newAssessmentScore,
            evidence: `Verified via SkillBridge Assessment (${percentage}%, ${correctCount}/${totalCount} questions correct).`,
            evidenceSource: "Assessment",
            lastVerifiedAt: now,
            lastDemonstratedAt: now,
          },
        });
      } else {
        await prisma.studentSkill.create({
          data: {
            studentId: student.id,
            skillId: skill.id,
            score: percentage,
            confidence: 95,
            verificationLevel: "ASSESSMENT_VERIFIED",
            assessmentScore: percentage,
            evidence: `Verified via SkillBridge Assessment (${percentage}%, ${correctCount}/${totalCount} questions correct).`,
            evidenceSource: "Assessment",
            lastVerifiedAt: now,
            lastDemonstratedAt: now,
          },
        });
      }

      // 5. Create or verify Credential record
      const existingCred = await prisma.credential.findFirst({
        where: {
          studentId: student.id,
          title: `${assessment.title} Verification`,
        },
      });

      if (!existingCred) {
        await prisma.credential.create({
          data: {
            studentId: student.id,
            title: `${assessment.title} Verification`,
            type: "ASSESSMENT",
            issuer: "SkillBridge",
            verified: true,
            score: percentage,
            skills: [assessment.skillName],
            issuedAt: now,
          },
        });
      }
    } else {
      // Failed attempt: do not grant ASSESSMENT_VERIFIED
      if (existingStudentSkill) {
        finalVerificationLevel = existingStudentSkill.verificationLevel;
      }
    }

    // 6. Recalculate Student Readiness
    const { readiness } = await calculateStudentReadiness(student.id);
    await prisma.studentProfile.update({
      where: { id: student.id },
      data: { readiness },
    });

    const verificationLabel =
      finalVerificationLevel === "ASSESSMENT_VERIFIED"
        ? "Assessment Verified"
        : finalVerificationLevel === "PROJECT_VERIFIED"
          ? "Project Verified"
          : finalVerificationLevel === "INSTITUTION_VERIFIED"
            ? "Institution Verified"
            : finalVerificationLevel === "EMPLOYER_VERIFIED"
              ? "Employer Verified"
              : "Resume Detected";

    return {
      attemptId: attempt.id,
      assessmentId: assessment.id,
      assessmentTitle: assessment.title,
      skillName: assessment.skillName,
      score: percentage,
      percentage,
      pointsEarned,
      totalPoints,
      passed,
      passingScore: assessment.passingScore,
      correctCount,
      totalCount,
      timeSpentSeconds: data.timeSpentSeconds || 0,
      attemptNumber,
      completedAt: now.toISOString(),
      verificationLevel: finalVerificationLevel,
      verificationLabel,
      isVerified: passed || finalVerificationLevel !== "RESUME_DETECTED",
      newReadiness: readiness,
      breakdown,
    };
  });

/**
 * Retrieves the result of a specific assessment attempt for the student.
 */
export const getAssessmentAttemptResult = createServerFn({
  method: "GET",
})
  .validator((data: { attemptId: string }) => data)
  .handler(async ({ data }): Promise<AssessmentResultResponse | null> => {
    const student = await getAuthenticatedStudentProfile();
    if (!student) {
      throw new Error("Student authentication required.");
    }

    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: data.attemptId },
      include: {
        assessment: true,
        student: {
          include: {
            skills: { include: { skill: true } },
          },
        },
      },
    });

    if (!attempt || attempt.studentId !== student.id) {
      return null;
    }

    const studentSkill = attempt.student.skills.find(
      (s) => s.skill.name.toLowerCase() === attempt.assessment.skillName.toLowerCase()
    );

    const rawLevel = studentSkill?.verificationLevel || (attempt.passed ? "ASSESSMENT_VERIFIED" : "RESUME_DETECTED");
    const verificationLabel =
      rawLevel === "ASSESSMENT_VERIFIED"
        ? "Assessment Verified"
        : rawLevel === "PROJECT_VERIFIED"
          ? "Project Verified"
          : rawLevel === "INSTITUTION_VERIFIED"
            ? "Institution Verified"
            : rawLevel === "EMPLOYER_VERIFIED"
              ? "Employer Verified"
              : "Resume Detected";

    return {
      attemptId: attempt.id,
      assessmentId: attempt.assessmentId,
      assessmentTitle: attempt.assessment.title,
      skillName: attempt.assessment.skillName,
      score: attempt.score,
      percentage: attempt.percentage,
      pointsEarned: Math.round((attempt.score / 100) * (attempt.totalCount * 10)),
      totalPoints: attempt.totalCount * 10,
      passed: attempt.passed,
      passingScore: attempt.assessment.passingScore,
      correctCount: attempt.correctCount,
      totalCount: attempt.totalCount,
      timeSpentSeconds: attempt.timeSpentSeconds,
      attemptNumber: attempt.attemptNumber,
      completedAt: attempt.completedAt ? attempt.completedAt.toISOString() : new Date().toISOString(),
      verificationLevel: rawLevel,
      verificationLabel,
      isVerified: rawLevel !== "RESUME_DETECTED",
      breakdown: (attempt.details as any) || [],
    };
  });

// ---------------------------------------------------------------------------
// Phase 4B — Coding Assessment Submission
// ---------------------------------------------------------------------------

export interface SubmitCodingInput {
  assessmentId: string;
  /** questionId → student code */
  codeSolutions: Record<string, string>;
  timeSpentSeconds: number;
}

export interface CodingResultResponse {
  attemptId: string;
  assessmentId: string;
  assessmentTitle: string;
  skillName: string;
  score: number;
  percentage: number;
  passed: boolean;
  passingScore: number;
  timeSpentSeconds: number;
  attemptNumber: number;
  completedAt: string;
  verificationLevel: VerificationLevel;
  verificationLabel: string;
  isVerified: boolean;
  newReadiness?: number | undefined;
  questionResults: Array<{
    questionId: string;
    question: string;
    passed: boolean;
    passedTests: number;
    totalTests: number;
    executionTimeMs: number;
    error: string | null;
    testResults: Array<{
      testIndex: number;
      passed: boolean;
      input: string;
      expectedOutput: string;
      actualOutput: string;
      isHidden: boolean;
    }>;
  }>;
}

/**
 * Server-side execution and scoring of coding assessment.
 * Runs student code against ALL test cases (including hidden) on the server.
 */
export const submitCodingAttempt = createServerFn({
  method: "POST",
})
  .validator((input: SubmitCodingInput) => input)
  .handler(async ({ data }): Promise<CodingResultResponse> => {
    const student = await getAuthenticatedStudentProfile({
      user: true,
      skills: { include: { skill: true } },
      assessmentAttempts: { where: { assessmentId: data.assessmentId } },
    });

    if (!student) {
      throw new Error("Student authentication required.");
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id: data.assessmentId },
      include: {
        questions: { orderBy: { order: "asc" } },
        skill: true,
      },
    });

    if (!assessment || assessment.type !== "CODING") {
      throw new Error("Coding assessment not found.");
    }

    const attemptNumber = student.assessmentAttempts.length + 1;
    const now = new Date();

    // Execute each question's code against all test cases
    const questionResults: CodingResultResponse["questionResults"] = [];
    let totalPassed = 0;
    let totalQuestions = assessment.questions.length;

    for (const q of assessment.questions) {
      const studentCode = data.codeSolutions[q.id] || "";
      const testCases = (q.testCases as unknown as TestCase[]) || [];

      if (!studentCode.trim()) {
        questionResults.push({
          questionId: q.id,
          question: q.question,
          passed: false,
          passedTests: 0,
          totalTests: testCases.length,
          executionTimeMs: 0,
          error: "No code submitted.",
          testResults: [],
        });
        continue;
      }

      const result = await executeCode({
        language: q.language || "python",
        sourceCode: studentCode,
        testCases,
        timeoutMs: 10_000,
      });

      if (result.passed) {
        totalPassed++;
      }

      questionResults.push({
        questionId: q.id,
        question: q.question,
        passed: result.passed,
        passedTests: result.passedTests,
        totalTests: result.totalTests,
        executionTimeMs: result.executionTimeMs,
        error: result.error,
        testResults: result.testResults,
      });

      // Save individual answer
      // (Will be linked to attempt after creation)
    }

    const percentage = totalQuestions > 0 ? Math.round((totalPassed / totalQuestions) * 100) : 0;
    const passed = percentage >= assessment.passingScore;

    // Create attempt record
    const attempt = await prisma.assessmentAttempt.create({
      data: {
        studentId: student.id,
        assessmentId: assessment.id,
        score: percentage,
        percentage,
        passed,
        startedAt: new Date(Date.now() - (data.timeSpentSeconds || 60) * 1000),
        completedAt: now,
        attemptNumber,
        timeSpentSeconds: data.timeSpentSeconds || 0,
        correctCount: totalPassed,
        totalCount: totalQuestions,
        details: questionResults as any,
      },
    });

    // Save answer records for each question
    for (const qr of questionResults) {
      await prisma.assessmentAnswer.create({
        data: {
          attemptId: attempt.id,
          questionId: qr.questionId,
          answerText: data.codeSolutions[qr.questionId] || "",
          isCorrect: qr.passed,
          pointsEarned: qr.passed ? 20 : 0,
        },
      });
    }

    // Update verification (reuse pattern from MCQ)
    const verificationResult = await updateVerificationAfterAssessment({
      student,
      assessment,
      percentage,
      passed,
      totalPassed,
      totalQuestions,
      now,
      evidencePrefix: "Coding Challenge",
    });

    return {
      attemptId: attempt.id,
      assessmentId: assessment.id,
      assessmentTitle: assessment.title,
      skillName: assessment.skillName,
      score: percentage,
      percentage,
      passed,
      passingScore: assessment.passingScore,
      timeSpentSeconds: data.timeSpentSeconds || 0,
      attemptNumber,
      completedAt: now.toISOString(),
      verificationLevel: verificationResult.finalLevel,
      verificationLabel: verificationResult.label,
      isVerified: passed || verificationResult.finalLevel !== "RESUME_DETECTED",
      newReadiness: verificationResult.readiness,
      questionResults,
    };
  });

// ---------------------------------------------------------------------------
// Phase 4B — SQL Assessment Submission
// ---------------------------------------------------------------------------

export interface SubmitSqlInput {
  assessmentId: string;
  /** questionId → student SQL query */
  sqlSolutions: Record<string, string>;
  timeSpentSeconds: number;
}

export interface SqlResultResponse {
  attemptId: string;
  assessmentId: string;
  assessmentTitle: string;
  skillName: string;
  score: number;
  percentage: number;
  passed: boolean;
  passingScore: number;
  timeSpentSeconds: number;
  attemptNumber: number;
  completedAt: string;
  verificationLevel: VerificationLevel;
  verificationLabel: string;
  isVerified: boolean;
  newReadiness?: number | undefined;
  questionResults: Array<{
    questionId: string;
    question: string;
    passed: boolean;
    executionTimeMs: number;
    error: string | null;
    rowsReturned: number;
    studentResult: Array<Record<string, any>>;
    expectedResult: Array<Record<string, any>>;
  }>;
}

/**
 * Server-side execution and scoring of SQL assessment.
 * Executes student SQL against in-memory SQLite sandbox.
 */
export const submitSqlAttempt = createServerFn({
  method: "POST",
})
  .validator((input: SubmitSqlInput) => input)
  .handler(async ({ data }): Promise<SqlResultResponse> => {
    const student = await getAuthenticatedStudentProfile({
      user: true,
      skills: { include: { skill: true } },
      assessmentAttempts: { where: { assessmentId: data.assessmentId } },
    });

    if (!student) {
      throw new Error("Student authentication required.");
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id: data.assessmentId },
      include: {
        questions: { orderBy: { order: "asc" } },
        skill: true,
      },
    });

    if (!assessment || assessment.type !== "SQL") {
      throw new Error("SQL assessment not found.");
    }

    const attemptNumber = student.assessmentAttempts.length + 1;
    const now = new Date();

    const questionResults: SqlResultResponse["questionResults"] = [];
    let totalPassed = 0;
    const totalQuestions = assessment.questions.length;

    for (const q of assessment.questions) {
      const studentSql = data.sqlSolutions[q.id] || "";

      if (!studentSql.trim()) {
        questionResults.push({
          questionId: q.id,
          question: q.question,
          passed: false,
          executionTimeMs: 0,
          error: "No SQL query submitted.",
          rowsReturned: 0,
          studentResult: [],
          expectedResult: [],
        });
        continue;
      }

      const result = await executeSqlQuery({
        studentSql,
        dbSchema: q.dbSchema || "",
        initialData: q.initialDbData || "",
        expectedQuery: q.solutionCode || "",
        timeoutMs: 5_000,
      });

      if (result.passed) {
        totalPassed++;
      }

      questionResults.push({
        questionId: q.id,
        question: q.question,
        passed: result.passed,
        executionTimeMs: result.executionTimeMs,
        error: result.error,
        rowsReturned: result.rowsReturned,
        studentResult: result.studentResult as any,
        expectedResult: (result.passed ? [] : result.expectedResult) as any,
      });
    }

    const percentage = totalQuestions > 0 ? Math.round((totalPassed / totalQuestions) * 100) : 0;
    const passed = percentage >= assessment.passingScore;

    const attempt = await prisma.assessmentAttempt.create({
      data: {
        studentId: student.id,
        assessmentId: assessment.id,
        score: percentage,
        percentage,
        passed,
        startedAt: new Date(Date.now() - (data.timeSpentSeconds || 60) * 1000),
        completedAt: now,
        attemptNumber,
        timeSpentSeconds: data.timeSpentSeconds || 0,
        correctCount: totalPassed,
        totalCount: totalQuestions,
        details: questionResults as any,
      },
    });

    for (const qr of questionResults) {
      await prisma.assessmentAnswer.create({
        data: {
          attemptId: attempt.id,
          questionId: qr.questionId,
          answerText: data.sqlSolutions[qr.questionId] || "",
          isCorrect: qr.passed,
          pointsEarned: qr.passed ? 20 : 0,
        },
      });
    }

    const verificationResult = await updateVerificationAfterAssessment({
      student,
      assessment,
      percentage,
      passed,
      totalPassed,
      totalQuestions,
      now,
      evidencePrefix: "SQL Challenge",
    });

    return {
      attemptId: attempt.id,
      assessmentId: assessment.id,
      assessmentTitle: assessment.title,
      skillName: assessment.skillName,
      score: percentage,
      percentage,
      passed,
      passingScore: assessment.passingScore,
      timeSpentSeconds: data.timeSpentSeconds || 0,
      attemptNumber,
      completedAt: now.toISOString(),
      verificationLevel: verificationResult.finalLevel,
      verificationLabel: verificationResult.label,
      isVerified: passed || verificationResult.finalLevel !== "RESUME_DETECTED",
      newReadiness: verificationResult.readiness,
      questionResults,
    };
  });

// ---------------------------------------------------------------------------
// Shared — Post-scoring verification update helper
// ---------------------------------------------------------------------------

async function updateVerificationAfterAssessment(params: {
  student: {
    id: string;
    skills: Array<{
      id: string;
      score: number;
      confidence: number | null;
      verificationLevel: VerificationLevel | string;
      assessmentScore: number | null;
      skill: { id: string; name: string };
    }>;
  };
  assessment: { skillName: string; title: string; skill: { id: string; name: string } | null };
  percentage: number;
  passed: boolean;
  totalPassed: number;
  totalQuestions: number;
  now: Date;
  evidencePrefix: string;
}): Promise<{ finalLevel: VerificationLevel; label: string; readiness: number }> {
  const { student, assessment, percentage, passed, totalPassed, totalQuestions, now, evidencePrefix } = params;

  let skill = assessment.skill;
  if (!skill) {
    skill = await prisma.skill.findFirst({
      where: { name: { equals: assessment.skillName, mode: "insensitive" } },
    });
    if (!skill) {
      skill = await prisma.skill.create({
        data: { name: assessment.skillName, demand: "High" },
      });
    }
  }

  let finalLevel: VerificationLevel = "RESUME_DETECTED";

  const existingStudentSkill = student.skills.find(
    (s) => s.skill.name.toLowerCase() === assessment.skillName.toLowerCase()
  );

  const currentLevel: VerificationLevel =
    existingStudentSkill ? ((existingStudentSkill.verificationLevel as VerificationLevel) || "RESUME_DETECTED") : "RESUME_DETECTED";

  if (passed) {
    finalLevel = "ASSESSMENT_VERIFIED";

    if (existingStudentSkill) {
      const currentOrder = VERIFICATION_PREFERENCE_ORDER[currentLevel] || 1;
      const assessmentOrder = VERIFICATION_PREFERENCE_ORDER["ASSESSMENT_VERIFIED"];

      // Never downgrade higher tiers
      const targetLevel: VerificationLevel =
        currentOrder > assessmentOrder
          ? currentLevel
          : "ASSESSMENT_VERIFIED";

      finalLevel = targetLevel;

      await prisma.studentSkill.update({
        where: { id: existingStudentSkill.id },
        data: {
          score: Math.max(existingStudentSkill.score, percentage),
          confidence: Math.max(existingStudentSkill.confidence || 80, 95),
          verificationLevel: targetLevel,
          assessmentScore: Math.max(existingStudentSkill.assessmentScore || 0, percentage),
          evidence: `Verified via ${evidencePrefix} (${percentage}%, ${totalPassed}/${totalQuestions} problems solved).`,
          evidenceSource: "Assessment",
          lastVerifiedAt: now,
          lastDemonstratedAt: now,
        },
      });
    } else {
      await prisma.studentSkill.create({
        data: {
          studentId: student.id,
          skillId: skill.id,
          score: percentage,
          confidence: 95,
          verificationLevel: "ASSESSMENT_VERIFIED",
          assessmentScore: percentage,
          evidence: `Verified via ${evidencePrefix} (${percentage}%, ${totalPassed}/${totalQuestions} problems solved).`,
          evidenceSource: "Assessment",
          lastVerifiedAt: now,
          lastDemonstratedAt: now,
        },
      });
    }

    // Create credential
    const existingCred = await prisma.credential.findFirst({
      where: {
        studentId: student.id,
        title: `${assessment.title} Verification`,
      },
    });
    if (!existingCred) {
      await prisma.credential.create({
        data: {
          studentId: student.id,
          title: `${assessment.title} Verification`,
          type: "ASSESSMENT",
          issuer: "SkillBridge",
          verified: true,
          score: percentage,
          skills: [assessment.skillName],
          issuedAt: now,
        },
      });
    }
  } else {
    if (existingStudentSkill) {
      finalLevel = currentLevel;
    }
  }

  // Recalculate readiness
  const { readiness } = await calculateStudentReadiness(student.id);
  await prisma.studentProfile.update({
    where: { id: student.id },
    data: { readiness },
  });

  const label =
    finalLevel === "ASSESSMENT_VERIFIED" ? "Assessment Verified"
    : finalLevel === "PROJECT_VERIFIED" ? "Project Verified"
    : finalLevel === "INSTITUTION_VERIFIED" ? "Institution Verified"
    : finalLevel === "EMPLOYER_VERIFIED" ? "Employer Verified"
    : "Resume Detected";

  return { finalLevel, label, readiness };
}
