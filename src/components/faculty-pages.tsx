import {
  BarChart2,
  BookOpen,
  BriefcaseBusiness,
  ClipboardList,
  FolderGit2,
  Gauge,
  HandHeart,
  LayoutDashboard,
  Loader2,
  Map,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/metrics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addFacultyNote,
  deleteFacultyNote,
  getFacultyAssessments,
  getFacultyDashboard,
  getFacultyInternships,
  getFacultyProjects,
  getFacultyReadiness,
  getFacultySkillGaps,
  getFacultyStudent,
  getFacultyStudents,
  getFacultyInterventions,
  recommendProgram,
  type FacultyStatus,
} from "@/lib/faculty-server";

/* =========================================================
   PHASE 14 — FACULTY PORTAL (UI)
   ---------------------------------------------------------
   Every value renders from the faculty-server responses,
   which are computed server-side from real PostgreSQL
   records inside the faculty's authorized scope. Every
   section has an honest empty state; nothing is invented.
   ========================================================= */

function FacultyLoader() {
  return (
    <AppShell role="faculty" title="Faculty Portal">
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-amber-200">
          <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
          <span className="text-sm font-medium">Loading faculty data...</span>
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

/**
 * Shared gate: renders the exact honest message for every
 * non-ok server status. Faculty pages never render fake
 * data — there is no "ok without students" fabrication.
 */
function FacultyGate({
  status,
  children,
}: {
  status: FacultyStatus | "not_found" | "error";
  children?: React.ReactNode;
}) {
  const messages: Record<string, string> = {
    unauthenticated:
      "Please log in with a faculty account to access the Faculty Portal.",
    forbidden: "You are not authorized to access the Faculty Portal.",
    "no-faculty-profile": "Faculty access has not been provisioned yet.",
    "no-college-link":
      "Faculty access has not been provisioned yet: this account is not linked to a college, so no students are in scope.",
    not_found: "Student not found in your authorized scope.",
    error: "Something went wrong loading faculty data.",
  };

  return (
    <AppShell role="faculty" title="Faculty Portal">
      <EmptyHint>{messages[status] ?? messages["error"]}</EmptyHint>
      {children}
    </AppShell>
  );
}

function ErrorHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-200">
      {children}
    </p>
  );
}

const GAP_STATUS_LABELS: Record<string, string> = {
  NEEDS_IMPROVEMENT: "Needs improvement",
  MISSING: "Missing",
};

const PROJECT_STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
};

const APPLICATION_STATUS_LABELS: Record<string, string> = {
  APPLIED: "Applied",
  UNDER_REVIEW: "Under Review",
  SHORTLISTED: "Shortlisted",
  INTERVIEW: "Interview",
  SELECTED: "Selected",
  REJECTED: "Rejected",
};

const VERIFICATION_LABELS: Record<string, string> = {
  RESUME_DETECTED: "Resume detected",
  ASSESSMENT_VERIFIED: "Assessment verified",
  PROJECT_VERIFIED: "Project verified",
  INSTITUTION_VERIFIED: "Institution verified",
  EMPLOYER_VERIFIED: "Employer verified",
};

function failureOf<T extends { status: string }>(result: T) {
  return result.status !== "ok" ? (result.status as FacultyStatus) : null;
}

/* =========================================================
   FACULTY DASHBOARD
   ========================================================= */

type DashboardResult = Awaited<ReturnType<typeof getFacultyDashboard>>;

