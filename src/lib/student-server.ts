import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/server/db";
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
    college: student.college || "IIT Delhi",
    targetRole: primaryCareerData?.title || student.targetRole || "AI Engineer",
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
    college: student.college || "IIT Delhi",
    targetRole: student.targetRole || "AI Engineer",
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