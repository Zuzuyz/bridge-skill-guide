
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart2,
  BarChart3,
  Bot,
  BriefcaseBusiness,
  Building2,
  FileSearch,
  FolderGit2,
  Gauge,
  GraduationCap,
  HandHeart,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  CheckCircle2,
  Award,
  ShieldCheck,
  Target,
  TrendingUp,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { CosmicParticles } from "@/components/ui/cosmic-particles";
import { cn } from "@/lib/utils";
import { getCurrentUser, logout } from "@/lib/auth-server";

const nav = {
  student: [
    ["Overview", "/student/dashboard", LayoutDashboard],
    ["My profile", "/student/profile", UserRound],
    ["Career direction", "/student/careers", Target],
    ["Industry demand", "/student/industry-demand", TrendingUp],
    ["Resume analysis", "/student/resume", FileSearch],
    ["Skill inventory", "/student/skills", BarChart3],
    ["Skill passport", "/student/passport", ShieldCheck],
    ["Skill Assessments", "/student/assessments", CheckCircle2],
    ["Skill gap & readiness", "/student/skill-gap", BarChart2],
    ["Skill Development", "/student/skill-development", Award],
    ["My projects", "/student/projects", FolderGit2],
    ["Career roadmap", "/student/roadmap", Map],
    ["Internships", "/internships", BriefcaseBusiness],
    ["Applications", "/student/applications", GraduationCap],
  ],
  company: [
    ["Overview", "/company/dashboard", LayoutDashboard],
    ["Internships", "/company/internships", BriefcaseBusiness],
    ["Candidates", "/company/candidates", Users],
  ],
  college: [
    ["Overview", "/college/dashboard", LayoutDashboard],
    ["Student analytics", "/college/students", Users],
    ["Faculty & assignments", "/college/faculty", HandHeart],
  ],
  faculty: [
    ["Dashboard", "/faculty/dashboard", LayoutDashboard],
    ["My students", "/faculty/students", Users],
    ["Skill gaps", "/faculty/skill-gaps", BarChart2],
    ["Career readiness", "/faculty/readiness", Gauge],
    ["Projects", "/faculty/projects", FolderGit2],
    ["Assessments", "/faculty/assessments", CheckCircle2],
    ["Internships", "/faculty/internships", BriefcaseBusiness],
    ["Interventions", "/faculty/interventions", HandHeart],
  ],
  admin: [
    ["Platform overview", "/admin/dashboard", LayoutDashboard],
  ],
} as const;

export function AppShell({
  role = "student",
  title = "SkillBridge",
  eyebrow,
  children,
  actions,
}: {
  role?: keyof typeof nav;
  title?: string;
  eyebrow?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(
    null,
  );

  const path = useRouterState({
    select: (state) => state.location.pathname,
  });

  // Identity comes from the real HTTP-only session (cookie → verifySession).
  // Re-fetched on route change so a login/logout elsewhere updates the shell.
  useEffect(() => {
    let cancelled = false;
    getCurrentUser()
      .then((result) => {
        if (!cancelled) setUser(result);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  const displayName = user?.name || "User";

  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Ignore logout errors; the server cookie deletion is best-effort.
    }

    setUser(null);

    await navigate({
      to: "/login",
    });
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <CosmicParticles
        className="opacity-25"
        particleCount={50}
      />

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full w-72 flex-col border-r bg-card p-5 shadow-xl transition-transform lg:translate-x-0",
          open
            ? "translate-x-0"
            : "-translate-x-full",
        )}
      >
        {/* Brand */}

        <div className="flex shrink-0 items-center justify-between">
          <Brand />

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X />
          </Button>
        </div>

        {/* Workspace */}

        <div className="mt-6 shrink-0 rounded-xl bg-muted p-4">
          <p className="text-xs font-bold uppercase text-muted-foreground">
            Your workspace
          </p>

          <div className="mt-3 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-secondary font-bold text-secondary-foreground">
              {initials}
            </span>

            <div className="overflow-hidden">
              <strong className="block truncate text-sm">
                {displayName}
              </strong>

              <span className="text-xs capitalize text-muted-foreground">
                {role} account
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}

        <nav
          className="scrollbar-thin scrollbar-thumb-white/10 mt-6 flex-1 space-y-1 overflow-y-auto pr-1 pb-4"
          aria-label={`${role} navigation`}
        >
          {nav[role].map(
            ([label, to, Icon]) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  path === to &&
                    "bg-accent font-bold text-accent-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />

                <span className="truncate">
                  {label}
                </span>
              </Link>
            ),
          )}
        </nav>

        {/* Bottom actions */}

        <div className="mt-auto shrink-0 space-y-2 border-t border-white/10 pt-4">
          <Link
            to="/ai-assistant"
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition hover:opacity-95"
          >
            <Bot className="size-4" />

            Ask SkillBuddy
          </Link>

          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-4" />

            Exit workspace
          </button>
        </div>
      </aside>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="lg:pl-72">
        {/* Header */}

        <header className="sticky top-0 z-30 flex min-h-20 items-center justify-between border-b bg-background/90 px-5 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu />
            </Button>

            <div>
              <p className="text-xs font-bold uppercase text-secondary">
                {eyebrow ??
                  "Career operating system"}
              </p>

              <h1 className="font-display text-2xl font-bold">
                {title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {actions}

            <span className="hidden rounded-full bg-success/20 px-3 py-1.5 text-xs font-bold text-success-foreground sm:block">
              SkillBridge workspace
            </span>
          </div>
        </header>

        {/* Page */}

        <div className="mx-auto max-w-[1500px] p-5 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

