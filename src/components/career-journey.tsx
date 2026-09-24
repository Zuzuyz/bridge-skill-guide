import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Award,
  BriefcaseBusiness,
  Check,
  Compass,
  FolderGit2,
  Map,
  Sparkles,
  Target,
  Trophy,
  TrendingUp,
} from "lucide-react";
import type {
  CareerJourney,
  CareerJourneyStage,
} from "@/lib/student-server";

const STAGE_ICONS: Record<
  CareerJourneyStage["id"],
  React.ComponentType<{ className?: string }>
> = {
  assessment: Award,
  skills: Trophy,
  "skill-gaps": TrendingUp,
  career: Compass,
  roadmap: Map,
  projects: FolderGit2,
  internships: BriefcaseBusiness,
  outcomes: Target,
};

function stageAccent(state: CareerJourneyStage["state"]) {
  if (state === "COMPLETED") {
    return {
      ring: "border-emerald-400/40 bg-emerald-950/30",
      dot: "border-emerald-400/60 bg-emerald-500/20 text-emerald-300",
      label: "text-emerald-300",
      icon: "text-emerald-300",
      connector: "from-emerald-400/60 to-emerald-400/20",
    };
  }
  if (state === "CURRENT") {
    return {
      ring: "border-amber-400/50 bg-amber-950/25 shadow-lg shadow-amber-950/40",
      dot: "border-amber-400/70 bg-amber-500/20 text-amber-300",
      label: "text-amber-300",
      icon: "text-amber-300",
      connector: "from-amber-400/70 to-amber-400/20",
    };
  }
  return {
    ring: "border-white/10 bg-white/[0.03]",
    dot: "border-white/15 bg-white/5 text-slate-500",
    label: "text-slate-500",
    icon: "text-slate-500",
    connector: "from-white/10 to-white/5",
  };
}

export function CareerJourneyCard({
  journey,
}: {
  journey: CareerJourney;
}) {
  const currentStage = journey.stages.find((s) => s.state === "CURRENT");

  return (
    <Card className="border-amber-500/25 bg-gradient-to-br from-purple-950/25 via-[#0c0919]/90 to-indigo-950/25">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-500/10">
            <Sparkles className="h-5 w-5 text-amber-300" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Career Journey</h2>
            <p className="text-xs text-slate-400">
              Eight stages from first assessment to verified outcome — tracked
              from your real records.
            </p>
          </div>
        </div>

        {currentStage ? (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-300">
            Now: {currentStage.label}
          </span>
        ) : (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-300">
            <Check className="h-3 w-3" />
            All stages active
          </span>
        )}
      </div>

      {/* Connected timeline (vertical on mobile, 2-col grid on desktop) */}
      <ol className="mt-6 space-y-0">
        {journey.stages.map((stage, index) => {
          const accent = stageAccent(stage.state);
          const Icon = STAGE_ICONS[stage.id];
          const isLast = index === journey.stages.length - 1;
          const prevStage = index > 0 ? journey.stages[index - 1] : null;
          const connectorIntoCurrent =
            stage.state === "CURRENT" &&
            prevStage?.state === "COMPLETED";

          return (
            <li key={stage.id} className="relative">
              {!isLast ? (
                <span
                  aria-hidden
                  className={`absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px bg-gradient-to-b ${
                    connectorIntoCurrent
                      ? "from-amber-400/70 to-amber-400/20"
                      : stage.state === "COMPLETED" && prevStage?.state === "COMPLETED"
                        ? "from-emerald-400/50 to-emerald-400/20"
                        : "from-white/10 to-white/5"
                  }`}
                />
              ) : null}

              <div
                className={`relative flex items-start gap-4 rounded-2xl border p-3.5 transition-all duration-300 ${accent.ring} ${
                  stage.state === "CURRENT" ? "sm:-mx-1" : ""
                }`}
              >
                <span
                  className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border ${accent.dot}`}
                >
                  <Icon className="h-4 w-4" />
                  {stage.state === "COMPLETED" ? (
                    <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-slate-950">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                  ) : null}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      {stage.label}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${accent.dot} ${accent.label}`}
                    >
                      {stage.state}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-400">
                    {stage.detail}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Next Best Action */}
      <div className="mt-6 rounded-2xl border border-amber-400/30 bg-gradient-to-r from-amber-950/30 to-transparent p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">
          Next Best Action
        </p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-white">{journey.nextAction.label}</p>
            <p className="mt-0.5 text-xs text-slate-300/80">
              {journey.nextAction.description}
            </p>
          </div>
          <Link
            to={journey.nextAction.href}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-amber-950/50 transition hover:from-amber-300 hover:to-amber-400"
          >
            {journey.nextAction.label}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </Card>
  );
}

/* Card primitive — kept local so this module stays self-contained and the
   dashboard does not need to export its private Card implementation. */
function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-white/10 bg-[#0c0919]/85 backdrop-blur-xl p-6 shadow-2xl shadow-black/50 text-slate-100 hover:border-amber-500/25 transition-all duration-300 ${className}`}
    >
      {children}
    </div>
  );
}
