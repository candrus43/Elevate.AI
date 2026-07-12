/**
 * Core logic unit tests for ElevateAI API.
 * Run with: bun test
 */

import { describe, it, expect, mock } from "bun:test";

// ─── Helper: SQL escaping ────────────────────────────────────────────────────
// Replicate the esc function from sql.ts for isolated testing
function esc(val: unknown): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "boolean") return val ? "1" : "0";
  if (typeof val === "number") {
    if (!Number.isFinite(val)) return "NULL";
    return String(val);
  }
  const str = String(val);
  return "'" + str.replace(/'/g, "''") + "'";
}

describe("SQL esc()", () => {
  it("should escape strings with single quotes", () => {
    expect(esc("hello")).toBe("'hello'");
    expect(esc("it's me")).toBe("'it''s me'");
  });

  it("should handle numbers", () => {
    expect(esc(42)).toBe("42");
    expect(esc(3.14)).toBe("3.14");
  });

  it("should handle booleans", () => {
    expect(esc(true)).toBe("1");
    expect(esc(false)).toBe("0");
  });

  it("should handle null/undefined", () => {
    expect(esc(null)).toBe("NULL");
    expect(esc(undefined)).toBe("NULL");
  });

  it("should handle non-finite numbers", () => {
    expect(esc(NaN)).toBe("NULL");
    expect(esc(Infinity)).toBe("NULL");
  });
});

// ─── Helper: Email validation ────────────────────────────────────────────────
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

describe("isValidEmail()", () => {
  it("should accept valid emails", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("test.user@company.co.uk")).toBe(true);
    expect(isValidEmail("a@b.io")).toBe(true);
  });

  it("should reject invalid emails", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("notanemail")).toBe(false);
    expect(isValidEmail("@domain.com")).toBe(false);
    expect(isValidEmail("user@")).toBe(false);
    expect(isValidEmail("user@.com")).toBe(false);
  });
});

// ─── Call Analysis ───────────────────────────────────────────────────────────
// Replicate calculateScore and calculateSentiment
function calculateScore(duration: number, direction: string, objectionCount: number): number {
  let base = 65 + Math.random() * 20;
  if (duration > 60 && duration < 600) base += 5;
  if (duration > 600) base += 10;
  if (direction === "inbound") base += 5;
  if (objectionCount > 0) base -= Math.min(objectionCount * 3, 15);
  return Math.min(100, Math.max(10, Math.round(base)));
}

function calculateSentiment(score: number): string {
  if (score >= 80) return "positive";
  if (score >= 50) return "neutral";
  return "negative";
}

