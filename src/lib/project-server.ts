import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/server/db.server";
import { getAuthenticatedStudentProfile } from "@/server/auth-context";
import { calculateStudentReadiness } from "@/server/readiness";
import {
  VERIFICATION_PREFERENCE_ORDER,
  type VerificationLevel,
} from "@/types";

export interface ProjectSubmissionInput {
  title: string;
  description: string;
  skillName: string;
  projectUrl?: string;
  repoUrl?: string;
  evidenceText?: string;
}

export interface ProjectSubmissionItem {
  id: string;
  title: string;
  description: string;
  skillName: string;
  projectUrl: string | null;
  repoUrl: string | null;
  evidenceText: string | null;
  status: "SUBMITTED" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED";
  reviewerNotes: string | null;
  score: number | null;
  submittedAt: string;
  verifiedAt: string | null;
}

/**
 * Submit a practical project for verification.
 * Status starts at SUBMITTED (never auto-verified).
 */
export const submitProjectEvidence = createServerFn({
  method: "POST",
})
  .validator((input: ProjectSubmissionInput) => input)
  .handler(async ({ data }): Promise<{ success: boolean; submissionId: string; message: string }> => {
    const student = await getAuthenticatedStudentProfile({
      skills: { include: { skill: true } },
    });

    if (!student) {
      throw new Error("Student authentication required.");
    }

    if (!data.title.trim() || !data.description.trim() || !data.skillName.trim()) {
      throw new Error("Project title, description, and target skill are required.");
    }

    // Ensure skill exists
    let skill = await prisma.skill.findFirst({
      where: { name: { equals: data.skillName.trim(), mode: "insensitive" } },
    });

    if (!skill) {
      skill = await prisma.skill.create({
        data: {
          name: data.skillName.trim(),
          demand: "High",
        },
      });
    }

    // Create the submission record with SUBMITTED status
    const submission = await prisma.projectSubmission.create({
      data: {
        studentId: student.id,
        title: data.title.trim(),
        description: data.description.trim(),
        skillName: data.skillName.trim(),
        projectUrl: data.projectUrl?.trim() || null,
        repoUrl: data.repoUrl?.trim() || null,
        evidenceText: data.evidenceText?.trim() || null,
        status: "SUBMITTED",
      },
    });

    return {
      success: true,
      submissionId: submission.id,
      message: "Project evidence submitted successfully and queued for verification.",
    };
  });

/**
 * Fetch all project submissions for the current student.
 */
export const getStudentProjectSubmissions = createServerFn({
  method: "GET",
}).handler(async (): Promise<{ submissions: ProjectSubmissionItem[] }> => {
  const student = await getAuthenticatedStudentProfile();

  if (!student) {
    return { submissions: [] };
  }

  const submissions = await prisma.projectSubmission.findMany({
    where: { studentId: student.id },
    orderBy: { submittedAt: "desc" },
  });

  return {
    submissions: submissions.map((sub) => ({
      id: sub.id,
      title: sub.title,
      description: sub.description,
      skillName: sub.skillName,
      projectUrl: sub.projectUrl,
      repoUrl: sub.repoUrl,
      evidenceText: sub.evidenceText,
      status: sub.status as "SUBMITTED" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED",
      reviewerNotes: sub.reviewerNotes,
      score: sub.score,
      submittedAt: sub.submittedAt.toISOString(),
      verifiedAt: sub.verifiedAt ? sub.verifiedAt.toISOString() : null,
    })),
  };
});

/**
 * Review/Verify a project submission (Evaluator action).
 * When approved (VERIFIED), elevates the skill tier to PROJECT_VERIFIED (tier 3),
 * respecting the anti-downgrade hierarchy.
 */
