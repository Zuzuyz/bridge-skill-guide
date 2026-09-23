import { prisma } from "@/server/db.server";
import { getAuthenticatedStudentProfile } from "@/server/auth-context";
import {
  getDemandFreshness,
  getNoCurrentDemandFreshness,
  selectCurrentIndustryDemandByCareerId,
  selectCurrentIndustryDemandBySkillId,
} from "@/lib/industry-demand-selector.server";
import {
  DEMAND_LEVEL_LABELS,
  DEMAND_SOURCE_LABELS,
  type DemandFreshnessStatus,
  type DemandConfidence,
  type DemandLevel,
  type DemandSourceType,
  type IndustryDemandSkillItem,
  type CareerDemandProfile,
} from "@/types";

export { getDemandFreshness } from "@/lib/industry-demand-selector.server";

/**
 * Ensures the database contains industry demand seed data.
 */

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

  const demandBySkillId = selectCurrentIndustryDemandBySkillId(
    career.industryDemands,
  );

  let highDemandCount = 0;
  let growingDemandCount = 0;

  const mappedSkills: IndustryDemandSkillItem[] = career.requiredSkills.map(
    (rs) => {
      const demandRecord = demandBySkillId.get(rs.skillId);

      const level = demandRecord
        ? (demandRecord.demandLevel as DemandLevel)
        : null;
      const sourceType = demandRecord
        ? (demandRecord.sourceType as DemandSourceType)
        : null;
      const score = demandRecord?.demandScore ?? null;

      if (level === "HIGH") highDemandCount++;
      if (level === "GROWING") growingDemandCount++;

      const collectedAt = demandRecord?.collectedAt
        ? demandRecord.collectedAt.toISOString()
        : "";
      const validUntil = demandRecord?.validUntil
        ? demandRecord.validUntil.toISOString()
        : null;

      const freshness = demandRecord
        ? getDemandFreshness(collectedAt, validUntil, sourceType ?? "MANUAL")
        : getNoCurrentDemandFreshness();

      return {
        demandId: demandRecord?.id || `no-demand-${rs.skillId}`,
        skillId: rs.skillId,
        skillName: rs.skill.name,
        careerImportance: rs.importance,
        importanceLabel: getImportanceLabel(rs.importance),
        demandLevel: level,
        demandLevelLabel: level
          ? DEMAND_LEVEL_LABELS[level] || "Unknown Demand"
          : "No verified demand data",
        demandScore: score,
        sourceType,
        sourceTypeLabel: sourceType
          ? DEMAND_SOURCE_LABELS[sourceType] || "Unknown Source"
          : "No verified source",
        sourceName: demandRecord?.sourceName || null,
        sourceUrl: demandRecord?.sourceUrl || null,
        confidence: demandRecord?.confidence ?? "LOW",
        evidenceCount: demandRecord?.evidenceCount ?? 0,
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
export { fetchCareerDemandProfileInternal as getCareerDemandProfile };

/**
 * Fetch all careers with their industry demand summaries for the Industry Demand Explorer.
 */
export async function getAllIndustryDemandInternal(
  data?: { query?: string; category?: string; careerId?: string },
): Promise<{
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
    }> {
    
      const query = data?.query;
      const category = data?.category;

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
          const demandBySkillId = selectCurrentIndustryDemandBySkillId(
            career.industryDemands,
          );

          let highDemandCount = 0;
          let growingDemandCount = 0;

          const skills: IndustryDemandSkillItem[] = career.requiredSkills.map(
            (rs) => {
              const demandRecord = demandBySkillId.get(rs.skillId);

              const level = demandRecord
                ? (demandRecord.demandLevel as DemandLevel)
                : null;

              const sourceType = demandRecord
                ? (demandRecord.sourceType as DemandSourceType)
                : null;

              const score = demandRecord?.demandScore ?? null;

              if (demandRecord?.demandLevel === "HIGH") highDemandCount++;
              if (demandRecord?.demandLevel === "GROWING") growingDemandCount++;

              const collectedAt = demandRecord?.collectedAt
                ? demandRecord.collectedAt.toISOString()
                : "";

              const validUntil = demandRecord?.validUntil
                ? demandRecord.validUntil.toISOString()
                : null;

              const freshness = demandRecord
                ? getDemandFreshness(
                    collectedAt,
                    validUntil,
                    sourceType ?? "MANUAL"
                  )
                : getNoCurrentDemandFreshness();

              return {
                demandId: demandRecord?.id || `no-demand-${rs.skillId}`,
                skillId: rs.skillId,
                skillName: rs.skill.name,
                careerImportance: rs.importance,
                importanceLabel: getImportanceLabel(rs.importance),
                demandLevel: level,
                demandLevelLabel: level
                  ? DEMAND_LEVEL_LABELS[level] || "Unknown Demand"
                  : "No verified demand data",
                demandScore: score,
                sourceType,
                sourceTypeLabel: sourceType
                  ? DEMAND_SOURCE_LABELS[sourceType] || "Unknown Source"
                  : "No verified source",
                sourceName: demandRecord?.sourceName || null,
                sourceUrl: demandRecord?.sourceUrl || null,
                confidence: demandRecord?.confidence ?? "LOW",
                evidenceCount: demandRecord?.evidenceCount ?? 0,
                collectedAt,
                validUntil,
                freshness,
                notes: demandRecord?.notes || null,
              };
            }
          );

          const topHighDemandSkills = skills
            .filter(
              (s): s is IndustryDemandSkillItem & { demandLevel: DemandLevel } =>
                s.demandLevel === "HIGH" || s.demandLevel === "GROWING"
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
          if (data?.careerId && c.id !== data.careerId) {
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
      const targetCareerId = data?.careerId || studentPrimaryCareer?.id;

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

/**
 * Fetch industry demand metrics for a specific skill across all careers.
 */
export async function getIndustryDemandForSkillInternal(
  data: { skillId: string },
): Promise<{
  skillName: string;
  totalCareersRequiring: number;
  highDemandCount: number;
  careerDemands: Array<{
    careerId: string;
    careerTitle: string;
    careerCategory: string;
    careerImportance: number;
    importanceLabel: string;
    demandLevel: DemandLevel | null;
    demandScore: number | null;
    sourceType: DemandSourceType | null;
    sourceName: string | null;
    sourceUrl: string | null;
    confidence: DemandConfidence;
    evidenceCount: number;
    freshness: DemandFreshnessStatus;
  }>;
} | null> {
  const skill = await prisma.skill.findUnique({
    where: { id: data.skillId },
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

  const demandByCareerId = selectCurrentIndustryDemandByCareerId(
    skill.industryDemands,
  );

  let highDemandCount = 0;

  const careerDemands = skill.careerSkills.map((cs) => {
    const demandRecord = demandByCareerId.get(cs.careerId);

    const level = demandRecord
      ? (demandRecord.demandLevel as DemandLevel)
      : null;

    const sourceType = demandRecord
      ? (demandRecord.sourceType as DemandSourceType)
      : null;

    const score = demandRecord?.demandScore ?? null;

    if (demandRecord?.demandLevel === "HIGH") {
      highDemandCount++;
    }

    const collectedAt = demandRecord?.collectedAt
      ? demandRecord.collectedAt.toISOString()
      : "";

    const validUntil = demandRecord?.validUntil
      ? demandRecord.validUntil.toISOString()
      : null;

    const freshness = demandRecord
      ? getDemandFreshness(
          collectedAt,
          validUntil,
          sourceType ?? "MANUAL",
        )
      : getNoCurrentDemandFreshness();

    return {
      careerId: cs.career.id,
      careerTitle: cs.career.title,
      careerCategory: cs.career.category,
      careerImportance: cs.importance,
      importanceLabel: getImportanceLabel(cs.importance),
      demandLevel: level,
      demandScore: score,
      sourceType,
      sourceName: demandRecord?.sourceName || null,
      sourceUrl: demandRecord?.sourceUrl || null,
      confidence: demandRecord?.confidence ?? "LOW",
      evidenceCount: demandRecord?.evidenceCount ?? 0,
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
