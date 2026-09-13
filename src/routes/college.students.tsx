import { createFileRoute } from "@tanstack/react-router";
import { CollegeStudentsPage } from "@/components/organization-pages";
export const Route = createFileRoute("/college/students")({
  head: () => ({
    meta: [
      { title: "Student Analytics — SkillBridge" },
      { name: "description", content: "Explore cohort readiness and skill distribution." },
      { property: "og:title", content: "Student Analytics — SkillBridge" },
      {
        property: "og:description",
        content: "Analyze readiness and missing skills across students.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CollegeStudentsPage,
});
