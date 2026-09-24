/* ------------------------------------------------------------
   Evidence-text readability detector — THE single shared
   heuristic. Used by server payloads (student-server,
   resume-server) and UI rendering (student-pages) so every
   surface applies the same standard. Deterministic — no AI,
   no API, no DB access.

   Purpose: resume extraction (binary/PDF-derived text) can
   persist symbol/digit garbage that passes simple
   control-character filters. Such evidence is OMITTED from
   normal displays and replaced by the neutral fallback
   "Resume detected technical proficiency." where a panel
   intentionally renders. Persisted StudentSkill evidence is
   never modified by this module.
------------------------------------------------------------ */

/** Minimum average word length for fragmented-token rejection. */
const MIN_AVG_WORD_LENGTH = 2;

/** Minimum share of tokens that must contain at least one letter. */
const MIN_LETTER_TOKEN_RATIO = 0.6;

/** Maximum share of tokens that may be single characters. */
const MAX_SINGLE_CHAR_TOKEN_RATIO = 0.25;

/** Maximum share of tokens made only of digits/symbols. */
const MAX_NOISE_TOKEN_RATIO = 0.2;

/** Maximum share of characters that may be suspicious punctuation. */
const MAX_SUSPICIOUS_PUNCT_RATIO = 0.1;

/** Suspicious punctuation typical of OCR/binary noise. */
const SUSPICIOUS_PUNCT = /[\\/_|+=<>*~^°•—–{}[\]<>#]/g;

/**
 * Deterministic readability check for extracted resume evidence.
 * True → the text may be shown as evidence.
 * False → omit it (UI renders the neutral fallback instead).
 */
export function isEvidenceReadable(
  text: string | null | undefined,
): text is string {
  if (!text) return false;

  const trimmed = text.trim();
  if (trimmed.length < 8) return false;

  /* 1. Letter dominance: OCR garbage mixes heavy symbol/digit noise.
        Legitimate sentences are ~70-85% letters (incl. spaces). */
  const letters = (trimmed.match(/[A-Za-z]/g) ?? []).length;
  if (letters / trimmed.length < 0.55) return false;

  /* 2. Word-token analysis: catches fragmented tokens ("ybX X+ vq")
        that a letter ratio alone cannot. */
  const tokens = trimmed.split(/\s+/).filter((t) => t.length > 0);
  if (tokens.length === 0) return false;

  const avgWordLength =
    tokens.reduce((sum, t) => sum + t.length, 0) / tokens.length;
  if (avgWordLength < MIN_AVG_WORD_LENGTH) return false;

  const letterTokens = tokens.filter((t) => /[A-Za-z]/.test(t)).length;
  if (letterTokens / tokens.length < MIN_LETTER_TOKEN_RATIO) return false;

  const singleCharTokens = tokens.filter((t) => t.length === 1).length;
  if (singleCharTokens / tokens.length > MAX_SINGLE_CHAR_TOKEN_RATIO) {
    return false;
  }

  const noiseTokens = tokens.filter((t) => !/[A-Za-z0-9]/.test(t) || /^\d+$/.test(t)).length;
  if (noiseTokens / tokens.length > MAX_NOISE_TOKEN_RATIO) return false;

  /* 3. Suspicious punctuation density: backslashes, underscores,
        slashes, pipes etc. are near-absent in real prose. */
  const suspicious = (trimmed.match(SUSPICIOUS_PUNCT) ?? []).length;
  if (suspicious / trimmed.length > MAX_SUSPICIOUS_PUNCT_RATIO) return false;

  /* 4. Fragmented-token clusters: even a few runs of 1-2 char
        fragments between symbols betray OCR output. */
  const fragmentedRuns = trimmed.match(/(?:\S{1,2}[\s]*){4,}/g) ?? [];
  if (fragmentedRuns.some((run) => {
    const runTokens = run.trim().split(/\s+/);
    const shortTokens = runTokens.filter((t) => t.length <= 2).length;
    return shortTokens / runTokens.length >= 0.6;
  })) {
    return false;
  }

  return true;
}

/** Neutral fallback sentence for intentionally-shown resume-detection panels. */
export const EVIDENCE_FALLBACK = "Resume detected technical proficiency.";
