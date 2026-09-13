import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Bot,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CloudUpload,
  FileSearch,
  GraduationCap,
  Menu,
  Search,
  ShieldCheck,
  Target,
  TrendingUp,
  UserRound,
  X,
} from "lucide-react";
import { useState } from "react";
import { Brand } from "@/components/brand";
import { ScoreRing, SkillBars } from "@/components/metrics";
import { SkillBuddyFloating } from "@/components/skillbuddy";
import { Button } from "@/components/ui/button";
import { internships, roadmap, studentSkills } from "@/data/mock-data";

const ecosystem = [
  {
    title: "Bridge Skill Gaps",
    label: "For Students",
    text: "Discover your gaps, follow AI roadmaps, and land verified internships.",
    badge: "Track readiness 72%",
    icon: UserRound,
    tone: "bg-primary/20 text-primary-foreground",
  },
  {
    title: "Empower Cohorts",
    label: "For Colleges",
    text: "Benchmark student readiness against live industry demand and improve placements.",
    badge: "68% placement ready",
    icon: Building2,
    tone: "bg-accent text-accent-foreground",
  },
  {
    title: "Hire Verified Talent",
    label: "For Companies",
    text: "Find students by verified skill competency and shorten hiring cycles.",
    badge: "18 roles • 94% match",
    icon: BriefcaseBusiness,
    tone: "bg-success/20 text-success-foreground",
  },
];

