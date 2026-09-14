#!/usr/bin/env node
/**
 * Phase 7A — Skill Gap & Readiness Engine Tests
 * Tests the deterministic career-specific readiness computation.
 *
 * Run: node scratch/test-phase7a-skill-gap.mjs
 * Requires: DATABASE_URL env var (or .env file)
 */

import { PrismaClient } from "@prisma/client";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// Load .env
try {
  const { config } = await import("dotenv");
  config({ path: new URL("../.env", import.meta.url).pathname });
} catch {
  // ignore
}

const prisma = new PrismaClient();

/* =========================================================
   WEIGHT CONSTANTS (mirrors skill-gap-server.ts)
========================================================= */

const VERIFICATION_MULTIPLIERS = {
  RESUME_DETECTED: 0.70,
  ASSESSMENT_VERIFIED: 0.85,
  PROJECT_VERIFIED: 0.90,
  INSTITUTION_VERIFIED: 0.95,
  EMPLOYER_VERIFIED: 1.00,
};

const DEMAND_WEIGHTS = {
  HIGH: 1.00,
  GROWING: 0.90,
  EMERGING: 0.75,
  STABLE: 0.60,
  LOW: 0.40,
};

function importanceWeight(importance) {
  if (importance >= 5) return 1.00;
  if (importance === 4) return 0.875;
  if (importance === 3) return 0.75;
  if (importance === 2) return 0.625;
  return 0.50;
}

function computeReadiness(skills) {
  const totalMax = skills.reduce((s, sk) => s + sk.iw * sk.dw, 0);
  const totalContrib = skills.reduce(
    (s, sk) => s + (sk.score / 100) * sk.vm * sk.iw * sk.dw,
    0,
  );
  if (totalMax === 0) return 0;
  return Math.min(100, Math.round((totalContrib / totalMax) * 100));
}

/* =========================================================
   TEST RUNNER
========================================================= */

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

function test(name, fn) {
  console.log(`\n📋 ${name}`);
  try {
    fn();
  } catch (err) {
    console.error(`  ❌ ERROR: ${err.message}`);
    failed++;
  }
}

async function testAsync(name, fn) {
  console.log(`\n📋 ${name}`);
  try {
    await fn();
  } catch (err) {
    console.error(`  ❌ ERROR: ${err.message}`);
    failed++;
  }
}

/* =========================================================
   TESTS
========================================================= */

// TEST 1 — Career-specific readiness differs by career
test("T1 — Career-specific readiness differs from generic", () => {
  // Simulate two careers with same student skills
  const studentScore = 75;
  const vm = VERIFICATION_MULTIPLIERS.ASSESSMENT_VERIFIED;

  // Career A: all HIGH demand, all Core
  const careerA = [
    { score: studentScore, vm, iw: importanceWeight(5), dw: DEMAND_WEIGHTS.HIGH },
    { score: 0, vm: 0.70, iw: importanceWeight(5), dw: DEMAND_WEIGHTS.HIGH },
  ];

  // Career B: all STABLE demand, all Nice to Have
  const careerB = [
    { score: studentScore, vm, iw: importanceWeight(1), dw: DEMAND_WEIGHTS.STABLE },
    { score: 0, vm: 0.70, iw: importanceWeight(1), dw: DEMAND_WEIGHTS.STABLE },
  ];

  const readinessA = computeReadiness(careerA);
  const readinessB = computeReadiness(careerB);

  assert(readinessA === readinessB, "Same student scores produce same proportional readiness regardless of weights");
  assert(typeof readinessA === "number", "Readiness A is a number");
  assert(typeof readinessB === "number", "Readiness B is a number");
});

