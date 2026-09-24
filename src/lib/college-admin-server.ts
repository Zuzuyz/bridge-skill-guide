import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/* =========================================================
   STUDENT–FACULTY ASSIGNMENT (client-safe module)

   Exports only client-safe types and createServerFn
   wrappers. All Prisma/authorization logic lives in
   college-admin-core.server.ts (which reuses the single
   Phase 13 college authorization core) and is loaded via
   dynamic import inside handlers — the same pattern as
   matching-server.ts / skill-gap-server.ts — so no
   src/server import ever reaches the client bundle.
   ========================================================= */

export type {
  CollegeFacultyRow,
  CollegeStudentRow,
} from "@/lib/college-admin-core.server";

const assignSchema = z.object({
  studentProfileId: z.string().cuid(),
  facultyProfileId: z.string().cuid(),
});

const unassignSchema = z.object({
  studentProfileId: z.string().cuid(),
});

export const getCollegeFaculty = createServerFn({ method: "GET" }).handler(
  async () => {
    const { getCollegeFacultyCore } = await import(
      "@/lib/college-admin-core.server"
    );

    return getCollegeFacultyCore();
  },
);

export const getCollegeStudents = createServerFn({ method: "GET" }).handler(
  async () => {
    const { getCollegeStudentsCore } = await import(
      "@/lib/college-admin-core.server"
    );

    return getCollegeStudentsCore();
  },
);

export const assignStudent = createServerFn({ method: "POST" })
  .validator((input: unknown) => assignSchema.parse(input))
  .handler(async ({ data }) => {
    const { assignStudentCore } = await import(
      "@/lib/college-admin-core.server"
    );

    return assignStudentCore(data);
  });

export const unassignStudent = createServerFn({ method: "POST" })
  .validator((input: unknown) => unassignSchema.parse(input))
  .handler(async ({ data }) => {
    const { unassignStudentCore } = await import(
      "@/lib/college-admin-core.server"
    );

    return unassignStudentCore(data);
  });
