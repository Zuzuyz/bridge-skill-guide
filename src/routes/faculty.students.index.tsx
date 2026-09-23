import { createFileRoute } from "@tanstack/react-router";
import { FacultyStudentsPage } from "@/components/faculty-pages";

export const Route = createFileRoute("/faculty/students/")({
  head: () => ({
    meta: [
      { title: "My Students — SkillBridge" },
      { name: "description", content: "Students you are authorized to mentor and support." },
      { property: "og:title", content: "My Students — SkillBridge" },
      { property: "og:description", content: "Readiness, skill gaps, projects, and applications." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FacultyStudentsPage,
});