export const reviewProjectSubmission = createServerFn({
  method: "POST",
})
  .validator((input: {
    submissionId: string;
    action: "APPROVE" | "REJECT" | "SET_UNDER_REVIEW";
    reviewerNotes?: string;
    score?: number;
  }) => input)
  .handler(async ({ data }): Promise<{ success: boolean; newStatus: string }> => {
    const submission = await prisma.projectSubmission.findUnique({
      where: { id: data.submissionId },
      include: {
        student: {
          include: {
            skills: { include: { skill: true } },
          },
        },
      },
    });

    if (!submission) {
      throw new Error("Project submission not found.");
    }

    const now = new Date();

    if (data.action === "SET_UNDER_REVIEW") {
      await prisma.projectSubmission.update({
        where: { id: submission.id },
        data: {
          status: "UNDER_REVIEW",
          reviewerNotes: data.reviewerNotes || submission.reviewerNotes,
        },
      });
      return { success: true, newStatus: "UNDER_REVIEW" };
    }

    if (data.action === "REJECT") {
      await prisma.projectSubmission.update({
        where: { id: submission.id },
        data: {
          status: "REJECTED",
          reviewerNotes: data.reviewerNotes || "Project evidence did not meet verification criteria.",
        },
      });
      return { success: true, newStatus: "REJECTED" };
    }

    // Action === "APPROVE"
    const score = data.score ?? 85;
    await prisma.projectSubmission.update({
      where: { id: submission.id },
      data: {
        status: "VERIFIED",
        reviewerNotes: data.reviewerNotes || "Verified practical project implementation.",
        score,
        verifiedAt: now,
      },
    });

    // Update student skill verification level
    const existingStudentSkill = submission.student.skills.find(
      (s) => s.skill.name.toLowerCase() === submission.skillName.toLowerCase()
    );

    let skill = await prisma.skill.findFirst({
      where: { name: { equals: submission.skillName, mode: "insensitive" } },
    });

    if (!skill) {
      skill = await prisma.skill.create({
        data: { name: submission.skillName, demand: "High" },
      });
    }

    if (existingStudentSkill) {
      const currentOrder = VERIFICATION_PREFERENCE_ORDER[existingStudentSkill.verificationLevel] || 1;
      const projectOrder = VERIFICATION_PREFERENCE_ORDER["PROJECT_VERIFIED"];

      const targetLevel: VerificationLevel =
        currentOrder > projectOrder
          ? existingStudentSkill.verificationLevel
          : "PROJECT_VERIFIED";

      await prisma.studentSkill.update({
        where: { id: existingStudentSkill.id },
        data: {
          score: Math.max(existingStudentSkill.score, score),
          confidence: Math.max(existingStudentSkill.confidence || 85, 95),
          verificationLevel: targetLevel,
          projectEvidence: `${submission.title} (${submission.repoUrl || submission.projectUrl || "Repository & Live Build verified"})`,
          evidence: `Verified via Practical Project: ${submission.title} (Score: ${score}%).`,
          evidenceSource: "Practical Project",
          lastVerifiedAt: now,
          lastDemonstratedAt: now,
        },
      });
    } else {
      await prisma.studentSkill.create({
        data: {
          studentId: submission.studentId,
          skillId: skill.id,
          score,
          confidence: 95,
          verificationLevel: "PROJECT_VERIFIED",
          projectEvidence: `${submission.title} (${submission.repoUrl || submission.projectUrl || "Repository verified"})`,
          evidence: `Verified via Practical Project: ${submission.title} (Score: ${score}%).`,
          evidenceSource: "Practical Project",
          lastVerifiedAt: now,
          lastDemonstratedAt: now,
        },
      });
    }

    // Create Credential
    const existingCred = await prisma.credential.findFirst({
      where: {
        studentId: submission.studentId,
        title: `${submission.title} — Project Verification`,
      },
    });

    if (!existingCred) {
      await prisma.credential.create({
        data: {
          studentId: submission.studentId,
          title: `${submission.title} — Project Verification`,
          type: "PROJECT",
          issuer: "SkillBridge Practical Review",
          verified: true,
          score,
          skills: [submission.skillName],
          url: submission.repoUrl || submission.projectUrl,
          issuedAt: now,
        },
      });
    }

    // Recalculate student readiness
    const { readiness } = await calculateStudentReadiness(submission.studentId);
    await prisma.studentProfile.update({
      where: { id: submission.studentId },
      data: { readiness },
    });

    return { success: true, newStatus: "VERIFIED" };
  });
