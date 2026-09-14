import { createFileRoute } from "@tanstack/react-router";
import { getAssessmentById } from "@/lib/assessment-server";
import { AssessmentTakingPage } from "@/components/assessment-pages";

export const Route = createFileRoute("/student/assessments/$id")({
  loader: async ({ params }) => {
    return await getAssessmentById({ data: { id: params.id } });
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title || "Assessment"} — SkillBridge Verification` },
      { name: "description", content: "Demonstrate skill proficiency through standardized assessment." },
      { property: "og:title", content: `${loaderData?.title || "Assessment"} — SkillBridge` },
      { property: "og:type", content: "website" },
    ],
  }),
  component: AssessmentTakingRouteComponent,
});

function AssessmentTakingRouteComponent() {
  const data = Route.useLoaderData();
  return <AssessmentTakingPage data={data} />;
}
