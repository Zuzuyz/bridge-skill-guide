import { prisma } from "@/server/db.server";
import { getAuthenticatedStudentProfile } from "@/server/auth-context";
import {
  computeCareerSkillGap,
  DEMAND_WEIGHTS,
  normalizeSkill,
  STRONG_SKILL_THRESHOLD,
  VERIFICATION_MULTIPLIERS,
  type SkillGapItem,
} from "@/lib/skill-gap-core.server";
import {
  getDemandFreshness,
  selectCurrentIndustryDemandBySkillId,
} from "@/lib/industry-demand-selector.server";
import {
  DEMAND_LEVEL_LABELS,
  VERIFICATION_LEVEL_LABELS,
} from "@/types";
import type {
  DemandSourceType,
  VerificationLevel,
} from "@/types";

import type {
  CareerMatchResult,
  ExplainableSkillMatch,
  InternshipMatchDetail,
  InternshipMatchResult,
  SkillMatchStatus,
} from "@/lib/matching-server";

/* =========================================================
   PHASE 10 — EXPLAINABLE MATCHING CORE (server only)

   Loaded exclusively through dynamic import from the
   createServerFn wrappers in matching-server.ts (same
   pattern as skill-gap-core.server.ts), so no src/server
   import ever reaches the client bundle.

   Score and explanation are separated:

   - The score comes from the SAME deterministic factors as
     the Phase 7 skill-gap engine (verified student score ×
     verification multiplier × importance × current industry
     demand weight).
   - The explanation exposes every factor that produced it.

   All student data is derived server-side from the
   authenticated session. Nothing is fabricated: a missing
   demand record, missing evidence, or missing requirement
   stays null and is reported honestly.
========================================================= */

/* =========================================================
   SHARED HELPERS
========================================================= */

function statusFromScore(
  hasRecord: boolean,
  score: number,
): SkillMatchStatus {
  if (!hasRecord || score === 0) return "MISSING";
  if (score >= STRONG_SKILL_THRESHOLD) return "MATCHED";
  return "PARTIAL";
}

function verificationLabelFor(
  level: string | null,
): string | null {
  if (!level) return null;
  return (
    VERIFICATION_LEVEL_LABELS[level as VerificationLevel] ??
    null
  );
}

function demandLabelFor(level: string | null): string | null {
  if (!level) return null;
  return (
    DEMAND_LEVEL_LABELS[
      level as keyof typeof DEMAND_LEVEL_LABELS
    ] ?? null
  );
}

function formatPoints(value: number): string {
  return (value * 100).toFixed(1);
}

function improvementHintFor(
  status: SkillMatchStatus,
  skillName: string,
  studentScore: number | null,
): string | null {
  if (status === "MATCHED") return null;
  if (studentScore !== null) {
    return `Improve ${skillName} from ${studentScore}/100 to the ${STRONG_SKILL_THRESHOLD}/100 target to increase your match.`;
  }
  return `No verified skill evidence for ${skillName} — add an assessment or project to increase your match.`;
}

function buildSummary(params: {
  title: string;
  matchPercentage: number;
  matchLabel: string | null;
  matched: number;
  partial: number;
  missing: number;
  total: number;
  formula: string;
  extraNotes: string[];
}): string {
  if (params.total === 0) {
    return `No matching requirement data available for ${params.title}.`;
  }

  const counts: string[] = [
    `${params.matched} of ${params.total} required skills meet the ${STRONG_SKILL_THRESHOLD}/100 target`,
  ];
  if (params.partial > 0) {
    counts.push(`${params.partial} partially match`);
  }
  if (params.missing > 0) {
    counts.push(
      `${params.missing} have no verified skill evidence`,
    );
  }

  return (
    `${params.title}: ${params.matchPercentage}% match` +
    `${params.matchLabel ? ` (${params.matchLabel})` : ""}. ` +
    `${counts.join(", ")}. ${params.formula}` +
    (params.extraNotes.length > 0
      ? ` ${params.extraNotes.join(" ")}`
      : "")
  );
}

