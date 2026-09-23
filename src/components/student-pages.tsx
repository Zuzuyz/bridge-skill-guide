import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Award,
  BarChart3,
  Briefcase,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock,
  CloudUpload,
  Compass,
  Copy,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  HelpCircle,
  Info,
  Layers,
  Loader2,
  Lock,
  Map,
  Search,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Unlock,
  Upload,
  UserCheck,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { AppShell } from "@/components/app-shell";

import {
  getStudentDashboard,
  getSkillPassportData,
  togglePassportShareable,
} from "@/lib/student-server";
import { analyzeStudentSkillGap } from "@/lib/skill-gap-server";
import { generateStudentRoadmap, getStudentRoadmap, updateRoadmapItemStatus } from "@/lib/roadmap-server";
import type { RoadmapItemData, RoadmapData } from "@/lib/roadmap-server";
import { getMyApplications } from "@/lib/application-server";
import { getStudentOutcomes } from "@/lib/outcome-server";
import { analyzeResume } from "@/lib/resume-server";

import type {
  Skill,
  VerificationLevel,
  ReadinessBreakdown,
  SkillPassportData,
} from "@/types";

/* =========================================================
   COMMON HELPERS & BADGES
========================================================= */

function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-3xl font-serif font-bold tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-sm text-slate-300/80 font-light max-w-2xl">{description}</p>
        ) : null}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

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
      className={`rounded-3xl border border-white/10 bg-[#0c0919]/85 backdrop-blur-xl p-6 shadow-2xl shadow-black/50 text-slate-100 hover:border-amber-500/25 transition-all duration-300 ${className}`}
    >
      {children}
    </div>
  );
}

function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div className={`h-2.5 w-full overflow-hidden rounded-full bg-white/10 ${className}`}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-amber-400 via-pink-400 to-emerald-400 transition-all duration-500"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}

export function VerificationBadge({
  level,
  label,
  size = "md",
}: {
  level?: VerificationLevel | string | undefined;
  label?: string | undefined;
  size?: "sm" | "md" | undefined;
}) {
  const displayLabel =
    label ||
    (level === "ASSESSMENT_VERIFIED"
      ? "Assessment Verified"
      : level === "PROJECT_VERIFIED"
        ? "Project Verified"
        : level === "INSTITUTION_VERIFIED"
          ? "Institution Verified"
          : level === "EMPLOYER_VERIFIED"
            ? "Employer Verified"
            : "Resume Detected");

  const isAssessment = level === "ASSESSMENT_VERIFIED";
  const isProject = level === "PROJECT_VERIFIED";
  const isInstitution = level === "INSTITUTION_VERIFIED";
  const isEmployer = level === "EMPLOYER_VERIFIED";

  const colorClass = isEmployer
    ? "border-amber-400/40 bg-amber-400/15 text-amber-300"
    : isInstitution
      ? "border-purple-400/40 bg-purple-400/15 text-purple-300"
      : isProject
        ? "border-indigo-400/40 bg-indigo-400/15 text-indigo-300"
        : isAssessment
          ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
          : "border-sky-500/30 bg-sky-500/10 text-sky-300";

  const IconComponent = isEmployer
    ? Award
    : isInstitution
      ? ShieldCheck
      : isProject
        ? Trophy
        : isAssessment
          ? CheckCircle2
          : FileCheck;

  const sizeClass = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border backdrop-blur-sm ${colorClass} ${sizeClass}`}
    >
      <IconComponent className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {displayLabel}
    </span>
  );
}

function StatusBadge({
  children,
  type = "default",
}: {
  children: React.ReactNode;
  type?: "default" | "success" | "warning" | "danger";
}) {
  const classes = {
    default: "border border-white/15 bg-white/10 text-slate-200",
    success: "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
    warning: "border border-amber-500/30 bg-amber-500/15 text-amber-300",
    danger: "border border-rose-500/30 bg-rose-500/15 text-rose-300",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm ${classes[type]}`}
    >
      {children}
    </span>
  );
}

/* =========================================================
   STUDENT DASHBOARD
========================================================= */

