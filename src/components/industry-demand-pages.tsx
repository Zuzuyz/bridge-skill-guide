import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Compass,
  HelpCircle,
  Info,
  Layers,
  Search,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import {
  DEMAND_LEVEL_LABELS,
  DEMAND_SOURCE_LABELS,
  type DemandLevel,
  type IndustryDemandSkillItem,
} from "@/types";
import type { getAllIndustryDemand } from "@/lib/industry-demand-server";

function Card({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-3xl border border-white/10 bg-[#0c0919]/85 backdrop-blur-xl p-6 shadow-2xl shadow-black/50 text-slate-100 transition-all duration-300 ${className}`}
    >
      {children}
    </div>
  );
}

function DemandBadge({ level }: { level: DemandLevel | null }) {
  if (!level) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-400/30 bg-slate-400/10 px-2.5 py-0.5 text-xs font-semibold text-slate-300 backdrop-blur-sm">
        <TrendingUp className="h-3 w-3" />
        No Current Data
      </span>
    );
  }

  const label = DEMAND_LEVEL_LABELS[level] || "Stable Demand";

  const colorClass =
    level === "HIGH"
      ? "border-rose-400/40 bg-rose-400/15 text-rose-300"
      : level === "GROWING"
        ? "border-amber-400/40 bg-amber-400/15 text-amber-300"
        : level === "EMERGING"
          ? "border-purple-400/40 bg-purple-400/15 text-purple-300"
          : level === "STABLE"
            ? "border-sky-400/30 bg-sky-400/10 text-sky-300"
            : "border-slate-400/30 bg-slate-400/10 text-slate-300";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm ${colorClass}`}
    >
      <TrendingUp className="h-3 w-3" />
      {label}
    </span>
  );
}

export function IndustryDemandExplorerPage({
  data,
}: {
  data: Awaited<ReturnType<typeof getAllIndustryDemand>>;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedCareerId, setSelectedCareerId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeExplainSkill, setActiveExplainSkill] =
    useState<IndustryDemandSkillItem | null>(null);
  const [explainCareerTitle, setExplainCareerTitle] = useState<string>("");

  const filteredCareers = data.careers.filter((career) => {
    // Category filter
    if (selectedCategory !== "ALL" && career.category !== selectedCategory) {
      return false;
    }

    // Career filter
    if (selectedCareerId !== "ALL" && career.id !== selectedCareerId) {
      return false;
    }

    // Search query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      const matchesTitle = career.title.toLowerCase().includes(q);
      const matchesCategory = career.category.toLowerCase().includes(q);
      const matchesSkills = career.skills.some((s) =>
        s.skillName.toLowerCase().includes(q)
      );

      return matchesTitle || matchesCategory || matchesSkills;
    }

    return true;
  });

  const activeCareer =
    selectedCareerId !== "ALL"
      ? data.careers.find((c) => c.id === selectedCareerId) || null
      : null;

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">
                Phase 6A • Industry Demand Data Foundation
              </span>
            </div>
            <h1 className="mt-1 text-3xl font-serif font-bold text-white sm:text-4xl">
              Industry Demand Explorer
            </h1>
            <p className="mt-2 text-sm text-slate-300 font-light max-w-2xl">
              Explore required skills and industry-demand index ratings for standard tech careers.
              This data foundation feeds into SkillBridge skill-gap analysis.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/student/careers"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition"
            >
              <Compass className="h-4 w-4 text-amber-400" />
              Target Careers
            </Link>
          </div>
        </div>

        {/* Demo Dataset Notice Banner */}
        <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-[#0c0919] p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-2 text-amber-400 shrink-0 mt-0.5">
                <Info className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">
                    ⓘ Demo Industry-Demand Dataset
                  </span>
                  <span className="rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[10px] font-mono font-bold text-amber-300 border border-amber-400/30">
                    Source: DEMO
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                  {data.demoNotice.text}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Target Career Highlight Banner */}
        {data.studentPrimaryCareer && (
          <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-[#0c0919] to-sky-950/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-emerald-400 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Your Primary Target Role
                  </span>
                </div>
                <h3 className="text-2xl font-serif font-bold text-white">
                  {data.studentPrimaryCareer.title}
                </h3>
                <p className="text-xs text-slate-300">
                  {data.studentPrimaryCareer.category} • Configured in your career direction settings
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setSelectedCareerId(data.studentPrimaryCareer!.id)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                    selectedCareerId === data.studentPrimaryCareer.id
                      ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30"
                      : "border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                  }`}
                >
                  <Target className="h-4 w-4" />
                  Filter to Primary Career
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Search & Category Filter Controls */}
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Category Pills */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory("ALL")}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  selectedCategory === "ALL"
                    ? "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
                    : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                All Categories
              </button>
              {data.categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    selectedCategory === cat
                      ? "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
                      : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Dropdown & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Career Selector */}
              <select
                value={selectedCareerId}
                onChange={(e) => setSelectedCareerId(e.target.value)}
                className="w-full sm:w-56 rounded-xl border border-white/10 bg-[#120d24] px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
              >
                <option value="ALL">All Careers ({data.careers.length})</option>
                {data.careers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search careers or skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-400 focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Selected Single Career Demand View */}
        {activeCareer ? (
          <div className="space-y-6">
            <Card className="border-amber-500/30">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <span className="rounded-full bg-amber-400/10 border border-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-300">
                    {activeCareer.category}
                  </span>
                  <h2 className="mt-2 text-2xl font-serif font-bold text-white">
                    {activeCareer.title} — Industry Demand Profile
                  </h2>
                  <p className="mt-1 text-xs text-slate-300">{activeCareer.description}</p>
                </div>

                <button
                  onClick={() => setSelectedCareerId("ALL")}
                  className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:underline"
                >
                  <X className="h-4 w-4" />
                  View All Careers
                </button>
              </div>

              {/* Skill Demand Table */}
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-200">
                  <thead className="border-b border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Skill Name</th>
                      <th className="py-3 px-4">Career Importance</th>
                      <th className="py-3 px-4">Industry Demand Level</th>
                      <th className="py-3 px-4">Demand Index</th>
                      <th className="py-3 px-4">Data Source</th>
                      <th className="py-3 px-4">Freshness</th>
                      <th className="py-3 px-4 text-right">Explainability</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {activeCareer.skills.map((sk) => (
                      <tr key={sk.demandId} className="hover:bg-white/[0.02] transition">
                        <td className="py-3.5 px-4 font-bold text-white text-sm">
                          {sk.skillName}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                              sk.careerImportance === 5
                                ? "border-rose-400/40 bg-rose-400/10 text-rose-300"
                                : sk.careerImportance === 4
                                  ? "border-purple-400/40 bg-purple-400/10 text-purple-300"
                                  : "border-white/10 bg-white/5 text-slate-300"
                            }`}
                          >
                            {sk.importanceLabel}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <DemandBadge level={sk.demandLevel} />
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-300">
                          {sk.demandScore !== null ? sk.demandScore : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 text-[11px]">
                          <span className="rounded-lg bg-black/40 border border-white/10 px-2 py-1">
                            {sk.sourceTypeLabel}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[11px] text-slate-400">
                          {sk.freshness.label}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setActiveExplainSkill(sk);
                              setExplainCareerTitle(activeCareer.title);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 hover:text-amber-200 hover:underline"
                          >
                            <HelpCircle className="h-3.5 w-3.5" />
                            Why?
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        ) : (
          /* Multi-Career Overview Grid */
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCareers.map((career) => (
              <Card key={career.id} className="flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 text-[10px] font-semibold text-amber-300">
                      {career.category}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {career.totalSkillsCount} Skills
                    </span>
                  </div>

                  <h3 className="mt-2 text-xl font-serif font-bold text-white">
                    {career.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-300 line-clamp-2">
                    {career.description}
                  </p>

                  {/* Top High Demand Skills Chips */}
                  <div className="mt-4 space-y-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      Top High / Growing Demand Skills:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {career.topHighDemandSkills.map((sk) => (
                        <span
                          key={sk.name}
                          className={`rounded-lg px-2 py-0.5 text-[10px] font-medium border ${
                            sk.level === "HIGH"
                              ? "border-rose-400/40 bg-rose-400/10 text-rose-300"
                              : "border-amber-400/40 bg-amber-400/10 text-amber-300"
                          }`}
                        >
                          {sk.name} {sk.score !== null ? `(${sk.score})` : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400">
                    <strong className="text-rose-300 font-mono">{career.highDemandCount}</strong> High •{" "}
                    <strong className="text-amber-300 font-mono">{career.growingDemandCount}</strong> Growing
                  </div>

                  <button
                    onClick={() => setSelectedCareerId(career.id)}
                    className="inline-flex items-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition"
                  >
                    <span>View Demand Profile</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty Search Results */}
        {filteredCareers.length === 0 && (
          <Card className="p-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto text-slate-500 mb-3" />
            <h3 className="text-lg font-bold text-white">No Matching Careers Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              No demand records match your search query or category filter. Try clearing filters.
            </p>
            <button
              onClick={() => {
                setSelectedCategory("ALL");
                setSelectedCareerId("ALL");
                setSearchQuery("");
              }}
              className="mt-4 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition"
            >
              Reset All Filters
            </button>
          </Card>
        )}

        {/* Explainability Modal */}
        {activeExplainSkill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
            <div className="max-w-lg w-full rounded-3xl border border-amber-500/30 bg-[#0c0919] p-6 space-y-5 shadow-2xl relative">
              <div className="flex items-start justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-amber-400" />
                  <h3 className="text-lg font-serif font-bold text-white">
                    Demand Explainability
                  </h3>
                </div>

                <button
                  onClick={() => setActiveExplainSkill(null)}
                  className="rounded-xl p-1 text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Skill & Target Career</span>
                  <div className="text-base font-bold text-white">{activeExplainSkill.skillName}</div>
                  <div className="text-xs text-amber-300 font-semibold">{explainCareerTitle}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Demand Rating</span>
                    <div className="mt-1">
                      <DemandBadge level={activeExplainSkill.demandLevel} />
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Demand Index</span>
                    <div className="mt-1 text-xl font-serif font-bold text-amber-300 font-mono">
                      {activeExplainSkill.demandScore !== null ? activeExplainSkill.demandScore : "N/A"}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Data Source & Attribution</span>
                  <div className="text-xs font-semibold text-white">{activeExplainSkill.sourceTypeLabel}</div>
                  <p className="text-[11px] text-slate-400">{activeExplainSkill.sourceName}</p>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Data Freshness</span>
                  <div className="text-xs text-slate-200">{activeExplainSkill.freshness.label}</div>
                  <p className="text-[10px] text-amber-300/80 italic">
                    {activeExplainSkill.freshness.notes}
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-[11px] text-amber-300 leading-relaxed">
                  ⓘ <strong>Product Policy:</strong> This demand metric is derived from the SkillBridge demo industry dataset for testing and workflow evaluation. It is not a claim of live real-world job market statistics.
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setActiveExplainSkill(null)}
                  className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300 transition"
                >
                  Close Explanation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
