# SkillBridge — Phase 6A: Industry Demand Data Foundation

## Overview & Purpose

Phase 6A establishes the **Industry Demand Data Foundation** (Step 6 of the Master Product Workflow). It bridges normalized target careers from Phase 5A with external skill-demand metrics that will be consumed in Phase 7 for explainable skill-gap analysis.

```text
Career
   ↓
Industry Demand
   ↓
Skill Demand Index
   ↓
Career Skill Profile
```

---

## Critical Data Policy

> [!IMPORTANT]
> The current prototype uses a **seeded benchmark demo dataset** (`sourceType = DEMO`).
>
> 1. Seeded numbers are explicitly represented as **demo demand index values** (0–100 scale), NOT as real-world market statistics or company percentage claims.
> 2. Numerical values are labeled **Demand Index** rather than **Demand %**.
> 3. Visual notices (`ⓘ Demo Industry-Demand Data`) are displayed across all relevant UI components.
> 4. The architecture is designed to seamlessly integrate live employer postings, government labor statistics, and verified industry reports in production without frontend redesigns.

---

## Database Architecture

### Enums & Models (`prisma/schema.prisma`)

```prisma
enum DemandLevel {
  HIGH       // Core market priority (Score 90-100)
  GROWING    // Increasing market adoption (Score 70-89)
  EMERGING   // Early-stage trend (Score 40-69)
  STABLE     // Consistent baseline skill (Score 20-39)
  LOW        // Niche or declining demand (Score 0-19)
}

enum DemandSourceType {
  DEMO               // Seeded prototype dataset
  EMPLOYER_POSTINGS  // Direct employer job listings
  INDUSTRY_REPORT    // Verified market research reports
  GOVERNMENT_DATA    // Official labor statistics
  PARTNER_DATA       // Industry partner telemetry
  MANUAL             // Curated administrator input
}

model IndustryDemand {
  id          String           @id @default(cuid())
  careerId    String
  skillId     String
  demandLevel DemandLevel
  demandScore Int?             // 0-100 Demand Index
  sourceType  DemandSourceType @default(DEMO)
  sourceName  String?
  sourceUrl   String?
  collectedAt DateTime         @default(now())
  validUntil  DateTime?
  notes       String?

  career      Career           @relation(fields: [careerId], references: [id], onDelete: Cascade)
  skill       Skill            @relation(fields: [skillId], references: [id], onDelete: Cascade)

  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  @@unique([careerId, skillId, sourceType])
  @@index([careerId])
  @@index([skillId])
  @@index([sourceType])
}
```

---

## Data Freshness Classification

Data freshness is evaluated dynamically based on the record's `collectedAt` timestamp:

- **Fresh**: Collected less than 30 days ago (`< 30 days`).
- **Aging**: Collected 30 to 90 days ago (`30–90 days`).
- **Expired**: Collected more than 90 days ago (`> 90 days`).

For demo dataset records, UI badges clearly indicate: `Demo dataset (X days ago)`.

---

## Seed Script (`prisma/seed-industry-demand.mjs`)

The seed script is idempotent and repeatable using Prisma `upsert`:

```bash
node prisma/seed-industry-demand.mjs
```

- Populates **166 IndustryDemand records** across all 22 catalog careers.
- Sets `sourceType = DEMO` and `sourceName = "SkillBridge Demo Industry Dataset"`.
- Assigns valid demand levels (`HIGH`, `GROWING`, `EMERGING`, `STABLE`) and index scores (0–100).

---

## Server Service API (`src/lib/industry-demand-server.ts`)

- `getCareerDemandProfile({ careerId, slug })`: Fetches full demand profile for a career including skills, demand levels, demand scores, and source metadata.
- `getAllIndustryDemand({ query, category, careerId })`: Serves the Industry Demand Explorer with career filtering, category filtering, and search capabilities.
- `getIndustryDemandForSkill({ skillId })`: Retrieves demand metrics for a specific skill across all career profiles.
- `getDemandFreshness(collectedAt, validUntil, sourceType)`: Evaluates freshness status and labels.

---

## UI Components & Integration

1. **Industry Demand Explorer (`/student/industry-demand`)**:
   - `src/routes/student.industry-demand.index.tsx`
   - `src/components/industry-demand-pages.tsx`
   - Includes search bar, category pills, single-career selection dropdown, responsive demand table, and explainability modal ("Why am I seeing this?").

2. **Career Detail Modal Integration (`src/components/career-pages.tsx`)**:
   - Displays industry-demand level badges and demand index scores on career skill cards.
   - Includes mandatory `ⓘ Demo Industry-Demand Data` policy notice.

3. **Dashboard Integration (`src/components/student-pages.tsx`)**:
   - Displays an **Industry Skill Demand Foundation** preview card linking directly to `/student/industry-demand`.

---

## Phase 7 Roadmap Integration

Phase 6A provides the external market demand side of the equation:

```text
   INDUSTRY DEMAND SIDE                 STUDENT EVIDENCE SIDE
┌─────────────────────────┐         ┌─────────────────────────┐
│ Target Career           │         │ Student Profile         │
│ Career Skill Taxonomies │         │ Verified Evidence       │
│ Industry Demand Index   │         │ Assessment Scores       │
└────────────┬────────────┘         └────────────┬────────────┘
             │                                   │
             └─────────────────┬─────────────────┘
                               │
                               ▼
                   Phase 7: Skill Gap Engine
```
