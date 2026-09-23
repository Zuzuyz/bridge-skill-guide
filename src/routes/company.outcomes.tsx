import { createFileRoute } from "@tanstack/react-router";
import { CompanyOutcomesPage } from "@/components/employer-pages";
export const Route = createFileRoute("/company/outcomes")({
  head: () => ({
    meta: [
      { title: "Outcomes — SkillBridge" },
      { name: "description", content: "Real hiring outcomes from your opportunities." },
      { property: "og:title", content: "Outcomes — SkillBridge" },
      { property: "og:description", content: "Track interviews, offers, and selections." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CompanyOutcomesPage,
});
