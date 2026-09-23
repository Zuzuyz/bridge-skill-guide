import { createFileRoute } from "@tanstack/react-router";
import { FacultyInternshipsPage } from "@/components/faculty-pages";

export const Route = createFileRoute("/faculty/internships")({
  head: () => ({
    meta: [
      { title: "Faculty Internships — SkillBridge" },
      { name: "description", content: "Internship applications from students in your scope." },
      { property: "og:title", content: "Faculty Internships — SkillBridge" },
      { property: "og:description", content: "Real Application records for your students." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FacultyInternshipsPage,
});
