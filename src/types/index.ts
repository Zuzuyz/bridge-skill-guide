export type UserRole = "student" | "company" | "college" | "admin";

export interface User { id: string; name: string; email: string; role: UserRole }
export interface Student extends User { role: "student"; college: string; targetRole: string; readiness: number }
export interface Company { id: string; name: string; industry: string; verified: boolean }
export interface College { id: string; name: string; students: number; placementReadiness: number }
export interface Skill { id: string; name: string; score: number; confidence?: number; demand?: "High" | "Growing" | "Emerging" }
export interface CareerRole { id: string; title: string; requiredSkills: string[] }
export interface Resume { id: string; fileName: string; uploadedAt: string; skills: Skill[] }
export interface StudentSkill extends Skill { evidence: string }
export interface SkillGap { skill: string; score: number; status: "Strong" | "Needs Improvement" | "Missing" }
export interface RoadmapItem { id: string; step: number; skill: string; status: "complete" | "current" | "upcoming"; difficulty: string; duration: string; resource: string; project: string }
export interface Internship { id: string; role: string; company: string; location: string; mode: string; duration: string; stipend: string; skills: string[]; missing: string[]; match: number; verified: boolean; description: string }
export interface Application { id: string; internshipId: string; role: string; company: string; status: "Applied" | "Under Review" | "Shortlisted" | "Interview" | "Selected" | "Rejected"; appliedAt: string }
export interface Project { id: string; title: string; skills: string[]; difficulty: string }