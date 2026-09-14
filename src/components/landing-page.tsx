import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Bot,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CloudUpload,
  GraduationCap,
  Menu,
  ShieldCheck,
  Target,
  TrendingUp,
  UserRound,
  X,
  Sparkles,
  Award,
  Compass,
} from "lucide-react";
import { useState } from "react";
import { Brand } from "@/components/brand";
import { ScoreRing, SkillBars } from "@/components/metrics";
import { SkillBuddyFloating } from "@/components/skillbuddy";
import { Button } from "@/components/ui/button";
import { CelestialCosmos } from "@/components/ui/celestial-cosmos";

const coreFeatures = [
  {
    title: "Career Direction & Target Role",
    label: "Explore 22+ Paths",
    text: "Select your target career path across AI/ML, Full-Stack, Cloud, Data, and Cybersecurity to get precise skill requirements.",
    icon: Compass,
    tone: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    link: "/student/careers",
  },
  {
    title: "Practical Skill Assessments",
    label: "Verify Competency",
    text: "Demonstrate real proficiency through standardized MCQ, Python Code Sandboxes, and interactive SQL execution challenges.",
    icon: CheckCircle2,
    tone: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    link: "/student/assessments",
  },
  {
    title: "Live Industry Demand Benchmarks",
    label: "Market Intelligence",
    text: "View real-time skill demand scores and market growth tiers mapped across high-growth technology careers.",
    icon: TrendingUp,
    tone: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    link: "/student/industry-demand",
  },
  {
    title: "Explainable Skill Gap & Readiness",
    label: "Deterministic Math",
    text: "Understand exact gaps with transparent formula calculations weighted by importance and verified evidence.",
    icon: BarChart3,
    tone: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    link: "/student/skill-gap",
  },
  {
    title: "AI Resume Skill Extraction",
    label: "Instant Analysis",
    text: "Upload your resume to automatically extract, categorize, and benchmark your existing technical skill proficiencies.",
    icon: CloudUpload,
    tone: "bg-pink-500/20 text-pink-300 border-pink-500/30",
    link: "/student/resume",
  },
  {
    title: "Verified Internship Matches",
    label: "Direct Placements",
    text: "Connect directly with verified hiring partners based on your proven skill score rather than raw keyword matches.",
    icon: BriefcaseBusiness,
    tone: "bg-amber-400/20 text-amber-200 border-amber-400/30",
    link: "/internships",
  },
];

