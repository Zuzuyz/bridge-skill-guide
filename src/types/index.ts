export type UserRole = "student" | "company" | "college" | "admin";

export type VerificationLevel =
  | "RESUME_DETECTED"
  | "ASSESSMENT_VERIFIED"
  | "PROJECT_VERIFIED"
  | "INSTITUTION_VERIFIED"
  | "EMPLOYER_VERIFIED";

export const VERIFICATION_LEVEL_LABELS: Record<VerificationLevel, string> = {
  RESUME_DETECTED: "Resume Detected",
  ASSESSMENT_VERIFIED: "Assessment Verified",
  PROJECT_VERIFIED: "Project Verified",
  INSTITUTION_VERIFIED: "Institution Verified",
  EMPLOYER_VERIFIED: "Employer Verified",
};

export const VERIFICATION_PREFERENCE_ORDER: Record<VerificationLevel, number> = {
  EMPLOYER_VERIFIED: 5,
  INSTITUTION_VERIFIED: 4,
  PROJECT_VERIFIED: 3,
  ASSESSMENT_VERIFIED: 2,
  RESUME_DETECTED: 1,
};

export interface ScoreExplanation {
  factors: string[];
  summary: string;
  strongestSource: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Student extends User {
  role: "student";
  college: string;
  targetRole: string;
  readiness: number;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  verified: boolean;
}

export interface College {
  id: string;
  name: string;
  students: number;
  placementReadiness: number;
}

export interface Skill {
  id: string;
  name: string;
  score: number;
  confidence?: number | undefined;
  demand?: "High" | "Growing" | "Emerging" | undefined;
  evidence?: string | undefined;
  evidenceSource?: string | undefined;
  verificationLevel?: VerificationLevel | undefined;
  verificationLabel?: string | undefined;
  lastDemonstratedAt?: string | null | undefined;
  lastVerifiedAt?: string | null | undefined;
  assessmentScore?: number | null | undefined;
  projectEvidence?: string | null | undefined;
  institutionVerification?: string | null | undefined;
  employerVerification?: string | null | undefined;
  explanation?: ScoreExplanation | undefined;
  category?: string | undefined;
  isVerified?: boolean | undefined;
}

export interface CareerRole {
  id: string;
  title: string;
  requiredSkills: string[];
}

export interface Resume {
  id: string;
  fileName: string;
  uploadedAt: string;
  skills: Skill[];
}

export interface StudentSkill extends Skill {
  evidence: string;
}

export interface SkillGap {
  skill: string;
  score: number;
  status: "Strong" | "Needs Improvement" | "Missing";
  verificationLevel?: VerificationLevel | undefined;
  verificationLabel?: string | undefined;
  hasAssessment?: boolean | undefined;
}

export interface RoadmapItem {
  id: string;
  step: number;
  skill: string;
  status: "complete" | "current" | "upcoming";
  difficulty: string;
  duration: string;
  resource: string;
  project: string;
}

export interface Internship {
  id: string;
  role: string;
  company: string;
  location: string;
  mode: string;
  duration: string;
  stipend: string;
  skills: string[];
  missing: string[];
  match: number;
  verified: boolean;
  description: string;
}

export interface Application {
  id: string;
  internshipId: string;
  role: string;
  company: string;
  status: "Applied" | "Under Review" | "Shortlisted" | "Interview" | "Selected" | "Rejected";
  appliedAt: string;
}

export interface Project {
  id: string;
  title: string;
  skills: string[];
  difficulty: string;
}

export interface ReadinessBreakdown {
  overall: number;
  skillMatch: number;
  verifiedSkills: number;
  projectEvidence: number;
  assessmentScore: number;
  formula: string;
}

export interface SkillPassportData {
  studentName: string;
  email: string;
  college: string;
  targetRole: string;
  readiness: number;
  readinessBreakdown: ReadinessBreakdown;
  isShareable: boolean;
  shareToken?: string | null;
  skillsCount: number;
  evidenceSummary: {
    resumeDetected: number;
    assessmentVerified: number;
    projectVerified: number;
    institutionVerified: number;
    employerVerified: number;
  };
  skills: Skill[];
}

// ---------------------------------------------------------------------------
// Phase 6A — Industry Demand Data Types
// ---------------------------------------------------------------------------

export type DemandLevel = "HIGH" | "GROWING" | "EMERGING" | "STABLE" | "LOW";

export type DemandSourceType =
  | "DEMO"
  | "EMPLOYER_POSTINGS"
  | "INDUSTRY_REPORT"
  | "GOVERNMENT_DATA"
  | "PARTNER_DATA"
  | "MANUAL";

export const DEMAND_LEVEL_LABELS: Record<DemandLevel, string> = {
  HIGH: "High Demand",
  GROWING: "Growing Demand",
  EMERGING: "Emerging Demand",
  STABLE: "Stable Demand",
  LOW: "Low Demand",
};

export const DEMAND_SOURCE_LABELS: Record<DemandSourceType, string> = {
  DEMO: "SkillBridge Demo Industry Dataset",
  EMPLOYER_POSTINGS: "Employer Job Postings",
  INDUSTRY_REPORT: "Verified Industry Report",
  GOVERNMENT_DATA: "Labor Market Data",
  PARTNER_DATA: "Partner Network Analytics",
  MANUAL: "Manual Curation",
};

export interface DemandFreshnessStatus {
  status: "Fresh" | "Aging" | "Expired";
  daysOld: number;
  label: string;
  isDemo: boolean;
  notes?: string | null | undefined;
}

export interface IndustryDemandSkillItem {
  demandId: string;
  skillId: string;
  skillName: string;
  careerImportance: number; // 1-5
  importanceLabel: string;
  demandLevel: DemandLevel;
  demandLevelLabel: string;
  demandScore: number | null; // 0-100 index (NOT a percentage)
  sourceType: DemandSourceType;
  sourceTypeLabel: string;
  sourceName: string | null;
  collectedAt: string;
  validUntil: string | null;
  freshness: DemandFreshnessStatus;
  notes: string | null;
}

export interface CareerDemandProfile {
  career: {
    id: string;
    title: string;
    slug: string;
    category: string;
    description: string;
  };
  totalDemandSkillsCount: number;
  highDemandCount: number;
  growingDemandCount: number;
  skills: IndustryDemandSkillItem[];
  sourceDisclaimer: {
    isDemo: boolean;
    notice: string;
    sourceName: string;
  };
}

