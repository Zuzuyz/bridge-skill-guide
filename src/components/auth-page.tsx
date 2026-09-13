import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Building2, GraduationCap, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/services/mock-api";
import { storage } from "@/lib/storage";
import type { UserRole } from "@/types";

const roles = [
  { id: "student", label: "Student", icon: UserRound },
  { id: "company", label: "Company", icon: Building2 },
  { id: "college", label: "College", icon: GraduationCap },
  { id: "admin", label: "Admin", icon: ShieldCheck },
] as const;
const routeFor = (role: UserRole) =>
  role === "student"
    ? "/student/dashboard"
    : role === "company"
      ? "/company/dashboard"
      : role === "college"
        ? "/college/dashboard"
        : "/admin/dashboard";

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email"));
    const password = String(data.get("password"));
    const name = String(data.get("name") ?? "Shubham Singh");
    if (!email.includes("@")) return setError("Enter a valid email address.");
    if (password.length < 6) return setError("Password must contain at least 6 characters.");
    setError("");
    setLoading(true);
    const user = await login(email, role);
    storage.setUser({ ...user, name: name || user.name });
    await navigate({ to: routeFor(role) });
  };
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden bg-foreground p-12 text-background lg:flex lg:flex-col lg:justify-between">
        <Brand />
        <div className="max-w-xl">
          <span className="rounded-full border border-background/20 px-4 py-2 text-xs font-bold uppercase text-primary">
            Career intelligence, personalized
          </span>
          <h1 className="mt-7 text-5xl font-extrabold leading-tight">
            Your bridge from classroom potential to industry impact.
          </h1>
          <p className="mt-6 text-lg leading-8 text-background/70">
            Map your skills, discover the right next step, and connect with opportunities where you
            can thrive.
          </p>
        </div>
        <p className="text-sm text-background/50">SkillBridge • Academia × Industry</p>
      </section>
      <section className="flex items-center justify-center p-5 md:p-10">
        <div className="w-full max-w-lg">
          <div className="mb-10 lg:hidden">
            <Brand />
          </div>
          <p className="text-xs font-bold uppercase text-secondary">
            {mode === "login" ? "Welcome back" : "Build your bridge"}
          </p>
          <h2 className="mt-2 text-4xl font-bold">
            {mode === "login" ? "Sign in to SkillBridge" : "Create your account"}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {mode === "login"
              ? "Continue where you left off."
              : "Choose your workspace and start with a personalized experience."}
          </p>
          <form onSubmit={submit} className="mt-8 space-y-5">
            {mode === "register" && (
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  name="name"
                  className="mt-2 h-12 rounded-lg bg-card"
                  placeholder="Shubham Singh"
                  required
                />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                className="mt-2 h-12 rounded-lg bg-card"
                placeholder="you@college.edu"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                className="mt-2 h-12 rounded-lg bg-card"
                placeholder="At least 6 characters"
                required
              />
            </div>
            <fieldset>
              <legend className="mb-3 text-sm font-semibold">I’m joining as</legend>
              <div className="grid grid-cols-2 gap-3">
                {roles.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setRole(id)}
                    className={
                      role === id
                        ? "flex items-center gap-3 rounded-lg border-2 border-secondary bg-accent p-3 text-left text-sm font-bold"
                        : "flex items-center gap-3 rounded-lg border bg-card p-3 text-left text-sm font-semibold text-muted-foreground hover:border-secondary/40"
                    }
                  >
                    <Icon className="size-4" />
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
            {error && (
              <p
                role="alert"
                className="rounded-lg bg-destructive/10 p-3 text-sm font-semibold text-destructive"
              >
                {error}
              </p>
            )}
            <Button type="submit" className="h-12 w-full rounded-full text-base" disabled={loading}>
              {loading
                ? "Preparing your workspace..."
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
              <ArrowRight />
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? "New to SkillBridge?" : "Already have an account?"}{" "}
            <Link
              to={mode === "login" ? "/register" : "/login"}
              className="font-bold text-secondary"
            >
              {mode === "login" ? "Create an account" : "Sign in"}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
