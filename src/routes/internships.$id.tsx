import { createFileRoute } from "@tanstack/react-router";
import { InternshipDetail } from "@/components/internship-pages";

export const Route = createFileRoute("/internships/$id")({
  head: () => ({
    meta: [
      { title: "Internship Details — SkillBridge" },
      {
        name: "description",
        content:
          "Review opportunity details and your skill match.",
      },
      {
        property: "og:title",
        content: "Internship Details — SkillBridge",
      },
      {
        property: "og:description",
        content:
          "See requirements, match insights, and apply.",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        name: "twitter:card",
        content: "summary",
      },
    ],
  }),

  component: InternshipDetailsRoute,
});

function InternshipDetailsRoute() {
  const params = Route.useParams();

  console.log("Route params:", params);

  return <InternshipDetail id={params.id} />;
}