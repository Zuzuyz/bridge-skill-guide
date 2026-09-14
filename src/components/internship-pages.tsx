import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock3,
  MapPin,
  Search,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { getInternshipById, getInternships } from "@/lib/internship-server";
import { getInternshipMatch } from "@/lib/matching-server";
import { applyToInternship } from "@/lib/application-server";

type Internship = {
  id: string;
  role: string;
  company: string;
  location: string;
  mode: string;
  duration: string;
  stipend: string;
  skills: string[];
  verified: boolean;
  description: string;
};

type MatchedSkillDetail = {
  name: string;
  score: number;
  verificationLevel: string;
  verificationLabel: string;
  evidence?: string;
};

type InternshipMatch = {
  matchPercentage: number;
  skillMatch: number;
  careerAlignment: number;
  matchedSkills: string[];
  matchedSkillsDetails?: MatchedSkillDetail[];
  weakSkills: string[];
  weakSkillsDetails?: MatchedSkillDetail[];
  missingSkills: string[];
  totalRequiredSkills: number;
};

export function InternshipsPage() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("All");

  useEffect(() => {
    async function loadInternships() {
      try {
        setLoading(true);
        setError("");

        const data = await getInternships();
        setInternships(data);
      } catch (error) {
        console.error("Failed to load internships:", error);
        setError("Unable to load internships. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadInternships();
  }, []);

  const filteredInternships = useMemo(() => {
    return internships.filter((internship) => {
      const internshipMode = internship.mode.toUpperCase().replace("-", "_");
      const selectedMode = mode.toUpperCase().replace("-", "_");

      const matchesMode = mode === "All" || internshipMode === selectedMode;
      const searchText = [internship.role, internship.company, ...internship.skills]
        .join(" ")
        .toLowerCase();
      const matchesSearch = searchText.includes(query.toLowerCase());

      return matchesMode && matchesSearch;
    });
  }, [internships, query, mode]);

  return (
    <AppShell title="Internship discovery" eyebrow="Verified opportunities">
      <div className="mb-6 flex flex-col gap-3 rounded-xl border bg-card p-4 soft-shadow sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search roles, companies, or skills"
            className="h-10 pl-9"
          />
        </div>

        <select
          value={mode}
          onChange={(event) => setMode(event.target.value)}
          className="h-10 rounded-md border bg-background px-4 text-sm font-semibold"
        >
          <option value="All">All</option>
          <option value="REMOTE">Remote</option>
          <option value="HYBRID">Hybrid</option>
          <option value="ON_SITE">On-site</option>
        </select>
      </div>

      {loading && (
        <div className="rounded-xl border bg-card p-12 text-center soft-shadow">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-muted border-t-secondary" />
          <p className="mt-4 text-sm text-muted-foreground">Loading internships...</p>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-center text-destructive">
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {!loading && !error && filteredInternships.length === 0 && (
        <div className="rounded-xl border bg-card p-12 text-center soft-shadow">
          <p className="text-muted-foreground">No internships matched your search criteria.</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {filteredInternships.map((internship) => (
          <InternshipCard key={internship.id} internship={internship} />
        ))}
      </div>
    </AppShell>
  );
}

function InternshipCard({ internship }: { internship: Internship }) {
  return (
    <article className="flex flex-col justify-between rounded-xl border bg-card p-6 soft-shadow transition-shadow hover:shadow-md">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg font-bold">{internship.role}</h3>
              {internship.verified && <BadgeCheck className="size-4 text-success" />}
            </div>
            <p className="text-sm text-muted-foreground">{internship.company}</p>
          </div>
          <span className="rounded-full bg-secondary/15 px-3 py-1 text-xs font-semibold text-secondary-foreground">
            {formatMode(internship.mode)}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <MapPin className="size-3.5" />
            <span>{internship.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock3 className="size-3.5" />
            <span>{internship.duration}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <WalletCards className="size-3.5" />
            <span>{internship.stipend}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {internship.skills.slice(0, 4).map((skill) => (
            <span key={skill} className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium">
              {skill}
            </span>
          ))}
          {internship.skills.length > 4 && (
            <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              +{internship.skills.length - 4} more
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-end border-t pt-5">
        <Button asChild className="rounded-full">
          <Link to="/internships/$id" params={{ id: internship.id }}>
            View details
          </Link>
        </Button>
      </div>
    </article>
  );
}

export function InternshipDetail({ id }: { id: string }) {
  const navigate = useNavigate();
  const [internship, setInternship] = useState<Internship | null>(null);
  const [match, setMatch] = useState<InternshipMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applicationStatus, setApplicationStatus] = useState<"idle" | "loading" | "done">("idle");
  const [applicationMessage, setApplicationMessage] = useState("");

  useEffect(() => {
    async function loadDetails() {
      try {
        setLoading(true);
        setError("");

        const internshipData = await getInternshipById({ data: id });
        const matchData = await getInternshipMatch({ data: id });

        setInternship(internshipData);
        setMatch(matchData as any);
      } catch (error) {
        console.error("Failed to load internship:", error);
        setError("This internship could not be loaded.");
      } finally {
        setLoading(false);
      }
    }

    loadDetails();
  }, [id]);

  if (loading) {
    return (
      <AppShell title="Loading internship...">
        <div className="rounded-xl border bg-card p-12 text-center soft-shadow">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-muted border-t-secondary" />
          <p className="mt-4 text-sm text-muted-foreground">Loading opportunity details...</p>
        </div>
      </AppShell>
    );
  }

  if (!internship || error) {
    return (
      <AppShell title="Internship not found">
        <div className="rounded-xl border bg-card p-12 text-center soft-shadow">
          <h2 className="text-xl font-bold">This opportunity is unavailable.</h2>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button asChild className="mt-5 rounded-full">
            <Link to="/internships">Browse internships</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  async function handleApply() {
    if (!internship || applicationStatus !== "idle") return;

    try {
      setApplicationStatus("loading");
      setApplicationMessage("");

      const result = await applyToInternship({ data: internship.id });

      if (result.alreadyApplied) {
        setApplicationMessage("You have already applied to this internship.");
      } else {
        setApplicationMessage("Your application has been saved successfully.");
      }
      setApplicationStatus("done");
    } catch (error) {
      console.error("Application failed:", error);
      setApplicationMessage("Unable to submit your application. Please try again.");
      setApplicationStatus("idle");
    }
  }

  return (
    <AppShell
      title={internship.role}
      eyebrow="Internship opportunity"
      actions={
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => navigate({ to: "/internships" })}
        >
          <ArrowLeft className="size-4 mr-1" />
          Back
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
        <article className="rounded-xl border bg-card p-7 soft-shadow">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-secondary font-display text-xl font-bold text-secondary-foreground">
              {internship.company.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{internship.role}</h2>
                {internship.verified && <BadgeCheck className="size-5 text-success" />}
              </div>
              <p className="text-muted-foreground">{internship.company} • Verified partner</p>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-4 rounded-xl bg-muted p-5 md:grid-cols-4">
            <InfoItem icon={<MapPin />} value={internship.location} />
            <InfoItem icon={<Building2 />} value={formatMode(internship.mode)} />
            <InfoItem icon={<Clock3 />} value={internship.duration} />
            <InfoItem icon={<WalletCards />} value={internship.stipend} />
          </div>

          <h3 className="mt-8 text-lg font-bold">About this internship</h3>
          <p className="mt-3 leading-7 text-muted-foreground">{internship.description}</p>

          <h3 className="mt-7 text-lg font-bold">Required skills</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {internship.skills.map((skill) => (
              <span key={skill} className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">
                {skill}
              </span>
            ))}
          </div>

          <h3 className="mt-7 text-lg font-bold">What you’ll work on</h3>
          <ul className="mt-3 space-y-3 text-sm text-muted-foreground">
            {[
              "Build and evaluate production-ready technical features",
              "Collaborate with engineering and product mentors",
              "Document experiments and present measurable outcomes",
            ].map((text) => (
              <li key={text} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                {text}
              </li>
            ))}
          </ul>
        </article>

        <aside className="h-fit rounded-xl border bg-card p-6 soft-shadow">
          <div className="text-center">
            <span className="text-xs font-bold uppercase text-success">Your opportunity</span>
            <strong className="mt-1 block font-display text-2xl">{internship.role}</strong>
          </div>

          {match && (
            <div className="mt-6 rounded-xl border bg-muted p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Evidence-backed skill match</span>
                <span className="text-2xl font-bold text-success">{match.matchPercentage}%</span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-background">
                <div
                  className="h-full rounded-full bg-success transition-all"
                  style={{ width: `${match.matchPercentage}%` }}
                />
              </div>

              {/* Match explanations with evidence */}
              <div className="mt-4 space-y-4">
                {match.matchedSkillsDetails && match.matchedSkillsDetails.length > 0 ? (
                  <div>
                    <p className="text-xs font-bold uppercase text-success">Why you match ({match.matchedSkillsDetails.length})</p>
                    <div className="mt-2 space-y-2">
                      {match.matchedSkillsDetails.map((s) => (
                        <div key={s.name} className="flex flex-col rounded-lg border border-success/20 bg-success/10 p-2.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-success-foreground">✓ {s.name} ({s.score}%)</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-success/20 text-success font-medium">
                              {s.verificationLabel}
                            </span>
                          </div>
                          {s.evidence && (
                            <p className="mt-1 text-[11px] text-muted-foreground italic line-clamp-2">
                              "{s.evidence}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : match.matchedSkills.length > 0 && (
                  <SkillGroup title="Strong match" skills={match.matchedSkills} variant="success" icon="✓" />
                )}

                {match.weakSkillsDetails && match.weakSkillsDetails.length > 0 ? (
                  <div>
                    <p className="text-xs font-bold uppercase text-yellow-600">Needs improvement ({match.weakSkillsDetails.length})</p>
                    <div className="mt-2 space-y-2">
                      {match.weakSkillsDetails.map((s) => (
                        <div key={s.name} className="flex flex-col rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-2.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-yellow-800">⚠ {s.name} ({s.score}%)</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-800">
                              {s.verificationLabel}
                            </span>
                          </div>
                          <p className="mt-1 text-[10px] text-yellow-700">Needs assessment or practical project.</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : match.weakSkills.length > 0 && (
                  <SkillGroup title="Needs improvement" skills={match.weakSkills} variant="warning" icon="⚠" />
                )}

                {match.missingSkills.length > 0 && (
                  <SkillGroup title="Missing skills" skills={match.missingSkills} variant="danger" icon="✕" />
                )}
              </div>
            </div>
          )}

          <div className="mt-6">
            <p className="text-xs font-bold uppercase text-muted-foreground">Required skills</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {internship.skills.map((skill) => (
                <span key={skill} className="rounded-full bg-success/15 px-3 py-1 text-xs font-bold">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <Button
            onClick={handleApply}
            className="mt-7 h-12 w-full rounded-full"
            disabled={applicationStatus !== "idle"}
          >
            {applicationStatus === "loading"
              ? "Submitting application..."
              : applicationStatus === "done"
                ? "Application submitted"
                : "Apply now"}
          </Button>

          {applicationMessage && (
            <div className="mt-4 rounded-lg bg-success/10 p-3 text-center text-sm text-success-foreground">
              {applicationMessage}
            </div>
          )}

          {applicationStatus === "done" && (
            <Button asChild variant="outline" className="mt-3 w-full rounded-full">
              <Link to="/student/applications">Track application</Link>
            </Button>
          )}
        </aside>
      </div>
    </AppShell>
  );
}

function InfoItem({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div>
      <div className="mb-2 size-4 text-secondary">{icon}</div>
      <strong className="text-sm">{value}</strong>
    </div>
  );
}

function SkillGroup({
  title,
  skills,
  variant,
  icon,
}: {
  title: string;
  skills: string[];
  variant: "success" | "warning" | "danger";
  icon: string;
}) {
  const styles = {
    success: "bg-success/15 text-success-foreground",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-destructive/10 text-destructive",
  };

  const titleStyles = {
    success: "text-success",
    warning: "text-yellow-600",
    danger: "text-destructive",
  };

  return (
    <div className="mt-5">
      <p className={`text-xs font-bold uppercase ${titleStyles[variant]}`}>{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span
            key={skill}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[variant]}`}
          >
            {icon} {skill}
          </span>
        ))}
      </div>
    </div>
  );
}

function formatMode(mode: string) {
  switch (mode) {
    case "REMOTE":
      return "Remote";
    case "HYBRID":
      return "Hybrid";
    case "ON_SITE":
      return "On-site";
    default:
      return mode;
  }
}
