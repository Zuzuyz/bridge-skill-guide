import { prisma } from "./db";
import type { ReadinessBreakdown } from "../types";

export async function calculateStudentReadiness(studentId: string): Promise<{
  readiness: number;
  breakdown: ReadinessBreakdown;
}> {
  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    include: {
      skills: {
        include: { skill: true },
      },
      assessmentAttempts: true,
      credentials: true,
    },
  });

  if (!student || student.skills.length === 0) {
    return {
      readiness: 0,
      breakdown: {
        overall: 0,
        skillMatch: 0,
        verifiedSkills: 0,
        projectEvidence: 0,
        assessmentScore: 0,
        formula: "Readiness = (Skill Match × 40%) + (Verified Skills × 30%) + (Assessments × 20%) + (Projects × 10%)",
      },
    };
  }

  // 1. Skill Match / Proficiency Score (Average of student's skills)
  const totalSkillScore = student.skills.reduce((acc, s) => acc + s.score, 0);
  const skillMatch = Math.round(totalSkillScore / student.skills.length);

  // 2. Verified Skills Ratio (How many skills are backed by assessment, project, institution, or employer)
  const verifiedCount = student.skills.filter((s) => {
    const lvl = s.verificationLevel;
    return lvl === "ASSESSMENT_VERIFIED" || lvl === "PROJECT_VERIFIED" || lvl === "INSTITUTION_VERIFIED" || lvl === "EMPLOYER_VERIFIED" || (s.evidence?.includes("Verified via SkillBridge"));
  }).length;
  const verifiedSkillsRatio = Math.round((verifiedCount / student.skills.length) * 100);

  // 3. Proctored Assessment Score Average
  let assessmentAvg = 0;
  if (student.assessmentAttempts.length > 0) {
    const totalAssessmentScore = student.assessmentAttempts.reduce((acc, a) => acc + a.score, 0);
    assessmentAvg = Math.round(totalAssessmentScore / student.assessmentAttempts.length);
  } else {
    // If no assessment attempts, check if any skill has assessmentScore
    const skillsWithAssessments = student.skills.filter((s) => typeof s.assessmentScore === "number" && s.assessmentScore > 0);
    if (skillsWithAssessments.length > 0) {
      assessmentAvg = Math.round(skillsWithAssessments.reduce((acc, s) => acc + (s.assessmentScore || 0), 0) / skillsWithAssessments.length);
    }
  }

  // 4. Project Evidence
  const projectVerifiedCount = student.skills.filter((s) => s.verificationLevel === "PROJECT_VERIFIED" || s.projectEvidence || s.evidence?.toLowerCase().includes("project")).length;
  const projectEvidenceScore = Math.min(100, Math.round((projectVerifiedCount / Math.max(1, student.skills.length)) * 100));

  // 5. Final Authoritative Readiness
  // If assessments or verified skills exist, aggregate all components with weights
  let overall = 0;
  if (assessmentAvg > 0 || verifiedSkillsRatio > 0) {
    overall = Math.round(
      skillMatch * 0.40 +
      verifiedSkillsRatio * 0.30 +
      assessmentAvg * 0.20 +
      projectEvidenceScore * 0.10
    );
  } else {
    // Pure resume stage: bounded between 40% and 80% based on resume skill depth
    overall = Math.min(80, Math.max(45, Math.round(skillMatch * 0.85)));
  }

  overall = Math.max(0, Math.min(99, overall));

  const formula = "Overall Readiness = (Skill Match × 40%) + (Verified Skills × 30%) + (Assessment Avg × 20%) + (Project Evidence × 10%)";

  return {
    readiness: overall,
    breakdown: {
      overall,
      skillMatch,
      verifiedSkills: verifiedSkillsRatio,
      projectEvidence: projectEvidenceScore,
      assessmentScore: assessmentAvg,
      formula,
    },
  };
}
