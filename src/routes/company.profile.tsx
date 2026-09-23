import { createFileRoute } from "@tanstack/react-router";
import { CompanyProfilePage } from "@/components/employer-pages";
export const Route = createFileRoute("/company/profile")({
  head: () => ({
    meta: [
      { title: "Company Profile — SkillBridge" },
      { name: "description", content: "Manage your company identity on SkillBridge." },
      { property: "og:title", content: "Company Profile — SkillBridge" },
      { property: "og:description", content: "Company details, industry, and verification." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CompanyProfilePage,
});
