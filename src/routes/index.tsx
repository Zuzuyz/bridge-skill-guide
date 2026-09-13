import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/landing-page";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "SkillBridge — Academia × Industry" }, { name: "description", content: "AI-powered skill mapping, career roadmaps, internships, and placement intelligence." }, { property: "og:title", content: "SkillBridge — Academia × Industry" }, { property: "og:description", content: "Build industry-ready skills and connect with verified opportunities." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: LandingPage,
});
