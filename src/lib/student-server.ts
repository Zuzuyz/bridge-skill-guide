import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/server/db.server";
import { getAuthenticatedStudentProfile } from "@/server/auth-context";
import {
  getSkillCategory,
  generateSkillScoreExplanation,
} from "@/lib/local-skill-extractor";
import {
  VERIFICATION_LEVEL_LABELS,
  type VerificationLevel,
  type SkillPassportData,
} from "@/types";
import { calculateStudentReadiness } from "@/server/readiness";
import type { CareerDemandProfile } from "@/types";

/* -------------------------------------------------------------
   Career Journey — shared contract between the server-side
   real-state computation and the dashboard component. `href` is
   a literal union so the typed router Link accepts every CTA.
------------------------------------------------------------- */
export type CareerJourneyStageId =
  | "assessment"
  | "skills"
  | "skill-gaps"
  | "career"
  | "roadmap"
  | "projects"
  | "internships"
  | "outcomes";

export type CareerJourneyStageState = "COMPLETED" | "CURRENT" | "UPCOMING";

export type CareerJourneyStage = {
  id: CareerJourneyStageId;
  label: string;
  state: CareerJourneyStageState;
  detail: string;
};

export type CareerJourneyAction = {
  label: string;
  description: string;
  href:
    | "/student/assessments"
    | "/student/careers"
    | "/student/skill-gap"
    | "/student/skill-development"
    | "/student/roadmap"
    | "/student/projects"
    | "/internships"
    | "/student/applications";
};

export type CareerJourney = {
  stages: CareerJourneyStage[];
  nextAction: CareerJourneyAction;
};

