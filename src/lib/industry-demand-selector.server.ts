import type {
  DemandConfidence,
  DemandFreshnessStatus,
  DemandSourceType,
} from "@/types";

export type SelectableIndustryDemand = {
  id: string;
  skillId: string;
  careerId: string;
  sourceType: DemandSourceType;
  confidence?: DemandConfidence | null;
  collectedAt: Date | string;
  validUntil?: Date | string | null;
};

const CONFIDENCE_RANK: Record<DemandConfidence, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

/**
 * Evaluates the data freshness status for an industry demand record.
 * Fresh: < 30 days old
 * Aging: 30 - 90 days old
 * Expired: > 90 days old
 */
export function getDemandFreshness(
  collectedAt: Date | string,
  validUntil?: Date | string | null,
  sourceType: DemandSourceType = "DEMO",
): DemandFreshnessStatus {
  const isDemo = sourceType === "DEMO";
  const collectedDate = new Date(collectedAt);
  const now = new Date();

  const diffMs = Math.max(
    0,
    now.getTime() - collectedDate.getTime(),
  );

  const daysOld = Math.floor(
    diffMs / (1000 * 60 * 60 * 24),
  );

  let status: "Fresh" | "Aging" | "Expired" = "Fresh";

  /*
   * An explicit validUntil takes precedence over the
   * generic age-based freshness window.
   */
  if (
    validUntil &&
    new Date(validUntil).getTime() <= now.getTime()
  ) {
    status = "Expired";
  } else if (daysOld > 90) {
    status = "Expired";
  } else if (daysOld >= 30) {
    status = "Aging";
  }

  const label = isDemo
    ? `Demo dataset (${daysOld}d ago)`
    : status === "Fresh"
      ? `Fresh (Collected ${daysOld}d ago)`
      : status === "Aging"
        ? `Aging (${daysOld}d ago)`
        : `Expired (${daysOld}d ago)`;

  return {
    status,
    daysOld,
    label,
    isDemo,
    notes: isDemo
      ? "Seeded benchmark dataset for SkillBridge prototype. Not live labor market statistics."
      : null,
  };
}

export function getNoCurrentDemandFreshness(): DemandFreshnessStatus {
  return {
    status: "Expired",
    daysOld: 0,
    label: "No current demand data",
    isDemo: false,
    notes: null,
  };
}

function collectedAtTime(record: SelectableIndustryDemand): number {
  const time = new Date(record.collectedAt).getTime();
  return Number.isFinite(time) ? time : 0;
}

function confidenceRank(record: SelectableIndustryDemand): number {
  return CONFIDENCE_RANK[record.confidence ?? "LOW"] ?? 0;
}

function isCurrent(record: SelectableIndustryDemand): boolean {
  return getDemandFreshness(
    record.collectedAt,
    record.validUntil,
    record.sourceType,
  ).status !== "Expired";
}

function compareCurrentDemandRecords<T extends SelectableIndustryDemand>(
  a: T,
  b: T,
): number {
  const aIsReal = a.sourceType !== "DEMO" ? 1 : 0;
  const bIsReal = b.sourceType !== "DEMO" ? 1 : 0;
  if (aIsReal !== bIsReal) {
    return bIsReal - aIsReal;
  }

  const confidenceDiff = confidenceRank(b) - confidenceRank(a);
  if (confidenceDiff !== 0) {
    return confidenceDiff;
  }

  const collectedAtDiff = collectedAtTime(b) - collectedAtTime(a);
  if (collectedAtDiff !== 0) {
    return collectedAtDiff;
  }

  return a.id.localeCompare(b.id);
}

export function selectCurrentIndustryDemand<
  T extends SelectableIndustryDemand,
>(records: readonly T[]): T | null {
  const currentRecords = records.filter(isCurrent);

  if (currentRecords.length === 0) {
    return null;
  }

  return [...currentRecords].sort(compareCurrentDemandRecords)[0] ?? null;
}

export function selectCurrentIndustryDemandBySkillId<
  T extends SelectableIndustryDemand,
>(records: readonly T[]): Map<string, T> {
  const grouped = new Map<string, T[]>();

  for (const record of records) {
    const recordsForSkill = grouped.get(record.skillId) ?? [];
    recordsForSkill.push(record);
    grouped.set(record.skillId, recordsForSkill);
  }

  const selectedBySkillId = new Map<string, T>();

  for (const [skillId, recordsForSkill] of grouped) {
    const selected = selectCurrentIndustryDemand(recordsForSkill);
    if (selected) {
      selectedBySkillId.set(skillId, selected);
    }
  }

  return selectedBySkillId;
}

export function selectCurrentIndustryDemandByCareerId<
  T extends SelectableIndustryDemand,
>(records: readonly T[]): Map<string, T> {
  const grouped = new Map<string, T[]>();

  for (const record of records) {
    const recordsForCareer = grouped.get(record.careerId) ?? [];
    recordsForCareer.push(record);
    grouped.set(record.careerId, recordsForCareer);
  }

  const selectedByCareerId = new Map<string, T>();

  for (const [careerId, recordsForCareer] of grouped) {
    const selected = selectCurrentIndustryDemand(recordsForCareer);
    if (selected) {
      selectedByCareerId.set(careerId, selected);
    }
  }

  return selectedByCareerId;
}
