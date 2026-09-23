import { z } from "zod";

import { prisma } from "@/lib/skill-gap-db.server";
import { getAuthenticatedStudentProfile } from "@/server/auth-context";
import {
  getDemandFreshness,
  selectCurrentIndustryDemandBySkillId,
} from "@/lib/industry-demand-selector.server";

/* =========================================================
   CONSTANTS & WEIGHTS
========================================================= */

/** Verification multipliers — deterministic, no AI */
export const VERIFICATION_MULTIPLIERS: Record<string, number> = {
  RESUME_DETECTED: 0.70,
  ASSESSMENT_VERIFIED: 0.85,
  PROJECT_VERIFIED: 0.90,
  INSTITUTION_VERIFIED: 0.95,
  EMPLOYER_VERIFIED: 1.00,
};

/** Demand level weights — from IndustryDemand.demandLevel */
export const DEMAND_WEIGHTS: Record<string, number> = {
  HIGH: 1.00,
  GROWING: 0.90,
  EMERGING: 0.75,
  STABLE: 0.60,
  LOW: 0.40,
};

/** Importance weights — from CareerSkill.importance (integer 1–5) */
export function importanceWeight(importance: number): number {
  if (importance >= 5) return 1.00;   // CORE
  if (importance === 4) return 0.875; // VERY IMPORTANT
  if (importance === 3) return 0.75;  // IMPORTANT
  if (importance === 2) return 0.625; // USEFUL
  return 0.50;                        // NICE TO HAVE
}

export function importanceLabel(importance: number): string {
  if (importance >= 5) return "Core Skill";
  if (importance === 4) return "Very Important";
  if (importance === 3) return "Important";
  if (importance === 2) return "Useful";
  return "Nice to Have";
}

/* =========================================================
   MATCH TARGET THRESHOLD
========================================================= */

/**
 * A student skill counts as fully matched ("Strong" / MATCHED)
 * at or above this score. Shared by the Phase 7 gap engine,
 * the Phase 8 roadmap target, and the Phase 10 explainable
 * matching engine so every surface uses one threshold.
 */
export const STRONG_SKILL_THRESHOLD = 80;

/* =========================================================
   READINESS LABEL
========================================================= */

export function readinessLabel(score: number): string {
  if (score >= 85) return "Highly Ready";
  if (score >= 70) return "Ready with Minor Gaps";
  if (score >= 50) return "Developing";
  if (score >= 30) return "Significant Gaps";
  return "Early Stage";
}

/* =========================================================
   NORMALIZE SKILL NAME
========================================================= */

export function normalizeSkill(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ");
}

/* =========================================================
   TYPES
========================================================= */

export interface SkillGapItem {
  skillId: string;
  skillName: string;
  importance: number;
  importanceLabel: string;
  importanceWeight: number;
  demandLevel: string | null;
  demandLevelLabel: string;
  demandWeight: number;
  studentScore: number;
  verificationLevel: string | null;
  verificationLabel: string | null;
  verificationMultiplier: number;
  contribution: number;
  maxContribution: number;
  status: "Strong" | "Needs Improvement" | "Missing";
  gapPriority: number;
  explanation: string;
  hasEvidence: boolean;
  evidenceSummary: string | null;
  /* Student evidence detail (Phase 10 explainability) */
  confidence: number | null;
  evidenceSource: string | null;
  lastVerifiedAt: string | null;
  /* Demand detail (Phase 10 explainability) */
  demandScore: number | null;
  demandConfidence: string | null;
  demandSourceType: string | null;
  demandFreshnessLabel: string | null;
  demandIsDemo: boolean;
}

export interface CareerSkillGapResult {
  careerId: string;
  careerTitle: string;
  careerSlug: string;
  careerCategory: string;
  readiness: number;
  readinessLabel: string;
  totalSkills: number;
  strongCount: number;
  needsImprovementCount: number;
  missingCount: number;
  skills: SkillGapItem[];
  priorityGaps: SkillGapItem[];
  strengths: SkillGapItem[];
  isDemoData: boolean;
  computedAt: string;
}

/* =========================================================
   INTERNAL ENGINE — called from both server fns
========================================================= */