export function LandingPage() {
  const [menu, setMenu] = useState(false);

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      {/* Background celestial ambient stars */}
      <CelestialCosmos className="opacity-40" particleCount={100} showRings={false} />

      <header className="sticky top-4 z-40 mx-auto mt-4 flex w-[calc(100%-2rem)] max-w-7xl items-center justify-between rounded-full border border-white/10 bg-card/85 px-4 py-3 shadow-lg backdrop-blur-xl md:px-6">
        <Brand />
        <nav className="hidden items-center gap-6 text-sm font-semibold text-muted-foreground md:flex">
          <a href="#features" className="hover:text-primary transition">Features</a>
          <Link to="/student/careers" className="hover:text-primary transition">Careers</Link>
          <Link to="/student/assessments" className="hover:text-primary transition">Assessments</Link>
          <Link to="/internships" className="hover:text-primary transition">Internships</Link>
        </nav>
        <div className="hidden items-center gap-2 sm:flex">
          <Link to="/login" className="px-3 text-sm font-semibold hover:text-primary transition">
            Log in
          </Link>
          <Button asChild className="rounded-full bg-primary text-primary-foreground hover:opacity-90 font-medium">
            <Link to="/register">
              Get started <ArrowRight />
            </Link>
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          onClick={() => setMenu((v) => !v)}
          aria-label="Toggle menu"
        >
          {menu ? <X /> : <Menu />}
        </Button>
        {menu && (
          <nav className="absolute left-0 right-0 top-16 mx-2 grid gap-2 rounded-xl border bg-card p-4 shadow-xl sm:hidden">
            <a href="#features" onClick={() => setMenu(false)}>Features</a>
            <Link to="/student/careers" onClick={() => setMenu(false)}>Careers</Link>
            <Link to="/student/assessments" onClick={() => setMenu(false)}>Assessments</Link>
            <Link to="/internships" onClick={() => setMenu(false)}>Internships</Link>
            <Link to="/login" onClick={() => setMenu(false)}>Log in</Link>
            <Button asChild>
              <Link to="/register" onClick={() => setMenu(false)}>Get started</Link>
            </Button>
          </nav>
        )}
      </header>

      <main className="relative z-10">
        {/* Clean Hero Section */}
        <section className="relative mx-auto max-w-7xl px-5 pb-16 pt-16 md:pt-24 overflow-hidden">
          <CelestialCosmos className="opacity-80" particleCount={90} showRings={true} />
          <div className="relative z-10 mx-auto max-w-4xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-300">
              <Sparkles className="size-4 text-amber-400" /> Academia × Industry Skill Intelligence
            </span>
            <h1 className="mt-7 font-display text-4xl font-extrabold leading-tight md:text-6xl text-white">
              Choose your career path.{" "}
              <span className="bg-gradient-to-r from-amber-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent">
                Prove your skills.
              </span>{" "}
              Get hired.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300 font-light">
              SkillBridge connects students with verified skills to top hiring opportunities through objective assessments, transparent readiness scoring, and live industry demand.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button size="lg" className="h-13 rounded-full px-8 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-950/40 hover:from-amber-300 hover:to-amber-400" asChild>
                <Link to="/register">
                  Choose Career Path <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-13 rounded-full px-8 border-white/20 bg-white/5 text-white hover:bg-white/10" asChild>
                <Link to="/student/assessments">Take Skill Assessment</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Clean Features Grid - Only Important App Features */}
        <section id="features" className="mx-auto max-w-7xl px-5 py-16">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
              Core Capabilities
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">
              Everything you need to launch your career
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base">
              Explore your target direction, verify your competencies, and match with verified partner roles.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {coreFeatures.map(({ title, label, text, icon: Icon, tone, link }) => (
              <Link
                key={title}
                to={link}
                className="group rounded-3xl border border-white/10 bg-[#0c0919]/90 p-7 shadow-xl shadow-black/40 backdrop-blur-xl transition hover:-translate-y-1 hover:border-amber-500/30 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`flex size-12 items-center justify-center rounded-2xl border ${tone}`}>
                      <Icon className="size-6" />
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
                      {label}
                    </span>
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-white group-hover:text-amber-300 transition">
                    {title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">
                    {text}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
                  <span>Explore feature</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Call to Action Banner */}
        <section className="mx-auto max-w-7xl px-5 py-16">
          <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 via-[#0c0919] to-purple-950/30 p-10 text-center shadow-2xl md:p-14">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Ready to start?
            </p>
            <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-bold text-white md:text-4xl">
              Take your first career skill assessment today.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-slate-300 text-sm">
              Create an account, pick your target career path, and benchmark your knowledge with interactive coding and technical tests.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button size="lg" className="rounded-full px-8 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold hover:from-amber-300" asChild>
                <Link to="/register">
                  Get Started Now <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#05040a] py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 sm:flex-row">
          <Brand compact />
          <p className="text-xs text-slate-500">
            © 2026 SkillBridge. Bridging Academia and Industry.
          </p>
          <nav className="flex gap-5 text-xs font-semibold text-slate-400">
            <Link to="/student/careers" className="hover:text-white">Careers</Link>
            <Link to="/student/assessments" className="hover:text-white">Assessments</Link>
            <Link to="/internships" className="hover:text-white">Internships</Link>
            <Link to="/login" className="hover:text-white">Sign in</Link>
          </nav>
        </div>
      </footer>

      <SkillBuddyFloating />
    </div>
  );
}
