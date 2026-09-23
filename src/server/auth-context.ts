import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db.server";
import { verifySession, type SessionUser } from "@/server/session";

/**
 * Safely extracts and verifies the authenticated user from the request.
 * Reads the token from the HttpOnly session cookie or Authorization header.
 * Returns null if unauthenticated or if called outside a request context.
 */
export async function getCurrentSessionUser(): Promise<SessionUser | null> {
  try {
    const { getCookie, getRequestHeader } = await import(
      "@tanstack/react-start/server"
    );

    const token =
      getCookie("skillbridge_session") ||
      getRequestHeader("authorization")?.replace(/^Bearer\s+/i, "");

    if (!token) {
      return null;
    }

    return await verifySession(token);
  } catch {
    return null;
  }
}

/**
 * Retrieves the StudentProfile for the currently authenticated user.
 *
 * If the user is authenticated, their personal StudentProfile is returned,
 * preventing cross-student data access.
 *
 * If the user is not authenticated (e.g. initial demo exploration),
 * it gracefully falls back to the demo student profile.
 */
export async function getAuthenticatedStudentProfile<
  T extends Prisma.StudentProfileInclude,
>(include: T): Promise<Prisma.StudentProfileGetPayload<{ include: T }> | null>;
export async function getAuthenticatedStudentProfile(): Promise<
  Prisma.StudentProfileGetPayload<{}> | null
>;
export async function getAuthenticatedStudentProfile<
  T extends Prisma.StudentProfileInclude,
>(include?: T) {
  const sessionUser = await getCurrentSessionUser();

  // No authenticated session → no student data. There is deliberately
  // no fallback: every caller receives data belonging ONLY to the
  // authenticated user, or null.
  if (!sessionUser) {
    return null;
  }

  const student = await prisma.studentProfile.findUnique({
    where: {
      userId: sessionUser.id,
    },
    ...(include ? { include } : {}),
  });

  return student;
}