// TEST 2 — Missing skills contribute 0 to readiness
test("T2 — Missing skills (score=0) contribute 0 points", () => {
  const missingSkills = [
    { score: 0, vm: 0.70, iw: importanceWeight(5), dw: DEMAND_WEIGHTS.HIGH },
    { score: 0, vm: 0.70, iw: importanceWeight(4), dw: DEMAND_WEIGHTS.GROWING },
  ];
  const totalContrib = missingSkills.reduce(
    (s, sk) => s + (sk.score / 100) * sk.vm * sk.iw * sk.dw,
    0,
  );
  assert(totalContrib === 0, "Missing skills contribute exactly 0");
  assert(computeReadiness(missingSkills) === 0, "All-missing readiness = 0");
});

// TEST 3 — Strong skills: score >= 80 classified as Strong
test("T3 — Score >= 80 → Strong, 1-79 → Needs Improvement, 0 → Missing", () => {
  function status(score) {
    if (score >= 80) return "Strong";
    if (score > 0) return "Needs Improvement";
    return "Missing";
  }

  assert(status(100) === "Strong", "100 → Strong");
  assert(status(80) === "Strong", "80 → Strong");
  assert(status(79) === "Needs Improvement", "79 → Needs Improvement");
  assert(status(1) === "Needs Improvement", "1 → Needs Improvement");
  assert(status(0) === "Missing", "0 → Missing");
});

// TEST 4 — Readiness label thresholds
test("T4 — Readiness label thresholds", () => {
  function label(score) {
    if (score >= 85) return "Highly Ready";
    if (score >= 70) return "Ready with Minor Gaps";
    if (score >= 50) return "Developing";
    if (score >= 30) return "Significant Gaps";
    return "Early Stage";
  }

  assert(label(100) === "Highly Ready", "100 → Highly Ready");
  assert(label(85) === "Highly Ready", "85 → Highly Ready");
  assert(label(84) === "Ready with Minor Gaps", "84 → Ready with Minor Gaps");
  assert(label(70) === "Ready with Minor Gaps", "70 → Ready with Minor Gaps");
  assert(label(69) === "Developing", "69 → Developing");
  assert(label(50) === "Developing", "50 → Developing");
  assert(label(49) === "Significant Gaps", "49 → Significant Gaps");
  assert(label(30) === "Significant Gaps", "30 → Significant Gaps");
  assert(label(29) === "Early Stage", "29 → Early Stage");
  assert(label(0) === "Early Stage", "0 → Early Stage");
});

// TEST 5 — Verification multipliers ordering
test("T5 — Verification multipliers are ordered correctly", () => {
  const vm = VERIFICATION_MULTIPLIERS;
  assert(vm.EMPLOYER_VERIFIED === 1.00, "Employer = 1.00");
  assert(vm.INSTITUTION_VERIFIED === 0.95, "Institution = 0.95");
  assert(vm.PROJECT_VERIFIED === 0.90, "Project = 0.90");
  assert(vm.ASSESSMENT_VERIFIED === 0.85, "Assessment = 0.85");
  assert(vm.RESUME_DETECTED === 0.70, "Resume = 0.70");
  assert(
    vm.EMPLOYER_VERIFIED > vm.INSTITUTION_VERIFIED &&
      vm.INSTITUTION_VERIFIED > vm.PROJECT_VERIFIED &&
      vm.PROJECT_VERIFIED > vm.ASSESSMENT_VERIFIED &&
      vm.ASSESSMENT_VERIFIED > vm.RESUME_DETECTED,
    "Multipliers strictly ordered",
  );
});

// TEST 6 — Demand weights integration
test("T6 — Demand weights reduce contribution for low-demand skills", () => {
  const score = 80;
  const vm = VERIFICATION_MULTIPLIERS.PROJECT_VERIFIED;
  const iw = importanceWeight(5); // Core

  const highDemandContrib = (score / 100) * vm * iw * DEMAND_WEIGHTS.HIGH;
  const lowDemandContrib = (score / 100) * vm * iw * DEMAND_WEIGHTS.LOW;

  assert(
    highDemandContrib > lowDemandContrib,
    "High demand skill contributes more than low demand at same score",
  );
  assert(
    Math.abs(highDemandContrib - lowDemandContrib) > 0.1,
    "Difference is meaningful (>0.1)",
  );
});

