import { createFileRoute } from "@tanstack/react-router";
import { CompanyCandidateDetailPage } from "@/components/employer-pages";

export const Route = createFileRoute("/company/candidates/$id")({
  head: () => ({
    meta: [
      { title: "Candidate Review — SkillBridge" },
      { name: "description", content: "Review a candidate's verified skills, projects, and matching." },
      { property: "og:title", content: "Candidate Review — SkillBridge" },
      { property: "og:description", content: "Explainable candidate matching and Skill Passport review." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return <CompanyCandidateDetailPage candidateProfileId={id} />;
}
