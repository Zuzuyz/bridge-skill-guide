import { createFileRoute } from "@tanstack/react-router";
import { FacultyProjectsPage } from "@/components/faculty-pages";

export const Route = createFileRoute("/faculty/projects")({
  head: () => ({
    meta: [
      { title: "Faculty Projects — SkillBridge" },
      { name: "description", content: "Project submissions from students in your scope." },
      { property: "og:title", content: "Faculty Projects — SkillBridge" },
      { property: "og:description", content: "Real ProjectSubmission records for your students." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FacultyProjectsPage,
});