export const getStudentDashboard = createServerFn({
  method: "GET",
}).handler(async () => {
  const student = await getAuthenticatedStudentProfile({
    user: true,
    skills: {
      include: {
        skill: true,
      },
      orderBy: {
        score: "desc",
      },
    },
    skillGaps: {
      include: {
        skill: true,
      },
    },
    roadmapItems: {
      orderBy: {
        step: "asc",
      },
    },
    assessmentAttempts: true,
    credentials: true,
    studentCareers: {
      include: {
        career: {
          include: {
            requiredSkills: { include: { skill: true } },
          },
        },
      },
      orderBy: { isPrimary: "desc" },
    },
  });

  if (!student) {
    return null;
  }

  const { readiness, breakdown } = await calculateStudentReadiness(student.id);

  // Sync readiness to DB if changed
  if (student.readiness !== readiness) {
    await prisma.studentProfile.update({
      where: { id: student.id },
      data: { readiness },
    });
  }

  const applicationCount = await prisma.application.count({
    where: {
      studentId: student.userId,
    },
  });

  const skills = student.skills.map((item) => {
    const rawLevel = (item.verificationLevel as VerificationLevel) || (item.evidence?.includes("Verified via SkillBridge") ? "ASSESSMENT_VERIFIED" : "RESUME_DETECTED");
    const label = VERIFICATION_LEVEL_LABELS[rawLevel] || "Resume Detected";
    const isVerified = rawLevel !== "RESUME_DETECTED";

    const explanation = generateSkillScoreExplanation({
      skillName: item.skill.name,
      score: item.score,
      verificationLevel: rawLevel,
      evidence: item.evidence,
      assessmentScore: item.assessmentScore,
      projectEvidence: item.projectEvidence,
      institutionVerification: item.institutionVerification,
      employerVerification: item.employerVerification,
    });

    return {
      id: item.skill.id,
      name: item.skill.name,
      score: item.score,
      confidence: item.confidence ?? 88,
      evidence: item.evidence ?? undefined,
      evidenceSource: item.evidenceSource ?? "Resume",
      verificationLevel: rawLevel,
      verificationLabel: label,
      lastDemonstratedAt: item.lastDemonstratedAt ? item.lastDemonstratedAt.toISOString() : null,
      lastVerifiedAt: item.lastVerifiedAt ? item.lastVerifiedAt.toISOString() : null,
      assessmentScore: item.assessmentScore,
      projectEvidence: item.projectEvidence,
      institutionVerification: item.institutionVerification,
      employerVerification: item.employerVerification,
      explanation,
      demand: (item.skill.demand as "High" | "Growing" | "Emerging" | null) ?? (item.score >= 80 ? "High" : "Growing"),
      category: getSkillCategory(item.skill.name),
      isVerified,
    };
  });

  const studentSkillsSet = new Set(student.skills.map((s) => s.skill.name.toLowerCase()));

  let primaryCareerEntry = student.studentCareers.find((sc) => sc.isPrimary);
  const secondaryCareerEntries = student.studentCareers.filter((sc) => !sc.isPrimary);

  if (!primaryCareerEntry && student.targetRole) {
    const matchedCareer = await prisma.career.findFirst({
      where: { title: { equals: student.targetRole.trim(), mode: "insensitive" } },
      include: { requiredSkills: { include: { skill: true } } },
    });
    if (matchedCareer) {
      await prisma.studentCareer.create({
        data: {
          studentId: student.id,
          careerId: matchedCareer.id,
          isPrimary: true,
        },
      });
      primaryCareerEntry = {
        id: "auto-migrated",
        studentId: student.id,
        careerId: matchedCareer.id,
        isPrimary: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        career: matchedCareer,
      } as any;
    }
  }

  const primaryCareerData = primaryCareerEntry
    ? {
        id: primaryCareerEntry.career.id,
        title: primaryCareerEntry.career.title,
        slug: primaryCareerEntry.career.slug,
        category: primaryCareerEntry.career.category,
        totalRequiredSkillsCount: primaryCareerEntry.career.requiredSkills.length,
        evidenceCoveredSkillsCount: primaryCareerEntry.career.requiredSkills.filter((rs) =>
          studentSkillsSet.has(rs.skill.name.toLowerCase())
        ).length,
      }
    : null;

  /* ------------------------------------------------------------------
     Career Journey — real state derived from this student's persisted
     records only. No invented progress values; every stage reflects an
     actual database condition.
  ------------------------------------------------------------------ */
  const hasAssessmentAttempt = student.assessmentAttempts.length > 0;
  const skillsCount = student.skills.length;

  /* ----------------------------------------------------------------
     Phase 7 skill-gap state — the SkillGap table is the persisted
     source of truth. computeCareerSkillGap() upserts one row per
     required skill of the analyzed career INCLUDING STRONG rows, so
     scoped to the primary career's required skills:
       0 rows  -> analysis not run for this career
       rows all STRONG -> analysis run, zero priority gaps
       rows non-STRONG -> priority gaps exist
     Rows left over from a previously analyzed career must not count
     toward the current career's analysis. Status is reused verbatim
     from SkillGap.status — no new scoring. Ascending score ordering
     (MISSING first) mirrors Phase 7's own missing-first priority.
  ---------------------------------------------------------------- */
  const primaryRequiredSkillIds =
    primaryCareerEntry
      ? new Set(
          primaryCareerEntry.career.requiredSkills.map((rs) => rs.skillId),
        )
      : null;
  const careerRequiredSkillCount = primaryRequiredSkillIds?.size ?? 0;
  const careerTrackedGaps =
    primaryRequiredSkillIds !== null
      ? student.skillGaps.filter((gap) =>
          primaryRequiredSkillIds.has(gap.skillId),
        )
      : student.skillGaps;
  const trackedGapCount = student.skillGaps.length;
  const careerTrackedGapCount = careerTrackedGaps.length;
  const priorityGaps = careerTrackedGaps
    .filter((gap) => gap.status !== "STRONG")
    .sort((a, b) => a.score - b.score);
  const priorityGapCount = priorityGaps.length;
  const topPriorityGapName = priorityGaps[0]?.skill.name ?? null;

  /* Gap analysis performed? A career that defines no required skills
     has nothing to analyze (vacuously complete). With requirements,
     zero scoped rows means the analysis has not been persisted. */
  const gapAnalysisPerformed =
    primaryRequiredSkillIds !== null && primaryCareerEntry
      ? careerRequiredSkillCount === 0 || careerTrackedGapCount > 0
      : trackedGapCount > 0;

  const skillGapStageDetail = (() => {
    if (primaryRequiredSkillIds !== null && primaryCareerEntry && careerRequiredSkillCount === 0) {
      return "No skill requirements defined for this career";
    }
    if (!gapAnalysisPerformed) {
      return primaryRequiredSkillIds !== null && primaryCareerEntry
        ? "No gap analysis run for this career yet"
        : "No gap analysis run yet";
    }
    if (priorityGapCount === 0) {
      return `All ${careerTrackedGapCount} tracked skill${careerTrackedGapCount === 1 ? "" : "s"} are strong`;
    }
    return `${priorityGapCount} of ${careerTrackedGapCount} tracked gap${careerTrackedGapCount === 1 ? "" : "s"} need work${topPriorityGapName ? ` · ${topPriorityGapName}` : ""}`;
  })();
  const roadmapTotal = student.roadmapItems.length;
  const roadmapCompleted = student.roadmapItems.filter(
    (item) => item.status === "COMPLETE",
  ).length;

  const [projectCount, outcomeCount] = await Promise.all([
    prisma.projectSubmission.count({ where: { studentId: student.id } }),
    prisma.outcome.count({ where: { studentId: student.id } }),
  ]);

  const stageCompletion: Record<CareerJourneyStageId, boolean> = {
    assessment: hasAssessmentAttempt,
    skills: skillsCount > 0,
    "skill-gaps": gapAnalysisPerformed,
    career: primaryCareerData !== null,
    roadmap: roadmapTotal > 0 && roadmapCompleted === roadmapTotal,
    projects: projectCount > 0,
    internships: applicationCount > 0,
    outcomes: outcomeCount > 0,
  };

  const stageOrder: CareerJourneyStageId[] = [
    "assessment",
    "skills",
    "skill-gaps",
    "career",
    "roadmap",
    "projects",
    "internships",
    "outcomes",
  ];

  const currentStageId =
    stageOrder.find((id) => !stageCompletion[id]) ?? null;

  const stageState = (id: CareerJourneyStageId) => {
    if (stageCompletion[id]) return "COMPLETED" as const;
    if (id === currentStageId) return "CURRENT" as const;
    return "UPCOMING" as const;
  };

  const journey: CareerJourney = {
    stages: stageOrder.map((id) => {
      switch (id) {
        case "assessment":
          return {
            id,
            label: "Assessment",
            state: stageState(id),
            detail: hasAssessmentAttempt
              ? `${student.assessmentAttempts.length} assessment attempt${student.assessmentAttempts.length === 1 ? "" : "s"} recorded`
              : "No assessment attempts yet",
          };
        case "skills":
          return {
            id,
            label: "Skills",
            state: stageState(id),
            detail:
              skillsCount > 0
                ? `${skillsCount} skill${skillsCount === 1 ? "" : "s"} in your inventory`
                : "Skill inventory is empty",
          };
        case "skill-gaps":
          return {
            id,
            label: "Skill Gaps",
            state: stageState(id),
            detail: skillGapStageDetail,
          };
        case "career":
          return {
            id,
            label: "Career Direction",
            state: stageState(id),
            detail: primaryCareerData
              ? `Primary target: ${primaryCareerData.title}`
              : "No primary career selected",
          };
        case "roadmap":
          return {
            id,
            label: "Career Roadmap",
            state: stageState(id),
            detail:
              roadmapTotal === 0
                ? "No roadmap generated yet"
                : `${roadmapCompleted} of ${roadmapTotal} milestone${roadmapTotal === 1 ? "" : "s"} complete`,
          };
        case "projects":
          return {
            id,
            label: "Projects",
            state: stageState(id),
            detail:
              projectCount > 0
                ? `${projectCount} project submission${projectCount === 1 ? "" : "s"}`
                : "No projects submitted yet",
          };
        case "internships":
          return {
            id,
            label: "Internships",
            state: stageState(id),
            detail:
              applicationCount > 0
                ? `${applicationCount} application${applicationCount === 1 ? "" : "s"} submitted`
                : "No applications yet",
          };
        case "outcomes":
          return {
            id,
            label: "Outcomes",
            state: stageState(id),
            detail:
              outcomeCount > 0
                ? `${outcomeCount} verified outcome${outcomeCount === 1 ? "" : "s"} recorded`
                : "No verified outcomes recorded",
          };
      }
    }),
    nextAction: (() => {
      if (!hasAssessmentAttempt) {
        return {
          label: "Complete your skill assessment",
          description:
            "Take your first assessment to create verified skill evidence.",
          href: "/student/assessments",
        };
      }
      if (skillsCount === 0) {
        return {
          label: "Verify your skills with an assessment",
          description:
            "Your skill inventory is empty — assessments create verified evidence.",
          href: "/student/assessments",
        };
      }
      if (!primaryCareerData) {
        return {
          label: "Choose your career direction",
          description:
            "Select a primary career to unlock tailored requirements and readiness.",
          href: "/student/careers",
        };
      }
      if (!gapAnalysisPerformed) {
        return {
          label: "Analyze your skill gaps",
          description:
            "Run a gap analysis to compare your evidence against career requirements.",
          href: "/student/skill-gap",
        };
      }
      if (roadmapTotal > 0 && roadmapCompleted < roadmapTotal) {
        return {
          label: "Continue your career roadmap",
          description: `${roadmapTotal - roadmapCompleted} roadmap milestone${roadmapTotal - roadmapCompleted === 1 ? "" : "s"} still open.`,
          href: "/student/roadmap",
        };
      }
      if (priorityGapCount > 0) {
        return {
          label: "Build your priority skills",
          description: topPriorityGapName
            ? `Priority gap: ${topPriorityGapName}.`
            : `${priorityGapCount} priority gap${priorityGapCount === 1 ? "" : "s"} identified.`,
          href: "/student/skill-development",
        };
      }
      if (projectCount === 0) {
        return {
          label: "Build your first project",
          description:
            "Submit project evidence to strengthen your verified skill profile.",
          href: "/student/projects",
        };
      }
      if (applicationCount === 0) {
        return {
          label: "Explore internships",
          description:
            "Browse matched internship opportunities and submit your first application.",
          href: "/internships",
        };
      }
      if (outcomeCount === 0) {
        return {
          label: "Track your outcomes",
          description:
            "Outcomes and employer feedback appear here once recorded.",
          href: "/student/applications",
        };
      }
      return {
        label: "Review your career progress",
        description:
          "All journey stages have real activity — review your gaps and readiness.",
        href: "/student/skill-gap",
      };
    })(),
  };

  /* Real persisted IndustryDemand for the student's primary career,
     reusing the existing Phase 6 demand engine (no second algorithm). */
  let industryDemand: CareerDemandProfile | null = null;
  if (primaryCareerEntry) {
    const { getCareerDemandProfile } = await import(
      "@/lib/industry-demand-core.server"
    );
    industryDemand = await getCareerDemandProfile(primaryCareerEntry.career.id);
  }

  const secondaryCareersData = secondaryCareerEntries.map((sc) => ({
    id: sc.career.id,
    title: sc.career.title,
    slug: sc.career.slug,
    category: sc.career.category,
    totalRequiredSkillsCount: sc.career.requiredSkills.length,
    evidenceCoveredSkillsCount: sc.career.requiredSkills.filter((rs) =>
      studentSkillsSet.has(rs.skill.name.toLowerCase())
    ).length,
  }));

  return {
    id: student.id,
    name: student.user.name,
    email: student.user.email,
    college: student.college,
    targetRole: primaryCareerData?.title || student.targetRole || null,
    careerDirection: {
      primary: primaryCareerData,
      secondaries: secondaryCareersData,
      totalSelectedCount: (primaryCareerData ? 1 : 0) + secondaryCareersData.length,
    },
    readiness,
    readinessBreakdown: breakdown,
    passportShareable: student.passportShareable ?? false,
    passportShareToken: student.passportShareToken,

    skills,

    skillGaps: student.skillGaps.map((item) => ({
      skill: item.skill.name,
      score: item.score,
      status: item.status,
    })),

    roadmap: student.roadmapItems.map((item) => ({
      id: item.id,
      step: item.step,
      skill: item.skill,
      status: item.status,
      difficulty: item.difficulty,
      duration: item.duration,
      resource: item.resource,
      project: item.project,
    })),

    applicationCount,

    journey,
    industryDemand,
  };
});

