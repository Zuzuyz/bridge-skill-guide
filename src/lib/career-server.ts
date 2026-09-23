import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/server/db.server";
import { getAuthenticatedStudentProfile } from "@/server/auth-context";
import { selectCurrentIndustryDemandBySkillId } from "@/lib/industry-demand-selector.server";
// @ts-expect-error seed-careers is a .mjs script without TS types
import { seedCareers } from "../../prisma/seed-careers.mjs";
import {
  DEMAND_LEVEL_LABELS,
  VERIFICATION_LEVEL_LABELS,
  type DemandLevel,
  type DemandSourceType,
  type VerificationLevel,
} from "@/types";

export interface CareerSkillItem {
  skillId: string;
  skillName: string;
  importance: number; // 1-5
  importanceLabel: string;
  // Student evidence matching (optional when logged in)
  studentEvidence?: {
    hasEvidence: boolean;
    verificationLevel?: VerificationLevel | undefined;
    verificationLabel?: string | undefined;
    score?: number | undefined;
    evidenceSource?: string | undefined;
    projectEvidence?: string | null | undefined;
    assessmentScore?: number | null | undefined;
  } | undefined;
  industryDemand?: {
    demandLevel: DemandLevel;
    demandLevelLabel: string;
    demandScore: number | null;
    sourceType: DemandSourceType;
    sourceName: string | null;
    sourceUrl: string | null;
  } | undefined;
}

export interface CareerSummaryItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  description: string;
  totalSkillsCount: number;
  coreSkillsCount: number;
  topSkills: string[];
  studentStatus?: {
    isPrimary: boolean;
    isSecondary: boolean;
    isSelected: boolean;
    evidenceCoveredSkillsCount: number;
  } | undefined;
}

export interface CareerDetailData {
  id: string;
  title: string;
  slug: string;
  category: string;
  description: string;
  requiredSkills: CareerSkillItem[];
  skillsByImportance: {
    core: CareerSkillItem[];       // Importance 5
    veryImportant: CareerSkillItem[]; // Importance 4
    important: CareerSkillItem[];   // Importance 3
    useful: CareerSkillItem[];      // Importance 2
    niceToHave: CareerSkillItem[];  // Importance 1
  };
  studentSelection?: {
    isPrimary: boolean;
    isSecondary: boolean;
    isSelected: boolean;
    evidenceCoveredSkillsCount: number;
    totalRequiredSkillsCount: number;
  } | undefined;
}

export interface StudentCareersResponse {
  primaryCareer: {
    id: string;
    careerId: string;
    title: string;
    slug: string;
    category: string;
    description: string;
    requiredSkillsCount: number;
    evidenceCoveredSkillsCount: number;
  } | null;
  secondaryCareers: Array<{
    id: string;
    careerId: string;
    title: string;
    slug: string;
    category: string;
    description: string;
    requiredSkillsCount: number;
    evidenceCoveredSkillsCount: number;
  }>;
  totalSelectedCount: number;
  maxSecondaryAllowed: number;
}

/**
 * Ensure database has career catalog seeded.
 */
async function ensureCareersSeeded() {
  const count = await prisma.career.count();
  if (count === 0) {
    await seedCareers();
  }
}

/**
 * Fetch all available careers in the catalog with student selection status.
 */
