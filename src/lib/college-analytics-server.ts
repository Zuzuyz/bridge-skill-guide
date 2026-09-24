import { createServerFn } from "@tanstack/react-start";

/* =========================================================
   PHASE 13 — COLLEGE ANALYTICS (client-safe module)

   Exports only client-safe types and a createServerFn
   wrapper. All Prisma/session logic lives in
   college-analytics-core.server.ts and is loaded through
   dynamic import inside the handler (same pattern as
   matching-server.ts / skill-gap-server.ts), so no
   src/server import ever reaches the client bundle.
   ========================================================= */

export type {
  CollegeResolution,
  CollegeAnalyticsResult,
} from "@/lib/college-analytics-core.server";

export const getCollegeAnalytics = createServerFn({
  method: "GET",
}).handler(async () => {
  const { computeCollegeAnalytics } = await import(
    "@/lib/college-analytics-core.server"
  );

  return computeCollegeAnalytics();
});
