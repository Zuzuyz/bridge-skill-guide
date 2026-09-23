import { prisma } from "@/server/db.server";
import { calculateStudentReadiness } from "@/server/readiness";
import { getSkillCategory } from "@/lib/local-skill-extractor";
import {
  VERIFICATION_LEVEL_LABELS,
  type PublicSkillPassportData,
  type VerificationLevel,
} from "@/types";

/* =========================================================
   PHASE 11/12 — PUBLIC PASSPORT PAYLOAD (SERVER-ONLY)
   ---------------------------------------------------------
   Strict, privacy-limited Skill Passport payload builder.
   Shared by:
   - the Phase 11 public share view (passport-server.ts)
   - the Phase 12 employer candidate view (employer-server.ts)

   NEVER include here: email, internal IDs, reviewer notes,
   assessment question/answer details, unverified records,
   or any authentication/share-token material.
   ========================================================= */

export async function buildPublicPassportPayload(
  studentId: string,
): Promise<PublicSkillPassportData> {
  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    include: {
      user: { select: { name: true } },
      skills: {
        include: { skill: true },
        orderBy: { score: "desc" },
      },
      projectSubmissions: true,
      assessmentAttempts: {
        include: { assessment: true },
      },
      credentials: true,
      studentCareers: {
        include: { career: true },
        orderBy: { isPrimary: "desc" },
      },
    },
  });

  if (!student) {
    throw new Error("Student profile not found.");
  }

  const { readiness } = await calculateStudentReadiness(student.id);

  let resumeDetected = 0;
  let assessmentVerified = 0;
  let projectVerified = 0;
  let institutionVerified = 0;
  let employerVerified = 0;

  const skills = student.skills.map((item) => {
    const rawLevel =
      (item.verificationLevel as VerificationLevel) ||
      (item.evidence?.includes("Verified via SkillBridge")
        ? "ASSESSMENT_VERIFIED"
        : "RESUME_DETECTED");

    if (rawLevel === "EMPLOYER_VERIFIED") employerVerified++;
    else if (rawLevel === "INSTITUTION_VERIFIED") institutionVerified++;
    else if (rawLevel === "PROJECT_VERIFIED") projectVerified++;
    else if (rawLevel === "ASSESSMENT_VERIFIED") assessmentVerified++;
    else resumeDetected++;

    return {
      name: item.skill.name,
      score: item.score,
      verificationLevel: rawLevel,
      verificationLabel:
        VERIFICATION_LEVEL_LABELS[rawLevel] || "Resume Detected",
      category: getSkillCategory(item.skill.name),
      evidence: item.evidence ?? null,
    };
  });

  // Public view intentionally shows only verified projects.
  const verifiedProjects = student.projectSubmissions
    .filter((p) => p.status === "VERIFIED")
    .sort(
      (a, b) =>
        (b.verifiedAt?.getTime() ?? 0) - (a.verifiedAt?.getTime() ?? 0),
    )
    .map((p) => ({
      title: p.title,
      description: p.description,
      skillName: p.skillName,
      projectUrl: p.projectUrl,
      repoUrl: p.repoUrl,
      verifiedAt: p.verifiedAt ? p.verifiedAt.toISOString() : null,
    }));

  // Public view intentionally shows only passed assessments,
  // without any question/answer details.
  const passedAssessments = student.assessmentAttempts
    .filter((a) => a.passed && a.completedAt)
    .sort(
      (a, b) =>
        (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0),
    )
    .slice(0, 8)
    .map((a) => ({
      title: a.assessment.title,
      category: a.assessment.category,
      percentage: a.percentage,
      completedAt: a.completedAt ? a.completedAt.toISOString() : null,
    }));

  const credentials = student.credentials
    .filter((c) => c.verified)
    .sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime())
    .map((c) => ({
      title: c.title,
      type: c.type,
      issuer: c.issuer,
      score: c.score,
      skills: c.skills,
      issuedAt: c.issuedAt.toISOString(),
      url: c.url,
    }));

  const careers = student.studentCareers.map((sc) => ({
    title: sc.career.title,
    category: sc.career.category,
    isPrimary: sc.isPrimary,
  }));

  return {
    studentName: student.user.name,
    college: student.college,
    targetRole: student.targetRole,
    readiness,
    evidenceSummary: {
      resumeDetected,
      assessmentVerified,
      projectVerified,
      institutionVerified,
      employerVerified,
    },
    skills,
    verifiedProjects,
    passedAssessments,
    credentials,
    careers,
    generatedAt: new Date().toISOString(),
  };
}
