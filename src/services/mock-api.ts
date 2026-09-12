import { careers, extractedSkills, internships, roadmap, studentSkills } from "@/data/mock-data";
import type { Application, SkillGap, UserRole } from "@/types";

const wait = (ms = 650) => new Promise((resolve) => setTimeout(resolve, ms));

export async function uploadResume(file: File) { await wait(500); return { id: crypto.randomUUID(), fileName: file.name, uploadedAt: new Date().toISOString() }; }
export async function extractSkills() { await wait(1400); return extractedSkills; }
export async function analyzeSkillGap(careerId: string): Promise<SkillGap[]> {
  await wait(450); const career = careers.find((item) => item.id === careerId) ?? careers[0];
  return career.requiredSkills.map((skill) => { const current = studentSkills.find((item) => item.name === skill); const score = current?.score ?? 0; return { skill, score, status: score >= 75 ? "Strong" : score > 0 ? "Needs Improvement" : "Missing" }; });
}
export async function generateRoadmap() { await wait(500); return roadmap; }
export async function getRecommendedInternships() { await wait(400); return internships; }
export async function applyToInternship(internshipId: string): Promise<Application> { const item = internships.find((entry) => entry.id === internshipId); await wait(500); if (!item) throw new Error("Internship not found"); return { id: crypto.randomUUID(), internshipId, role: item.role, company: item.company, status: "Applied", appliedAt: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) }; }
export async function login(email: string, role: UserRole) { await wait(500); return { id: "demo-user", name: email.split("@")[0] || "Shubham Singh", email, role }; }
export async function askSkillBuddy(question: string) { await wait(800); const lower = question.toLowerCase(); if (lower.includes("72") || lower.includes("readiness")) return "Your 72% readiness score combines skill proficiency, project evidence, and current AI Engineer demand. Python and SQL lift your score; TensorFlow and MLOps are the biggest remaining gaps."; if (lower.includes("intern")) return "Your strongest match is the AI/ML Intern role at HyperScale AI with a 92% match. You already match Python, SQL, and Machine Learning; improving AWS would strengthen your application."; if (lower.includes("next") || lower.includes("learn")) return "Focus next on Machine Learning foundations, then Deep Learning and TensorFlow. I recommend completing one deployable prediction project before moving into MLOps."; return "To become an AI Engineer, build strong Python and SQL foundations, learn applied machine learning and deep learning, then practice TensorFlow or PyTorch and production MLOps through real projects."; }