import { createFileRoute } from "@tanstack/react-router";
import { FacultyInterventionsPage } from "@/components/faculty-pages";

export const Route = createFileRoute("/faculty/interventions")({
  head: () => ({
    meta: [
      { title: "Faculty Interventions — SkillBridge" },
      { name: "description", content: "Recommend existing programs and keep private support notes." },
      { property: "og:title", content: "Faculty Interventions — SkillBridge" },
      { property: "og:description", content: "Support tools backed by existing SkillBridge entities." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FacultyInterventionsPage,
});
