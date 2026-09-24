import { createFileRoute } from "@tanstack/react-router";
import { CollegeFacultyPage } from "@/components/college-faculty-pages";
export const Route = createFileRoute("/college/faculty")({
  head: () => ({
    meta: [
      { title: "Faculty & Assignments — SkillBridge" },
      {
        name: "description",
        content: "Assign your college's students to their faculty members.",
      },
    ],
  }),
  component: CollegeFacultyPage,
});