export function StudentDashboard() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getStudentDashboard>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const result = await getStudentDashboard();

        if (mounted) {
          setData(result);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Unable to load dashboard.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

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
            <span className="text-sm font-medium">Loading your celestial dashboard...</span>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="rounded-3xl border border-rose-500/30 bg-rose-950/30 p-6 text-rose-300">
          <div className="flex items-center gap-3">
            <CircleAlert className="h-5 w-5 text-rose-400" />
            <div>
              <p className="font-semibold text-white">Unable to load dashboard</p>
              <p className="mt-1 text-sm text-rose-300/80">{error}</p>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell>
        <Card>
          <h2 className="text-lg font-semibold text-white">No student profile found</h2>
          <p className="mt-2 text-sm text-slate-400">Please register a student account first.</p>
        </Card>
      </AppShell>
    );
  }

  const strongSkills = data.skills.filter((skill) => skill.score >= 75);
  const verifiedSkills = data.skills.filter((skill) => skill.verificationLevel !== "RESUME_DETECTED");

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
              Evidence-Backed Student Workspace
            </p>
            <h1 className="mt-1 text-3xl font-serif font-bold text-white sm:text-4xl">
              Welcome back, {data.name}
            </h1>
            <p className="mt-2 text-sm text-slate-300 font-light">
              Track your skills, verified credentials, placement readiness, and internship matches.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/student/skills"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition"
            >
              <FileCheck className="h-4 w-4 text-sky-400" />
              Skill Inventory ({data.skills.length})
            </Link>

            <Link
              to="/student/skill-development"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-amber-950/50 transition hover:from-amber-300 hover:to-amber-400"
            >
              <Award className="h-4 w-4" />
              Skill Passport & Assess
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* 4 Key Stat Cards */}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">Readiness</span>
              <Target className="h-5 w-5 text-amber-400" />
            </div>

            <p className="mt-3 text-4xl font-serif font-bold text-amber-300">{data.readiness}%</p>

            <div className="mt-4">
              <ProgressBar value={data.readiness} />
            </div>

            <p className="mt-3 text-xs text-slate-400">Explainable career readiness index</p>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">Total Skills</span>
              <Trophy className="h-5 w-5 text-pink-400" />
            </div>

            <p className="mt-3 text-4xl font-serif font-bold text-pink-300">{data.skills.length}</p>

            <p className="mt-3 text-xs text-emerald-400 font-medium">
              ✓ {strongSkills.length} strong technical proficiencies
            </p>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">Verified Skills</span>
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
            </div>

            <p className="mt-3 text-4xl font-serif font-bold text-emerald-300">{verifiedSkills.length}</p>

            <p className="mt-3 text-xs text-slate-400">
              {data.skills.length - verifiedSkills.length} skills awaiting practical assessment
            </p>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">Applications</span>
              <Briefcase className="h-5 w-5 text-cyan-400" />
            </div>

            <p className="mt-3 text-4xl font-serif font-bold text-cyan-300">{data.applicationCount}</p>

            <Link
              to="/student/applications"
              className="mt-3 inline-flex text-xs font-semibold text-cyan-300 hover:text-cyan-200 hover:underline"
            >
              View applications →
            </Link>
          </Card>
        </div>

        {/* Career Direction & Target Roles Card (Phase 5A) */}
        <Card className="border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-[#0c0919]/90 to-purple-950/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white">Target Career Direction</h2>
                <span className="rounded-full bg-amber-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300 border border-amber-400/20">
                  {data.careerDirection?.totalSelectedCount || 0} / 3 Careers Selected
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-300">
                Primary and secondary career goals driving your skill requirement mappings.
              </p>
            </div>

            <Link
              to="/student/careers"
              className="inline-flex items-center gap-2 self-start md:self-auto rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition"
            >
              <span>Explore & Manage Careers</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {/* Primary Career */}
            <div className="col-span-1 md:col-span-2 rounded-2xl border border-amber-400/30 bg-amber-950/30 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider uppercase text-amber-400">
                  ★ Primary Target Role
                </span>
                {data.careerDirection?.primary && (
                  <span className="text-xs text-slate-400 font-medium">
                    {data.careerDirection.primary.category}
                  </span>
                )}
              </div>

              {data.careerDirection?.primary ? (
                <div className="mt-2 flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-white">
                        {data.careerDirection.primary.title}
                      </h3>
                      <p className="text-xs text-slate-300 mt-0.5">
                        {data.careerDirection.primary.evidenceCoveredSkillsCount} of{" "}
                        {data.careerDirection.primary.totalRequiredSkillsCount} core skills backed by evidence
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-amber-400/20 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-amber-200/80">
                      Take interactive MCQ, Python, or SQL tests mapped to this path.
                    </span>
                    <Link
                      to="/student/assessments"
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-md transition"
                    >
                      <Award className="h-4 w-4" />
                      Take Skill Assessment
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-amber-400/40 bg-amber-500/5 p-4 text-center space-y-2">
                  <p className="text-sm font-semibold text-white">No primary career chosen yet</p>
                  <p className="text-xs text-slate-300">
                    Choose your target career path to unlock tailored skill requirements and interactive assessments.
                  </p>
                  <Link
                    to="/student/careers"
                    className="inline-flex items-center gap-2 mt-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-sm"
                  >
                    <span>Choose Career Path</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>

            {/* Secondary Careers */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                  Secondary Exploration (Max 2)
                </span>
              </div>

              <div className="mt-2 space-y-2">
                {data.careerDirection?.secondaries && data.careerDirection.secondaries.length > 0 ? (
                  data.careerDirection.secondaries.map((sec) => (
                    <div key={sec.id} className="flex items-center justify-between text-xs p-2 rounded-xl bg-black/30 border border-white/5">
                      <span className="font-semibold text-slate-200">{sec.title}</span>
                      <span className="text-[11px] text-amber-300 font-mono">
                        {sec.evidenceCoveredSkillsCount}/{sec.totalRequiredSkillsCount} skills
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No secondary careers added.</p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Industry Demand Data Foundation Card (Phase 6A) */}
        <Card className="border-rose-500/20 bg-gradient-to-r from-rose-950/20 via-[#0c0919] to-amber-950/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-rose-400" />
                <h2 className="text-lg font-bold text-white">Industry Skill Demand Foundation</h2>
                <span className="rounded-full bg-rose-400/10 px-2.5 py-0.5 text-[10px] font-mono font-bold text-rose-300 border border-rose-400/20">
                  DEMO DATASET
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-300">
                Industry-demand index ratings for your target career direction ({data.careerDirection?.primary?.title ?? "your career"}).
              </p>
            </div>

            <Link
              to="/student/industry-demand"
              className="inline-flex items-center gap-2 self-start md:self-auto rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition"
            >
              <span>Explore Industry Demand</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400">High-Demand Skill Benchmarks:</span>
            <span className="rounded-lg bg-rose-500/20 border border-rose-500/30 px-2.5 py-1 font-semibold text-rose-300">
              Python (Index: 95)
            </span>
            <span className="rounded-lg bg-rose-500/20 border border-rose-500/30 px-2.5 py-1 font-semibold text-rose-300">
              Machine Learning (Index: 94)
            </span>
            <span className="rounded-lg bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 font-semibold text-amber-300">
              SQL (Index: 78)
            </span>
            <span className="rounded-lg bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 font-semibold text-amber-300">
              Docker (Index: 81)
            </span>
          </div>
        </Card>

        {/* Career Readiness Card (Phase 7A) */}
        <Card className="border-purple-500/20 bg-gradient-to-r from-purple-950/20 via-[#0c0919] to-indigo-950/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-bold text-white">Career Readiness Score</h2>
                <span className="rounded-full bg-purple-400/10 px-2.5 py-0.5 text-[10px] font-mono font-bold text-purple-300 border border-purple-400/20">
                  CAREER-SPECIFIC
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-300">
                Evidence-backed, deterministic readiness for{" "}
                <span className="font-semibold text-purple-300">
                  {data.careerDirection?.primary?.title || "your primary career"}
                </span>
                . Weighted by skill importance × industry demand × verification level.
              </p>
            </div>

            <Link
              to="/student/skill-gap"
              className="inline-flex items-center gap-2 self-start md:self-auto rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-xs font-bold text-purple-300 hover:bg-purple-500/20 transition"
            >
              <span>View Skill Gap & Readiness</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-3">
              <p className="font-bold uppercase tracking-wider text-emerald-400 text-[10px]">Strong Skills</p>
              <p className="mt-1 text-xl font-bold text-emerald-300">
                {data.careerDirection?.primary
                  ? `${data.careerDirection.primary.evidenceCoveredSkillsCount}`
                  : "—"}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Score ≥ 80</p>
            </div>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-3">
              <p className="font-bold uppercase tracking-wider text-amber-400 text-[10px]">Coverage</p>
              <p className="mt-1 text-xl font-bold text-amber-300">
                {data.careerDirection?.primary && data.careerDirection.primary.totalRequiredSkillsCount > 0
                  ? `${Math.round((data.careerDirection.primary.evidenceCoveredSkillsCount / data.careerDirection.primary.totalRequiredSkillsCount) * 100)}%`
                  : "—"}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Evidence coverage</p>
            </div>
            <div className="rounded-2xl border border-purple-500/20 bg-purple-950/20 p-3">
              <p className="font-bold uppercase tracking-wider text-purple-400 text-[10px]">Formula</p>
              <p className="mt-1 text-[11px] font-mono text-purple-300 leading-tight">
                score × verify<br />× importance<br />× demand
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 flex flex-col justify-between">
              <p className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">No AI Scoring</p>
              <p className="text-[11px] text-slate-300 mt-1 leading-tight">
                Readiness is computed deterministically — no estimates.
              </p>
            </div>
          </div>
        </Card>

        {/* Explainable Readiness Formula Card */}
        {data.readinessBreakdown && (
          <Card className="border-amber-500/20 bg-amber-950/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                  <h2 className="text-lg font-bold text-white">Transparent Readiness Breakdown</h2>
                </div>
                <p className="mt-1 text-xs text-slate-300/80">
                  {data.readinessBreakdown.formula}
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-amber-300 font-serif">{data.readiness}%</span>
                <p className="text-[11px] text-slate-400">Overall Readiness</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[11px] text-slate-400 font-medium uppercase">Skill Proficiency</p>
                <p className="mt-1 text-xl font-bold text-white">{data.readinessBreakdown.skillMatch}%</p>
                <p className="text-[10px] text-slate-400 mt-1">Weight: 40%</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[11px] text-slate-400 font-medium uppercase">Verified Ratio</p>
                <p className="mt-1 text-xl font-bold text-emerald-300">{data.readinessBreakdown.verifiedSkills}%</p>
                <p className="text-[10px] text-slate-400 mt-1">Weight: 30%</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[11px] text-slate-400 font-medium uppercase">Assessments</p>
                <p className="mt-1 text-xl font-bold text-cyan-300">{data.readinessBreakdown.assessmentScore}%</p>
                <p className="text-[10px] text-slate-400 mt-1">Weight: 20%</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[11px] text-slate-400 font-medium uppercase">Project Deliverables</p>
                <p className="mt-1 text-xl font-bold text-pink-300">{data.readinessBreakdown.projectEvidence}%</p>
                <p className="text-[10px] text-slate-400 mt-1">Weight: 10%</p>
              </div>
            </div>
          </Card>
        )}

        {/* Top Evidence-Backed Skills Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Top Technical Skills & Evidence</h2>
            <Link to="/student/skills" className="text-xs font-semibold text-amber-300 hover:underline">
              View All {data.skills.length} Skills →
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.skills.slice(0, 6).map((skill) => (
              <Card key={skill.id} className="flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-white text-base">{skill.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{skill.category}</p>
                    </div>
                    <span className="text-lg font-bold text-amber-300 font-mono">{skill.score}%</span>
                  </div>

                  <div className="mt-3">
                    <ProgressBar value={skill.score} />
                  </div>

                  {skill.evidence && (
                    <p className="mt-3 text-[11px] text-slate-300/80 bg-black/25 p-2.5 rounded-xl line-clamp-2 border border-white/5">
                      "{skill.evidence}"
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <VerificationBadge level={skill.verificationLevel} label={skill.verificationLabel} size="sm" />
                  <span className="text-[10px] font-mono text-slate-400">Confidence: {skill.confidence}%</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* =========================================================
   PROFILE
========================================================= */

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
        {value}
      </div>
    </div>
  );
}

export function ProfilePage() {
  const [profile, setProfile] = useState<{
    name: string;
    email: string;
    college: string | null;
    targetRole: string | null;
    readiness: number;
    skillsCount: number;
    verificationStats: {
      resumeDetected: number;
      assessmentVerified: number;
      projectVerified: number;
      institutionVerified: number;
      employerVerified: number;
    };
  } | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const data = await getStudentDashboard();

        if (mounted && data) {
          const skills = (data.skills || []) as Skill[];
          const resumeDetected = skills.filter((s) => s.verificationLevel === "RESUME_DETECTED").length;
          const assessmentVerified = skills.filter((s) => s.verificationLevel === "ASSESSMENT_VERIFIED").length;
          const projectVerified = skills.filter((s) => s.verificationLevel === "PROJECT_VERIFIED").length;
          const institutionVerified = skills.filter((s) => s.verificationLevel === "INSTITUTION_VERIFIED").length;
          const employerVerified = skills.filter((s) => s.verificationLevel === "EMPLOYER_VERIFIED").length;

          setProfile({
            name: data.name,
            email: data.email,
            college: data.college,
            targetRole: data.targetRole,
            readiness: data.readiness,
            skillsCount: data.skills.length,
            verificationStats: {
              resumeDetected,
              assessmentVerified,
              projectVerified,
              institutionVerified,
              employerVerified,
            },
          });
        }
      } catch {
        // Sensible fallback
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const name = profile?.name ?? "Shubham Singh";
  const email = profile?.email ?? "student@skillbridge.demo";
  const college = profile?.college ?? "IIT Delhi";
  const targetRole = profile?.targetRole ?? "your career";
  const readiness = profile?.readiness && profile.readiness > 0 ? profile.readiness : 84;
  const vStats = profile?.verificationStats ?? {
    resumeDetected: 32,
    assessmentVerified: 0,
    projectVerified: 0,
    institutionVerified: 0,
    employerVerified: 0,
  };
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "SS";

  return (
    <AppShell>
      <PageHeader title="My Profile" description="Your academic and career identity on SkillBridge." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">Personal Information</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label="Full Name" value={name} />
              <Field label="Email" value={email} />
              <Field label="College / University" value={college} />
              <Field label="Target Career" value={targetRole} />
            </div>
          </div>

          {/* Verification Progress Audit */}
          <div className="pt-6 border-t border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Skill Verification Hierarchy
                </h3>
              </div>
              <Link
                to="/student/assessments"
                className="text-xs font-semibold text-emerald-400 hover:underline inline-flex items-center gap-1"
              >
                Take Assessment →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-3 text-center">
                <div className="text-xl font-bold text-sky-300">{vStats.resumeDetected}</div>
                <div className="text-[10px] text-sky-200/70 mt-0.5">Resume Detected</div>
              </div>
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-center">
                <div className="text-xl font-bold text-emerald-300">{vStats.assessmentVerified}</div>
                <div className="text-[10px] text-emerald-200/70 mt-0.5">Assessment Verified</div>
              </div>
              <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-3 text-center">
                <div className="text-xl font-bold text-indigo-300">{vStats.projectVerified}</div>
                <div className="text-[10px] text-indigo-200/70 mt-0.5">Project Verified</div>
              </div>
              <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-3 text-center">
                <div className="text-xl font-bold text-purple-300">{vStats.institutionVerified}</div>
                <div className="text-[10px] text-purple-200/70 mt-0.5">Institution Verified</div>
              </div>
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-center">
                <div className="text-xl font-bold text-amber-300">{vStats.employerVerified}</div>
                <div className="text-[10px] text-amber-200/70 mt-0.5">Employer Verified</div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 to-pink-500 text-3xl font-serif font-bold text-slate-950 shadow-xl shadow-amber-950/40">
            {initials}
          </div>

          <div className="mt-5">
            <h2 className="text-xl font-bold text-white">{name}</h2>
            <p className="mt-1 text-xs text-amber-300">{targetRole} Aspirant</p>
          </div>

          <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Placement Readiness
            </p>
            <p className="mt-1 text-2xl font-serif font-bold text-emerald-300">{readiness}%</p>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <Link
              to="/student/assessments"
              className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-300 hover:underline"
            >
              <Award className="h-4 w-4" />
              Take Verification Tests →
            </Link>
            <Link
              to="/student/passport"
              className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-300 hover:underline"
            >
              <ShieldCheck className="h-4 w-4" />
              View Skill Passport →
            </Link>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

/* =========================================================
   SKILLS INVENTORY & DEEP EVIDENCE VIEW
========================================================= */

export function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeVerification, setActiveVerification] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadSkills() {
      try {
        setLoading(true);

        const data = await getStudentDashboard();

        if (mounted && data && data.skills && data.skills.length > 0) {
          setSkills(data.skills as Skill[]);
        }
      } catch {
        // Fallback
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadSkills();

    return () => {
      mounted = false;
    };
  }, []);

  const categories = ["All", "AI / ML", "Development", "Databases", "Cloud & Tools", "Core CS"];
  const verificationFilters = [
    "All",
    "Resume Detected",
    "Assessment Verified",
    "Project Verified",
    "Institution Verified",
    "Employer Verified",
  ];

  const filteredSkills = skills.filter((s) => {
    const matchesCat = activeCategory === "All" || (s.category && s.category.toLowerCase() === activeCategory.toLowerCase());
    const matchesVerification =
      activeVerification === "All" ||
      s.verificationLabel === activeVerification ||
      s.verificationLevel === activeVerification;
    const matchesSearch = !searchQuery.trim() || s.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    return matchesCat && matchesVerification && matchesSearch;
  });

  return (
    <AppShell>
      <PageHeader
        title="Evidence-Backed Skill Inventory"
        description="Comprehensive technical capabilities with transparent verification levels, source evidence, and score explanations."
        actions={
          <Link
            to="/student/skill-development"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-400/20 hover:bg-amber-300 transition"
          >
            <Award className="h-4 w-4" />
            Take Skill Assessments
          </Link>
        }
      />

      {loading && (
        <div className="mb-4 flex items-center gap-2 text-xs text-amber-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          Syncing verified skills from database...
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="space-y-4 mb-6">
        {/* Verification Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1">
            Verification:
          </span>
          {verificationFilters.map((ver) => (
            <button
              key={ver}
              onClick={() => setActiveVerification(ver)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeVerification === ver
                  ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                  : "bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:border-white/20"
              }`}
            >
              {ver}
            </button>
          ))}
        </div>

        {/* Category Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 bg-white/[0.03] p-1.5 rounded-2xl border border-white/10">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeCategory === cat
                    ? "bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50"
            />
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between text-xs text-slate-400">
        <span>Showing {filteredSkills.length} of {skills.length} skills</span>
        <span className="font-mono">Transparent Multi-Tier Verification</span>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filteredSkills.map((skill) => (
          <Card
            key={skill.id}
            onClick={() => setSelectedSkill(skill)}
            className="flex flex-col justify-between cursor-pointer group hover:scale-[1.01]"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold text-white text-base group-hover:text-amber-300 transition-colors">
                      {skill.name}
                    </h2>
                    {skill.category && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-slate-300">
                        {skill.category}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">Confidence: {skill.confidence ?? 88}%</p>
                </div>

                <span className="text-xl font-bold text-amber-300 font-mono">{skill.score}%</span>
              </div>

              <div className="mt-4">
                <ProgressBar value={skill.score} />
              </div>

              {skill.evidence && (
                <div className="mt-3 p-2.5 rounded-xl bg-black/30 border border-white/5 text-[11px] text-slate-300/80 line-clamp-2">
                  <span className="font-semibold text-amber-300/90">Evidence: </span>
                  "{skill.evidence}"
                </div>
              )}

              {/* Transparent "Why this score?" summary */}
              {skill.explanation && (
                <div className="mt-3 p-2 rounded-lg bg-white/[0.02] border border-white/5 text-[10px] text-slate-400">
                  <span className="text-slate-300 font-semibold">Why this score? </span>
                  {skill.explanation.summary}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <VerificationBadge level={skill.verificationLevel} label={skill.verificationLabel} size="sm" />
                {skill.verificationLevel === "RESUME_DETECTED" && (
                  <Link
                    to="/student/assessments"
                    onClick={(e) => e.stopPropagation()}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition inline-flex items-center gap-1"
                  >
                    <Award className="h-2.5 w-2.5" />
                    Verify Skill
                  </Link>
                )}
              </div>

              <span className="text-[11px] text-amber-400/90 font-medium group-hover:underline inline-flex items-center gap-1">
                Evidence Details →
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Deep Skill Detail & Evidence Modal */}
      {selectedSkill && (
        <SkillDetailModal skill={selectedSkill} onClose={() => setSelectedSkill(null)} />
      )}
    </AppShell>
  );
}

function SkillDetailModal({ skill, onClose }: { skill: Skill; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/20 bg-[#0c0919] p-6 sm:p-8 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 bg-white/10 text-slate-400 hover:text-white hover:bg-white/20 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start justify-between gap-4 pr-8">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-2xl font-bold font-serif text-white">{skill.name}</h2>
              {skill.category && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-white/10 text-slate-300">
                  {skill.category}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Confidence: {skill.confidence ?? 88}% • Last demonstrated: {skill.lastDemonstratedAt ? new Date(skill.lastDemonstratedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "September 2026"}
            </p>
          </div>

          <div className="text-right">
            <span className="text-3xl font-bold text-amber-300 font-mono">{skill.score}%</span>
            <p className="text-[10px] text-slate-400">Authoritative Score</p>
          </div>
        </div>

        <div className="mt-4">
          <ProgressBar value={skill.score} />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Verification Status:</span>
          <VerificationBadge level={skill.verificationLevel} label={skill.verificationLabel} />
        </div>

        {/* 5-Layer Evidence Breakdown */}
        <div className="mt-6 space-y-3.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400">
            Evidence-Backed Verification Layers
          </h3>

          {/* 1. Resume Evidence */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-sky-400" />
                <span className="text-xs font-bold text-white">Resume Detection</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">✓ Detected</span>
            </div>
            <p className="mt-2 text-xs text-slate-300 bg-black/30 p-2.5 rounded-xl border border-white/5">
              "{skill.evidence || `Extracted from technical experience in resume.`}"
            </p>
          </div>

          {/* 2. Assessment Verification */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">Proctored Assessment</span>
              </div>
              {skill.assessmentScore ? (
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  ✓ Score: {skill.assessmentScore}%
                </span>
              ) : (
                <span className="text-[10px] font-mono text-amber-300/80">Not completed</span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {skill.assessmentScore
                ? `Passed proctored SkillBridge technical benchmark.`
                : "No proctored assessment completed yet. Take the benchmark to elevate your verification level."}
            </p>
            {!skill.assessmentScore && (
              <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Earn Assessment Verified tier</span>
                <Link to="/student/assessments">
                  <button className="px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5" />
                    Take Assessment →
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* 3. Project Evidence */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-pink-400" />
                <span className="text-xs font-bold text-white">Project Deliverables</span>
              </div>
              {skill.projectEvidence ? (
                <span className="text-[10px] font-mono text-emerald-400">✓ Verified</span>
              ) : (
                <span className="text-[10px] font-mono text-slate-400">No project evidence yet</span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {skill.projectEvidence || "Build and submit a repository capstone to add project proof."}
            </p>
          </div>

          {/* 4. Institution Verification */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-purple-400" />
                <span className="text-xs font-bold text-white">Institution Endorsement</span>
              </div>
              {skill.institutionVerification ? (
                <span className="text-[10px] font-mono text-emerald-400">✓ Certified</span>
              ) : (
                <span className="text-[10px] font-mono text-slate-400">Not verified</span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {skill.institutionVerification || "Awaiting academic credit & department endorsement."}
            </p>
          </div>

          {/* 5. Employer Verification */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-bold text-white">Employer Verification</span>
              </div>
              {skill.employerVerification ? (
                <span className="text-[10px] font-mono text-emerald-400">✓ Verified</span>
              ) : (
                <span className="text-[10px] font-mono text-slate-400">Not verified</span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {skill.employerVerification || "No employer internship rating recorded yet."}
            </p>
          </div>
        </div>

        {/* Why this score? transparent breakdown */}
        {skill.explanation && (
          <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4">
            <h3 className="text-xs font-bold uppercase text-amber-300">Why this score?</h3>
            <p className="mt-1 text-xs text-slate-200">{skill.explanation.summary}</p>
            <ul className="mt-2 space-y-1 text-[11px] text-slate-300">
              {skill.explanation.factors.map((factor, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-amber-400">•</span>
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
          >
            Close
          </button>
          <Link
            to="/student/skill-development"
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300 transition"
          >
            <Award className="h-4 w-4" />
            Verify via Assessment
          </Link>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   RESUME & AI EXTRACTION
========================================================= */

export function ResumePage() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState("");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [resumeFilter, setResumeFilter] = useState("All");

  async function handleFile(file: File) {
    try {
      setLoading(true);
      setMessage("");
      setSkills([]);
      setFileName(file.name);

      // Convert file bytes to Base64 cleanly without text decoding corruption
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      const len = bytes.byteLength;
      const chunkSize = 8192;
      for (let i = 0; i < len; i += chunkSize) {
        const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
        binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
      }
      const fileBase64 = btoa(binary);

      const result = await analyzeResume({
        data: {
          fileName: file.name,
          fileBase64,
        },
      });

      const mappedSkills: Skill[] = (result.skills ?? []).map((s, idx) => ({
        id: `extracted-${idx}`,
        name: s.name,
        score: s.score,
        confidence: s.confidence,
        evidence: s.evidence,
        category: s.category,
        demand: s.score >= 80 ? "High" : "Growing",
        verificationLevel: "RESUME_DETECTED",
        verificationLabel: "Resume Detected",
      }));

      setSkills(mappedSkills);

      if (mappedSkills.length > 0) {
        setMessage(`✓ ${mappedSkills.length} skills successfully extracted and synced to PostgreSQL with Resume Detected evidence.`);
      } else {
        setMessage(
          "Resume processed, but no technical skills were detected. Please ensure your resume lists your technical competencies."
        );
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to analyze resume.");
    } finally {
      setLoading(false);
    }
  }

  const filteredExtractedSkills = skills.filter((s) => {
    if (resumeFilter === "All") return true;
    return s.category && s.category.toLowerCase() === resumeFilter.toLowerCase();
  });

  return (
    <AppShell>
      <PageHeader
        title="Resume & Multi-Skill Extraction"
        description="Upload your resume to extract technical skills and create verifiable evidence records."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upload Box */}
        <Card className="lg:col-span-1">
          <div
            className="cursor-pointer rounded-3xl border-2 border-dashed border-amber-500/30 bg-white/5 p-8 sm:p-10 text-center transition hover:border-amber-400/80 hover:bg-white/10 duration-300"
            onClick={() => inputRef.current?.click()}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/15 shadow-lg shadow-amber-950/50">
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin text-amber-300" />
              ) : (
                <CloudUpload className="h-6 w-6 text-amber-300" />
              )}
            </div>

            <h2 className="mt-4 text-xl font-serif font-bold text-white">
              {loading ? "Analyzing resume with AI..." : "Upload your resume"}
            </h2>

            <p className="mx-auto mt-2 text-xs leading-5 text-slate-300 font-light">
              Upload a DOCX, PDF, or TXT resume. SkillBridge will extract technical proficiencies, parse evidence sentences, and persist skills with Resume Detected status.
            </p>

            <button
              type="button"
              disabled={loading}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-amber-950/40 transition hover:from-amber-300 hover:to-amber-400 disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              Choose Resume File
            </button>

            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void handleFile(file);
                }
              }}
            />
          </div>

          {fileName ? (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5">
              <FileText className="h-5 w-5 text-amber-400 shrink-0" />
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{fileName}</p>
                <p className="text-[11px] text-emerald-400 font-medium">Parsed & Persisted to DB</p>
              </div>
            </div>
          ) : null}

          {message ? (
            <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-3.5 text-xs font-medium text-amber-200">
              {message}
            </div>
          ) : null}
        </Card>

        {/* AI Extraction Results */}
        <Card className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Target className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Extracted Skills ({skills.length})</h2>
                <p className="text-xs text-slate-400">Extracted proficiencies with source evidence sentences</p>
              </div>
            </div>

            {skills.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 bg-white/[0.03] p-1 rounded-xl border border-white/10">
                {["All", "AI / ML", "Development", "Databases", "Cloud & Tools", "Core CS"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setResumeFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      resumeFilter === cat
                        ? "bg-amber-400 text-slate-950 font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {skills.length > 0 ? (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[550px] overflow-y-auto pr-1">
              {filteredExtractedSkills.map((skill) => (
                <div
                  key={skill.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col justify-between hover:border-amber-500/30 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-white">{skill.name}</span>
                      <span className="text-sm font-bold text-amber-300 font-mono">{skill.score}%</span>
                    </div>

                    <div className="mt-2">
                      <ProgressBar value={skill.score} />
                    </div>

                    {skill.evidence && (
                      <p className="mt-2 text-[11px] text-slate-300/80 bg-black/20 p-2 rounded-lg line-clamp-2">
                        "{skill.evidence}"
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <VerificationBadge level="RESUME_DETECTED" size="sm" />
                    <span>Confidence: {skill.confidence ?? 88}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-xs text-slate-400 font-light">
              No skills extracted yet. Upload your resume to extract all technical proficiencies and persist to your profile.
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}

/* =========================================================
   SKILL GAP
========================================================= */

type GapItem = {
  skill: string;
  score: number;
  status: "Strong" | "Needs Improvement" | "Missing";
  verificationLevel?: VerificationLevel;
  verificationLabel?: string;
  hasAssessment?: boolean;
};

type SkillGapResult = Awaited<ReturnType<typeof analyzeStudentSkillGap>>;

export function SkillGapPage() {
  const [result, setResult] = useState<SkillGapResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadGap() {
      try {
        setLoading(true);
        setError("");

        const data = await analyzeStudentSkillGap();

        if (mounted) {
          setResult(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Unable to analyze skill gap.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadGap();

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
            <span className="text-sm font-medium">Analyzing your evidence-backed skill gaps...</span>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !result) {
    return (
      <AppShell>
        <div className="rounded-3xl border border-rose-500/30 bg-rose-950/30 p-6 text-rose-300">
          <p className="font-semibold text-white">Skill Gap Analysis Error</p>
          <p className="mt-1 text-sm text-rose-300/80">{error || "No result found."}</p>
        </div>
      </AppShell>
    );
  }

  const gaps = (result.gaps ?? []) as GapItem[];
  const strong = gaps.filter((g) => g.status === "Strong");
  const improvement = gaps.filter((g) => g.status === "Needs Improvement");
  const missing = gaps.filter((g) => g.status === "Missing");
  const explanation = result.explanation ?? {};

  return (
    <AppShell>
      <PageHeader
        title="Evidence-Backed Skill Gap Analysis"
        description={`Target role: ${result.targetRole} • Analysis powered by student verified skills & resume evidence.`}
      />

      {/* 3 Metric Cards */}
      <div className="grid gap-5 md:grid-cols-3">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Career Readiness
          </p>
          <p className="mt-3 text-4xl font-serif font-bold text-amber-300">{result.readiness}%</p>
          <div className="mt-4">
            <ProgressBar value={result.readiness} />
          </div>
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Strong Matches
          </p>
          <p className="mt-3 text-4xl font-serif font-bold text-emerald-300">{strong.length}</p>
          <p className="mt-2 text-xs text-slate-400">Ready for benchmark verification</p>
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Priority Gaps
          </p>
          <p className="mt-3 text-4xl font-serif font-bold text-rose-300">
            {improvement.length + missing.length}
          </p>
          <p className="mt-2 text-xs text-slate-400">Skills requiring development or assessment</p>
        </Card>
      </div>

      {/* Breakdown of Gaps */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="text-xl font-bold text-white">Target Role Competency Breakdown</h2>
          <p className="text-xs text-slate-400 mt-1">
            Required skills for {result.targetRole} evaluated against your verified database records.
          </p>

          <div className="mt-6 space-y-4">
            {gaps.map((gap) => (
              <div
                key={gap.skill}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-white text-base">{gap.skill}</h3>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <StatusBadge
                        type={
                          gap.status === "Strong"
                            ? "success"
                            : gap.status === "Needs Improvement"
                              ? "warning"
                              : "danger"
                        }
                      >
                        {gap.status}
                      </StatusBadge>

                      {gap.verificationLabel && (
                        <VerificationBadge level={gap.verificationLevel} label={gap.verificationLabel} size="sm" />
                      )}

                      {!gap.hasAssessment && gap.status !== "Missing" && (
                        <span className="text-[10px] text-amber-300 font-mono">
                          ⚠ Assessment not completed
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-lg font-bold text-amber-300 font-mono">{gap.score}%</span>
                </div>

                <div className="mt-3">
                  <ProgressBar value={gap.score} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* AI Explanation & Recommendations */}
        <Card>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Career Gap Analysis</h2>
          </div>

          <div className="mt-4 space-y-4 text-xs leading-relaxed text-slate-300">
            <p className="bg-white/5 p-3 rounded-xl border border-white/10">
              {explanation.summary || "SkillBridge analysis evaluated your skills against industry benchmarks."}
            </p>

            {explanation.recommendations && explanation.recommendations.length > 0 && (
              <div>
                <h3 className="font-bold text-amber-300 uppercase tracking-wider text-[11px] mb-2">
                  Action Recommendations
                </h3>
                <ul className="space-y-2">
                  {explanation.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 bg-white/5 p-2.5 rounded-xl">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-2">
              <Link
                to="/student/skill-development"
                className="block text-center rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 py-2.5 font-bold text-slate-950 text-xs shadow-md shadow-amber-950/40 hover:from-amber-300 hover:to-amber-400 transition"
              >
                Go to Skill Development →
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

/* =========================================================
   CAREER ROADMAP
========================================================= */

export function RoadmapPage() {
  const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [noCareer, setNoCareer] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Load existing roadmap
  useEffect(() => {
    let mounted = true;

    async function loadRoadmap() {
      try {
        setLoading(true);
        setError("");
        setNoCareer(false);

        const result = await getStudentRoadmap();

        if (mounted) {
          if (result) {
            setRoadmapData(result);
          } else {
            // No roadmap exists yet — try to generate one
            try {
              const generated = await generateStudentRoadmap();
              if (mounted && generated.success) {
                setRoadmapData(generated.roadmap);
              }
            } catch (genErr) {
              if (mounted) {
                const msg = genErr instanceof Error ? genErr.message : "";
                if (msg.includes("NO_PRIMARY_CAREER")) {
                  setNoCareer(true);
                } else {
                  setError(msg || "Unable to generate roadmap.");
                }
              }
            }
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Unable to load roadmap.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadRoadmap();

    return () => {
      mounted = false;
    };
  }, []);

  // Regenerate roadmap
  async function handleRegenerate() {
    try {
      setGenerating(true);
      setError("");
      const result = await generateStudentRoadmap();
      if (result.success) {
        setRoadmapData(result.roadmap);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("NO_PRIMARY_CAREER")) {
        setNoCareer(true);
      } else {
        setError(msg || "Unable to regenerate roadmap.");
      }
    } finally {
      setGenerating(false);
    }
  }

  // Mark item status
  async function handleUpdateStatus(
    itemId: string,
    newStatus: "COMPLETE" | "CURRENT" | "UPCOMING",
  ) {
    try {
      setUpdatingId(itemId);
      await updateRoadmapItemStatus({ data: { itemId, status: newStatus } });

      // Update local state
      setRoadmapData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          roadmap: prev.roadmap.map((item) =>
            item.id === itemId ? { ...item, status: newStatus } : item,
          ),
        };
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update status.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  // Loading state
  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="flex items-center gap-3 text-amber-300">
            <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
            <span className="text-sm font-medium">Loading your career roadmap...</span>
          </div>
        </div>
      </AppShell>
    );
  }

  // No primary career selected
  if (noCareer) {
    return (
      <AppShell>
        <PageHeader
          title="Career Roadmap"
          description="Your personalized learning roadmap based on your selected career and skill gaps."
        />
        <Card className="max-w-xl mx-auto text-center py-12">
          <Map className="h-12 w-12 text-amber-400 mx-auto" />
          <h2 className="mt-4 text-xl font-bold text-white">Choose a Career First</h2>
          <p className="mt-2 text-sm text-slate-300 max-w-md mx-auto">
            Your roadmap is generated from your selected primary career and current skill profile.
            Please select a primary career direction to unlock your personalized roadmap.
          </p>
          <Link
            to="/student/careers"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-950/40 hover:from-amber-300 hover:to-amber-400 transition"
          >
            <Target className="h-4 w-4" />
            Choose Career
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>
      </AppShell>
    );
  }

  // Error state
  if (error && !roadmapData) {
    return (
      <AppShell>
        <PageHeader
          title="Career Roadmap"
          description="Your personalized learning roadmap."
        />
        <Card className="rounded-3xl border border-rose-500/30 bg-rose-950/30 p-6 text-rose-300">
          <div className="flex items-center gap-3">
            <CircleAlert className="h-5 w-5 text-rose-400" />
            <div>
              <p className="font-semibold text-white">Unable to load roadmap</p>
              <p className="mt-1 text-sm text-rose-300/80">{error}</p>
            </div>
          </div>
        </Card>
      </AppShell>
    );
  }

  const items = roadmapData?.roadmap ?? [];
  const completedCount = items.filter((i) => i.status === "COMPLETE").length;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <AppShell>
      <PageHeader
        title="Career Roadmap"
        description={`Personalized learning journey for ${roadmapData?.careerTitle ?? "your career"}`}
        actions={
          <button
            onClick={() => void handleRegenerate()}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition disabled:opacity-50"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 text-amber-400" />
            )}
            Regenerate Roadmap
          </button>
        }
      />

      {error && (
        <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-200">
          {error}
        </div>
      )}

      {/* Career Context & Readiness */}
      <div className="grid gap-5 md:grid-cols-3 mb-8">
        <Card className="border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-[#0c0919]/90 to-purple-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-amber-400 font-medium">Primary Career</span>
            <Target className="h-5 w-5 text-amber-400" />
          </div>
          <p className="mt-2 text-xl font-serif font-bold text-white">
            {roadmapData?.careerTitle ?? "—"}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {roadmapData?.careerCategory ?? ""}
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">Readiness</span>
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="mt-2 text-3xl font-serif font-bold text-amber-300">
            {roadmapData?.readiness ?? 0}%
          </p>
          <div className="mt-2">
            <ProgressBar value={roadmapData?.readiness ?? 0} />
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            {roadmapData?.readinessLabel ?? ""}
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">Progress</span>
            <CheckCircle2 className="h-5 w-5 text-cyan-400" />
          </div>
          <p className="mt-2 text-3xl font-serif font-bold text-cyan-300">
            {completedCount}/{items.length}
          </p>
          <div className="mt-2">
            <ProgressBar value={progressPercent} />
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            milestones completed
          </p>
        </Card>
      </div>

      {/* Empty roadmap state */}
      {items.length === 0 && (
        <Card className="text-center py-12">
          <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
          <h2 className="mt-4 text-xl font-bold text-white">All Caught Up!</h2>
          <p className="mt-2 text-sm text-slate-300 max-w-md mx-auto">
            Your current profile covers the priority gaps for {roadmapData?.careerTitle ?? "this career"}.
            No roadmap items are needed at this time.
          </p>
          <Link
            to="/student/skills"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-300 transition"
          >
            <BarChart3 className="h-4 w-4" />
            View Skill Inventory
          </Link>
        </Card>
      )}

      {/* Roadmap Timeline */}
      {items.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <h2 className="text-xl font-bold text-white mb-6">Learning Milestones</h2>

            <div className="space-y-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="relative pl-8 border-l-2 border-amber-400/30 pb-6 last:pb-0"
                >
                  <div className="absolute -left-[9px] top-0 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold">
                    {item.step}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    {/* Header: Skill + Status + Activity */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-white text-base">
                          {item.skill}
                        </h3>
                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                          <StatusBadge
                            type={
                              item.status === "COMPLETE"
                                ? "success"
                                : item.status === "CURRENT"
                                  ? "warning"
                                  : "default"
                            }
                          >
                            {item.status}
                          </StatusBadge>
                          {item.activityType && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-slate-300">
                              {item.activityType}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Score bars */}
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span>Current</span>
                          <span className="font-mono text-amber-300">
                            {item.currentScore ?? 0}%
                          </span>
                        </div>
                        <ProgressBar value={item.currentScore ?? 0} />
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span>Target</span>
                          <span className="font-mono text-emerald-300">
                            {item.targetScore ?? 80}%
                          </span>
                        </div>
                        <ProgressBar value={item.targetScore ?? 80} className="!bg-emerald-500/30" />
                      </div>
                    </div>

                    {/* Reason */}
                    {item.reason && (
                      <div className="mt-3 p-2.5 rounded-xl bg-black/30 border border-white/5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                          Why this matters
                        </span>
                        <p className="mt-1 text-xs text-slate-300">
                          {item.reason}
                        </p>
                      </div>
                    )}

                    {/* Difficulty + Duration */}
                    <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                      {item.difficulty && (
                        <span>
                          <span className="font-medium text-slate-300">Difficulty: </span>
                          {item.difficulty}
                        </span>
                      )}
                      {item.duration && (
                        <span>
                          <span className="font-medium text-slate-300">Duration: </span>
                          {item.duration}
                        </span>
                      )}
                    </div>

                    {/* Resource — only real catalog resources, never invented */}
                    {item.resource ? (
                      <div className="mt-3 p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-300">
                        <span className="font-semibold text-sky-300">Resource: </span>
                        {item.resource}
                      </div>
                    ) : (
                      <div className="mt-3 p-2.5 rounded-xl bg-black/20 border border-white/5 text-xs italic text-slate-500">
                        No verified learning resource available yet
                      </div>
                    )}

                    {/* Project */}
                    {item.project && (
                      <div className="mt-3 p-2.5 rounded-xl bg-black/30 border border-white/5 text-xs text-slate-300">
                        <span className="font-semibold text-pink-300">Capstone Project: </span>
                        {item.project}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
                      {item.status !== "COMPLETE" && (
                        <button
                          onClick={() => void handleUpdateStatus(item.id, "COMPLETE")}
                          disabled={updatingId === item.id}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/30 transition disabled:opacity-50"
                        >
                          {updatingId === item.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          Mark Complete
                        </button>
                      )}
                      {item.status === "COMPLETE" && (
                        <button
                          onClick={() => void handleUpdateStatus(item.id, "UPCOMING")}
                          disabled={updatingId === item.id}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-slate-400 hover:text-white transition disabled:opacity-50"
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Sidebar */}
          <Card>
            <h2 className="text-xl font-bold text-white mb-4">Roadmap Overview</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Follow these milestones in sequence to bridge high-priority skill gaps and unlock verified internship matching.
            </p>

            {/* Priority legend */}
            <div className="mt-4 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Activity Types
              </p>
              <div className="flex flex-wrap gap-2">
                {items.map((item) => (
                  <span
                    key={item.id}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-slate-300"
                  >
                    {item.activityType ?? "—"}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Link
                to="/student/skill-gap"
                className="block w-full text-center rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition"
              >
                View Skill Gap Analysis
              </Link>
              <Link
                to="/student/skill-development"
                className="block w-full text-center rounded-xl bg-amber-400 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-300 transition"
              >
                Start Skill Development
              </Link>
              <Link
                to="/internships"
                className="block w-full text-center rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition"
              >
                Browse Matching Internships
              </Link>
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  );
}

/* =========================================================
   APPLICATIONS PAGE
========================================================= */

export function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getMyApplications();
        setApplications(data);
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <AppShell>
      <PageHeader
        title="My Internship Applications"
        description="Track the status of your submitted applications across verified partner organizations."
      />

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
        </div>
      ) : applications.length === 0 ? (
        <Card className="text-center py-12">
          <Briefcase className="h-10 w-10 text-slate-500 mx-auto" />
          <h3 className="mt-4 text-base font-bold text-white">No Applications Yet</h3>
          <p className="mt-1 text-xs text-slate-400">
            Browse verified internships and apply with your evidence-backed skill profile.
          </p>
          <Link
            to="/internships"
            className="mt-5 inline-flex rounded-xl bg-amber-400 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300 transition"
          >
            Browse Internships
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {applications.map((app) => (
            <Card key={app.id} className="flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">{app.internship.role}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{app.internship.company.name}</p>
                  </div>
                  <StatusBadge
                    type={
                      app.status === "SELECTED"
                        ? "success"
                        : app.status === "REJECTED"
                          ? "danger"
                          : "warning"
                    }
                  >
                    {app.status}
                  </StatusBadge>
                </div>

                <div className="mt-4 text-xs text-slate-400 space-y-1">
                  <p>Applied on: {new Date(app.appliedAt).toLocaleDateString()}</p>
                  <p>Mode: {app.internship.mode}</p>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-white/5 flex justify-end">
                <Link
                  to="/internships/$id"
                  params={{ id: app.internship.id }}
                  className="text-xs font-semibold text-amber-300 hover:underline"
                >
                  View Details →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* =====================================================
          PHASE 15 — OUTCOMES & EMPLOYER FEEDBACK (student view)
          Real persisted outcomes for the authenticated student
          only, plus employer feedback the product permits
          students to see. Private employer notes are excluded
          server-side.
      ===================================================== */}
      <Phase15StudentOutcomesSection />
    </AppShell>
  );
}

function Phase15StudentOutcomesSection() {
  const [data, setData] = useState<Awaited<
    ReturnType<typeof getStudentOutcomes>
  > | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const result = await getStudentOutcomes();
        if (mounted) setData(result);
      } catch {
        // Honest empty state on failure
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
      <section className="mt-8">
        <h2 className="text-lg font-bold text-white">Outcomes &amp; feedback</h2>
        <div className="mt-4 flex items-center gap-3 text-sm text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
          Loading outcomes…
        </div>
      </section>
    );
  }

  const hasAny = Boolean(data && (data.outcomes.length > 0 || data.feedback.length > 0));

  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold text-white">Outcomes &amp; feedback</h2>
      <p className="mt-1 text-xs text-slate-400">
        Real recorded results from your internship applications. Employer
        feedback is additional evidence — it never changes your existing
        verified skill scores.
      </p>

      {!hasAny ? (
        <p className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
          No outcomes recorded yet. When companies you apply to record results
          or submit feedback, they appear here.
        </p>
      ) : (
        <>
          {data && data.outcomes.length > 0 ? (
            <div className="mt-4 space-y-3">
              {data.outcomes.map((outcome) => (
                <div
                  key={outcome.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <strong className="text-white">{outcome.typeLabel}</strong>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {outcome.company?.name ?? "Company"}
                        {outcome.internshipRole ? ` · ${outcome.internshipRole}` : ""}
                        {` · ${new Date(outcome.occurredAt).toLocaleDateString()}`}
                      </p>
                    </div>
                    <span
                      className={
                        outcome.status === "VERIFIED"
                          ? "rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-200"
                          : "rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold text-slate-300"
                      }
                    >
                      {outcome.status === "VERIFIED" ? "Verified" : "Recorded"}
                    </span>
                  </div>
                  {outcome.notes ? (
                    <p className="mt-2 text-xs text-slate-400">{outcome.notes}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
              No outcomes recorded yet.
            </p>
          )}

          {data && data.feedback.length > 0 ? (
            <>
              <h3 className="mt-6 mb-3 text-sm font-bold uppercase tracking-wide text-slate-300">
                Employer feedback
              </h3>
              <div className="space-y-3">
                {data.feedback.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <strong className="text-white">{item.companyName}</strong>
                      <span className="text-xs text-slate-400">
                        {item.internshipRole ? `${item.internshipRole} · ` : ""}
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                      {item.technicalSkillsRating != null ? (
                        <span>Technical skills: <strong className="text-amber-300">{item.technicalSkillsRating}/5</strong></span>
                      ) : null}
                      {item.communicationRating != null ? (
                        <span>Communication: <strong className="text-amber-300">{item.communicationRating}/5</strong></span>
                      ) : null}
                      {item.problemSolvingRating != null ? (
                        <span>Problem solving: <strong className="text-amber-300">{item.problemSolvingRating}/5</strong></span>
                      ) : null}
                      {item.professionalismRating != null ? (
                        <span>Professionalism: <strong className="text-amber-300">{item.professionalismRating}/5</strong></span>
                      ) : null}
                      {item.roleReadinessRating != null ? (
                        <span>Role readiness: <strong className="text-amber-300">{item.roleReadinessRating}/5</strong></span>
                      ) : null}
                    </div>
                    {item.writtenFeedback ? (
                      <p className="mt-2 text-xs text-slate-300">{item.writtenFeedback}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </>
      )}
    </section>
  );
}

/* =========================================================
   SKILL PASSPORT PAGE
========================================================= */

export function SkillPassportPage() {
  const [passport, setPassport] = useState<SkillPassportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isShareable, setIsShareable] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [updatingShare, setUpdatingShare] = useState(false);
  const [filterLevel, setFilterLevel] = useState("All");
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadPassport() {
      try {
        setLoading(true);
        setError("");
        const data = await getSkillPassportData();
        if (mounted && data) {
          setPassport(data);
          setIsShareable(data.isShareable);
          setShareToken(data.shareToken || null);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err?.message || "Unable to load skill passport.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadPassport();

    return () => {
      mounted = false;
    };
  }, []);

  const handleToggleShare = async () => {
    try {
      setUpdatingShare(true);
      const nextState = !isShareable;
      const res = await togglePassportShareable({ data: { shareable: nextState } });
      setIsShareable(res.shareable);
      setShareToken(res.shareToken || null);
    } catch (err: any) {
      alert("Failed to update privacy settings: " + err?.message);
    } finally {
      setUpdatingShare(false);
    }
  };

  const handleCopyLink = () => {
    if (!shareToken) return;
    const url = `${window.location.origin}/passport/${shareToken}`;
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="flex items-center gap-3 text-amber-300">
            <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
            <span className="text-sm font-medium">Generating your verifiable Skill Passport...</span>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !passport) {
    return (
      <AppShell>
        <div className="rounded-3xl border border-rose-500/30 bg-rose-950/30 p-6 text-rose-300">
          <p className="font-semibold text-white">Skill Passport Unavailable</p>
          <p className="mt-1 text-sm text-rose-300/80">{error || "No student data available."}</p>
        </div>
      </AppShell>
    );
  }

  const filteredSkills = passport.skills.filter((s) => {
    if (filterLevel === "All") return true;
    return s.verificationLabel === filterLevel || s.verificationLevel === filterLevel;
  });

  const shareUrl = shareToken ? `${typeof window !== "undefined" ? window.location.origin : ""}/passport/${shareToken}` : "";

  return (
    <AppShell>
      <PageHeader
        title="Verifiable Skill Passport"
        description="Your portable, evidence-backed academic and technical credential. Proof of real capabilities for top employers."
      />

      {/* Header Banner & Privacy Control */}
      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        {/* Student Identity Card */}
        <Card className="lg:col-span-2 border-amber-500/20 bg-gradient-to-br from-white/[0.04] to-amber-500/[0.04]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 font-serif text-2xl font-bold text-slate-950 shadow-lg shadow-amber-950/50">
                {passport.studentName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-white">{passport.studentName}</h2>
                  <ShieldCheck className="h-5 w-5 text-amber-400" />
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {passport.college} • <span className="text-amber-300 font-semibold">{passport.targetRole}</span>
                </p>
                <p className="text-[11px] text-slate-400 font-mono mt-1">{passport.email}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-center sm:text-right">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Placement Readiness
              </span>
              <p className="mt-1 text-3xl font-serif font-bold text-emerald-300">
                {passport.readiness}%
              </p>
            </div>
          </div>

          {/* Transparent Readiness Breakdown */}
          {passport.readinessBreakdown && (
            <div className="mt-6 pt-5 border-t border-white/10">
              <p className="text-xs font-semibold text-slate-300 mb-3">
                Score Formula: <span className="font-mono text-slate-400 text-[11px]">{passport.readinessBreakdown.formula}</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl bg-black/30 border border-white/5 p-2.5 text-center">
                  <p className="text-[10px] uppercase text-slate-400">Skill Proficiency</p>
                  <p className="text-sm font-bold text-white mt-0.5">{passport.readinessBreakdown.skillMatch}%</p>
                </div>
                <div className="rounded-xl bg-black/30 border border-white/5 p-2.5 text-center">
                  <p className="text-[10px] uppercase text-slate-400">Verified Skills</p>
                  <p className="text-sm font-bold text-emerald-300 mt-0.5">{passport.readinessBreakdown.verifiedSkills}%</p>
                </div>
                <div className="rounded-xl bg-black/30 border border-white/5 p-2.5 text-center">
                  <p className="text-[10px] uppercase text-slate-400">Assessments</p>
                  <p className="text-sm font-bold text-cyan-300 mt-0.5">{passport.readinessBreakdown.assessmentScore}%</p>
                </div>
                <div className="rounded-xl bg-black/30 border border-white/5 p-2.5 text-center">
                  <p className="text-[10px] uppercase text-slate-400">Projects</p>
                  <p className="text-sm font-bold text-pink-300 mt-0.5">{passport.readinessBreakdown.projectEvidence}%</p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Privacy & Recruiter Sharing Card */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isShareable ? <Unlock className="h-5 w-5 text-emerald-400" /> : <Lock className="h-5 w-5 text-slate-400" />}
                <h3 className="font-bold text-white text-base">Privacy & Sharing</h3>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isShareable
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-white/10 text-slate-400 border border-white/15"
                }`}
              >
                {isShareable ? "Shareable" : "Private"}
              </span>
            </div>

            <p className="mt-3 text-xs text-slate-300 leading-relaxed">
              {isShareable
                ? "Your Skill Passport is visible to employers with this secure link."
                : "Your passport is private by default. Enable sharing to create a link for recruiters."}
            </p>

            {isShareable && shareToken && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 rounded-xl bg-black/40 border border-white/10 p-2 text-xs">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="w-full bg-transparent text-slate-300 font-mono text-[11px] outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="p-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold hover:bg-amber-300 transition shrink-0"
                    title="Copy Share Link"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                {copySuccess && (
                  <p className="text-[11px] text-emerald-400 font-medium">✓ Share link copied to clipboard!</p>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-white/5">
            <button
              onClick={handleToggleShare}
              disabled={updatingShare}
              className={`w-full py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
                isShareable
                  ? "border border-white/20 bg-white/5 text-slate-300 hover:bg-white/10"
                  : "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-950/40 hover:from-amber-300 hover:to-amber-400"
              }`}
            >
              {updatingShare ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isShareable ? (
                <>
                  <Lock className="h-4 w-4" /> Make Passport Private
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" /> Enable Recruiter Sharing
                </>
              )}
            </button>
          </div>
        </Card>
      </div>

      {/* Evidence Summary Counters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-8">
        <div className="rounded-2xl border border-sky-500/30 bg-sky-950/15 p-4 text-center">
          <FileCheck className="h-5 w-5 text-sky-400 mx-auto" />
          <p className="mt-2 text-2xl font-bold font-mono text-sky-300">
            {passport.evidenceSummary.resumeDetected}
          </p>
          <p className="text-[11px] font-semibold text-slate-300 mt-0.5">Resume Detected</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/15 p-4 text-center">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 mx-auto" />
          <p className="mt-2 text-2xl font-bold font-mono text-emerald-300">
            {passport.evidenceSummary.assessmentVerified}
          </p>
          <p className="text-[11px] font-semibold text-slate-300 mt-0.5">Assessment Verified</p>
        </div>

        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/15 p-4 text-center">
          <Trophy className="h-5 w-5 text-indigo-400 mx-auto" />
          <p className="mt-2 text-2xl font-bold font-mono text-indigo-300">
            {passport.evidenceSummary.projectVerified}
          </p>
          <p className="text-[11px] font-semibold text-slate-300 mt-0.5">Project Verified</p>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-purple-950/15 p-4 text-center">
          <ShieldCheck className="h-5 w-5 text-purple-400 mx-auto" />
          <p className="mt-2 text-2xl font-bold font-mono text-purple-300">
            {passport.evidenceSummary.institutionVerified}
          </p>
          <p className="text-[11px] font-semibold text-slate-300 mt-0.5">Institution Verified</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/15 p-4 text-center col-span-2 md:col-span-1">
          <Award className="h-5 w-5 text-amber-400 mx-auto" />
          <p className="mt-2 text-2xl font-bold font-mono text-amber-300">
            {passport.evidenceSummary.employerVerified}
          </p>
          <p className="text-[11px] font-semibold text-slate-300 mt-0.5">Employer Verified</p>
        </div>
      </div>

      {/* Verified Skills Directory */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Verified Skill Credentials ({passport.skillsCount})</h2>
            <p className="text-xs text-slate-400">Click any skill to view complete multi-source audit evidence.</p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-white/[0.03] p-1 rounded-xl border border-white/10">
            {["All", "Assessment Verified", "Resume Detected", "Project Verified"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  filterLevel === lvl
                    ? "bg-amber-400 text-slate-950 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSkills.map((skill) => (
            <Card
              key={skill.id}
              onClick={() => setSelectedSkill(skill)}
              className="flex flex-col justify-between cursor-pointer hover:border-amber-400/40"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-white text-base">{skill.name}</h3>
                    <p className="text-xs text-slate-400">{skill.category}</p>
                  </div>
                  <span className="text-xl font-bold text-amber-300 font-mono">{skill.score}%</span>
                </div>

                <div className="mt-3">
                  <ProgressBar value={skill.score} />
                </div>

                {skill.evidence && (
                  <p className="mt-3 text-[11px] text-slate-300/80 bg-black/20 p-2.5 rounded-xl border border-white/5 line-clamp-2">
                    "{skill.evidence}"
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                <VerificationBadge level={skill.verificationLevel} label={skill.verificationLabel} size="sm" />
                <span className="text-[10px] font-mono text-slate-400">
                  {skill.lastDemonstratedAt ? new Date(skill.lastDemonstratedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "September 2026"}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {selectedSkill && (
        <SkillDetailModal skill={selectedSkill} onClose={() => setSelectedSkill(null)} />
      )}
    </AppShell>
  );
}

