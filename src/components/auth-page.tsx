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

      // After registration, students must choose a career path first.
      // After login, go straight to the role dashboard.
      const destination =
        isRegister && user.role === "student"
          ? "/student/careers"
          : routeFor(user.role);

      await navigate({
        to: destination,
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
                    placeholder="Enter your full name"
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