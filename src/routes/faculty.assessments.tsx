import { createFileRoute } from "@tanstack/react-router";
import { FacultyAssessmentsPage } from "@/components/faculty-pages";

export const Route = createFileRoute("/faculty/assessments")({
  head: () => ({
    meta: [
      { title: "Faculty Assessments — SkillBridge" },
      { name: "description", content: "Assessment attempts by students in your scope." },
      { property: "og:title", content: "Faculty Assessments — SkillBridge" },
      { property: "og:description", content: "Real AssessmentAttempt records for your students." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FacultyAssessmentsPage,
});
