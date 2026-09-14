import { createFileRoute } from "@tanstack/react-router";
import { getAvailableAssessments } from "@/lib/assessment-server";
import { AssessmentsCatalogPage } from "@/components/assessment-pages";

export const Route = createFileRoute("/student/assessments/")({
  loader: async () => {
    return await getAvailableAssessments();
  },
  head: () => ({
    meta: [
      { title: "Skill Assessments & Verification — SkillBridge" },
      { name: "description", content: "Validate your skills through rigorous technical assessments to earn verified status." },
      { property: "og:title", content: "Skill Assessments & Verification — SkillBridge" },
      { property: "og:description", content: "Demonstrate hands-on skill proficiency and earn Assessment Verified evidence." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AssessmentIndexComponent,
});

function AssessmentIndexComponent() {
  const data = Route.useLoaderData();
  return <AssessmentsCatalogPage data={data} />;
}
