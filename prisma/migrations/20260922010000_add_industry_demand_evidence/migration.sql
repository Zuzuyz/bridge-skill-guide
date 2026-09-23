-- CreateEnum
CREATE TYPE "DemandConfidence" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- AlterTable
ALTER TABLE "IndustryDemand" ADD COLUMN     "confidence" "DemandConfidence" NOT NULL DEFAULT 'LOW',
ADD COLUMN     "evidenceCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "IndustryDemandEvidence" (
    "id" TEXT NOT NULL,
    "industryDemandId" TEXT NOT NULL,
    "sourceType" "DemandSourceType" NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "metric" TEXT,
    "rawValue" TEXT,
    "normalizedValue" DOUBLE PRECISION,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndustryDemandEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IndustryDemandEvidence_industryDemandId_idx" ON "IndustryDemandEvidence"("industryDemandId");

-- CreateIndex
CREATE INDEX "IndustryDemandEvidence_sourceType_idx" ON "IndustryDemandEvidence"("sourceType");

-- CreateIndex
CREATE INDEX "IndustryDemandEvidence_collectedAt_idx" ON "IndustryDemandEvidence"("collectedAt");

-- AddForeignKey
ALTER TABLE "IndustryDemandEvidence" ADD CONSTRAINT "IndustryDemandEvidence_industryDemandId_fkey" FOREIGN KEY ("industryDemandId") REFERENCES "IndustryDemand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

