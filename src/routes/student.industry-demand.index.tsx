import { createFileRoute } from "@tanstack/react-router";
import { getAllIndustryDemand } from "@/lib/industry-demand-server";
import { IndustryDemandExplorerPage } from "@/components/industry-demand-pages";

export const Route = createFileRoute("/student/industry-demand/")({
  loader: async () => {
    return await getAllIndustryDemand();
  },
  head: () => ({
    meta: [
      { title: "Industry Demand Explorer — SkillBridge" },
      {
        name: "description",
        content:
          "Explore industry-demand ratings and skill requirement benchmarks for tech careers.",
      },
      { property: "og:title", content: "Industry Demand Explorer — SkillBridge" },
      {
        property: "og:description",
        content:
          "Explore industry-demand ratings and skill requirement benchmarks for tech careers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IndustryDemandIndexComponent,
});

function IndustryDemandIndexComponent() {
  const data = Route.useLoaderData();
  return <IndustryDemandExplorerPage data={data} />;
}
