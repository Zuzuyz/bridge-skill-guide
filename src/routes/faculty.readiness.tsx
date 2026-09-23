import { createFileRoute } from "@tanstack/react-router";
import { FacultyReadinessPage } from "@/components/faculty-pages";

export const Route = createFileRoute("/faculty/readiness")({
  head: () => ({
    meta: [
      { title: "Career Readiness — SkillBridge" },
      { name: "description", content: "Persisted readiness for students in your scope." },
      { property: "og:title", content: "Career Readiness — SkillBridge" },
      { property: "og:description", content: "Existing readiness engine output per student." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FacultyReadinessPage,
});
