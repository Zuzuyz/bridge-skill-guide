import { generateText } from "ai";
import { google } from "@ai-sdk/google";

/* =========================================================
   GEMINI HELPERS
========================================================= */

function cleanJson(text: string) {
  return text
    .replace(/\0/g, "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

/**
 * Robust JSON parser that handles markdown fences, direct arrays, or object wrappers.
 */
function parseGeminiJsonResponse(rawText: string): any {
  const cleaned = cleanJson(rawText);

  // Try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // Attempt regex extraction of JSON array or object
    const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (innerErr) {
        throw new Error(`Failed to parse Gemini JSON output: ${cleaned.slice(0, 200)}...`);
      }
    }
    throw err;
  }
}

/* =========================================================
   GEMINI — RESUME SKILL EXTRACTION
========================================================= */

export async function extractSkillsFromResume(
  resumeText: string,
) {
  const result = await generateText({
    model: google("gemini-3.6-flash"),

    prompt: `
You are an expert AI recruitment & skill assessment engine for SkillBridge.

Thoroughly analyze the student resume provided below and extract ALL technical skills, programming languages, AI/ML concepts, frameworks, databases, developer tools, cloud technologies, and core computer science subjects present in ANY section of the resume (including Summary, Technical Skills, Projects, Experience, Education, and Certifications).

CRITICAL EXTRACTION REQUIREMENTS:
1. Extract EVERY skill found in the resume. Never truncate or return only the top/first few skills. If 20+ skills are present, return all 20+ skills.
2. For each detected skill, provide:
   - "name": Concise canonical name of the skill (e.g. "Python", "FastAPI", "React", "PostgreSQL", "Docker", "Machine Learning", "Scikit-Learn", "NumPy", "Pandas", "AWS", "Git", "GitHub", "Data Structures", "DBMS", "Operating Systems", "Computer Networks", "Big Data", etc.)
   - "score": Realistic integer proficiency score from 0 to 100 based on demonstrated usage (e.g., used in production/projects = 80-95, mentioned in skills = 70-85, coursework/theory = 65-80).
   - "confidence": Integer confidence score (0 to 100) based on how strongly the resume text supports it.
   - "evidence": The exact sentence, bullet point, or context from the resume demonstrating the skill.

Return ONLY valid JSON in this exact structure:
{
  "skills": [
    {
      "name": "Python",
      "score": 90,
      "confidence": 95,
      "evidence": "Experienced in building data-driven applications using Python, FastAPI, and SQL."
    },
    {
      "name": "Machine Learning",
      "score": 85,
      "confidence": 92,
      "evidence": "AI / ML: Machine Learning, Scikit-Learn, NumPy, Pandas, Model Evaluation."
    }
  ]
}

Resume Content:
${resumeText}
`,
  });

  const parsed = parseGeminiJsonResponse(result.text);

  // Normalize shape: if parsed is array or has .skills
  if (Array.isArray(parsed)) {
    return { skills: parsed };
  } else if (parsed && Array.isArray(parsed.skills)) {
    return parsed;
  } else if (parsed && typeof parsed === "object") {
    // If it wrapped in another key
    for (const key of Object.keys(parsed)) {
      if (Array.isArray(parsed[key])) {
        return { skills: parsed[key] };
      }
    }
  }

  return { skills: [] };
}

/* =========================================================
   GEMINI — SKILL GAP EXPLANATION
========================================================= */

export async function generateSkillGapExplanation({
  targetRole,
  readiness,
  gaps,
}: {
  targetRole: string;
  readiness: number;
  gaps: Array<{
    skill: string;
    score: number;
    status: string;
  }>;
}) {
  const result = await generateText({
    model: google("gemini-3.6-flash"),

    prompt: `
You are SkillBridge's AI career advisor.

Analyze the student's current skills against the requirements
of their target career.

Target role: ${targetRole}
Current readiness: ${readiness}%

Detected gaps:
${JSON.stringify(gaps, null, 2)}

Provide a concise, encouraging, and actionable summary covering:

1. Overview of their current industry readiness
2. Top priority skill gaps they must focus on
3. Immediate actionable next steps

Return JSON only in this format:

{
  "summary": "...",
  "priorityGaps": ["..."],
  "recommendations": ["..."]
}
`,
  });

  return parseGeminiJsonResponse(result.text);
}

/* =========================================================
   GEMINI — CAREER ROADMAP GENERATION
========================================================= */

export async function generateCareerRoadmap({
  targetRole,
  skills = [],
  gaps = [],
}: {
  targetRole: string;
  skills?: Array<{ name: string; score: number }>;
  gaps?: Array<{ skill: string; score: number; status?: string }>;
}) {
  const result = await generateText({
    model: google("gemini-3.6-flash"),

    prompt: `
You are SkillBridge's AI career path planner.

Create a step-by-step personalized learning and project roadmap
to take the student from their current skill level to job-ready
for their target role.

Target role: ${targetRole}

Current skills:
${JSON.stringify(skills, null, 2)}

Skill gaps to address:
${JSON.stringify(gaps, null, 2)}

Generate a sequence of 4 to 6 learning milestones. For each step:

- step (1, 2, 3...)
- skill (the main skill to learn/improve)
- difficulty ("Beginner" | "Intermediate" | "Advanced")
- duration (e.g. "2 weeks", "3 weeks")
- resource (recommended free/open learning resource)
- project (a hands-on project to prove the skill)

Return JSON only in this format:

{
  "roadmap": [
    {
      "step": 1,
      "skill": "PostgreSQL & Query Optimization",
      "difficulty": "Intermediate",
      "duration": "2 weeks",
      "resource": "PostgreSQL Official Tutorial & Schema Design Guide",
      "project": "Design and index a multi-table relational schema for a high-traffic app."
    }
  ]
}
`,
  });

  return parseGeminiJsonResponse(result.text);
}