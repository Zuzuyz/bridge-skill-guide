import { SignJWT, jwtVerify } from "jose";

const secret = process.env["JWT_SECRET"];

if (!secret) {
  throw new Error("JWT_SECRET is not configured.");
}

const secretKey = new TextEncoder().encode(secret);

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "student" | "company" | "college" | "admin" | "faculty";
};

export async function createSession(user: SessionUser) {
  return new SignJWT({
    name: user.name,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

export async function verifySession(token: string) {
  const { payload } = await jwtVerify(token, secretKey);

  return {
    id: payload.sub!,
    name: payload["name"] as string,
    email: payload["email"] as string,
    role: payload["role"] as SessionUser["role"],
  };
}