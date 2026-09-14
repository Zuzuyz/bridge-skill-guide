import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart2,
  BarChart3,
  Bot,
  BriefcaseBusiness,
  Building2,
  FileSearch,
  GraduationCap,
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
import { storage } from "@/lib/storage";
import { logout } from "@/lib/auth-server";

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
  ],
  admin: [["Platform overview", "/admin/dashboard", LayoutDashboard]],
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
  const [user, setUser] = useState(() => storage.getUser());
  const path = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    setUser(storage.getUser());
  }, [path]);

  const displayName = user?.name || "Shubham Singh";
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "SS";

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore
    }
    storage.setUser(null as any);
    await navigate({ to: "/login" });
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      <CosmicParticles className="opacity-25" particleCount={50} />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 border-r bg-card p-5 transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between">
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
        <div className="mt-10 rounded-xl bg-muted p-4">
          <p className="text-xs font-bold uppercase text-muted-foreground">Your workspace</p>
          <div className="mt-3 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground font-bold">
              {initials}
            </span>
            <div>
              <strong className="block text-sm">{displayName}</strong>
              <span className="text-xs capitalize text-muted-foreground">{role} account</span>
            </div>
          </div>
        </div>
        <nav className="mt-7 space-y-1" aria-label={`${role} navigation`}>
          {nav[role].map(([label, to, Icon]) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                path === to && "bg-accent text-accent-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="absolute inset-x-5 bottom-5 space-y-2">
          <Link
            to="/ai-assistant"
            className="flex items-center gap-3 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
          >
            <Bot className="size-4" />
            Ask SkillBuddy
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-4" />
            Exit workspace
          </button>
        </div>
      </aside>
      <main className="lg:pl-72">
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
                {eyebrow ?? "Career operating system"}
              </p>
              <h1 className="font-display text-2xl font-bold">{title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {actions}
            <span className="hidden rounded-full bg-success/20 px-3 py-1.5 text-xs font-bold text-success-foreground sm:block">
              Profile 84% complete
            </span>
          </div>
        </header>
        <div className="mx-auto max-w-[1500px] p-5 md:p-8">{children}</div>
      </main>
    </div>
  );
}
