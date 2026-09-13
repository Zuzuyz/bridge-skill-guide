import { createFileRoute } from "@tanstack/react-router";
import { CollegeDashboard } from "@/components/organization-pages";
export const Route = createFileRoute("/college/dashboard")({
  head: () => ({
    meta: [
      { title: "College Dashboard — SkillBridge" },
      { name: "description", content: "Cohort skills, readiness, and placement intelligence." },
      { property: "og:title", content: "College Dashboard — SkillBridge" },
      {
        property: "og:description",
        content: "Benchmark curricula and improve placement outcomes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CollegeDashboard,
});
