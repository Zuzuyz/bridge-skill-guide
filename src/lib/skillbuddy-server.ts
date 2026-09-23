import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

import { prisma } from "@/server/db.server";
import { getAuthenticatedStudentProfile } from "@/server/auth-context";
import { VERIFICATION_LEVEL_LABELS } from "@/types";
import type { VerificationLevel } from "@/types";

import { computeCareerSkillGap } from "@/lib/skill-gap-core.server";
import {
  loadStudentRoadmap,
  resolvePrimaryCareer,
} from "@/lib/roadmap-core.server";
import {
  getCareerMatchInternal,
  getInternshipMatchInternal,
} from "@/lib/matching-core.server";
import {
  SKILLBUDDY_SYSTEM_PROMPT,
  buildUserPrompt,
  classifyIntent,
  deterministicAnswer,
  serializeContext,
  type GroundedContext,
} from "@/lib/skillbuddy-answers";

/* =========================================================
   SKILLBUDDY — DATABASE-GROUNDED CAREER & SKILL
   INTELLIGENCE ASSISTANT

   Flow:
   1. Authenticate the student (never from the browser).
   2. Classify the question → load ONLY the relevant real
      data via the authoritative engines:
        Phase 7  computeCareerSkillGap   (readiness/gaps)
        Phase 8  loadStudentRoadmap      (roadmap)
        Phase 10 getCareerMatchInternal  (career match)
        Phase 10 getInternshipMatchInternal (internships)
   3. Build a structured GroundedContext (real DB data +
      honest "not available" notes).
   4. Send that context to Gemini to turn it into natural
      language — the model may only use the context.
   5. If Gemini fails or no API key: deterministic answer
      built from the SAME context.

   Exports ONLY server functions so the client build keeps
   this module stubbed (no src/server import reaches the
   browser bundle).
========================================================= */

const MAX_QUESTION_LENGTH = 1500;
const GENERIC_INTERNSHIP_STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "intern",
  "internship",
  "internships",
  "role",
  "roles",
  "job",
  "jobs",
  "apply",
  "application",
  "offer",
  "work",
  "this",
  "that",
  "are",
  "any",
  "can",
  "you",
  "your",
  "match",
  "matches",
  "best",
  "good",
  "how",
  "what",
  "which",
]);

function verificationLabelFor(
  level: VerificationLevel | null | undefined,
): string {
  if (!level) return "Not recorded";
  return VERIFICATION_LEVEL_LABELS[level] ?? level;
}

/* =========================================================
   INTERNSHIP IDENTIFICATION (real catalog only)
========================================================= */

