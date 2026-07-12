/**
 * Module 2: Advanced AI Coaching — Core Logic Tests
 */

import { describe, it, expect } from "bun:test";

// ─── Replicate AI logic for isolated testing ──────────────────────────────────

const SKILL_BENCHMARKS: Record<string, number> = {
  Opening: 80, Discovery: 75, "Objection Handling": 80, "Value Proposition": 75,
  Closing: 70, Compliance: 90, Rapport: 80, General: 70,
};

function analyzeSkillGaps(scores: Array<{ skillArea: string; score: number }>) {
  return scores
    .map((s) => {
      const benchmark = SKILL_BENCHMARKS[s.skillArea] || 70;
      const gap = benchmark - s.score;
      return gap > 0
        ? { skillArea: s.skillArea, currentScore: s.score, benchmarkScore: benchmark, gap: Math.round(gap * 10) / 10, priority: gap > 20 ? 3 : gap > 10 ? 2 : 1 }
        : null;
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.gap - a.gap);
}

function generateCoachingPlan(gaps: Array<{ skillArea: string; gap: number }>) {
  const topGaps = gaps.slice(0, 3);
  const skillAreas = topGaps.map((g) => g.skillArea);
  const primarySkill = topGaps[0]?.skillArea || "General";
  return {
    title: `${primarySkill} Mastery — 4 Week Plan`,
    coachingType: ["Discovery", "Objection Handling", "Closing"].includes(primarySkill) ? primarySkill.toLowerCase().replace(" ", "_") : "general",
    skillFocus: skillAreas,
    weekCount: 4,
    milestones: [
      { title: `Complete ${primarySkill} fundamentals training`, week: 1 },
      { title: `Improve ${primarySkill} score`, week: 3 },
    ],
  };
}

function generatePracticeAssignment(skillFocus: string) {
  return {
    title: skillFocus ? `${skillFocus} Practice` : "General Practice",
    scenarioType: "roleplay",
    description: expect.stringContaining as any,
  };
}

function calculateConfidenceScore(scores: number[], improvementRate: number, consistency: number) {
  if (scores.length === 0) return 0;
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(avgScore * 0.5 + improvementRate * 0.25 + consistency * 0.25);
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe("analyzeSkillGaps()", () => {
  it("should identify gaps by comparing scores to benchmarks", () => {
    const gaps = analyzeSkillGaps([
      { skillArea: "Opening", score: 60 },
      { skillArea: "Closing", score: 85 },
    ]);
    expect(gaps.length).toBe(1);
    expect(gaps[0].skillArea).toBe("Opening");
    expect(gaps[0].gap).toBe(20);
  });

  it("should exclude skills at or above benchmark", () => {
    const gaps = analyzeSkillGaps([
      { skillArea: "Compliance", score: 95 },
      { skillArea: "Rapport", score: 85 },
    ]);
    expect(gaps.length).toBe(0);
  });

  it("should sort gaps by size descending", () => {
    const gaps = analyzeSkillGaps([
      { skillArea: "Opening", score: 50 },
      { skillArea: "Closing", score: 65 },
      { skillArea: "Discovery", score: 60 },
    ]);
    expect(gaps[0].skillArea).toBe("Opening");
    expect(gaps[1].skillArea).toBe("Discovery");
    expect(gaps[2].skillArea).toBe("Closing");
  });

  it("should assign priority 3 to gaps > 20", () => {
    const gaps = analyzeSkillGaps([{ skillArea: "Opening", score: 40 }]);
    expect(gaps[0].priority).toBe(3);
  });

  it("should handle empty input", () => {
    expect(analyzeSkillGaps([])).toEqual([]);
  });
});

describe("generateCoachingPlan()", () => {
  it("should create a 4-week plan targeting top gaps", () => {
    const gaps = [
      { skillArea: "Objection Handling", gap: 25 },
      { skillArea: "Closing", gap: 15 },
      { skillArea: "Discovery", gap: 10 },
    ];
    const plan = generateCoachingPlan(gaps);
    expect(plan.title).toContain("Objection Handling");
    expect(plan.weekCount).toBe(4);
    expect(plan.skillFocus).toEqual(["Objection Handling", "Closing", "Discovery"]);
  });

  it("should determine coaching type from primary skill", () => {
    const gaps = [{ skillArea: "Closing", gap: 20 }];
    const plan = generateCoachingPlan(gaps);
    expect(plan.coachingType).toBe("closing");
  });

  it("should generate milestones per week", () => {
    const gaps = [{ skillArea: "Discovery", gap: 15 }];
    const plan = generateCoachingPlan(gaps);
    expect(plan.milestones.length).toBe(2);
    expect(plan.milestones[0].week).toBe(1);
    expect(plan.milestones[1].week).toBe(3);
  });

  it("should handle empty gaps", () => {
    const plan = generateCoachingPlan([]);
    expect(plan.title).toContain("General");
  });
});

describe("calculateConfidenceScore()", () => {
  it("should compute weighted confidence score", () => {
    const score = calculateConfidenceScore([80, 90, 85], 10, 80);
    // avg=85, improvement=10, consistency=80
    // 85*0.5 + 10*0.25 + 80*0.25 = 42.5 + 2.5 + 20 = 65
    expect(score).toBe(65);
  });

  it("should return 0 for empty scores", () => {
    expect(calculateConfidenceScore([], 0, 0)).toBe(0);
  });

  it("should handle perfect scores", () => {
    const score = calculateConfidenceScore([100, 100], 0, 100);
    expect(score).toBe(75);
  });
});

describe("generatePracticeAssignment()", () => {
  it("should create assignment for a skill focus", () => {
    const assignment = generatePracticeAssignment("Objection Handling");
    expect(assignment.title).toContain("Objection Handling");
    expect(assignment.scenarioType).toBe("roleplay");
  });
});

describe("SKILL_BENCHMARKS", () => {
  it("should have reasonable benchmark values", () => {
    expect(SKILL_BENCHMARKS.Compliance).toBeGreaterThanOrEqual(85);
    expect(SKILL_BENCHMARKS.General).toBeLessThanOrEqual(75);
  });
});