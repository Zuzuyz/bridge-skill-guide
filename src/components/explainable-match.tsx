import type { ExplainableSkillMatch } from "@/lib/matching-server";

/* =========================================================
   PHASE 10 — shared explainable match breakdown

   Renders the structured server response for both the
   career detail modal (dark/cosmic) and the internship
   detail sidebar (light). Sections only render when they
   have entries; missing values are shown honestly, never
   as fake zeros.
========================================================= */

type Theme = "dark" | "light";

const sectionTitle: Record<Theme, string> = {
  dark: "text-white",
  light: "text-foreground",
};

const cardBase =
  "rounded-2xl border p-3 text-[11px] space-y-1.5";

const statusStyles: Record<
  Theme,
  Record<
    "MATCHED" | "PARTIAL" | "MISSING",
    { card: string; title: string; chip: string }
  >
> = {
  dark: {
    MATCHED: {
      card: "border-emerald-500/30 bg-emerald-500/[0.07]",
      title: "text-emerald-300",
      chip: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
    },
    PARTIAL: {
      card: "border-amber-500/30 bg-amber-500/[0.07]",
      title: "text-amber-300",
      chip: "border-amber-500/40 bg-amber-500/15 text-amber-300",
    },
    MISSING: {
      card: "border-rose-500/30 bg-rose-500/[0.07]",
      title: "text-rose-300",
      chip: "border-rose-500/40 bg-rose-500/15 text-rose-300",
    },
  },
  light: {
    MATCHED: {
      card: "border-success/25 bg-success/10",
      title: "text-success",
      chip: "border-success/30 bg-success/15 text-success",
    },
    PARTIAL: {
      card: "border-yellow-500/25 bg-yellow-500/10",
      title: "text-yellow-800",
      chip: "border-yellow-500/30 bg-yellow-500/15 text-yellow-800",
    },
    MISSING: {
      card: "border-destructive/25 bg-destructive/10",
      title: "text-destructive",
      chip: "border-destructive/30 bg-destructive/15 text-destructive",
    },
  },
};

const metaChip: Record<Theme, string> = {
  dark: "rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/70",
  light: "rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground",
};

const reasonText: Record<Theme, string> = {
  dark: "leading-relaxed text-white/60",
  light: "leading-relaxed text-muted-foreground",
};

const hintDark =
  "font-semibold text-amber-300/90";
const hintLight =
  "font-semibold text-yellow-800";

function statusIcon(
  status: ExplainableSkillMatch["status"],
): string {
  if (status === "MATCHED") return "\u2713";
  if (status === "PARTIAL") return "\u25D0";
  return "\u2715";
}

function statusHeading(
  status: ExplainableSkillMatch["status"],
): string {
  if (status === "MATCHED") return "MATCHED";
  if (status === "PARTIAL") return "PARTIAL";
  return "MISSING";
}