function partition(
  skills: ExplainableSkillMatch[],
): {
  matched: ExplainableSkillMatch[];
  partial: ExplainableSkillMatch[];
  missing: ExplainableSkillMatch[];
} {
  return {
    matched: skills.filter((s) => s.status === "MATCHED"),
    partial: skills.filter((s) => s.status === "PARTIAL"),
    missing: skills.filter((s) => s.status === "MISSING"),
  };
}

/* =========================================================
   CAREER MATCH — fully reuses the Phase 7 engine
========================================================= */

function fromSkillGapItem(
  s: SkillGapItem,
): ExplainableSkillMatch {
  const status: SkillMatchStatus =
    s.status === "Strong"
      ? "MATCHED"
      : s.status === "Needs Improvement"
        ? "PARTIAL"
        : "MISSING";

  const studentScore = s.hasEvidence ? s.studentScore : null;

  return {
    skillId: s.skillId,
    skillName: s.skillName,
    studentScore,
    requiredScore: STRONG_SKILL_THRESHOLD,
    importance: s.importance,
    importanceLabel: s.importanceLabel,
    demandLevel: s.demandLevel,
    demandLevelLabel: s.demandLevelLabel,
    demandScore: s.demandScore,
    demandConfidence: s.demandConfidence,
    demandSourceType: s.demandSourceType,
    demandFreshnessLabel: s.demandFreshnessLabel,
    demandIsDemo: s.demandIsDemo,
    verificationLevel: s.verificationLevel,
    verificationLabel: s.verificationLabel,
    confidence: s.confidence,
    evidenceSource: s.evidenceSource,
    evidenceText: s.evidenceSummary,
    lastVerifiedAt: s.lastVerifiedAt,
    status,
    contribution: s.contribution,
    maxContribution: s.maxContribution,
    reason: s.explanation,
    improvementHint: improvementHintFor(
      status,
      s.skillName,
      studentScore,
    ),
  };
}

/**
 * Explainable career match. The score IS the Phase 7
 * readiness calculation — this only adapts and explains it.
 */
export async function getCareerMatchInternal(
  studentId: string,
  careerId: string,
): Promise<CareerMatchResult> {
  const gap = await computeCareerSkillGap(
    studentId,
    careerId,
  );

  const skills = gap.skills.map(fromSkillGapItem);
  const { matched, partial, missing } = partition(skills);

  const extraNotes: string[] = [];
  if (gap.isDemoData) {
    extraNotes.push(
      "Some demand labels come from the DEMO dataset, not live market evidence.",
    );
  }
  const demandMissingCount = gap.skills.filter(
    (s) => s.demandLevel === null,
  ).length;
  if (
    gap.totalSkills > 0 &&
    demandMissingCount === gap.totalSkills
  ) {
    extraNotes.push(
      "Industry demand data unavailable for these skills.",
    );
  }

  const summary = buildSummary({
    title: gap.careerTitle,
    matchPercentage: gap.readiness,
    matchLabel: gap.readinessLabel,
    matched: matched.length,
    partial: partial.length,
    missing: missing.length,
    total: gap.totalSkills,
    formula:
      "Score = your verified skill scores × verification level × career skill importance × current industry demand weight.",
    extraNotes,
  });

  return {
    careerId: gap.careerId,
    careerTitle: gap.careerTitle,
    careerSlug: gap.careerSlug,
    careerCategory: gap.careerCategory,
    matchPercentage: gap.readiness,
    matchLabel: gap.readinessLabel,
    summary,
    targetThreshold: STRONG_SKILL_THRESHOLD,
    totalRequiredSkills: gap.totalSkills,
    matchedCount: matched.length,
    partialCount: partial.length,
    missingCount: missing.length,
    skills,
    matched,
    partial,
    missing,
    isDemoData: gap.isDemoData,
    computedAt: gap.computedAt,
  };
}

/**
 * Authenticated entry point: identity comes from the
 * session only — never from a browser payload.
 */
export async function getCareerMatchForCurrentUser(
  careerId: string,
): Promise<CareerMatchResult> {
  const student = await getAuthenticatedStudentProfile();

  if (!student) {
    throw new Error("No student profile found.");
  }

  return getCareerMatchInternal(student.id, careerId);
}

