import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/server/db.server";
import { getAuthenticatedStudentProfile } from "@/server/auth-context";
import { extractSkillsFromResume } from "@/server/gemini";
import {
  extractSkillsLocally,
  extractCleanText,
  normalizeSkillName,
  getSkillCategory,
  type ExtractedSkill,
} from "@/lib/local-skill-extractor";

export function sanitizeText(text: string | null | undefined): string {
  if (!text) return "";
  return text.replace(/\0/g, "");
}

/**
 * Normalizes line endings, strips invalid control characters,
 * normalizes whitespace while preserving line structure.
 */
export function cleanResumeText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\0/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Validates whether the extracted text is human-readable and not raw binary garbage.
 */
export function validateExtractedText(text: string): { isValid: boolean; reason?: string } {
  if (!text || text.trim().length < 15) {
    return { isValid: false, reason: "Extracted resume text is empty or too short." };
  }

  // Check if text looks like binary garbage (e.g. lots of non-printable or replacement chars)
  const nonPrintableCount = (text.match(/[^\x20-\x7E\n\r\t\u00A0-\u024F]/g) || []).length;
  const ratio = nonPrintableCount / text.length;

  if (ratio > 0.15 || text.startsWith("PK\x03\x04") || text.includes("\uFFFD\uFFFD")) {
    return {
      isValid: false,
      reason: "Extracted text contains corrupted binary data instead of readable text.",
    };
  }

  return { isValid: true };
}

/**
 * Extracts clean, readable text from DOCX, PDF, or TXT file inputs.
 */
export async function extractResumeText(params: {
  fileName: string;
  fileBase64?: string | undefined;
  resumeText?: string | undefined;
}): Promise<{ text: string; method: string; fileType: string }> {
  const fileName = sanitizeText(params.fileName).trim() || "resume.txt";
  const ext = fileName.toLowerCase().split(".").pop() || "";
  let rawText = "";
  let method = "plain_text";
  let fileType = ext.toUpperCase() || "TXT";

  if (ext === "docx" || ext === "doc") {
    fileType = "DOCX";
    method = "mammoth";

    let buffer: Buffer;
    if (params.fileBase64) {
      buffer = Buffer.from(params.fileBase64, "base64");
    } else if (params.resumeText) {
      buffer = Buffer.from(params.resumeText, "binary");
    } else {
      throw new Error("No file content provided for DOCX extraction.");
    }

    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      rawText = result.value;
      console.log(`[SkillBridge] Mammoth extracted ${rawText.length} characters from ${fileName}.`);
    } catch (err: any) {
      console.error("[SkillBridge] Mammoth extraction error:", err.message);
      throw new Error(`Failed to parse DOCX file (${fileName}). Please ensure the file is a valid Word document.`);
    }
  } else if (ext === "pdf") {
    fileType = "PDF";
    method = "pdf_stream_extractor";

    if (params.fileBase64) {
      const buf = Buffer.from(params.fileBase64, "base64");
      rawText = extractCleanText(buf.toString("latin1"));
    } else {
      rawText = extractCleanText(params.resumeText || "");
    }
  } else {
    // .txt, markdown, or plain text
    fileType = "TXT";
    method = "utf8_decoder";

    if (params.fileBase64) {
      rawText = Buffer.from(params.fileBase64, "base64").toString("utf-8");
    } else {
      rawText = params.resumeText || "";
    }
  }

  const cleaned = cleanResumeText(rawText);
  const validation = validateExtractedText(cleaned);

  if (!validation.isValid) {
    throw new Error(`Resume extraction failed: ${validation.reason}`);
  }

  return { text: cleaned, method, fileType };
}

export interface AnalyzeResumeInput {
  fileName: string;
  fileBase64?: string;
  resumeText?: string;
}