export const getCareers = createServerFn({
  method: "GET",
}).handler(async (): Promise<{
  careers: CareerSummaryItem[];
  categories: string[];
  stats: {
    totalCareers: number;
    selectedCareersCount: number;
    hasPrimarySelection: boolean;
  };
}> => {
  await ensureCareersSeeded();

  const student = await getAuthenticatedStudentProfile({
    skills: { include: { skill: true } },
    studentCareers: { include: { career: true } },
  });

  const careers = await prisma.career.findMany({
    where: { isActive: true },
    include: {
      requiredSkills: {
        include: { skill: true },
        orderBy: { importance: "desc" },
      },
      _count: {
        select: { requiredSkills: true },
      },
    },
    orderBy: [{ category: "asc" }, { title: "asc" }],
  });

  const studentSkillsMap = new Map(
    student?.skills.map((s) => [s.skill.name.toLowerCase(), s]) ?? []
  );

  const studentCareersMap = new Map(
    student?.studentCareers.map((sc) => [sc.careerId, sc]) ?? []
  );

  const categoriesSet = new Set<string>();

  const items: CareerSummaryItem[] = careers.map((c) => {
    categoriesSet.add(c.category);

    const coreSkills = c.requiredSkills.filter((rs) => rs.importance >= 4);
    const topSkills = c.requiredSkills.slice(0, 4).map((rs) => rs.skill.name);

    const studentCareerEntry = studentCareersMap.get(c.id);

    let evidenceCoveredSkillsCount = 0;
    for (const reqSkill of c.requiredSkills) {
      if (studentSkillsMap.has(reqSkill.skill.name.toLowerCase())) {
        evidenceCoveredSkillsCount++;
      }
    }

    return {
      id: c.id,
      title: c.title,
      slug: c.slug,
      category: c.category,
      description: c.description,
      totalSkillsCount: c.requiredSkills.length,
      coreSkillsCount: coreSkills.length,
      topSkills,
      studentStatus: student
        ? {
            isPrimary: studentCareerEntry?.isPrimary ?? false,
            isSecondary: studentCareerEntry ? !studentCareerEntry.isPrimary : false,
            isSelected: !!studentCareerEntry,
            evidenceCoveredSkillsCount,
          }
        : undefined,
    };
  });

  const selectedCareersCount = student?.studentCareers.length ?? 0;
  const hasPrimarySelection = student?.studentCareers.some((sc) => sc.isPrimary) ?? false;

  return {
    careers: items,
    categories: Array.from(categoriesSet).sort(),
    stats: {
      totalCareers: careers.length,
      selectedCareersCount,
      hasPrimarySelection,
    },
  };
});

/**
 * Fetch a single career by slug with detailed skill requirements and student evidence annotations.
 */
export const getCareerBySlug = createServerFn({
  method: "GET",
})
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }): Promise<CareerDetailData | null> => {
    await ensureCareersSeeded();

    const student = await getAuthenticatedStudentProfile({
      skills: { include: { skill: true } },
      studentCareers: { include: { career: true } },
    });

    const career = await prisma.career.findUnique({
      where: { slug },
      include: {
        requiredSkills: {
          include: { skill: true },
          orderBy: { importance: "desc" },
        },
        industryDemands: true,
      },
    });

    if (!career) {
      return null;
    }

    const demandBySkillId = selectCurrentIndustryDemandBySkillId(
      career.industryDemands,
    );

    const studentSkillsMap = new Map(
      student?.skills.map((s) => [s.skill.name.toLowerCase(), s]) ?? []
    );

    const studentCareerEntry = student?.studentCareers.find((sc) => sc.careerId === career.id);

    let evidenceCoveredSkillsCount = 0;

    const mappedSkills: CareerSkillItem[] = career.requiredSkills.map((rs) => {
      const importanceLabel =
        rs.importance === 5 ? "Core Skill"
        : rs.importance === 4 ? "Very Important"
        : rs.importance === 3 ? "Important"
        : rs.importance === 2 ? "Useful"
        : "Nice to Have";

      const matchedStudentSkill = studentSkillsMap.get(rs.skill.name.toLowerCase());
      if (matchedStudentSkill) {
        evidenceCoveredSkillsCount++;
      }

      const rawLevel = matchedStudentSkill?.verificationLevel as VerificationLevel | undefined;
      const demandRecord = demandBySkillId.get(rs.skillId);
      const demandLevel = demandRecord?.demandLevel as DemandLevel | undefined;

      return {
        skillId: rs.skill.id,
        skillName: rs.skill.name,
        importance: rs.importance,
        importanceLabel,
        studentEvidence: student
          ? {
              hasEvidence: !!matchedStudentSkill,
              verificationLevel: rawLevel,
              verificationLabel: rawLevel ? VERIFICATION_LEVEL_LABELS[rawLevel] : undefined,
              score: matchedStudentSkill?.score,
              evidenceSource: matchedStudentSkill?.evidenceSource || undefined,
              projectEvidence: matchedStudentSkill?.projectEvidence,
              assessmentScore: matchedStudentSkill?.assessmentScore,
            }
          : undefined,
        industryDemand: demandRecord && demandLevel
          ? {
              demandLevel,
              demandLevelLabel: DEMAND_LEVEL_LABELS[demandLevel],
              demandScore: demandRecord.demandScore,
              sourceType: demandRecord.sourceType as DemandSourceType,
              sourceName: demandRecord.sourceName,
              sourceUrl: demandRecord.sourceUrl,
            }
          : undefined,
      };
    });

    return {
      id: career.id,
      title: career.title,
      slug: career.slug,
      category: career.category,
      description: career.description,
      requiredSkills: mappedSkills,
      skillsByImportance: {
        core: mappedSkills.filter((s) => s.importance === 5),
        veryImportant: mappedSkills.filter((s) => s.importance === 4),
        important: mappedSkills.filter((s) => s.importance === 3),
        useful: mappedSkills.filter((s) => s.importance === 2),
        niceToHave: mappedSkills.filter((s) => s.importance === 1),
      },
      studentSelection: student
        ? {
            isPrimary: studentCareerEntry?.isPrimary ?? false,
            isSecondary: studentCareerEntry ? !studentCareerEntry.isPrimary : false,
            isSelected: !!studentCareerEntry,
            evidenceCoveredSkillsCount,
            totalRequiredSkillsCount: mappedSkills.length,
          }
        : undefined,
    };
  });

