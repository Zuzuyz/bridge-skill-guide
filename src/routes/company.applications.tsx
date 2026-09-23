import { createFileRoute } from "@tanstack/react-router";
import { CompanyApplicationsPage } from "@/components/employer-pages";
export const Route = createFileRoute("/company/applications")({
  head: () => ({
    meta: [
      { title: "Applications — SkillBridge" },
      { name: "description", content: "Review and progress student applications." },
      { property: "og:title", content: "Applications — SkillBridge" },
      { property: "og:description", content: "Track candidates through your hiring funnel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CompanyApplicationsPage,
});