export const analyzeResume = createServerFn({
  method: "POST",
})
  .validator((data: AnalyzeResumeInput) => data)
  .handler(async ({ data }) => {
    const student = await getAuthenticatedStudentProfile({
      skills: {
        include: { skill: true },
      },
    });

    if (!student) {
      throw new Error(
        "No student profile found. Please register or log in to a student account first.",
      );
    }

    const sanitizedFileName = sanitizeText(data.fileName).trim() || "resume.txt";

    /* -------------------------------------------------------
       1. Extract and Validate Clean Resume Text
    ------------------------------------------------------- */
    const { text: cleanText, method: extractionMethod, fileType } = await extractResumeText({
      fileName: sanitizedFileName,
      fileBase64: data.fileBase64,
      resumeText: data.resumeText,
    });

    const hasReadableSections =
      /skills|experience|projects|education|summary|languages|frameworks|technologies/i.test(cleanText);

    /* -------------------------------------------------------
       2. Run Gemini Extraction on Clean Text
    ------------------------------------------------------- */
    let geminiSkills: Array<{
      name: string;
      score: number;
      confidence?: number;
      evidence?: string;
    }> = [];

    try {
      const result = await extractSkillsFromResume(cleanText);
      if (result && Array.isArray(result.skills)) {
        geminiSkills = result.skills
          .map((s: { name?: string; score?: number; confidence?: number; evidence?: string }) => ({
            name: normalizeSkillName(sanitizeText(s.name)),
            score: typeof s.score === "number" ? Math.max(0, Math.min(100, Math.round(s.score))) : 80,
            confidence: typeof s.confidence === "number" ? Math.max(0, Math.min(100, Math.round(s.confidence))) : 90,
            evidence: s.evidence ? sanitizeText(s.evidence).trim() : undefined,
          }))
          .filter((s: { name: string }) => s.name.length > 0);
      }
    } catch (error) {
      console.warn(
        "[SkillBridge] Gemini extraction unavailable or rate-limited. Falling back to local skill extractor.",
        error instanceof Error ? error.message : error,
      );
    }

    /* -------------------------------------------------------
       3. Run Deterministic Local Extractor
    ------------------------------------------------------- */
    const localSkills = extractSkillsLocally(cleanText);

    /* -------------------------------------------------------
       4. Merge & Deduplicate Gemini + Local Extraction
    ------------------------------------------------------- */
    const skillMap = new Map<
      string,
      {
        name: string;
        score: number;
        confidence: number;
        evidence: string;
        category: string;
      }
    >();

    // Add Gemini skills first
    for (const gSkill of geminiSkills) {
      const canonicalName = normalizeSkillName(gSkill.name);
      if (!canonicalName) continue;
      const key = canonicalName.toLowerCase();

      skillMap.set(key, {
        name: canonicalName,
        score: gSkill.score,
        confidence: gSkill.confidence ?? 90,
        evidence:
          gSkill.evidence ||
          `Demonstrated technical proficiency in ${canonicalName} evidenced in resume project and technical experience.`,
        category: getSkillCategory(canonicalName),
      });
    }

    // Merge in Local skills (fills any skills Gemini missed or when Gemini was offline)
    for (const lSkill of localSkills) {
      const canonicalName = normalizeSkillName(lSkill.name);
      const key = canonicalName.toLowerCase();

      if (!skillMap.has(key)) {
        skillMap.set(key, {
          name: canonicalName,
          score: lSkill.score,
          confidence: lSkill.confidence,
          evidence: lSkill.evidence,
          category: lSkill.category,
        });
      } else {
        const existing = skillMap.get(key)!;
        if (!existing.evidence || existing.evidence.length < lSkill.evidence.length) {
          existing.evidence = lSkill.evidence;
        }
      }
    }

    const mergedSkills = Array.from(skillMap.values());

    /* -------------------------------------------------------
       5. Persist Every Extracted Skill to PostgreSQL
       - Preserves higher verified assessment/project/institution scores
       - Updates/creates StudentSkill records without loss
    ------------------------------------------------------- */
    const existingStudentSkills = await prisma.studentSkill.findMany({
      where: { studentId: student.id },
      include: { skill: true },
    });

    const existingMap = new Map(
      existingStudentSkills.map((ss) => [ss.skill.name.toLowerCase(), ss])
    );

    let persistedCount = 0;
    const now = new Date();

    for (const extractedSkill of mergedSkills) {
      const skillName = sanitizeText(extractedSkill.name).trim();
      if (!skillName) continue;

      // Upsert Skill canonical record
      const skill = await prisma.skill.upsert({
        where: {
          name: skillName,
        },
        update: {},
        create: {
          name: skillName,
          demand: extractedSkill.score >= 80 ? "High" : "Growing",
        },
      });

      const existing = existingMap.get(skillName.toLowerCase());

      // Check existing verification level
      const existingLevel = existing?.verificationLevel || (existing?.evidence?.includes("Verified via SkillBridge") ? "ASSESSMENT_VERIFIED" : "RESUME_DETECTED");
      const isStrongerVerified = existingLevel !== "RESUME_DETECTED" && existingLevel !== undefined;

      // Score priority: never downgrade an existing verified assessment or project score
      let finalScore = extractedSkill.score;
      let finalVerificationLevel: "RESUME_DETECTED" | "ASSESSMENT_VERIFIED" | "PROJECT_VERIFIED" | "INSTITUTION_VERIFIED" | "EMPLOYER_VERIFIED" = "RESUME_DETECTED";
      let finalEvidenceSource = "Resume";
      let finalEvidence = sanitizeText(extractedSkill.evidence) || `Resume detected technical proficiency in ${skillName}.`;

      if (isStrongerVerified && existing) {
        finalVerificationLevel = existingLevel as any;
        finalEvidenceSource = existing.evidenceSource || (existingLevel === "ASSESSMENT_VERIFIED" ? "Assessment" : "Project");
        // Keep the higher score
        if (existing.score > finalScore) {
          finalScore = existing.score;
        }
        // Preserve existing verification evidence while enriching
        finalEvidence = existing.evidence || finalEvidence;
      }

      const confidenceVal = typeof extractedSkill.confidence === "number" ? extractedSkill.confidence : 88;

      await prisma.studentSkill.upsert({
        where: {
          studentId_skillId: {
            studentId: student.id,
            skillId: skill.id,
          },
        },
        update: {
          score: finalScore,
          confidence: confidenceVal,
          evidence: finalEvidence,
          evidenceSource: finalEvidenceSource,
          verificationLevel: finalVerificationLevel,
          lastDemonstratedAt: now,
        },
        create: {
          studentId: student.id,
          skillId: skill.id,
          score: finalScore,
          confidence: confidenceVal,
          evidence: finalEvidence,
          evidenceSource: finalEvidenceSource,
          verificationLevel: finalVerificationLevel,
          lastDemonstratedAt: now,
        },
      });

      persistedCount++;
    }

    /* -------------------------------------------------------
       6. Safe Diagnostics Logging
    ------------------------------------------------------- */
    console.log(
      `[SkillBridge] Resume extraction:\n` +
      `  type=${fileType}\n` +
      `  method=${extractionMethod}\n` +
      `  textLength=${cleanText.length}\n` +
      `  detectedReadableSections=${hasReadableSections}\n` +
      `  geminiSkills=${geminiSkills.length}\n` +
      `  localSkills=${localSkills.length}\n` +
      `  mergedSkills=${mergedSkills.length}\n` +
      `  persistedSkills=${persistedCount}`
    );

    // Save Resume entity with CLEAN human-readable text (NOT binary garbage)
    const resume = await prisma.resume.create({
      data: {
        studentId: student.id,
        fileName: sanitizedFileName,
        extractedText: cleanText,
      },
    });

    // Recalculate Student Overall Readiness
    const allSkills = await prisma.studentSkill.findMany({
      where: { studentId: student.id },
    });
    if (allSkills.length > 0) {
      const avgScore = Math.round(allSkills.reduce((acc, curr) => acc + curr.score, 0) / allSkills.length);
      const newReadiness = Math.min(98, Math.max(student.readiness || 50, avgScore));

      await prisma.studentProfile.update({
        where: { id: student.id },
        data: { readiness: newReadiness },
      });
    }

    return {
      resumeId: resume.id,
      skills: mergedSkills.map((s) => ({
        name: s.name,
        score: s.score,
        confidence: s.confidence,
        evidence: s.evidence,
        category: s.category,
        verificationLevel: "RESUME_DETECTED" as const,
        verificationLabel: "Resume Detected",
        evidenceSource: "Resume",
      })),
    };
  });