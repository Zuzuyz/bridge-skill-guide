import { Link } from "@tanstack/react-router";
import {
  BriefcaseBusiness,
  CalendarDays,
  CircleGauge,
  ClipboardCheck,
  ExternalLink,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/metrics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createEmployerOpportunity,
  getCandidateMatch,
  getEmployerApplications,
  getEmployerCandidate,
  getEmployerCandidates,
  getEmployerCompany,
  getEmployerDashboard,
  getEmployerOpportunities,
  getEmployerOutcomes,
  getSkillCatalogue,
  updateApplicationStatus,
  updateEmployerCompany,
  updateEmployerOpportunityStatus,
} from "@/lib/employer-server";

/* =========================================================
   PHASE 12 — EMPLOYER / COMPANY PORTAL (UI)
   All data comes from employer-server.ts (Prisma/PostgreSQL).
   Honest loading / empty / error states throughout.
========================================================= */

const STATUS_LABELS: Record<string, string> = {
  APPLIED: "Applied",
  UNDER_REVIEW: "Under Review",
  SHORTLISTED: "Shortlisted",
  INTERVIEW: "Interview",
  SELECTED: "Selected",
  REJECTED: "Rejected",
};

const STATUS_STYLES: Record<string, string> = {
  APPLIED: "border-white/15 bg-white/5 text-slate-300",
  UNDER_REVIEW: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
  SHORTLISTED: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  INTERVIEW: "border-violet-400/30 bg-violet-400/10 text-violet-200",
  SELECTED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  REJECTED: "border-rose-400/30 bg-rose-400/10 text-rose-200",
};

const MODE_LABELS: Record<string, string> = {
  REMOTE: "Remote",
  HYBRID: "Hybrid",
  ON_SITE: "On-site",
};

function EmployerLoader({ label }: { label: string }) {
  return (
    <AppShell role="company">
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-amber-200">
          <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
          <span className="text-sm font-medium">{label}</span>
        </div>
      </div>
    </AppShell>
  );
}

function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-10 text-center">
      <p className="text-sm font-bold text-slate-200">{title}</p>
      {hint ? <p className="mt-2 text-xs text-slate-400">{hint}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-6 text-center">
      <p className="text-sm font-bold text-rose-200">{message}</p>
    </div>
  );
}

/* =========================================================
   DASHBOARD — real counts from PostgreSQL
========================================================= */