function MatchSkillRow({
  skill,
  theme,
}: {
  skill: ExplainableSkillMatch;
  theme: Theme;
}) {
  const styles = statusStyles[theme][skill.status];

  return (
    <div className={`${cardBase} ${styles.card}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className={`text-xs font-bold ${styles.title}`}
        >
          {statusIcon(skill.status)} {skill.skillName}
        </span>

        <span className="flex items-center gap-1.5">
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${styles.chip}`}
          >
            {statusHeading(skill.status)}
          </span>

          {skill.studentScore !== null ? (
            <span className="font-mono text-[11px] font-bold text-foreground/80">
              {skill.studentScore}
              {skill.requiredScore !== null
                ? `/${skill.requiredScore}`
                : ""}
            </span>
          ) : (
            <span className="text-[10px] italic opacity-70">
              No verified skill evidence
            </span>
          )}
        </span>
      </div>

      {/* Factor chips: importance, demand, verification */}
      <div className="flex flex-wrap gap-1.5">
        {skill.importanceLabel && (
          <span className={metaChip[theme]}>
            {skill.importanceLabel}
            {skill.importance !== null
              ? ` \u00B7 L${skill.importance}`
              : ""}
          </span>
        )}

        {skill.demandLevelLabel ? (
          <span
            className={metaChip[theme]}
            title={[
              skill.demandConfidence
                ? `Confidence: ${skill.demandConfidence}`
                : null,
              skill.demandScore !== null
                ? `Demand index: ${skill.demandScore}`
                : null,
              skill.demandFreshnessLabel,
              skill.demandSourceType
                ? `Source: ${skill.demandSourceType}`
                : null,
            ]
              .filter(Boolean)
              .join(" \u00B7 ")}
          >
            {skill.demandLevelLabel}
            {skill.demandIsDemo ? " \u00B7 DEMO" : ""}
            {skill.demandFreshnessLabel
              ? ` \u00B7 ${skill.demandFreshnessLabel}`
              : ""}
          </span>
        ) : (
          <span className={metaChip[theme]}>
            Industry demand data unavailable
          </span>
        )}

        {skill.verificationLabel && (
          <span className={metaChip[theme]}>
            {skill.verificationLabel}
          </span>
        )}

        {skill.evidenceSource && (
          <span className={metaChip[theme]}>
            Evidence: {skill.evidenceSource}
          </span>
        )}
      </div>

      {/* Reason generated from the actual calculation */}
      <p className={reasonText[theme]}>{skill.reason}</p>

      {/* Contribution toward the score */}
      {skill.maxContribution > 0 && (
        <p
          className={`font-mono text-[10px] ${reasonText[theme]}`}
        >
          Contributes{" "}
          {(skill.contribution * 100).toFixed(1)} of{" "}
          {(skill.maxContribution * 100).toFixed(1)}{" "}
          weighted points
        </p>
      )}

      {/* Improvement opportunity (only when supported) */}
      {skill.improvementHint && (
        <p
          className={
            theme === "dark" ? hintDark : hintLight
          }
        >
          {skill.improvementHint}
        </p>
      )}

      {/* Evidence, when it really exists */}
      {skill.evidenceText && (
        <p
          className={`italic ${reasonText[theme]} line-clamp-2`}
        >
          &ldquo;{skill.evidenceText}&rdquo;
          {skill.lastVerifiedAt
            ? ` \u2014 verified ${new Date(skill.lastVerifiedAt).toLocaleDateString()}`
            : ""}
        </p>
      )}
    </div>
  );
}

function Section({
  title,
  icon,
  count,
  skills,
  theme,
}: {
  title: string;
  icon: string;
  count: number;
  skills: ExplainableSkillMatch[];
  theme: Theme;
}) {
  if (skills.length === 0) return null;

  return (
    <div className="space-y-2">
      <p
        className={`text-xs font-bold uppercase ${sectionTitle[theme]}`}
      >
        {icon} {title} ({count})
      </p>
      <div className="space-y-2">
        {skills.map((skill) => (
          <MatchSkillRow
            key={skill.skillId}
            skill={skill}
            theme={theme}
          />
        ))}
      </div>
    </div>
  );
}

export function ExplainableMatchBreakdown({
  skills,
  theme = "dark",
}: {
  skills: ExplainableSkillMatch[];
  theme?: Theme;
}) {
  if (skills.length === 0) {
    return (
      <p className={`text-xs ${reasonText[theme]}`}>
        No matching requirement data available.
      </p>
    );
  }

  const matched = skills.filter(
    (s) => s.status === "MATCHED",
  );
  const partial = skills.filter(
    (s) => s.status === "PARTIAL",
  );
  const missing = skills.filter(
    (s) => s.status === "MISSING",
  );

  return (
    <div className="space-y-4">
      <Section
        title="Strong matches"
        icon="✓"
        count={matched.length}
        skills={matched}
        theme={theme}
      />
      <Section
        title="Partial matches"
        icon="◐"
        count={partial.length}
        skills={partial}
        theme={theme}
      />
      <Section
        title="Missing skills"
        icon="✕"
        count={missing.length}
        skills={missing}
        theme={theme}
      />
    </div>
  );
}
