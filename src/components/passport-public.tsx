import { Link } from "@tanstack/react-router";
import {
  Award,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  FileCheck,
  FileText,
  GraduationCap,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { useEffect, useState } from "react";
import { CosmicParticles } from "@/components/ui/cosmic-particles";
import { VerificationBadge } from "@/components/student-pages";
import { getPublicPassport } from "@/lib/passport-server";
import type { PublicSkillPassportData } from "@/types";

/* =========================================================
   PHASE 11 — PUBLIC SKILL PASSPORT VIEW
   ---------------------------------------------------------
   Renders ONLY the privacy-limited payload returned by
   getPublicPassport. No email, no internal IDs, no private
   assessment details, no reviewer notes.
   ========================================================= */

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-white/10 bg-[#0c0919]/85 backdrop-blur-xl p-6 shadow-2xl shadow-black/50 text-slate-100 ${className}`}
    >
      {children}
    </div>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-400">
      {children}
    </p>
  );
}

export function PublicPassportView({ token }: { token: string }) {
  const [data, setData] = useState<PublicSkillPassportData | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "not_found" | "private" | "error">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setStatus("loading");
        const result = await getPublicPassport({ data: { token } });

        if (!mounted) return;

        if (result.status === "ok") {
          setData(result.data);
          setStatus("ok");
        } else {
          setStatus(result.status);
        }
      } catch (err) {
        if (mounted) {
          setErrorMessage(err instanceof Error ? err.message : "Unable to load this passport.");
          setStatus("error");
        }
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [token]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#070510] text-slate-100">
      <CosmicParticles className="opacity-25" particleCount={50} />

      <div className="relative mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {/* Header / Brand */}
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white transition">
            <Sparkles className="h-4 w-4 text-amber-400" />
            SkillBridge
          </Link>
          <span className="flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold text-amber-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified Public Credential
          </span>
        </div>

        {status === "loading" && (
          <div className="flex min-h-[420px] items-center justify-center">
            <div className="flex items-center gap-3 text-amber-300">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-sm font-medium">Loading skill passport…</span>
            </div>
          </div>
        )}

        {status === "not_found" && (
          <GlassCard className="text-center">
            <FileCheck className="mx-auto h-10 w-10 text-slate-500" />
            <h1 className="mt-4 text-xl font-bold text-white">Passport not found</h1>
            <p className="mt-2 text-sm text-slate-400">
              This passport link is invalid or has been revoked by its owner.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300 transition"
            >
              Explore SkillBridge
            </Link>
          </GlassCard>
        )}

        {status === "private" && (
          <GlassCard className="text-center">
            <Lock className="mx-auto h-10 w-10 text-slate-500" />
            <h1 className="mt-4 text-xl font-bold text-white">This passport is private</h1>
            <p className="mt-2 text-sm text-slate-400">
              The owner has disabled public sharing, so its contents cannot be displayed.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300 transition"
            >
              Explore SkillBridge
            </Link>
          </GlassCard>
        )}

        {status === "error" && (
          <GlassCard className="text-center">
            <p className="font-semibold text-white">Something went wrong</p>
            <p className="mt-2 text-sm text-rose-300/80">{errorMessage}</p>
          </GlassCard>
        )}

        {status === "ok" && data && (
          <div className="space-y-6">
            {/* Identity Card */}
            <GlassCard className="border-amber-500/20 bg-gradient-to-br from-white/[0.04] to-amber-500/[0.04]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 font-serif text-2xl font-bold text-slate-950 shadow-lg shadow-amber-950/50">
                    {data.studentName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">{data.studentName}</h1>
                    <p className="mt-0.5 text-xs text-slate-300">
                      {data.college ? `${data.college} • ` : ""}
                      {data.targetRole ? (
                        <span className="font-semibold text-amber-300">{data.targetRole}</span>
                      ) : (
                        <span className="text-slate-400">No career preference selected yet.</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-center sm:text-right">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    Placement Readiness
                  </span>
                  <p className="mt-1 text-3xl font-serif font-bold text-emerald-300">
                    {data.readiness}%
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* Evidence Summary */}
            <div className="grid grid-cols-2 gap-3.5 md:grid-cols-5">
              <div className="rounded-2xl border border-sky-500/30 bg-sky-950/15 p-4 text-center">
                <FileCheck className="mx-auto h-5 w-5 text-sky-400" />
                <p className="mt-2 font-mono text-2xl font-bold text-sky-300">
                  {data.evidenceSummary.resumeDetected}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-slate-300">Resume Detected</p>
              </div>
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/15 p-4 text-center">
                <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-400" />
                <p className="mt-2 font-mono text-2xl font-bold text-emerald-300">
                  {data.evidenceSummary.assessmentVerified}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-slate-300">Assessment Verified</p>
              </div>
              <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/15 p-4 text-center">
                <Trophy className="mx-auto h-5 w-5 text-indigo-400" />
                <p className="mt-2 font-mono text-2xl font-bold text-indigo-300">
                  {data.evidenceSummary.projectVerified}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-slate-300">Project Verified</p>
              </div>
              <div className="rounded-2xl border border-purple-500/30 bg-purple-950/15 p-4 text-center">
                <ShieldCheck className="mx-auto h-5 w-5 text-purple-400" />
                <p className="mt-2 font-mono text-2xl font-bold text-purple-300">
                  {data.evidenceSummary.institutionVerified}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-slate-300">Institution Verified</p>
              </div>
              <div className="col-span-2 rounded-2xl border border-amber-500/30 bg-amber-950/15 p-4 text-center md:col-span-1">
                <Award className="mx-auto h-5 w-5 text-amber-400" />
                <p className="mt-2 font-mono text-2xl font-bold text-amber-300">
                  {data.evidenceSummary.employerVerified}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-slate-300">Employer Verified</p>
              </div>
            </div>

            {/* Skills */}
            <GlassCard>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white">Verified Skills</h2>
              </div>

              {data.skills.length === 0 ? (
                <EmptyNote>No verified skills yet.</EmptyNote>
              ) : (
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {data.skills.map((skill) => (
                    <div
                      key={skill.name}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-white">{skill.name}</h3>
                          {skill.category && (
                            <p className="text-[11px] text-slate-400">{skill.category}</p>
                          )}
                        </div>
                        <span className="font-mono text-lg font-bold text-amber-300">
                          {skill.score}%
                        </span>
                      </div>
                      <div className="mt-3">
                        <VerificationBadge level={skill.verificationLevel} label={skill.verificationLabel} size="sm" />
                      </div>
                      {skill.evidence && (
                        <p className="mt-3 line-clamp-2 rounded-xl border border-white/5 bg-black/20 p-2.5 text-[11px] text-slate-300/80">
                          “{skill.evidence}”
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* Verified Projects */}
            <GlassCard>
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-indigo-400" />
                <h2 className="text-lg font-bold text-white">Verified Projects</h2>
              </div>

              {data.verifiedProjects.length === 0 ? (
                <EmptyNote>No verified projects yet.</EmptyNote>
              ) : (
                <div className="mt-5 space-y-3">
                  {data.verifiedProjects.map((project) => (
                    <div
                      key={project.title}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-white">{project.title}</h3>
                          <p className="text-[11px] text-slate-400">
                            Skill: {project.skillName}
                            {project.verifiedAt
                              ? ` • Verified ${formatDate(project.verifiedAt)}`
                              : ""}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {project.repoUrl && (
                            <a
                              href={project.repoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-300 hover:text-white transition"
                            >
                              Repository <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          {project.projectUrl && (
                            <a
                              href={project.projectUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-full border border-indigo-400/30 bg-indigo-400/10 px-3 py-1 text-[11px] font-semibold text-indigo-300 hover:text-indigo-200 transition"
                            >
                              Live <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs text-slate-300/80">
                        {project.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* Passed Assessments */}
            <GlassCard>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-white">Passed Assessments</h2>
              </div>

              {data.passedAssessments.length === 0 ? (
                <EmptyNote>No assessment results available.</EmptyNote>
              ) : (
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {data.passedAssessments.map((assessment) => (
                    <div
                      key={assessment.title}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div>
                        <h3 className="text-sm font-bold text-white">{assessment.title}</h3>
                        <p className="text-[11px] text-slate-400">
                          {assessment.category}
                          {assessment.completedAt
                            ? ` • ${formatDate(assessment.completedAt)}`
                            : ""}
                        </p>
                      </div>
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 font-mono text-xs font-bold text-emerald-300">
                        {assessment.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* Credentials */}
            <GlassCard>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white">Credentials & Achievements</h2>
              </div>

              {data.credentials.length === 0 ? (
                <EmptyNote>No credentials added yet.</EmptyNote>
              ) : (
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {data.credentials.map((credential) => (
                    <div
                      key={credential.title}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold text-white">{credential.title}</h3>
                        {credential.score != null && (
                          <span className="font-mono text-sm font-bold text-amber-300">
                            {credential.score}%
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {credential.issuer} • {formatDate(credential.issuedAt)}
                      </p>
                      {credential.skills.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {credential.skills.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-slate-300"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                      {credential.url && (
                        <a
                          href={credential.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 hover:text-amber-200"
                        >
                          View credential <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* Career Direction */}
            <GlassCard>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-pink-400" />
                <h2 className="text-lg font-bold text-white">Career Direction</h2>
              </div>

              {data.careers.length === 0 ? (
                <EmptyNote>No career preference selected yet.</EmptyNote>
              ) : (
                <div className="mt-5 flex flex-wrap gap-2.5">
                  {data.careers.map((career) => (
                    <span
                      key={career.title}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold ${
                        career.isPrimary
                          ? "border-pink-400/40 bg-pink-400/15 text-pink-200"
                          : "border-white/15 bg-white/5 text-slate-300"
                      }`}
                    >
                      <Briefcase className="h-3.5 w-3.5" />
                      {career.title}
                      {career.isPrimary && (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-pink-300/80">
                          Primary
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* Footer */}
            <div className="flex flex-col items-center gap-2 pb-6 text-center">
              <GraduationCap className="h-5 w-5 text-slate-500" />
              <p className="text-[11px] text-slate-500">
                Issued by SkillBridge • Evidence verified on {formatDate(data.generatedAt)}
              </p>
              <Link
                to="/"
                className="text-[11px] font-semibold text-amber-300/80 hover:text-amber-300"
              >
                Build your own verified Skill Passport →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
