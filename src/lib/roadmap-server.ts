
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { prisma } from "@/server/db.server";
import { getAuthenticatedStudentProfile } from "@/server/auth-context";
import { computeCareerSkillGap } from "@/lib/skill-gap-core.server";
import {
  loadStudentRoadmap,
  mapRoadmapItems,
  resolvePrimaryCareer,
} from "@/lib/roadmap-core.server";

/* =========================================================
   TYPES
========================================================= */

export interface RoadmapItemData {
  id: string;
  step: number;
  skill: string;
  status: "COMPLETE" | "CURRENT" | "UPCOMING";
  difficulty: string | null;
  duration: string | null;
  resource: string | null;
  project: string | null;
  currentScore: number | null;
  targetScore: number | null;
  priority: number | null;
  reason: string | null;
  activityType: string | null;
}

export interface RoadmapData {
  careerTitle: string;
  careerCategory: string;
  readiness: number;
  readinessLabel: string;
  roadmap: RoadmapItemData[];
  generatedAt: string;
}

export interface RoadmapGenerationResult {
  success: boolean;
  roadmap: RoadmapData;
  message: string;
}

/* =========================================================
   CONSTANTS
========================================================= */

const TARGET_SCORE = 80;
const MAX_ROADMAP_ITEMS = 8;

const ACTIVITY_TYPES = {
  LEARNING: "LEARNING",
  ASSESSMENT: "ASSESSMENT",
  PROJECT: "PROJECT",
  EVIDENCE: "EVIDENCE",
} as const;

/* =========================================================
   TYPES FOR PHASE 7 PRIORITY GAPS
========================================================= */

type PriorityGap = {
  skillName: string;
  studentScore: number;
  gapPriority: number;
  importance: number;
  importanceLabel: string;
  demandLevel: string | null;
  demandLevelLabel: string;
  verificationLevel: string | null;
  verificationLabel: string | null;
  status: string;
  explanation: string;
};

/* =========================================================
   HELPERS
========================================================= */

/**
 * Pick the roadmap difficulty from the student's actual
 * proficiency and the career importance of the skill.
 *
 * This is intentionally deterministic.
 */
function determineDifficulty(
  studentScore: number,
  importance: number,
): string {
  if (studentScore === 0) {
    return importance >= 4 ? "Intermediate" : "Beginner";
  }

  if (studentScore < 50) {
    return "Intermediate";
  }

  return "Beginner";
}

/**
 * Pick a realistic learning duration from the actual gap.
 *
 * This is a roadmap estimate, not a claim about a provider's
 * course duration.
 */
function determineDuration(
  studentScore: number,
  importance: number,
): string {
  if (studentScore === 0) {
    return importance >= 4 ? "4 weeks" : "3 weeks";
  }

  if (studentScore < 50) {
    return "3 weeks";
  }

  return "2 weeks";
}

/**
 * Determine what type of action makes sense for the student.
 *
 * No fake project is created here.
 */
function determineActivityType(
  studentScore: number,
  verificationLevel: string | null,
): string {
  if (studentScore === 0) {
    return ACTIVITY_TYPES.LEARNING;
  }

  if (
    verificationLevel === "RESUME_DETECTED" ||
    !verificationLevel
  ) {
    return ACTIVITY_TYPES.ASSESSMENT;
  }

  if (studentScore < 70) {
    return ACTIVITY_TYPES.PROJECT;
  }

  return ACTIVITY_TYPES.ASSESSMENT;
}

/**
 * Generate an explanation directly from Phase 7 data.
 */
