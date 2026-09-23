import { createFileRoute } from "@tanstack/react-router";
import { FacultyStudentDetailPage } from "@/components/faculty-pages";

export const Route = createFileRoute("/faculty/students/$id")({
  head: () => ({
    meta: [
      { title: "Student Progress — SkillBridge" },
      { name: "description", content: "A faculty-authorized view of one student's skills, gaps, projects, and roadmap." },
      { property: "og:title", content: "Student Progress — SkillBridge" },
      { property: "og:description", content: "Faculty view of a student's career progress." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return <FacultyStudentDetailPage studentProfileId={id} />;
}