export function FacultyDashboardPage() {
  const [result, setResult] = useState<DashboardResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await getFacultyDashboard();
        if (mounted) setResult(data);
      } catch (err) {
        if (mounted)
          setError(err instanceof Error ? err.message : "Unable to load data.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <FacultyLoader />;
  if (error) return <FacultyGate status="error">{<ErrorHint>{error}</ErrorHint>}</FacultyGate>;
  if (!result || result.status !== "ok")
    return <FacultyGate status={(result?.status as FacultyStatus) ?? "error"} />;

  const { data, faculty } = result;

  return (
    <AppShell
      role="faculty"
      title="Faculty dashboard"
      {...(faculty.collegeName ? { eyebrow: faculty.collegeName } : {})}
    >
      <p className="mb-6 text-sm text-muted-foreground">
        Monitoring students of{" "}
        <span className="font-semibold text-foreground">
          {faculty.collegeName}
        </span>
        . All figures come from real student records in scope.
      </p>

      {!data.hasAnyStudentData ? (
        <div className="mb-6 rounded-xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-200">
          No students are currently assigned to your faculty account. Sections
          populate automatically as students of {faculty.collegeName} join the
          platform. No sample data is shown.
        </div>
      ) : null}

      {data.hasAnyStudentData ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Authorized students"
            value={String(data.students)}
            detail="Students linked to your college"
            icon={<Users className="size-4" />}
          />
          <StatCard
            label="Students with skill gaps"
            value={String(data.studentsWithGaps)}
            detail="Phase 7 gaps needing improvement"
            icon={<BarChart2 className="size-4" />}
          />
          <StatCard
            label="Average career readiness"
            value={
              data.averageReadiness != null
                ? `${data.averageReadiness}%`
                : "—"
            }
            detail={
              data.averageReadiness != null
                ? `Across ${data.computedReadinessCount} students with computed readiness`
                : "No readiness data available yet"
            }
            icon={<Gauge className="size-4" />}
          />
          <StatCard
            label="Projects in progress"
            value={String(data.projectsInFlight)}
            detail="Submitted or under review"
            icon={<FolderGit2 className="size-4" />}
          />
          <StatCard
            label="Internship participants"
            value={String(data.internshipParticipants)}
            detail="Students with applications"
            icon={<BriefcaseBusiness className="size-4" />}
          />
          <StatCard
            label="Assessment attempts"
            value={String(data.assessmentAttempts)}
            detail="All attempts by your students"
            icon={<ClipboardList className="size-4" />}
          />
          <StatCard
            label="Pending support needs"
            value={String(data.pendingSupportNeeds)}
            detail="Gap owners plus projects awaiting review"
            icon={<HandHeart className="size-4" />}
          />
        </div>
      ) : (
        <EmptyHint>No students are currently assigned to you.</EmptyHint>
      )}
    </AppShell>
  );
}

/* =========================================================
   MY STUDENTS
   ========================================================= */

type StudentsResult = Awaited<ReturnType<typeof getFacultyStudents>>;