function generateReason(
  skillName: string,
  currentScore: number,
  importanceLabel: string,
  demandLevelLabel: string,
  verificationLabel: string | null,
): string {
  const scoreDesc =
    currentScore === 0
      ? `You have no verified evidence for ${skillName}`
      : currentScore < 50
        ? `Your ${skillName} proficiency is at ${currentScore}%`
        : `Your ${skillName} is at ${currentScore}%`;

  const verificationDesc = verificationLabel
    ? ` (current verification: ${verificationLabel})`
    : "";

  return `${scoreDesc}${verificationDesc}. ${skillName} is a ${importanceLabel} skill for this career with ${demandLevelLabel} in the industry. Reaching ${TARGET_SCORE}% will improve your career readiness.`;
}

/* =========================================================
   REAL LEARNING RESOURCE RESOLUTION
========================================================= */

/**
 * Find a real LearningResource from PostgreSQL.
 *
 * Important:
 * - Never invent a URL.
 * - Never invent a provider.
 * - Never manufacture a course title.
 * - If no resource exists, return null.
 *
 * Matching priority:
 *   1. Exact skill + suitable difficulty
 *   2. Case-insensitive skill match
 *   3. Deterministic oldest/newest ordering
 */
async function resolveLearningResource(
  skillName: string,
  difficulty: string,
): Promise<string | null> {
  const exact = await prisma.learningResource.findFirst({
    where: {
      skill: skillName,
      difficulty,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      title: true,
      provider: true,
      url: true,
    },
  });

  if (exact) {
    return formatResource(exact);
  }

  /**
   * PostgreSQL case-insensitive matching.
   *
   * We use contains rather than inventing normalized skill
   * aliases. This allows "Python" / "python" style differences
   * without introducing fake mappings.
   */
  const caseInsensitive = await prisma.learningResource.findFirst({
    where: {
      skill: {
        equals: skillName,
        mode: "insensitive",
      },
    },
    orderBy: [
      {
        createdAt: "desc",
      },
      {
        id: "asc",
      },
    ],
    select: {
      title: true,
      provider: true,
      url: true,
    },
  });

  if (caseInsensitive) {
    return formatResource(caseInsensitive);
  }

  return null;
}

/**
 * Convert a real database resource into display text.
 */
function formatResource(resource: {
  title: string;
  provider: string;
  url: string;
}): string {
  return `${resource.title} — ${resource.provider} — ${resource.url}`;
}

/* =========================================================
   PROJECT / EVIDENCE RESOLUTION
========================================================= */

/**
 * ProjectSubmission represents projects the student has already
 * submitted as evidence.
 *
 * It is NOT a project recommendation catalog.
 *
 * Therefore we only reference an existing verified/submitted
 * project when it genuinely matches the roadmap skill.
 */
async function resolveExistingProject(
  studentId: string,
  skillName: string,
): Promise<string | null> {
  const project = await prisma.projectSubmission.findFirst({
    where: {
      studentId,
      skillName: {
        equals: skillName,
        mode: "insensitive",
      },
    },
    /**
     * Prefer a verified project first, then fall back to the
     * most recently submitted project.
     *
     * Postgres sorts NULLs FIRST on DESC by default, so without
     * `nulls: "last"` unverified submissions would outrank
     * verified ones. `nulls: "last"` fixes that.
     */
    orderBy: [
      {
        verifiedAt: { sort: "desc", nulls: "last" },
      },
      {
        submittedAt: "desc",
      },
    ],
    select: {
      title: true,
      projectUrl: true,
      repoUrl: true,
    },
  });

  if (!project) {
    return null;
  }

  const links = [
    project.projectUrl,
    project.repoUrl,
  ].filter(Boolean);

  return links.length > 0
    ? `${project.title} — ${links.join(" | ")}`
    : project.title;
}

/* =========================================================
   DETERMINISTIC ROADMAP GENERATION
========================================================= */

async function generateRoadmapSteps(
  studentId: string,
  priorityGaps: PriorityGap[],
): Promise<
  Array<{
    step: number;
    skill: string;
    difficulty: string;
    duration: string;
    resource: string | null;
    project: string | null;
    currentScore: number;
    targetScore: number;
    priority: number;
    reason: string;
    activityType: string;
  }>
