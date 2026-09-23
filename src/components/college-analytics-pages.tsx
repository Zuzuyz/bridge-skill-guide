import {
  Award,
  BookOpen,
  BriefcaseBusiness,
  FolderGit2,
  Gauge,
  GraduationCap,
  Loader2,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/metrics";
import { Badge } from "@/components/ui/badge";
import {
  getCollegeAnalytics,
  type CollegeAnalyticsResult,
} from "@/lib/college-analytics-server";

/* =========================================================
   PHASE 13 — COLLEGE ANALYTICS (UI)
   All values come from getCollegeAnalytics (Prisma
   aggregations over real PostgreSQL records). Every section
   renders an honest empty state when its data does not
   exist. No fake students, readiness, placements, or demand.
   ========================================================= */

function AnalyticsLoader({ label }: { label: string }) {
  return (
    <AppShell role="college">
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-amber-200">
          <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
          <span className="text-sm font-medium">{label}</span>
        </div>
      </div>
    </AppShell>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
      {children}
    </p>
  );
}

const DEMAND_LEVEL_STYLES: Record<string, string> = {
  HIGH: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  MEDIUM: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  LOW: "border-white/15 bg-white/5 text-slate-400",
};

const STATUS_LABELS: Record<string, string> = {
  APPLIED: "Applied",
  UNDER_REVIEW: "Under Review",
  SHORTLISTED: "Shortlisted",
  INTERVIEW: "Interview",
  SELECTED: "Selected",
  REJECTED: "Rejected",
};

const PROJECT_STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
};

type OkAnalytics = Extract<CollegeAnalyticsResult, { status: "ok" }>;

/* =========================================================
   MAIN DASHBOARD
   ========================================================= */

