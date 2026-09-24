import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { AmbiguousCollegeError } from "@/lib/auth-errors";

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
     their institution (linked to a real College row — never
     created here). Optional — omitted means collegeId stays null.
     collegeId disambiguates when multiple College rows share the
     institution name; it is only ever accepted when it matches one
     of the exact case-insensitive name matches (validated in
     registerUser). */
  institution: z.string().min(2).max(120).optional(),
  collegeId: z.string().min(1).optional(),
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

    try {
      const user = await registerUser(
        data.name,
        data.email,
        data.password,
        data.role,
        data.institution,
        data.collegeId,
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
    } catch (error) {
      /* Surface college ambiguity as a structured, non-throwing
         response so the registration UI can offer the real College
         options instead of failing with a generic error. The user
         is NOT created in this case (the throw happened before any
         prisma.user.create). */
      if (error instanceof AmbiguousCollegeError) {
        return {
          needsCollegeSelection: true as const,
          collegeOptions: error.collegeOptions,
        };
      }

      throw error;
    }
  });

export const login = createServerFn({ method: "POST" })
  .validator(
    z.object({
      email: z.string().email(),
      password: z.string().min(6),
      /* UI convenience ONLY: the account type chosen on the login
         form. It can only cause a REJECTION when it disagrees with
         the authenticated database User.role — it can never grant a
         role, a permission, or a different dashboard. Authorization
         continues to derive exclusively from User.role in PostgreSQL. */
      selectedRole: z
        .enum(["student", "faculty", "company", "college", "admin"])
        .optional(),
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

    /* The database role is the source of truth. A selected account
       type that disagrees with it is rejected BEFORE any session is
       created — the hint can only narrow access, never widen it. */
    if (data.selectedRole && data.selectedRole !== user.role) {
      const actualRoleLabel =
        user.role.charAt(0).toUpperCase() + user.role.slice(1);

      throw new Error(
        `This account is registered as ${actualRoleLabel}. Select "${actualRoleLabel}" as the account type and try again.`,
      );
    }

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