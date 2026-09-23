import { useEffect, useMemo, useState } from "react";
import {
  Award,
  CheckCircle2,
  ExternalLink,
  FolderGit2,
  Loader2,
  Plus,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ProjectSubmissionForm } from "@/components/project-submission-form";
import { Button } from "@/components/ui/button";
import {
  getStudentProjectSubmissions,
  type ProjectSubmissionItem,
} from "@/lib/project-server";

type ProjectStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "REJECTED";

const statusConfig: Record<
  ProjectStatus,
  {
    label: string;
    className: string;
  }
> = {
  SUBMITTED: {
    label: "Submitted",
    className:
      "border-sky-500/30 bg-sky-500/10 text-sky-300",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-300",
  },
  VERIFIED: {
    label: "Verified",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  },
  REJECTED: {
    label: "Rejected",
    className:
      "border-rose-500/30 bg-rose-500/10 text-rose-300",
  },
};

export function StudentProjectsPage() {
  const [projects, setProjects] = useState<ProjectSubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isProjectModalOpen, setIsProjectModalOpen] =
    useState(false);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const result =
        await getStudentProjectSubmissions();

      setProjects(result.submissions);
    } catch (err) {
      console.error(
        "Failed to load projects:",
        err,
      );

      setError(
        "Unable to load your projects right now.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const stats = useMemo(() => {
    return {
      total: projects.length,
      verified: projects.filter(
        (project) =>
          project.status === "VERIFIED",
      ).length,
      pending: projects.filter(
        (project) =>
          project.status === "SUBMITTED" ||
          project.status === "UNDER_REVIEW",
      ).length,
      rejected: projects.filter(
        (project) =>
          project.status === "REJECTED",
      ).length,
    };
  }, [projects]);

  return (
    <AppShell
      eyebrow="Portfolio & practical evidence"
      title="My Projects"
      actions={
        <Button
          className="rounded-full"
          onClick={() => setIsProjectModalOpen(true)}
        >
          <Plus className="mr-2 size-4" />
          Submit Project
        </Button>
      }
    >
      <div className="space-y-6">
        {/* =====================================================
            INTRO
        ===================================================== */}

        <section className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-950/40 via-slate-950/80 to-cyan-950/30 p-7 shadow-2xl">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-300">
              <FolderGit2 className="size-4" />
              Practical experience
            </div>

            <h2 className="mt-3 text-3xl font-bold text-white">
              Build proof, not just claims.
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              Track the projects you have submitted as
              practical evidence of your skills. Verified
              projects can strengthen your SkillBridge
              profile and skill evidence.
            </p>
          </div>
        </section>

        {/* =====================================================
            STATS
        ===================================================== */}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<FolderGit2 className="size-5" />}
            label="Total Projects"
            value={stats.total}
          />

          <StatCard
            icon={<ShieldCheck className="size-5" />}
            label="Verified"
            value={stats.verified}
          />

          <StatCard
            icon={<Loader2 className="size-5" />}
            label="Pending Review"
            value={stats.pending}
          />

          <StatCard
            icon={<XCircle className="size-5" />}
            label="Rejected"
            value={stats.rejected}
          />
        </section>

        {/* =====================================================
            LOADING
        ===================================================== */}

        {loading && (
          <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-14 text-center">
            <Loader2 className="mx-auto size-8 animate-spin text-cyan-400" />

            <p className="mt-4 text-sm text-slate-400">
              Loading your projects...
            </p>
          </div>
        )}

        {/* =====================================================
            ERROR
        ===================================================== */}

        {!loading && error && (
          <div className="rounded-3xl border border-rose-500/20 bg-rose-950/20 p-10 text-center">
            <XCircle className="mx-auto size-10 text-rose-400" />

            <h3 className="mt-4 text-lg font-bold text-white">
              Projects could not be loaded
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              {error}
            </p>
          </div>
        )}

        {/* =====================================================
            EMPTY
        ===================================================== */}

        {!loading &&
          !error &&
          projects.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-14 text-center">
              <FolderGit2 className="mx-auto size-14 text-slate-600" />

              <h3 className="mt-5 text-xl font-bold text-white">
                No projects submitted yet
              </h3>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-400">
                Submit a real project, repository, or live
                application through the Skill Verification
                system. Your project will remain pending
                until it is reviewed.
              </p>

              <Button
                className="mt-6 rounded-full"
                onClick={() => setIsProjectModalOpen(true)}
              >
                <Plus className="mr-2 size-4" />
                Submit Project Evidence
              </Button>
            </div>
          )}

        {/* =====================================================
            PROJECT GRID
        ===================================================== */}

        {!loading &&
          !error &&
          projects.length > 0 && (
            <section className="grid gap-5 lg:grid-cols-2">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                />
              ))}
            </section>
          )}

        {/* =====================================================
            PROJECT EVIDENCE SUBMISSION MODAL
        ===================================================== */}

        {isProjectModalOpen && (
          <ProjectSubmissionForm
            onClose={() => setIsProjectModalOpen(false)}
            onSubmitted={() => {
              setIsProjectModalOpen(false);
              void loadProjects();
            }}
          />
        )}
      </div>
    </AppShell>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 backdrop-blur-xl">
      <div className="flex items-center gap-3 text-cyan-300">
        {icon}

        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {label}
        </span>
      </div>

      <div className="mt-3 text-3xl font-bold text-white">
        {value}
      </div>
    </div>
  );
}

function ProjectCard({
  project,
}: {
  project: ProjectSubmissionItem;
}) {
  const status =
    statusConfig[project.status];

  return (
    <article className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 backdrop-blur-xl transition hover:border-purple-500/30">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
              {project.skillName}
            </span>

            {project.status === "VERIFIED" && (
              <ShieldCheck className="size-4 text-emerald-400" />
            )}
          </div>

          <h3 className="mt-3 text-xl font-bold text-white">
            {project.title}
          </h3>
        </div>

        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-300">
        {project.description}
      </p>

      <div className="mt-5 flex flex-wrap gap-3 border-t border-white/10 pt-5">
        {project.repoUrl && (
          <a
            href={project.repoUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-sky-300 hover:bg-white/10"
          >
            <FolderGit2 className="size-3.5" />
            Repository
            <ExternalLink className="size-3" />
          </a>
        )}

        {project.projectUrl && (
          <a
            href={project.projectUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-white/10"
          >
            Live Demo
            <ExternalLink className="size-3" />
          </a>
        )}
      </div>

      {project.status === "VERIFIED" &&
        project.score !== null && (
          <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
                <Award className="size-4" />
                Verification Score
              </span>

              <strong className="text-2xl text-emerald-300">
                {project.score}%
              </strong>
            </div>
          </div>
        )}

      {project.reviewerNotes && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Reviewer feedback
          </p>

          <p className="mt-2 text-sm leading-5 text-slate-300">
            {project.reviewerNotes}
          </p>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
        <span>
          Submitted{" "}
          {new Date(
            project.submittedAt,
          ).toLocaleDateString()}
        </span>

        {project.verifiedAt && (
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="size-3.5" />
            Verified{" "}
            {new Date(
              project.verifiedAt,
            ).toLocaleDateString()}
          </span>
        )}
      </div>
    </article>
  );
}
