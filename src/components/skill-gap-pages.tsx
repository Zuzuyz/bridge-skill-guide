import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  BarChart2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Info,
  Loader2,
  Target,
  TrendingUp,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { getCareerSkillGap } from "@/lib/skill-gap-server";
import type { CareerSkillGapResult, SkillGapItem } from "@/lib/skill-gap-server";

/* =========================================================
   PRIMITIVE HELPERS
========================================================= */

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-white/10 bg-white/5 p-6 ${className}`}
    >
      {children}
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const color =
    pct >= 80
      ? "bg-emerald-400"
      : pct >= 50
        ? "bg-amber-400"
        : pct > 0
          ? "bg-rose-400"
          : "bg-slate-700";
  return (
    <div className="h-1.5 w-full rounded-full bg-white/10">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: SkillGapItem["status"] }) {
  const cfg = {
    Strong: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    "Needs Improvement": "bg-amber-500/20 text-amber-300 border-amber-500/30",
    Missing: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  } as const;
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cfg[status]}`}
    >
      {status}
    </span>
  );
}

function DemandBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    HIGH: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    GROWING: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    EMERGING: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    STABLE: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    LOW: "bg-slate-600/20 text-slate-400 border-slate-600/20",
  };
  const labels: Record<string, string> = {
    HIGH: "High",
    GROWING: "Growing",
    EMERGING: "Emerging",
    STABLE: "Stable",
    LOW: "Low",
  };
  return (
    <span
      className={`rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase ${colors[level] ?? colors["STABLE"]}`}
    >
      {labels[level] ?? level}
    </span>
  );
}

function ImportanceBadge({ label }: { label: string }) {
  const isCore = label === "Core Skill";
  const isVeryImportant = label === "Very Important";
  return (
    <span
      className={`rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase ${
        isCore
          ? "border-amber-500/40 bg-amber-500/20 text-amber-300"
          : isVeryImportant
            ? "border-amber-400/20 bg-amber-400/10 text-amber-400"
            : "border-white/10 bg-white/5 text-slate-400"
      }`}
    >
      {label}
    </span>
  );
}

function ReadinessRing({ score }: { score: number }) {
  const color =
    score >= 85
      ? "#34d399" // emerald
      : score >= 70
        ? "#fbbf24" // amber
        : score >= 50
          ? "#f97316" // orange
          : "#f87171"; // rose
  const r = 54;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  return (
    <svg viewBox="0 0 128 128" className="h-36 w-36">
      <circle cx="64" cy="64" r={r} fill="none" stroke="#ffffff15" strokeWidth="10" />
      <circle
        cx="64"
        cy="64"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 64 64)"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
      <text
        x="64"
        y="60"
        textAnchor="middle"
        fill={color}
        fontSize="24"
        fontWeight="bold"
        fontFamily="serif"
      >
        {score}
      </text>
      <text x="64" y="78" textAnchor="middle" fill="#94a3b8" fontSize="9">
        / 100
      </text>
    </svg>
  );
}

/* =========================================================
   EXPLAINABILITY MODAL
========================================================= */