export function CollegeAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<OkAnalytics | null>(null);
  const [failure, setFailure] = useState<CollegeAnalyticsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const result = await getCollegeAnalytics();
        if (!mounted) return;
        if (result.status === "ok") {
          setAnalytics(result);
        } else {
          setFailure(result);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error ? err.message : "Unable to load analytics.",
          );
        }
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
    return <AnalyticsLoader label="Loading college analytics…" />;
  }

  if (error) {
    return (
      <AppShell role="college" title="College analytics">
        <EmptyHint>{error}</EmptyHint>
      </AppShell>
    );
  }

  if (failure?.status === "unauthenticated") {
    return (
      <AppShell role="college" title="College analytics">
        <EmptyHint>
          Please log in with a college account to view analytics.
        </EmptyHint>
      </AppShell>
    );
  }

  if (failure?.status === "forbidden") {
    return (
      <AppShell role="college" title="College analytics">
        <EmptyHint>
          College analytics are only available to college and administrator
          accounts.
        </EmptyHint>
      </AppShell>
    );
  }

  if (failure?.status === "no-college-profile") {
    return (
      <AppShell role="college" title="College analytics">
        <EmptyHint>
          This account has no college profile yet, so there is no institution
          to scope analytics to.
        </EmptyHint>
      </AppShell>
    );
  }

  if (!analytics) {
    return (
      <AppShell role="college" title="College analytics">
        <EmptyHint>No data available yet.</EmptyHint>
      </AppShell>
    );
  }

  const { overview, students, skills, skillGaps, careers, readiness, demand, internships, projects, outcomes } = analytics;

  return (
    <AppShell
      role="college"
      title="College analytics"
      eyebrow={analytics.college.name}
    >
      {/* --------------------------------------------------
           Students with no college set are in nobody's scope;
           if none match, every section shows real empty states.
      --------------------------------------------------- */}
      {!overview.hasAnyStudentData ? (
        <div className="mb-6 rounded-xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-200">
          No students are currently linked to {analytics.college.name} in the
          database. The sections below will populate automatically as students
          set this college on their profiles. No sample data is shown.
        </div>
      ) : null}

      {/* ---------------- OVERVIEW ---------------- */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-bold">Overview</h2>
        {overview.hasAnyStudentData ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total students"
              value={String(overview.totalStudents)}
              detail="Students linked to this college"
              icon={<GraduationCap className="size-4" />}
            />
            <StatCard
              label="Verified skills"
              value={String(overview.verifiedSkills)}
              detail="Assessment / project / institution / employer verified"
              icon={<Award className="size-4" />}
            />
            <StatCard
              label="Average readiness"
              value={
                overview.averageReadiness != null
                  ? `${overview.averageReadiness}%`
                  : "—"
              }
              detail={
                overview.averageReadiness != null
                  ? "Across students with computed readiness"
                  : "No readiness data available yet"
              }
              icon={<Gauge className="size-4" />}
            />
            <StatCard
              label="Project submissions"
              value={String(overview.projects)}
              detail="All submission statuses"
              icon={<FolderGit2 className="size-4" />}
            />
          </div>
        ) : (
          <EmptyHint>No data available yet.</EmptyHint>
        )}
      </section>

      {/* ---------------- STUDENTS ---------------- */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-bold">Students</h2>
        {students.hasStudentData ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Active students"
              value={String(students.activeStudents)}
              detail="Profile updated in the last 30 days"
              icon={<Users className="size-4" />}
            />
            <StatCard
              label="Students with skills"
              value={String(students.studentsWithSkills)}
              detail="Have at least one skill record"
              icon={<BookOpen className="size-4" />}
            />
            <StatCard
              label="With primary career"
              value={String(students.studentsWithPrimaryCareer)}
              detail="Selected a primary career direction"
              icon={<Target className="size-4" />}
            />
            <StatCard
              label="With applications"
              value={String(students.studentsWithApplications)}
              detail="Applied to at least one internship"
              icon={<BriefcaseBusiness className="size-4" />}
            />
          </div>
        ) : (
          <EmptyHint>No student data available yet.</EmptyHint>
        )}
      </section>

      {/* ---------------- SKILLS ---------------- */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-bold">Skills</h2>
        {skills.hasSkillData && skills.skills.length > 0 ? (
          <div className="rounded-xl border bg-card p-5 soft-shadow">
            <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {skills.totalSkillRecords} skill records across the college ·{" "}
                {skills.verifiedSkillRecords} verified
              </span>
              <span>Top {skills.skills.length} by student count</span>
            </div>
            <div className="space-y-2">
              {skills.skills.map((skill) => (
                <div
                  key={skill.name}
                  className="flex items-center justify-between rounded-lg bg-muted p-3"
                >
                  <div className="flex items-center gap-3">
                    <strong className="text-sm">{skill.name}</strong>
                    {skill.verifiedCount > 0 ? (
                      <Badge className="border border-emerald-400/25 bg-emerald-400/10 text-[10px] text-emerald-200">
                        {skill.verifiedCount} verified
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-muted-foreground">
                      avg {skill.avgScore != null ? `${skill.avgScore}%` : "—"}
                    </span>
                    <strong className="text-sm">
                      {skill.studentCount} student
                      {skill.studentCount === 1 ? "" : "s"}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyHint>No skill data available yet.</EmptyHint>
        )}
      </section>

      {/* ---------------- CAREERS ---------------- */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-bold">Careers</h2>
        {careers.hasCareerData && careers.careers.length > 0 ? (
          <div className="rounded-xl border bg-card p-5 soft-shadow">
            <p className="mb-4 text-xs text-muted-foreground">
              Aggregated from real student career selections. Primary selections
              are counted separately from total selections.
            </p>
            <div className="space-y-2">
              {careers.careers.map((career) => (
                <div
                  key={career.title}
                  className="flex items-center justify-between rounded-lg bg-muted p-3"
                >
                  <strong className="text-sm">{career.title}</strong>
                  <div className="flex items-center gap-2 text-xs">
                    {career.primaryCount > 0 ? (
                      <Badge className="border border-cyan-400/30 bg-cyan-400/10 text-cyan-200">
                        {career.primaryCount} primary
                      </Badge>
                    ) : null}
                    <Badge className="border border-white/15 bg-white/5 text-slate-300">
                      {career.totalSelections}{" "}
                      {career.totalSelections === 1 ? "selection" : "selections"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyHint>No career selection data available yet.</EmptyHint>
        )}
      </section>

      {/* ---------------- SKILL GAPS (Phase 7 data) ---------------- */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-bold">Skill gaps</h2>
        {skillGaps.hasSkillGapData && skillGaps.gaps.length > 0 ? (
          <div className="rounded-xl border bg-card p-5 soft-shadow">
            <p className="mb-4 text-xs text-muted-foreground">
              Aggregated from the Phase 7 skill-gap engine (students needing
              improvement / missing per skill). Individual students are never
              shown.
            </p>
            <div className="space-y-2">
              {skillGaps.gaps.map((gap) => (
                <div
                  key={gap.name}
                  className="flex items-center justify-between rounded-lg bg-muted p-3"
                >
                  <strong className="text-sm">{gap.name}</strong>
                  <div className="flex items-center gap-3 text-xs">
                    {gap.needsImprovement > 0 ? (
                      <Badge className="border border-amber-400/30 bg-amber-400/10 text-amber-200">
                        {gap.needsImprovement} needs improvement
                      </Badge>
                    ) : null}
                    {gap.missing > 0 ? (
                      <Badge className="border border-rose-400/30 bg-rose-400/10 text-rose-200">
                        {gap.missing} missing
                      </Badge>
                    ) : null}
                    <span className="text-muted-foreground">
                      avg score {gap.avgScore}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyHint>No skill-gap data available yet.</EmptyHint>
        )}
      </section>

      {/* ---------------- CAREER READINESS ---------------- */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-bold">Career readiness</h2>
        {readiness.hasReadinessData ? (
          <div className="rounded-xl border bg-card p-5 soft-shadow">
            <div className="mb-4 flex flex-wrap items-baseline gap-3">
              <strong className="font-display text-3xl">
                {readiness.averageReadiness != null
                  ? `${readiness.averageReadiness}%`
                  : "—"}
              </strong>
              <span className="text-xs text-muted-foreground">
                college average readiness across {readiness.computedReadinessCount}{" "}
                student{readiness.computedReadinessCount === 1 ? "" : "s"} with
                computed readiness · computed by the existing SkillBridge
                readiness engine
              </span>
            </div>
            <div className="space-y-2">
              {readiness.distribution.map((band) => (
                <div
                  key={band.label}
                  className="flex items-center gap-3"
                >
                  <span className="w-16 text-xs text-muted-foreground">
                    {band.label}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400"
                      style={{
                        width:
                          readiness.sampleSize > 0
                            ? `${Math.round((band.count / readiness.sampleSize) * 100)}%`
                            : "0%",
                      }}
                    />
                  </div>
                  <strong className="w-8 text-right text-xs">
                    {band.count}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyHint>
            No readiness data available yet. Readiness appears once students
            complete evidence, assessments, or projects.
          </EmptyHint>
        )}
      </section>

      {/* ---------------- INDUSTRY DEMAND ---------------- */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-bold">Industry demand</h2>
        {demand.hasDemandData && demand.topSkills.length > 0 ? (
          <div className="rounded-xl border bg-card p-5 soft-shadow">
            <p className="mb-4 text-xs text-muted-foreground">
              {demand.currentRecords} current demand records scoped to the
              careers your students selected · {demand.expiredRecords} expired
              records excluded · {demand.demoRecords} from the demo dataset
              (labeled, not live statistics)
            </p>
            <div className="space-y-2">
              {demand.topSkills.map((item) => (
                <div
                  key={item.name}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted p-3"
                >
                  <strong className="text-sm">{item.name}</strong>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge
                      className={
                        DEMAND_LEVEL_STYLES[item.demandLevel] ??
                        "border-white/15 bg-white/5 text-slate-400"
                      }
                    >
                      {item.demandLevel} demand
                    </Badge>
                    <Badge className="border border-white/15 bg-white/10 text-slate-400">
                      {item.confidence} confidence
                    </Badge>
                    <Badge
                      className={
                        item.isDemo
                          ? "border border-violet-400/30 bg-violet-400/10 text-violet-200"
                          : "border border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
                      }
                    >
                      {item.isDemo ? "Demo data" : item.sourceType}
                    </Badge>
                    <span className="text-muted-foreground">
                      {item.freshness}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyHint>
            No current industry-demand data available.
          </EmptyHint>
        )}
      </section>

      {/* ---------------- INTERNSHIPS ---------------- */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-bold">Internships</h2>
        {internships.hasInternshipData ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Platform opportunities"
              value={String(internships.totalOpportunities)}
              detail={`${internships.activeOpportunities} active · platform-wide (no college relation exists)`}
              icon={<BriefcaseBusiness className="size-4" />}
            />
            <StatCard
              label="Applications"
              value={String(internships.applications)}
              detail="From this college's students"
              icon={<TrendingUp className="size-4" />}
            />
            <StatCard
              label="Student participants"
              value={String(internships.studentParticipants)}
              detail="Distinct students with ≥1 application"
              icon={<Users className="size-4" />}
            />
            <StatCard
              label="Opportunities by status"
              value={`${internships.activeOpportunities}/${internships.totalOpportunities}`}
              detail="Active / total"
              icon={<Target className="size-4" />}
            />
          </div>
        ) : (
          <EmptyHint>No internship data available yet.</EmptyHint>
        )}
        {internships.applicationsByStatus.some((s) => s.count > 0) ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {internships.applicationsByStatus
              .filter((s) => s.count > 0)
              .map((s) => (
                <Badge
                  key={s.status}
                  className="border border-white/15 bg-white/5 text-slate-300"
                >
                  {STATUS_LABELS[s.status] ?? s.status}: {s.count}
                </Badge>
              ))}
          </div>
        ) : null}
      </section>

      {/* ---------------- PROJECTS ---------------- */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-bold">Projects</h2>
        {projects.hasProjectData ? (
          <div className="rounded-xl border bg-card p-5 soft-shadow">
            <div className="mb-4 flex flex-wrap gap-2">
              {projects.byStatus.map((s) => (
                <Badge
                  key={s.status}
                  className={
                    s.status === "VERIFIED"
                      ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                      : "border border-white/15 bg-white/5 text-slate-300"
                  }
                >
                  {PROJECT_STATUS_LABELS[s.status] ?? s.status}: {s.count}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {projects.totalSubmissions} total submissions ·{" "}
              {projects.verifiedProjects} verified
            </p>
          </div>
        ) : (
          <EmptyHint>No project data available yet.</EmptyHint>
        )}
      </section>

      {/* ---------------- OUTCOMES ---------------- */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-bold">Outcomes</h2>
        {outcomes.hasOutcomeData ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Selected"
              value={String(outcomes.selected)}
              detail="Applications in SELECTED status"
              icon={<Award className="size-4" />}
            />
            <StatCard
              label="Active pipeline"
              value={String(outcomes.activePipeline)}
              detail="Applications still in progress"
              icon={<TrendingUp className="size-4" />}
            />
            <StatCard
              label="Verified credentials"
              value={String(outcomes.verifiedCredentials)}
              detail={`${outcomes.credentialsIssued} total issued`}
              icon={<Award className="size-4" />}
            />
            <StatCard
              label="Passed assessments"
              value={String(outcomes.passedAttempts)}
              detail={`${outcomes.assessmentAttempts} total attempts`}
              icon={<Target className="size-4" />}
            />
          </div>
        ) : (
          <EmptyHint>No outcome data available yet.</EmptyHint>
        )}
      </section>
    </AppShell>
  );
}