describe("calculateScore()", () => {
  it("should return a number between 10 and 100", () => {
    const score = calculateScore(300, "outbound", 0);
    expect(score).toBeGreaterThanOrEqual(10);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("should penalize high objection counts", () => {
    const scoreNoObjs = calculateScore(300, "outbound", 0);
    const scoreManyObjs = calculateScore(300, "outbound", 5);
    // With more objections, score should be lower (on average)
    const diffs = [];
    for (let i = 0; i < 100; i++) {
      diffs.push(calculateScore(300, "outbound", 0) - calculateScore(300, "outbound", 5));
    }
    const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    expect(avgDiff).toBeGreaterThan(0);
  });
});

describe("calculateSentiment()", () => {
  it("should return positive for scores >= 80", () => {
    expect(calculateSentiment(85)).toBe("positive");
    expect(calculateSentiment(100)).toBe("positive");
  });

  it("should return neutral for scores between 50 and 79", () => {
    expect(calculateSentiment(65)).toBe("neutral");
  });

  it("should return negative for scores < 50", () => {
    expect(calculateSentiment(30)).toBe("negative");
  });
});

// ─── Points Calculation ──────────────────────────────────────────────────────
function calculatePoints(score: number): number {
  if (score >= 90) return 15;
  if (score >= 75) return 10;
  if (score >= 60) return 5;
  return 2;
}

describe("calculatePoints()", () => {
  it("should award 15 points for score >= 90", () => {
    expect(calculatePoints(95)).toBe(15);
  });

  it("should award 10 points for score 75-89", () => {
    expect(calculatePoints(80)).toBe(10);
  });

  it("should award 5 points for score 60-74", () => {
    expect(calculatePoints(65)).toBe(5);
  });

  it("should award 2 points for score < 60", () => {
    expect(calculatePoints(40)).toBe(2);
  });
});

// ─── Coaching Plan Weaknesses Analysis ──────────────────────────────────────
function analyzeWeaknesses(
  criteriaWeaknesses: Array<{ criterionName: string; category: string; score: number; maxScore: number; weight: number }>,
): Array<{ criterionName: string; category: string; weaknessScore: number }> {
  return criteriaWeaknesses.map((c) => ({
    criterionName: c.criterionName,
    category: c.category,
    weaknessScore: Math.max(0, c.maxScore - c.score),
  })).sort((a, b) => b.weaknessScore - a.weaknessScore);
}

describe("analyzeWeaknesses()", () => {
  it("should sort by weakness score descending", () => {
    const result = analyzeWeaknesses([
      { criterionName: "Opening", category: "Technique", score: 8, maxScore: 10, weight: 1 },
      { criterionName: "Closing", category: "Technique", score: 3, maxScore: 10, weight: 1 },
      { criterionName: "Objections", category: "Handling", score: 5, maxScore: 10, weight: 1 },
    ]);
    expect(result[0].criterionName).toBe("Closing");
    expect(result[1].criterionName).toBe("Objections");
    expect(result[2].criterionName).toBe("Opening");
  });

  it("should handle empty input", () => {
    expect(analyzeWeaknesses([])).toEqual([]);
  });
});

// ─── Roleplay Session Scoring ────────────────────────────────────────────────
interface RoleplayStage {
  name: string;
  keywords: string[];
  maxScore: number;
}

interface RoleplayState {
  stage: number;
  scores: number[];
}

function scoreRoleplayTurn(state: RoleplayState, stages: RoleplayStage[], message: string): number {
  if (state.stage >= stages.length) return 0;
  const stage = stages[state.stage];
  const msgLower = message.toLowerCase();
  const matchedKeywords = stage.keywords.filter((kw) => msgLower.includes(kw.toLowerCase()));
  const score = Math.min(stage.maxScore, Math.round((matchedKeywords.length / stage.keywords.length) * stage.maxScore));
  return score;
}

describe("scoreRoleplayTurn()", () => {
  const stages: RoleplayStage[] = [
    { name: "Opening", keywords: ["hello", "hi", "how are you", "introduction"], maxScore: 10 },
    { name: "Discovery", keywords: ["need", "problem", "help", "challenge"], maxScore: 15 },
  ];

  it("should score based on keyword matches", () => {
    const state: RoleplayState = { stage: 0, scores: [] };
    const score = scoreRoleplayTurn(state, stages, "Hello! How are you today? Let me introduce myself.");
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(10);
  });

  it("should return 0 for no keyword matches", () => {
    const state: RoleplayState = { stage: 1, scores: [] };
    const score = scoreRoleplayTurn(state, stages, "The weather is nice today.");
    expect(score).toBe(0);
  });

  it("should return 0 if stage is out of bounds", () => {
    const state: RoleplayState = { stage: 99, scores: [] };
    const score = scoreRoleplayTurn(state, stages, "Hello!");
    expect(score).toBe(0);
  });
});

// ─── JSON Response Builder ──────────────────────────────────────────────────
function jsonResponse(data: unknown, status = 200): { status: number; body: string } {
  return { status, body: JSON.stringify(data) };
}

describe("jsonResponse()", () => {
  it("should return JSON stringified body", () => {
    const res = jsonResponse({ success: true });
    expect(res.status).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ success: true });
  });

  it("should use custom status code", () => {
    const res = jsonResponse({ error: "Not found" }, 404);
    expect(res.status).toBe(404);
  });
});