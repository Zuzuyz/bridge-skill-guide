import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  GraduationCap,
  HandHeart,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { CelestialCosmos } from "@/components/ui/celestial-cosmos";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  getRegistrationOptions,
  login,
  register,
} from "@/lib/auth-server";

import type { UserRole } from "@/types";

/* Dashboard routing is derived exclusively from User.role as
   stored in the database after authentication — never from the
   email domain or anything the browser chose. */
const routeFor = (role: UserRole) =>
  role === "student"
    ? "/student/dashboard"
    : role === "company"
      ? "/company/dashboard"
      : role === "college"
        ? "/college/dashboard"
        : role === "faculty"
          ? "/faculty/dashboard"
          : "/admin/dashboard";

const REGISTRATION_ROLE_META: Record<
  UserRole,
  { label: string; icon: typeof UserRound }
> = {
  student: { label: "Student", icon: UserRound },
  faculty: { label: "Faculty", icon: HandHeart },
  company: { label: "Company", icon: Building2 },
  college: { label: "College", icon: GraduationCap },
  admin: { label: "Admin", icon: ShieldCheck },
};

const INSTITUTIONAL_ROLES: UserRole[] = [
  "faculty",
  "company",
  "college",
  "admin",
];

export function AuthPage({
  mode,
}: {
  mode: "login" | "register";
}) {
  const navigate = useNavigate();

  /* The selectable roles come from the SERVER (which mirrors the
     authoritative registerUser gate): institutional options render
     only when hackathon onboarding is enabled in the environment.
     Production shows Personal/Student only. */
  const [allowedRoles, setAllowedRoles] = useState<UserRole[]>([
    "student",
  ]);
  const [role, setRole] = useState<UserRole>("student");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  useEffect(() => {
    if (!isRegister) return;

    let mounted = true;

    void getRegistrationOptions()
      .then((options) => {
        if (mounted) setAllowedRoles(options.roles as UserRole[]);
      })
      .catch(() => {
        /* Options are cosmetic; the server gate is authoritative. */
      });

    return () => {
      mounted = false;
    };
  }, [isRegister]);

  const submit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);

    const email = String(
      data.get("email") ?? "",
    ).trim();

    const password = String(
      data.get("password") ?? "",
    );

    const name = String(
      data.get("name") ?? "",
    ).trim();

    /* Faculty onboarding: the registrant declares their institution,
       which is linked (or created) as a real College row. Empty for
       every other role. */
    const institution =
      isRegister && role === "faculty"
        ? String(data.get("institution") ?? "").trim()
        : "";

    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must contain at least 6 characters.",
      );
      return;
    }

    if (isRegister && name.length < 2) {
      setError("Enter your full name.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const { user } = isRegister
        ? await register({
            data: {
              name,
              email,
              password,
              role,
              ...(role === "faculty" && institution
                ? { institution }
                : {}),
            },
          })
        : await login({
            data: {
              email,
              password,
            },
          });

      // Identity is established by the HTTP-only session cookie set
      // server-side in login/register. The dashboard destination is
      // derived from User.role as stored in the database — never
      // from the email domain or anything the client chose.

      const destination = routeFor(user.role);

      await navigate({
        to: destination,
      });
    } catch (err) {
      console.error(
        "Authentication error:",
        err,
      );

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Something went wrong. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05040a] text-white">
      {/* =====================================================
          COSMIC BACKGROUND
      ===================================================== */}

      <CelestialCosmos
        className="opacity-70"
        particleCount={180}
        showRings={true}
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(139,92,246,0.18),transparent_32%),radial-gradient(circle_at_80%_70%,rgba(236,72,153,0.14),transparent_30%),linear-gradient(180deg,rgba(5,4,10,0.2),rgba(5,4,10,0.82))]" />

      {/* =====================================================
          TOP NAV
      ===================================================== */}

      <header className="relative z-30 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        {/* Brand renders its own link to "/" — wrapping it in another
            <a> produced a nested-anchor hydration warning. */}
        <Brand />

        <Link
          to="/"
          className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-200 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/10"
        >
          Back to home
        </Link>
      </header>

      {/* =====================================================
          AUTH CARD
      ===================================================== */}

      <section className="relative z-20 mx-auto flex min-h-[calc(100vh-100px)] w-full max-w-6xl items-center justify-center px-4 pb-10 sm:px-6 lg:px-8">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/10 bg-[#090714]/85 shadow-2xl shadow-black/60 backdrop-blur-2xl lg:grid-cols-[0.9fr_1.1fr]">

          {/* =================================================
              LEFT CELESTIAL PANEL
          ================================================= */}

          <div className="relative hidden min-h-[680px] overflow-hidden border-r border-white/10 bg-[#07050e] p-10 lg:flex lg:flex-col lg:justify-between">
            <CelestialCosmos
              className="opacity-90"
              particleCount={120}
              showRings={true}
            />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-amber-300">
                <Sparkles className="size-3" />
                The Celestial Path
              </div>

              <h1 className="mt-10 max-w-lg font-serif text-5xl font-medium leading-[1.04] tracking-tight text-white">
                Learn Smarter.
                <br />

                <span className="bg-gradient-to-r from-amber-300 via-pink-400 to-cyan-300 bg-clip-text text-transparent">
                  Grow Faster.
                </span>
              </h1>

              <p className="mt-7 max-w-md text-sm leading-7 text-slate-400">
                SkillBridge connects your academic
                journey with the skills, careers,
                mentors, and opportunities shaping
                the world of work.
              </p>
            </div>

            {/* Journey */}
            <div className="relative z-10 rounded-2xl border border-white/10 bg-black/20 p-5 backdrop-blur-xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
                Your journey
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-200">
                  Skills
                </span>

                <ArrowRight className="size-3 text-slate-600" />

                <span className="rounded-full border border-pink-400/20 bg-pink-400/10 px-3 py-1.5 text-xs font-semibold text-pink-200">
                  Skill Gap
                </span>

                <ArrowRight className="size-3 text-slate-600" />

                <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1.5 text-xs font-semibold text-purple-200">
                  Roadmap
                </span>

                <ArrowRight className="size-3 text-slate-600" />

                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-200">
                  Internships
                </span>
              </div>
            </div>
          </div>

          {/* =================================================
              RIGHT FORM
          ================================================= */}

          <div className="flex items-center p-6 sm:p-10 lg:p-14">
            <div className="mx-auto w-full max-w-md">

              {/* Mobile brand */}
              <div className="mb-10 lg:hidden">
                <Brand />
              </div>

              {/* Heading */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-300">
                  {isRegister
                    ? "Begin your journey"
                    : "Welcome back"}
                </p>

                <h2 className="mt-3 font-serif text-4xl font-medium tracking-tight text-white">
                  {isRegister
                    ? "Create your account"
                    : "Welcome back"}
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {isRegister
                    ? "Join SkillBridge and connect your skills with real career opportunities."
                    : "Sign in to continue your SkillBridge journey."}
                </p>
              </div>

              {/* =================================================
                  ACCOUNT TYPE (registration — Student only)
              ================================================= */}

              {isRegister && (
                <div className="mt-8">
                  <Label className="mb-3 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    Account type
                  </Label>

                  <div className="space-y-2">
                    {/* PERSONAL */}
                    <button
                      type="button"
                      onClick={() => setRole("student")}
                      className={[
                        "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",
                        role === "student"
                          ? "border-amber-300/40 bg-amber-300/10 text-amber-200 shadow-lg shadow-amber-950/20"
                          : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:bg-white/[0.06] hover:text-white",
                      ].join(" ")}
                    >
                      <UserRound
                        className={[
                          "size-4 shrink-0",
                          role === "student"
                            ? "text-amber-300"
                            : "text-slate-500",
                        ].join(" ")}
                      />
                      <div>
                        <p className="text-xs font-semibold">Personal</p>
                        <p className="text-[10px] leading-4 text-slate-500">
                          Student account for your own skill journey.
                        </p>
                      </div>
                    </button>

                    {/* INSTITUTIONAL — HACKATHON ACCESS (server-gated) */}
                    {INSTITUTIONAL_ROLES.some((r) =>
                      allowedRoles.includes(r),
                    ) ? (
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                          Institutional — Hackathon Access
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {INSTITUTIONAL_ROLES.filter((r) =>
                            allowedRoles.includes(r),
                          ).map((r) => {
                            const meta = REGISTRATION_ROLE_META[r];
                            const Icon = meta.icon;
                            const selected = role === r;
                            return (
                              <button
                                key={r}
                                type="button"
                                onClick={() => setRole(r)}
                                className={[
                                  "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold transition-all",
                                  selected
                                    ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-200"
                                    : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:bg-white/[0.06] hover:text-white",
                                ].join(" ")}
                              >
                                <Icon
                                  className={[
                                    "size-4",
                                    selected
                                      ? "text-cyan-300"
                                      : "text-slate-500",
                                  ].join(" ")}
                                />
                                {meta.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <p className="px-1 text-[10px] leading-4 text-slate-500">
                        Faculty, company, college and admin accounts are
                        provisioned by the SkillBridge team.
                      </p>
                    )}

                    {INSTITUTIONAL_ROLES.some((r) =>
                      allowedRoles.includes(r),
                    ) ? (
                      <p className="px-1 text-[10px] leading-4 text-slate-500">
                        Use your real email. Hackathon access lets you explore
                        each SkillBridge portal. Institutional self-registration
                        is disabled in production.
                        {role !== "student"
                          ? " Your dashboard will be ready immediately."
                          : ""}
                      </p>
                    ) : null}
                  </div>
                </div>
              )}

              {/* =================================================
                  FORM
              ================================================= */}

              <form
                onSubmit={submit}
                className="mt-7 space-y-5"
              >
                {isRegister && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-xs font-medium text-slate-300"
                    >
                      Full name
                    </Label>

                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Enter your full name"
                      autoComplete="name"
                      className="h-12 rounded-xl border-white/10 bg-white/[0.04] text-white placeholder:text-slate-600 focus-visible:border-amber-400/50 focus-visible:ring-amber-400/10"
                      required
                    />
                  </div>
                )}

                {isRegister && role === "faculty" && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="institution"
                      className="text-xs font-medium text-slate-300"
                    >
                      Institution / College
                    </Label>

                    <Input
                      id="institution"
                      name="institution"
                      type="text"
                      placeholder="Enter your institution's name"
                      autoComplete="organization"
                      className="h-12 rounded-xl border-white/10 bg-white/[0.04] text-white placeholder:text-slate-600 focus-visible:border-amber-400/50 focus-visible:ring-amber-400/10"
                    />
                    <p className="text-[10px] leading-4 text-slate-500">
                      Your faculty account is linked to this college. It must
                      already be registered — if it is not, register the
                      College account first, then register Faculty using the
                      same institution name.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-xs font-medium text-slate-300"
                  >
                    Email
                  </Label>

                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@university.edu"
                    autoComplete="email"
                    className="h-12 rounded-xl border-white/10 bg-white/[0.04] text-white placeholder:text-slate-600 focus-visible:border-amber-400/50 focus-visible:ring-amber-400/10"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password"
                      className="text-xs font-medium text-slate-300"
                    >
                      Password
                    </Label>

                    {!isRegister && (
                      <span className="cursor-pointer text-xs text-slate-500 transition hover:text-amber-300">
                        Forgot password?
                      </span>
                    )}
                  </div>

                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete={
                      isRegister
                        ? "new-password"
                        : "current-password"
                    }
                    className="h-12 rounded-xl border-white/10 bg-white/[0.04] text-white placeholder:text-slate-600 focus-visible:border-amber-400/50 focus-visible:ring-amber-400/10"
                    required
                  />
                </div>

                {error && (
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs leading-5 text-rose-300">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-300 font-bold text-[#211606] shadow-xl shadow-amber-950/30 transition hover:from-amber-200 hover:to-amber-100"
                  disabled={loading}
                >
                  {loading
                    ? isRegister
                      ? "Creating account..."
                      : "Signing in..."
                    : isRegister
                      ? "Create account"
                      : "Sign in"}

                  {!loading && (
                    <ArrowRight className="ml-2 size-4" />
                  )}
                </Button>
              </form>

              {/* =================================================
                  SWITCH AUTH MODE
              ================================================= */}

              <div className="mt-7 text-center text-xs text-slate-500">
                {isRegister ? (
                  <>
                    Already have an account?{" "}
                    <Link
                      to="/login"
                      className="font-semibold text-amber-300 transition hover:text-amber-200 hover:underline"
                    >
                      Sign in
                    </Link>
                  </>
                ) : (
                  <>
                    Don't have an account?{" "}
                    <Link
                      to="/register"
                      className="font-semibold text-amber-300 transition hover:text-amber-200 hover:underline"
                    >
                      Create one
                    </Link>
                  </>
                )}
              </div>

              <p className="mt-7 text-center text-[10px] leading-5 text-slate-600">
                By continuing, you agree to SkillBridge's{" "}
                <span className="text-slate-500">
                  Terms of Service
                </span>{" "}
                and{" "}
                <span className="text-slate-500">
                  Privacy Policy
                </span>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
