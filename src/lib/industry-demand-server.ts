import { createServerFn } from "@tanstack/react-start";

import type {
  CareerDemandProfile,
  IndustryDemandSkillItem,
  DemandLevel,
} from "@/types";

type CareerDemandParams = {
  careerId?: string;
  slug?: string;
};

type IndustryDemandParams = {
  query?: string;
  category?: string;
  careerId?: string;
};

export const getCareerDemandProfile = createServerFn({
  method: "GET",
})
  .validator((params?: CareerDemandParams) => params)
  .handler(async ({ data }): Promise<CareerDemandProfile | null> => {
    const { getCareerDemandProfile: fetchCareerDemandProfileInternal } =
      await import("@/lib/industry-demand-core.server");

    return fetchCareerDemandProfileInternal(
      data?.careerId,
      data?.slug,
    );
  });

export const getAllIndustryDemand = createServerFn({
  method: "GET",
})
  .validator((params?: IndustryDemandParams) => params)
  .handler(async ({ data }) => {
    const { getAllIndustryDemandInternal } = await import(
      "@/lib/industry-demand-core.server"
    );

    return getAllIndustryDemandInternal(data);
  });

export const getIndustryDemandForSkill = createServerFn({
  method: "GET",
})
  .validator((params: { skillId: string }) => params)
  .handler(async ({ data }) => {
    const { getIndustryDemandForSkillInternal } = await import(
      "@/lib/industry-demand-core.server"
    );

    return getIndustryDemandForSkillInternal(data);
  });

export type { CareerDemandProfile, IndustryDemandSkillItem, DemandLevel };
