import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/* =========================================================
   PHASE 10 — EXPLAINABLE MATCHING (client-safe module)

   Exports only client-safe types and createServerFn
   wrappers. All calculation logic lives in
   matching-core.server.ts and is loaded through dynamic
   import inside handlers (same pattern as
   skill-gap-server.ts), so no src/server import ever
   reaches the client bundle.

   Answers: "Why does this student match this
   career/internship?" — the score comes from real data
   (the Phase 7 skill-gap factors) and the structured
   response exposes every factor behind it.
========================================================= */

/* =========================================================
   CLIENT-SAFE TYPES
========================================================= */

export type SkillMatchStatus =
  | "MATCHED"
  | "PARTIAL"
  | "MISSING";

export type ExplainableSkillMatch = {
  skillId: string;
  skillName: string;

  /**
   * null means the student has NO record for this skill —
   * which is different from a record with score 0.
   */
  studentScore: number | null;

  /** Target threshold used for MATCHED (shared constant). */
  requiredScore: number | null;

  /**
   * CareerSkill.importance (1–5). null when the
   * requirement side has no importance (e.g. internships).
   */
  importance: number | null;
  importanceLabel: string | null;

  demandLevel: string | null;
  demandLevelLabel: string | null;
  demandScore: number | null;
  demandConfidence: string | null;
  demandSourceType: string | null;
  demandFreshnessLabel: string | null;
  demandIsDemo: boolean;

  verificationLevel: string | null;
  verificationLabel: string | null;
  confidence: number | null;
  evidenceSource: string | null;
  evidenceText: string | null;
  lastVerifiedAt: string | null;

  status: SkillMatchStatus;

  /** Achieved fraction of this skill's weighted maximum (same units as the skill-gap engine). */
  contribution: number;
  maxContribution: number;

  /** Deterministic reason generated from the actual calculation factors. */
  reason: string;

  /**
   * Present only when the calculation genuinely supports
   * improvement (status !== MATCHED).
   */
  improvementHint: string | null;
};

export type ExplainableMatchResult = {
  matchPercentage: number;
  matchLabel: string | null;
  summary: string;
  targetThreshold: number;
  totalRequiredSkills: number;
  matchedCount: number;
  partialCount: number;
  missingCount: number;
  /** Every required skill, in requirement order. */
  skills: ExplainableSkillMatch[];
  matched: ExplainableSkillMatch[];
  partial: ExplainableSkillMatch[];
  missing: ExplainableSkillMatch[];
  /** True when at least one demand label comes from the DEMO dataset. */
  isDemoData: boolean;
  computedAt: string;
};

export type InternshipMatchDetail = {
  name: string;
  score: number;
  verificationLevel: string;
  verificationLabel: string;
  evidence?: string | undefined;
};

export type InternshipMatchResult = ExplainableMatchResult & {
  internshipId: string;
  skillMatch: number;
  /**
   * Real skill overlap between this internship and the
   * student's PRIMARY career. null = not calculated (no
   * primary career or no requirements) — never a fake 50.
   */
  careerAlignment: number | null;
  alignmentNote: string | null;
  hasRequirementData: boolean;
  /* Legacy arrays kept so existing UI keeps working. */
  matchedSkills: string[];
  matchedSkillsDetails: InternshipMatchDetail[];
  weakSkills: string[];
  weakSkillsDetails: InternshipMatchDetail[];
  missingSkills: string[];
};

export type CareerMatchResult = ExplainableMatchResult & {
  careerId: string;
  careerTitle: string;
  careerSlug: string;
  careerCategory: string;
};

/* =========================================================
   SERVER FUNCTIONS
========================================================= */

export const getCareerMatch = createServerFn({
  method: "GET",
})
  .validator(
    z.object({
      careerId: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const { getCareerMatchForCurrentUser } = await import(
      "@/lib/matching-core.server"
    );

    return getCareerMatchForCurrentUser(data.careerId);
  });

export const getInternshipMatch = createServerFn({
  method: "GET",
})
  .validator((internshipId: string) => internshipId)
  .handler(async ({ data: internshipId }) => {
    const { getInternshipMatchForCurrentUser } =
      await import("@/lib/matching-core.server");

    return getInternshipMatchForCurrentUser(internshipId);
  });
