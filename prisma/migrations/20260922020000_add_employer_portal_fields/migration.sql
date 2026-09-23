/*
  Phase 12 — Employer / Company Portal
  Additive-only migration: no existing data is modified or removed.
*/

-- CreateEnum
CREATE TYPE "InternshipStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN "description" TEXT,
ADD COLUMN "website" TEXT,
ADD COLUMN "location" TEXT;

-- AlterTable
ALTER TABLE "Internship" ADD COLUMN "openings" INTEGER,
ADD COLUMN "deadline" TIMESTAMP(3),
ADD COLUMN "status" "InternshipStatus" NOT NULL DEFAULT 'ACTIVE';
