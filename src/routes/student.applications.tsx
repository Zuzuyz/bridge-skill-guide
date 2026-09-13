import { createFileRoute } from "@tanstack/react-router";
import { ApplicationsPage } from "@/components/student-pages";
export const Route = createFileRoute("/student/applications")({
  head: () => ({
    meta: [
      { title: "Applications — SkillBridge" },
      { name: "description", content: "Track every internship application stage." },
      { property: "og:title", content: "Applications — SkillBridge" },
      { property: "og:description", content: "Follow applications from submission to selection." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ApplicationsPage,
});
