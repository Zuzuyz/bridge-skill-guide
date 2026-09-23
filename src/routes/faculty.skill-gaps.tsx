import { createFileRoute } from "@tanstack/react-router";
import { FacultySkillGapsPage } from "@/components/faculty-pages";

export const Route = createFileRoute("/faculty/skill-gaps")({
  head: () => ({
    meta: [
      { title: "Faculty Skill Gaps — SkillBridge" },
      { name: "description", content: "Aggregated Phase 7 skill gaps for your authorized students." },
      { property: "og:title", content: "Faculty Skill Gaps — SkillBridge" },
      { property: "og:description", content: "Where your students need the most support." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FacultySkillGapsPage,
});