export const getSkillPassportData = createServerFn({
  method: "GET",
}).handler(async (): Promise<SkillPassportData | null> => {
  const student = await getAuthenticatedStudentProfile({
    user: true,
    skills: {
      include: {
        skill: true,
      },
      orderBy: {
        score: "desc",
      },
    },
    assessmentAttempts: true,
    credentials: true,
  });

  if (!student) {
    return null;
  }

  const { readiness, breakdown } = await calculateStudentReadiness(student.id);

  let resumeDetected = 0;
  let assessmentVerified = 0;
  let projectVerified = 0;
  let institutionVerified = 0;
  let employerVerified = 0;

  const skills = student.skills.map((item) => {
    const rawLevel = (item.verificationLevel as VerificationLevel) || (item.evidence?.includes("Verified via SkillBridge") ? "ASSESSMENT_VERIFIED" : "RESUME_DETECTED");
    const label = VERIFICATION_LEVEL_LABELS[rawLevel] || "Resume Detected";
    const isVerified = rawLevel !== "RESUME_DETECTED";

    if (rawLevel === "EMPLOYER_VERIFIED") employerVerified++;
    else if (rawLevel === "INSTITUTION_VERIFIED") institutionVerified++;
    else if (rawLevel === "PROJECT_VERIFIED") projectVerified++;
    else if (rawLevel === "ASSESSMENT_VERIFIED") assessmentVerified++;
    else resumeDetected++;

    const explanation = generateSkillScoreExplanation({
      skillName: item.skill.name,
      score: item.score,
      verificationLevel: rawLevel,
      evidence: item.evidence,
      assessmentScore: item.assessmentScore,
      projectEvidence: item.projectEvidence,
      institutionVerification: item.institutionVerification,
      employerVerification: item.employerVerification,
    });

    return {
      id: item.skill.id,
      name: item.skill.name,
      score: item.score,
      confidence: item.confidence ?? 88,
      evidence: item.evidence ?? undefined,
      evidenceSource: item.evidenceSource ?? "Resume",
      verificationLevel: rawLevel,
      verificationLabel: label,
      lastDemonstratedAt: item.lastDemonstratedAt ? item.lastDemonstratedAt.toISOString() : null,
      lastVerifiedAt: item.lastVerifiedAt ? item.lastVerifiedAt.toISOString() : null,
      assessmentScore: item.assessmentScore,
      projectEvidence: item.projectEvidence,
      institutionVerification: item.institutionVerification,
      employerVerification: item.employerVerification,
      explanation,
      demand: (item.skill.demand as "High" | "Growing" | "Emerging" | null) ?? (item.score >= 80 ? "High" : "Growing"),
      category: getSkillCategory(item.skill.name),
      isVerified,
    };
  });

  return {
    studentName: student.user.name,
    email: student.user.email,
    college: student.college,
    targetRole: student.targetRole || null,
    readiness,
    readinessBreakdown: breakdown,
    isShareable: student.passportShareable ?? false,
    shareToken: student.passportShareToken,
    skillsCount: skills.length,
    evidenceSummary: {
      resumeDetected,
      assessmentVerified,
      projectVerified,
      institutionVerified,
      employerVerified,
    },
    skills,
  };
});

export const togglePassportShareable = createServerFn({
  method: "POST",
})
  .validator((data: { shareable: boolean }) => data)
  .handler(async ({ data }) => {
    const student = await getAuthenticatedStudentProfile();
    if (!student) {
      throw new Error("Unauthorized");
    }

    let token = student.passportShareToken;
    if (data.shareable && !token) {
      token = `pass_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    }

    const updated = await prisma.studentProfile.update({
      where: { id: student.id },
      data: {
        passportShareable: data.shareable,
        passportShareToken: data.shareable ? token : token,
      },
    });

    return {
      shareable: updated.passportShareable,
      shareToken: updated.passportShareToken,
    };
  });