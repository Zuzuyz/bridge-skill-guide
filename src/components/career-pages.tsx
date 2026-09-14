import { useState, useMemo } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Target,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Briefcase,
  Layers,
  ChevronRight,
  Star,
  Check,
  Plus,
  X,
  ArrowRight,
  Info,
  Loader2,
  BarChart3,
  Award,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  type CareerSummaryItem,
  type CareerDetailData,
  type CareerSkillItem,
  setStudentPrimaryCareer,
  addStudentSecondaryCareer,
  removeStudentCareer,
  getCareerBySlug,
} from "@/lib/career-server";
import { VerificationBadge } from "@/components/student-pages";

// ---------------------------------------------------------------------------
// Main Career Catalog Discovery Page
// ---------------------------------------------------------------------------

export function CareersCatalogPage({
  data,
}: {
  data: {
    careers: CareerSummaryItem[];
    categories: string[];
    stats: {
      totalCareers: number;
      selectedCareersCount: number;
      hasPrimarySelection: boolean;
    };
  };
}) {
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSlugForModal, setSelectedSlugForModal] = useState<string | null>(null);
  const [modalCareerData, setModalCareerData] = useState<CareerDetailData | null>(null);
  const [isLoadingModal, setIsLoadingModal] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const navigate = useNavigate();

  // Filter careers
  const filteredCareers = useMemo(() => {
    return data.careers.filter((c) => {
      const matchCat =
        activeCategory === "ALL" || c.category.toUpperCase() === activeCategory.toUpperCase();
      const matchSearch =
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.topSkills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [data.careers, activeCategory, searchQuery]);

  // Selected careers list for summary banner
  const primaryCareer = data.careers.find((c) => c.studentStatus?.isPrimary);
  const secondaryCareers = data.careers.filter((c) => c.studentStatus?.isSecondary);

  // Open detail modal
  const handleOpenDetail = async (slug: string) => {
    setSelectedSlugForModal(slug);
    setIsLoadingModal(true);
    try {
      const res = await getCareerBySlug({ data: slug });
      setModalCareerData(res);
    } catch {
      setModalCareerData(null);
    } finally {
      setIsLoadingModal(false);
    }
  };

  // Set Primary Career Action
  const handleSetPrimary = async (careerId: string) => {
    setActionLoadingId(careerId);
    setFeedbackMessage(null);
    try {
      const res = await setStudentPrimaryCareer({ data: { careerId } });
      setFeedbackMessage({ type: "success", text: res.message });
      // Refresh page data
      await navigate({ to: "/student/careers" });
    } catch (err: any) {
      setFeedbackMessage({ type: "error", text: err?.message || "Failed to set primary career." });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Add Secondary Career Action
  const handleAddSecondary = async (careerId: string) => {
    setActionLoadingId(careerId);
    setFeedbackMessage(null);
    try {
      const res = await addStudentSecondaryCareer({ data: { careerId } });
      setFeedbackMessage({ type: "success", text: res.message });
      await navigate({ to: "/student/careers" });
    } catch (err: any) {
      setFeedbackMessage({ type: "error", text: err?.message || "Failed to add secondary career." });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Remove Career Selection Action
  const handleRemoveCareer = async (careerId: string) => {
    setActionLoadingId(careerId);
    setFeedbackMessage(null);
    try {
      const res = await removeStudentCareer({ data: { careerId } });
      setFeedbackMessage({ type: "success", text: res.message });
      await navigate({ to: "/student/careers" });
    } catch (err: any) {
      setFeedbackMessage({ type: "error", text: err?.message || "Failed to remove career selection." });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <AppShell
      eyebrow="Career Profile Engine • Phase 5A"
      title="Career Direction & Requirements"
      actions={
        <div className="flex items-center gap-3">
          <Link to="/student/dashboard">
            <Button variant="outline" className="border-white/10 text-white/80 hover:text-white">
              Dashboard
            </Button>
          </Link>
          <Link to="/student/skills">
            <Button variant="outline" className="border-white/10 text-white/80 hover:text-white">
              <BarChart3 className="mr-2 h-4 w-4 text-sky-400" />
              Skills Inventory
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-sky-500/20 bg-gradient-to-r from-sky-950/40 via-slate-900/70 to-indigo-950/40 p-6 md:p-8 backdrop-blur-xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-300">
                <Target className="h-3.5 w-3.5" />
                Persistent Career Direction Foundation
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                Choose Your Target Career Direction
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Select <strong>1 Primary Career</strong> and up to <strong>2 Secondary Paths</strong>. SkillBridge will anchor your skill requirements, evidence alignment, industry demand, and learning roadmaps around your target direction.
              </p>
            </div>

            {/* Quick Summary Card */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs space-y-2 shrink-0 min-w-[220px]">
              <div className="text-white/50 font-semibold uppercase text-[10px] tracking-wider">Your Selections</div>
              <div className="flex justify-between items-center text-white">
                <span>Primary Target:</span>
                <strong className={primaryCareer ? "text-emerald-400" : "text-amber-400"}>
                  {primaryCareer ? primaryCareer.title : "Not Selected"}
                </strong>
              </div>
              <div className="flex justify-between items-center text-white">
                <span>Secondary Paths:</span>
                <strong className="text-sky-300">
                  {secondaryCareers.length} of 2
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div
            className={`rounded-2xl border p-4 text-xs flex items-center justify-between ${
              feedbackMessage.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-rose-500/30 bg-rose-500/10 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              )}
              <span>{feedbackMessage.text}</span>
            </div>
            <button onClick={() => setFeedbackMessage(null)} className="text-white/40 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Current Active Selections Summary */}
        {(primaryCareer || secondaryCareers.length > 0) && (
          <Card className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Active Career Direction</h3>
              </div>
              <span className="text-xs text-white/50">1 Primary • Up to 2 Secondary</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Primary Card */}
              {primaryCareer ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                      <Star className="h-3 w-3 fill-emerald-300 text-emerald-300" />
                      Primary Career
                    </span>
                    <button
                      onClick={() => handleRemoveCareer(primaryCareer.id)}
                      disabled={actionLoadingId === primaryCareer.id}
                      className="text-white/40 hover:text-rose-400 text-xs"
                      title="Remove primary selection"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">{primaryCareer.title}</h4>
                    <p className="text-xs text-white/60 mt-0.5">{primaryCareer.category}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-emerald-500/20">
                    <span className="text-white/70">Evidence Covered:</span>
                    <strong className="text-emerald-300 font-mono">
                      {primaryCareer.studentStatus?.evidenceCoveredSkillsCount} of {primaryCareer.totalSkillsCount} skills
                    </strong>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenDetail(primaryCareer.slug)}
                      className="text-xs text-emerald-300 hover:bg-emerald-500/20"
                    >
                      Requirements
                      <ChevronRight className="ml-1 h-3 w-3" />
                    </Button>
                    <Link to="/student/assessments">
                      <Button
                        size="sm"
                        className="w-full text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm"
                      >
                        <Award className="mr-1 h-3.5 w-3.5" />
                        Take Assessment
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/20 p-4 text-center space-y-2 flex flex-col justify-center items-center text-xs text-white/50">
                  <Target className="h-6 w-6 text-amber-400" />
                  <div>No Primary Career Selected</div>
                  <p className="text-[11px] text-white/40">Select a career below to set your primary target.</p>
                </div>
              )}

              {/* Secondary Cards */}
              {secondaryCareers.map((sec) => (
                <div key={sec.id} className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4 space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-sky-500/40 bg-sky-500/20 px-2.5 py-0.5 text-[11px] font-bold text-sky-300">
                      Secondary Path
                    </span>
                    <button
                      onClick={() => handleRemoveCareer(sec.id)}
                      disabled={actionLoadingId === sec.id}
                      className="text-white/40 hover:text-rose-400 text-xs"
                      title="Remove secondary path"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">{sec.title}</h4>
                    <p className="text-xs text-white/60 mt-0.5">{sec.category}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-sky-500/20">
                    <span className="text-white/70">Evidence Covered:</span>
                    <strong className="text-sky-300 font-mono">
                      {sec.studentStatus?.evidenceCoveredSkillsCount} of {sec.totalSkillsCount} skills
                    </strong>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSetPrimary(sec.id)}
                      disabled={actionLoadingId === sec.id}
                      className="flex-1 text-[11px] text-emerald-300 hover:bg-emerald-500/20"
                    >
                      Make Primary
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenDetail(sec.slug)}
                      className="flex-1 text-[11px] text-sky-300 hover:bg-sky-500/20"
                    >
                      View Specs
                    </Button>
                  </div>
                </div>
              ))}

              {/* Slot for remaining secondary */}
              {secondaryCareers.length < 2 && (
                <div className="rounded-2xl border border-dashed border-white/10 p-4 text-center space-y-1.5 flex flex-col justify-center items-center text-xs text-white/40">
                  <Plus className="h-5 w-5 text-white/30" />
                  <div>Secondary Slot Available ({2 - secondaryCareers.length} remaining)</div>
                  <p className="text-[10px] text-white/30">Add another path to compare requirements.</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {["ALL", ...data.categories].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  activeCategory === cat
                    ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20"
                    : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {cat === "ALL" ? "All Categories" : cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/40" />
            <input
              type="text"
              placeholder="Search careers or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2 text-xs text-white placeholder:text-white/40 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Career Cards Grid */}
        {filteredCareers.length === 0 ? (
          <Card className="rounded-3xl border border-white/10 bg-slate-900/60 p-12 text-center backdrop-blur-xl">
            <Briefcase className="h-12 w-12 mx-auto text-white/20 mb-3" />
            <h4 className="text-base font-bold text-white">No Careers Found</h4>
            <p className="text-xs text-white/60 max-w-md mx-auto mt-1 mb-4">
              Try adjusting your search query or category filter.
            </p>
            <Button
              onClick={() => {
                setActiveCategory("ALL");
                setSearchQuery("");
              }}
              variant="outline"
              className="rounded-xl border-white/10 text-xs text-white"
            >
              Reset Filters
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCareers.map((item) => {
              const isPrimary = item.studentStatus?.isPrimary;
              const isSecondary = item.studentStatus?.isSecondary;
              const isSelected = item.studentStatus?.isSelected;
              const isActionBusy = actionLoadingId === item.id;

              return (
                <Card
                  key={item.id}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border p-6 backdrop-blur-xl transition-all duration-300 ${
                    isPrimary
                      ? "border-emerald-500/40 bg-gradient-to-b from-emerald-950/30 to-slate-900/80 shadow-lg shadow-emerald-500/5"
                      : isSecondary
                        ? "border-sky-500/40 bg-gradient-to-b from-sky-950/30 to-slate-900/80 shadow-lg shadow-sky-500/5"
                        : "border-white/10 bg-slate-900/60 hover:border-sky-500/30 hover:shadow-xl"
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/70">
                        {item.category}
                      </span>

                      {isPrimary ? (
                        <span className="rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                          <Star className="h-3 w-3 fill-emerald-300 text-emerald-300" />
                          Primary
                        </span>
                      ) : isSecondary ? (
                        <span className="rounded-full border border-sky-500/40 bg-sky-500/20 px-2.5 py-0.5 text-[11px] font-bold text-sky-300">
                          Secondary
                        </span>
                      ) : null}
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-sky-300 transition-colors">
                        {item.title}
                      </h3>
                      <p className="mt-1.5 text-xs text-white/60 line-clamp-3 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Top Required Skills */}
                    <div className="space-y-2 pt-1">
                      <div className="flex justify-between items-center text-[10px] uppercase font-bold text-white/40">
                        <span>Required Skill Set</span>
                        <span>{item.totalSkillsCount} Skills ({item.coreSkillsCount} Core)</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {item.topSkills.map((sk) => (
                          <span
                            key={sk}
                            className="rounded-lg border border-white/5 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/80"
                          >
                            {sk}
                          </span>
                        ))}
                        {item.totalSkillsCount > 4 && (
                          <span className="rounded-lg border border-white/5 bg-white/[0.04] px-2 py-1 text-[11px] text-white/40">
                            +{item.totalSkillsCount - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-6 pt-4 border-t border-white/5 space-y-2">
                    <Button
                      variant="outline"
                      onClick={() => handleOpenDetail(item.slug)}
                      className="w-full rounded-xl border-white/10 text-xs text-white/80 hover:text-white"
                    >
                      <Info className="mr-2 h-3.5 w-3.5 text-sky-400" />
                      View Requirements Breakdown
                    </Button>

                    <div className="flex gap-2">
                      {isPrimary ? (
                        <Button
                          variant="ghost"
                          onClick={() => handleRemoveCareer(item.id)}
                          disabled={isActionBusy}
                          className="w-full text-xs text-rose-400 hover:bg-rose-500/10"
                        >
                          Remove Primary Direction
                        </Button>
                      ) : isSecondary ? (
                        <>
                          <Button
                            onClick={() => handleSetPrimary(item.id)}
                            disabled={isActionBusy}
                            className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-semibold shadow-md shadow-emerald-500/20"
                          >
                            Make Primary
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => handleRemoveCareer(item.id)}
                            disabled={isActionBusy}
                            className="px-3 text-xs text-rose-400 hover:bg-rose-500/10"
                          >
                            Remove
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            onClick={() => handleSetPrimary(item.id)}
                            disabled={isActionBusy}
                            className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 hover:brightness-110"
                          >
                            Set Primary
                          </Button>
                          {secondaryCareers.length < 2 && (
                            <Button
                              variant="outline"
                              onClick={() => handleAddSecondary(item.id)}
                              disabled={isActionBusy}
                              className="flex-1 rounded-xl border-white/10 text-xs text-white/80 hover:text-white"
                            >
                              Add Secondary
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Career Detail Modal */}
        {selectedSlugForModal && (
          <CareerDetailModal
            slug={selectedSlugForModal}
            data={modalCareerData}
            isLoading={isLoadingModal}
            onClose={() => {
              setSelectedSlugForModal(null);
              setModalCareerData(null);
            }}
            onSetPrimary={handleSetPrimary}
            onAddSecondary={handleAddSecondary}
            onRemove={handleRemoveCareer}
          />
        )}
      </div>
    </AppShell>
  );
}

// ---------------------------------------------------------------------------
// Career Requirement Detail Modal
// ---------------------------------------------------------------------------

function CareerDetailModal({
  slug,
  data,
  isLoading,
  onClose,
  onSetPrimary,
  onAddSecondary,
  onRemove,
}: {
  slug: string;
  data: CareerDetailData | null;
  isLoading: boolean;
  onClose: () => void;
  onSetPrimary: (careerId: string) => Promise<void>;
  onAddSecondary: (careerId: string) => Promise<void>;
  onRemove: (careerId: string) => Promise<void>;
}) {
  if (isLoading || !data) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
        <div className="max-w-2xl w-full rounded-3xl border border-white/10 bg-slate-900 p-8 text-center space-y-4 shadow-2xl">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-sky-400" />
          <div className="text-sm font-semibold text-white">Loading career requirements specification...</div>
        </div>
      </div>
    );
  }

  const isPrimary = data.studentSelection?.isPrimary;
  const isSecondary = data.studentSelection?.isSecondary;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md overflow-y-auto">
      <div className="max-w-3xl w-full my-8 rounded-3xl border border-white/10 bg-slate-900 p-6 md:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/5 pb-4">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-sky-300">
                {data.category}
              </span>
              {isPrimary && (
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300 flex items-center gap-1">
                  <Star className="h-3 w-3 fill-emerald-300" />
                  Primary Direction
                </span>
              )}
              {isSecondary && (
                <span className="rounded-full border border-sky-500/40 bg-sky-500/20 px-2.5 py-0.5 text-xs font-bold text-sky-300">
                  Secondary Path
                </span>
              )}
            </div>
            <h3 className="text-2xl font-bold text-white mt-1">{data.title}</h3>
            <p className="text-xs text-white/70 leading-relaxed">{data.description}</p>
          </div>

          <button onClick={onClose} className="rounded-xl p-2 text-white/40 hover:bg-white/5 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Evidence Coverage Meta */}
        {data.studentSelection && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span className="text-white/80">Your Skill Evidence Coverage:</span>
            </div>
            <div className="font-mono font-bold text-emerald-300 text-sm">
              {data.studentSelection.evidenceCoveredSkillsCount} of {data.studentSelection.totalRequiredSkillsCount} Required Skills Backed by Evidence
            </div>
          </div>
        )}

        {/* Demo Industry Demand Notice */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3.5 flex items-start gap-3 text-xs text-amber-300/90">
          <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-amber-300">ⓘ Demo Industry-Demand Data</span>
            <p className="text-[11px] text-amber-300/80">
              Skill demand metrics shown below use the SkillBridge prototype demo dataset. Production deployment connects live employer postings and verified market reports.
            </p>
          </div>
        </div>

        {/* Required Skills Grouped by Importance */}
        <div className="space-y-6">
          <h4 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="h-4 w-4 text-sky-400" />
            Required Skill Taxonomy Breakdown
          </h4>

          {/* Core Skills (5) */}
          {data.skillsByImportance.core.length > 0 && (
            <SkillRequirementGroup
              title="Core Skills (Essential Mastery)"
              importanceBadge="Core • Level 5"
              badgeColor="border-rose-500/40 bg-rose-500/10 text-rose-300"
              skills={data.skillsByImportance.core}
            />
          )}

          {/* Very Important Skills (4) */}
          {data.skillsByImportance.veryImportant.length > 0 && (
            <SkillRequirementGroup
              title="Very Important Skills"
              importanceBadge="High Priority • Level 4"
              badgeColor="border-purple-500/40 bg-purple-500/10 text-purple-300"
              skills={data.skillsByImportance.veryImportant}
            />
          )}

          {/* Important Skills (3) */}
          {data.skillsByImportance.important.length > 0 && (
            <SkillRequirementGroup
              title="Important Skills"
              importanceBadge="Standard • Level 3"
              badgeColor="border-sky-500/40 bg-sky-500/10 text-sky-300"
              skills={data.skillsByImportance.important}
            />
          )}

          {/* Useful Skills (2) */}
          {data.skillsByImportance.useful.length > 0 && (
            <SkillRequirementGroup
              title="Useful Skills"
              importanceBadge="Secondary • Level 2"
              badgeColor="border-white/20 bg-white/5 text-white/70"
              skills={data.skillsByImportance.useful}
            />
          )}

          {/* Nice to Have Skills (1) */}
          {data.skillsByImportance.niceToHave.length > 0 && (
            <SkillRequirementGroup
              title="Nice to Have Skills"
              importanceBadge="Optional • Level 1"
              badgeColor="border-white/10 bg-white/[0.03] text-white/50"
              skills={data.skillsByImportance.niceToHave}
            />
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/5">
          <Button variant="outline" onClick={onClose} className="rounded-xl border-white/10 text-xs text-white">
            Close Specs
          </Button>

          <div className="flex items-center gap-3">
            {isPrimary ? (
              <Button
                variant="ghost"
                onClick={async () => {
                  await onRemove(data.id);
                  onClose();
                }}
                className="text-xs text-rose-400 hover:bg-rose-500/10"
              >
                Remove Selection
              </Button>
            ) : (
              <>
                <Button
                  onClick={async () => {
                    await onSetPrimary(data.id);
                    onClose();
                  }}
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 font-semibold text-white text-xs shadow-lg shadow-emerald-500/20"
                >
                  Set as Primary Career Direction
                </Button>
                {!isSecondary && (
                  <Button
                    variant="outline"
                    onClick={async () => {
                      await onAddSecondary(data.id);
                      onClose();
                    }}
                    className="rounded-xl border-white/10 text-xs text-white"
                  >
                    Add as Secondary Path
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skill Requirement Group Component
// ---------------------------------------------------------------------------

function SkillRequirementGroup({
  title,
  importanceBadge,
  badgeColor,
  skills,
}: {
  title: string;
  importanceBadge: string;
  badgeColor: string;
  skills: CareerSkillItem[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs border-b border-white/5 pb-1.5">
        <span className="font-bold text-white">{title}</span>
        <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] ${badgeColor}`}>
          {importanceBadge}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {skills.map((sk) => {
          const ev = sk.studentEvidence;

          return (
            <div
              key={sk.skillId}
              className={`rounded-2xl border p-3.5 text-xs space-y-2 ${
                ev?.hasEvidence
                  ? "border-emerald-500/30 bg-emerald-500/[0.05]"
                  : "border-white/5 bg-white/[0.02]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{sk.skillName}</span>
                {ev?.hasEvidence ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    Evidence Available
                  </span>
                ) : (
                  <span className="text-[11px] text-white/40 font-mono">No evidence yet</span>
                )}
              </div>

              {/* Industry Demand Indicator */}
              {sk.industryDemand && (
                <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Demand:</span>
                    <span
                      className={`rounded-full px-2 py-0.5 font-semibold text-[10px] border ${
                        sk.industryDemand.demandLevel === "HIGH"
                          ? "border-rose-400/40 bg-rose-400/10 text-rose-300"
                          : sk.industryDemand.demandLevel === "GROWING"
                            ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
                            : "border-sky-400/30 bg-sky-400/10 text-sky-300"
                      }`}
                    >
                      {sk.industryDemand.demandLevelLabel}
                    </span>
                  </div>

                  {sk.industryDemand.demandScore !== null && (
                    <span className="text-[10px] font-mono text-slate-400" title="Demand Index Score (0-100)">
                      Index: <strong className="text-amber-300">{sk.industryDemand.demandScore}</strong>
                    </span>
                  )}
                </div>
              )}

              {ev?.hasEvidence && (
                <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-white/5">
                  {ev.verificationLevel && (
                    <VerificationBadge
                      level={ev.verificationLevel}
                      label={ev.verificationLabel}
                      size="sm"
                    />
                  )}
                  {ev.score !== undefined && (
                    <span className="font-mono text-white/80 font-bold">Score: {ev.score}%</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
