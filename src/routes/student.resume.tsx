import { createFileRoute } from "@tanstack/react-router";
import { ResumePage } from "@/components/student-pages";
export const Route = createFileRoute("/student/resume")({
  head: () => ({
    meta: [
      { title: "Resume Analysis — SkillBridge" },
      { name: "description", content: "Extract skills and evidence from your resume." },
      { property: "og:title", content: "Resume Analysis — SkillBridge" },
      { property: "og:description", content: "Turn a resume into a live skill profile." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResumePage,
});
