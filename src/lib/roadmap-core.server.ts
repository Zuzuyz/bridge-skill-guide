import { prisma } from "@/server/db.server";
import { computeCareerSkillGap } from "@/lib/skill-gap-core.server";
import type {
  RoadmapData,
  RoadmapItemData,
} from "@/lib/roadmap-server";

/* =========================================================
   PHASE 8 — PLAIN ROADMAP SERVER LOGIC

   Server-only module (not imported by any client file):
   the createServerFn wrappers in roadmap-server.ts and the
   SkillBuddy assistant both reuse these exact functions,
   so there is a single source of truth for primary-career
   resolution and roadmap loading — no duplicated roadmap
   logic, no nested createServerFn calls.
========================================================= */

/* -------------------------------------------------------
   PRIMARY CAREER (StudentCareer.isPrimary)
------------------------------------------------------- */

export async function resolvePrimaryCareer(studentId: string) {
  return prisma.studentCareer.findFirst({
    where: {
      studentId,
      isPrimary: true,
    },
    include: {
      career: true,
    },
  });
}

/* -------------------------------------------------------
   ROADMAP RESPONSE BUILDER
------------------------------------------------------- */

export function mapRoadmapItems(
  items: Array<{
    id: string;
    step: number;
    skill: string;
    status: string;
    difficulty: string | null;
    duration: string | null;
    resource: string | null;
    project: string | null;
    currentScore: number | null;
    targetScore: number | null;
    priority: number | null;
    reason: string | null;
    activityType: string | null;
  }>,
): RoadmapItemData[] {
  return items.map((item) => ({
    id: item.id,
    step: item.step,
    skill: item.skill,
    status:
      item.status as
        | "COMPLETE"
        | "CURRENT"
        | "UPCOMING",
    difficulty: item.difficulty,
    duration: item.duration,
    resource: item.resource,
    project: item.project,
    currentScore: item.currentScore,
    targetScore: item.targetScore,
    priority: item.priority,
    reason: item.reason,
    activityType: item.activityType,
  }));
}

/* -------------------------------------------------------
   ROADMAP LOADER
   (Single source of truth used by getStudentRoadmap and
   SkillBuddy — reads saved RoadmapItem rows and the
   Phase 7 readiness for the primary career.)
------------------------------------------------------- */

export async function loadStudentRoadmap(
  studentId: string,
): Promise<RoadmapData | null> {
  const primaryCareer = await resolvePrimaryCareer(
    studentId,
  );

  if (!primaryCareer) {
    return null;
  }

  const items = await prisma.roadmapItem.findMany({
    where: {
      studentId,
    },
    orderBy: {
      step: "asc",
    },
  });

  if (items.length === 0) {
    return null;
  }

  const skillGapResult = await computeCareerSkillGap(
    studentId,
    primaryCareer.careerId,
  );

  return {
    careerTitle: primaryCareer.career.title,
    careerCategory: primaryCareer.career.category,
    readiness: skillGapResult.readiness,
    readinessLabel: skillGapResult.readinessLabel,
    roadmap: mapRoadmapItems(items),
    generatedAt: new Date().toISOString(),
  };
}
