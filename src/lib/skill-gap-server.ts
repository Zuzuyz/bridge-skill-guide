import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type {
  CareerSkillGapResult,
  SkillGapItem,
} from "@/lib/skill-gap-core.server";

/* =========================================================
   CLIENT-SAFE TYPES
========================================================= */

export type {
  CareerSkillGapResult,
  SkillGapItem,
};

/* =========================================================
   CAREER-SPECIFIC SKILL GAP
========================================================= */

export const getCareerSkillGap = createServerFn({
  method: "GET",
})
  .validator(
    z.object({
      careerId: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { getCareerSkillGapInternal } =
      await import("@/lib/skill-gap-core.server");

    /* exactOptionalPropertyTypes: don't pass an explicit undefined */
    return getCareerSkillGapInternal(
      data.careerId !== undefined ? { careerId: data.careerId } : {},
    );
  });

/* =========================================================
   LEGACY SKILL GAP
========================================================= */

export const analyzeStudentSkillGap = createServerFn({
  method: "GET",
}).handler(async () => {
  const { analyzeStudentSkillGapInternal } =
    await import("@/lib/skill-gap-core.server");

  return analyzeStudentSkillGapInternal();
});
