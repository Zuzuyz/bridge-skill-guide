import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  GraduationCap,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useState } from "react";

import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { CelestialCosmos } from "@/components/ui/celestial-cosmos";
import { CosmicParticles } from "@/components/ui/cosmic-particles";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { login, register } from "@/lib/auth-server";
import { storage } from "@/lib/storage";

import type { UserRole } from "@/types";

const roles = [
  {
    id: "student",
    label: "Student",
    icon: UserRound,
  },
  {
    id: "company",
    label: "Company",
    icon: Building2,
  },
  {
    id: "college",
    label: "College",
    icon: GraduationCap,
  },
  {
    id: "admin",
    label: "Admin",
    icon: ShieldCheck,
  },
] as const;

const routeFor = (role: UserRole) =>
  role === "student"
    ? "/student/dashboard"
    : role === "company"
      ? "/company/dashboard"
      : role === "college"
        ? "/college/dashboard"
        : "/admin/dashboard";

export function AuthPage({
  mode,
}: {
  mode: "login" | "register";
}) {
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole>("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  const submit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);

    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const name = String(data.get("name") ?? "").trim();

    // Basic validation
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
            },
          })
        : await login({
            data: {
              email,
              password,
            },
          });

      storage.setUser({
        ...user,
        name: name || user.name,
      });

      await navigate({
        to: routeFor(user.role),
      });
    } catch (err) {
      console.error("Authentication error:", err);

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
    <div className="relative min-h-screen bg-[#05040a] text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden">
      {/* Full screen ambient cosmic astrolabe & stars */}
      <CelestialCosmos className="opacity-60" particleCount={140} showRings={false} />

      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl border border-amber-500/20 bg-[#090714]/90 shadow-2xl shadow-amber-950/30 backdrop-blur-2xl lg:grid-cols-2">

        {/* Left Celestial Hero Side */}
        <div className="relative hidden bg-[#06040d] p-10 lg:flex lg:flex-col lg:justify-between border-r border-amber-500/20 overflow-hidden">
          <CelestialCosmos className="opacity-95" particleCount={100} showRings={true} />

          <div className="relative z-10">
            <Brand />

            <div className="mt-16 max-w-md">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">
                SKILLBRIDGE · ACADEMIA × INDUSTRY
              </p>

              <h1 className="text-4xl font-serif font-medium tracking-tight text-white sm:text-5xl leading-[1.15]">
                Learn Smarter.
                <br />
                <span className="bg-gradient-to-r from-amber-200 via-pink-300 to-cyan-200 bg-clip-text text-transparent">
                  Grow Faster.
                </span>
              </h1>

              <p className="mt-5 text-sm sm:text-base leading-relaxed text-slate-300/85 font-light">
                Ancient wisdom meets next-gen AI skill intelligence — guiding students, colleges, and industry into a unified constellation of opportunity.
              </p>
            </div>
          </div>

          <div className="relative z-10 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5 backdrop-blur-md">
            <p className="text-xs font-medium uppercase tracking-widest text-amber-300/90">
              The Celestial Path
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-200">
              <span className="rounded-md border border-amber-500/30 bg-white/5 px-2.5 py-1 text-amber-200">Skills</span>
              <ArrowRight className="h-3.5 w-3.5 text-amber-400" />
              <span className="rounded-md border border-pink-500/30 bg-white/5 px-2.5 py-1 text-pink-200">Skill Gap</span>
              <ArrowRight className="h-3.5 w-3.5 text-pink-400" />
              <span className="rounded-md border border-purple-500/30 bg-white/5 px-2.5 py-1 text-purple-200">Roadmap</span>
              <ArrowRight className="h-3.5 w-3.5 text-purple-400" />
              <span className="rounded-md border border-cyan-500/40 bg-cyan-950/40 text-cyan-200 px-2.5 py-1">Internships</span>
            </div>
          </div>
        </div>

        {/* Right Auth Form Side */}
        <div className="p-6 sm:p-10 flex flex-col justify-center">
          <div className="mb-6 lg:hidden">
            <Brand />
          </div>

          <div className="mx-auto w-full max-w-md">
            <div className="mb-6">
              <p className="mb-1 text-xs font-medium text-emerald-400 uppercase tracking-wider">
                {isRegister ? "Join SkillBridge" : "Welcome Back"}
              </p>

              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {isRegister ? "Create your account" : "Sign in to continue"}
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                {isRegister
                  ? "Start building your career profile with SkillBridge."
                  : "Sign in to continue your career journey."}
              </p>
            </div>

            {/* Quick Demo Social Sign-in Buttons */}
            <div className="space-y-2.5 mb-6">
              <button
                type="button"
                onClick={() => {
                  const emailInput = document.getElementById("email") as HTMLInputElement;
                  const passwordInput = document.getElementById("password") as HTMLInputElement;
                  if (emailInput && passwordInput) {
                    emailInput.value = "alex@example.com";
                    passwordInput.value = "password123";
                  }
                }}
                className="w-full flex items-center justify-center gap-3 rounded-xl bg-white text-slate-900 font-medium py-2.5 px-4 text-sm transition hover:bg-slate-100 shadow-sm"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Continue with Google
              </button>

              <button
                type="button"
                onClick={() => {
                  const emailInput = document.getElementById("email") as HTMLInputElement;
                  const passwordInput = document.getElementById("password") as HTMLInputElement;
                  if (emailInput && passwordInput) {
                    emailInput.value = "tech@innovatecorp.com";
                    passwordInput.value = "password123";
                  }
                }}
                className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/5 text-slate-200 font-medium py-2.5 px-4 text-sm transition hover:bg-white/10"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                Continue with GitHub
              </button>
            </div>

            <div className="relative mb-6 flex items-center justify-center">
              <div className="border-t border-white/10 w-full" />
              <span className="bg-[#0a0f0c] px-3 text-xs text-slate-500 uppercase tracking-wider whitespace-nowrap">
                or continue with email
              </span>
              <div className="border-t border-white/10 w-full" />
            </div>

            {/* Role selector */}
            <div className="mb-5">
              <Label className="mb-2.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
                I am joining as a
              </Label>

              <div className="grid grid-cols-2 gap-2">
                {roles.map((item) => {
                  const Icon = item.icon;
                  const selected = role === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        setRole(item.id as UserRole)
                      }
                      className={[
                        "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition",
                        selected
                          ? "border-emerald-500 bg-emerald-500/15 text-emerald-300 shadow-sm"
                          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:border-white/20",
                      ].join(" ")}
                    >
                      <Icon className={`h-4 w-4 ${selected ? "text-emerald-400" : "text-slate-400"}`} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form */}
            <form
              onSubmit={submit}
              className="space-y-4"
            >
              {isRegister && (
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs text-slate-300">
                    Full name
                  </Label>

                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Shubham Singh"
                    autoComplete="name"
                    className="rounded-xl border-white/15 bg-white/5 text-white placeholder:text-slate-500 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
                    required
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs text-slate-300">
                  Email
                </Label>

                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@university.edu"
                  autoComplete="email"
                  className="rounded-xl border-white/15 bg-white/5 text-white placeholder:text-slate-500 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs text-slate-300">
                    Password
                  </Label>
                  {!isRegister && (
                    <span className="text-xs text-slate-400 hover:text-emerald-400 cursor-pointer">
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
                  className="rounded-xl border-white/15 bg-white/5 text-white placeholder:text-slate-500 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
                  required
                />
              </div>

              {error && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full rounded-xl bg-[#5f9e77] hover:bg-[#528d68] text-white font-medium py-3 shadow-lg shadow-emerald-950/50 transition duration-200"
                disabled={loading}
              >
                {loading
                  ? isRegister
                    ? "Creating account..."
                    : "Signing in..."
                  : isRegister
                    ? "Create Account"
                    : "Sign In"}

                {!loading && (
                  <ArrowRight className="ml-2 h-4 w-4" />
                )}
              </Button>
            </form>

            {/* Switch login/register */}
            <div className="mt-5 text-center text-xs text-slate-400">
              {isRegister ? (
                <>
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-medium text-emerald-400 hover:underline"
                  >
                    Sign in
                  </Link>
                </>
              ) : (
                <>
                  Don't have an account?{" "}
                  <Link
                    to="/register"
                    className="font-medium text-emerald-400 hover:underline"
                  >
                    Create one
                  </Link>
                </>
              )}
            </div>

            <p className="mt-6 text-center text-[11px] leading-4 text-slate-500">
              By continuing, you agree to SkillBridge's{" "}
              <span className="text-slate-400 hover:underline cursor-pointer">Terms of Service</span> and{" "}
              <span className="text-slate-400 hover:underline cursor-pointer">Privacy Policy</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}