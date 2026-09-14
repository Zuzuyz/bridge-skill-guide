import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Normalized Career Catalog Seed Data (Phase 5A)
 * Maps 22 careers across 7 core categories to normalized Skill taxonomy with requirement importance (1-5).
 */
const CAREER_CATALOG = [
  // ---------------------------------------------------------------------------
  // 1. AI / Machine Learning
  // ---------------------------------------------------------------------------
  {
    title: "AI Engineer",
    slug: "ai-engineer",
    category: "AI / Machine Learning",
    description:
      "Designs, builds, evaluates, and deploys AI-powered systems and generative LLM models using machine learning, software engineering, and scalable data processing techniques.",
    skills: [
      { name: "Python", importance: 5 },
      { name: "Machine Learning", importance: 5 },
      { name: "Gemini AI", importance: 4 },
      { name: "Deep Learning", importance: 4 },
      { name: "PyTorch", importance: 4 },
      { name: "TensorFlow", importance: 3 },
      { name: "FastAPI", importance: 3 },
      { name: "SQL", importance: 3 },
      { name: "Docker", importance: 3 },
      { name: "MLOps", importance: 3 },
      { name: "AWS", importance: 2 },
    ],
  },
  {
    title: "Machine Learning Engineer",
    slug: "machine-learning-engineer",
    category: "AI / Machine Learning",
    description:
      "Researches, constructs, and optimizes production-grade predictive models and statistical algorithms, ensuring low-latency inference and scalable model infrastructure.",
    skills: [
      { name: "Python", importance: 5 },
      { name: "Machine Learning", importance: 5 },
      { name: "Scikit-Learn", importance: 5 },
      { name: "PyTorch", importance: 4 },
      { name: "NumPy", importance: 4 },
      { name: "Pandas", importance: 4 },
      { name: "Model Evaluation", importance: 4 },
      { name: "Feature Engineering", importance: 4 },
      { name: "MLOps", importance: 4 },
      { name: "SQL", importance: 3 },
      { name: "Docker", importance: 3 },
    ],
  },
  {
    title: "Data Scientist",
    slug: "data-scientist",
    category: "AI / Machine Learning",
    description:
      "Transforms raw enterprise datasets into actionable insights using statistical modeling, hypothesis testing, exploratory data analysis, and predictive algorithms.",
    skills: [
      { name: "Python", importance: 5 },
      { name: "SQL", importance: 5 },
      { name: "Pandas", importance: 5 },
      { name: "NumPy", importance: 4 },
      { name: "Scikit-Learn", importance: 4 },
      { name: "Machine Learning", importance: 4 },
      { name: "Model Evaluation", importance: 4 },
      { name: "Feature Engineering", importance: 3 },
      { name: "Big Data", importance: 3 },
      { name: "PostgreSQL", importance: 3 },
    ],
  },
  {
    title: "NLP Engineer",
    slug: "nlp-engineer",
    category: "AI / Machine Learning",
    description:
      "Specializes in processing and understanding human language through natural language processing pipelines, transformer architectures, tokenization, and text embedding models.",
    skills: [
      { name: "Python", importance: 5 },
      { name: "Machine Learning", importance: 5 },
      { name: "Deep Learning", importance: 4 },
      { name: "PyTorch", importance: 4 },
      { name: "Gemini AI", importance: 4 },
      { name: "NumPy", importance: 3 },
      { name: "Pandas", importance: 3 },
      { name: "REST APIs", importance: 3 },
      { name: "FastAPI", importance: 3 },
    ],
  },
  {
    title: "Computer Vision Engineer",
    slug: "computer-vision-engineer",
    category: "AI / Machine Learning",
    description:
      "Builds algorithms and convolutional neural networks that enable computers to analyze, process, and derive high-level understanding from digital images and video streams.",
    skills: [
      { name: "Python", importance: 5 },
      { name: "PyTorch", importance: 5 },
      { name: "Deep Learning", importance: 5 },
      { name: "TensorFlow", importance: 4 },
      { name: "Machine Learning", importance: 4 },
      { name: "NumPy", importance: 4 },
      { name: "C++", importance: 3 },
      { name: "Docker", importance: 3 },
    ],
  },

  // ---------------------------------------------------------------------------
  // 2. Software Development
  // ---------------------------------------------------------------------------
  {
    title: "Frontend Engineer",
    slug: "frontend-engineer",
    category: "Software Development",
    description:
      "Architects and develops responsive, high-performance web user interfaces using modern Component-based frameworks, state management, and web platform standards.",
    skills: [
      { name: "JavaScript", importance: 5 },
      { name: "TypeScript", importance: 5 },
      { name: "React", importance: 5 },
      { name: "HTML", importance: 5 },
      { name: "CSS", importance: 5 },
      { name: "Tailwind CSS", importance: 4 },
      { name: "REST APIs", importance: 4 },
      { name: "Git", importance: 3 },
      { name: "GitHub", importance: 3 },
      { name: "VS Code", importance: 3 },
    ],
  },
  {
    title: "Backend Engineer",
    slug: "backend-engineer",
    category: "Software Development",
    description:
      "Designs scalable server-side systems, RESTful microservices, database schemas, object-relational mappings, and security authentication mechanisms.",
    skills: [
      { name: "Python", importance: 5 },
      { name: "Node.js", importance: 5 },
      { name: "FastAPI", importance: 4 },
      { name: "SQL", importance: 5 },
      { name: "PostgreSQL", importance: 4 },
      { name: "REST APIs", importance: 5 },
      { name: "Prisma", importance: 4 },
      { name: "Docker", importance: 3 },
      { name: "Git", importance: 3 },
      { name: "Data Structures", importance: 4 },
    ],
  },
  {
    title: "Full-Stack Developer",
    slug: "full-stack-developer",
    category: "Software Development",
    description:
      "Builds complete end-to-end web applications, handling front-end user experience, back-end web services, database architecture, and deployment pipelines.",
    skills: [
      { name: "React", importance: 5 },
      { name: "TypeScript", importance: 5 },
      { name: "Node.js", importance: 5 },
      { name: "Python", importance: 4 },
      { name: "SQL", importance: 4 },
      { name: "PostgreSQL", importance: 4 },
      { name: "REST APIs", importance: 4 },
      { name: "Tailwind CSS", importance: 3 },
      { name: "Prisma", importance: 3 },
      { name: "Git", importance: 3 },
      { name: "Docker", importance: 3 },
    ],
  },
  {
    title: "Mobile App Developer",
    slug: "mobile-app-developer",
    category: "Software Development",
    description:
      "Creates native and cross-platform mobile applications optimized for mobile devices, touch interactions, offline sync, and app store deployment.",
    skills: [
      { name: "React", importance: 5 },
      { name: "TypeScript", importance: 5 },
      { name: "JavaScript", importance: 5 },
      { name: "REST APIs", importance: 4 },
      { name: "Git", importance: 3 },
      { name: "HTML", importance: 3 },
      { name: "CSS", importance: 3 },
    ],
  },

  // ---------------------------------------------------------------------------
  // 3. Data
  // ---------------------------------------------------------------------------
  {
    title: "Data Analyst",
    slug: "data-analyst",
    category: "Data",
    description:
      "Queries, cleans, and analyzes organizational data to create dashboards, executive summaries, trend analyses, and key performance metric reports.",
    skills: [
      { name: "SQL", importance: 5 },
      { name: "Python", importance: 4 },
      { name: "Pandas", importance: 4 },
      { name: "PostgreSQL", importance: 4 },
      { name: "MySQL", importance: 4 },
      { name: "DBMS", importance: 4 },
      { name: "Chart.js", importance: 3 },
      { name: "NumPy", importance: 3 },
    ],
  },
  {
    title: "Data Engineer",
    slug: "data-engineer",
    category: "Data",
    description:
      "Builds robust data extraction, transformation, and loading (ETL) pipelines, data warehouses, and streaming platforms to deliver clean datasets at scale.",
    skills: [
      { name: "Python", importance: 5 },
      { name: "SQL", importance: 5 },
      { name: "PostgreSQL", importance: 5 },
      { name: "Big Data", importance: 5 },
      { name: "Docker", importance: 4 },
      { name: "AWS", importance: 4 },
      { name: "FastAPI", importance: 3 },
      { name: "DBMS", importance: 3 },
    ],
  },
  {
    title: "Business Intelligence Analyst",
    slug: "business-intelligence-analyst",
    category: "Data",
    description:
      "Translates complex business needs into analytical solutions, reporting models, operational dashboards, and data-driven strategic recommendations.",
    skills: [
      { name: "SQL", importance: 5 },
      { name: "DBMS", importance: 5 },
      { name: "PostgreSQL", importance: 4 },
      { name: "MySQL", importance: 4 },
      { name: "Python", importance: 3 },
      { name: "Chart.js", importance: 3 },
    ],
  },

  // ---------------------------------------------------------------------------
  // 4. Cloud / Infrastructure
  // ---------------------------------------------------------------------------
  {
    title: "Cloud Engineer",
    slug: "cloud-engineer",
    category: "Cloud / Infrastructure",
    description:
      "Architects, provisions, and manages cloud infrastructure services, virtual networks, compute clusters, IAM policies, and cloud storage solutions.",
    skills: [
      { name: "AWS", importance: 5 },
      { name: "Docker", importance: 5 },
      { name: "Kubernetes", importance: 4 },
      { name: "Linux", importance: 4 },
      { name: "Python", importance: 4 },
      { name: "Git", importance: 3 },
      { name: "Computer Networks", importance: 3 },
    ],
  },
  {
    title: "DevOps Engineer",
    slug: "devops-engineer",
    category: "Cloud / Infrastructure",
    description:
      "Automates continuous integration and deployment (CI/CD) pipelines, infrastructure as code, container orchestration, and server monitoring.",
    skills: [
      { name: "Docker", importance: 5 },
      { name: "Kubernetes", importance: 5 },
      { name: "AWS", importance: 5 },
      { name: "Linux", importance: 4 },
      { name: "Git", importance: 4 },
      { name: "GitHub", importance: 4 },
      { name: "Python", importance: 3 },
      { name: "Operating Systems", importance: 3 },
    ],
  },
  {
    title: "Site Reliability Engineer",
    slug: "site-reliability-engineer",
    category: "Cloud / Infrastructure",
    description:
      "Applies software engineering practices to system operations, focusing on high availability, incident recovery, latency reduction, and capacity planning.",
    skills: [
      { name: "Linux", importance: 5 },
      { name: "Python", importance: 5 },
      { name: "Docker", importance: 4 },
      { name: "Kubernetes", importance: 4 },
      { name: "AWS", importance: 4 },
      { name: "Operating Systems", importance: 4 },
      { name: "Computer Networks", importance: 4 },
    ],
  },
  {
    title: "Cloud Security Engineer",
    slug: "cloud-security-engineer",
    category: "Cloud / Infrastructure",
    description:
      "Secures cloud workloads and network perimeters against unauthorized access, enforcing encryption standards, security audits, and threat detection.",
    skills: [
      { name: "AWS", importance: 5 },
      { name: "Linux", importance: 5 },
      { name: "Computer Networks", importance: 5 },
      { name: "Docker", importance: 4 },
      { name: "Python", importance: 3 },
      { name: "Git", importance: 3 },
    ],
  },

  // ---------------------------------------------------------------------------
  // 5. Cybersecurity
  // ---------------------------------------------------------------------------
  {
    title: "Cybersecurity Analyst",
    slug: "cybersecurity-analyst",
    category: "Cybersecurity",
    description:
      "Monitors network traffic, evaluates security alerts, investigates potential breaches, and enforces organizational security controls and protocols.",
    skills: [
      { name: "Computer Networks", importance: 5 },
      { name: "Linux", importance: 5 },
      { name: "Operating Systems", importance: 4 },
      { name: "Python", importance: 3 },
      { name: "SQL", importance: 3 },
    ],
  },
  {
    title: "Security Engineer",
    slug: "security-engineer",
    category: "Cybersecurity",
    description:
      "Designs and implements security systems, firewalls, threat modeling frameworks, and automated vulnerability scanning across applications and platforms.",
    skills: [
      { name: "Computer Networks", importance: 5 },
      { name: "Linux", importance: 5 },
      { name: "Python", importance: 4 },
      { name: "C++", importance: 3 },
      { name: "Docker", importance: 3 },
      { name: "Operating Systems", importance: 4 },
    ],
  },

  // ---------------------------------------------------------------------------
  // 6. Product / Design
  // ---------------------------------------------------------------------------
  {
    title: "Product Manager",
    slug: "product-manager",
    category: "Product / Design",
    description:
      "Defines product vision, strategy, feature roadmaps, and requirements by bridging user feedback, engineering capabilities, and market opportunities.",
    skills: [
      { name: "REST APIs", importance: 3 },
      { name: "Data Structures", importance: 2 },
      { name: "SQL", importance: 3 },
    ],
  },
  {
    title: "UI/UX Designer",
    slug: "ui-ux-designer",
    category: "Product / Design",
    description:
      "Creates intuitive user flows, wireframes, visual component designs, and interactive prototypes tailored to modern web and mobile application standards.",
    skills: [
      { name: "HTML", importance: 4 },
      { name: "CSS", importance: 4 },
      { name: "Tailwind CSS", importance: 3 },
      { name: "React", importance: 2 },
    ],
  },

  // ---------------------------------------------------------------------------
  // 7. Testing
  // ---------------------------------------------------------------------------
  {
    title: "QA Engineer",
    slug: "qa-engineer",
    category: "Testing",
    description:
      "Designs manual test plans, quality assurance matrices, regression test suites, and bug tracking reports to ensure software compliance and stability.",
    skills: [
      { name: "SQL", importance: 4 },
      { name: "HTML", importance: 3 },
      { name: "CSS", importance: 3 },
      { name: "REST APIs", importance: 4 },
      { name: "Git", importance: 3 },
    ],
  },
  {
    title: "Automation Test Engineer",
    slug: "automation-test-engineer",
    category: "Testing",
    description:
      "Develops automated testing scripts, end-to-end integration test runners, and performance benchmarks for continuous quality verification.",
    skills: [
      { name: "Python", importance: 5 },
      { name: "JavaScript", importance: 4 },
      { name: "TypeScript", importance: 4 },
      { name: "REST APIs", importance: 4 },
      { name: "Git", importance: 3 },
      { name: "Docker", importance: 3 },
    ],
  },
];