export async function computeCareerSkillGap(
  studentId: string,
  careerId: string,
): Promise<CareerSkillGapResult> {
  /* --- Load career + required skills -------------------- */
  const career = await prisma.career.findUnique({
    where: { id: careerId },
    include: {
      requiredSkills: {
        include: { skill: true },
        orderBy: { importance: "desc" },
      },
    },
  });

  if (!career) {
    throw new Error(`Career ${careerId} not found.`);
  }

  /* --- Load student's skills ---------------------------- */
  const studentSkills = await prisma.studentSkill.findMany({
    where: { studentId },
    include: { skill: true },
  });

  /* --- Load industry demand for this career ------------- */
  const industryDemands = await prisma.industryDemand.findMany({
    where: { careerId },
  });

  const demandBySkillId = selectCurrentIndustryDemandBySkillId(
    industryDemands,
  );

  /* --- Build student skill lookup by normalized name ---- */
  const studentSkillMap = new Map(
    studentSkills.map((ss) => [normalizeSkill(ss.skill.name), ss]),
  );

  /* --- Process each required career skill --------------- */
  const skills: SkillGapItem[] = [];
  let isDemoData = false;

  for (const careerSkill of career.requiredSkills) {
    const skillName = careerSkill.skill.name;
    const importance = careerSkill.importance;
    const iw = importanceWeight(importance);

    /* Demand from IndustryDemand table */

    const demandRecord = demandBySkillId.get(careerSkill.skillId);

    const demandLevel = demandRecord?.demandLevel ?? null;

    const hasDemandScore =
      demandRecord?.demandScore !== null &&
      demandRecord?.demandScore !== undefined;

    const demandFreshness = demandRecord
      ? getDemandFreshness(
          demandRecord.collectedAt,
          demandRecord.validUntil,
          demandRecord.sourceType as Parameters<
            typeof getDemandFreshness
          >[2],
        )
      : null;

    const isCurrentDemand =
      hasDemandScore &&
      demandFreshness !== null &&
      demandFreshness.status !== "Expired";

    /*
     * Current demand influences readiness.
     * Expired or missing demand does not get an
     * invented Stable Demand weight.
     */
    const dw = isCurrentDemand
      ? (DEMAND_WEIGHTS[demandLevel ?? "STABLE"] ?? 0.60)
      : 1.0;

    if (demandRecord?.sourceType === "DEMO") {
      isDemoData = true;
    }

    const demandLevelLabels: Record<string, string> = {
      HIGH: "High Demand",
      GROWING: "Growing Demand",
      EMERGING: "Emerging Demand",
      STABLE: "Stable Demand",
      LOW: "Low Demand",
    };

    const demandLevelLabel = demandLevel
      ? (demandLevelLabels[demandLevel] ?? "Unknown Demand")
      : "No verified demand data";

    /* Student skill match */
    const studentSkill = studentSkillMap.get(normalizeSkill(skillName));
    const studentScore = studentSkill?.score ?? 0;

    /* Verification */
    const rawLevel = studentSkill?.verificationLevel ?? null;
    const vm = rawLevel
      ? (VERIFICATION_MULTIPLIERS[rawLevel] ?? 0.70)
      : 0.70;

    const verificationLabels: Record<string, string> = {
      RESUME_DETECTED: "Resume Detected",
      ASSESSMENT_VERIFIED: "Assessment Verified",
      PROJECT_VERIFIED: "Project Verified",
      INSTITUTION_VERIFIED: "Institution Verified",
      EMPLOYER_VERIFIED: "Employer Verified",
    };

    const verificationLabel = rawLevel
      ? (verificationLabels[rawLevel] ?? null)
      : null;

    /* Contribution formula */
    const contribution = (studentScore / 100) * vm * iw * dw;
    const maxContribution = iw * dw;

    /* Status */
    let status: "Strong" | "Needs Improvement" | "Missing";
    if (studentScore >= STRONG_SKILL_THRESHOLD) {
      status = "Strong";
    } else if (studentScore > 0) {
      status = "Needs Improvement";
    } else {
      status = "Missing";
    }

    /* Gap priority — higher = more urgent to fix */
    const gapPriority =
      status === "Strong"
        ? 0
        : (100 - studentScore) * iw * dw;

    /* Deterministic explanation */
    let explanation: string;
    if (status === "Strong") {
      explanation = `${skillName} is well-established (score: ${studentScore}/100, ${verificationLabel ?? "not verified"}). Contributes ${(contribution * 100).toFixed(1)} of ${(maxContribution * 100).toFixed(1)} possible points.`;
    } else if (status === "Needs Improvement") {
      explanation = `${skillName} needs improvement (score: ${studentScore}/100). Importance: ${importanceLabel(importance)}, Demand: ${demandLevelLabel}. Contributes ${(contribution * 100).toFixed(1)} of ${(maxContribution * 100).toFixed(1)} possible points.`;
    } else {
      explanation = `${skillName} is missing from your profile. It is a ${importanceLabel(importance)} skill. Industry demand: ${demandLevelLabel}. Adding evidence would contribute up to ${(maxContribution * 100).toFixed(1)} points.`;
    }

    const evidenceSummary = studentSkill?.evidence
      ? String(studentSkill.evidence).slice(0, 120)
      : null;

    skills.push({
      skillId: careerSkill.skillId,
      skillName,
      importance,
      importanceLabel: importanceLabel(importance),
      importanceWeight: iw,
      demandLevel,
      demandLevelLabel,
      demandWeight: dw,
      studentScore,
      verificationLevel: rawLevel,
      verificationLabel,
      verificationMultiplier: vm,
      contribution,
      maxContribution,
      status,
      gapPriority,
      explanation,
      hasEvidence: !!studentSkill,
      evidenceSummary,
      confidence: studentSkill?.confidence ?? null,
      evidenceSource: studentSkill?.evidenceSource ?? null,
      lastVerifiedAt: studentSkill?.lastVerifiedAt
        ? studentSkill.lastVerifiedAt.toISOString()
        : null,
      demandScore: demandRecord?.demandScore ?? null,
      demandConfidence: demandRecord?.confidence ?? null,
      demandSourceType: demandRecord?.sourceType ?? null,
      demandFreshnessLabel: demandFreshness?.label ?? null,
      demandIsDemo: demandRecord?.sourceType === "DEMO",
    });
  }

  /* --- Readiness score ---------------------------------- */
  const totalMaxContribution = skills.reduce(
    (sum, s) => sum + s.maxContribution,
    0,
  );
  const totalContribution = skills.reduce(
    (sum, s) => sum + s.contribution,
    0,
  );

  const readinessScore =
    totalMaxContribution > 0
      ? Math.min(
          100,
          Math.round((totalContribution / totalMaxContribution) * 100),
        )
      : 0;

  /* --- Upsert SkillGap table (for dashboard / other consumers) */
  for (const s of skills) {
    await prisma.skillGap.upsert({
      where: {
        studentId_skillId: {
          studentId,
          skillId: s.skillId,
        },
      },
      update: {
        score: s.studentScore,
        status:
          s.status === "Strong"
            ? "STRONG"
            : s.status === "Needs Improvement"
              ? "NEEDS_IMPROVEMENT"
              : "MISSING",
      },
      create: {
        studentId,
        skillId: s.skillId,
        score: s.studentScore,
        status:
          s.status === "Strong"
            ? "STRONG"
            : s.status === "Needs Improvement"
              ? "NEEDS_IMPROVEMENT"
              : "MISSING",
      },
    });
  }

  /* --- Derived lists ------------------------------------ */
  const strong = skills.filter((s) => s.status === "Strong");
  const needsImprovement = skills.filter(
    (s) => s.status === "Needs Improvement",
  );
  const missing = skills.filter((s) => s.status === "Missing");

  const priorityGaps = [...missing, ...needsImprovement]
    .sort((a, b) => b.gapPriority - a.gapPriority)
    .slice(0, 8);

  const strengths = [...strong].sort(
    (a, b) => b.studentScore - a.studentScore,
  );

  return {
    careerId: career.id,
    careerTitle: career.title,
    careerSlug: career.slug,
    careerCategory: career.category,
    readiness: readinessScore,
    readinessLabel: readinessLabel(readinessScore),
    totalSkills: skills.length,
    strongCount: strong.length,
    needsImprovementCount: needsImprovement.length,
    missingCount: missing.length,
    skills,
    priorityGaps,
    strengths,
    isDemoData,
    computedAt: new Date().toISOString(),
  };
}