async function identifyInternshipFromQuestion(
  question: string,
): Promise<{
  identified: {
    id: string;
    role: string;
    company: string;
  } | null;
  available: Array<{ role: string; company: string }>;
}> {
  const q = question.toLowerCase();

  const internships = await prisma.internship.findMany({
    select: {
      id: true,
      role: true,
      company: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const available = internships.map((i) => ({
    role: i.role,
    company: i.company.name,
  }));

  if (internships.length === 0) {
    return { identified: null, available: [] };
  }

  /* 1. Exact role or company mentioned in the question */
  let identified: (typeof internships)[number] | null =
    internships.find((i) => q.includes(i.role.toLowerCase())) ??
    internships.find((i) =>
      q.includes(i.company.name.toLowerCase()),
    ) ?? null;

  /* 2. Otherwise: meaningful role-token overlap */
  if (!identified) {
    const questionTokens = new Set(
      q
        .split(/[^a-z0-9]+/)
        .filter(
          (t) =>
            t.length >= 3 && !GENERIC_INTERNSHIP_STOPWORDS.has(t),
        ),
    );

    let best: (typeof internships)[number] | null = null;
    let bestScore = 0;

    for (const internship of internships) {
      const roleTokens = internship.role
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(
          (t) =>
            t.length >= 3 && !GENERIC_INTERNSHIP_STOPWORDS.has(t),
        );

      const score = roleTokens.filter((t) =>
        questionTokens.has(t),
      ).length;

      if (score > bestScore) {
        bestScore = score;
        best = internship;
      }
    }

    if (best && bestScore >= 1) {
      identified = best;
    }
  }

  return {
    identified: identified
      ? {
          id: identified.id,
          role: identified.role,
          company: identified.company.name,
        }
      : null,
    available,
  };
}

/* =========================================================
   GROUNDED CONTEXT BUILDER
   (loads only what the intent needs — no blanket engine
   runs across every career/internship)
========================================================= */

async function buildGroundedContext(
  student: {
    id: string;
    userId: string;
    targetRole: string | null;
    college: string | null;
    user: { name: string | null };
  },
  question: string,
  intent: ReturnType<typeof classifyIntent>,
): Promise<GroundedContext> {
  const notes: string[] = [];

  const ctx: GroundedContext = {
    intent,
    studentName: student.user.name || "Student",
    targetRole: student.targetRole,
    college: student.college,
    primaryCareerTitle: null,
    primaryCareerCategory: null,
    skillGap: null,
    roadmap: null,
    careerMatch: null,
    internshipMatch: null,
    availableInternships: [],
    profile: null,
    notes,
  };

  /* Primary career (Phase 8 resolver — used by several intents) */
  const wantsCareer =
    intent === "READINESS" ||
    intent === "ROADMAP" ||
    intent === "CAREER_MATCH" ||
    intent === "PROFILE";

  let primaryCareer: Awaited<
    ReturnType<typeof resolvePrimaryCareer>
  > = null;

  if (wantsCareer) {
    primaryCareer = await resolvePrimaryCareer(student.id);

    if (primaryCareer) {
      ctx.primaryCareerTitle = primaryCareer.career.title;
      ctx.primaryCareerCategory = primaryCareer.career.category;
    } else {
      notes.push(
        "No primary career is selected. Choose one under Career direction (/student/careers) — career readiness, career match, and roadmap are computed from your primary career.",
      );
    }
  }

  /* Phase 7 — readiness / skill gaps */
  if (intent === "READINESS") {
    if (primaryCareer) {
      ctx.skillGap = await computeCareerSkillGap(
        student.id,
        primaryCareer.careerId,
      );

      if (ctx.skillGap.totalSkills === 0) {
        notes.push(
          `No required skills are configured for ${ctx.skillGap.careerTitle}, so no readiness breakdown is available.`,
        );
      }
    }

    const skillCount = await prisma.studentSkill.count({
      where: { studentId: student.id },
    });
    if (skillCount === 0) {
      notes.push(
        "No skill records exist yet — upload a resume or complete an assessment to start building your skill profile.",
      );
    }
  }

  /* Phase 8 — roadmap (reuses the exact getStudentRoadmap loader) */
  if (intent === "ROADMAP") {
    ctx.roadmap = await loadStudentRoadmap(student.id);

    if (!ctx.roadmap) {
      if (!primaryCareer) {
        /* note already pushed above */
      } else {
        notes.push(
          "No roadmap items are saved yet — open the Career roadmap page and use “Regenerate roadmap” to build it from your current skill profile.",
        );
      }
    }
  }

  /* Phase 10 — internship match (only for a specific internship) */
  if (intent === "INTERNSHIP") {
    const { identified, available } =
      await identifyInternshipFromQuestion(question);

    if (identified) {
      const match = await getInternshipMatchInternal(
        student.id,
        identified.id,
      );

      ctx.internshipMatch = {
        ...match,
        role: identified.role,
        company: identified.company,
      };
    } else {
      ctx.availableInternships = available.slice(0, 8);

      if (available.length === 0) {
        notes.push(
          "No internships are published in SkillBridge right now, so no match can be computed.",
        );
      } else {
        notes.push(
          "No specific internship could be identified from the question, so no match score was computed.",
        );
      }
    }
  }

  /* Phase 10 — career match (identified career, else primary) */
  if (intent === "CAREER_MATCH") {
    const q = question.toLowerCase();

    const careers = await prisma.career.findMany({
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    });

    const mentioned = careers.find((c) =>
      q.includes(c.title.toLowerCase()),
    );

    const careerId =
      mentioned?.id ?? primaryCareer?.careerId ?? null;

    if (careerId) {
      ctx.careerMatch = await getCareerMatchInternal(
        student.id,
        careerId,
      );
    } else {
      notes.push(
        "No career could be identified for matching — mention a career by name or select a primary career first.",
      );
    }
  }

  /* Real profile records (display only — no re-scoring) */
  if (intent === "PROFILE") {
    const [skills, attempts, applications, projects, credentialCount] =
      await Promise.all([
        prisma.studentSkill.findMany({
          where: { studentId: student.id },
          include: { skill: true },
          orderBy: { score: "desc" },
          take: 12,
        }),
        prisma.assessmentAttempt.findMany({
          where: { studentId: student.id },
          include: { assessment: true },
          orderBy: { completedAt: "desc" },
          take: 5,
        }),
        prisma.application.findMany({
          where: { studentId: student.userId },
          include: {
            internship: { include: { company: true } },
          },
          orderBy: { appliedAt: "desc" },
          take: 6,
        }),
        prisma.projectSubmission.findMany({
          where: { studentId: student.id },
          orderBy: { submittedAt: "desc" },
          take: 6,
        }),
        prisma.credential.count({
          where: { studentId: student.id },
        }),
      ]);

    ctx.profile = {
      skills: skills.map((s) => ({
        name: s.skill.name,
        score: s.score,
        verificationLevel: verificationLabelFor(
          s.verificationLevel,
        ),
        evidenceSource: s.evidenceSource,
      })),
      assessments: attempts.map(
        (a) =>
          `${a.assessment.skillName}: ${a.percentage}% (${a.passed ? "Passed" : "Not passed yet"})`,
      ),
      applications: applications.map(
        (a) =>
          `${a.internship.role} at ${a.internship.company.name} (${a.status})`,
      ),
      projects: projects.map((p) => ({
        title: p.title,
        status: p.status,
      })),
      credentialCount,
    };

    if (skills.length === 0) {
      notes.push(
        "No skill records exist yet — upload a resume or complete an assessment.",
      );
    }
  }

  return ctx;
}

/* =========================================================
   SERVER FUNCTION
========================================================= */

export const askSkillBuddyServer = createServerFn({
  method: "POST",
})
  .validator((data: { question: string }) => data)
  .handler(async ({ data: { question } }) => {
    const trimmedQuestion = (question ?? "")
      .trim()
      .slice(0, MAX_QUESTION_LENGTH);

    if (!trimmedQuestion) {
      return "Please type a question first — for example: “Why is my readiness score?”";
    }

    /* 1. Authenticate — identity never comes from the browser */
    const student = await getAuthenticatedStudentProfile({
      user: true,
    });

    if (!student) {
      throw new Error(
        "Student profile not found. Please log in first.",
      );
    }

    /* 2–3. Classify + build grounded context from real data */
    const intent = classifyIntent(trimmedQuestion);
    const ctx = await buildGroundedContext(
      student,
      trimmedQuestion,
      intent,
    );

    /* 4. Gemini: context → natural language (optional) */
    const apiKey = process.env["GEMINI_API_KEY"];
    if (apiKey) {
      try {
        const result = await generateText({
          model: google("gemini-2.5-flash"),
          system: `${SKILLBUDDY_SYSTEM_PROMPT}\n\n${serializeContext(ctx)}`,
          prompt: buildUserPrompt(trimmedQuestion),
          temperature: 0.3,
        });

        const text = result.text?.trim();
        if (text) return text;
      } catch (err) {
        console.warn(
          "[SkillBuddy] Gemini call failed, falling back to the deterministic grounded answer:",
          err,
        );
      }
    }

    /* 5. Deterministic fallback — same grounded context */
    return deterministicAnswer(ctx);
  });
