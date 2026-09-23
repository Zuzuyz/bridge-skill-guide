-- Phase 15 — Outcomes / Feedback Ecosystem (additive migration)
-- Adds Outcome and EmployerFeedback: persisted outcome records and
-- employer feedback. Rows are created ONLY through authorized server
-- actions. No existing table, column, or row is modified or removed;
-- existing StudentSkill scores and evidence are never overwritten.

-- -----------------------------------------------------------
-- Enums
-- -----------------------------------------------------------
CREATE TYPE "OutcomeType" AS ENUM ('INTERNSHIP_COMPLETED', 'JOB_OFFER', 'HIRED', 'NOT_SELECTED', 'WITHDRAWN');

CREATE TYPE "OutcomeStatus" AS ENUM ('RECORDED', 'VERIFIED');

-- -----------------------------------------------------------
-- Outcome
-- -----------------------------------------------------------
CREATE TABLE "Outcome" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "internshipId" TEXT,
    "applicationId" TEXT,
    "type" "OutcomeType" NOT NULL,
    "status" "OutcomeStatus" NOT NULL DEFAULT 'RECORDED',
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Outcome_pkey" PRIMARY KEY ("id")
);

-- -----------------------------------------------------------
-- EmployerFeedback (stored separately from StudentSkill so
-- employer evidence never overwrites verified skill scores)
-- -----------------------------------------------------------
CREATE TABLE "EmployerFeedback" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "internshipId" TEXT,
    "applicationId" TEXT,
    "technicalSkillsRating" INTEGER,
    "communicationRating" INTEGER,
    "problemSolvingRating" INTEGER,
    "professionalismRating" INTEGER,
    "roleReadinessRating" INTEGER,
    "writtenFeedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployerFeedback_pkey" PRIMARY KEY ("id")
);

-- -----------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------
CREATE INDEX "Outcome_studentId_idx" ON "Outcome"("studentId");

CREATE INDEX "Outcome_companyId_idx" ON "Outcome"("companyId");

CREATE INDEX "Outcome_type_idx" ON "Outcome"("type");

CREATE INDEX "EmployerFeedback_companyId_idx" ON "EmployerFeedback"("companyId");

CREATE INDEX "EmployerFeedback_studentId_idx" ON "EmployerFeedback"("studentId");

-- -----------------------------------------------------------
-- Foreign keys (referential actions mirror Prisma defaults:
-- required relations → Cascade delete; optional links →
-- SetNull on delete, Cascade on update)
-- -----------------------------------------------------------
ALTER TABLE "Outcome" ADD CONSTRAINT "Outcome_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Outcome" ADD CONSTRAINT "Outcome_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Outcome" ADD CONSTRAINT "Outcome_internshipId_fkey" FOREIGN KEY ("internshipId") REFERENCES "Internship"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Outcome" ADD CONSTRAINT "Outcome_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EmployerFeedback" ADD CONSTRAINT "EmployerFeedback_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmployerFeedback" ADD CONSTRAINT "EmployerFeedback_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmployerFeedback" ADD CONSTRAINT "EmployerFeedback_internshipId_fkey" FOREIGN KEY ("internshipId") REFERENCES "Internship"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EmployerFeedback" ADD CONSTRAINT "EmployerFeedback_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;
