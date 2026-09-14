import { createFileRoute } from "@tanstack/react-router";
import { getCareers } from "@/lib/career-server";
import { CareersCatalogPage } from "@/components/career-pages";

export const Route = createFileRoute("/student/careers/")({
  loader: async () => {
    return await getCareers();
  },
  head: () => ({
    meta: [
      { title: "Career Direction & Requirements — SkillBridge" },
      { name: "description", content: "Select your target career direction and explore normalized skill requirements." },
      { property: "og:title", content: "Career Direction & Requirements — SkillBridge" },
      { property: "og:description", content: "Personalize your SkillBridge journey around your target career." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CareersIndexComponent,
});

function CareersIndexComponent() {
  const data = Route.useLoaderData();
  return <CareersCatalogPage data={data} />;
}