function ExplainModal({
  item,
  onClose,
}: {
  item: SkillGapItem;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-[#0c0919] p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:text-white"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold text-white">{item.skillName}</h2>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <StatusBadge status={item.status} />
          <ImportanceBadge label={item.importanceLabel} />
          <DemandBadge level={item.demandLevel} />
        </div>

        <p className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-slate-300">
          {item.explanation}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Your Score
            </p>
            <p className="mt-1 text-2xl font-bold text-white">
              {item.studentScore}
              <span className="text-sm text-slate-400">/100</span>
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Verification
            </p>
            <p className="mt-1 text-sm font-semibold text-white">
              {item.verificationLabel ?? "Not on Profile"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Points Earned
            </p>
            <p className="mt-1 text-2xl font-bold text-amber-300">
              {(item.contribution * 100).toFixed(1)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Max Possible
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-300">
              {(item.maxContribution * 100).toFixed(1)}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-400">
          <p>
            <span className="font-semibold text-slate-300">Importance weight:</span>{" "}
            {item.importanceWeight.toFixed(3)} ({item.importanceLabel})
          </p>
          <p>
            <span className="font-semibold text-slate-300">Demand weight:</span>{" "}
            {item.demandWeight.toFixed(2)} ({item.demandLevelLabel})
          </p>
          <p>
            <span className="font-semibold text-slate-300">Verification multiplier:</span>{" "}
            {item.verificationMultiplier.toFixed(2)}
          </p>
          <p className="font-mono text-[11px] text-slate-500">
            contribution = ({item.studentScore}/100) × {item.verificationMultiplier.toFixed(2)} ×{" "}
            {item.importanceWeight.toFixed(3)} × {item.demandWeight.toFixed(2)} ={" "}
            {item.contribution.toFixed(4)}
          </p>
        </div>

        {item.evidenceSummary && (
          <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-3 text-xs text-slate-300">
            <span className="font-bold text-slate-400">Evidence:</span> "
            {item.evidenceSummary}
            {item.evidenceSummary.length >= 120 ? "…" : ""}"
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   FORMULA EXPLANATION PANEL
========================================================= */

function FormulaPanel({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-3xl border border-amber-500/20 bg-amber-950/10">
      <button
        className="flex w-full items-center justify-between p-5 text-left"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-amber-400" />
          <span className="font-bold text-white">
            How is career readiness calculated?
          </span>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>

      {open && (
        <div className="border-t border-amber-500/20 px-5 pb-6 pt-4 text-sm text-slate-300 space-y-4">
          <p>
            Each required career skill contributes to your readiness score based on
            three factors multiplied together:
          </p>

          <div className="rounded-2xl bg-black/30 p-4 font-mono text-xs text-amber-300 leading-relaxed">
            contribution = (your score / 100)<br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            × verification multiplier<br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            × importance weight<br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            × demand weight<br />
            <br />
            readiness = Σ contributions / Σ (importance × demand) × 100
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Verification Multipliers
              </p>
              <ul className="space-y-1 text-xs">
                <li className="flex justify-between"><span>Employer Verified</span><span className="font-mono text-emerald-300">1.00</span></li>
                <li className="flex justify-between"><span>Institution Verified</span><span className="font-mono text-emerald-300">0.95</span></li>
                <li className="flex justify-between"><span>Project Verified</span><span className="font-mono text-emerald-300">0.90</span></li>
                <li className="flex justify-between"><span>Assessment Verified</span><span className="font-mono text-amber-300">0.85</span></li>
                <li className="flex justify-between"><span>Resume Detected</span><span className="font-mono text-slate-300">0.70</span></li>
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Importance Weights
              </p>
              <ul className="space-y-1 text-xs">
                <li className="flex justify-between"><span>Core Skill</span><span className="font-mono text-amber-300">1.00</span></li>
                <li className="flex justify-between"><span>Very Important</span><span className="font-mono text-amber-300">0.875</span></li>
                <li className="flex justify-between"><span>Important</span><span className="font-mono text-slate-300">0.75</span></li>
                <li className="flex justify-between"><span>Useful</span><span className="font-mono text-slate-300">0.625</span></li>
                <li className="flex justify-between"><span>Nice to Have</span><span className="font-mono text-slate-300">0.50</span></li>
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Demand Weights
              </p>
              <ul className="space-y-1 text-xs">
                <li className="flex justify-between"><span>High</span><span className="font-mono text-rose-300">1.00</span></li>
                <li className="flex justify-between"><span>Growing</span><span className="font-mono text-orange-300">0.90</span></li>
                <li className="flex justify-between"><span>Emerging</span><span className="font-mono text-purple-300">0.75</span></li>
                <li className="flex justify-between"><span>Stable</span><span className="font-mono text-slate-300">0.60</span></li>
                <li className="flex justify-between"><span>Low</span><span className="font-mono text-slate-400">0.40</span></li>
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs space-y-1">
            <p className="font-bold text-slate-300">Readiness Labels</p>
            <p><span className="text-emerald-300 font-semibold">85–100</span> Highly Ready</p>
            <p><span className="text-amber-300 font-semibold">70–84</span> Ready with Minor Gaps</p>
            <p><span className="text-orange-300 font-semibold">50–69</span> Developing</p>
            <p><span className="text-rose-300 font-semibold">30–49</span> Significant Gaps</p>
            <p><span className="text-rose-400 font-semibold">0–29</span> Early Stage</p>
          </div>

          <p className="text-xs text-slate-400">
            This score is <strong className="text-slate-300">career-specific</strong> and changes
            when you switch your primary career. Scores are computed deterministically from your
            verified skill profile — no AI estimates are used.
          </p>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   SKILL TABLE ROW
========================================================= */

function SkillRow({
  item,
  onExplain,
}: {
  item: SkillGapItem;
  onExplain: (item: SkillGapItem) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10 transition">
      {/* Skill name + badges */}
      <div>
        <span className="font-semibold text-white">{item.skillName}</span>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <ImportanceBadge label={item.importanceLabel} />
          <DemandBadge level={item.demandLevel} />
        </div>
      </div>

      {/* Score */}
      <div className="text-right">
        <span className="font-mono text-base font-bold text-amber-300">
          {item.studentScore}
        </span>
        <span className="text-xs text-slate-500">/100</span>
      </div>

      {/* Status */}
      <div>
        <StatusBadge status={item.status} />
      </div>

      {/* Verification */}
      <div className="hidden text-xs text-slate-400 sm:block">
        {item.verificationLabel ?? (
          <span className="italic text-slate-600">None</span>
        )}
      </div>

      {/* Explain button */}
      <button
        onClick={() => onExplain(item)}
        className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition"
        title="See how this score is calculated"
      >
        <Info className="h-4 w-4" />
      </button>
    </div>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export function SkillGapAnalysisPage() {
  const [result, setResult] = useState<CareerSkillGapResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalItem, setModalItem] = useState<SkillGapItem | null>(null);
  const [formulaOpen, setFormulaOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const data = await getCareerSkillGap({ data: {} });
        if (mounted) setResult(data);
      } catch (err) {
        if (mounted)
          setError(
            err instanceof Error
              ? err.message
              : "Unable to compute skill gap.",
          );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="flex items-center gap-3 text-amber-300">
            <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
            <span className="text-sm font-medium">
              Computing career-specific readiness…
            </span>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !result) {
    return (
      <AppShell>
        <div className="rounded-3xl border border-rose-500/30 bg-rose-950/30 p-6 text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p className="font-semibold text-white">Skill Gap Analysis Error</p>
          </div>
          <p className="mt-1 text-sm text-rose-300/80">
            {error || "No result found."}
          </p>
          <Link
            to="/student/careers"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-rose-500/20 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/30 transition"
          >
            Select a career <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </AppShell>
    );
  }

  const displayedSkills = showAll ? result.skills : result.skills.slice(0, 10);

  return (
    <AppShell>
      {/* Modal */}
      {modalItem && (
        <ExplainModal item={modalItem} onClose={() => setModalItem(null)} />
      )}

      {/* Header */}
      <div className="mb-8 flex flex-col gap-1">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
          Phase 7A · Career Readiness
        </p>
        <h1 className="text-3xl font-serif font-bold tracking-tight text-white sm:text-4xl">
          Skill Gap & Readiness
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-300/80">
          Career-specific analysis for{" "}
          <span className="font-semibold text-amber-300">
            {result.careerTitle}
          </span>
          {" "}· Computed deterministically from your verified skill profile.
        </p>
      </div>

      {/* Demo data notice */}
      {result.isDemoData && (
        <div className="mb-6 flex items-center gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-950/20 px-4 py-3 text-xs text-amber-300">
          <Info className="h-4 w-4 shrink-0" />
          <span>
            <strong>ⓘ Demo Industry Demand Data</strong> — Industry demand
            weights used below are from the SkillBridge demo dataset, not live
            market data. Readiness scores reflect this.
          </span>
        </div>
      )}

      {/* ── Row 1: Readiness Ring + 3 Summary Cards ─────────────────── */}
      <div className="grid gap-5 md:grid-cols-4">
        {/* Readiness ring */}
        <Card className="md:col-span-1 flex flex-col items-center justify-center gap-2">
          <ReadinessRing score={result.readiness} />
          <p className="text-center text-sm font-bold text-white">
            {result.readinessLabel}
          </p>
          <p className="text-center text-xs text-slate-400">
            for {result.careerTitle}
          </p>
        </Card>

        {/* Strong */}
        <Card className="flex flex-col justify-between border-emerald-500/20 bg-emerald-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Strong Skills
            </span>
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="mt-3 text-4xl font-serif font-bold text-emerald-300">
            {result.strongCount}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Score ≥ 80 · contribution meets benchmark
          </p>
        </Card>

        {/* Needs Improvement */}
        <Card className="flex flex-col justify-between border-amber-500/20 bg-amber-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Need Improvement
            </span>
            <BarChart2 className="h-5 w-5 text-amber-400" />
          </div>
          <p className="mt-3 text-4xl font-serif font-bold text-amber-300">
            {result.needsImprovementCount}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Score 1–79 · on profile but below benchmark
          </p>
        </Card>

        {/* Missing */}
        <Card className="flex flex-col justify-between border-rose-500/20 bg-rose-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Missing Skills
            </span>
            <XCircle className="h-5 w-5 text-rose-400" />
          </div>
          <p className="mt-3 text-4xl font-serif font-bold text-rose-300">
            {result.missingCount}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Score = 0 · not on profile yet
          </p>
        </Card>
      </div>

      {/* ── Row 2: Priority Gaps + Strengths ─────────────────────────── */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Priority Gaps */}
        <Card className="border-rose-500/20">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-rose-400" />
            <h2 className="text-lg font-bold text-white">Priority Gaps</h2>
            <span className="ml-auto rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[11px] font-bold text-rose-300">
              {result.priorityGaps.length} skills
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Ranked by impact on your readiness score. Address these first.
          </p>

          {result.priorityGaps.length === 0 ? (
            <p className="mt-4 text-sm text-emerald-300 font-semibold">
              🎉 No critical gaps found. Excellent profile coverage!
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {result.priorityGaps.map((item) => (
                <div
                  key={item.skillId}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {item.skillName}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <ImportanceBadge label={item.importanceLabel} />
                      <DemandBadge level={item.demandLevel} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={item.status} />
                    <button
                      onClick={() => setModalItem(item)}
                      className="rounded-lg p-1 text-slate-400 hover:text-white"
                      title="Explain"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Strengths */}
        <Card className="border-emerald-500/20">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Your Strengths</h2>
            <span className="ml-auto rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
              {result.strengths.length} skills
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Skills at or above benchmark. Keep building on these.
          </p>

          {result.strengths.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400 italic">
              No strong skills for this career yet. Start by adding evidence for
              core required skills.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {result.strengths.map((item) => (
                <div
                  key={item.skillId}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {item.skillName}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[10px] text-emerald-300 font-mono">
                        Score: {item.studentScore}/100
                      </span>
                      {item.verificationLabel && (
                        <span className="text-[10px] text-slate-400">
                          · {item.verificationLabel}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status="Strong" />
                    <button
                      onClick={() => setModalItem(item)}
                      className="rounded-lg p-1 text-slate-400 hover:text-white"
                      title="Explain"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Row 3: Full Skill Table ───────────────────────────────────── */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              Full Competency Breakdown
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              All {result.totalSkills} required skills for {result.careerTitle} ·
              Click <Info className="inline h-3 w-3" /> for score explanation
            </p>
          </div>
          <Link
            to="/student/careers"
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition"
          >
            Switch Career <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Table header */}
        <div className="mb-2 grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          <span>Skill</span>
          <span className="text-right">Score</span>
          <span>Status</span>
          <span className="hidden sm:block">Verification</span>
          <span></span>
        </div>

        <div className="space-y-2">
          {displayedSkills.map((item) => (
            <SkillRow key={item.skillId} item={item} onExplain={setModalItem} />
          ))}
        </div>

        {result.skills.length > 10 && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-3 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
          >
            {showAll ? (
              <>
                <ChevronUp className="h-4 w-4" /> Show fewer skills
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" /> Show all {result.skills.length} skills
              </>
            )}
          </button>
        )}
      </div>

      {/* ── Row 4: Formula panel ─────────────────────────────────────── */}
      <div className="mt-8">
        <FormulaPanel
          open={formulaOpen}
          onToggle={() => setFormulaOpen((v) => !v)}
        />
      </div>

      {/* ── Row 5: Next steps CTA ────────────────────────────────────── */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          to="/student/industry-demand"
          className="flex items-center justify-between rounded-3xl border border-rose-500/20 bg-rose-950/10 p-5 hover:bg-rose-950/20 transition"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-rose-400">
              Industry Demand
            </p>
            <p className="mt-0.5 font-semibold text-white">
              Explore demand data for your skills
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-rose-400" />
        </Link>

        <Link
          to="/student/roadmap"
          className="flex items-center justify-between rounded-3xl border border-amber-500/20 bg-amber-950/10 p-5 hover:bg-amber-950/20 transition"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Career Roadmap
            </p>
            <p className="mt-0.5 font-semibold text-white">
              Build a learning plan to close your gaps
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-amber-400" />
        </Link>
      </div>
    </AppShell>
  );
}