> {
  const steps: Array<{
    step: number;
    skill: string;
    difficulty: string;
    duration: string;
    resource: string | null;
    project: string | null;
    currentScore: number;
    targetScore: number;
    priority: number;
    reason: string;
    activityType: string;
  }> = [];

  let stepNumber = 1;

  for (const gap of priorityGaps.slice(0, MAX_ROADMAP_ITEMS)) {
    const difficulty = determineDifficulty(
      gap.studentScore,
      gap.importance,
    );

    const duration = determineDuration(
      gap.studentScore,
      gap.importance,
    );

    const activityType = determineActivityType(
      gap.studentScore,
      gap.verificationLevel,
    );

    const reason = generateReason(
      gap.skillName,
      gap.studentScore,
      gap.importanceLabel,
      gap.demandLevelLabel,
      gap.verificationLabel,
    );

    /**
     * Only use a resource that actually exists in PostgreSQL.
     */
    const resource = await resolveLearningResource(
      gap.skillName,
      difficulty,
    );

    /**
     * Only reference a project the student has actually
     * submitted. Never fabricate a project recommendation.
     */
    const project =
      activityType === ACTIVITY_TYPES.PROJECT
        ? await resolveExistingProject(
            studentId,
            gap.skillName,
          )
        : null;

    steps.push({
      step: stepNumber,
      skill: gap.skillName,
      difficulty,
      duration,
      resource,
      project,
      currentScore: gap.studentScore,
      targetScore: TARGET_SCORE,
      priority: gap.gapPriority,
      reason,
      activityType,
    });

    stepNumber++;
  }

  return steps;
}

/* =========================================================
   SERVER FUNCTION: GENERATE ROADMAP
========================================================= */

