import { createFileRoute } from "@tanstack/react-router";
import { CollegeAnalyticsDashboard } from "@/components/college-analytics-pages";
export const Route = createFileRoute("/college/students")({
  head: () => ({
    meta: [
      { title: "Student Analytics — SkillBridge" },
      {
        name: "description",
        content: "Real aggregated student analytics for your college.",
      },
      { property: "og:title", content: "Student Analytics — SkillBridge" },
      {
        property: "og:description",
        content:
          "Aggregated student participation, skills, and readiness for your college.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CollegeAnalyticsDashboard,
});