export function LandingPage() {
  const [menu, setMenu] = useState(false);
  const topInternship = internships[0];
  return (
    <div className="min-h-screen overflow-hidden">
      <header className="sticky top-4 z-40 mx-auto mt-4 flex w-[calc(100%-2rem)] max-w-7xl items-center justify-between rounded-full border bg-card/90 px-4 py-3 shadow-sm backdrop-blur-md md:px-6">
        <Brand />
        <nav className="hidden items-center gap-6 text-sm font-semibold text-muted-foreground md:flex">
          <a href="#explore">Explore</a>
          <a href="#skills">Skills</a>
          <a href="#roadmap">Roadmap</a>
          <Link to="/internships">Internships</Link>
        </nav>
        <div className="hidden items-center gap-2 sm:flex">
          <Link to="/login" className="px-3 text-sm font-semibold">
            Log in
          </Link>
          <Button asChild className="rounded-full">
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
            <a href="#explore">Explore</a>
            <a href="#skills">Skills</a>
            <Link to="/internships">Internships</Link>
            <Link to="/login">Log in</Link>
            <Button asChild>
              <Link to="/register">Get started</Link>
            </Button>
          </nav>
        )}
      </header>
      <main>
        <section className="relative mx-auto max-w-7xl px-5 pb-20 pt-16 md:pt-20">
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-xs font-bold">
              <Bot className="size-4 text-secondary" /> Next-gen career operating system • Powered
              by AI
            </span>
            <h1 className="mt-7 font-display text-4xl font-extrabold leading-tight md:text-6xl">
              Build the skills. Connect with industry.{" "}
              <span className="text-secondary underline decoration-primary decoration-wavy">
                Launch your career.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              SkillBridge connects students, colleges, and companies through AI-powered skill
              mapping, personalized roadmaps, and verified opportunities.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" className="h-13 rounded-full px-7" asChild>
                <Link to="/register">
                  Start Your Journey <ArrowRight />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-13 rounded-full px-7" asChild>
                <Link to="/internships">Explore Opportunities</Link>
              </Button>
            </div>
            <p className="mt-7 inline-flex rounded-full border bg-card px-5 py-2 text-xs text-muted-foreground shadow-sm">
              <strong className="mr-1 text-foreground">120,000+</strong> Students •{" "}
              <strong className="mx-1 text-foreground">450+</strong> Colleges •{" "}
              <strong className="mx-1 text-foreground">1,200+</strong> Hiring Partners
            </p>
          </div>
          <div className="relative mx-auto mt-14 max-w-5xl rounded-2xl border bg-card p-5 lift-shadow md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-6">
              <div className="flex items-center gap-4">
                <span className="flex size-14 items-center justify-center rounded-full bg-accent font-display font-bold text-secondary">
                  SS
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-bold">Shubham Singh</h2>
                    <span className="rounded-full bg-success/20 px-2.5 py-1 text-xs font-bold text-success-foreground">
                      Verified Student
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    B.Tech Computer Science • 7th Semester • IIT Delhi
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-muted px-3 py-2 text-xs font-bold text-secondary">
                AI Engineer Target
              </span>
            </div>
            <div className="grid gap-8 pt-7 md:grid-cols-[.65fr_1.35fr]">
              <div className="flex items-center justify-center rounded-xl border bg-muted/60 p-6">
                <ScoreRing score={72} />
              </div>
              <div>
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="font-display font-bold">Top detected skills</h3>
                  <span className="text-xs font-bold text-secondary">5 evaluated</span>
                </div>
                <SkillBars skills={studentSkills} />
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/40 bg-warning p-4 text-sm">
              <div>
                <strong>Actionable gap alert:</strong> Deep Learning, TensorFlow and MLOps are
                missing.
              </div>
              <Link to="/student/skill-gap" className="font-bold">
                Bridge gaps →
              </Link>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-full bg-secondary font-bold text-secondary-foreground">
                  H
                </span>
                <div>
                  <strong>{topInternship.role}</strong>
                  <p className="text-sm text-muted-foreground">
                    {topInternship.company} • {topInternship.location} ({topInternship.mode})
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="rounded-full bg-success/20 px-3 py-1 text-xs font-bold text-success-foreground">
                  {topInternship.match}% skill match
                </span>
                <Button asChild className="rounded-full">
                  <Link to="/internships/$id" params={{ id: topInternship.id }}>
                    View role
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
        <section id="explore" className="mx-auto max-w-7xl px-5 py-20">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="font-display text-4xl font-bold">Trusted Career Ecosystem</h2>
            <p className="mt-4 text-muted-foreground">
              One connected system for learning, talent intelligence, and high-quality hiring
              outcomes.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {ecosystem.map(({ title, label, text, badge, icon: Icon, tone }) => (
              <article
                key={label}
                className="group rounded-2xl border bg-card p-7 soft-shadow transition hover:-translate-y-1 hover:shadow-xl"
              >
                <span className={`flex size-12 items-center justify-center rounded-full ${tone}`}>
                  <Icon className="size-5" />
                </span>
                <p className="mt-6 text-xs font-bold uppercase text-secondary">{label}</p>
                <h3 className="mt-2 text-xl font-bold">{title}</h3>
                <p className="mt-3 leading-7 text-muted-foreground">{text}</p>
                <div className="mt-7 border-t pt-5">
                  <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${tone}`}>
                    {badge}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section
          id="skills"
          className="mx-auto max-w-7xl rounded-2xl bg-muted/70 px-5 py-16 md:px-12"
        >
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-bold uppercase">
                <TrendingUp className="size-4" /> Market intelligence
              </span>
              <h2 className="mt-5 text-4xl font-bold">Know what industry needs.</h2>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                Live market intelligence mapped from 50,000+ tech job postings across leading
                startups and enterprises.
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                {[
                  "Python • High demand",
                  "SQL • High demand",
                  "Generative AI • Emerging",
                  "Cloud / AWS • Growing",
                  "React • High demand",
                  "MLOps • Growing",
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border bg-card px-4 py-2 text-sm font-semibold shadow-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border bg-card p-7 lift-shadow">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="font-bold">Industry Skill Demand Index</h3>
                  <p className="text-xs text-muted-foreground">Updated today • Q3 benchmark</p>
                </div>
                <BarChart3 className="text-secondary" />
              </div>
              <SkillBars
                skills={[
                  { id: "p", name: "Python & Data", score: 94 },
                  { id: "a", name: "AI/ML Engineering", score: 91 },
                  { id: "c", name: "Cloud Architectures", score: 85 },
                  { id: "s", name: "SQL & Warehousing", score: 82 },
                  { id: "cy", name: "Cybersecurity", score: 78 },
                ]}
              />
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-5 py-20">
          <div className="text-center">
            <span className="rounded-full bg-accent px-4 py-2 text-xs font-bold uppercase text-accent-foreground">
              AI Resume Skill Parser
            </span>
            <h2 className="mt-5 text-4xl font-bold">Turn your resume into a live skill profile.</h2>
          </div>
          <div className="mt-12 grid gap-7 lg:grid-cols-2">
            <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-card p-8 text-center">
              <span className="flex size-16 items-center justify-center rounded-full bg-primary/20 text-primary-foreground">
                <CloudUpload className="size-8" />
              </span>
              <h3 className="mt-5 text-xl font-bold">Drop your resume here</h3>
              <p className="mt-2 text-sm text-muted-foreground">PDF or DOCX up to 15MB</p>
              <Button className="mt-6 rounded-full" asChild>
                <Link to="/student/resume">Analyze my resume</Link>
              </Button>
            </div>
            <div className="rounded-2xl border bg-card p-7 lift-shadow">
              <div className="flex items-start justify-between border-b pb-5">
                <div>
                  <p className="text-xs font-bold uppercase text-success">AI extraction complete</p>
                  <h3 className="mt-1 text-xl font-bold">10 technical skills mapped</h3>
                </div>
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                  98.4% confidence
                </span>
              </div>
              <div className="mt-5 space-y-3">
                {studentSkills.slice(0, 4).map((skill) => (
                  <div
                    key={skill.id}
                    className="flex items-center justify-between rounded-lg bg-muted p-3"
                  >
                    <span className="font-semibold">{skill.name}</span>
                    <span className="rounded-full bg-success/20 px-2 py-1 text-xs font-bold text-success-foreground">
                      {skill.confidence}% confidence
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section id="roadmap" className="border-y bg-card py-20">
          <div className="mx-auto max-w-7xl px-5">
            <div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr]">
              <div>
                <span className="text-xs font-bold uppercase text-secondary">
                  Your next best move
                </span>
                <h2 className="mt-3 text-4xl font-bold">A career roadmap that evolves with you.</h2>
                <p className="mt-4 leading-7 text-muted-foreground">
                  Every step links a demanded skill to a practical resource, proof project, and
                  opportunity.
                </p>
                <Button asChild className="mt-7 rounded-full">
                  <Link to="/student/roadmap">
                    Open full roadmap <ArrowRight />
                  </Link>
                </Button>
              </div>
              <div className="space-y-3">
                {roadmap.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 rounded-xl border bg-background p-4"
                  >
                    <span
                      className={
                        item.status === "complete"
                          ? "flex size-9 items-center justify-center rounded-full bg-success text-success-foreground"
                          : "flex size-9 items-center justify-center rounded-full bg-accent font-bold text-accent-foreground"
                      }
                    >
                      {item.status === "complete" ? <CheckCircle2 className="size-5" /> : item.step}
                    </span>
                    <div className="flex-1">
                      <strong>{item.skill}</strong>
                      <p className="text-xs text-muted-foreground">
                        {item.difficulty} • {item.duration}
                      </p>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-5 py-20">
          <div className="rounded-2xl bg-foreground p-10 text-center text-background lift-shadow md:p-16">
            <span className="rounded-full border border-background/20 px-4 py-2 text-xs font-bold uppercase">
              Launch with SkillBridge OS
            </span>
            <h2 className="mx-auto mt-7 max-w-3xl text-4xl font-bold md:text-5xl">
              Bridge your academia to industry today.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-background/70">
              Join ambitious students and top campus recruiting teams accelerating real career
              outcomes.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" className="rounded-full" asChild>
                <Link to="/register">
                  Claim your career bridge <ArrowRight />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-background/30 bg-background/10 text-background hover:bg-background/20 hover:text-background"
                asChild
              >
                <Link to="/college/dashboard">View college experience</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t bg-muted/70">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-5 py-10 md:flex-row">
          <Brand compact />
          <p className="text-xs text-muted-foreground">
            © 2026 SkillBridge. Bridging Academia and Industry.
          </p>
          <nav className="flex gap-5 text-xs font-semibold text-muted-foreground">
            <Link to="/internships">Opportunities</Link>
            <Link to="/login">Sign in</Link>
            <Link to="/register">Join</Link>
          </nav>
        </div>
      </footer>
      <SkillBuddyFloating />
    </div>
  );
}
