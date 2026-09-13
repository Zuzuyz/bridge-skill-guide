import { createFileRoute } from "@tanstack/react-router";
import { SkillsPage } from "@/components/student-pages";
export const Route = createFileRoute("/student/skills")({
  head: () => ({
    meta: [
      { title: "AI Skill Profile — SkillBridge" },
      { name: "description", content: "Explore your AI-mapped skills and evidence." },
      { property: "og:title", content: "AI Skill Profile — SkillBridge" },
      { property: "og:description", content: "Understand your verified technical capabilities." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SkillsPage,
});