export const generateStudentRoadmap = createServerFn({
  method: "POST",
}).handler(async (): Promise<RoadmapGenerationResult> => {
  /* -------------------------------------------------------
     1. AUTHENTICATED STUDENT
  ------------------------------------------------------- */

  const student = await getAuthenticatedStudentProfile({
    user: true,
    skills: {
      include: {
        skill: true,
      },
    },
  });

  if (!student) {
    throw new Error(
      "No student profile found. Please register a student account first.",
    );
  }

  /* -------------------------------------------------------
     2. PRIMARY CAREER
  ------------------------------------------------------- */

  const primaryCareer = await resolvePrimaryCareer(
    student.id,
  );

  if (!primaryCareer) {
    throw new Error(
      "NO_PRIMARY_CAREER: Please select a primary career direction before generating a roadmap.",
    );
  }

  const careerId = primaryCareer.careerId;
  const careerTitle = primaryCareer.career.title;
  const careerCategory = primaryCareer.career.category;

  /* -------------------------------------------------------
     3. PHASE 7 SKILL GAP ENGINE
  ------------------------------------------------------- */

  const skillGapResult = await computeCareerSkillGap(
    student.id,
    careerId,
  );

  const priorityGaps = skillGapResult.priorityGaps;

  /* -------------------------------------------------------
     4. NO PRIORITY GAPS
  ------------------------------------------------------- */

  if (priorityGaps.length === 0) {
    await prisma.roadmapItem.deleteMany({
      where: {
        studentId: student.id,
      },
    });

    return {
      success: true,
      roadmap: {
        careerTitle,
        careerCategory,
        readiness: skillGapResult.readiness,
        readinessLabel: skillGapResult.readinessLabel,
        roadmap: [],
        generatedAt: new Date().toISOString(),
      },
      message:
        "Your current profile covers the priority gaps for this career. No roadmap items needed.",
    };
  }

  /* -------------------------------------------------------
     5. BUILD PERSONALIZED ROADMAP
  ------------------------------------------------------- */

  const roadmapSteps = await generateRoadmapSteps(
    student.id,
    priorityGaps,
  );

  /* -------------------------------------------------------
     6. PERSIST ATOMICALLY
  ------------------------------------------------------- */

  const savedItems = await prisma.$transaction(
    async (tx) => {
      await tx.roadmapItem.deleteMany({
        where: {
          studentId: student.id,
        },
      });

      for (const item of roadmapSteps) {
        await tx.roadmapItem.create({
          data: {
            studentId: student.id,
            step: item.step,
            skill: item.skill,
            status:
              item.step === 1
                ? "CURRENT"
                : "UPCOMING",
            difficulty: item.difficulty,
            duration: item.duration,
            resource: item.resource,
            project: item.project,
            currentScore: item.currentScore,
            targetScore: item.targetScore,
            priority: item.priority,
            reason: item.reason,
            activityType: item.activityType,
          },
        });
      }

      return tx.roadmapItem.findMany({
        where: {
          studentId: student.id,
        },
        orderBy: {
          step: "asc",
        },
      });
    },
  );

  /* -------------------------------------------------------
     7. RESPONSE
  ------------------------------------------------------- */

  const roadmapData: RoadmapData = {
    careerTitle,
    careerCategory,
    readiness: skillGapResult.readiness,
    readinessLabel: skillGapResult.readinessLabel,
    roadmap: mapRoadmapItems(savedItems),
    generatedAt: new Date().toISOString(),
  };

  const resourcesAvailable = savedItems.filter(
    (item) => item.resource !== null,
  ).length;

  const projectsAvailable = savedItems.filter(
    (item) => item.project !== null,
  ).length;

  let message =
    `Roadmap generated for ${careerTitle} with ${roadmapSteps.length} personalized milestones.`;

  if (resourcesAvailable === 0) {
    message +=
      " No matching verified learning resources are currently available in the SkillBridge catalog.";
  } else {
    message +=
      ` ${resourcesAvailable} milestone${resourcesAvailable === 1 ? "" : "s"} include${resourcesAvailable === 1 ? "s" : ""} a verified catalog resource.`;
  }

  if (projectsAvailable > 0) {
    message +=
      ` ${projectsAvailable} milestone${projectsAvailable === 1 ? "" : "s"} reference existing student project evidence.`;
  }

  return {
    success: true,
    roadmap: roadmapData,
    message,
  };
});

/* =========================================================
   SERVER FUNCTION: GET ROADMAP
========================================================= */

export const getStudentRoadmap = createServerFn({
  method: "GET",
}).handler(async (): Promise<RoadmapData | null> => {
  const student = await getAuthenticatedStudentProfile({
    user: true,
  });

  if (!student) {
    throw new Error(
      "No student profile found. Please register a student account first.",
    );
  }

  return loadStudentRoadmap(student.id);
});

/* =========================================================
   SERVER FUNCTION: UPDATE ROADMAP STATUS
========================================================= */

export const updateRoadmapItemStatus = createServerFn({
  method: "POST",
})
  .validator(
    z.object({
      itemId: z.string(),
      status: z.enum([
        "COMPLETE",
        "CURRENT",
        "UPCOMING",
      ]),
    }),
  )
  .handler(async ({ data }) => {
    const student =
      await getAuthenticatedStudentProfile({
        user: true,
      });

    if (!student) {
      throw new Error(
        "No student profile found. Please register a student account first.",
      );
    }

    const item =
      await prisma.roadmapItem.findUnique({
        where: {
          id: data.itemId,
        },
      });

    if (
      !item ||
      item.studentId !== student.id
    ) {
      throw new Error(
        "Roadmap item not found or access denied.",
      );
    }

    const updatedItem =
      await prisma.roadmapItem.update({
        where: {
          id: data.itemId,
        },
        data: {
          status: data.status,
        },
      });

    return {
      success: true,
      item: {
        id: updatedItem.id,
        step: updatedItem.step,
        skill: updatedItem.skill,
        status: updatedItem.status,
      },
    };
  });