export async function seedCareers() {
  console.log("==================================================");
  console.log("🌱 SEEDING PHASE 5A CAREER CATALOG & SKILL LINKAGES");
  console.log("==================================================\n");

  let seededCareersCount = 0;
  let seededLinkagesCount = 0;

  for (const careerDef of CAREER_CATALOG) {
    // Upsert Career
    const career = await prisma.career.upsert({
      where: { slug: careerDef.slug },
      update: {
        title: careerDef.title,
        description: careerDef.description,
        category: careerDef.category,
        isActive: true,
      },
      create: {
        title: careerDef.title,
        slug: careerDef.slug,
        description: careerDef.description,
        category: careerDef.category,
        isActive: true,
      },
    });
    seededCareersCount++;

    // Ensure all required skills exist in normalized Skill table
    for (const reqSkill of careerDef.skills) {
      let skill = await prisma.skill.findFirst({
        where: { name: { equals: reqSkill.name, mode: "insensitive" } },
      });

      if (!skill) {
        skill = await prisma.skill.create({
          data: {
            name: reqSkill.name,
            demand: "High",
          },
        });
      }

      // Upsert CareerSkill link
      await prisma.careerSkill.upsert({
        where: {
          careerId_skillId: {
            careerId: career.id,
            skillId: skill.id,
          },
        },
        update: {
          importance: reqSkill.importance,
        },
        create: {
          careerId: career.id,
          skillId: skill.id,
          importance: reqSkill.importance,
        },
      });
      seededLinkagesCount++;
    }

    console.log(`  ✓ Seeded career: "${career.title}" (${careerDef.skills.length} skills)`);
  }

  console.log("\n--------------------------------------------------");
  console.log(`🎉 CAREER CATALOG SEEDED SUCCESSFULLY:`);
  console.log(`   • ${seededCareersCount} Careers`);
  console.log(`   • ${seededLinkagesCount} Career-Skill Linkages`);
  console.log("--------------------------------------------------\n");
}

// Execute if run directly
if (process.argv[1]?.endsWith("seed-careers.mjs")) {
  seedCareers()
    .catch((err) => {
      console.error("Career seeding failed:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
