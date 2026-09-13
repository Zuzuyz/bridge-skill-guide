import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/components/auth-page";
export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Join SkillBridge" },
      {
        name: "description",
        content: "Create a student, company, college, or admin SkillBridge account.",
      },
      { property: "og:title", content: "Join SkillBridge" },
      { property: "og:description", content: "Start your personalized SkillBridge journey." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AuthPage mode="register" />,
});
