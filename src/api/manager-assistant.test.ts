/**
 * Module 1: AI Manager Assistant — Core Logic Tests
 */

import { describe, it, expect } from "bun:test";

// ─── Replicate core AI logic for isolated testing ──────────────────────────────

function analyzeStrengths(scores: Array<{ category: string; score: number; maxScore: number }>) {
  const categoryScores: Record<string, number[]> = {};
  for (const s of scores) {
    if (!categoryScores[s.category]) categoryScores[s.category] = [];
    categoryScores[s.category].push((s.score / s.maxScore) * 100);
  }
  return Object.entries(categoryScores)
    .map(([category, vals]) => ({ category, strengthScore: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) }))
    .sort((a, b) => b.strengthScore - a.strengthScore);
}

function generateDailyPriorities(teamData: Array<{ id: string; name: string; avgScore: number; totalCalls: number; coachingCompleted: number; recentScores: number[] }>) {
  const priorities: Array<{ repId: string; repName: string; priority: string; reason: string; urgency: string }> = [];
  for (const rep of teamData) {
    if (rep.avgScore < 60) {
      priorities.push({ repId: rep.id, repName: rep.name, priority: "Critical performance intervention", reason: `Avg score ${rep.avgScore}`, urgency: "high" });
    } else if (rep.recentScores.length >= 3 && rep.recentScores.slice(-3).every((s) => s < rep.avgScore)) {
      priorities.push({ repId: rep.id, repName: rep.name, priority: "Declining scores", reason: "3 consecutive calls below average", urgency: "high" });
    } else if (rep.coachingCompleted === 0 && rep.totalCalls > 5) {
      priorities.push({ repId: rep.id, repName: rep.name, priority: "No coaching engagement", reason: `${rep.totalCalls} calls, 0 coaching`, urgency: "medium" });
    } else if (rep.avgScore >= 80) {
      priorities.push({ repId: rep.id, repName: rep.name, priority: "High perfomer", reason: `Score ${rep.avgScore}`, urgency: "low" });
    }
  }
  return priorities.sort((a, b) => (a.urgency === "high" ? -1 : b.urgency === "high" ? 1 : 0));
}

function generateRiskAlerts(rep: { avgScore: number; recentScores: number[]; coachingCompleted: number; totalCalls: number }) {
  const alerts: Array<{ type: string; severity: string; title: string }> = [];
  if (rep.avgScore < 60) {
    alerts.push({ type: "low_score", severity: "high", title: "Critically low average score" });
  }
  if (rep.recentScores.length >= 3 && rep.recentScores.slice(-3).every((s) => s < 70)) {
    alerts.push({ type: "declining_scores", severity: "high", title: "Consistently low recent scores" });
  }
  if (rep.coachingCompleted === 0 && rep.totalCalls > 10) {
    alerts.push({ type: "low_engagement", severity: "medium", title: "No coaching engagement" });
  }
  return alerts;
}

function generateActionItems(weaknesses: Array<{ criterionName: string; weaknessScore: number }>) {
  const items: Array<{ title: string }> = [];
  const topWeaknesses = weaknesses.slice(0, 3);
  for (const w of topWeaknesses) {
    items.push({ title: `Improve ${w.criterionName}` });
  }
  items.push({ title: "Complete recommended training module" });
  items.push({ title: "Schedule weekly coaching session" });
  return items;
}

