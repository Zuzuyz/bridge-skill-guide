import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/components/student-pages";
export const Route = createFileRoute("/student/profile")({
  head: () => ({
    meta: [
      { title: "Student Profile — SkillBridge" },
      { name: "description", content: "Manage your academic and career profile." },
      { property: "og:title", content: "Student Profile — SkillBridge" },
      {
        property: "og:description",
        content: "Keep your student identity and career goal current.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});
