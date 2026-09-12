import { initialApplications } from "@/data/mock-data";
import type { Application, User } from "@/types";

const safeRead = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try { const value = window.localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; }
};
export const storage = {
  getUser: () => safeRead<User | null>("skillbridge:user", null),
  setUser: (user: User) => typeof window !== "undefined" && window.localStorage.setItem("skillbridge:user", JSON.stringify(user)),
  getApplications: () => safeRead<Application[]>("skillbridge:applications", initialApplications),
  addApplication: (application: Application) => { const next = [application, ...storage.getApplications().filter((item) => item.internshipId !== application.internshipId)]; window.localStorage.setItem("skillbridge:applications", JSON.stringify(next)); return next; },
  getRoadmapDone: () => safeRead<string[]>("skillbridge:roadmap", ["step-1"]),
  setRoadmapDone: (ids: string[]) => window.localStorage.setItem("skillbridge:roadmap", JSON.stringify(ids)),
};