/**
 * Get all selected careers for the current authenticated student.
 */
export const getStudentCareers = createServerFn({
  method: "GET",
}).handler(async (): Promise<StudentCareersResponse> => {
  const student = await getAuthenticatedStudentProfile({
    skills: { include: { skill: true } },
    studentCareers: {
      include: {
        career: {
          include: {
            requiredSkills: { include: { skill: true } },
          },
        },
      },
    },
  });

  if (!student) {
    return {
      primaryCareer: null,
      secondaryCareers: [],
      totalSelectedCount: 0,
      maxSecondaryAllowed: 2,
    };
  }

  const studentSkillsMap = new Set(student.skills.map((s) => s.skill.name.toLowerCase()));

  const primaryEntry = student.studentCareers.find((sc) => sc.isPrimary);
  const secondaryEntries = student.studentCareers.filter((sc) => !sc.isPrimary);

  const formatCareerEntry = (entry: typeof primaryEntry) => {
    if (!entry) return null;
    let evidenceCoveredSkillsCount = 0;
    for (const reqSkill of entry.career.requiredSkills) {
      if (studentSkillsMap.has(reqSkill.skill.name.toLowerCase())) {
        evidenceCoveredSkillsCount++;
      }
    }
    return {
      id: entry.id,
      careerId: entry.careerId,
      title: entry.career.title,
      slug: entry.career.slug,
      category: entry.career.category,
      description: entry.career.description,
      requiredSkillsCount: entry.career.requiredSkills.length,
      evidenceCoveredSkillsCount,
    };
  };

  return {
    primaryCareer: formatCareerEntry(primaryEntry),
    secondaryCareers: secondaryEntries
      .map((entry) => formatCareerEntry(entry)!)
      .filter(Boolean),
    totalSelectedCount: student.studentCareers.length,
    maxSecondaryAllowed: 2,
  };
});

/**
 * Set a student's primary career.
 * Automatically clears previous primary flag and updates targetRole for backward compatibility.
 */
