import bcrypt from "bcryptjs";
import { prisma } from "./db.server";

export async function registerUser(
  name: string,
  email: string,
  password: string,
  role: "student" | "company" | "college" | "admin",
) {
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
        "STUDENT" | "COMPANY" | "COLLEGE" | "ADMIN",
      ...(role === "student"
        ? {
            studentProfile: {
              create: {
                readiness: 0,
              },
            },
          }
        : {}),
    },
    include: {
      studentProfile: true,
    },
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: role,
    studentProfileId: user.studentProfile?.id ?? null,
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
      "student" | "company" | "college" | "admin",
  };
}