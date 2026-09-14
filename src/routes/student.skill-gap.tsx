import { createFileRoute } from "@tanstack/react-router";
import { SkillGapAnalysisPage } from "@/components/skill-gap-pages";

export const Route = createFileRoute("/student/skill-gap")({
  head: () => ({
    meta: [
      { title: "Skill Gap & Readiness — SkillBridge" },
      {
        name: "description",
        content:
          "Career-specific, evidence-based skill gap and readiness analysis.",
      },
      { property: "og:title", content: "Skill Gap & Readiness — SkillBridge" },
      {
        property: "og:description",
        content:
          "See your strengths, improvement areas, and missing skills for your target career.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SkillGapAnalysisPage,
});
