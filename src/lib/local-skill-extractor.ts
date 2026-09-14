/**
 * SkillBridge Local Skill Extraction & Normalization Engine
 * Resilient deterministic rule-based extractor that parses resume text
 * and extracts skills, proficiency scores, confidence, and contextual evidence.
 */

export interface SkillDefinition {
  name: string;
  regex: RegExp;
  category: "AI / ML" | "Development" | "Databases" | "Cloud & Tools" | "Core CS";
  defaultScore: number;
}

export const SKILL_RULES: SkillDefinition[] = [
  // AI & Machine Learning
  { name: "Python", regex: /\b(python3?|py)\b/i, category: "AI / ML", defaultScore: 88 },
  { name: "Machine Learning", regex: /\b(machine\s+learning|ml\b|supervised\s+learning|unsupervised\s+learning)\b/i, category: "AI / ML", defaultScore: 84 },
  { name: "Scikit-Learn", regex: /\b(scikit-learn|scikit\s+learn|sklearn)\b/i, category: "AI / ML", defaultScore: 82 },
  { name: "NumPy", regex: /\b(numpy)\b/i, category: "AI / ML", defaultScore: 85 },
  { name: "Pandas", regex: /\b(pandas)\b/i, category: "AI / ML", defaultScore: 85 },
  { name: "Model Evaluation", regex: /\b(model\s+evaluation|model\s+validation|cross[- ]validation|precision|recall|f1[- ]score|roc[- ]auc)\b/i, category: "AI / ML", defaultScore: 80 },
  { name: "Feature Engineering", regex: /\b(feature\s+engineering|feature\s+extraction|feature\s+selection|data\s+preprocessing)\b/i, category: "AI / ML", defaultScore: 80 },
  { name: "Deep Learning", regex: /\b(deep\s+learning|neural\s+networks|cnn|rnn|transformers)\b/i, category: "AI / ML", defaultScore: 80 },
  { name: "TensorFlow", regex: /\b(tensorflow|keras)\b/i, category: "AI / ML", defaultScore: 78 },
  { name: "PyTorch", regex: /\b(pytorch|torch)\b/i, category: "AI / ML", defaultScore: 80 },
  { name: "Gemini AI", regex: /\b(gemini\s+ai|google\s+gemini|gemini)\b/i, category: "AI / ML", defaultScore: 85 },
  { name: "Big Data", regex: /\b(big\s+data|apache\s+spark|spark|hadoop|kafka)\b/i, category: "AI / ML", defaultScore: 76 },
  { name: "MLOps", regex: /\b(mlops|mlflow|model\s+deployment|dvc)\b/i, category: "AI / ML", defaultScore: 78 },

  // Development & Frameworks
  { name: "JavaScript", regex: /\b(javascript|es6\+?|ecmascript)\b/i, category: "Development", defaultScore: 82 },
  { name: "TypeScript", regex: /\b(typescript|ts)\b/i, category: "Development", defaultScore: 82 },
  { name: "FastAPI", regex: /\b(fastapi|fast-api)\b/i, category: "Development", defaultScore: 86 },
  { name: "Node.js", regex: /\b(node\.?js|nodejs|express\.?js|express)\b/i, category: "Development", defaultScore: 80 },
  { name: "React", regex: /\b(react\.?js|reactjs|react|redux|next\.?js)\b/i, category: "Development", defaultScore: 84 },
  { name: "REST APIs", regex: /\b(rest\s*apis?|restful(\s*apis?)?|api\s*development|graphql)\b/i, category: "Development", defaultScore: 82 },
  { name: "HTML", regex: /\b(html5?)\b/i, category: "Development", defaultScore: 90 },
  { name: "CSS", regex: /\b(css3?)\b/i, category: "Development", defaultScore: 88 },
  { name: "Tailwind CSS", regex: /\b(tailwind|tailwind\s*css)\b/i, category: "Development", defaultScore: 85 },
  { name: "Chart.js", regex: /\b(chart\.?js|recharts|d3\.?js|charting)\b/i, category: "Development", defaultScore: 80 },
  { name: "Java", regex: /\b(java|spring\s*boot|spring)\b/i, category: "Development", defaultScore: 80 },
  { name: "C++", regex: /\b(c\+\+|cpp)\b/i, category: "Development", defaultScore: 80 },

  // Databases
  { name: "SQL", regex: /\b(sql|pl\/sql|t-sql)\b/i, category: "Databases", defaultScore: 84 },
  { name: "PostgreSQL", regex: /\b(postgresql|postgres|pgsql)\b/i, category: "Databases", defaultScore: 85 },
  { name: "MySQL", regex: /\b(mysql)\b/i, category: "Databases", defaultScore: 80 },
  { name: "DBMS", regex: /\b(dbms|database\s+management(\s+systems?)?)\b/i, category: "Databases", defaultScore: 82 },
  { name: "Prisma", regex: /\b(prisma|prisma\s+orm)\b/i, category: "Databases", defaultScore: 84 },

  // Cloud & Tools
  { name: "AWS", regex: /\b(aws|amazon\s+web\s+services|ec2|s3|lambda)\b/i, category: "Cloud & Tools", defaultScore: 78 },
  { name: "Docker", regex: /\b(docker|containerization|containers)\b/i, category: "Cloud & Tools", defaultScore: 80 },
  { name: "Kubernetes", regex: /\b(kubernetes|k8s)\b/i, category: "Cloud & Tools", defaultScore: 75 },
  { name: "Git", regex: /\b(git|version\s+control)\b/i, category: "Cloud & Tools", defaultScore: 88 },
  { name: "GitHub", regex: /\b(github)\b/i, category: "Cloud & Tools", defaultScore: 88 },
  { name: "VS Code", regex: /\b(vs\s*code|visual\s+studio\s+code)\b/i, category: "Cloud & Tools", defaultScore: 90 },
  { name: "Linux", regex: /\b(linux|ubuntu|bash|shell\s+scripting)\b/i, category: "Cloud & Tools", defaultScore: 80 },

  // Core Computer Science
  { name: "Data Structures", regex: /\b(data\s+structures|algorithms|dsa)\b/i, category: "Core CS", defaultScore: 85 },
  { name: "Computer Networks", regex: /\b(computer\s+networks?|networking|tcp\/ip|http\/https)\b/i, category: "Core CS", defaultScore: 80 },
  { name: "Operating Systems", regex: /\b(operating\s+systems?|\bos\b|process\s+management)\b/i, category: "Core CS", defaultScore: 80 },
];

