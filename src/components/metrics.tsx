import { CheckCircle2 } from "lucide-react";
import type { Skill } from "@/types";

export function ScoreRing({
  score,
  label = "Industry Readiness",
  size = "lg",
}: {
  score: number;
  label?: string;
  size?: "sm" | "lg";
}) {
  const radius = 42;
  const dash = 2 * Math.PI * radius;
  return (
    <div className="flex flex-col items-center text-center">
      <span className="mb-2 text-xs font-bold uppercase text-muted-foreground">{label}</span>
      <div className={size === "lg" ? "relative size-36" : "relative size-24"}>
        <svg
          className="size-full -rotate-90"
          viewBox="0 0 100 100"
          aria-label={`${score}% ${label}`}
        >
          <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--muted)" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={dash}
            strokeDashoffset={dash * (1 - score / 100)}
          />
        </svg>
        <strong className="absolute inset-0 flex items-center justify-center font-display text-3xl">
          {score}%
        </strong>
      </div>
    </div>
  );
}

export function SkillBars({ skills, compact = false }: { skills: Skill[]; compact?: boolean }) {
  return (
    <div className="space-y-4">
      {skills.map((skill, index) => (
        <div key={skill.id}>
          <div className="mb-1.5 flex items-center justify-between gap-4 text-sm">
            <span className="font-semibold">{skill.name}</span>
            <span className="font-bold text-muted-foreground">{skill.score}%</span>
          </div>
          <div
            className={
              compact
                ? "h-2 overflow-hidden rounded-full bg-muted"
                : "h-2.5 overflow-hidden rounded-full bg-muted"
            }
          >
            <div
              className={
                index % 3 === 0
                  ? "h-full rounded-full bg-primary"
                  : index % 3 === 1
                    ? "h-full rounded-full bg-secondary"
                    : "h-full rounded-full bg-success"
              }
              style={{ width: `${skill.score}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon?: React.ReactNode;
}) {
  return (
    <article className="rounded-xl border bg-card p-5 soft-shadow">
      <div className="mb-5 flex items-center justify-between text-muted-foreground">
        <span className="text-xs font-bold uppercase">{label}</span>
        {icon}
      </div>
      <strong className="font-display text-3xl">{value}</strong>
      <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
        <CheckCircle2 className="size-3.5 text-success" />
        {detail}
      </p>
    </article>
  );
}
