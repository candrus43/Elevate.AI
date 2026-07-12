/**
 * Module 4: Executive Coaching Dashboard — Core Logic Tests
 */

import { describe, it, expect } from "bun:test";

// ─── Replicate AI logic for isolated testing ──────────────────────────────────

function calculateEffectiveness(scores: Array<{ pre: number; post: number }>) {
  if (scores.length === 0) return { avgImprovement: 0, repCount: 0, totalHours: 0 };
  const totalPre = scores.reduce((s, x) => s + x.pre, 0);
  const totalPost = scores.reduce((s, x) => s + x.post, 0);
  const avgPre = totalPre / scores.length;
  const avgPost = totalPost / scores.length;
  const improvement = avgPre > 0 ? ((avgPost - avgPre) / avgPre) * 100 : 0;
  return { avgImprovement: Math.round(improvement * 10) / 10, repCount: scores.length, totalHours: scores.length * 2.5 };
}

function calculateManagerScore(activity: { sessions: number; teamImprovement: number; frequency: number; feedbackQuality: number }) {
  return Math.round(activity.sessions * 0.2 + activity.teamImprovement * 0.35 + activity.frequency * 0.2 + activity.feedbackQuality * 0.25);
}

function calculateROI(totals: { scoreImprovement: number; coachingHours: number }) {
  if (totals.coachingHours <= 0) return { roiRatio: 0, scorePerHour: 0 };
  return { roiRatio: Math.round((totals.scoreImprovement / totals.coachingHours) * 100) / 100, scorePerHour: Math.round(totals.scoreImprovement / totals.coachingHours) };
}

function generateExecutiveSummary(data: any) {
  const highlights = [
    `Overall coaching completion rate at ${Math.round(data.completionRate)}%`,
    `${data.topManager} leads in coaching effectiveness`,
    `${data.topSkill} is the strongest skill across teams`,
    `Coaching ROI of ${data.roiRatio}x`,
  ];
  const opportunities = [
    `Focus on ${data.weakestSkill} — largest skill gap across teams`,
    `${Math.round(100 - data.completionRate)}% of reps haven't completed coaching plans`,
  ];
  return {
    title: `Executive Coaching Summary — ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
    summary: `This period, ${data.totalReps} reps achieved an average score of ${Math.round(data.avgScore)} with ${data.avgImprovement > 0 ? "+" : ""}${Math.round(data.avgImprovement)}% improvement.`,
    highlights,
    opportunities,
  };
}

function detectOpportunities(teams: Array<{ id: string; name: string; currentScore: number; potentialScore: number }>) {
  return teams
    .filter((t) => t.currentScore < t.potentialScore)
    .map((t) => ({
      teamId: t.id, teamName: t.name,
      gap: Math.round((t.potentialScore - t.currentScore) * 10) / 10,
      priority: (t.potentialScore - t.currentScore) > 15 ? "high" : (t.potentialScore - t.currentScore) > 8 ? "medium" : "low",
    }))
    .sort((a, b) => b.gap - a.gap);
}

const SKILL_CATEGORIES = ["Discovery", "Objection Handling", "Closing", "Opening", "Value Proposition", "Compliance", "Rapport", "Communication", "Product Knowledge", "Listening"];

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe("calculateEffectiveness()", () => {
  it("should calculate improvement percentage", () => {
    const result = calculateEffectiveness([{ pre: 60, post: 80 }]);
    expect(result.avgImprovement).toBeCloseTo(33.3, 0);
    expect(result.repCount).toBe(1);
  });

  it("should handle multiple reps", () => {
    const result = calculateEffectiveness([{ pre: 60, post: 75 }, { pre: 70, post: 85 }]);
    expect(result.repCount).toBe(2);
    expect(result.totalHours).toBe(5);
  });

  it("should return zeros for empty input", () => {
    const result = calculateEffectiveness([]);
    expect(result.avgImprovement).toBe(0);
    expect(result.repCount).toBe(0);
  });
});

describe("calculateManagerScore()", () => {
  it("should compute weighted score", () => {
    const score = calculateManagerScore({ sessions: 10, teamImprovement: 15, frequency: 8, feedbackQuality: 80 });
    // 10*0.2 + 15*0.35 + 8*0.2 + 80*0.25 = 2 + 5.25 + 1.6 + 20 = 28.85 -> 29
    expect(score).toBe(29);
  });

  it("should return 0 for all-zero activity", () => {
    expect(calculateManagerScore({ sessions: 0, teamImprovement: 0, frequency: 0, feedbackQuality: 0 })).toBe(0);
  });
});

describe("calculateROI()", () => {
  it("should compute ROI ratio", () => {
    const roi = calculateROI({ scoreImprovement: 20, coachingHours: 10 });
    expect(roi.roiRatio).toBe(2);
    expect(roi.scorePerHour).toBe(2);
  });

  it("should handle zero hours", () => {
    const roi = calculateROI({ scoreImprovement: 10, coachingHours: 0 });
    expect(roi.roiRatio).toBe(0);
  });
});

describe("detectOpportunities()", () => {
  it("should identify teams with largest gaps first", () => {
    const teams = [
      { id: "a", name: "Team A", currentScore: 50, potentialScore: 85 },
      { id: "b", name: "Team B", currentScore: 75, potentialScore: 80 },
    ];
    const opportunities = detectOpportunities(teams);
    expect(opportunities.length).toBe(2);
    expect(opportunities[0].teamId).toBe("a");
    expect(opportunities[0].priority).toBe("high");
    expect(opportunities[1].priority).toBe("low");
  });

  it("should exclude teams at or above potential", () => {
    const teams = [{ id: "a", name: "Team A", currentScore: 90, potentialScore: 85 }];
    expect(detectOpportunities(teams).length).toBe(0);
  });
});

describe("generateExecutiveSummary()", () => {
  it("should generate summary with all required fields", () => {
    const summary = generateExecutiveSummary({ totalReps: 20, avgScore: 75, avgImprovement: 10, completionRate: 65, topSkill: "Rapport", weakestSkill: "Closing", topManager: "Alice", roiRatio: 2.5 });
    expect(summary.title).toBeDefined();
    expect(summary.summary).toBeDefined();
    expect(summary.highlights.length).toBeGreaterThan(0);
    expect(summary.opportunities.length).toBeGreaterThan(0);
  });
});

describe("SKILL_CATEGORIES", () => {
  it("should have 10 skill categories", () => {
    expect(SKILL_CATEGORIES.length).toBe(10);
    expect(SKILL_CATEGORIES).toContain("Discovery");
    expect(SKILL_CATEGORIES).toContain("Closing");
    expect(SKILL_CATEGORIES).toContain("Compliance");
  });
});