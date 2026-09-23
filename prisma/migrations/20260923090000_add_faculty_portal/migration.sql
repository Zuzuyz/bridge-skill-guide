-- Phase 14 — Faculty Portal (additive migration)
-- Adds the FACULTY role, FacultyProfile (1:1 with User, same
-- session-derived resolution pattern as Company/College) and
-- faculty-private FacultyNote rows. No existing table, column,
-- or row is modified or removed.

-- Atom add the new role value (not used by any statement below,
-- which keeps this transaction-safe on PostgreSQL 12+).
ALTER TYPE "UserRole" ADD VALUE 'FACULTY';

-- -----------------------------------------------------------
-- FacultyProfile
-- -----------------------------------------------------------
CREATE TABLE "FacultyProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "department" TEXT,
    "collegeId" TEXT,

    CONSTRAINT "FacultyProfile_pkey" PRIMARY KEY ("id")
);

-- -----------------------------------------------------------
-- FacultyNote (faculty-private support notes)
-- -----------------------------------------------------------
CREATE TABLE "FacultyNote" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacultyNote_pkey" PRIMARY KEY ("id")
);

-- -----------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------
CREATE UNIQUE INDEX "FacultyProfile_userId_key" ON "FacultyProfile"("userId");

CREATE INDEX "FacultyNote_facultyId_studentId_idx" ON "FacultyNote"("facultyId", "studentId");

-- -----------------------------------------------------------
-- Foreign keys (referential actions mirror Prisma defaults:
-- required relations → Restrict/Cascade per schema, optional
-- college link → SetNull/Cascade)
-- -----------------------------------------------------------
ALTER TABLE "FacultyProfile" ADD CONSTRAINT "FacultyProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FacultyProfile" ADD CONSTRAINT "FacultyProfile_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FacultyNote" ADD CONSTRAINT "FacultyNote_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "FacultyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FacultyNote" ADD CONSTRAINT "FacultyNote_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
