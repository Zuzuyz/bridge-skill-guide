import { createFileRoute } from "@tanstack/react-router";
import { CollegeAnalyticsDashboard } from "@/components/college-analytics-pages";
export const Route = createFileRoute("/college/dashboard")({
  head: () => ({
    meta: [
      { title: "College Analytics — SkillBridge" },
      {
        name: "description",
        content: "Real skill, readiness, and outcome analytics for your college.",
      },
      { property: "og:title", content: "College Analytics — SkillBridge" },
      {
        property: "og:description",
        content:
          "Aggregated student, skill, skill-gap, readiness, demand, internship, project, and outcome analytics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CollegeAnalyticsDashboard,
});
