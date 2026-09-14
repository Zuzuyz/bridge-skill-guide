import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/server/db";
import { getAuthenticatedStudentProfile } from "@/server/auth-context";
import { generateCareerRoadmap } from "@/server/gemini";

/* =========================================================
   LOCAL FALLBACK ROADMAP
   Used when Gemini quota is exceeded or the API is unavailable.
========================================================= */

const fallbackRoadmaps: Record<string, Array<{
  step: number;
  skill: string;
  status: "complete" | "current" | "upcoming";
  difficulty: string;
  duration: string;
  resource: string;
  project: string;
}>> = {
  "AI Engineer": [
    { step: 1, skill: "Python & NumPy", status: "current", difficulty: "Beginner", duration: "3 weeks", resource: "Work through Python for Data Science Handbook chapters 1–3.", project: "Build a data cleaning pipeline for a CSV dataset." },
    { step: 2, skill: "Machine Learning Fundamentals", status: "upcoming", difficulty: "Intermediate", duration: "4 weeks", resource: "Study Andrew Ng's Machine Learning Specialization.", project: "Train a classification model on a public dataset and evaluate accuracy." },
    { step: 3, skill: "TensorFlow / PyTorch", status: "upcoming", difficulty: "Intermediate", duration: "3 weeks", resource: "Complete TensorFlow Developer Certificate course.", project: "Build and deploy an image classification neural network." },
    { step: 4, skill: "SQL & Data Pipelines", status: "upcoming", difficulty: "Beginner", duration: "2 weeks", resource: "Practice with Mode Analytics SQL tutorials.", project: "Write analytics queries on a PostgreSQL dataset." },
    { step: 5, skill: "AWS / Cloud Deployment", status: "upcoming", difficulty: "Intermediate", duration: "3 weeks", resource: "AWS Cloud Practitioner Essentials course.", project: "Deploy a trained ML model as a REST API on AWS Lambda." },
    { step: 6, skill: "MLOps & Monitoring", status: "upcoming", difficulty: "Advanced", duration: "4 weeks", resource: "Study MLflow, DVC and Weights & Biases documentation.", project: "Build a full MLOps pipeline: data versioning, model registry, CI/CD." },
    { step: 7, skill: "Internship Preparation", status: "upcoming", difficulty: "Intermediate", duration: "2 weeks", resource: "Practice LeetCode ML/Python problems and system design for AI roles.", project: "Create a portfolio GitHub repo showcasing your three best projects." },
  ],
  "Data Scientist": [
    { step: 1, skill: "Python & Pandas", status: "current", difficulty: "Beginner", duration: "3 weeks", resource: "Work through Python for Data Science Handbook.", project: "Analyze a public dataset end-to-end with Pandas and Matplotlib." },
    { step: 2, skill: "Statistics & Probability", status: "upcoming", difficulty: "Intermediate", duration: "3 weeks", resource: "Statistics and Probability on Khan Academy.", project: "Run hypothesis tests on a real dataset and document findings." },
    { step: 3, skill: "Machine Learning", status: "upcoming", difficulty: "Intermediate", duration: "4 weeks", resource: "Scikit-learn documentation and tutorials.", project: "Build and tune a regression model and publish results." },
    { step: 4, skill: "Data Visualization", status: "upcoming", difficulty: "Beginner", duration: "2 weeks", resource: "Plotly and Seaborn tutorials.", project: "Create an interactive dashboard for a public dataset." },
    { step: 5, skill: "SQL & Databases", status: "upcoming", difficulty: "Beginner", duration: "2 weeks", resource: "Mode Analytics SQL tutorials.", project: "Write complex SQL queries to answer business questions." },
    { step: 6, skill: "Cloud & Big Data", status: "upcoming", difficulty: "Intermediate", duration: "3 weeks", resource: "Google BigQuery and AWS Athena tutorials.", project: "Run analytics on a large dataset using BigQuery." },
    { step: 7, skill: "Internship Preparation", status: "upcoming", difficulty: "Intermediate", duration: "2 weeks", resource: "Practice case studies and data science interview problems.", project: "Publish a Kaggle notebook showcasing your end-to-end analysis." },
  ],
  "Frontend Engineer": [
    { step: 1, skill: "JavaScript ES6+", status: "current", difficulty: "Beginner", duration: "3 weeks", resource: "JavaScript.info — modern JavaScript tutorial.", project: "Build a vanilla JavaScript app — a todo list with local storage." },
    { step: 2, skill: "TypeScript", status: "upcoming", difficulty: "Intermediate", duration: "2 weeks", resource: "TypeScript Handbook official documentation.", project: "Port your JS app to TypeScript with strict types." },
    { step: 3, skill: "React", status: "upcoming", difficulty: "Intermediate", duration: "4 weeks", resource: "React official docs and beta tutorial.", project: "Build a React app consuming a public REST API." },
    { step: 4, skill: "CSS & Tailwind", status: "upcoming", difficulty: "Beginner", duration: "2 weeks", resource: "Tailwind CSS documentation.", project: "Style your React app with Tailwind — responsive and accessible." },
    { step: 5, skill: "Testing", status: "upcoming", difficulty: "Intermediate", duration: "2 weeks", resource: "Vitest and React Testing Library docs.", project: "Write unit and integration tests for your React components." },
    { step: 6, skill: "Accessibility & Performance", status: "upcoming", difficulty: "Intermediate", duration: "2 weeks", resource: "web.dev Accessibility and Performance guides.", project: "Audit your app with Lighthouse and fix all critical issues." },
    { step: 7, skill: "Internship Preparation", status: "upcoming", difficulty: "Intermediate", duration: "2 weeks", resource: "Practice frontend interview questions from Greatfrontend.", project: "Polish your GitHub profile and deploy your best project to Vercel." },
  ],
};

