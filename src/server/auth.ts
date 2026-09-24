import bcrypt from "bcryptjs";
import { prisma } from "./db.server";

/**
 * Hackathon institutional onboarding flag (explicit environment
 * configuration — never derived from email domains or client
 * headers). When set, public registration may also create
 * institutional accounts with their minimum legitimate profile
 * records. In production the flag is absent, so institutional
 * provisioning restrictions remain fully in force.
 */
export function isHackathonInstitutionalOnboarding(): boolean {
  return process.env["SKILLBRIDGE_HACKATHON_ONBOARDING"] === "1";
}

export async function registerUser(
  name: string,
  email: string,
  password: string,
  role: "student" | "company" | "college" | "admin" | "faculty",
  institution?: string,
) {
  if (role !== "student" && !isHackathonInstitutionalOnboarding()) {
    throw new Error(
      "Institutional accounts are provisioned by SkillBridge. Public registration is for students only.",
    );
  }

  /* Faculty onboarding: connect the FacultyProfile to a College
     that ALREADY exists (case-insensitive name match declared by
     the registrant). The schema requires every College to belong
     to its own COLLEGE-role User (College.userId is a required
     unique FK), so registration must never manufacture a College
     or a hidden backing User — an unregistered institution is a
     validation error, and the intended hackathon flow is College
     registration first, then Faculty connecting to it. A faculty
     registrant who provides no institution keeps collegeId = null
     and remains a valid independent account. */
  let facultyProfileCreate: { college: { connect: { id: string } } } | {} =
    {};

  if (role === "faculty" && institution && institution.trim().length >= 2) {
    const existingCollege = await prisma.college.findFirst({
      where: {
        name: { equals: institution.trim(), mode: "insensitive" },
      },
      select: { id: true },
    });

    if (!existingCollege) {
      throw new Error(
        "That institution is not registered yet. Register the College account first, then register Faculty using the same institution.",
      );
    }

    facultyProfileCreate = {
      college: { connect: { id: existingCollege.id } },
    };
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (existingUser) {
    throw new Error("An account with this email already exists.");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: role.toUpperCase() as
        | "STUDENT"
        | "COMPANY"
        | "COLLEGE"
        | "ADMIN"
        | "FACULTY",
      ...(role === "student"
        ? {
            studentProfile: {
              create: {
                readiness: 0,
              },
            },
          }
        : {}),
      /* Hackathon access: minimum legitimate profile record per
         role so the selected dashboard is immediately usable.
         No demo/analytics data is created. */
      ...(role === "company"
        ? { company: { create: { name: name.trim() } } }
        : {}),
      ...(role === "college"
        ? { college: { create: { name: name.trim() } } }
        : {}),
      ...(role === "faculty"
        ? { facultyProfile: { create: facultyProfileCreate } }
        : {}),
    },
  });

  /* The StudentProfile id is fetched explicitly instead of relying
     on include-widening through the conditionally-spread create
     payload — a plain select on a required unique relation cannot
     degrade to the base User type, and no unrelated relations are
     loaded. */
  let studentProfileId: string | null = null;

  if (role === "student") {
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    studentProfileId = studentProfile?.id ?? null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: role,
    studentProfileId,
  };
}

export async function loginUser(
  email: string,
  password: string,
) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (!user) {
    throw new Error("Invalid email or password.");
  }

  const passwordValid = await bcrypt.compare(
    password,
    user.password,
  );

  if (!passwordValid) {
    throw new Error("Invalid email or password.");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.toLowerCase() as
      | "student"
      | "company"
      | "college"
      | "admin"
      | "faculty",
  };
}