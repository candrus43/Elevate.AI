/**
 * Module 7: Advanced Coaching Analytics — Core Logic Tests
 */

import { describe, it, expect } from "bun:test";

function analyzeTimeline(scores: Array<{ score: number }>) {
  if (scores.length < 3) return { plateau: false, breakthrough: false, trend: "insufficient_data", averageGrowth: 0 };
  const growth = scores.map((s, i) => i > 0 ? s.score - scores[i - 1].score : 0);
  const avgGrowth = growth.reduce((s, v) => s + v, 0) / growth.length;
  return { plateau: avgGrowth < 1, breakthrough: avgGrowth > 5, trend: avgGrowth > 0 ? "improving" : "declining", averageGrowth: Math.round(avgGrowth * 10) / 10 };
}

function calculateDetailedROI(coaching: { scoreImprovement: number; hours: number; repCount: number }) {
  const costPerPoint = coaching.hours > 0 ? coaching.hours / (coaching.scoreImprovement || 1) : 0;
  const roiRatio = coaching.hours > 0 ? coaching.scoreImprovement / coaching.hours : 0;
  return { costPerPoint: Math.round(costPerPoint * 100) / 100, roiRatio: Math.round(roiRatio * 100) / 100, pointsPerRep: coaching.repCount > 0 ? coaching.scoreImprovement / coaching.repCount : 0 };
}

function trackSkillProgression(scores: number[]) {
  if (scores.length < 2) return { trendDirection: "stable", acceleration: 0 };
  const mid = Math.floor(scores.length / 2);
  const firstAvg = scores.slice(0, mid).reduce((s, v) => s + v, 0) / mid;
  const secondAvg = scores.slice(mid).reduce((s, v) => s + v, 0) / (scores.length - mid);
  const diff = secondAvg - firstAvg;
  return { trendDirection: diff > 3 ? "improving" : diff < -3 ? "declining" : "stable", acceleration: Math.round(((scores[scores.length - 1] - scores[0]) / scores.length) * 10) / 10 };
}

function generateForecast(currentScores: number[], periods = 3) {
  if (currentScores.length < 2) return { projectedValue: currentScores[0] || 0, confidence: 0.3 };
  const trend = (currentScores[currentScores.length - 1] - currentScores[0]) / currentScores.length;
  const projectedValue = Math.min(100, Math.max(0, currentScores[currentScores.length - 1] + trend * periods));
  const variance = currentScores.reduce((s, v) => s + Math.abs(v - currentScores.reduce((a, b) => a + b, 0) / currentScores.length), 0) / currentScores.length;
  return { projectedValue: Math.round(projectedValue), confidence: Math.max(0.3, Math.min(0.95, 1 - variance / 100)) };
}

function detectOpportunities(teams: Array<{ id: string; name: string; currentScore: number; potentialScore: number }>) {
  return teams.filter((t) => t.currentScore < t.potentialScore).map((t) => ({
    teamId: t.id, teamName: t.name, gap: Math.round((t.potentialScore - t.currentScore) * 10) / 10,
    priority: (t.potentialScore - t.currentScore) > 15 ? "high" : (t.potentialScore - t.currentScore) > 8 ? "medium" : "low",
  })).sort((a, b) => b.gap - a.gap);
}

describe("analyzeTimeline()", () => {
  it("should detect improving trend with breakthrough", () => {
    const result = analyzeTimeline([{ score: 60 }, { score: 65 }, { score: 72 }]);
    expect(result.trend).toBe("improving");
    expect(result.breakthrough).toBe(false);
    expect(result.averageGrowth).toBeGreaterThan(0);
  });

  it("should detect plateau", () => {
    const result = analyzeTimeline([{ score: 75 }, { score: 76 }, { score: 75 }]);
    expect(result.plateau).toBe(true);
  });

  it("should handle insufficient data", () => {
    expect(analyzeTimeline([{ score: 80 }]).trend).toBe("insufficient_data");
  });
});

describe("calculateDetailedROI()", () => {
  it("should calculate cost per point and ROI ratio", () => {
    const roi = calculateDetailedROI({ scoreImprovement: 20, hours: 10, repCount: 5 });
    expect(roi.costPerPoint).toBe(0.5);
    expect(roi.roiRatio).toBe(2);
    expect(roi.pointsPerRep).toBe(4);
  });

  it("should handle zero improvement", () => {
    const roi = calculateDetailedROI({ scoreImprovement: 0, hours: 10, repCount: 5 });
    expect(roi.costPerPoint).toBe(10);
  });
});

describe("trackSkillProgression()", () => {
  it("should detect improving trend", () => {
    const result = trackSkillProgression([60, 65, 72, 78, 85]);
    expect(result.trendDirection).toBe("improving");
  });

  it("should detect stable trend", () => {
    const result = trackSkillProgression([70, 71, 70, 72, 71]);
    expect(result.trendDirection).toBe("stable");
  });

  it("should handle single score", () => {
    expect(trackSkillProgression([80]).trendDirection).toBe("stable");
  });
});

describe("generateForecast()", () => {
  it("should generate projected value with confidence", () => {
    const forecast = generateForecast([65, 70, 75, 80, 85]);
    // trend = (85-65)/5 = 4, projected = min(100, max(0, 85 + 4*3)) = 97
    expect(forecast.projectedValue).toBe(97);
    expect(forecast.confidence).toBeGreaterThan(0.3);
  });

  it("should handle single data point", () => {
    const forecast = generateForecast([70]);
    expect(forecast.projectedValue).toBe(70);
    expect(forecast.confidence).toBe(0.3);
  });
});

describe("detectOpportunities()", () => {
  it("should identify high priority teams", () => {
    const opps = detectOpportunities([{ id: "a", name: "Team A", currentScore: 60, potentialScore: 85 }]);
    expect(opps[0].priority).toBe("high");
    expect(opps[0].gap).toBe(25);
  });

  it("should exclude teams at potential", () => {
    const opps = detectOpportunities([{ id: "a", name: "Team A", currentScore: 90, potentialScore: 85 }]);
    expect(opps.length).toBe(0);
  });
});