export const setStudentPrimaryCareer = createServerFn({
  method: "POST",
})
  .validator((input: { careerId: string }) => input)
  .handler(async ({ data }): Promise<{ success: boolean; message: string; primaryCareerTitle: string }> => {
    const student = await getAuthenticatedStudentProfile({
      studentCareers: true,
    });

    if (!student) {
      throw new Error("Student authentication required.");
    }

    const targetCareer = await prisma.career.findUnique({
      where: { id: data.careerId },
    });

    if (!targetCareer) {
      throw new Error("Career not found in database catalog.");
    }

    // 1. Remove primary flag from all current selections for this student
    await prisma.studentCareer.updateMany({
      where: { studentId: student.id, isPrimary: true },
      data: { isPrimary: false },
    });

    // 2. Upsert the target career as primary
    const existingEntry = await prisma.studentCareer.findUnique({
      where: {
        studentId_careerId: {
          studentId: student.id,
          careerId: targetCareer.id,
        },
      },
    });

    if (existingEntry) {
      await prisma.studentCareer.update({
        where: { id: existingEntry.id },
        data: { isPrimary: true },
      });
    } else {
      await prisma.studentCareer.create({
        data: {
          studentId: student.id,
          careerId: targetCareer.id,
          isPrimary: true,
        },
      });
    }

    // 3. Maintain backward compatibility with targetRole
    await prisma.studentProfile.update({
      where: { id: student.id },
      data: { targetRole: targetCareer.title },
    });

    return {
      success: true,
      message: `"${targetCareer.title}" set as your primary career direction.`,
      primaryCareerTitle: targetCareer.title,
    };
  });

/**
 * Add a secondary career direction (Maximum 2 allowed).
 */
export const addStudentSecondaryCareer = createServerFn({
  method: "POST",
})
  .validator((input: { careerId: string }) => input)
  .handler(async ({ data }): Promise<{ success: boolean; message: string }> => {
    const student = await getAuthenticatedStudentProfile({
      studentCareers: true,
    });

    if (!student) {
      throw new Error("Student authentication required.");
    }

    const targetCareer = await prisma.career.findUnique({
      where: { id: data.careerId },
    });

    if (!targetCareer) {
      throw new Error("Career not found in database catalog.");
    }

    const existingSelections = student.studentCareers;
    const secondaryCount = existingSelections.filter((sc) => !sc.isPrimary).length;

    const existingMatch = existingSelections.find((sc) => sc.careerId === targetCareer.id);

    if (existingMatch) {
      if (existingMatch.isPrimary) {
        throw new Error(`"${targetCareer.title}" is already your primary career direction.`);
      }
      throw new Error(`"${targetCareer.title}" is already in your secondary career paths.`);
    }

    if (secondaryCount >= 2) {
      throw new Error("Maximum of 2 secondary careers allowed. Remove one to add a new career.");
    }

    await prisma.studentCareer.create({
      data: {
        studentId: student.id,
        careerId: targetCareer.id,
        isPrimary: false,
      },
    });

    return {
      success: true,
      message: `"${targetCareer.title}" added to your secondary career paths.`,
    };
  });

/**
 * Remove a selected career direction.
 */
export const removeStudentCareer = createServerFn({
  method: "POST",
})
  .validator((input: { careerId: string }) => input)
  .handler(async ({ data }): Promise<{ success: boolean; message: string }> => {
    const student = await getAuthenticatedStudentProfile({
      studentCareers: true,
    });

    if (!student) {
      throw new Error("Student authentication required.");
    }

    const existingMatch = student.studentCareers.find((sc) => sc.careerId === data.careerId);

    if (!existingMatch) {
      throw new Error("Career selection not found.");
    }

    await prisma.studentCareer.delete({
      where: { id: existingMatch.id },
    });

    // If it was primary, sync targetRole
    if (existingMatch.isPrimary) {
      const remainingSecondary = await prisma.studentCareer.findFirst({
        where: { studentId: student.id },
        include: { career: true },
        orderBy: { createdAt: "asc" },
      });

      const nextTargetRole = remainingSecondary ? remainingSecondary.career.title : null;

      if (remainingSecondary) {
        await prisma.studentCareer.update({
          where: { id: remainingSecondary.id },
          data: { isPrimary: true },
        });
      }

      await prisma.studentProfile.update({
        where: { id: student.id },
        data: { targetRole: nextTargetRole },
      });
    }

    return {
      success: true,
      message: "Career direction removed.",
    };
  });
