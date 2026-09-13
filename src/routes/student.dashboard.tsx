import { createFileRoute } from "@tanstack/react-router";
import { StudentDashboard } from "@/components/student-pages";
export const Route = createFileRoute("/student/dashboard")({
  head: () => ({
    meta: [
      { title: "Student Dashboard — SkillBridge" },
      { name: "description", content: "Your personalized career readiness command center." },
      { property: "og:title", content: "Student Dashboard — SkillBridge" },
      { property: "og:description", content: "Track skills, gaps, roadmap, and opportunities." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StudentDashboard,
});
