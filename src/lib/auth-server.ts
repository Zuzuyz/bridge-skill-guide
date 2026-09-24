import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Client-safe registration options for the UI. Mirrors the
 * authoritative server-side gate in registerUser: institutional
 * roles appear ONLY when the explicit hackathon-onboarding
 * environment flag is set. Never derived from email domains.
 */
export const getRegistrationOptions = createServerFn({
  method: "GET",
}).handler(async () => {
  const { isHackathonInstitutionalOnboarding } = await import(
    "@/server/auth"
  );

  return {
    roles: isHackathonInstitutionalOnboarding()
      ? (["student", "faculty", "company", "college", "admin"] as const)
      : (["student"] as const),
  };
});

/* Registration roles: STUDENT always; institutional roles only
   when the explicit hackathon-onboarding environment flag is
   set (validated server-side in registerUser too — the flag is
   environment configuration, never derived from email domains
   and never trusted from the browser outside this flow). */
const authSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum([
    "student",
    "faculty",
    "company",
    "college",
    "admin",
  ]),
  /* Faculty institutional onboarding: the registrant declares
     their institution (reused or created as a real College row).
     Optional — omitted means collegeId stays null. */
  institution: z.string().min(2).max(120).optional(),
});

export const register = createServerFn({ method: "POST" })
  .validator(authSchema)
  .handler(async ({ data }) => {
    const { registerUser } = await import(
      "@/server/auth"
    );

    if (!data.name) {
      throw new Error(
        "Name is required for registration.",
      );
    }

    const user = await registerUser(
      data.name,
      data.email,
      data.password,
      data.role,
      data.institution,
    );

    const { createSession } = await import(
      "@/server/session"
    );

    const token = await createSession(user);

    try {
      const { setCookie } = await import(
        "@tanstack/react-start/server"
      );
      setCookie("skillbridge_session", token, {
        httpOnly: true,
        secure: process.env["NODE_ENV"] === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    } catch {
      // Safe fallback when called in non-request test contexts
    }

    return {
      user,
      token,
    };
  });

export const login = createServerFn({ method: "POST" })
  .validator(
    z.object({
      email: z.string().email(),
      password: z.string().min(6),
    }),
  )
  .handler(async ({ data }) => {
    const { loginUser } = await import(
      "@/server/auth"
    );

    const user = await loginUser(
      data.email,
      data.password,
    );

    const { createSession } = await import(
      "@/server/session"
    );

    const token = await createSession(user);

    try {
      const { setCookie } = await import(
        "@tanstack/react-start/server"
      );
      setCookie("skillbridge_session", token, {
        httpOnly: true,
        secure: process.env["NODE_ENV"] === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    } catch {
      // Safe fallback when called in non-request test contexts
    }

    return {
      user,
      token,
    };
  });

/**
 * Client-safe session reader for the AppShell.
 * Returns the authenticated user from the HTTP-only session cookie
 * (via getCurrentSessionUser/verifySession), or null when there is
 * no valid session. localStorage is never an authentication source.
 */
export const getCurrentUser = createServerFn({ method: "GET" }).handler(
  async () => {
    const { getCurrentSessionUser } = await import(
      "@/server/auth-context"
    );

    const sessionUser = await getCurrentSessionUser();

    return sessionUser
      ? { id: sessionUser.id, name: sessionUser.name, role: sessionUser.role }
      : null;
  },
);

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const { deleteCookie } = await import(
      "@tanstack/react-start/server"
    );
    deleteCookie("skillbridge_session", { path: "/" });
  } catch {
    // Non-fatal
  }
  return { success: true };
});