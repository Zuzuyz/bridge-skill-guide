import { createFileRoute } from "@tanstack/react-router";
import { FacultyDashboardPage } from "@/components/faculty-pages";

export const Route = createFileRoute("/faculty/dashboard")({
  head: () => ({
    meta: [
      { title: "Faculty Dashboard — SkillBridge" },
      { name: "description", content: "Real-time overview of your authorized students' progress." },
      { property: "og:title", content: "Faculty Dashboard — SkillBridge" },
      { property: "og:description", content: "Monitor student skill gaps, readiness, and support needs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FacultyDashboardPage,
});
