import { createFileRoute } from "@tanstack/react-router";
import { RoadmapPage } from "@/components/student-pages";
export const Route = createFileRoute("/student/roadmap")({
  head: () => ({
    meta: [
      { title: "Career Roadmap — SkillBridge" },
      { name: "description", content: "Follow your personalized career roadmap based on your selected career direction and skill gaps." },
      { property: "og:title", content: "Career Roadmap — SkillBridge" },
      {
        property: "og:description",
        content: "Personalized learning milestones, resources, and portfolio projects.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RoadmapPage,
});