function generateGoalRecommendations(avgScore: number, weaknesses: Array<{ criterionName: string; weaknessScore: number }>) {
  const goals: Array<{ goalType: string; title: string; target: number; current: number }> = [];
  goals.push({ goalType: "score", title: "Improve average call score", target: Math.min(100, avgScore + 10), current: avgScore });
  if (weaknesses.length > 0) {
    goals.push({ goalType: "skill", title: `Master ${weaknesses[0].criterionName}`, target: 80, current: Math.max(10, 100 - weaknesses[0].weaknessScore) });
  }
  goals.push({ goalType: "coaching", title: "Complete 4 coaching sessions this month", target: 4, current: 0 });
  return goals;
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe("analyzeStrengths()", () => {
  it("should sort categories by score descending", () => {
    const result = analyzeStrengths([
      { category: "Opening", score: 9, maxScore: 10 },
      { category: "Closing", score: 4, maxScore: 10 },
      { category: "Discovery", score: 7, maxScore: 10 },
    ]);
    expect(result[0].category).toBe("Opening");
    expect(result[1].category).toBe("Discovery");
    expect(result[2].category).toBe("Closing");
  });

  it("should handle empty input", () => {
    expect(analyzeStrengths([])).toEqual([]);
  });
});

describe("generateDailyPriorities()", () => {
  it("should flag low-scoring reps as high urgency", () => {
    const team = [
      { id: "1", name: "Rep A", avgScore: 45, totalCalls: 10, coachingCompleted: 0, recentScores: [40, 50, 45] },
      { id: "2", name: "Rep B", avgScore: 85, totalCalls: 15, coachingCompleted: 3, recentScores: [80, 85, 90] },
    ];
    const priorities = generateDailyPriorities(team);
    expect(priorities[0].urgency).toBe("high");
    expect(priorities[0].repName).toBe("Rep A");
  });

  it("should list high performers as low urgency", () => {
    const team = [
      { id: "1", name: "Rep A", avgScore: 92, totalCalls: 20, coachingCompleted: 5, recentScores: [90, 95, 91] },
    ];
    const priorities = generateDailyPriorities(team);
    expect(priorities[0].urgency).toBe("low");
  });

  it("should flag declining scores", () => {
    const team = [
      { id: "1", name: "Rep A", avgScore: 75, totalCalls: 10, coachingCompleted: 1, recentScores: [65, 60, 55] },
    ];
    const priorities = generateDailyPriorities(team);
    const declining = priorities.find((p) => p.priority.includes("Declining"));
    expect(declining).toBeDefined();
  });
});

describe("generateRiskAlerts()", () => {
  it("should generate high severity alert for low scores", () => {
    const alerts = generateRiskAlerts({ avgScore: 45, recentScores: [40, 50], coachingCompleted: 1, totalCalls: 10 });
    expect(alerts.some((a) => a.type === "low_score" && a.severity === "high")).toBe(true);
  });

  it("should detect declining scores", () => {
    const alerts = generateRiskAlerts({ avgScore: 65, recentScores: [60, 55, 50], coachingCompleted: 2, totalCalls: 15 });
    expect(alerts.some((a) => a.type === "declining_scores")).toBe(true);
  });

  it("should detect low coaching engagement", () => {
    const alerts = generateRiskAlerts({ avgScore: 75, recentScores: [75, 80, 78], coachingCompleted: 0, totalCalls: 15 });
    expect(alerts.some((a) => a.type === "low_engagement")).toBe(true);
  });

  it("should return empty for healthy rep", () => {
    const alerts = generateRiskAlerts({ avgScore: 82, recentScores: [80, 85, 83], coachingCompleted: 3, totalCalls: 12 });
    expect(alerts.length).toBe(0);
  });
});

describe("generateActionItems()", () => {
  it("should generate 5 items from top 3 weaknesses", () => {
    const items = generateActionItems([
      { criterionName: "Closing", weaknessScore: 8 },
      { criterionName: "Objections", weaknessScore: 5 },
      { criterionName: "Opening", weaknessScore: 3 },
    ]);
    expect(items.length).toBe(5);
    expect(items[0].title).toContain("Closing");
  });

  it("should handle empty weaknesses", () => {
    const items = generateActionItems([]);
    expect(items.length).toBe(2); // Default items
  });
});

describe("generateGoalRecommendations()", () => {
  it("should include score improvement goal", () => {
    const goals = generateGoalRecommendations(65, [{ criterionName: "Closing", weaknessScore: 7 }]);
    expect(goals.some((g) => g.goalType === "score")).toBe(true);
  });

  it("should include skill mastery goal for top weakness", () => {
    const goals = generateGoalRecommendations(75, [{ criterionName: "Objections", weaknessScore: 8 }]);
    const skillGoal = goals.find((g) => g.goalType === "skill");
    expect(skillGoal).toBeDefined();
    expect(skillGoal!.title).toContain("Objections");
  });
});

describe("analyzeStrengths() edge cases", () => {
  it("should handle single category", () => {
    const result = analyzeStrengths([{ category: "General", score: 85, maxScore: 100 }]);
    expect(result.length).toBe(1);
    expect(result[0].strengthScore).toBe(85);
  });

  it("should correctly average multiple scores per category", () => {
    const result = analyzeStrengths([
      { category: "Opening", score: 8, maxScore: 10 },
      { category: "Opening", score: 6, maxScore: 10 },
    ]);
    expect(result[0].strengthScore).toBe(70); // (80+60)/2
  });
});