function getFallbackRoadmap(targetRole: string) {
  return (
    fallbackRoadmaps[targetRole] ??
    fallbackRoadmaps["AI Engineer"] ??
    []
  );
}

export const generateStudentRoadmap = createServerFn({
  method: "POST",
}).handler(async () => {
  const student = await getAuthenticatedStudentProfile({
    user: true,
    skills: {
      include: {
        skill: true,
      },
    },
    skillGaps: {
      include: {
        skill: true,
      },
    },
  });

  if (!student) {
    throw new Error(
      "No student profile found. Please register a student account first.",
    );
  }

  const targetRole = student.targetRole ?? "AI Engineer";

  const gaps = student.skillGaps.map((gap) => ({
    skill: gap.skill.name,
    score: gap.score,
    status: gap.status,
  }));

  /* -------------------------------------------------------
     Generate roadmap via Gemini.
     If Gemini is unavailable (quota exceeded, network error, etc.)
     fall back to the local hardcoded roadmap so the page
     always renders something useful.
  ------------------------------------------------------- */

  let roadmapItems: Array<{
    step: number;
    skill: string;
    status: string;
    difficulty?: string | null;
    duration?: string | null;
    resource?: string | null;
    project?: string | null;
  }>;

  try {
    const roadmap = await generateCareerRoadmap({
      targetRole,
      gaps,
    });

    roadmapItems = roadmap.items;

    console.log("[SkillBridge] Gemini roadmap generated successfully.");
  } catch (error) {
    console.warn(
      "[SkillBridge] Gemini unavailable. Using local fallback roadmap.",
      error instanceof Error ? error.message : error,
    );

    roadmapItems = getFallbackRoadmap(targetRole);
  }

  /*
   * Remove previous roadmap generated for this student.
   */
  await prisma.roadmapItem.deleteMany({
    where: {
      studentId: student.id,
    },
  });

  /*
   * Save roadmap into PostgreSQL.
   */
  for (const item of roadmapItems) {
    await prisma.roadmapItem.create({
      data: {
        studentId: student.id,
        step: item.step,
        skill: item.skill,
        status: convertStatus(item.status),
        difficulty: item.difficulty ?? null,
        duration: item.duration ?? null,
        resource: item.resource ?? null,
        project: item.project ?? null,
      },
    });
  }

  const savedRoadmap = await prisma.roadmapItem.findMany({
    where: {
      studentId: student.id,
    },
    orderBy: {
      step: "asc",
    },
  });

  return {
    targetRole,
    roadmap: savedRoadmap.map((item) => ({
      id: item.id,
      step: item.step,
      skill: item.skill,
      status: item.status,
      difficulty: item.difficulty,
      duration: item.duration,
      resource: item.resource,
      project: item.project,
    })),
  };
});


function convertStatus(status: string) {
  if (status === "complete" || status === "COMPLETE") {
    return "COMPLETE" as const;
  }

  if (status === "current" || status === "CURRENT") {
    return "CURRENT" as const;
  }

  return "UPCOMING" as const;
}