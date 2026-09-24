import { createCsrfMiddleware, createStart } from "@tanstack/react-start";

/* CSRF protection for server functions (TanStack Start recommended
   middleware). Validates Origin / Sec-Fetch-Site on server-function
   requests and rejects cross-site forgeries with 403 before the
   handler runs. The filter scopes validation to serverFn requests;
   SSR page requests are not POST-forgeable targets.

   This is request-validation only: it does not alter session
   creation, role checks, or any server function's authorization
   behavior — all data access continues to resolve from the
   authenticated session. */
const serverFnCsrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  requestMiddleware: [serverFnCsrfMiddleware],
}));
