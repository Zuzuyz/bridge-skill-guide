import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/server/db";
import { getAuthenticatedStudentProfile } from "@/server/auth-context";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export const askSkillBuddyServer = createServerFn({
  method: "POST",
})
  .validator((data: { question: string }) => data)
  .handler(async ({ data: { question } }) => {
    const student = await getAuthenticatedStudentProfile({
      user: true,
      skills: {
        include: { skill: true },
        orderBy: { score: "desc" },
      },
      skillGaps: {
        include: { skill: true },
      },
      roadmapItems: {
        orderBy: { step: "asc" },
      },
      assessmentAttempts: {
        include: { assessment: true },
        orderBy: { completedAt: "desc" },
      },
    });

    if (!student) {
      throw new Error("Student profile not found. Please log in first.");
    }

    const applications = await prisma.application.findMany({
      where: { studentId: student.userId },
      include: { internship: { include: { company: true } } },
    });

    const studentName = student.user.name || "Student";
    const targetRole = student.targetRole || "AI Engineer";
    const readiness = student.readiness || 72;

    const strongSkills = student.skills
      .filter((s) => s.score >= 75)
      .map((s) => `${s.skill.name} (${s.score}%, ${s.verificationLevel || (s.evidence?.includes("Verified") ? "Assessment Verified" : "Resume Detected")})`);

    const gapSkills = student.skills
      .filter((s) => s.score < 70)
      .slice(0, 5)
      .map((s) => `${s.skill.name} (${s.score}%, ${s.verificationLevel || "Resume Detected"})`);

    const assessmentsTaken = student.assessmentAttempts.map(
      (a) => `${a.assessment.skillName}: ${a.score}% (${a.passed || a.score >= 70 ? "Passed" : "Needs Review"})`
    );

    const currentRoadmap = student.roadmapItems.find((r) => r.status === "CURRENT") || student.roadmapItems[0];
    const appliedList = applications.map((a) => `${a.internship.role} at ${a.internship.company.name}`);

    // Try Gemini via AI SDK if API key exists
    const apiKey = process.env["GEMINI_API_KEY"];
    if (apiKey) {
      try {
        const systemPrompt = `
You are SkillBuddy, an intelligent, transparent Career & Skill Intelligence Assistant in the SkillBridge platform.
Always personalize responses specifically for ${studentName} (${targetRole} aspirant).
Student context:
- Name: ${studentName}
- Target Role: ${targetRole}
- Placement Readiness Score: ${readiness}%
- Top Skills & Evidence Levels: ${strongSkills.join(", ") || "None recorded yet"}
- Key Skill Gaps: ${gapSkills.join(", ") || "None detected"}
- Assessments Completed: ${assessmentsTaken.join(", ") || "None completed yet"}
- Current Roadmap Focus: ${currentRoadmap ? `Step ${currentRoadmap.step}: ${currentRoadmap.skill}` : "None"}
- Active Applications: ${appliedList.join(", ") || "None yet"}

Rules:
1. Do NOT act like a generic chatbot. Ground every answer in the student's actual skills, verification levels, and target role.
2. Distinguish clearly between "Resume Detected" and verified evidence ("Assessment Verified", "Project Verified").
3. Keep answers structured, concise, professional, and actionable.
4. Give specific next steps (e.g. taking a specific assessment or building a project).
`;

        const result = await generateText({
          model: google("gemini-2.5-flash"),
          system: systemPrompt,
          prompt: question,
          temperature: 0.3,
        });

        const text = result.text?.trim();
        if (text) return text;
      } catch (err) {
        console.warn("[SkillBuddy] Gemini call failed, falling back to deterministic student intelligence engine:", err);
      }
    }

    // Dynamic Deterministic Intelligence Engine based on student's actual DB records
    const lower = question.toLowerCase();

    if (lower.includes("readiness") || lower.includes("score") || lower.includes("why")) {
      return (
        `Your placement readiness for **${targetRole}** is **${readiness}%**.\n\n` +
        `**Key Drivers:**\n` +
        `• **Strong Skills**: ${strongSkills.slice(0, 3).join(", ") || "Foundations in progress"}.\n` +
        `• **Verified Evidence**: ${assessmentsTaken.length > 0 ? assessmentsTaken.join(", ") : "Most skills are currently **Resume Detected**. Taking proctored assessments will boost your verified readiness."}\n` +
        `• **Primary Gaps**: ${gapSkills.slice(0, 3).join(", ") || "Focus on specialized frameworks"}.\n\n` +
        `**Recommended Action:** Complete proctored assessments on SkillBridge to convert Resume Detected skills to Assessment Verified credentials.`
      );
    }

    if (lower.includes("learn") || lower.includes("next") || lower.includes("improve") || lower.includes("gap")) {
      const topGap = gapSkills[0] || "Advanced Systems & MLOps";
      const topStrong = strongSkills[0] || "Python";
      return (
        `Based on your target role as **${targetRole}**:\n\n` +
        `1. **Strongest Foundation**: You have solid proficiency in **${topStrong}**.\n` +
        `2. **Priority Gap**: **${topGap}** is currently one of your biggest development areas.\n` +
        `3. **Current Roadmap Step**: ${currentRoadmap ? `Step ${currentRoadmap.step}: ${currentRoadmap.skill} (${currentRoadmap.difficulty || "Core"})` : "Foundational Assessment"}.\n\n` +
        `**Recommended Next Step**:\n` +
        `Head over to **Skill Development → Assess** to take the practical benchmark for your target skills.`
      );
    }

    if (lower.includes("intern") || lower.includes("job") || lower.includes("match") || lower.includes("apply")) {
      return (
        `For **${targetRole}**, your profile currently matches opportunities requiring **${strongSkills.slice(0, 2).join(" and ") || "your core skills"}**.\n\n` +
        `• **Active Applications**: ${appliedList.length > 0 ? appliedList.join(", ") : "No pending applications yet"}.\n` +
        `• **Strength**: Employers see strong resume evidence in ${strongSkills.slice(0, 2).join(", ")}.\n` +
        `• **To Increase Match Rate**: Completing practical assessments for ${gapSkills.slice(0, 2).join(", ") || "missing requirements"} will immediately qualify you for top-tier partner internships.`
      );
    }

    return (
      `Hi ${studentName}! As an aspiring **${targetRole}**, your current readiness is **${readiness}%**.\n\n` +
      `Your strongest assets are **${strongSkills.slice(0, 3).join(", ") || "your foundational coursework"}**.\n` +
      `To accelerate your placement journey, focus on validating your **${gapSkills[0] || "hands-on projects"}** through SkillBridge assessments and practical project deliverables.`
    );
  });
