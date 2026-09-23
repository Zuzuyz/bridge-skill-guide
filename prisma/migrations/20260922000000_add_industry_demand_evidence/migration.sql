CREATE TYPE "DemandConfidence" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

ALTER TABLE "IndustryDemand"
ADD COLUMN "confidence" "DemandConfidence" NOT NULL DEFAULT 'LOW',
ADD COLUMN "evidenceCount" INTEGER NOT NULL DEFAULT 0;
