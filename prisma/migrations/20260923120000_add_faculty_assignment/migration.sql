-- Student–Faculty Assignment (additive migration)
-- Adds a nullable StudentProfile.facultyId so a student MAY be assigned to
-- one faculty member but does NOT need to be (null = unassigned; the student
-- portal is fully usable either way). Assignment is managed exclusively by
-- the student's own College admin via server-validated functions.
-- No existing table, column, or row is modified or removed; every existing
-- student row stays unassigned (facultyId = NULL).

ALTER TABLE "StudentProfile" ADD COLUMN "facultyId" TEXT;

CREATE INDEX "StudentProfile_facultyId_idx" ON "StudentProfile"("facultyId");

ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "FacultyProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
