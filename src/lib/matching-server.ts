import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/server/db";
import { getAuthenticatedStudentProfile } from "@/server/auth-context";

export const getInternshipMatch = createServerFn({
  method: "GET",
})
  .validator((internshipId: string) => internshipId)
  .handler(async ({ data: internshipId }) => {
    const student = await getAuthenticatedStudentProfile({
      user: true,
      skills: {
        include: {
          skill: true,
        },
      },
    });

    if (!student) {
      throw new Error("No student profile found.");
    }

    const internship = await prisma.internship.findUnique({
      where: {
        id: internshipId,
      },
      include: {
        company: true,
        requiredSkills: {
          include: {
            skill: true,
          },
        },
      },
    });

    if (!internship) {
      throw new Error("Internship not found.");
    }

    /*
     * ---------------------------------------------------------
     * STUDENT SKILL MAP
     * ---------------------------------------------------------
     */

    const studentSkillsMap = new Map(
      student.skills.map((item) => [
        normalizeSkill(item.skill.name),
        item,
      ]),
    );

    const matchedSkills: string[] = [];
    const weakSkills: string[] = [];
    const missingSkills: string[] = [];

    const matchedSkillsDetails: Array<{
      name: string;
      score: number;
      verificationLevel: string;
      verificationLabel: string;
      evidence?: string | undefined;
    }> = [];

    const weakSkillsDetails: Array<{
      name: string;
      score: number;
      verificationLevel: string;
      verificationLabel: string;
      evidence?: string | undefined;
    }> = [];

    let totalSkillScore = 0;

    /*
     * ---------------------------------------------------------
     * SKILL MATCHING WITH EVIDENCE
     * ---------------------------------------------------------
     */

    for (const required of internship.requiredSkills) {
      const skillName = required.skill.name;
      const normalizedName = normalizeSkill(skillName);

      const studentSkill = studentSkillsMap.get(normalizedName);

      if (!studentSkill) {
        missingSkills.push(skillName);
        continue;
      }

      const score = studentSkill.score;
      totalSkillScore += score;

      const rawLevel = studentSkill.verificationLevel || (studentSkill.evidence?.includes("Verified via SkillBridge") ? "ASSESSMENT_VERIFIED" : "RESUME_DETECTED");
      const verificationLabel =
        rawLevel === "ASSESSMENT_VERIFIED"
          ? "Assessment Verified"
          : rawLevel === "PROJECT_VERIFIED"
            ? "Project Verified"
            : rawLevel === "INSTITUTION_VERIFIED"
              ? "Institution Verified"
              : rawLevel === "EMPLOYER_VERIFIED"
                ? "Employer Verified"
                : "Resume Detected";

      const detail = {
        name: skillName,
        score,
        verificationLevel: rawLevel,
        verificationLabel,
        evidence: studentSkill.evidence || undefined,
      };

      if (score >= 70) {
        matchedSkills.push(skillName);
        matchedSkillsDetails.push(detail);
      } else {
        weakSkills.push(skillName);
        weakSkillsDetails.push(detail);
      }
    }

    const requiredSkillCount = internship.requiredSkills.length;

    const skillMatch =
      requiredSkillCount === 0
        ? 0
        : totalSkillScore / requiredSkillCount;

    /*
     * ---------------------------------------------------------
     * CAREER ALIGNMENT
     * ---------------------------------------------------------
     */

    const careerAlignment = calculateCareerAlignment(
      student.targetRole ?? "",
      internship.role,
    );

    /*
     * ---------------------------------------------------------
     * FINAL SCORE
     * ---------------------------------------------------------
     */

    const matchPercentage = Math.round(
      skillMatch * 0.8 +
        careerAlignment * 0.2,
    );

    return {
      internshipId: internship.id,
      matchPercentage,
      skillMatch: Math.round(skillMatch),
      careerAlignment,
      matchedSkills,
      matchedSkillsDetails,
      weakSkills,
      weakSkillsDetails,
      missingSkills,
      totalRequiredSkills: requiredSkillCount,
    };
  });

/*
 * -------------------------------------------------------------
 * NORMALIZE SKILL NAMES
 * -------------------------------------------------------------
 */

function normalizeSkill(skill: string) {
  return skill
    .toLowerCase()
    .trim()
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ");
}

/*
 * -------------------------------------------------------------
 * CAREER ALIGNMENT
 * -------------------------------------------------------------
 */

function calculateCareerAlignment(
  targetRole: string,
  internshipRole: string,
) {
  const target = targetRole.toLowerCase().trim();
  const role = internshipRole.toLowerCase().trim();

  if (!target || !role) {
    return 50;
  }

  // Exact role family matches
  if (
    target.includes("ai") &&
    (role.includes("ai") ||
      role.includes("machine learning") ||
      role.includes("ml"))
  ) {
    return 100;
  }

  if (
    target.includes("data scientist") &&
    (role.includes("data science") ||
      role.includes("data scientist") ||
      role.includes("machine learning"))
  ) {
    return 100;
  }

  if (
    target.includes("frontend") &&
    (role.includes("frontend") ||
      role.includes("front end") ||
      role.includes("react") ||
      role.includes("web"))
  ) {
    return 100;
  }

  if (
    target.includes("cloud") &&
    (role.includes("cloud") ||
      role.includes("devops") ||
      role.includes("infrastructure"))
  ) {
    return 100;
  }

  // Related technical roles
  if (
    target.includes("engineer") &&
    (role.includes("engineer") ||
      role.includes("developer") ||
      role.includes("intern"))
  ) {
    return 70;
  }

  // Some technical relevance
  return 40;
}