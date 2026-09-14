import { createFileRoute } from "@tanstack/react-router";
import { SkillPassportPage } from "@/components/student-pages";

export const Route = createFileRoute("/student/passport")({
  head: () => ({
    meta: [
      { title: "Verifiable Skill Passport — SkillBridge" },
      { name: "description", content: "Portable, evidence-backed skill credentials and verification audit." },
      { property: "og:title", content: "Verifiable Skill Passport — SkillBridge" },
      { property: "og:description", content: "Portable, evidence-backed skill credentials." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SkillPassportPage,
});
