import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Clock,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Zap,
  BarChart3,
  BookOpen,
  Filter,
  Check,
  X,
  ChevronRight,
  Code2,
  Database,
  Terminal,
  Play,
  FileCode,
  FolderGit2,
  ExternalLink,
  Layers,
  Send,
  Loader2,
  Info,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  type AssessmentSummaryItem,
  type AssessmentDetailData,
  type AssessmentResultResponse,
  type CodingResultResponse,
  type SqlResultResponse,
  submitAssessmentAttempt,
  submitCodingAttempt,
  submitSqlAttempt,
} from "@/lib/assessment-server";
import {
  submitProjectEvidence,
  getStudentProjectSubmissions,
  type ProjectSubmissionItem,
} from "@/lib/project-server";
import { VerificationBadge } from "@/components/student-pages";

// ---------------------------------------------------------------------------
// Assessment Catalog Page (with MCQ, Coding, SQL, and Project submission)
// ---------------------------------------------------------------------------

export function AssessmentsCatalogPage({
  data,
}: {
  data: {
    assessments: AssessmentSummaryItem[];
    stats: {
      totalAvailable: number;
      completed: number;
      passed: number;
      verifiedSkillsCount: number;
    };
  };
}) {
  const [activeTab, setActiveTab] = useState<"ALL" | "CODING" | "SQL" | "MCQ" | "PROJECTS">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectSubmissions, setProjectSubmissions] = useState<ProjectSubmissionItem[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  // Load project submissions when switching to PROJECTS tab
  useEffect(() => {
    if (activeTab === "PROJECTS") {
      setIsLoadingProjects(true);
      getStudentProjectSubmissions()
        .then((res) => setProjectSubmissions(res.submissions))
        .finally(() => setIsLoadingProjects(false));
    }
  }, [activeTab]);

  const filteredAssessments = useMemo(() => {
    return data.assessments.filter((a) => {
      const matchType =
        activeTab === "ALL" ||
        (activeTab === "CODING" && a.type === "CODING") ||
        (activeTab === "SQL" && a.type === "SQL") ||
        (activeTab === "MCQ" && (a.type === "MCQ" || !a.type));

      const matchSearch =
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.skillName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchType && matchSearch;
    });
  }, [data.assessments, activeTab, searchQuery]);

  return (
    <AppShell
      eyebrow="Practical Skill Verification • Phase 4B"
      title="Skill Verification Engine"
      actions={
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsProjectModalOpen(true)}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 font-semibold text-white shadow-lg shadow-purple-500/20 hover:brightness-110"
          >
            <FolderGit2 className="mr-2 h-4 w-4" />
            Submit Project Evidence
          </Button>
          <Link to="/student/skills">
            <Button variant="outline" className="border-white/10 text-white/80 hover:text-white">
              <BarChart3 className="mr-2 h-4 w-4 text-sky-400" />
              Skills Inventory
            </Button>
          </Link>
          <Link to="/student/passport">
            <Button variant="outline" className="border-white/10 text-white/80 hover:text-white">
              <ShieldCheck className="mr-2 h-4 w-4 text-emerald-400" />
              Skill Passport
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Verification Engine Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-slate-900/70 to-purple-950/40 p-6 md:p-8 backdrop-blur-xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                Multi-Modal Practical Verification (Phase 4B)
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                Demonstrate Hands-on Technical Mastery
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Validate skills through isolated Python coding sandboxes, in-memory SQL execution challenges, proctored MCQs, and reviewed practical project artifacts. Earning verification records tamper-proof proof and elevates your career readiness.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 text-center">
                <div className="text-2xl font-bold text-white">{data.stats.totalAvailable}</div>
                <div className="text-xs text-white/60">Total Challenges</div>
              </div>
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-center">
                <div className="text-2xl font-bold text-emerald-400">{data.stats.verifiedSkillsCount}</div>
                <div className="text-xs text-emerald-300/80">Verified Skills</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 text-center">
                <div className="text-2xl font-bold text-sky-400">{data.stats.completed}</div>
                <div className="text-xs text-white/60">Attempts Taken</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 text-center">
                <div className="text-2xl font-bold text-purple-400">{data.stats.passed}</div>
                <div className="text-xs text-white/60">Passed Tests</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab & Search Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "ALL", label: "All Challenges", icon: Layers },
              { id: "CODING", label: "Python Coding Sandbox", icon: Code2 },
              { id: "SQL", label: "SQL Query Sandbox", icon: Database },
              { id: "MCQ", label: "Proctored MCQs", icon: HelpCircle },
              { id: "PROJECTS", label: "Project Evidence", icon: FolderGit2 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-emerald-500 to-sky-500 text-white shadow-lg shadow-emerald-500/20"
                      : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab !== "PROJECTS" && (
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search challenges by skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white placeholder:text-white/40 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              />
            </div>
          )}
        </div>

        {/* Content: Projects Tab View */}
        {activeTab === "PROJECTS" ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Submitted Practical Projects</h3>
                <p className="text-xs text-white/60">
                  Project evidence requires review. Upon verification, skills reach <strong className="text-purple-300">Project Verified</strong> tier.
                </p>
              </div>
              <Button
                onClick={() => setIsProjectModalOpen(true)}
                className="rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
              >
                <FolderGit2 className="mr-2 h-3.5 w-3.5" />
                Submit New Project
              </Button>
            </div>

            {isLoadingProjects ? (
              <div className="p-12 text-center text-white/60">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-400" />
                Loading project submissions...
              </div>
            ) : projectSubmissions.length === 0 ? (
              <Card className="rounded-3xl border border-white/10 bg-slate-900/60 p-12 text-center backdrop-blur-xl">
                <FolderGit2 className="h-12 w-12 mx-auto text-white/20 mb-3" />
                <h4 className="text-base font-bold text-white">No Project Submissions Yet</h4>
                <p className="text-xs text-white/60 max-w-md mx-auto mt-1 mb-4">
                  Submit real repositories, web applications, or data pipelines to earn Tier 3 Project Verification.
                </p>
                <Button
                  onClick={() => setIsProjectModalOpen(true)}
                  className="rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 font-semibold text-white text-xs"
                >
                  Submit Project Evidence
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projectSubmissions.map((sub) => (
                  <Card
                    key={sub.id}
                    className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-purple-300">
                          {sub.skillName}
                        </span>
                        <h4 className="text-base font-bold text-white mt-2">{sub.title}</h4>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                          sub.status === "VERIFIED"
                            ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                            : sub.status === "UNDER_REVIEW"
                              ? "border border-amber-500/40 bg-amber-500/15 text-amber-300"
                              : sub.status === "REJECTED"
                                ? "border border-rose-500/40 bg-rose-500/15 text-rose-300"
                                : "border border-sky-500/40 bg-sky-500/15 text-sky-300"
                        }`}
                      >
                        {sub.status === "VERIFIED" ? "Verified" : sub.status === "UNDER_REVIEW" ? "Under Review" : sub.status === "REJECTED" ? "Rejected" : "Submitted"}
                      </span>
                    </div>

                    <p className="text-xs text-white/70 leading-relaxed">{sub.description}</p>

                    <div className="flex flex-wrap gap-3 pt-2 text-xs border-t border-white/5">
                      {sub.repoUrl && (
                        <a
                          href={sub.repoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-sky-400 hover:text-sky-300"
                        >
                          <FolderGit2 className="h-3.5 w-3.5" />
                          Repository
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {sub.projectUrl && (
                        <a
                          href={sub.projectUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Live Demo
                        </a>
                      )}
                      <span className="ml-auto text-white/40 text-[11px]">
                        Submitted {new Date(sub.submittedAt).toLocaleDateString()}
                      </span>
                    </div>

                    {sub.reviewerNotes && (
                      <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3 text-xs text-white/80 space-y-1">
                        <span className="font-semibold text-white/60 text-[10px] uppercase">Reviewer Feedback:</span>
                        <p>{sub.reviewerNotes}</p>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Content: Assessment Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssessments.map((item) => {
              const isPassed = item.studentStatus.hasPassed;
              const isCoding = item.type === "CODING";
              const isSql = item.type === "SQL";

              return (
                <Card
                  key={item.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl transition-all duration-300 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5"
                >
                  <div className="space-y-4">
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-[11px] font-semibold flex items-center gap-1.5 ${
                          isCoding
                            ? "border-purple-500/30 bg-purple-500/10 text-purple-300"
                            : isSql
                              ? "border-sky-500/30 bg-sky-500/10 text-sky-300"
                              : "border-white/10 bg-white/5 text-white/70"
                        }`}
                      >
                        {isCoding ? (
                          <>
                            <Code2 className="h-3 w-3" />
                            Python Sandbox
                          </>
                        ) : isSql ? (
                          <>
                            <Database className="h-3 w-3" />
                            SQL Sandbox
                          </>
                        ) : (
                          <>
                            <HelpCircle className="h-3 w-3" />
                            {item.category}
                          </>
                        )}
                      </span>
                      <VerificationBadge
                        level={item.studentStatus.verificationLevel}
                        label={item.studentStatus.verificationLabel}
                        size="sm"
                      />
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                        {item.title}
                      </h3>
                      <p className="mt-1.5 text-xs text-white/60 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Challenge Spec Meta */}
                    <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/5 bg-white/[0.03] p-3 text-center">
                      <div>
                        <div className="text-[10px] uppercase text-white/40 font-semibold">Format</div>
                        <div className="text-xs font-bold text-white mt-0.5">
                          {isCoding ? `${item.totalQuestions} Problems` : isSql ? `${item.totalQuestions} Queries` : `${item.totalQuestions} MCQs`}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-white/40 font-semibold">Duration</div>
                        <div className="text-xs font-bold text-white mt-0.5">{item.durationMinutes} mins</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-white/40 font-semibold">Pass Mark</div>
                        <div className="text-xs font-bold text-emerald-400 mt-0.5">{item.passingScore}%</div>
                      </div>
                    </div>

                    {/* Student Status Indicator */}
                    {item.studentStatus.attemptCount > 0 && (
                      <div
                        className={`rounded-xl border p-2.5 text-xs flex items-center justify-between ${
                          isPassed
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                            : "border-amber-500/20 bg-amber-500/10 text-amber-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isPassed ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                          ) : (
                            <RotateCcw className="h-4 w-4 text-amber-400 shrink-0" />
                          )}
                          <span>
                            {isPassed
                              ? `Passed with ${item.studentStatus.highestAttemptScore}%`
                              : `Last score: ${item.studentStatus.highestAttemptScore}% (Needs ${item.passingScore}%)`}
                          </span>
                        </div>
                        <span className="text-[10px] text-white/50">
                          {item.studentStatus.attemptCount} {item.studentStatus.attemptCount === 1 ? "attempt" : "attempts"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="mt-6 pt-4 border-t border-white/5">
                    <Link to="/student/assessments/$id" params={{ id: item.id }} className="block">
                      <Button
                        className={`w-full rounded-2xl font-semibold transition-all ${
                          isPassed
                            ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                            : isCoding
                              ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/20 hover:brightness-110"
                              : isSql
                                ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/20 hover:brightness-110"
                                : "bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 text-white shadow-lg shadow-emerald-500/20 hover:brightness-110"
                        }`}
                      >
                        {isPassed ? (
                          <>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Retake Challenge
                          </>
                        ) : isCoding ? (
                          <>
                            <Code2 className="mr-2 h-4 w-4" />
                            Open Coding Lab
                          </>
                        ) : isSql ? (
                          <>
                            <Database className="mr-2 h-4 w-4" />
                            Open SQL Sandbox
                          </>
                        ) : (
                          <>
                            <Award className="mr-2 h-4 w-4" />
                            Start Verification Test
                          </>
                        )}
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Project Evidence Submission Modal */}
        {isProjectModalOpen && (
          <ProjectSubmissionModal
            onClose={() => setIsProjectModalOpen(false)}
            onSubmitted={() => {
              setIsProjectModalOpen(false);
              setActiveTab("PROJECTS");
            }}
          />
        )}
      </div>
    </AppShell>
  );
}

// ---------------------------------------------------------------------------
// Project Submission Modal
// ---------------------------------------------------------------------------

function ProjectSubmissionModal({
  onClose,
  onSubmitted,
}: {
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [title, setTitle] = useState("");
  const [skillName, setSkillName] = useState("");
  const [description, setDescription] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [evidenceText, setEvidenceText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !skillName.trim() || !description.trim()) {
      setError("Please fill in project title, target skill, and description.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await submitProjectEvidence({
        data: {
          title,
          skillName,
          description,
          repoUrl,
          projectUrl,
          evidenceText,
        },
      });
      onSubmitted();
    } catch (err: any) {
      setError(err?.message || "Failed to submit project.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="max-w-xl w-full rounded-3xl border border-white/10 bg-slate-900 p-6 md:p-8 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-500/10 text-purple-300">
              <FolderGit2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Submit Project Evidence</h3>
              <p className="text-xs text-white/60">Tier 3 Practical Verification</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-white/60 hover:bg-white/5 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-white/70 font-semibold mb-1">Project Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Distributed Task Queue with Redis"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-white/70 font-semibold mb-1">Target Skill *</label>
            <input
              type="text"
              required
              placeholder="e.g. Python, Docker, PostgreSQL, React"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-white/70 font-semibold mb-1">Description & Architecture *</label>
            <textarea
              rows={3}
              required
              placeholder="Describe what you built, libraries used, architectural decisions, and key technical challenges solved."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-white/70 font-semibold mb-1">Repository URL (GitHub/GitLab)</label>
              <input
                type="url"
                placeholder="https://github.com/..."
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-white/70 font-semibold mb-1">Live Demo / Deployment URL</label>
              <input
                type="url"
                placeholder="https://..."
                value={projectUrl}
                onChange={(e) => setProjectUrl(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl border-white/10 text-white/80 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 font-semibold text-white hover:brightness-110 shadow-lg shadow-purple-500/20"
            >
              {isSubmitting ? "Submitting..." : "Submit for Verification"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Assessment Taking Page (Dispatches to MCQ, Coding, or SQL interface)
// ---------------------------------------------------------------------------

export function AssessmentTakingPage({ data }: { data: AssessmentDetailData }) {
  const isCoding = data.type === "CODING";
  const isSql = data.type === "SQL";

  if (isCoding) {
    return <CodingAssessmentTakingPage data={data} />;
  }

  if (isSql) {
    return <SqlAssessmentTakingPage data={data} />;
  }

  return <McqAssessmentTakingPage data={data} />;
}

// ---------------------------------------------------------------------------
// Coding Assessment Taking Interface (Phase 4B.1)
// ---------------------------------------------------------------------------

function CodingAssessmentTakingPage({ data }: { data: AssessmentDetailData }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [codeSolutions, setCodeSolutions] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const q of data.questions) {
      initial[q.id] = q.starterCode || `def solution():\n    pass`;
    }
    return initial;
  });
  const [timeRemaining, setTimeRemaining] = useState(data.durationMinutes * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<CodingResultResponse | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const currentQ = data.questions[currentQuestionIndex];
  const totalQuestions = data.questions.length;

  // Timer countdown
  useEffect(() => {
    if (result || isSubmitting) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [result, isSubmitting]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder.toString().padStart(2, "0")}`;
  };

  const handleCodeChange = (newCode: string) => {
    if (!currentQ || result || isSubmitting) return;
    setCodeSolutions((prev) => ({
      ...prev,
      [currentQ.id]: newCode,
    }));
  };

  const handleResetCode = () => {
    if (!currentQ) return;
    setCodeSolutions((prev) => ({
      ...prev,
      [currentQ.id]: currentQ.starterCode || "",
    }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setShowConfirmModal(false);

    try {
      const timeSpent = Math.max(1, data.durationMinutes * 60 - timeRemaining);
      const res = await submitCodingAttempt({
        data: {
          assessmentId: data.id,
          codeSolutions,
          timeSpentSeconds: timeSpent,
        },
      });
      setResult(res as CodingResultResponse);
    } catch (err: any) {
      alert(`Submission error: ${err?.message || "Failed to submit code solutions."}`);
      setIsSubmitting(false);
    }
  };

  if (result) {
    return <CodingResultView result={result} onRetake={() => {
      setResult(null);
      setCurrentQuestionIndex(0);
      setTimeRemaining(data.durationMinutes * 60);
      setIsSubmitting(false);
    }} />;
  }

  return (
    <AppShell
      eyebrow={`Coding Sandbox • ${data.skillName}`}
      title={data.title}
      actions={
        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-2 rounded-2xl border px-4 py-2 font-mono text-sm font-bold backdrop-blur-xl ${
              timeRemaining < 180
                ? "border-rose-500/40 bg-rose-500/15 text-rose-300 animate-pulse"
                : "border-white/10 bg-white/5 text-white"
            }`}
          >
            <Clock className="h-4 w-4 text-emerald-400" />
            {formatTime(timeRemaining)}
          </div>

          <Button
            onClick={() => setShowConfirmModal(true)}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 font-semibold text-white hover:brightness-110 shadow-lg shadow-purple-500/20"
          >
            {isSubmitting ? "Executing & Scoring..." : "Submit Solutions"}
          </Button>
        </div>
      }
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/60">Problems:</span>
            {data.questions.map((q, idx) => {
              const isCurrent = idx === currentQuestionIndex;
              const hasCode = (codeSolutions[q.id] || "").trim().length > 0;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                    isCurrent
                      ? "border-2 border-purple-400 bg-purple-500/30 text-white shadow-md shadow-purple-500/20"
                      : hasCode
                        ? "border border-white/10 bg-white/10 text-white"
                        : "border border-white/5 bg-white/[0.03] text-white/40 hover:bg-white/5"
                  }`}
                >
                  <Code2 className="h-3 w-3" />
                  Problem #{idx + 1}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-purple-300 font-semibold">
              Python 3.11 Runtime
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/60">
              {currentQ?.points || 20} Points
            </span>
          </div>
        </div>

        {/* Two-Column Problem + Code Workspace */}
        {currentQ && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Problem Description */}
            <Card className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 md:p-8 backdrop-blur-xl space-y-6 shadow-2xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-semibold text-white/80">
                      Problem {currentQuestionIndex + 1} of {totalQuestions}
                    </span>
                    {currentQ.topic && (
                      <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-sky-300 font-semibold">
                        {currentQ.topic}
                      </span>
                    )}
                  </div>
                  <span className="text-white/50 font-mono">{currentQ.difficulty}</span>
                </div>

                {/* Problem Statement */}
                <div className="text-sm md:text-base text-white leading-relaxed space-y-3 whitespace-pre-line">
                  {currentQ.question}
                </div>

                {/* Constraints */}
                {currentQ.constraints && (
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-xs space-y-1">
                    <span className="font-bold text-white/70 uppercase tracking-wider text-[10px]">Constraints:</span>
                    <pre className="font-mono text-white/80 text-[11px] whitespace-pre-wrap">{currentQ.constraints}</pre>
                  </div>
                )}

                {/* Visible Test Cases */}
                {currentQ.visibleTestCases && currentQ.visibleTestCases.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Example Test Cases:</span>
                    <div className="space-y-2">
                      {currentQ.visibleTestCases.map((tc, tcIdx) => (
                        <div key={tcIdx} className="rounded-2xl border border-white/5 bg-white/[0.02] p-3 text-xs font-mono space-y-1">
                          <div className="text-white/50 text-[10px]">Input: <span className="text-sky-300">{tc.input}</span></div>
                          <div className="text-white/50 text-[10px]">Expected Output: <span className="text-emerald-300">{tc.expectedOutput}</span></div>
                          {tc.explanation && <div className="text-white/40 text-[10px] font-sans">Note: {tc.explanation}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="rounded-xl border-white/10 text-white/80"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>

                {currentQuestionIndex < totalQuestions - 1 ? (
                  <Button
                    onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                    className="rounded-xl bg-white/10 hover:bg-white/20 text-white"
                  >
                    Next Problem
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowConfirmModal(true)}
                    className="rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 font-semibold text-white shadow-lg shadow-purple-500/20"
                  >
                    Submit Solutions
                    <Check className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>

            {/* Right Column: Code Editor */}
            <Card className="rounded-3xl border border-white/10 bg-slate-950 p-6 backdrop-blur-xl space-y-4 shadow-2xl flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-purple-400" />
                    <span className="text-xs font-mono font-bold text-white">solution.py</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetCode}
                    className="text-xs text-white/40 hover:text-rose-400"
                  >
                    <RotateCcw className="mr-1.5 h-3 w-3" />
                    Reset to Starter Code
                  </Button>
                </div>

                {/* Editor Textarea */}
                <div className="relative">
                  <textarea
                    rows={18}
                    value={codeSolutions[currentQ.id] || ""}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Tab") {
                        e.preventDefault();
                        const target = e.currentTarget;
                        const start = target.selectionStart;
                        const end = target.selectionEnd;
                        const value = target.value;
                        target.value = value.substring(0, start) + "    " + value.substring(end);
                        target.selectionStart = target.selectionEnd = start + 4;
                        handleCodeChange(target.value);
                      }
                    }}
                    placeholder="# Write your Python code here..."
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/90 p-4 font-mono text-xs md:text-sm text-emerald-300 placeholder:text-white/20 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 leading-relaxed resize-none"
                    spellCheck={false}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3 text-[11px] text-white/50 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-purple-400" />
                  Code is executed against visible & hidden test cases server-side.
                </span>
                <span className="text-purple-300 font-mono">Press Tab for indentation</span>
              </div>
            </Card>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
            <div className="max-w-md w-full rounded-3xl border border-white/10 bg-slate-900 p-6 space-y-6 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-500/10 text-purple-400">
                  <Code2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Submit Coding Solutions?</h3>
                  <p className="text-xs text-white/60">Your solutions will be executed against test cases in an isolated sandbox.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 space-y-2 text-xs">
                <div className="flex justify-between text-white/70">
                  <span>Problems:</span>
                  <strong className="text-white">{totalQuestions}</strong>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Passing Score:</span>
                  <strong className="text-emerald-400">{data.passingScore}%</strong>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmModal(false)}
                  className="border-white/10 text-white/80 hover:text-white"
                >
                  Continue Coding
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 font-semibold text-white hover:brightness-110 shadow-lg shadow-purple-500/20"
                >
                  {isSubmitting ? "Scoring..." : "Execute & Submit"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ---------------------------------------------------------------------------
// SQL Assessment Taking Interface (Phase 4B.2)
// ---------------------------------------------------------------------------

function SqlAssessmentTakingPage({ data }: { data: AssessmentDetailData }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [sqlSolutions, setSqlSolutions] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const q of data.questions) {
      initial[q.id] = "-- Write your SQL SELECT query here\nSELECT ";
    }
    return initial;
  });
  const [timeRemaining, setTimeRemaining] = useState(data.durationMinutes * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SqlResultResponse | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const currentQ = data.questions[currentQuestionIndex];
  const totalQuestions = data.questions.length;

  useEffect(() => {
    if (result || isSubmitting) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [result, isSubmitting]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder.toString().padStart(2, "0")}`;
  };

  const handleSqlChange = (newSql: string) => {
    if (!currentQ || result || isSubmitting) return;
    setSqlSolutions((prev) => ({
      ...prev,
      [currentQ.id]: newSql,
    }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setShowConfirmModal(false);

    try {
      const timeSpent = Math.max(1, data.durationMinutes * 60 - timeRemaining);
      const res = await submitSqlAttempt({
        data: {
          assessmentId: data.id,
          sqlSolutions,
          timeSpentSeconds: timeSpent,
        },
      });
      setResult(res as SqlResultResponse);
    } catch (err: any) {
      alert(`Submission error: ${err?.message || "Failed to submit SQL queries."}`);
      setIsSubmitting(false);
    }
  };

  if (result) {
    return <SqlResultView result={result} onRetake={() => {
      setResult(null);
      setCurrentQuestionIndex(0);
      setTimeRemaining(data.durationMinutes * 60);
      setIsSubmitting(false);
    }} />;
  }

  return (
    <AppShell
      eyebrow={`SQL Sandbox • ${data.skillName}`}
      title={data.title}
      actions={
        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-2 rounded-2xl border px-4 py-2 font-mono text-sm font-bold backdrop-blur-xl ${
              timeRemaining < 180
                ? "border-rose-500/40 bg-rose-500/15 text-rose-300 animate-pulse"
                : "border-white/10 bg-white/5 text-white"
            }`}
          >
            <Clock className="h-4 w-4 text-emerald-400" />
            {formatTime(timeRemaining)}
          </div>

          <Button
            onClick={() => setShowConfirmModal(true)}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-sky-500 to-blue-600 font-semibold text-white hover:brightness-110 shadow-lg shadow-sky-500/20"
          >
            {isSubmitting ? "Executing Queries..." : "Submit SQL Challenge"}
          </Button>
        </div>
      }
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/60">SQL Challenges:</span>
            {data.questions.map((q, idx) => {
              const isCurrent = idx === currentQuestionIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                    isCurrent
                      ? "border-2 border-sky-400 bg-sky-500/30 text-white shadow-md shadow-sky-500/20"
                      : "border border-white/5 bg-white/[0.03] text-white/60 hover:bg-white/5"
                  }`}
                >
                  <Database className="h-3 w-3" />
                  Query #{idx + 1}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-300 font-semibold">
              SQLite Sandbox Runtime
            </span>
          </div>
        </div>

        {/* Problem Statement & SQL Editor */}
        {currentQ && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Problem & Schema Viewer */}
            <Card className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 md:p-8 backdrop-blur-xl space-y-6 shadow-2xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3 text-xs">
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-semibold text-white/80">
                    Challenge {currentQuestionIndex + 1} of {totalQuestions}
                  </span>
                  <span className="text-white/50 font-mono">{currentQ.difficulty}</span>
                </div>

                <div className="text-sm md:text-base text-white leading-relaxed space-y-3 whitespace-pre-line">
                  {currentQ.question}
                </div>

                {/* Database Schema DDL */}
                {currentQ.dbSchema && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Database Tables:</span>
                    <div className="rounded-2xl border border-white/5 bg-slate-950 p-4 font-mono text-[11px] text-sky-300 leading-relaxed overflow-x-auto max-h-48">
                      <pre>{currentQ.dbSchema.trim()}</pre>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="rounded-xl border-white/10 text-white/80"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>

                {currentQuestionIndex < totalQuestions - 1 ? (
                  <Button
                    onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                    className="rounded-xl bg-white/10 hover:bg-white/20 text-white"
                  >
                    Next Query
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowConfirmModal(true)}
                    className="rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 font-semibold text-white shadow-lg shadow-sky-500/20"
                  >
                    Submit SQL
                    <Check className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>

            {/* SQL Query Editor */}
            <Card className="rounded-3xl border border-white/10 bg-slate-950 p-6 backdrop-blur-xl space-y-4 shadow-2xl flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-sky-400" />
                    <span className="text-xs font-mono font-bold text-white">query.sql</span>
                  </div>
                  <span className="text-[11px] text-white/40 font-mono">SELECT queries only</span>
                </div>

                <textarea
                  rows={16}
                  value={sqlSolutions[currentQ.id] || ""}
                  onChange={(e) => handleSqlChange(e.target.value)}
                  placeholder="SELECT ..."
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/90 p-4 font-mono text-xs md:text-sm text-sky-200 placeholder:text-white/20 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 leading-relaxed resize-none"
                  spellCheck={false}
                />
              </div>

              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3 text-[11px] text-white/50">
                <span className="flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-sky-400" />
                  Executed in an isolated in-memory SQLite sandbox against fixture datasets.
                </span>
              </div>
            </Card>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
            <div className="max-w-md w-full rounded-3xl border border-white/10 bg-slate-900 p-6 space-y-6 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-500/30 bg-sky-500/10 text-sky-400">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Submit SQL Queries?</h3>
                  <p className="text-xs text-white/60">Your queries will be executed against reference test datasets.</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmModal(false)}
                  className="border-white/10 text-white/80 hover:text-white"
                >
                  Continue
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-sky-500 to-blue-600 font-semibold text-white hover:brightness-110 shadow-lg shadow-sky-500/20"
                >
                  {isSubmitting ? "Scoring..." : "Execute & Submit"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ---------------------------------------------------------------------------
// MCQ Assessment Taking Interface
// ---------------------------------------------------------------------------

function McqAssessmentTakingPage({ data }: { data: AssessmentDetailData }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeRemaining, setTimeRemaining] = useState(data.durationMinutes * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [result, setResult] = useState<AssessmentResultResponse | null>(null);

  const currentQ = data.questions[currentQuestionIndex];
  const totalQuestions = data.questions.length;
  const answeredCount = Object.keys(answers).length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder.toString().padStart(2, "0")}`;
  };

  const handleSelectOption = (optionIndex: number) => {
    if (result || isSubmitting || !currentQ) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionIndex,
    }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setShowConfirmModal(false);

    try {
      const timeSpent = Math.max(1, data.durationMinutes * 60 - timeRemaining);
      const res = await submitAssessmentAttempt({
        data: {
          assessmentId: data.id,
          answers,
          timeSpentSeconds: timeSpent,
        },
      });
      setResult(res);
    } catch (err: any) {
      alert(`Submission error: ${err?.message || "Failed to submit assessment."}`);
      setIsSubmitting(false);
    }
  };

  if (result) {
    return <AssessmentResultView result={result} onRetake={() => {
      setResult(null);
      setAnswers({});
      setCurrentQuestionIndex(0);
      setTimeRemaining(data.durationMinutes * 60);
      setIsSubmitting(false);
    }} />;
  }

  return (
    <AppShell
      eyebrow={`Assessment • ${data.skillName}`}
      title={data.title}
      actions={
        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-2 rounded-2xl border px-4 py-2 font-mono text-sm font-bold backdrop-blur-xl ${
              timeRemaining < 180
                ? "border-rose-500/40 bg-rose-500/15 text-rose-300 animate-pulse"
                : "border-white/10 bg-white/5 text-white"
            }`}
          >
            <Clock className="h-4 w-4 text-emerald-400" />
            {formatTime(timeRemaining)}
          </div>

          <Button
            onClick={() => setShowConfirmModal(true)}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-emerald-500 to-sky-500 font-semibold text-white hover:brightness-110 shadow-lg shadow-emerald-500/20"
          >
            {isSubmitting ? "Scoring..." : "Submit Test"}
          </Button>
        </div>
      }
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Progress & Quick Jump */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/60">
              Question <strong className="text-white">{currentQuestionIndex + 1}</strong> of {totalQuestions}
            </span>
            <span className="text-emerald-400 font-semibold">
              {answeredCount}/{totalQuestions} Answered ({progressPercent}%)
            </span>
          </div>

          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {data.questions.map((q, idx) => {
              const isAnswered = answers[q.id] !== undefined;
              const isCurrent = idx === currentQuestionIndex;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`h-8 w-8 rounded-xl text-xs font-bold transition-all ${
                    isCurrent
                      ? "border-2 border-emerald-400 bg-emerald-500/30 text-white shadow-md shadow-emerald-500/20"
                      : isAnswered
                        ? "border border-sky-500/40 bg-sky-500/20 text-sky-300"
                        : "border border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Question Card */}
        {currentQ && (
          <Card className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 md:p-8 backdrop-blur-xl space-y-6 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
                  Question #{currentQuestionIndex + 1}
                </span>
                {currentQ.topic && (
                  <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
                    {currentQ.topic}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-300">
                  {currentQ.difficulty}
                </span>
                <span className="text-xs text-white/50 font-mono">{currentQ.points} Points</span>
              </div>
            </div>

            <div className="text-base md:text-lg font-medium text-white leading-relaxed">
              {currentQ.question}
            </div>

            <div className="space-y-3 pt-2">
              {currentQ.options.map((opt, optIdx) => {
                const isSelected = answers[currentQ.id] === optIdx;

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(optIdx)}
                    className={`group w-full flex items-start gap-4 rounded-2xl border p-4 text-left transition-all ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-500/15 text-white shadow-lg shadow-emerald-500/10"
                        : "border-white/10 bg-white/[0.03] text-white/80 hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-all ${
                        isSelected
                          ? "bg-emerald-500 text-slate-950"
                          : "border border-white/20 bg-white/5 text-white/60 group-hover:border-white/40 group-hover:text-white"
                      }`}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </div>
                    <span className="text-sm leading-relaxed">{opt}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-white/5">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="rounded-xl border-white/10 text-white/80"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              {currentQuestionIndex < totalQuestions - 1 ? (
                <Button
                  onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                  className="rounded-xl bg-white/10 hover:bg-white/20 text-white"
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={() => setShowConfirmModal(true)}
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 font-semibold text-white shadow-lg shadow-emerald-500/20"
                >
                  Review & Submit
                  <Check className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
            <div className="max-w-md w-full rounded-3xl border border-white/10 bg-slate-900 p-6 space-y-6 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Ready to Submit?</h3>
                  <p className="text-xs text-white/60">Assessment scoring is permanent and recorded server-side.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 space-y-2 text-xs">
                <div className="flex justify-between text-white/70">
                  <span>Answered:</span>
                  <strong className="text-white">{answeredCount} of {totalQuestions}</strong>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Passing Score:</span>
                  <strong className="text-emerald-400">{data.passingScore}%</strong>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmModal(false)}
                  className="border-white/10 text-white/80 hover:text-white"
                >
                  Continue Test
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-emerald-500 to-sky-500 font-semibold text-white hover:brightness-110 shadow-lg shadow-emerald-500/20"
                >
                  {isSubmitting ? "Scoring..." : "Yes, Submit Now"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ---------------------------------------------------------------------------
// Coding Result View (Phase 4B.1)
// ---------------------------------------------------------------------------

function CodingResultView({
  result,
  onRetake,
}: {
  result: CodingResultResponse;
  onRetake: () => void;
}) {
  return (
    <AppShell
      eyebrow="Verification Complete"
      title={`Coding Challenge Result • ${result.skillName}`}
      actions={
        <div className="flex items-center gap-3">
          <Link to="/student/assessments">
            <Button variant="outline" className="border-white/10 text-white/80 hover:text-white">
              All Challenges
            </Button>
          </Link>
          <Link to="/student/skills">
            <Button variant="outline" className="border-white/10 text-white/80 hover:text-white">
              Skills Inventory
            </Button>
          </Link>
        </div>
      }
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Result Banner */}
        <div
          className={`relative overflow-hidden rounded-3xl border p-6 md:p-8 backdrop-blur-xl ${
            result.passed
              ? "border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-slate-900/80 to-indigo-950/40"
              : "border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-slate-900/80 to-slate-950/40"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="flex items-center gap-2">
                <VerificationBadge
                  level={result.verificationLevel}
                  label={result.verificationLabel}
                  size="md"
                />
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
                  Attempt #{result.attemptNumber}
                </span>
              </div>

              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                {result.passed
                  ? "🎉 Coding Challenge Solved & Verified!"
                  : "Challenge Needs Another Attempt"}
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed">
                {result.passed
                  ? `Outstanding! Your Python solutions passed the unit test suite with a score of ${result.score}%, satisfying the ${result.passingScore}% threshold. Your ${result.skillName} skill is now ${result.verificationLabel}.`
                  : `You achieved a score of ${result.score}%, below the ${result.passingScore}% passing threshold. Review the failed test cases below and retake the challenge.`}
              </p>
            </div>

            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-6 text-center shrink-0 min-w-[180px]">
              <div className="text-xs uppercase tracking-wider text-white/50 font-semibold">Your Score</div>
              <div className={`text-4xl font-black mt-1 ${result.passed ? "text-purple-400" : "text-amber-400"}`}>
                {result.score}%
              </div>
              <div className="mt-1 text-[11px] text-white/40">Benchmark: {result.passingScore}%</div>
            </div>
          </div>
        </div>

        {/* Breakdown of Problems */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">Test Case Execution Breakdown</h3>

          <div className="space-y-4">
            {result.questionResults.map((qr, idx) => (
              <Card
                key={qr.questionId}
                className={`rounded-3xl border p-6 backdrop-blur-xl space-y-4 ${
                  qr.passed ? "border-emerald-500/20 bg-slate-900/60" : "border-rose-500/20 bg-slate-900/60"
                }`}
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-3 text-xs">
                  <div className="flex items-center gap-2">
                    {qr.passed ? (
                      <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-semibold text-emerald-300">
                        <Check className="h-3 w-3" />
                        Problem #{idx + 1} Passed ({qr.passedTests}/{qr.totalTests} tests)
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 font-semibold text-rose-300">
                        <X className="h-3 w-3" />
                        Problem #{idx + 1} Failed ({qr.passedTests}/{qr.totalTests} tests)
                      </span>
                    )}
                  </div>
                  <span className="text-white/40 font-mono text-[11px]">{qr.executionTimeMs}ms execution</span>
                </div>

                {qr.error && (
                  <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-mono text-rose-300 whitespace-pre-wrap">
                    {qr.error}
                  </div>
                )}

                {qr.testResults && qr.testResults.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-bold text-white/60 uppercase">Test Cases:</span>
                    <div className="space-y-1.5 font-mono text-xs">
                      {qr.testResults.map((tr) => (
                        <div
                          key={tr.testIndex}
                          className={`rounded-xl border p-2.5 flex items-center justify-between ${
                            tr.passed
                              ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
                              : "border-rose-500/20 bg-rose-500/5 text-rose-300"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {tr.passed ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <X className="h-3.5 w-3.5 text-rose-400" />}
                            <span>Test #{tr.testIndex + 1} {tr.isHidden ? "(Hidden Case)" : ""}</span>
                          </div>
                          <div className="text-[11px] text-white/50">
                            {tr.isHidden ? (tr.passed ? "Passed" : "Failed") : `Output: ${tr.actualOutput}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <Button variant="outline" onClick={onRetake} className="rounded-2xl border-white/10 text-white/80">
            <RotateCcw className="mr-2 h-4 w-4" />
            Retake Challenge
          </Button>
          <Link to="/student/skills">
            <Button className="rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 font-semibold text-white shadow-lg shadow-purple-500/20">
              View Skills Inventory
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

// ---------------------------------------------------------------------------
// SQL Result View (Phase 4B.2)
// ---------------------------------------------------------------------------

function SqlResultView({
  result,
  onRetake,
}: {
  result: SqlResultResponse;
  onRetake: () => void;
}) {
  return (
    <AppShell
      eyebrow="Verification Complete"
      title={`SQL Sandbox Result • ${result.skillName}`}
      actions={
        <div className="flex items-center gap-3">
          <Link to="/student/assessments">
            <Button variant="outline" className="border-white/10 text-white/80 hover:text-white">
              All Challenges
            </Button>
          </Link>
          <Link to="/student/skills">
            <Button variant="outline" className="border-white/10 text-white/80 hover:text-white">
              Skills Inventory
            </Button>
          </Link>
        </div>
      }
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Banner */}
        <div
          className={`relative overflow-hidden rounded-3xl border p-6 md:p-8 backdrop-blur-xl ${
            result.passed
              ? "border-sky-500/30 bg-gradient-to-r from-sky-950/40 via-slate-900/80 to-blue-950/40"
              : "border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-slate-900/80 to-slate-950/40"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="flex items-center gap-2">
                <VerificationBadge
                  level={result.verificationLevel}
                  label={result.verificationLabel}
                  size="md"
                />
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
                  Attempt #{result.attemptNumber}
                </span>
              </div>

              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                {result.passed
                  ? "🎉 SQL Queries Verified!"
                  : "Needs Another Query Run"}
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed">
                {result.passed
                  ? `Your SQL queries produced exact matching result sets against the sandbox database with a score of ${result.score}%. Your ${result.skillName} skill is now ${result.verificationLabel}.`
                  : `You achieved a score of ${result.score}%, below the ${result.passingScore}% passing threshold. Review the schema execution output below and retry.`}
              </p>
            </div>

            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-6 text-center shrink-0 min-w-[180px]">
              <div className="text-xs uppercase tracking-wider text-white/50 font-semibold">Your Score</div>
              <div className={`text-4xl font-black mt-1 ${result.passed ? "text-sky-400" : "text-amber-400"}`}>
                {result.score}%
              </div>
              <div className="mt-1 text-[11px] text-white/40">Benchmark: {result.passingScore}%</div>
            </div>
          </div>
        </div>

        {/* Query Results Breakdown */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">Query Execution Breakdown</h3>

          <div className="space-y-4">
            {result.questionResults.map((qr, idx) => (
              <Card
                key={qr.questionId}
                className={`rounded-3xl border p-6 backdrop-blur-xl space-y-4 ${
                  qr.passed ? "border-emerald-500/20 bg-slate-900/60" : "border-rose-500/20 bg-slate-900/60"
                }`}
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-3 text-xs">
                  <div className="flex items-center gap-2">
                    {qr.passed ? (
                      <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-semibold text-emerald-300">
                        <Check className="h-3 w-3" />
                        Query #{idx + 1} Matched ({qr.rowsReturned} rows)
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 font-semibold text-rose-300">
                        <X className="h-3 w-3" />
                        Query #{idx + 1} Failed
                      </span>
                    )}
                  </div>
                  <span className="text-white/40 font-mono text-[11px]">{qr.executionTimeMs}ms execution</span>
                </div>

                {qr.error && (
                  <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-mono text-rose-300">
                    {qr.error}
                  </div>
                )}

                {qr.studentResult && qr.studentResult.length > 0 && (
                  <div className="space-y-2 pt-1 font-mono text-xs">
                    <span className="text-[11px] font-bold text-white/60 uppercase">Your Query Output Preview:</span>
                    <div className="rounded-2xl border border-white/10 bg-slate-950 p-3 overflow-x-auto max-h-40">
                      <pre className="text-sky-300">{JSON.stringify(qr.studentResult.slice(0, 3), null, 2)}</pre>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <Button variant="outline" onClick={onRetake} className="rounded-2xl border-white/10 text-white/80">
            <RotateCcw className="mr-2 h-4 w-4" />
            Retake SQL Challenge
          </Button>
          <Link to="/student/skills">
            <Button className="rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 font-semibold text-white shadow-lg shadow-sky-500/20">
              View Skills Inventory
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

// ---------------------------------------------------------------------------
// Standard MCQ Result View
// ---------------------------------------------------------------------------

export function AssessmentResultView({
  result,
  onRetake,
}: {
  result: AssessmentResultResponse;
  onRetake: () => void;
}) {
  const [filterMode, setFilterMode] = useState<"ALL" | "CORRECT" | "INCORRECT">("ALL");

  const filteredBreakdown = useMemo(() => {
    if (filterMode === "CORRECT") return result.breakdown.filter((q) => q.isCorrect);
    if (filterMode === "INCORRECT") return result.breakdown.filter((q) => !q.isCorrect);
    return result.breakdown;
  }, [result.breakdown, filterMode]);

  return (
    <AppShell
      eyebrow="Verification Complete"
      title={`Assessment Result • ${result.skillName}`}
      actions={
        <div className="flex items-center gap-3">
          <Link to="/student/assessments">
            <Button variant="outline" className="border-white/10 text-white/80 hover:text-white">
              All Assessments
            </Button>
          </Link>
          <Link to="/student/skills">
            <Button variant="outline" className="border-white/10 text-white/80 hover:text-white">
              Skills Inventory
            </Button>
          </Link>
        </div>
      }
    >
      <div className="max-w-4xl mx-auto space-y-8">
        <div
          className={`relative overflow-hidden rounded-3xl border p-6 md:p-8 backdrop-blur-xl ${
            result.passed
              ? "border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900/80 to-teal-950/40"
              : "border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-slate-900/80 to-slate-950/40"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="flex items-center gap-2">
                <VerificationBadge
                  level={result.verificationLevel}
                  label={result.verificationLabel}
                  size="md"
                />
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
                  Attempt #{result.attemptNumber}
                </span>
              </div>

              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                {result.passed ? "🎉 Assessment Passed & Verified!" : "Needs Another Attempt"}
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed">
                {result.passed
                  ? `Congratulations! You scored ${result.score}% on ${result.assessmentTitle}, exceeding the ${result.passingScore}% benchmark. Your ${result.skillName} skill is now ${result.verificationLabel}.`
                  : `You achieved a score of ${result.score}%, below the ${result.passingScore}% threshold. Review the explanations below and retake when ready.`}
              </p>
            </div>

            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-6 text-center shrink-0 min-w-[180px]">
              <div className="text-xs uppercase tracking-wider text-white/50 font-semibold">Your Score</div>
              <div className={`text-4xl font-black mt-1 ${result.passed ? "text-emerald-400" : "text-amber-400"}`}>
                {result.score}%
              </div>
              <div className="mt-2 text-xs text-white/60">
                {result.correctCount} of {result.totalCount} correct
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">Question Review & Explanations</h3>
              <p className="text-xs text-white/60">Transparent explanations for every question.</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilterMode("ALL")}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${
                  filterMode === "ALL" ? "bg-white/20 text-white" : "bg-white/5 text-white/60 hover:text-white"
                }`}
              >
                All ({result.breakdown.length})
              </button>
              <button
                onClick={() => setFilterMode("CORRECT")}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${
                  filterMode === "CORRECT" ? "bg-emerald-500/30 text-emerald-300" : "bg-white/5 text-white/60 hover:text-white"
                }`}
              >
                Correct ({result.correctCount})
              </button>
              <button
                onClick={() => setFilterMode("INCORRECT")}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${
                  filterMode === "INCORRECT" ? "bg-rose-500/30 text-rose-300" : "bg-white/5 text-white/60 hover:text-white"
                }`}
              >
                Incorrect ({result.totalCount - result.correctCount})
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredBreakdown.map((q) => (
              <Card
                key={q.id}
                className={`rounded-3xl border p-6 backdrop-blur-xl space-y-4 ${
                  q.isCorrect ? "border-emerald-500/20 bg-slate-900/60" : "border-rose-500/20 bg-slate-900/60"
                }`}
              >
                <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-3 text-xs">
                  <div className="flex items-center gap-2">
                    {q.isCorrect ? (
                      <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-semibold text-emerald-300">
                        <Check className="h-3 w-3" />
                        Correct (+{q.pointsEarned} pts)
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 font-semibold text-rose-300">
                        <X className="h-3 w-3" />
                        Incorrect (0 pts)
                      </span>
                    )}
                    {q.topic && (
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-white/60">
                        {q.topic}
                      </span>
                    )}
                  </div>
                  <span className="text-white/40 font-mono text-[11px]">{q.difficulty}</span>
                </div>

                <div className="text-sm font-semibold text-white leading-relaxed">{q.question}</div>

                <div className="space-y-2 pt-1">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = q.selectedOption === optIdx;
                    const isCorrectAnswer = q.correctAnswer === optIdx;

                    let optStyle = "border-white/5 bg-white/[0.02] text-white/60";
                    if (isCorrectAnswer) {
                      optStyle = "border-emerald-500/40 bg-emerald-500/15 text-emerald-200 font-semibold";
                    } else if (isSelected && !isCorrectAnswer) {
                      optStyle = "border-rose-500/40 bg-rose-500/15 text-rose-200 line-through";
                    }

                    return (
                      <div key={optIdx} className={`flex items-start gap-3 rounded-xl border p-3 text-xs ${optStyle}`}>
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${
                            isCorrectAnswer
                              ? "bg-emerald-500 text-slate-950"
                              : isSelected
                                ? "bg-rose-500 text-white"
                                : "bg-white/5 text-white/40"
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </div>
                        <span className="leading-relaxed">{opt}</span>
                      </div>
                    );
                  })}
                </div>

                {q.explanation && (
                  <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-3.5 text-xs text-slate-300 space-y-1">
                    <span className="font-bold text-sky-300 flex items-center gap-1.5 text-[11px]">
                      <HelpCircle className="h-3.5 w-3.5" />
                      Concept Explanation
                    </span>
                    <p className="leading-relaxed text-white/80">{q.explanation}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/5">
          <Button variant="outline" onClick={onRetake} className="rounded-2xl border-white/10 text-white/80 hover:text-white">
            <RotateCcw className="mr-2 h-4 w-4" />
            Retake Assessment
          </Button>
          <Link to="/student/skills">
            <Button className="rounded-2xl bg-gradient-to-r from-emerald-500 to-sky-500 font-semibold text-white shadow-lg shadow-emerald-500/20">
              View in Skills Inventory
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