export const SKILL_NORMALIZATION_MAP: Record<string, string> = {
  "ml": "Machine Learning",
  "machine learning": "Machine Learning",
  "scikit learn": "Scikit-Learn",
  "scikit-learn": "Scikit-Learn",
  "sklearn": "Scikit-Learn",
  "postgres": "PostgreSQL",
  "postgresql": "PostgreSQL",
  "pgsql": "PostgreSQL",
  "node": "Node.js",
  "nodejs": "Node.js",
  "node.js": "Node.js",
  "express": "Node.js",
  "expressjs": "Node.js",
  "express.js": "Node.js",
  "js": "JavaScript",
  "javascript": "JavaScript",
  "ts": "TypeScript",
  "typescript": "TypeScript",
  "react": "React",
  "reactjs": "React",
  "react.js": "React",
  "tailwind": "Tailwind CSS",
  "tailwindcss": "Tailwind CSS",
  "tailwind css": "Tailwind CSS",
  "github": "GitHub",
  "git": "Git",
  "vscode": "VS Code",
  "vs code": "VS Code",
  "visual studio code": "VS Code",
  "gemini": "Gemini AI",
  "gemini ai": "Gemini AI",
  "google gemini": "Gemini AI",
  "chartjs": "Chart.js",
  "chart.js": "Chart.js",
  "dsa": "Data Structures",
  "data structures": "Data Structures",
  "data structures & algorithms": "Data Structures",
  "dbms": "DBMS",
  "database management systems": "DBMS",
  "database management": "DBMS",
  "cn": "Computer Networks",
  "computer networks": "Computer Networks",
  "computer networking": "Computer Networks",
  "os": "Operating Systems",
  "operating systems": "Operating Systems",
  "operating system": "Operating Systems",
  "big data": "Big Data",
  "bigdata": "Big Data",
  "fastapi": "FastAPI",
  "fast api": "FastAPI",
  "numpy": "NumPy",
  "pandas": "Pandas",
  "rest api": "REST APIs",
  "rest apis": "REST APIs",
  "restful api": "REST APIs",
  "restful apis": "REST APIs",
  "rest": "REST APIs",
  "model evaluation": "Model Evaluation",
  "feature engineering": "Feature Engineering",
  "prisma": "Prisma",
  "prisma orm": "Prisma",
  "mysql": "MySQL",
  "sql": "SQL",
  "aws": "AWS",
  "amazon web services": "AWS",
  "docker": "Docker",
  "html": "HTML",
  "html5": "HTML",
  "css": "CSS",
  "css3": "CSS",
};