export function EmployerDashboard() {
  const [data, setData] = useState<Awaited<
    ReturnType<typeof getEmployerDashboard>
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const result = await getEmployerDashboard();
        if (mounted) setData(result);
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error ? err.message : "Unable to load company profile.",
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
    return <EmployerLoader label="Loading your hiring intelligence..." />;
  }

  if (error) {
    return (
      <AppShell role="company" title="Talent intelligence overview" eyebrow="Employer portal">
        <ErrorState message={error} />
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell role="company" title="Talent intelligence overview" eyebrow="Employer portal">
        <EmptyState title="No company profile yet." hint="Create your company profile to start posting opportunities and reviewing candidates."
          action={
            <Button asChild className="rounded-full">
              <Link to="/company/profile">Create company profile</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  const noCompany = !data.company;

  return (
    <AppShell
      role="company"
      title="Talent intelligence overview"
      eyebrow={data.company?.name ?? "Employer portal"}
    >
      {noCompany ? (
        <EmptyState
          title="No company profile yet."
          hint="Create your company profile to start posting opportunities and reviewing candidates."
          action={
            <Button asChild className="rounded-full">
              <Link to="/company/profile">Create company profile</Link>
            </Button>
          }
        />
      ) : data.company ? (
        <>
          {!data.company.verified && (
            <p className="mb-5 rounded-lg border border-amber-400/25 bg-amber-400/10 p-3 text-xs font-medium text-amber-200">
              Your company is not yet verified by SkillBridge. Opportunities you post will be
              marked unverified until an admin approves them.
            </p>
          )}
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Active opportunities"
              value={String(data.activeOpportunities)}
              detail={
                data.activeOpportunities === 0
                  ? "Post your first opportunity"
                  : "Currently open for applications"
              }
              icon={<BriefcaseBusiness className="size-4" />}
            />
            <StatCard
              label="Total applications"
              value={String(data.totalApplications)}
              detail="All time, all opportunities"
              icon={<Users className="size-4" />}
            />
            <StatCard
              label="Candidates under review"
              value={String(data.underReview)}
              detail={`${data.shortlisted} shortlisted • ${data.interviews} interviews`}
              icon={<CircleGauge className="size-4" />}
            />
            <StatCard
              label="Selected"
              value={String(data.selected)}
              detail={data.rejected > 0 ? `${data.rejected} rejected` : "No rejections yet"}
              icon={<ClipboardCheck className="size-4" />}
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
            <section className="rounded-xl border bg-card p-6 soft-shadow">
              <h2 className="text-xl font-bold">Recent applications</h2>
              {data.recentApplications.length === 0 ? (
                <div className="mt-5">
                  <EmptyState
                    title="No applications yet."
                    hint="Applications will appear here when students apply to your opportunities."
                  />
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {data.recentApplications.map((application) => (
                    <Link
                      key={application.id}
                      to="/company/applications"
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted p-4 transition hover:bg-accent/40"
                    >
                      <div>
                        <strong>{application.candidateName}</strong>
                        <p className="text-xs text-muted-foreground">{application.role}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold">
                          {STATUS_LABELS[application.status] ?? application.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-xl border bg-card p-6 soft-shadow">
              <h2 className="text-xl font-bold">Hiring funnel</h2>
              {data.totalApplications === 0 ? (
                <p className="mt-5 text-sm text-muted-foreground">
                  No applications yet. The funnel appears once applications arrive.
                </p>
              ) : (
                <div className="mt-6 space-y-5">
                  {(
                    [
                      ["Applied", data.totalApplications],
                      ["Under review", data.underReview],
                      ["Shortlisted", data.shortlisted],
                      ["Interview", data.interviews],
                      ["Selected", data.selected],
                    ] as Array<[string, number]>
                  ).map(([label, value]) => (
                    <div key={label}>
                      <div className="mb-2 flex justify-between text-sm">
                        <span>{label}</span>
                        <strong>{value}</strong>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-secondary"
                          style={{
                            width: `${Math.round((value / data.totalApplications) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      ) : null}
    </AppShell>
  );
}

/* =========================================================
   COMPANY PROFILE
========================================================= */

export function CompanyProfilePage() {
  const [data, setData] = useState<Awaited<
    ReturnType<typeof getEmployerCompany>
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    industry: "",
    description: "",
    website: "",
    location: "",
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const result = await getEmployerCompany();

        if (mounted && result) {
          setData(result);
          setForm({
            name: result.name,
            industry: result.industry ?? "",
            description: result.description ?? "",
            website: result.website ?? "",
            location: result.location ?? "",
          });
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error ? err.message : "Unable to load company profile.",
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    setFormError("");

    try {
      const updated = await updateEmployerCompany({
        data: {
          name: form.name,
        industry: form.industry || undefined,
        description: form.description || undefined,        website: form.website || undefined,
          location: form.location || undefined,
        },
      });
      setData(updated);
      setNotice("Company profile saved.");
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Unable to update company profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <EmployerLoader label="Loading company profile..." />;
  }

  return (
    <AppShell role="company" title="Company profile" eyebrow="Employer portal">
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="max-w-3xl space-y-5 rounded-xl border bg-card p-6 soft-shadow"
      >
        {notice && (
          <p className="rounded-lg bg-success/15 p-3 text-sm font-bold text-success-foreground">
            {notice}
          </p>
        )}
        {formError && <ErrorState message={formError} />}
        {data?.verified && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-400/25 bg-emerald-400/10 p-3 text-xs font-bold text-emerald-200">
            <ShieldCheck className="size-4" />
            Verified company
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="company-name">Company name *</Label>
            <Input
              id="company-name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Acme Robotics"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-industry">Industry</Label>
            <Input
              id="company-industry"
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
              placeholder="AI & Robotics"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-website">Website</Label>
            <Input
              id="company-website"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-location">Location</Label>
            <Input
              id="company-location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Bengaluru, India"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="company-description">Description</Label>
            <Textarea
              id="company-description"
              rows={5}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What your company does, mission, products, culture..."
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving} className="rounded-full">
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {saving ? "Saving..." : "Save profile"}
          </Button>
          {data && !data.verified && (
            <p className="text-xs text-muted-foreground">
              Verification is handled by SkillBridge admins.
            </p>
          )}
        </div>
      </form>
    </AppShell>
  );
}

/* =========================================================
   OPPORTUNITIES (Jobs & Internships)
========================================================= */

type CatalogueSkill = { id: string; name: string; demand: string | null };

export function CompanyInternshipsPage() {
  const [opportunities, setOpportunities] = useState<Awaited<
    ReturnType<typeof getEmployerOpportunities>
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [catalogue, setCatalogue] = useState<CatalogueSkill[]>([]);
  const [catalogueLoading, setCatalogueLoading] = useState(false);
  const [skillSearch, setSkillSearch] = useState("");
  const [form, setForm] = useState({
    role: "",
    description: "",
    location: "",
    mode: "REMOTE" as "REMOTE" | "HYBRID" | "ON_SITE",
    duration: "",
    stipend: "",
    openings: "",
    deadline: "",
    requiredSkills: [] as string[],
    preferredSkills: [] as string[],
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");
  const [statusToggling, setStatusToggling] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const result = await getEmployerOpportunities();
        if (mounted) setOpportunities(result);
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error ? err.message : "Unable to load opportunities.",
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

  const openForm = async () => {
    setFormOpen((open) => !open);

    if (!catalogue.length && !catalogueLoading) {
      try {
        setCatalogueLoading(true);
        const skills = await getSkillCatalogue();
        setCatalogue(skills);
      } catch {
        // The form still works; the picker shows an honest notice.
        setCatalogue([]);
      } finally {
        setCatalogueLoading(false);
      }
    }
  };

  const filteredCatalogue = useMemo(
    () =>
      catalogue.filter((skill) =>
        skill.name.toLowerCase().includes(skillSearch.toLowerCase()),
      ),
    [catalogue, skillSearch],
  );

  const toggleSkill = (
    skillId: string,
    list: "requiredSkills" | "preferredSkills",
  ) => {
    setForm((prev) => {
      const target = list === "requiredSkills"
        ? [...prev.requiredSkills]
        : [...prev.preferredSkills];
      const otherList: "requiredSkills" | "preferredSkills" =
        list === "requiredSkills" ? "preferredSkills" : "requiredSkills";
      const other =
        list === "requiredSkills"
          ? [...prev.preferredSkills]
          : [...prev.requiredSkills];

      if (target.includes(skillId)) {
        return { ...prev, [list]: target.filter((id) => id !== skillId) };
      }

      target.push(skillId);

      return {
        ...prev,
        [list]: target,
        // A skill cannot be both required and preferred.
        [otherList]: other.filter((id) => id !== skillId),
      };
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    setFormError("");

    try {
      await createEmployerOpportunity({
        data: {
          role: form.role,
        description: form.description || undefined,
        location: form.location || undefined,
        mode: form.mode,
        duration: form.duration || undefined,
        stipend: form.stipend || undefined,
        openings: form.openings ? Number(form.openings) : undefined,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
        requiredSkills: form.requiredSkills,
        preferredSkills: form.preferredSkills,
        },
      });
      setNotice(`Opportunity posted: ${form.role}`);
      setForm({
        role: "",
        description: "",
        location: "",
        mode: "REMOTE",
        duration: "",
        stipend: "",
        openings: "",
        deadline: "",
        requiredSkills: [],
        preferredSkills: [],
      });
      setFormOpen(false);
      const refreshed = await getEmployerOpportunities();
      setOpportunities(refreshed);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Unable to create opportunity. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (opportunityId: string) => {
    const opportunity = opportunities?.find((item) => item.id === opportunityId);

    if (!opportunity) {
      return;
    }

    try {
      setStatusToggling(opportunityId);
      await updateEmployerOpportunityStatus({
        data: {
          internshipId: opportunityId,
          status: opportunity.status === "ACTIVE" ? "CLOSED" : "ACTIVE",
        },
      });
      const refreshed = await getEmployerOpportunities();
      setOpportunities(refreshed);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Unable to update opportunity.",
      );
    } finally {
      setStatusToggling(null);
    }
  };

  if (loading) {
    return <EmployerLoader label="Loading opportunities..." />;
  }

  return (
    <AppShell
      role="company"
      title="Jobs & internships"
      eyebrow="Create and manage opportunities"
      actions={
        <Button className="rounded-full" onClick={() => void openForm()}>
          <Plus />
          Post opportunity
        </Button>
      }
    >
      {notice && (
        <p className="mb-5 rounded-lg bg-success/15 p-3 text-sm font-bold text-success-foreground">
          {notice}
        </p>
      )}
      {formError && !formOpen ? (
        <div className="mb-5"><ErrorState message={formError} /></div>
      ) : null}

      {formOpen && (
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="mb-6 rounded-xl border bg-card p-6 soft-shadow"
        >
          {formError && <div className="mb-4"><ErrorState message={formError} /></div>}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="opp-role">Role title *</Label>
              <Input
                id="opp-role"
                required
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="Frontend Engineering Intern"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="opp-location">Location</Label>
              <Input
                id="opp-location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Bengaluru"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="opp-mode">Work mode *</Label>
              <select
                id="opp-mode"
                value={form.mode}
                onChange={(e) =>
                  setForm({
                    ...form,
                    mode: e.target.value as "REMOTE" | "HYBRID" | "ON_SITE",
                  })
                }
                className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm"
              >
                <option value="REMOTE">Remote</option>
                <option value="HYBRID">Hybrid</option>
                <option value="ON_SITE">On-site</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="opp-duration">Duration</Label>
              <Input
                id="opp-duration"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                placeholder="6 months"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="opp-stipend">Stipend</Label>
              <Input
                id="opp-stipend"
                value={form.stipend}
                onChange={(e) => setForm({ ...form, stipend: e.target.value })}
                placeholder="₹30,000/mo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="opp-openings">Openings</Label>
              <Input
                id="opp-openings"
                type="number"
                min={1}
                value={form.openings}
                onChange={(e) => setForm({ ...form, openings: e.target.value })}
                placeholder="2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="opp-deadline">Application deadline</Label>
              <Input
                id="opp-deadline"
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="opp-description">Description</Label>
              <Textarea
                id="opp-description"
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What the intern will do, mentorship, tech stack..."
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Skill requirements</Label>
              <Input
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                placeholder="Search the SkillBridge skill catalogue..."
              />
              {catalogueLoading ? (
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" /> Loading skill catalogue...
                </p>
              ) : catalogue.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  The skill catalogue is empty. Contact admins to add skills.
                </p>
              ) : (
                <div className="max-h-52 overflow-y-auto rounded-lg border border-white/10 bg-white/5 p-3">
                  {filteredCatalogue.map((skill) => {
                    const isRequired = form.requiredSkills.includes(skill.id);
                    const isPreferred = form.preferredSkills.includes(skill.id);

                    return (
                      <div
                        key={skill.id}
                        className="flex items-center justify-between gap-2 py-1.5"
                      >
                        <span className="text-sm">{skill.name}</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => toggleSkill(skill.id, "requiredSkills")}
                            className={
                              isRequired
                                ? "rounded-full border border-amber-400/40 bg-amber-400/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-200"
                                : "rounded-full border border-white/15 px-2.5 py-0.5 text-[11px] font-bold text-slate-400 hover:border-amber-400/40"
                            }
                          >
                            Required
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleSkill(skill.id, "preferredSkills")}
                            className={
                              isPreferred
                                ? "rounded-full border border-cyan-400/40 bg-cyan-400/20 px-2.5 py-0.5 text-[11px] font-bold text-cyan-200"
                                : "rounded-full border border-white/15 px-2.5 py-0.5 text-[11px] font-bold text-slate-400 hover:border-cyan-400/40"
                            }
                          >
                            Preferred
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {filteredCatalogue.length === 0 && (
                    <p className="py-2 text-center text-xs text-muted-foreground">
                      No catalogue skills match "{skillSearch}".
                    </p>
                  )}
                </div>
              )}
              <p className="text-[11px] text-muted-foreground">
                Required and preferred skills reference the existing SkillBridge skill
                catalogue.
              </p>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <Button type="submit" disabled={saving} className="rounded-full">
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {saving ? "Publishing..." : "Publish opportunity"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => setFormOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {opportunities && opportunities.length === 0 && !formOpen ? (
        <EmptyState
          title="No opportunities yet."
          hint="Create your first job or internship to begin recruiting."
          action={
            <Button className="rounded-full" onClick={() => void openForm()}>
              <Plus />
              Post opportunity
            </Button>
          }
        />
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        {opportunities?.map((opportunity) => (
          <article
            key={opportunity.id}
            className="rounded-xl border bg-card p-6 soft-shadow"
          >
            <div className="flex justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">{opportunity.role}</h2>
                  {opportunity.status === "ACTIVE" ? (
                    <Badge className="border border-emerald-400/30 bg-emerald-400/15 text-emerald-200">
                      Active
                    </Badge>
                  ) : (
                    <Badge className="border border-white/15 bg-white/10 text-slate-400">
                      Closed
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {[
                    opportunity.location,
                    MODE_LABELS[opportunity.mode],
                    opportunity.duration,
                    opportunity.stipend,
                  ]
                    .filter(Boolean)
                    .join(" • ")}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-3xl font-bold">
                  {opportunity.applicationsCount}
                </p>
                <p className="text-xs text-muted-foreground">applications</p>
              </div>
            </div>

            {opportunity.description ? (
              <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                {opportunity.description}
              </p>
            ) : null}

            {(opportunity.requiredSkills.length > 0 ||
              opportunity.preferredSkills.length > 0) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {opportunity.requiredSkills.map((skill) => (
                  <span
                    key={skill.id}
                    className="rounded-full border border-amber-400/30 bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-200"
                  >
                    {skill.name}
                  </span>
                ))}
                {opportunity.preferredSkills.map((skill) => (
                  <span
                    key={skill.id}
                    className="rounded-full border border-cyan-400/30 bg-cyan-400/15 px-3 py-1 text-xs font-semibold text-cyan-200"
                  >
                    {skill.name} (preferred)
                  </span>
                ))}
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="size-3.5" />
                {opportunity.deadline
                  ? `Apply by ${new Date(opportunity.deadline).toLocaleDateString()}`
                  : "No deadline set"}
                {opportunity.openings ? ` • ${opportunity.openings} openings` : ""}
              </p>
              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline" className="rounded-full">
                  <Link to="/company/applications">View applications</Link>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full"
                  disabled={statusToggling === opportunity.id}
                  onClick={() => void handleToggleStatus(opportunity.id)}
                >
                  {statusToggling === opportunity.id
                    ? "Saving..."
                    : opportunity.status === "ACTIVE"
                      ? "Close"
                      : "Reopen"}
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}

/* =========================================================
   APPLICATIONS
========================================================= */

export function CompanyApplicationsPage() {
  const [applications, setApplications] = useState<Awaited<
    ReturnType<typeof getEmployerApplications>
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const result = await getEmployerApplications();
        if (mounted) setApplications(result);
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error ? err.message : "Unable to load applications.",
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

  const handleStatusChange = async (applicationId: string, status: string) => {
    try {
      setUpdatingId(applicationId);
      await updateApplicationStatus({
        data: {
          applicationId,
          status: status as
            | "APPLIED"
            | "UNDER_REVIEW"
            | "SHORTLISTED"
            | "INTERVIEW"
            | "SELECTED"
            | "REJECTED",
        },
      });
      const refreshed = await getEmployerApplications();
      setApplications(refreshed);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update application status.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = (applications ?? []).filter(
    (application) =>
      statusFilter === "ALL" || application.status === statusFilter,
  );

  if (loading) {
    return <EmployerLoader label="Loading applications..." />;
  }

  return (
    <AppShell
      role="company"
      title="Applications"
      eyebrow="Review and progress candidates"
    >
      {error && <div className="mb-5"><ErrorState message={error} /></div>}

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {["ALL", "APPLIED", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEW", "SELECTED", "REJECTED"].map(
          (status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={
                statusFilter === status
                  ? "rounded-full border border-amber-400/40 bg-amber-400/20 px-3 py-1.5 text-xs font-bold text-amber-200"
                  : "rounded-full border border-white/15 px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-200"
              }
            >
              {status === "ALL" ? "All" : STATUS_LABELS[status]}
            </button>
          ),
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No applications yet."
          hint="Applications will appear here when students apply to your opportunities."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((application) => (
            <article
              key={application.id}
              className="rounded-xl border bg-card p-5 soft-shadow"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold">{application.candidateName}</h2>
                  <p className="text-xs text-muted-foreground">
                    {application.role} • applied{" "}
                    {new Date(application.appliedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${
                      STATUS_STYLES[application.status] ?? STATUS_STYLES["APPLIED"]
                    }`}
                  >
                    {STATUS_LABELS[application.status] ?? application.status}
                  </span>
                  <select
                    value={application.status}
                    disabled={updatingId === application.id}
                    onChange={(e) => {
                      void handleStatusChange(application.id, e.target.value);
                    }}
                    className="h-9 rounded-md border border-white/10 bg-white/5 px-2 text-xs"
                    aria-label={`Update status for ${application.candidateName}`}
                  >
                    {Object.keys(STATUS_LABELS).map((status) => (
                      <option key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                  {application.candidateProfileId && (
                    <Button asChild size="sm" variant="outline" className="rounded-full">
                      <Link
                        to="/company/candidates/$id"
                        params={{ id: application.candidateProfileId }}
                      >
                        Review candidate
                      </Link>
                    </Button>
                  )}
                  {updatingId === application.id ? (
                    <Loader2 className="size-4 animate-spin text-amber-400" />
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}

/* =========================================================
   CANDIDATE DISCOVERY
========================================================= */

function CandidateDiscovery() {
  const [candidates, setCandidates] = useState<Awaited<
    ReturnType<typeof getEmployerCandidates>
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const result = await getEmployerCandidates({ data: { search } });
        if (mounted) setCandidates(result);
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error ? err.message : "Unable to load candidates.",
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    const timeout = setTimeout(() => void load(), search ? 300 : 0);

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [search]);

  return (
    <AppShell
      role="company"
      title="Candidate discovery"
      eyebrow="Search verified student talent"
    >
      <div className="mb-6 rounded-xl border bg-card p-4 soft-shadow">
        <label className="relative">
          <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input
            className="h-10 pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by skill, college, or candidate"
          />
        </label>
      </div>

      {error && <div className="mb-5"><ErrorState message={error} /></div>}

      {candidates && candidates.length === 0 && !loading ? (
        <EmptyState
          title="No relevant candidates available yet."
          hint={
            search
              ? "Try a different skill, college, or name."
              : "Students will appear here once they complete their profiles."
          }
        />
      ) : null}

      <div className="grid gap-5 xl:grid-cols-3">
        {(candidates ?? []).map((candidate) => (
          <article
            key={candidate.id}
            className="rounded-xl border bg-card p-6 soft-shadow"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-full bg-accent font-bold text-secondary">
                {candidate.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
              <div>
                <h2 className="font-bold">{candidate.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {[candidate.college, candidate.primaryCareer]
                    .filter(Boolean)
                    .join(" • ") || "Student"}
                </p>
              </div>
              {candidate.passportShared && (
                <ShieldCheck
                  className="ml-auto size-4 text-emerald-300"
                  aria-label="Skill Passport shared"
                />
              )}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-muted p-3">
                <strong>{candidate.verifiedSkillCount}</strong>
                <p className="text-[10px] text-muted-foreground">Verified skills</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <strong>{candidate.verifiedProjectsCount}</strong>
                <p className="text-[10px] text-muted-foreground">Projects</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <strong>{candidate.passedAssessmentsCount}</strong>
                <p className="text-[10px] text-muted-foreground">Assessments</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {candidate.topSkills.map((skill) => (
                <span
                  key={skill.name}
                  className={
                    skill.verificationLevel === "RESUME_DETECTED"
                      ? "rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs font-semibold text-slate-300"
                      : "rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-1 text-xs font-semibold text-emerald-200"
                  }
                >
                  {skill.name} · {skill.score}
                </span>
              ))}
              {candidate.topSkills.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No verified skills yet.
                </p>
              )}
            </div>

            <Button asChild className="mt-5 w-full rounded-full">
              <Link to="/company/candidates/$id" params={{ id: candidate.id }}>
                View profile & matching
              </Link>
            </Button>
          </article>
        ))}
      </div>
    </AppShell>
  );
}

export function CompanyCandidatesPage() {
  return <CandidateDiscovery />;
}

/* =========================================================
   CANDIDATE DETAIL: PROFILE + MATCH EXPLANATION + PASSPORT
========================================================= */

function CandidateDetail({ candidateProfileId }: { candidateProfileId: string }) {
  const [detail, setDetail] = useState<Awaited<
    ReturnType<typeof getEmployerCandidate>
  > | null>(null);
  const [opportunities, setOpportunities] = useState<Awaited<
    ReturnType<typeof getEmployerOpportunities>
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [matchOpportunityId, setMatchOpportunityId] = useState("");
  const [match, setMatch] = useState<Awaited<
    ReturnType<typeof getCandidateMatch>
  > | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const [profileResult, opportunitiesResult] = await Promise.all([
          getEmployerCandidate({ data: { candidateProfileId } }),
          getEmployerOpportunities(),
        ]);
        if (mounted) {
          setDetail(profileResult);
          setOpportunities(opportunitiesResult);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error ? err.message : "Unable to load candidate.",
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
  }, [candidateProfileId]);

  const loadMatch = async (internshipId: string) => {
    setMatchLoading(true);
    setMatchError("");
    setMatch(null);

    try {
      const result = await getCandidateMatch({
        data: { internshipId, candidateProfileId },
      });
      setMatch(result);
    } catch {
      setMatch(null);
      setMatchError("unavailable");
    }
  };

  if (loading) {
    return <EmployerLoader label="Loading candidate..." />;
  }

  if (error || !detail) {
    return (
      <AppShell role="company" title="Candidate" eyebrow="Employer portal">
        <Button asChild variant="outline" className="mb-5 rounded-full">
          <Link to="/company/candidates">Back to candidates</Link>
        </Button>
        <ErrorState message={error || "Candidate not found."} />
      </AppShell>
    );
  }

  return (
    <AppShell role="company" title={detail.name} eyebrow="Candidate review">
      <Button asChild variant="outline" className="mb-6 rounded-full">
        <Link to="/company/candidates">Back to candidates</Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <div className="space-y-6">
          <section className="rounded-xl border bg-card p-6 soft-shadow">
            <div className="flex items-center gap-4">
              <span className="flex size-14 items-center justify-center rounded-full bg-accent font-display text-xl font-bold text-secondary">
                {detail.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
              <div>
                <h2 className="text-xl font-bold">{detail.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {[detail.college, detail.targetRole].filter(Boolean).join(" • ") ||
                    "Student"}
                </p>
              </div>
            </div>

            {detail.careers.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-bold uppercase text-muted-foreground">
                  Career direction
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {detail.careers.map((career) => (
                    <span
                      key={career.title}
                      className="rounded-full border border-violet-400/30 bg-violet-400/15 px-3 py-1 text-xs font-semibold text-violet-200"
                    >
                      {career.title}
                      {career.isPrimary ? " • primary" : ""}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-xl border bg-card p-6 soft-shadow">
            <h2 className="text-lg font-bold">Skills</h2>
            {detail.skills.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No verified skills yet.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {detail.skills.slice(0, 12).map((skill) => (
                  <div key={skill.name} className="rounded-lg bg-muted p-3">
                    <div className="flex items-center justify-between">
                      <strong className="text-sm">{skill.name}</strong>
                      <span className="text-xs font-bold text-amber-300">
                        {skill.score}%
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {skill.verificationLabel}
                    </p>
                    {skill.evidence ? (
                      <p className="mt-1 text-[11px] italic text-slate-400">
                        "{skill.evidence}"
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border bg-card p-6 soft-shadow">
            <h2 className="text-lg font-bold">Verified projects</h2>
            {detail.verifiedProjects.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No verified projects visible. The student may not have shared their
                Skill Passport.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {detail.verifiedProjects.map((project) => (
                  <div key={project.title} className="rounded-lg bg-muted p-3">
                    <strong className="text-sm">{project.title}</strong>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {project.description}
                    </p>
                    <div className="mt-2 flex gap-3 text-xs">
                      {project.projectUrl && (
                        <a
                          href={project.projectUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-cyan-300 hover:underline"
                        >
                          <ExternalLink className="size-3" /> Live demo
                        </a>
                      )}
                      {project.repoUrl && (
                        <a
                          href={project.repoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-cyan-300 hover:underline"
                        >
                          <ExternalLink className="size-3" /> Repository
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border bg-card p-6 soft-shadow">
            <h2 className="text-lg font-bold">Passed assessments</h2>
            {detail.passedAssessments.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No assessment results available.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {detail.passedAssessments.map((assessment) => (
                  <div
                    key={assessment.title}
                    className="flex items-center justify-between rounded-lg bg-muted p-3"
                  >
                    <div>
                      <strong className="text-sm">{assessment.title}</strong>
                      <p className="text-[11px] text-muted-foreground">
                        {assessment.category}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-emerald-300">
                      {assessment.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border bg-card p-6 soft-shadow">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-amber-300" />
              <h2 className="text-lg font-bold">Explainable matching</h2>
            </div>
            {(opportunities ?? []).length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Post an opportunity to see explainable matching for this candidate.
              </p>
            ) : (
              <>
                <div className="mt-4">
                  <Label htmlFor="match-opportunity">
                    Compare against your opportunity
                  </Label>
                  <select
                    id="match-opportunity"
                    value={matchOpportunityId}
                    onChange={(e) => {
                      setMatchOpportunityId(e.target.value);
                      setMatch(null);
                      setMatchError("");
                    }}
                    className="mt-1 h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm"
                  >
                    <option value="">Select an opportunity...</option>
                    {(opportunities ?? []).map((opportunity) => (
                      <option key={opportunity.id} value={opportunity.id}>
                        {opportunity.role}
                        {opportunity.status === "CLOSED" ? " (closed)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {matchOpportunityId && !match && !matchLoading && !matchError ? (
                  <Button
                    className="mt-4 w-full rounded-full"
                    onClick={() => void loadMatch(matchOpportunityId)}
                  >
                    <Target className="size-4" />
                    Calculate match
                  </Button>
                ) : null}

                {matchLoading ? (
                  <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" /> Running the SkillBridge
                    matching engine...
                  </p>
                ) : null}

                {matchError ? (
                  <p className="mt-4 rounded-lg border border-amber-400/25 bg-amber-400/10 p-3 text-xs text-amber-200">
                    Explainable matching is currently unavailable.
                  </p>
                ) : null}

                {match && match.status === "passport_private" ? (
                  <p className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-muted-foreground">
                    This candidate's Skill Passport is private. Match
                    details — scores and evidence — are only available
                    when the candidate shares their passport.
                  </p>
                ) : null}

                {match && match.status === "ok" ? (
                  <div className="mt-5 space-y-4">
                    <div className="rounded-xl border border-amber-400/25 bg-gradient-to-br from-amber-400/15 to-violet-400/10 p-4 text-center">
                      <p className="font-display text-4xl font-bold text-amber-300">
                        {match.matchPercentage}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Skill match {match.skillMatch}% • Career alignment{" "}
                        {match.careerAlignment != null
                          ? `${match.careerAlignment}%`
                          : "not available"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase text-muted-foreground">
                        Strong matches
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {match.matchedSkillsDetails.map((skill) => (
                          <span
                            key={skill.name}
                            className="rounded-full border border-emerald-400/30 bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200"
                          >
                            {skill.name} · {skill.verificationLabel}
                          </span>
                        ))}
                        {match.matchedSkillsDetails.length === 0 && (
                          <p className="text-xs text-muted-foreground">None yet.</p>
                        )}
                      </div>
                    </div>

                    {match.weakSkillsDetails.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase text-muted-foreground">
                          Developing skills
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {match.weakSkillsDetails.map((skill) => (
                            <span
                              key={skill.name}
                              className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200"
                            >
                              {skill.name} · {skill.score}%
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-bold uppercase text-muted-foreground">
                        Missing skills
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {match.missingSkills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full border border-rose-400/25 bg-rose-400/10 px-3 py-1 text-xs font-semibold text-rose-200"
                          >
                            {skill}
                          </span>
                        ))}
                        {match.missingSkills.length === 0 && (
                          <p className="text-xs text-muted-foreground">
                            None — candidate covers all required skills.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                      <p className="font-bold text-slate-300">Why this match?</p>
                      <p className="mt-1">{match.summary}</p>
                      <p className="mt-1">
                        Score = 80% average proficiency across required skills + 20%
                        career alignment with the opportunity role. Verification labels
                        show how each skill was evidenced.
                      </p>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </section>

          <section className="rounded-xl border bg-card p-6 soft-shadow">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-300" />
              <h2 className="text-lg font-bold">Skill Passport</h2>
            </div>
            {!detail.passport.shared ? (
              <p className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
                This Skill Passport is not currently shared.
              </p>
            ) : detail.passport.data ? (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-lg bg-muted p-3">
                    <strong className="font-display text-2xl">
                      {detail.passport.data.readiness}
                    </strong>
                    <p className="text-[10px] text-muted-foreground">Readiness</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <strong className="font-display text-2xl">
                      {detail.passport.data.skills.length}
                    </strong>
                    <p className="text-[10px] text-muted-foreground">Skills</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">
                    Evidence mix
                  </p>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <p>
                      {detail.passport.data.evidenceSummary.assessmentVerified}{" "}
                      assessment-verified
                    </p>
                    <p>
                      {detail.passport.data.evidenceSummary.projectVerified}{" "}
                      project-verified
                    </p>
                    <p>
                      {detail.passport.data.evidenceSummary.institutionVerified}{" "}
                      institution-verified
                    </p>
                    <p>
                      {detail.passport.data.evidenceSummary.employerVerified}{" "}
                      employer-verified
                    </p>
                    <p>
                      {detail.passport.data.evidenceSummary.resumeDetected}{" "}
                      resume-detected
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Passport data follows the student's public sharing settings.
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Skill Passport is not available for this candidate.
              </p>
            )}
          </section>

          <section className="rounded-xl border bg-card p-6 soft-shadow">
            <h2 className="text-lg font-bold">Credentials</h2>
            {detail.verifiedCredentials.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No credentials added yet.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {detail.verifiedCredentials.map((credential) => (
                  <div key={credential.title} className="rounded-lg bg-muted p-3">
                    <div className="flex items-center justify-between">
                      <strong className="text-sm">{credential.title}</strong>
                      <span className="text-[11px] font-bold uppercase text-amber-300">
                        {credential.type}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {credential.issuer} • issued{" "}
                      {new Date(credential.issuedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}

export function CompanyCandidateDetailPage({
  candidateProfileId,
}: {
  candidateProfileId: string;
}) {
  return <CandidateDetail candidateProfileId={candidateProfileId} />;
}

/* =========================================================
   OUTCOMES — real hiring funnel only
========================================================= */

export function CompanyOutcomesPage() {
  const [data, setData] = useState<Awaited<
    ReturnType<typeof getEmployerOutcomes>
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const result = await getEmployerOutcomes();
        if (mounted) setData(result);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Unable to load outcomes.");
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
    return <EmployerLoader label="Loading outcomes..." />;
  }

  return (
    <AppShell
      role="company"
      title="Outcomes"
      eyebrow="Real hiring results from your opportunities"
    >
      {error && <div className="mb-5"><ErrorState message={error} /></div>}

      <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <section className="rounded-xl border bg-card p-6 soft-shadow">
          <h2 className="text-xl font-bold">Application funnel</h2>
          {!data || data.totalApplications === 0 ? (
            <p className="mt-5 text-sm text-muted-foreground">
              No verified outcomes recorded. Outcomes appear as you progress
              applications.
            </p>
          ) : (
            <div className="mt-6 space-y-5">
              {data.funnel.map((stage) => (
                <div key={stage.status}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span>{STATUS_LABELS[stage.status] ?? stage.status}</span>
                    <strong>{stage.count}</strong>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-secondary"
                      style={{
                        width: `${
                          data.totalApplications === 0
                            ? 0
                            : Math.round(
                                (stage.count / data.totalApplications) * 100,
                              )
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border bg-card p-6 soft-shadow">
          <h2 className="text-xl font-bold">Recent selections</h2>
          {!data || data.recentSelected.length === 0 ? (
            <p className="mt-5 text-sm text-muted-foreground">
              No candidates marked as selected yet.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {data.recentSelected.map((selection) => (
                <div
                  key={selection.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted p-4"
                >
                  <div>
                    <strong>{selection.candidateName}</strong>
                    <p className="text-xs text-muted-foreground">{selection.role}</p>
                  </div>
                  <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-200">
                    <ClipboardCheck className="size-3.5" />
                    Selected
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