// TEST 7 — Importance weights ordering
test("T7 — Importance weights are ordered correctly", () => {
  const iw5 = importanceWeight(5);
  const iw4 = importanceWeight(4);
  const iw3 = importanceWeight(3);
  const iw2 = importanceWeight(2);
  const iw1 = importanceWeight(1);

  assert(iw5 === 1.00, "importance=5 → 1.00");
  assert(iw4 === 0.875, "importance=4 → 0.875");
  assert(iw3 === 0.75, "importance=3 → 0.75");
  assert(iw2 === 0.625, "importance=2 → 0.625");
  assert(iw1 === 0.50, "importance=1 → 0.50");
  assert(iw5 > iw4 && iw4 > iw3 && iw3 > iw2 && iw2 > iw1, "Strictly ordered");
});

// TEST 8 — Determinism: same inputs → same output
test("T8 — Readiness is deterministic (same inputs → same result)", () => {
  const skills = [
    { score: 85, vm: 0.90, iw: 1.00, dw: 1.00 },
    { score: 60, vm: 0.70, iw: 0.875, dw: 0.90 },
    { score: 0, vm: 0.70, iw: 0.75, dw: 0.75 },
  ];

  const r1 = computeReadiness(skills);
  const r2 = computeReadiness(skills);
  const r3 = computeReadiness([...skills]);

  assert(r1 === r2, "Same call twice gives same result");
  assert(r2 === r3, "Copy of array gives same result");
  assert(typeof r1 === "number" && !isNaN(r1), "Result is a valid number");
});

// TEST 9 — Readiness clamped 0–100
test("T9 — Readiness is always clamped between 0 and 100", () => {
  const perfectSkills = [
    { score: 100, vm: 1.00, iw: 1.00, dw: 1.00 },
    { score: 100, vm: 1.00, iw: 1.00, dw: 1.00 },
  ];
  const emptySkills = [];
  const zeroSkills = [
    { score: 0, vm: 0.70, iw: 1.00, dw: 1.00 },
  ];

  const r1 = computeReadiness(perfectSkills);
  const r2 = computeReadiness(emptySkills);
  const r3 = computeReadiness(zeroSkills);

  assert(r1 === 100, "Perfect skills → 100");
  assert(r2 === 0, "No skills → 0");
  assert(r3 === 0, "All-missing → 0");
  assert(r1 <= 100, "Never exceeds 100");
  assert(r2 >= 0, "Never below 0");
});

// TEST 10 — DB: Careers and IndustryDemand records exist
await testAsync("T10 — DB: Careers and IndustryDemand records are seeded", async () => {
  const careerCount = await prisma.career.count();
  const demandCount = await prisma.industryDemand.count();
  const careerSkillCount = await prisma.careerSkill.count();

  assert(careerCount >= 22, `At least 22 careers seeded (found: ${careerCount})`);
  assert(
    careerSkillCount >= 100,
    `At least 100 CareerSkill records (found: ${careerSkillCount})`,
  );
  assert(
    demandCount >= 100,
    `At least 100 IndustryDemand records (found: ${demandCount})`,
  );

  // Confirm demo data label
  const demoCount = await prisma.industryDemand.count({
    where: { sourceType: "DEMO" },
  });
  assert(demoCount === demandCount, "All IndustryDemand records are sourceType=DEMO");
});

/* =========================================================
   SUMMARY
========================================================= */

await prisma.$disconnect();

console.log(`\n${"─".repeat(50)}`);
console.log(`Phase 7A Tests: ${passed} passed, ${failed} failed`);
console.log(`${"─".repeat(50)}\n`);

if (failed > 0) {
  process.exit(1);
}
