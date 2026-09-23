import { createFileRoute } from "@tanstack/react-router";
import { StudentProjectsPage } from "@/components/student-projects-page";

export const Route = createFileRoute("/student/projects")({
  head: () => ({
    meta: [
      { title: "My Projects & Activities — SkillBridge" },
      {
        name: "description",
        content:
          "Track your submitted projects, practical evidence, verification status, and demonstrated skills.",
      },
    ],
  }),
  component: StudentProjectsPage,
});
