import bcrypt from "bcryptjs";
import {
  AmbiguousCollegeError,
  type CollegeOption,
} from "@/lib/auth-errors";
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
  collegeId?: string,
) {
  if (role !== "student" && !isHackathonInstitutionalOnboarding()) {
    throw new Error(
      "Institutional accounts are provisioned by SkillBridge. Public registration is for students only.",
    );
  }

  /* Faculty onboarding: connect the FacultyProfile to a College
     that ALREADY exists. The schema requires every College to belong
     to its own COLLEGE-role User (College.userId is a required
     unique FK), so registration must never manufacture a College
     or a hidden backing User — an unregistered institution is a
     validation error, and the intended flow is College registration
     first, then Faculty connecting to it. A faculty registrant who
     provides no institution keeps collegeId = null and remains a
     valid independent account.

     College.name is intentionally NOT unique, so a declared
     institution can match multiple College rows. All exact
     case-insensitive matches are resolved up front:
       - 0 matches → validation error (same message as before)
       - 1 match  → automatic linking (unchanged behavior)
       - 2+       → explicit AmbiguousCollegeError carrying the real
                    candidate colleges; registration NEVER silently
                    links an arbitrary row. The caller may instead
                    pass collegeId (validated below) to disambiguate. */
  let facultyProfileCreate: { college: { connect: { id: string } } } | {} =
    {};

  if (role === "faculty" && institution && institution.trim().length >= 2) {
    const collegeMatches = await prisma.college.findMany({
      where: {
        name: { equals: institution.trim(), mode: "insensitive" },
      },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    });

    if (collegeMatches.length === 0) {
      throw new Error(
        "That institution is not registered yet. Register the College account first, then register Faculty using the same institution.",
      );
    }

    if (collegeMatches.length === 1) {
      const singleMatch = collegeMatches.at(0);

      if (!singleMatch) {
        throw new Error(
          "College lookup returned no records for the declared institution.",
        );
      }

      facultyProfileCreate = {
        college: {
          connect: { id: singleMatch.id },
        },
      };
    } else if (collegeId && collegeId.trim().length > 0) {
      /* Explicit selection: the chosen ID must be one of the exact
         case-insensitive name matches for the declared institution.
         Anything else (forged or foreign ID) is rejected — the
         institution name remains the authoritative search key. */
      const selected = collegeMatches.find(
        (option) => option.id === collegeId.trim(),
      );

      if (!selected) {
        throw new Error(
          "The selected college does not match the declared institution. Choose a college with the same institution name.",
        );
      }

      facultyProfileCreate = {
        college: { connect: { id: selected.id } },
      };
    } else {
      /* Multiple matches and no explicit selection: never guess. */
      const collegeOptions: CollegeOption[] = collegeMatches.map(
        (match) => ({ id: match.id, name: match.name }),
      );

      throw new AmbiguousCollegeError(collegeOptions);
    }
  } else if (
    role === "faculty" &&
    collegeId &&
    collegeId.trim().length > 0
  ) {
    throw new Error(
      "A college can only be selected when an institution name is provided.",
    );
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