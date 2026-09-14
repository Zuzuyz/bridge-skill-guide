import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/server/db";
import { getAuthenticatedStudentProfile } from "@/server/auth-context";
// @ts-expect-error seed-industry-demand is a .mjs script without TS types
import { seedIndustryDemand } from "../../prisma/seed-industry-demand.mjs";
import {
  DEMAND_LEVEL_LABELS,
  DEMAND_SOURCE_LABELS,
  type DemandFreshnessStatus,
  type DemandLevel,
  type DemandSourceType,
  type IndustryDemandSkillItem,
  type CareerDemandProfile,
} from "@/types";

/**
 * Evaluates the data freshness status for an industry demand record.
 * Fresh: < 30 days old
 * Aging: 30 - 90 days old
 * Expired: > 90 days old
 */
export function getDemandFreshness(
  collectedAt: Date | string,
  validUntil?: Date | string | null,
  sourceType: DemandSourceType = "DEMO"
): DemandFreshnessStatus {
  const isDemo = sourceType === "DEMO";
  const collectedDate = new Date(collectedAt);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - collectedDate.getTime());
  const daysOld = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let status: "Fresh" | "Aging" | "Expired" = "Fresh";
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
    notes: isDemo
      ? "Seeded benchmark dataset for SkillBridge prototype. Not live labor market statistics."
      : null,
  };
}

/**
 * Ensures the database contains industry demand seed data.
 */
async function ensureIndustryDemandSeeded() {
  const count = await prisma.industryDemand.count();
  if (count === 0) {
    await seedIndustryDemand();
  }
}

/**
 * Helper to convert numerical importance to string label.
 */
function getImportanceLabel(importance: number): string {
  return importance === 5
    ? "Core Skill"
    : importance === 4
      ? "Very Important"
      : importance === 3
        ? "Important"
        : importance === 2
          ? "Useful"
          : "Nice to Have";
}

/**
 * Internal logic for fetching career demand profile.
 */
async function fetchCareerDemandProfileInternal(
  careerId?: string,
  slug?: string
): Promise<CareerDemandProfile | null> {
  await ensureIndustryDemandSeeded();

  if (!careerId && !slug) {
    return null;
  }

  const whereCondition = careerId
    ? { id: careerId }
    : slug
      ? { slug }
      : { id: "non-existent-id" };

  const career = await prisma.career.findFirst({
    where: whereCondition,
    include: {
      requiredSkills: {
        include: { skill: true },
        orderBy: { importance: "desc" },
      },
      industryDemands: {
        include: { skill: true },
      },
    },
  });

  if (!career) {
    return null;
  }

  // Map demand records by skill ID
  const demandBySkillId = new Map(
    career.industryDemands.map((d) => [d.skillId, d])
  );

  let highDemandCount = 0;
  let growingDemandCount = 0;

  const mappedSkills: IndustryDemandSkillItem[] = career.requiredSkills.map(
    (rs) => {
      const demandRecord = demandBySkillId.get(rs.skillId);

      const level: DemandLevel =
        (demandRecord?.demandLevel as DemandLevel) || "STABLE";
      const sourceType: DemandSourceType =
        (demandRecord?.sourceType as DemandSourceType) || "DEMO";
      const score = demandRecord?.demandScore ?? 65;

      if (level === "HIGH") highDemandCount++;
      if (level === "GROWING") growingDemandCount++;

      const collectedAt = demandRecord?.collectedAt
        ? demandRecord.collectedAt.toISOString()
        : new Date().toISOString();
      const validUntil = demandRecord?.validUntil
        ? demandRecord.validUntil.toISOString()
        : null;

      const freshness = getDemandFreshness(collectedAt, validUntil, sourceType);

      return {
        demandId: demandRecord?.id || `demo-${rs.skillId}`,
        skillId: rs.skillId,
        skillName: rs.skill.name,
        careerImportance: rs.importance,
        importanceLabel: getImportanceLabel(rs.importance),
        demandLevel: level,
        demandLevelLabel: DEMAND_LEVEL_LABELS[level] || "Stable Demand",
        demandScore: score,
        sourceType,
        sourceTypeLabel: DEMAND_SOURCE_LABELS[sourceType] || "Demo Dataset",
        sourceName:
          demandRecord?.sourceName || "SkillBridge Demo Industry Dataset",
        collectedAt,
        validUntil,
        freshness,
        notes: demandRecord?.notes || null,
      };
    }
  );

  return {
    career: {
      id: career.id,
      title: career.title,
      slug: career.slug,
      category: career.category,
      description: career.description,
    },
    totalDemandSkillsCount: mappedSkills.length,
    highDemandCount,
    growingDemandCount,
    skills: mappedSkills,
    sourceDisclaimer: {
      isDemo: true,
      notice:
        "This prototype uses seeded industry-demand data. Production deployment will connect verified industry-demand sources with source attribution and freshness tracking.",
      sourceName: "SkillBridge Demo Industry Dataset",
    },
  };
}

