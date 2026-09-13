import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { SkillBuddyChat } from "@/components/skillbuddy";
export const Route = createFileRoute("/ai-assistant")({
  head: () => ({
    meta: [
      { title: "SkillBuddy AI — SkillBridge" },
      { name: "description", content: "Ask SkillBuddy about skills, readiness, and internships." },
      { property: "og:title", content: "SkillBuddy AI — SkillBridge" },
      { property: "og:description", content: "Your personalized career intelligence assistant." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AppShell title="SkillBuddy AI" eyebrow="Career intelligence assistant">
      <div className="mx-auto max-w-4xl">
        <SkillBuddyChat embedded />
      </div>
    </AppShell>
  ),
});
