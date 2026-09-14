import { createFileRoute } from "@tanstack/react-router";
import { SkillDevelopmentPage } from "@/components/skill-development-page";

export const Route = createFileRoute("/student/skill-development")({
  head: () => ({
    meta: [
      { title: "Skill Development & Verification Hub — SkillBridge" },
      { name: "description", content: "Assess your verified skills, map industry benchmarks, and grow with curated programs." },
      { property: "og:title", content: "Skill Development & Verification Hub — SkillBridge" },
      {
        property: "og:description",
        content: "Adaptive assessment, Skill Wallet, and placement readiness programs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SkillDevelopmentPage,
});
