import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  Compass,
  Menu,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import { useState } from "react";

import { Brand } from "@/components/brand";
import { SkillBuddyFloating } from "@/components/skillbuddy";
import { Button } from "@/components/ui/button";
import { CelestialCosmos } from "@/components/ui/celestial-cosmos";

const features = [
  {
    icon: Compass,
    title: "Career Direction",
    text: "Choose a target career and understand the skills employers expect.",
    href: "/student/careers",
  },
  {
    icon: CheckCircle2,
    title: "Skill Assessments",
    text: "Prove your knowledge through structured technical assessments.",
    href: "/student/assessments",
  },
  {
    icon: TrendingUp,
    title: "Industry Demand",
    text: "See which skills are being demanded across technology careers.",
    href: "/student/industry-demand",
  },
  {
    icon: BarChart3,
    title: "Skill Gap",
    text: "Understand exactly what separates your current skills from your target role.",
    href: "/student/skill-gap",
  },
  {
    icon: Target,
    title: "Career Roadmap",
    text: "Turn your skill gaps into a focused development journey.",
    href: "/student/roadmap",
  },
  {
    icon: BriefcaseBusiness,
    title: "Internships",
    text: "Discover opportunities aligned with your verified skills.",
    href: "/internships",
  },
];

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#05040a] text-white">
      {/* Cosmic background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <CelestialCosmos
          className="opacity-80"
          particleCount={180}
          showRings={false}
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(245,158,11,0.10),transparent_30%),radial-gradient(circle_at_15%_55%,rgba(168,85,247,0.08),transparent_28%),radial-gradient(circle_at_85%_65%,rgba(34,211,238,0.07),transparent_28%)]" />

        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(5,4,10,0.15)_45%,#05040a_100%)]" />
      </div>

      {/* Navigation */}
      <header className="fixed left-1/2 top-4 z-50 w-[calc(100%-2rem)] max-w-7xl -translate-x-1/2">
        <div className="relative flex items-center justify-between rounded-full border border-white/10 bg-[#090714]/75 px-4 py-3 shadow-2xl shadow-black/40 backdrop-blur-2xl md:px-6">
          <Brand />

          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-300 md:flex">
            <a
              href="#platform"
              className="transition hover:text-amber-300"
            >
              Platform
            </a>

            <Link
              to="/student/careers"
              className="transition hover:text-amber-300"
            >
              Careers
            </Link>

            <Link
              to="/student/assessments"
              className="transition hover:text-amber-300"
            >
              Assessments
            </Link>

            <Link
              to="/internships"
              className="transition hover:text-amber-300"
            >
              Internships
            </Link>
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <Link
              to="/login"
              className="px-3 text-sm font-semibold text-slate-300 transition hover:text-white"
            >
              Sign in
            </Link>

            <Button
              asChild
              className="rounded-full bg-amber-400 px-5 font-bold text-slate-950 shadow-lg shadow-amber-950/30 hover:bg-amber-300"
            >
              <Link to="/register">
                Get started
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="text-white sm:hidden"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="Open navigation"
          >
            {menuOpen ? <X /> : <Menu />}
          </Button>

          {menuOpen && (
            <div className="absolute left-0 right-0 top-16 rounded-2xl border border-white/10 bg-[#090714] p-4 shadow-2xl backdrop-blur-xl sm:hidden">
              <nav className="grid gap-2 text-sm">
                <a
                  href="#platform"
                  className="rounded-lg px-3 py-2 text-slate-300 hover:bg-white/5"
                  onClick={() => setMenuOpen(false)}
                >
                  Platform
                </a>

                <Link
                  to="/student/careers"
                  className="rounded-lg px-3 py-2 text-slate-300 hover:bg-white/5"
                  onClick={() => setMenuOpen(false)}
                >
                  Careers
                </Link>

                <Link
                  to="/student/assessments"
                  className="rounded-lg px-3 py-2 text-slate-300 hover:bg-white/5"
                  onClick={() => setMenuOpen(false)}
                >
                  Assessments
                </Link>

                <Link
                  to="/internships"
                  className="rounded-lg px-3 py-2 text-slate-300 hover:bg-white/5"
                  onClick={() => setMenuOpen(false)}
                >
                  Internships
                </Link>

                <Link
                  to="/login"
                  className="rounded-lg px-3 py-2 text-slate-300 hover:bg-white/5"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign in
                </Link>

                <Button
                  asChild
                  className="mt-2 rounded-full bg-amber-400 font-bold text-slate-950 hover:bg-amber-300"
                >
                  <Link
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                  >
                    Get started
                  </Link>
                </Button>
              </nav>
            </div>
          )}
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="relative mx-auto flex min-h-[calc(100vh-90px)] max-w-7xl items-center px-5 pb-64 pt-28 sm:pb-72">
          <CelestialCosmos
            className="opacity-95"
            particleCount={130}
            showRings={true}
          />

          <div className="relative z-10 mx-auto max-w-5xl text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-2 text-xs font-semibold tracking-wide text-amber-200 backdrop-blur-md">
              <Sparkles className="size-4 text-amber-300" />
              ACADEMIA × INDUSTRY SKILL INTELLIGENCE
            </div>

            <h1 className="mt-8 font-serif text-5xl font-medium leading-[1.02] tracking-tight sm:text-6xl lg:text-8xl">
              <span className="text-white">
                Build the skills.
              </span>
              <br />

              <span className="bg-gradient-to-r from-amber-300 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                Connect with industry.
              </span>
              <br />

              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-300 bg-clip-text text-transparent">
                Launch your career.
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-slate-300/85 sm:text-lg">
              SkillBridge connects students, academia, and industry through
              verified skills, transparent skill intelligence, personalized
              development, and real internship opportunities.
            </p>

            <div className="mt-9 flex flex-wrap justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-full bg-amber-400 px-7 font-bold text-slate-950 shadow-xl shadow-amber-950/40 hover:bg-amber-300"
              >
                <Link to="/register">
                  Start your journey
                  <ArrowRight className="ml-2 size-5" />
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-white/15 bg-white/5 px-7 text-white backdrop-blur-md hover:bg-white/10"
              >
                <Link to="/student/assessments">
                  Explore assessments
                </Link>
              </Button>
            </div>

            <div className="mx-auto mt-14 grid max-w-3xl grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-white/[0.025] p-5 backdrop-blur-xl">
              <div>
                <p className="text-lg font-bold text-white">Skills</p>
                <p className="mt-1 text-xs text-slate-500">
                  Evidence-based
                </p>
              </div>

              <div>
                <p className="text-lg font-bold text-white">Careers</p>
                <p className="mt-1 text-xs text-slate-500">
                  Industry mapped
                </p>
              </div>

              <div>
                <p className="text-lg font-bold text-white">Internships</p>
                <p className="mt-1 text-xs text-slate-500">
                  Verified opportunities
                </p>
              </div>
            </div>
          </div>

          {/* Skill intelligence preview */}
          <div className="absolute bottom-[-190px] left-1/2 z-20 hidden w-[min(900px,85vw)] -translate-x-1/2 overflow-hidden rounded-[2rem] border border-white/10 bg-[#090714]/90 shadow-2xl shadow-black/60 backdrop-blur-2xl lg:block">
            <div className="flex items-center justify-between border-b border-white/10 px-7 py-5">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-full border border-purple-400/20 bg-purple-500/10 text-sm font-bold text-purple-300">
                  SB
                </div>

                <div>
                  <p className="font-semibold text-white">
                    Your SkillBridge profile
                  </p>

                  <p className="text-xs text-slate-500">
                    Your verified skills, career direction and readiness
                  </p>
                </div>
              </div>

              <Link
                to="/login"
                className="rounded-full border border-purple-400/20 bg-purple-500/10 px-4 py-2 text-xs font-semibold text-purple-200 transition hover:bg-purple-500/20"
              >
                Sign in to view
                <ArrowRight className="ml-2 inline size-3" />
              </Link>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Skills
                </p>

                <p className="mt-3 text-sm font-semibold text-white">
                  Verified skill profile
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Your assessment results and evidence appear here.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Skill gap
                </p>

                <p className="mt-3 text-sm font-semibold text-white">
                  Know what to improve
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Compare your current abilities with your target career.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Opportunities
                </p>

                <p className="mt-3 text-sm font-semibold text-white">
                  Find relevant internships
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Discover opportunities connected to your real skill profile.
                </p>
              </div>
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-slate-500 md:flex">
            <span className="text-[10px] uppercase tracking-[0.3em]">
              Explore
            </span>
            <ChevronDown className="size-4 animate-bounce" />
          </div>
        </section>

        {/* Platform */}
        <section
          id="platform"
          className="mx-auto max-w-7xl px-5 py-24"
        >
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-400">
              The SkillBridge constellation
            </p>

            <h2 className="mt-4 font-serif text-4xl font-medium sm:text-5xl">
              Everything connects.
            </h2>

            <p className="mt-5 text-sm leading-7 text-slate-400 sm:text-base">
              Your career goal, skills, assessments, industry demand, skill
              gaps, roadmap, and internship opportunities live in one
              connected system.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <Link
                  key={feature.title}
                  to={feature.href}
                  className="group rounded-3xl border border-white/10 bg-[#0a0813]/80 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-amber-400/25 hover:bg-[#0e0b19]"
                >
                  <div className="flex items-start justify-between">
                    <span className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-amber-300">
                      <Icon className="size-5" />
                    </span>

                    <ArrowRight className="size-4 text-slate-600 transition group-hover:translate-x-1 group-hover:text-amber-300" />
                  </div>

                  <h3 className="mt-7 text-xl font-semibold text-white">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    {feature.text}
                  </p>

                  <div className="mt-7 h-px bg-white/5" />

                  <p className="mt-4 text-xs font-bold uppercase tracking-wider text-amber-400">
                    Explore
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Career flow */}
        <section className="mx-auto max-w-7xl px-5 py-24">
          <div className="overflow-hidden rounded-[2rem] border border-amber-400/20 bg-gradient-to-br from-amber-950/25 via-[#0a0813] to-purple-950/20 p-8 shadow-2xl shadow-black/40 md:p-14">
            <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.8fr]">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-400">
                  Your career journey
                </p>

                <h2 className="mt-4 max-w-xl font-serif text-4xl leading-tight sm:text-5xl">
                  From uncertainty to a clear direction.
                </h2>

                <p className="mt-5 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
                  Start with your target role. Measure your current skills.
                  Understand the gaps. Build your roadmap. Then discover
                  opportunities that match what you can actually prove.
                </p>

                <Button
                  asChild
                  className="mt-8 rounded-full bg-amber-400 px-7 font-bold text-slate-950 hover:bg-amber-300"
                >
                  <Link to="/student/careers">
                    Explore career paths
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </div>

              <div className="relative mx-auto aspect-square w-full max-w-md">
                <div className="absolute inset-8 rounded-full border border-amber-400/20" />
                <div className="absolute inset-16 rounded-full border border-pink-400/20" />
                <div className="absolute inset-24 rounded-full border border-cyan-400/20" />

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex size-28 items-center justify-center rounded-full border border-amber-300/30 bg-amber-300/10 shadow-[0_0_80px_rgba(251,191,36,0.18)]">
                    <Sparkles className="size-10 text-amber-200" />
                  </div>
                </div>

                <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 backdrop-blur-md">
                  Career
                </div>

                <div className="absolute bottom-5 left-4 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 backdrop-blur-md">
                  Skills
                </div>

                <div className="absolute bottom-8 right-3 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 backdrop-blur-md">
                  Opportunities
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-5xl px-5 py-24 text-center">
          <Sparkles className="mx-auto size-7 text-amber-300" />

          <h2 className="mt-5 font-serif text-4xl sm:text-5xl">
            Your next chapter starts here.
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
            Build a stronger skill profile, understand your career direction,
            and connect your capabilities with real opportunities.
          </p>

          <Button
            asChild
            size="lg"
            className="mt-8 rounded-full bg-amber-400 px-8 font-bold text-slate-950 hover:bg-amber-300"
          >
            <Link to="/register">
              Get started
              <ArrowRight className="ml-2 size-5" />
            </Link>
          </Button>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-[#05040a]/90">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
          <Brand compact />

          <p className="text-xs text-slate-500">
            © 2026 SkillBridge · Bridging Academia and Industry
          </p>

          <div className="flex gap-5 text-xs font-semibold text-slate-400">
            <Link
              to="/student/careers"
              className="hover:text-white"
            >
              Careers
            </Link>

            <Link
              to="/student/assessments"
              className="hover:text-white"
            >
              Assessments
            </Link>

            <Link
              to="/internships"
              className="hover:text-white"
            >
              Internships
            </Link>
          </div>
        </div>
      </footer>

      <SkillBuddyFloating />
    </div>
  );
}
