import { createFileRoute } from "@tanstack/react-router";
import { CompanyCandidatesPage } from "@/components/employer-pages";
export const Route = createFileRoute("/company/candidates")({
  head: () => ({
    meta: [
      { title: "Candidate Discovery — SkillBridge" },
      { name: "description", content: "Find students through verified skills and readiness." },
      { property: "og:title", content: "Candidate Discovery — SkillBridge" },
      { property: "og:description", content: "Search and shortlist skills-matched candidates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CompanyCandidatesPage,
});
