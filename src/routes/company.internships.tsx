import { createFileRoute } from "@tanstack/react-router";
import { CompanyInternshipsPage } from "@/components/employer-pages";
export const Route = createFileRoute("/company/internships")({
  head: () => ({
    meta: [
      { title: "Manage Internships — SkillBridge" },
      { name: "description", content: "Create and manage company internship opportunities." },
      { property: "og:title", content: "Manage Internships — SkillBridge" },
      { property: "og:description", content: "Publish skill-based internship roles." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CompanyInternshipsPage, // employer-pages (real data)
});