export function normalizeSkillName(rawName: string): string {
  if (!rawName) return "";
  const cleaned = rawName.replace(/\0/g, "").trim();
  const lower = cleaned.toLowerCase();

  if (SKILL_NORMALIZATION_MAP[lower]) {
    return SKILL_NORMALIZATION_MAP[lower];
  }

  // Check matching rule
  const match = SKILL_RULES.find((r) => r.name.toLowerCase() === lower);
  if (match) {
    return match.name;
  }

  // Capitalize nicely
  return cleaned
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function getSkillCategory(skillName: string): "AI / ML" | "Development" | "Databases" | "Cloud & Tools" | "Core CS" {
  const norm = normalizeSkillName(skillName);
  const rule = SKILL_RULES.find((r) => r.name.toLowerCase() === norm.toLowerCase());
  if (rule) return rule.category;

  const s = norm.toLowerCase();
  if (["python", "machine learning", "scikit-learn", "numpy", "pandas", "model evaluation", "feature engineering", "deep learning", "tensorflow", "pytorch", "gemini ai", "big data", "mlops", "ai"].some((k) => s.includes(k))) {
    return "AI / ML";
  }
  if (["react", "fastapi", "node.js", "typescript", "javascript", "rest apis", "html", "css", "tailwind css", "chart.js", "frontend", "backend", "web"].some((k) => s.includes(k))) {
    return "Development";
  }
  if (["sql", "postgresql", "mysql", "dbms", "prisma", "mongodb", "database"].some((k) => s.includes(k))) {
    return "Databases";
  }
  if (["aws", "docker", "git", "github", "vs code", "linux", "kubernetes", "cloud", "devops"].some((k) => s.includes(k))) {
    return "Cloud & Tools";
  }
  return "Core CS";
}

export interface ExtractedSkill {
  name: string;
  score: number;
  confidence: number;
  evidence: string;
  category: "AI / ML" | "Development" | "Databases" | "Cloud & Tools" | "Core CS";
  verificationLevel?: "RESUME_DETECTED" | "ASSESSMENT_VERIFIED" | "PROJECT_VERIFIED" | "INSTITUTION_VERIFIED" | "EMPLOYER_VERIFIED";
  evidenceSource?: string;
  lastDemonstratedAt?: string;
}

/**
 * Clean & extract readable plain text from raw PDF streams or mixed documents.
 */
export function extractCleanText(rawText: string): string {
  if (!rawText) return "";
  let cleaned = rawText.replace(/\0/g, "");

  if (cleaned.includes("%PDF") || cleaned.includes("endobj") || cleaned.includes("stream")) {
    const textChunks: string[] = [];
    const parenMatches = cleaned.match(/\(([^()]+)\)/g);
    if (parenMatches && parenMatches.length > 5) {
      for (const m of parenMatches) {
        const inner = m.slice(1, -1).trim();
        if (/[a-zA-Z0-9]{2,}/.test(inner)) {
          textChunks.push(inner);
        }
      }
    }
    const words = cleaned.replace(/[^a-zA-Z0-9\s.,_\-+#/]/g, " ").split(/\s+/).filter((w) => w.length >= 2);
    cleaned = [...textChunks, ...words].join(" ");
  }

  return cleaned.replace(/\s+/g, " ").trim();
}

/**
 * Extracts relevant sentence / snippet from text containing the skill keyword.
 */
function findEvidence(text: string, regex: RegExp, skillName: string): string {
  const rawSegments = text.split(/(?:\r?\n|•|\. |\; )+/);

  let bestSnippet = "";
  let bestWeight = -1;

  for (const seg of rawSegments) {
    const clean = seg.trim().replace(/\s+/g, " ");
    if (clean.length < 4) continue;

    if (regex.test(clean)) {
      let weight = 1;
      if (/(built|developed|implemented|designed|created|engineered|trained|deployed|analyzed|skills|languages|backend|frontend|databases|tools|projects|education)/i.test(clean)) {
        weight += 3;
      }
      if (/(project|application|model|system|pipeline|database|api|service)/i.test(clean)) {
        weight += 2;
      }
      if (clean.length > 20 && clean.length < 180) {
        weight += 2;
      }

      if (weight > bestWeight) {
        bestWeight = weight;
        bestSnippet = clean;
      }
    }
  }

  if (bestSnippet) {
    return bestSnippet.length > 180 ? `${bestSnippet.slice(0, 177)}...` : bestSnippet;
  }

  return `Demonstrated proficiency in ${skillName} evidenced in technical resume experience.`;
}

/**
 * Generates transparent explanation for why a skill was assigned its specific score.
 */
export function generateSkillScoreExplanation(params: {
  skillName: string;
  score: number;
  verificationLevel: "RESUME_DETECTED" | "ASSESSMENT_VERIFIED" | "PROJECT_VERIFIED" | "INSTITUTION_VERIFIED" | "EMPLOYER_VERIFIED";
  evidence?: string | null;
  assessmentScore?: number | null;
  projectEvidence?: string | null;
  institutionVerification?: string | null;
  employerVerification?: string | null;
}): { factors: string[]; summary: string; strongestSource: string } {
  const factors: string[] = [];
  let strongestSource = "Resume Detected";

  if (params.employerVerification) {
    factors.push(`Employer industry verification: "${params.employerVerification}"`);
    strongestSource = "Employer Verified";
  }

  if (params.institutionVerification) {
    factors.push(`Institution academic endorsement: "${params.institutionVerification}"`);
    if (strongestSource === "Resume Detected") strongestSource = "Institution Verified";
  }

  if (params.projectEvidence) {
    factors.push(`Verified capstone project: "${params.projectEvidence}"`);
    if (strongestSource === "Resume Detected") strongestSource = "Project Verified";
  }

  if (typeof params.assessmentScore === "number" && params.assessmentScore > 0) {
    factors.push(`SkillBridge proctored assessment completed with score ${params.assessmentScore}%.`);
    if (strongestSource === "Resume Detected") strongestSource = "Assessment Verified";
  }

  if (params.evidence && params.evidence.length > 0) {
    factors.push(`Resume evidence: "${params.evidence}"`);
  } else {
    factors.push("Extracted as technical competency from resume.");
  }

  let summary = "";
  switch (params.verificationLevel) {
    case "EMPLOYER_VERIFIED":
      summary = `Score of ${params.score}% is anchored by verified employer internship/work experience.`;
      break;
    case "INSTITUTION_VERIFIED":
      summary = `Score of ${params.score}% is certified by university curriculum and faculty review.`;
      break;
    case "PROJECT_VERIFIED":
      summary = `Score of ${params.score}% is verified through working codebase and project deliverables.`;
      break;
    case "ASSESSMENT_VERIFIED":
      summary = `Score of ${params.score}% is proven via SkillBridge proctored technical assessment.`;
      break;
    case "RESUME_DETECTED":
    default:
      summary = `Resume evidence detected (${params.score}%). Complete a hands-on assessment to verify this competency.`;
      break;
  }

  return { factors, summary, strongestSource };
}

/**
 * Local fallback skill extractor that operates deterministically on resume text.
 */
export function extractSkillsLocally(resumeText: string): ExtractedSkill[] {
  const cleaned = extractCleanText(resumeText);
  if (!cleaned) return [];

  const detected: ExtractedSkill[] = [];
  const seen = new Set<string>();

  for (const rule of SKILL_RULES) {
    if (rule.regex.test(cleaned)) {
      const canonicalName = normalizeSkillName(rule.name);
      if (seen.has(canonicalName.toLowerCase())) continue;
      seen.add(canonicalName.toLowerCase());

      const evidence = findEvidence(cleaned, rule.regex, canonicalName);

      let score = rule.defaultScore;
      if (/(led|senior|advanced|architect|expert|published|lead|production)/i.test(cleaned)) {
        score = Math.min(95, score + 4);
      }

      detected.push({
        name: canonicalName,
        score,
        confidence: 88,
        evidence,
        category: rule.category,
        verificationLevel: "RESUME_DETECTED",
        evidenceSource: "Resume",
      });
    }
  }

  return detected;
}