/**
 * Fetch complete Industry Demand Profile for a given career (by ID or Slug).
 */
export const getCareerDemandProfile = createServerFn({
  method: "GET",
})
  .validator((params?: { careerId?: string; slug?: string }) => params)
  .handler(
    async ({ data }): Promise<CareerDemandProfile | null> => {
      return fetchCareerDemandProfileInternal(data?.careerId, data?.slug);
    }
  );

/**
 * Fetch all careers with their industry demand summaries for the Industry Demand Explorer.
 */
export const getAllIndustryDemand = createServerFn({
  method: "GET",
})
  .validator(
    (params?: { query?: string; category?: string; careerId?: string }) =>
      params
  )
  .handler(
    async ({ data }): Promise<{
      careers: Array<{
        id: string;
        title: string;
        slug: string;
        category: string;
        description: string;
        totalSkillsCount: number;
        highDemandCount: number;
        growingDemandCount: number;
        topHighDemandSkills: Array<{
          name: string;
          level: DemandLevel;
          score: number | null;
          importance: number;
        }>;
        skills: IndustryDemandSkillItem[];
      }>;
      categories: string[];
      selectedCareerProfile: CareerDemandProfile | null;
      studentPrimaryCareer: {
        id: string;
        title: string;
        slug: string;
        category: string;
      } | null;
      demoNotice: {
        isDemo: boolean;
        text: string;
      };
    }> => {
      await ensureIndustryDemandSeeded();

      const query = data?.query;
      const category = data?.category;
      const careerId = data?.careerId;

      const allCareers = await prisma.career.findMany({
        where: { isActive: true },
        include: {
          requiredSkills: {
            include: { skill: true },
            orderBy: { importance: "desc" },
          },
          industryDemands: {
            include: { skill: true },
          },
        },
        orderBy: { title: "asc" },
      });

      // Unique Categories
      const categoriesSet = new Set<string>();
      allCareers.forEach((c) => categoriesSet.add(c.category));
      const categories = Array.from(categoriesSet).sort();

      // Authenticated Student primary career lookup
      let studentPrimaryCareer: {
        id: string;
        title: string;
        slug: string;
        category: string;
      } | null = null;

      try {
        const student = await getAuthenticatedStudentProfile({
          studentCareers: {
            include: { career: true },
          },
        });

        if (student) {
          const primaryEntry = student.studentCareers.find(
            (sc) => sc.isPrimary
          );
          if (primaryEntry) {
            studentPrimaryCareer = {
              id: primaryEntry.career.id,
              title: primaryEntry.career.title,
              slug: primaryEntry.career.slug,
              category: primaryEntry.career.category,
            };
          }
        }
      } catch {
        // Unauthenticated or optional student context
      }

      // Process and filter careers
      const processedCareers = allCareers
        .map((career) => {
          const demandBySkillId = new Map(
            career.industryDemands.map((d) => [d.skillId, d])
          );

          let highDemandCount = 0;
          let growingDemandCount = 0;

          const skills: IndustryDemandSkillItem[] = career.requiredSkills.map(
            (rs) => {
              const demandRecord = demandBySkillId.get(rs.skillId);
              const level: DemandLevel =
                (demandRecord?.demandLevel as DemandLevel) || "STABLE";
              const sourceType: DemandSourceType =
                (demandRecord?.sourceType as DemandSourceType) || "DEMO";
              const score = demandRecord?.demandScore ?? 65;

              if (level === "HIGH") highDemandCount++;
              if (level === "GROWING") growingDemandCount++;

              const collectedAt = demandRecord?.collectedAt
                ? demandRecord.collectedAt.toISOString()
                : new Date().toISOString();
              const validUntil = demandRecord?.validUntil
                ? demandRecord.validUntil.toISOString()
                : null;

              const freshness = getDemandFreshness(
                collectedAt,
                validUntil,
                sourceType
              );

              return {
                demandId: demandRecord?.id || `demo-${rs.skillId}`,
                skillId: rs.skillId,
                skillName: rs.skill.name,
                careerImportance: rs.importance,
                importanceLabel: getImportanceLabel(rs.importance),
                demandLevel: level,
                demandLevelLabel: DEMAND_LEVEL_LABELS[level] || "Stable Demand",
                demandScore: score,
                sourceType,
                sourceTypeLabel:
                  DEMAND_SOURCE_LABELS[sourceType] || "Demo Dataset",
                sourceName:
                  demandRecord?.sourceName ||
                  "SkillBridge Demo Industry Dataset",
                collectedAt,
                validUntil,
                freshness,
                notes: demandRecord?.notes || null,
              };
            }
          );

          const topHighDemandSkills = skills
            .filter(
              (s) => s.demandLevel === "HIGH" || s.demandLevel === "GROWING"
            )
            .slice(0, 5)
            .map((s) => ({
              name: s.skillName,
              level: s.demandLevel,
              score: s.demandScore,
              importance: s.careerImportance,
            }));

          return {
            id: career.id,
            title: career.title,
            slug: career.slug,
            category: career.category,
            description: career.description,
            totalSkillsCount: skills.length,
            highDemandCount,
            growingDemandCount,
            topHighDemandSkills,
            skills,
          };
        })
        .filter((c) => {
          // Category Filter
          if (category && category !== "All" && c.category !== category) {
            return false;
          }

          // Specific Career Filter
          if (careerId && c.id !== careerId) {
            return false;
          }

          // Search Query Filter (title, description, category, or skill names)
          if (query && query.trim() !== "") {
            const q = query.toLowerCase().trim();
            const matchesTitle = c.title.toLowerCase().includes(q);
            const matchesCategory = c.category.toLowerCase().includes(q);
            const matchesDesc = c.description.toLowerCase().includes(q);
            const matchesSkills = c.skills.some((s) =>
              s.skillName.toLowerCase().includes(q)
            );

            return (
              matchesTitle || matchesCategory || matchesDesc || matchesSkills
            );
          }

          return true;
        });

      // Selected career profile if careerId specified or student primary selected
      let selectedCareerProfile: CareerDemandProfile | null = null;
      const targetCareerId = careerId || studentPrimaryCareer?.id;

      if (targetCareerId) {
        selectedCareerProfile = await fetchCareerDemandProfileInternal(
          targetCareerId
        );
      }

      return {
        careers: processedCareers,
        categories,
        selectedCareerProfile,
        studentPrimaryCareer,
        demoNotice: {
          isDemo: true,
          text: "The current prototype uses seeded benchmark data to demonstrate the SkillBridge workflow. Production deployment will connect verified industry-demand sources.",
        },
      };
    }
  );