/* =========================================================
   PUBLIC SERVER FUNCTION — getCareerSkillGap
   (Phase 7A — career-specific, deterministic)
========================================================= */

export async function getCareerSkillGapInternal(data: {
  careerId?: string;
}) {
  const student = await getAuthenticatedStudentProfile({
    user: true,
    studentCareers: {
      include: { career: true },
    },
  });

  if (!student) {
    throw new Error(
      "No student profile found. Please register a student account first.",
    );
  }

  let careerId = data.careerId;

  if (!careerId) {
    const primaryCareer = (student as any).studentCareers?.find(
      (sc: any) => sc.isPrimary,
    );

    careerId = primaryCareer?.careerId;
  }

  if (!careerId) {
    const firstCareer = await prisma.career.findFirst({
      orderBy: { title: "asc" },
    });

    if (!firstCareer) {
      throw new Error(
        "No careers are configured in the platform yet. Please contact your administrator.",
      );
    }

    careerId = firstCareer.id;
  }

  return computeCareerSkillGap(student.id, careerId);
}

export async function analyzeStudentSkillGapInternal() {
  const student = await getAuthenticatedStudentProfile({
    user: true,
    studentCareers: {
      include: { career: true },
    },
  });

  if (!student) {
    throw new Error(
      "No student profile found. Please register a student account first.",
    );
  }

  const primaryCareer = (student as any).studentCareers?.find(
    (sc: any) => sc.isPrimary,
  );

  let careerId: string | undefined = primaryCareer?.careerId;

  if (!careerId) {
    const firstCareer = await prisma.career.findFirst({
      orderBy: { title: "asc" },
    });
    careerId = firstCareer?.id;
  }

  if (!careerId) {
    /* Return empty legacy-shaped result */
    return {
      targetRole: student.targetRole ?? "AI Engineer",
      readiness: student.readiness ?? 0,
      gaps: [],
      explanation: {
        summary:
          "No career has been selected yet. Please choose a target career to see your skill gap analysis.",
        strengths: [],
        priorityGaps: [],
        recommendations: [
          "Go to Career Direction to select your primary career.",
        ],
      },
    };
  }

  const result = await computeCareerSkillGap(student.id, careerId);

  /* Map to legacy shape */
  const gaps = result.skills.map((s) => ({
    skill: s.skillName,
    score: s.studentScore,
    status: s.status,
    verificationLevel: s.verificationLevel,
    verificationLabel: s.verificationLabel,
    hasAssessment:
      s.verificationLevel === "ASSESSMENT_VERIFIED" ||
      s.verificationLevel === "PROJECT_VERIFIED" ||
      s.verificationLevel === "INSTITUTION_VERIFIED" ||
      s.verificationLevel === "EMPLOYER_VERIFIED",
  }));

  const strong = gaps.filter((g) => g.status === "Strong");
  const missing = gaps.filter((g) => g.status === "Missing");
  const improvement = gaps.filter((g) => g.status === "Needs Improvement");

  const summary =
    `Your career-specific readiness for ${result.careerTitle} is ${result.readiness}/100 (${result.readinessLabel}). ` +
    `You have ${strong.length} strong skills, ${improvement.length} to improve, and ${missing.length} missing.`;

  const recommendations: string[] = [];
  if (missing.length > 0) {
    recommendations.push(
      `Prioritize learning: ${missing
        .slice(0, 3)
        .map((g) => g.skill)
        .join(", ")}.`,
    );
  }
  if (improvement.length > 0) {
    recommendations.push(
      `Improve through projects: ${improvement
        .slice(0, 3)
        .map((g) => g.skill)
        .join(", ")}.`,
    );
  }
  recommendations.push(
    "Use the SkillBridge roadmap to learn priority gaps in sequence before applying.",
  );

  return {
    targetRole: result.careerTitle,
    readiness: result.readiness,
    gaps,
    explanation: {
      summary,
      strengths: strong.map((g) => `Strong foundation in ${g.skill}.`),
      priorityGaps: [...missing, ...improvement]
        .slice(0, 5)
        .map((g) => g.skill),
      recommendations,
    },
  };
}