/* =========================================================
   INTERNSHIP MATCH — extends the existing engine
========================================================= */

/**
 * Explainable internship match using the same contribution
 * formula as the career engine (importance is neutral
 * because InternshipSkill carries no importance field).
 */
export async function getInternshipMatchInternal(
  studentId: string,
  internshipId: string,
): Promise<InternshipMatchResult> {
  /*
   * Plain server-side read keyed by the authenticated
   * student id (derived from the session in the wrapper
   * above — never from the browser payload).
   */
  const student =
    await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        skills: { include: { skill: true } },
        studentCareers: { include: { career: true } },
      },
    });

  if (!student) {
    throw new Error("No student profile found.");
  }

  const internship =
    await prisma.internship.findUnique({
      where: { id: internshipId },
      include: {
        company: true,
        requiredSkills: {
          include: { skill: true },
        },
      },
    });

  if (!internship) {
    throw new Error("Internship not found.");
  }

  const required = internship.requiredSkills;

  /*
   * -------------------------------------------------------
   * CURRENT INDUSTRY DEMAND for these skills
   * (existing selector: non-expired only, prefers real
   * sources over DEMO, then confidence, then freshness)
   * -------------------------------------------------------
   */
  const demandRecords =
    required.length > 0
      ? await prisma.industryDemand.findMany({
          where: {
            skillId: {
              in: required.map((r) => r.skillId),
            },
          },
        })
      : [];

  const demandBySkillId =
    selectCurrentIndustryDemandBySkillId(demandRecords);

  /*
   * -------------------------------------------------------
   * CAREER ALIGNMENT from real data:
   * overlap between this internship's required skills and
   * the student's PRIMARY career requirements.
   * -------------------------------------------------------
   */
  const primaryCareer = student.studentCareers?.find(
    (sc) => sc.isPrimary,
  );

  let careerAlignment: number | null = null;
  let alignmentNote: string | null = null;

  if (!primaryCareer) {
    alignmentNote =
      "Career alignment not included: no primary career selected.";
  } else if (required.length === 0) {
    alignmentNote =
      "Career alignment not calculated: this listing has no required skills.";
  } else {
    const careerSkillRows =
      await prisma.careerSkill.findMany({
        where: {
          careerId: primaryCareer.careerId,
        },
        select: { skillId: true },
      });

    const careerSkillIds = new Set(
      careerSkillRows.map((cs) => cs.skillId),
    );

    const overlap = required.filter((r) =>
      careerSkillIds.has(r.skillId),
    ).length;

    careerAlignment = Math.round(
      (overlap / required.length) * 100,
    );
    alignmentNote = `${overlap} of ${required.length} required skills here are also required for your primary career (${primaryCareer.career.title}).`;
  }

  /* -------------------------------------------------------
   * PER-SKILL EXPLANATION using the shared formula
   * contribution = (score/100) × verification × importance × demand
   * -------------------------------------------------------
   */

  const studentSkillMap = new Map(
    student.skills.map((item) => [
      normalizeSkill(item.skill.name),
      item,
    ]),
  );

  const skills: ExplainableSkillMatch[] = [];
  const matchedSkills: string[] = [];
  const matchedSkillsDetails: InternshipMatchDetail[] = [];
  const weakSkills: string[] = [];
  const weakSkillsDetails: InternshipMatchDetail[] = [];
  const missingSkills: string[] = [];

  let isDemoData = false;
  let demandMissingCount = 0;

  for (const requiredSkill of required) {
    const skillName = requiredSkill.skill.name;
    const studentSkill = studentSkillMap.get(
      normalizeSkill(skillName),
    );

    const demandRecord =
      demandBySkillId.get(requiredSkill.skillId) ?? null;

    const demandLevel: string | null =
      demandRecord?.demandLevel ?? null;

    if (!demandRecord) {
      demandMissingCount += 1;
    }
    if (demandRecord?.sourceType === "DEMO") {
      isDemoData = true;
    }

    const hasDemandScore =
      demandRecord?.demandScore !== null &&
      demandRecord?.demandScore !== undefined;

    const demandFreshness = demandRecord
      ? getDemandFreshness(
          demandRecord.collectedAt,
          demandRecord.validUntil,
          demandRecord.sourceType as DemandSourceType,
        )
      : null;

    const isCurrentDemand =
      hasDemandScore &&
      demandFreshness !== null &&
      demandFreshness.status !== "Expired";

    /*
     * Same convention as the career engine: missing or
     * expired demand does NOT get an invented weight.
     */
    const dw = isCurrentDemand
      ? DEMAND_WEIGHTS[demandLevel ?? "STABLE"] ?? 0.6
      : 1.0;

    const rawLevel: string | null =
      studentSkill?.verificationLevel ?? null;
    const vm = rawLevel
      ? VERIFICATION_MULTIPLIERS[rawLevel] ?? 0.7
      : 0.7;

    /*
     * InternshipSkill has no importance column, so
     * importance stays null and its weight is neutral (1.0).
     * We do NOT invent an importance value.
     */
    const iw = 1.0;

    const hasRecord = !!studentSkill;
    const score = studentSkill?.score ?? 0;

    const contribution = (score / 100) * vm * iw * dw;
    const maxContribution = iw * dw;

    const status = statusFromScore(hasRecord, score);
    const verificationLabel = verificationLabelFor(rawLevel);
    const demandLevelLabel = demandLabelFor(demandLevel);

    /* Deterministic reason built from real factors only. */
    let reason: string;
    if (status === "MATCHED") {
      reason =
        `${skillName}: verified score ${score}/100 (${verificationLabel ?? "unverified"}) meets the ${STRONG_SKILL_THRESHOLD}/100 target. ` +
        `Contributes ${formatPoints(contribution)} of ${formatPoints(maxContribution)} weighted points` +
        (isCurrentDemand && demandLevelLabel
          ? `, weighted by ${demandLevelLabel} demand (${demandFreshness?.label ?? "current"})${demandRecord?.sourceType === "DEMO" ? " — DEMO dataset" : ""}.`
          : ".") +
        (hasRecord && studentSkill?.evidence
          ? ` Evidence: ${String(studentSkill.evidence).slice(0, 160)}`
          : "");
    } else if (status === "PARTIAL") {
      reason =
        `${skillName}: score ${score}/100 (${verificationLabel ?? "unverified"}) is below the ${STRONG_SKILL_THRESHOLD}/100 target. ` +
        `Contributes ${formatPoints(contribution)} of ${formatPoints(maxContribution)} weighted points` +
        (isCurrentDemand && demandLevelLabel
          ? `; ${demandLevelLabel} demand raises this skill's weight (${demandFreshness?.label ?? "current"}).`
          : ".") +
        (studentSkill?.evidenceSource
          ? ` Evidence source: ${studentSkill.evidenceSource}.`
          : "");
    } else {
      reason = hasRecord
        ? `${skillName}: no meaningful score on record (0/100) — contributes 0 of ${formatPoints(maxContribution)} weighted points. No usable skill evidence yet.`
        : `No verified skill evidence for ${skillName} in your profile — contributes 0 of ${formatPoints(maxContribution)} weighted points.` +
          (isCurrentDemand && demandLevelLabel
            ? ` It is still a required skill with ${demandLevelLabel} demand.`
            : ".");
    }

    skills.push({
      skillId: requiredSkill.skillId,
      skillName,
      studentScore: hasRecord ? score : null,
      requiredScore: STRONG_SKILL_THRESHOLD,
      importance: null,
      importanceLabel: null,
      demandLevel,
      demandLevelLabel,
      demandScore: demandRecord?.demandScore ?? null,
      demandConfidence: demandRecord?.confidence ?? null,
      demandSourceType: demandRecord?.sourceType ?? null,
      demandFreshnessLabel: demandFreshness?.label ?? null,
      demandIsDemo: demandRecord?.sourceType === "DEMO",
      verificationLevel: rawLevel,
      verificationLabel,
      confidence: studentSkill?.confidence ?? null,
      evidenceSource: studentSkill?.evidenceSource ?? null,
      evidenceText: studentSkill?.evidence
        ? String(studentSkill.evidence)
        : null,
      lastVerifiedAt: studentSkill?.lastVerifiedAt
        ? studentSkill.lastVerifiedAt.toISOString()
        : null,
      status,
      contribution,
      maxContribution,
      reason,
      improvementHint: improvementHintFor(
        status,
        skillName,
        hasRecord ? score : null,
      ),
    });

    /* Legacy arrays kept for the existing UI contract. */
    if (status === "MATCHED") {
      matchedSkills.push(skillName);
      matchedSkillsDetails.push({
        name: skillName,
        score,
        verificationLevel: rawLevel ?? "RESUME_DETECTED",
        verificationLabel:
          verificationLabel ?? "Resume Detected",
        evidence: studentSkill?.evidence || undefined,
      });
    } else if (status === "PARTIAL") {
      weakSkills.push(skillName);
      weakSkillsDetails.push({
        name: skillName,
        score,
        verificationLevel: rawLevel ?? "RESUME_DETECTED",
        verificationLabel:
          verificationLabel ?? "Resume Detected",
        evidence: studentSkill?.evidence || undefined,
      });
    } else {
      missingSkills.push(skillName);
    }
  }

  /* -------------------------------------------------------
   * SCORE — same ratio as career readiness:
   * Σcontribution / ΣmaxContribution
   * -------------------------------------------------------
   */

  const totalMaxContribution = skills.reduce(
    (sum, s) => sum + s.maxContribution,
    0,
  );
  const totalContribution = skills.reduce(
    (sum, s) => sum + s.contribution,
    0,
  );

  const hasRequirementData = required.length > 0;

  const skillMatch = hasRequirementData
    ? Math.min(
        100,
        Math.round(
          (totalContribution / totalMaxContribution) * 100,
        ),
      )
    : 0;

  /*
   * Existing 80/20 blend kept, but both components are now
   * real data. Without a primary career the alignment
   * component is honestly absent, so the score is skill
   * coverage alone.
   */
  const matchPercentage =
    hasRequirementData && careerAlignment !== null
      ? Math.round(skillMatch * 0.8 + careerAlignment * 0.2)
      : skillMatch;

  const { matched, partial, missing } = partition(skills);

  const extraNotes: string[] = [];
  if (careerAlignment === null && alignmentNote) {
    extraNotes.push(alignmentNote);
  }
  if (
    hasRequirementData &&
    demandMissingCount === required.length
  ) {
    extraNotes.push(
      "Industry demand data unavailable for these skills.",
    );
  }
  if (isDemoData) {
    extraNotes.push(
      "Some demand labels come from the DEMO dataset, not live market evidence.",
    );
  }

  const summary = buildSummary({
    title: internship.role,
    matchPercentage,
    matchLabel: null,
    matched: matched.length,
    partial: partial.length,
    missing: missing.length,
    total: required.length,
    formula:
      "Score = your verified skill scores × verification level × current industry demand weight" +
      (careerAlignment !== null
        ? " (80%) plus real skill overlap with your primary career (20%)."
        : "."),
    extraNotes,
  });

  return {
    internshipId: internship.id,
    matchPercentage,
    matchLabel: null,
    summary,
    targetThreshold: STRONG_SKILL_THRESHOLD,
    totalRequiredSkills: required.length,
    matchedCount: matched.length,
    partialCount: partial.length,
    missingCount: missing.length,
    skills,
    matched,
    partial,
    missing,
    isDemoData,
    computedAt: new Date().toISOString(),
    skillMatch,
    careerAlignment,
    alignmentNote,
    hasRequirementData,
    matchedSkills,
    matchedSkillsDetails,
    weakSkills,
    weakSkillsDetails,
    missingSkills,
  };
}

/**
 * Authenticated entry point: identity comes from the
 * session only — never from a browser payload.
 */
export async function getInternshipMatchForCurrentUser(
  internshipId: string,
): Promise<InternshipMatchResult> {
  const student = await getAuthenticatedStudentProfile();

  if (!student) {
    throw new Error("No student profile found.");
  }

  return getInternshipMatchInternal(
    student.id,
    internshipId,
  );
}