export function FacultyStudentsPage() {
  const [result, setResult] = useState<StudentsResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await getFacultyStudents();
        if (mounted) setResult(data);
      } catch (err) {
        if (mounted)
          setError(err instanceof Error ? err.message : "Unable to load data.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <FacultyLoader />;
  if (error) return <FacultyGate status="error">{<ErrorHint>{error}</ErrorHint>}</FacultyGate>;
  if (!result || result.status !== "ok")
    return <FacultyGate status={(result?.status as FacultyStatus) ?? "error"} />;

  return (
    <AppShell
      role="faculty"
      title="My students"
      {...(result.faculty.collegeName
        ? { eyebrow: result.faculty.collegeName }
        : {})}
    >
      {result.students.length === 0 ? (
        <EmptyHint>No students are currently assigned to you.</EmptyHint>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {result.students.map((student) => (
            <Link
              key={student.id}
              to="/faculty/students/$id"
              params={{ id: student.id }}
              className="rounded-xl border bg-card p-5 soft-shadow transition hover:border-primary/40"
            >
              <div className="flex items-center justify-between gap-3">
                <strong className="font-display text-lg">{student.name}</strong>
                {student.readiness != null ? (
                  <Badge className="border-emerald-400/30 bg-emerald-400/10 text-emerald-200">
                    {student.readiness}% ready
                  </Badge>
                ) : (
                  <Badge className="border-white/15 bg-white/5 text-slate-400">
                    No readiness yet
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {student.college ?? "No college on profile"}
                {student.primaryCareer
                  ? ` · Primary career: ${student.primaryCareer}`
                  : " · No primary career selected"}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <span>Skill gaps: {student.gapCount}</span>
                <span>Projects: {student.projectCount}</span>
                <span>Applications: {student.internshipApplications}</span>
                <span>Assessments: {student.assessmentAttempts}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}

/* =========================================================
   STUDENT DETAIL
   ========================================================= */

type StudentDetailResult = Awaited<ReturnType<typeof getFacultyStudent>>;

export function FacultyStudentDetailPage({
  studentProfileId,
}: {
  studentProfileId: string;
}) {
  const [result, setResult] = useState<StudentDetailResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteBusy, setNoteBusy] = useState(false);
  const [noteMessage, setNoteMessage] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");
      const data = await getFacultyStudent({ data: { studentProfileId } });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load student.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (studentProfileId) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentProfileId]);

  async function submitNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!noteDraft.trim()) return;
    setNoteBusy(true);
    setNoteMessage("");
    try {
      await addFacultyNote({
        data: { studentProfileId, note: noteDraft.trim() },
      });
      setNoteDraft("");
      setNoteMessage("Private note saved.");
      await load();
    } catch (err) {
      setNoteMessage(
        err instanceof Error ? err.message : "Unable to save the note.",
      );
    } finally {
      setNoteBusy(false);
    }
  }

  async function removeNote(noteId: string) {
    setNoteBusy(true);
    try {
      await deleteFacultyNote({ data: { noteId } });
      await load();
    } catch (err) {
      setNoteMessage(
        err instanceof Error ? err.message : "Unable to delete the note.",
      );
    } finally {
      setNoteBusy(false);
    }
  }

  if (loading) return <FacultyLoader />;
  if (error) return <FacultyGate status="error">{<ErrorHint>{error}</ErrorHint>}</FacultyGate>;
  if (!result) return <FacultyGate status="error" />;
  if (result.status === "not_found") return <FacultyGate status="not_found" />;
  if (result.status !== "ok")
    return <FacultyGate status={result.status as FacultyStatus} />;

  const student = result.student;

  return (
    <AppShell
      role="faculty"
      title={student.name}
      eyebrow={`Student · ${student.college ?? "no college on profile"}`}
    >
      <Link
        to="/faculty/students"
        className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to my students
      </Link>

      {/* ---------- Career ---------- */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold">Career</h2>
        {student.careers.length === 0 ? (
          <EmptyHint>No career selection data available yet.</EmptyHint>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-xl border bg-card px-4 py-2 text-sm">
              Readiness:{" "}
              <strong>
                {student.readiness != null ? `${student.readiness}%` : "—"}
              </strong>{" "}
              <span className="text-xs text-muted-foreground">
                (persisted from the existing readiness engine)
              </span>
            </span>
            {student.careers.map((career) => (
              <Badge
                key={career.title}
                className={
                  career.isPrimary
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-white/15 bg-white/5 text-slate-300"
                }
              >
                {career.title}
                {career.isPrimary ? " · Primary" : ""}
              </Badge>
            ))}
          </div>
        )}
      </section>

      {/* ---------- Skills ---------- */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold">Skills</h2>
        {student.skills.length === 0 ? (
          <EmptyHint>No skill data available yet.</EmptyHint>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {student.skills.map((skill) => (
              <div
                key={skill.name}
                className="rounded-xl border bg-card p-4 text-sm"
              >
                <div className="flex items-center justify-between">
                  <strong>{skill.name}</strong>
                  <span>{skill.score}%</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {VERIFICATION_LABELS[skill.verificationLevel] ??
                    skill.verificationLevel}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---------- Skill gaps (Phase 7) ---------- */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold">Skill gaps</h2>
        {student.skillGaps.length === 0 ? (
          <EmptyHint>No skill gaps available.</EmptyHint>
        ) : (
          <div className="space-y-2">
            {student.skillGaps.map((gap) => (
              <div
                key={gap.name}
                className="flex items-center justify-between rounded-xl border bg-card p-4 text-sm"
              >
                <span>
                  <strong>{gap.name}</strong>
                  <span className="ml-3 text-xs text-muted-foreground">
                    Current level: {gap.score}%
                  </span>
                </span>
                <Badge className="border-amber-400/30 bg-amber-400/10 text-amber-200">
                  {GAP_STATUS_LABELS[gap.status] ?? gap.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---------- Assessments ---------- */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold">Assessments</h2>
        {student.assessments.length === 0 ? (
          <EmptyHint>No assessment activity available yet.</EmptyHint>
        ) : (
          <div className="space-y-2">
            {student.assessments.map((attempt, index) => (
              <div
                key={`${attempt.title}-${attempt.attemptNumber}-${index}`}
                className="flex items-center justify-between rounded-xl border bg-card p-4 text-sm"
              >
                <span>
                  <strong>{attempt.title}</strong>
                  <span className="ml-3 text-xs text-muted-foreground">
                    {attempt.category} · attempt {attempt.attemptNumber}
                    {attempt.completedAt
                      ? ` · ${new Date(attempt.completedAt).toLocaleDateString()}`
                      : " · in progress"}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <strong>{attempt.percentage}%</strong>
                  <Badge
                    className={
                      attempt.passed
                        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                        : "border-white/15 bg-white/5 text-slate-400"
                    }
                  >
                    {attempt.passed ? "Passed" : "Not passed"}
                  </Badge>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---------- Projects ---------- */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold">Projects</h2>
        {student.projects.length === 0 ? (
          <EmptyHint>No projects submitted yet.</EmptyHint>
        ) : (
          <div className="space-y-2">
            {student.projects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between rounded-xl border bg-card p-4 text-sm"
              >
                <span>
                  <strong>{project.title}</strong>
                  <span className="ml-3 text-xs text-muted-foreground">
                    {project.skillName} ·{" "}
                    {new Date(project.submittedAt).toLocaleDateString()}
                    {project.score != null ? ` · score ${project.score}` : ""}
                  </span>
                </span>
                <Badge className="border-white/15 bg-white/5 text-slate-300">
                  {PROJECT_STATUS_LABELS[project.status] ?? project.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---------- Internships ---------- */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold">Internships</h2>
        {student.internships.length === 0 ? (
          <EmptyHint>No internship participation recorded yet.</EmptyHint>
        ) : (
          <div className="space-y-2">
            {student.internships.map((application) => (
              <div
                key={application.id}
                className="flex items-center justify-between rounded-xl border bg-card p-4 text-sm"
              >
                <span>
                  <strong>{application.role}</strong>
                  <span className="ml-3 text-xs text-muted-foreground">
                    {application.company} ·{" "}
                    {new Date(application.appliedAt).toLocaleDateString()}
                  </span>
                </span>
                <Badge className="border-white/15 bg-white/5 text-slate-300">
                  {APPLICATION_STATUS_LABELS[application.status] ??
                    application.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---------- Roadmap (Phase 8, reused) ---------- */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold">Career roadmap</h2>
        {!student.roadmap.hasRoadmap ? (
          <EmptyHint>Career roadmap has not been generated yet.</EmptyHint>
        ) : (
          <div className="space-y-2">
            <p className="mb-2 text-xs text-muted-foreground">
              Generated by the existing Phase 8 roadmap engine for{" "}
              {student.roadmap.careerTitle}.
            </p>
            {student.roadmap.items.map((item) => (
              <div
                key={item.step}
                className="rounded-xl border bg-card p-4 text-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <span>
                    <strong>
                      Step {item.step}: {item.skill}
                    </strong>
                    {item.activityType ? (
                      <span className="ml-3 text-xs text-muted-foreground">
                        {item.activityType}
                      </span>
                    ) : null}
                  </span>
                  <Badge className="border-white/15 bg-white/5 text-slate-300">
                    {item.statusLabel}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---------- Outcomes (Phase 15, authorized scope only) ---------- */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold">Outcomes</h2>
        {student.outcomes.length === 0 ? (
          <EmptyHint>No outcomes recorded yet for this student.</EmptyHint>
        ) : (
          <div className="space-y-2">
            {student.outcomes.map((outcome, index) => (
              <div
                key={`${outcome.type}-${outcome.occurredAt}-${index}`}
                className="flex items-center justify-between rounded-xl border bg-card p-4 text-sm"
              >
                <span>
                  <strong>{outcome.typeLabel}</strong>
                  <span className="ml-3 text-xs text-muted-foreground">
                    {outcome.companyName}
                    {outcome.internshipRole ? ` · ${outcome.internshipRole}` : ""}
                    {` · ${new Date(outcome.occurredAt).toLocaleDateString()}`}
                  </span>
                </span>
                <Badge className="border-white/15 bg-white/5 text-slate-300">
                  {outcome.status === "VERIFIED" ? "Verified" : "Recorded"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---------- Faculty-private notes ---------- */}
      <section className="mb-8">
        <h2 className="mb-1 text-lg font-bold">Private support notes</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Visible only to you. Students never see faculty notes.
        </p>
        {student.notes.length === 0 ? (
          <EmptyHint>No support notes recorded yet.</EmptyHint>
        ) : (
          <div className="mb-4 space-y-2">
            {student.notes.map((note) => (
              <div
                key={note.id}
                className="flex items-start justify-between gap-4 rounded-xl border bg-card p-4 text-sm"
              >
                <div>
                  <p>{note.note}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(note.createdAt).toLocaleString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={noteBusy}
                  onClick={() => void removeNote(note.id)}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={submitNote} className="space-y-3">
          <Label htmlFor="faculty-note">Add a private note</Label>
          <Input
            id="faculty-note"
            value={noteDraft}
            onChange={(event) => setNoteDraft(event.target.value)}
            placeholder="e.g. Discussed improving Python fundamentals before the next assessment"
            maxLength={4000}
          />
          {noteMessage ? (
            <p className="text-xs text-muted-foreground">{noteMessage}</p>
          ) : null}
          <Button type="submit" size="sm" disabled={noteBusy}>
            {noteBusy ? "Saving…" : "Save note"}
          </Button>
        </form>
      </section>
    </AppShell>
  );
}

/* =========================================================
   SKILL GAPS
   ========================================================= */

type SkillGapsResult = Awaited<ReturnType<typeof getFacultySkillGaps>>;

export function FacultySkillGapsPage() {
  const [result, setResult] = useState<SkillGapsResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await getFacultySkillGaps();
        if (mounted) setResult(data);
      } catch (err) {
        if (mounted)
          setError(err instanceof Error ? err.message : "Unable to load data.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <FacultyLoader />;
  if (error) return <FacultyGate status="error">{<ErrorHint>{error}</ErrorHint>}</FacultyGate>;
  if (!result || result.status !== "ok")
    return <FacultyGate status={(result?.status as FacultyStatus) ?? "error"} />;

  return (
    <AppShell
      role="faculty"
      title="Skill gaps"
      {...(result.faculty.collegeName
        ? { eyebrow: result.faculty.collegeName }
        : {})}
    >
      <p className="mb-6 text-sm text-muted-foreground">
        From the existing Phase 7 SkillGap records (computeCareerSkillGap
        output) for students in your scope.
      </p>

      {result.gaps.length === 0 ? (
        <EmptyHint>No skill gaps available.</EmptyHint>
      ) : (
        <div className="space-y-2">
          {result.gaps.map((gap, index) => (
            <Link
              key={`${gap.studentProfileId}-${gap.skill}-${index}`}
              to="/faculty/students/$id"
              params={{ id: gap.studentProfileId }}
              className="flex items-center justify-between rounded-xl border bg-card p-4 text-sm transition hover:border-primary/40"
            >
              <span>
                <strong>{gap.studentName}</strong>
                <span className="ml-3 text-xs text-muted-foreground">
                  {gap.primaryCareer ?? "No primary career"} · current level{" "}
                  {gap.score}%
                </span>
              </span>
              <span className="flex items-center gap-2">
                <strong>{gap.skill}</strong>
                <Badge className="border-amber-400/30 bg-amber-400/10 text-amber-200">
                  {GAP_STATUS_LABELS[gap.status] ?? gap.status}
                </Badge>
              </span>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}

/* =========================================================
   CAREER READINESS
   ========================================================= */

type ReadinessResult = Awaited<ReturnType<typeof getFacultyReadiness>>;

export function FacultyReadinessPage() {
  const [result, setResult] = useState<ReadinessResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await getFacultyReadiness();
        if (mounted) setResult(data);
      } catch (err) {
        if (mounted)
          setError(err instanceof Error ? err.message : "Unable to load data.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <FacultyLoader />;
  if (error) return <FacultyGate status="error">{<ErrorHint>{error}</ErrorHint>}</FacultyGate>;
  if (!result || result.status !== "ok")
    return <FacultyGate status={(result?.status as FacultyStatus) ?? "error"} />;

  return (
    <AppShell
      role="faculty"
      title="Career readiness"
      {...(result.faculty.collegeName
        ? { eyebrow: result.faculty.collegeName }
        : {})}
    >
      <p className="mb-6 text-sm text-muted-foreground">
        Persisted readiness from the existing SkillBridge readiness engine.
        Students without computed readiness are listed on their profiles, not
        invented here.
      </p>

      {result.rows.length === 0 ? (
        <EmptyHint>No readiness data available yet.</EmptyHint>
      ) : (
        <div className="space-y-2">
          {result.rows.map((row) => (
            <Link
              key={row.studentProfileId}
              to="/faculty/students/$id"
              params={{ id: row.studentProfileId }}
              className="flex items-center justify-between rounded-xl border bg-card p-4 text-sm transition hover:border-primary/40"
            >
              <span>
                <strong>{row.studentName}</strong>
                <span className="ml-3 text-xs text-muted-foreground">
                  {row.primaryCareer ?? "No primary career"}
                </span>
              </span>
              <span className="flex items-center gap-3">
                <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(100, row.readiness)}%` }}
                  />
                </div>
                <strong>{row.readiness}%</strong>
              </span>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}

/* =========================================================
   PROJECTS
   ========================================================= */

type ProjectsResult = Awaited<ReturnType<typeof getFacultyProjects>>;

export function FacultyProjectsPage() {
  const [result, setResult] = useState<ProjectsResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await getFacultyProjects();
        if (mounted) setResult(data);
      } catch (err) {
        if (mounted)
          setError(err instanceof Error ? err.message : "Unable to load data.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <FacultyLoader />;
  if (error) return <FacultyGate status="error">{<ErrorHint>{error}</ErrorHint>}</FacultyGate>;
  if (!result || result.status !== "ok")
    return <FacultyGate status={(result?.status as FacultyStatus) ?? "error"} />;

  return (
    <AppShell
      role="faculty"
      title="Projects"
      {...(result.faculty.collegeName
        ? { eyebrow: result.faculty.collegeName }
        : {})}
    >
      {result.projects.length === 0 ? (
        <EmptyHint>No projects submitted yet.</EmptyHint>
      ) : (
        <div className="space-y-2">
          {result.projects.map((project) => (
            <Link
              key={project.id}
              to="/faculty/students/$id"
              params={{ id: project.studentProfileId }}
              className="flex items-center justify-between rounded-xl border bg-card p-4 text-sm transition hover:border-primary/40"
            >
              <span>
                <strong>{project.title}</strong>
                <span className="ml-3 text-xs text-muted-foreground">
                  {project.studentName} · {project.skillName} ·{" "}
                  {new Date(project.submittedAt).toLocaleDateString()}
                  {project.score != null ? ` · score ${project.score}` : ""}
                </span>
              </span>
              <Badge className="border-white/15 bg-white/5 text-slate-300">
                {PROJECT_STATUS_LABELS[project.status] ?? project.status}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}

/* =========================================================
   ASSESSMENTS
   ========================================================= */

type AssessmentsResult = Awaited<ReturnType<typeof getFacultyAssessments>>;

export function FacultyAssessmentsPage() {
  const [result, setResult] = useState<AssessmentsResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await getFacultyAssessments();
        if (mounted) setResult(data);
      } catch (err) {
        if (mounted)
          setError(err instanceof Error ? err.message : "Unable to load data.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <FacultyLoader />;
  if (error) return <FacultyGate status="error">{<ErrorHint>{error}</ErrorHint>}</FacultyGate>;
  if (!result || result.status !== "ok")
    return <FacultyGate status={(result?.status as FacultyStatus) ?? "error"} />;

  return (
    <AppShell
      role="faculty"
      title="Assessments"
      {...(result.faculty.collegeName
        ? { eyebrow: result.faculty.collegeName }
        : {})}
    >
      {result.attempts.length === 0 ? (
        <EmptyHint>No assessment activity available yet.</EmptyHint>
      ) : (
        <div className="space-y-2">
          {result.attempts.map((attempt) => (
            <Link
              key={attempt.id}
              to="/faculty/students/$id"
              params={{ id: attempt.studentProfileId }}
              className="flex items-center justify-between rounded-xl border bg-card p-4 text-sm transition hover:border-primary/40"
            >
              <span>
                <strong>{attempt.studentName}</strong>
                <span className="ml-3 text-xs text-muted-foreground">
                  {attempt.title} · {attempt.category} · attempt{" "}
                  {attempt.attemptNumber}
                  {attempt.completedAt
                    ? ` · ${new Date(attempt.completedAt).toLocaleDateString()}`
                    : " · in progress"}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <strong>{attempt.percentage}%</strong>
                <Badge
                  className={
                    attempt.passed
                      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                      : "border-white/15 bg-white/5 text-slate-400"
                  }
                >
                  {attempt.passed ? "Passed" : "Not passed"}
                </Badge>
              </span>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}

/* =========================================================
   INTERNSHIPS
   ========================================================= */

type InternshipsResult = Awaited<ReturnType<typeof getFacultyInternships>>;

export function FacultyInternshipsPage() {
  const [result, setResult] = useState<InternshipsResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await getFacultyInternships();
        if (mounted) setResult(data);
      } catch (err) {
        if (mounted)
          setError(err instanceof Error ? err.message : "Unable to load data.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <FacultyLoader />;
  if (error) return <FacultyGate status="error">{<ErrorHint>{error}</ErrorHint>}</FacultyGate>;
  if (!result || result.status !== "ok")
    return <FacultyGate status={(result?.status as FacultyStatus) ?? "error"} />;

  return (
    <AppShell
      role="faculty"
      title="Internships"
      {...(result.faculty.collegeName
        ? { eyebrow: result.faculty.collegeName }
        : {})}
    >
      {result.applications.length === 0 ? (
        <EmptyHint>No internship participation recorded yet.</EmptyHint>
      ) : (
        <div className="space-y-2">
          {result.applications.map((application) => (
            <div
              key={application.id}
              className="flex items-center justify-between rounded-xl border bg-card p-4 text-sm"
            >
              <span>
                <strong>{application.role}</strong>
                <span className="ml-3 text-xs text-muted-foreground">
                  {application.company} · {application.studentName} ·{" "}
                  {new Date(application.appliedAt).toLocaleDateString()}
                </span>
              </span>
              <Badge className="border-white/15 bg-white/5 text-slate-300">
                {APPLICATION_STATUS_LABELS[application.status] ??
                  application.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}

/* =========================================================
   INTERVENTIONS
   ========================================================= */

type InterventionsResult = Awaited<ReturnType<typeof getFacultyInterventions>>;

export function FacultyInterventionsPage() {
  const [result, setResult] = useState<InterventionsResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState("");
  const [programId, setProgramId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await getFacultyInterventions();
        if (mounted) setResult(data);
      } catch (err) {
        if (mounted)
          setError(err instanceof Error ? err.message : "Unable to load data.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  async function submitRecommendation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!studentId || !programId) return;
    setBusy(true);
    setMessage("");
    try {
      await recommendProgram({ data: { studentProfileId: studentId, programId } });
      setMessage(
        "Recommendation saved: the student is enrolled in the program and it will appear in their skill development plan.",
      );
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Unable to save the recommendation.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <FacultyLoader />;
  if (error) return <FacultyGate status="error">{<ErrorHint>{error}</ErrorHint>}</FacultyGate>;
  if (!result || result.status !== "ok")
    return <FacultyGate status={(result?.status as FacultyStatus) ?? "error"} />;

  return (
    <AppShell
      role="faculty"
      title="Interventions"
      {...(result.faculty.collegeName
        ? { eyebrow: result.faculty.collegeName }
        : {})}
    >
      <section className="mb-8">
        <h2 className="mb-1 text-lg font-bold">Recommend a program</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Recommends an existing SkillBridge industry program to a student in
          your scope by creating their learning enrollment — the same record the
          student's own skill-development flow uses. Private support notes live
          on each student's detail page.
        </p>

        {result.students.length === 0 || result.programs.length === 0 ? (
          <EmptyHint>
            {result.students.length === 0
              ? "No students are currently assigned to you."
              : "No industry programs are available in the catalogue yet."}
          </EmptyHint>
        ) : (
          <form
            onSubmit={submitRecommendation}
            className="max-w-xl space-y-4 rounded-xl border bg-card p-5"
          >
            <div className="space-y-2">
              <Label htmlFor="intervention-student">Student</Label>
              <select
                id="intervention-student"
                value={studentId}
                onChange={(event) => setStudentId(event.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select a student…</option>
                {result.students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="intervention-program">Industry program</Label>
              <select
                id="intervention-program"
                value={programId}
                onChange={(event) => setProgramId(event.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select a program…</option>
                {result.programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.title} — {program.company}
                  </option>
                ))}
              </select>
            </div>
            {message ? (
              <p className="text-xs text-muted-foreground">{message}</p>
            ) : null}
            <Button type="submit" disabled={busy || !studentId || !programId}>
              {busy ? "Saving…" : "Recommend program"}
            </Button>
          </form>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Where interventions appear</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border bg-card p-4 text-sm">
            <div className="mb-1 flex items-center gap-2">
              <BookOpen className="size-4 text-primary" />
              <strong>Program recommendations</strong>
            </div>
            <p className="text-muted-foreground">
              Written to the student's existing LearningEnrollment, so they
              surface in the student's Skill Development page — no duplicate
              recommendation system.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-4 text-sm">
            <div className="mb-1 flex items-center gap-2">
              <Map className="size-4 text-primary" />
              <strong>Private support notes</strong>
            </div>
            <p className="text-muted-foreground">
              Stored per student on their detail page and visible only to
              faculty — never exposed to students or employers.
            </p>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
