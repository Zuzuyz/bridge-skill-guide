import type { Application, CareerRole, Internship, RoadmapItem, Skill } from "@/types";

export const studentSkills: Skill[] = [
  { id: "python", name: "Python", score: 92, confidence: 98, demand: "High" },
  { id: "sql", name: "SQL", score: 81, confidence: 96, demand: "High" },
  { id: "react", name: "React", score: 74, confidence: 91, demand: "High" },
  { id: "ml", name: "Machine Learning", score: 58, confidence: 85, demand: "High" },
  { id: "aws", name: "AWS", score: 46, confidence: 78, demand: "Growing" },
];

export const extractedSkills: Skill[] = [
  { id: "python", name: "Python", score: 92, confidence: 98 },
  { id: "fastapi", name: "FastAPI", score: 86, confidence: 94 },
  { id: "numpy", name: "NumPy", score: 84, confidence: 93 },
  { id: "pandas", name: "Pandas", score: 88, confidence: 95 },
  { id: "sql", name: "SQL", score: 81, confidence: 96 },
  { id: "postgres", name: "PostgreSQL", score: 78, confidence: 91 },
  { id: "react", name: "React", score: 74, confidence: 89 },
  { id: "ml", name: "Machine Learning", score: 58, confidence: 85 },
  { id: "sklearn", name: "Scikit-Learn", score: 64, confidence: 87 },
  { id: "aws", name: "AWS", score: 46, confidence: 76 },
];

export const careers: CareerRole[] = [
  {
    id: "ai",
    title: "AI Engineer",
    requiredSkills: ["Python", "SQL", "Machine Learning", "AWS", "TensorFlow", "MLOps"],
  },
  {
    id: "data",
    title: "Data Scientist",
    requiredSkills: [
      "Python",
      "SQL",
      "Statistics",
      "Machine Learning",
      "Pandas",
      "Data Visualization",
    ],
  },
  {
    id: "frontend",
    title: "Frontend Engineer",
    requiredSkills: ["JavaScript", "TypeScript", "React", "CSS", "Testing", "Accessibility"],
  },
];

export const internships: Internship[] = [
  {
    id: "hyperscale-ai",
    role: "AI/ML Intern",
    company: "HyperScale AI",
    location: "Bengaluru",
    mode: "Hybrid",
    duration: "6 Months",
    stipend: "₹25,000/month",
    skills: ["Python", "SQL", "Machine Learning"],
    missing: ["AWS"],
    match: 92,
    verified: true,
    description:
      "Build production ML pipelines and evaluate next-generation recommendation systems with a senior applied AI team.",
  },
  {
    id: "quantum-data",
    role: "Data Science Intern",
    company: "Quantum Data Labs",
    location: "Pune",
    mode: "Remote",
    duration: "4 Months",
    stipend: "₹20,000/month",
    skills: ["Python", "Pandas", "SQL"],
    missing: ["Power BI"],
    match: 87,
    verified: true,
    description:
      "Turn customer and product data into clear experiments, dashboards, and predictive models.",
  },
  {
    id: "orbit-cloud",
    role: "Cloud Engineering Intern",
    company: "OrbitStack",
    location: "Hyderabad",
    mode: "On-site",
    duration: "6 Months",
    stipend: "₹22,000/month",
    skills: ["Python", "AWS", "SQL"],
    missing: ["Docker", "Kubernetes"],
    match: 78,
    verified: true,
    description:
      "Support scalable infrastructure, automation, observability, and reliable cloud deployments.",
  },
];

export const roadmap: RoadmapItem[] = [
  [
    "Strengthen Python",
    "complete",
    "Intermediate",
    "2 weeks",
    "Python Performance course",
    "Build an async API",
  ],
  [
    "Learn Machine Learning",
    "current",
    "Intermediate",
    "4 weeks",
    "Applied ML pathway",
    "Predict student outcomes",
  ],
  [
    "Learn Deep Learning",
    "upcoming",
    "Advanced",
    "5 weeks",
    "Neural Networks specialization",
    "Image classifier",
  ],
  [
    "Learn TensorFlow / PyTorch",
    "upcoming",
    "Advanced",
    "4 weeks",
    "Framework labs",
    "Deploy a vision model",
  ],
  [
    "Learn MLOps",
    "upcoming",
    "Advanced",
    "4 weeks",
    "MLOps foundations",
    "Model monitoring pipeline",
  ],
  [
    "Build AI Projects",
    "upcoming",
    "Intermediate",
    "6 weeks",
    "Project studio",
    "AI portfolio capstone",
  ],
  [
    "Apply for AI Internships",
    "upcoming",
    "Focused",
    "Ongoing",
    "SkillBridge opportunities",
    "Polish portfolio and pitch",
  ],
].map(
  (item, index) =>
    ({
      id: `step-${index + 1}`,
      step: index + 1,
      skill: item[0],
      status: item[1],
      difficulty: item[2],
      duration: item[3],
      resource: item[4],
      project: item[5],
    }) as RoadmapItem,
);

export const initialApplications: Application[] = [
  {
    id: "a1",
    internshipId: "quantum-data",
    role: "Data Science Intern",
    company: "Quantum Data Labs",
    status: "Under Review",
    appliedAt: "08 Sep 2026",
  },
  {
    id: "a2",
    internshipId: "orbit-cloud",
    role: "Cloud Engineering Intern",
    company: "OrbitStack",
    status: "Shortlisted",
    appliedAt: "03 Sep 2026",
  },
];

export const collegeChartData = [
  { name: "AI/ML", students: 86, demand: 94 },
  { name: "Web", students: 74, demand: 82 },
  { name: "Cloud", students: 48, demand: 85 },
  { name: "Data", students: 68, demand: 88 },
  { name: "Security", students: 41, demand: 78 },
];

export const candidates = [
  {
    id: "c1",
    name: "Aarav Mehta",
    college: "IIT Delhi",
    role: "AI Engineer",
    readiness: 88,
    match: 94,
    skills: ["Python", "PyTorch", "MLOps"],
    projects: 5,
  },
  {
    id: "c2",
    name: "Meera Nair",
    college: "BITS Pilani",
    role: "Data Scientist",
    readiness: 84,
    match: 91,
    skills: ["Python", "SQL", "Pandas"],
    projects: 4,
  },
  {
    id: "c3",
    name: "Rohan Das",
    college: "NIT Trichy",
    role: "ML Engineer",
    readiness: 79,
    match: 86,
    skills: ["Python", "AWS", "Scikit-Learn"],
    projects: 6,
  },
];