/**
 * Fetch industry demand metrics for a specific skill across all careers.
 */
export const getIndustryDemandForSkill = createServerFn({
  method: "GET",
})
  .validator((skillId: string) => skillId)
  .handler(
    async ({ data: skillId }): Promise<{
      skillName: string;
      totalCareersRequiring: number;
      highDemandCount: number;
      careerDemands: Array<{
        careerId: string;
        careerTitle: string;
        careerCategory: string;
        careerImportance: number;
        importanceLabel: string;
        demandLevel: DemandLevel;
        demandScore: number | null;
        sourceType: DemandSourceType;
        sourceName: string | null;
        freshness: DemandFreshnessStatus;
      }>;
    } | null> => {
      await ensureIndustryDemandSeeded();

      const skill = await prisma.skill.findUnique({
        where: { id: skillId },
        include: {
          careerSkills: {
            include: { career: true },
          },
          industryDemands: {
            include: { career: true },
          },
        },
      });

      if (!skill) {
        return null;
      }

      const demandByCareerId = new Map(
        skill.industryDemands.map((d) => [d.careerId, d])
      );

      let highDemandCount = 0;

      const careerDemands = skill.careerSkills.map((cs) => {
        const demandRecord = demandByCareerId.get(cs.careerId);
        const level: DemandLevel =
          (demandRecord?.demandLevel as DemandLevel) || "STABLE";
        const sourceType: DemandSourceType =
          (demandRecord?.sourceType as DemandSourceType) || "DEMO";
        const score = demandRecord?.demandScore ?? 65;

        if (level === "HIGH") highDemandCount++;

        const collectedAt = demandRecord?.collectedAt
          ? demandRecord.collectedAt.toISOString()
          : new Date().toISOString();
        const validUntil = demandRecord?.validUntil
          ? demandRecord.validUntil.toISOString()
          : null;

        const freshness = getDemandFreshness(
          collectedAt,
          validUntil,
          sourceType
        );

        return {
          careerId: cs.career.id,
          careerTitle: cs.career.title,
          careerCategory: cs.career.category,
          careerImportance: cs.importance,
          importanceLabel: getImportanceLabel(cs.importance),
          demandLevel: level,
          demandScore: score,
          sourceType,
          sourceName:
            demandRecord?.sourceName || "SkillBridge Demo Industry Dataset",
          freshness,
        };
      });

      return {
        skillName: skill.name,
        totalCareersRequiring: careerDemands.length,
        highDemandCount,
        careerDemands,
      };
    }
  );
