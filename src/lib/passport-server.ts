import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "@/server/db.server";
import { getCurrentSessionUser } from "@/server/auth-context";
import { buildPublicPassportPayload } from "@/lib/passport-public.server";
import { type PublicPassportResult } from "@/types";

/* =========================================================
   PHASE 11 — SKILL PASSPORT (PUBLIC / SHARING)
   ---------------------------------------------------------
   - buildPublicPassportPayload: shared, privacy-limited
     payload builder (passport-public.server.ts). Used by
     the public share view and (Phase 12) by the employer
     portal, which may only ever see exactly this public
     payload — never private data.
   - getPublicPassport: token-based public view with
     server-side visibility enforcement.
   - regeneratePassportShareToken: strictly session-
     authenticated rotation of the public identifier.
   ========================================================= */

const publicPassportSchema = z.object({
  token: z
    .string()
    .min(8)
    .max(64)
    .regex(/^[A-Za-z0-9_-]+$/, "Invalid passport identifier."),
});

/**
 * Resolves a public passport by its share token.
 * The server decides visibility — a private passport never
 * returns its contents, regardless of who holds the link.
 */
export const getPublicPassport = createServerFn({ method: "GET" })
  .validator((input: unknown) => publicPassportSchema.parse(input))
  .handler(async ({ data }): Promise<PublicPassportResult> => {
    const student = await prisma.studentProfile.findUnique({
      where: { passportShareToken: data.token },
      select: { id: true, passportShareable: true },
    });

    if (!student) {
      return { status: "not_found" };
    }

    // Server-side visibility enforcement.
    if (!student.passportShareable) {
      return { status: "private" };
    }

    return {
      status: "ok",
      data: await buildPublicPassportPayload(student.id),
    };
  });

/**
 * Rotates the public identifier. Strictly session-authenticated:
 * the student is always derived from the session cookie, never
 * from any browser-supplied id.
 */
export const regeneratePassportShareToken = createServerFn({
  method: "POST",
}).handler(async (): Promise<{ shareToken: string }> => {
  const sessionUser = await getCurrentSessionUser();

  if (!sessionUser || sessionUser.role !== "student") {
    throw new Error("Unauthorized.");
  }

  const student = await prisma.studentProfile.findUnique({
    where: { userId: sessionUser.id },
  });

  if (!student) {
    throw new Error("Student profile not found.");
  }

  const token = `pass_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;

  const updated = await prisma.studentProfile.update({
    where: { id: student.id },
    data: { passportShareToken: token },
  });

  if (!updated.passportShareToken) {
    throw new Error("Failed to issue a new passport share token.");
  }

  return { shareToken: updated.passportShareToken };
});
