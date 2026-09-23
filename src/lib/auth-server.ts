import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const authSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["student", "company", "college", "admin", "faculty"]),
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