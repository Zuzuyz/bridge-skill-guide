/*
  Phase 11/12 passport sharing
  Additive-only migration: preserves all existing data.
*/

ALTER TABLE "StudentProfile"
ADD COLUMN "passportShareable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "passportShareToken" TEXT;

CREATE UNIQUE INDEX "StudentProfile_passportShareToken_key"
ON "StudentProfile"("passportShareToken");
