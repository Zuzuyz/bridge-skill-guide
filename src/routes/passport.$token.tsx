import { createFileRoute } from "@tanstack/react-router";
import { PublicPassportView } from "@/components/passport-public";

export const Route = createFileRoute("/passport/$token")({
  head: () => ({
    meta: [
      { title: "Verified Skill Passport — SkillBridge" },
      {
        name: "description",
        content: "A portable, evidence-backed skill credential shared via SkillBridge.",
      },
      { property: "og:title", content: "Verified Skill Passport — SkillBridge" },
      {
        property: "og:description",
        content: "A portable, evidence-backed skill credential shared via SkillBridge.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PublicPassportRoute,
});

function PublicPassportRoute() {
  const { token } = Route.useParams();
  return <PublicPassportView token={token} />;
}
