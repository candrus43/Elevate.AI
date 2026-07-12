/**
 * Module 6: Coaching Automation — Core Logic Tests
 */

import { describe, it, expect } from "bun:test";

function generateDailyBriefing(metrics: { totalReps: number; avgScore: number; topPerformer: string; weakestSkill: string; trends: Array<{ score: number }> }) {
  const trendDir = metrics.trends.length > 1 && metrics.trends[metrics.trends.length - 1].score > metrics.trends[0].score ? "upward" : "downward";
  return {
    title: `Daily Coaching Briefing — ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}`,
    summary: `${metrics.totalReps} reps active today. Top performer: ${metrics.topPerformer}. Focus: ${metrics.weakestSkill}.`,
    metrics: { totalReps: metrics.totalReps, averageScore: Math.round(metrics.avgScore), trendDirection: trendDir },
    highlights: [`Top performer: ${metrics.topPerformer}`, `Focus area: ${metrics.weakestSkill}`],
    recommendations: [`Schedule 1:1 coaching on ${metrics.weakestSkill}`, `Share ${metrics.topPerformer}'s best practices`],
  };
}

function generateWeeklySummary(metrics: { startScore: number; endScore: number; totalCoachingHours: number; completionRate: number }) {
  const improvement = metrics.endScore - metrics.startScore;
  return {
    title: `Weekly Coaching Summary — W${Math.floor(((+new Date() - +new Date(new Date().getFullYear(), 0, 4)) / 86400000 + 1 + ((new Date(new Date().getFullYear(), 0, 4).getDay() + 6) % 7)) / 7)}`,
    summary: `Score improvement: ${improvement > 0 ? "+" : ""}${Math.round(improvement)} points. Coaching hours: ${Math.round(metrics.totalCoachingHours)}. Completion: ${Math.round(metrics.completionRate)}%.`,
    metrics: { startScore: Math.round(metrics.startScore), endScore: Math.round(metrics.endScore), improvement: Math.round(improvement) },
  };
}

function generateMonthlyReport(metrics: { avgScore: number; totalCoachingSessions: number; completionRate: number; roiRatio: number }) {
  return {
    title: `Monthly Coaching Report — ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
    summary: `Average score: ${Math.round(metrics.avgScore)}. Sessions: ${metrics.totalCoachingSessions}. Completion: ${Math.round(metrics.completionRate)}%. ROI: ${metrics.roiRatio}x.`,
    metrics: { averageScore: Math.round(metrics.avgScore), totalSessions: metrics.totalCoachingSessions, completionRate: Math.round(metrics.completionRate), roiRatio: metrics.roiRatio },
  };
}

describe("generateDailyBriefing()", () => {
  it("should generate briefing with all required fields", () => {
    const briefing = generateDailyBriefing({ totalReps: 20, avgScore: 78, topPerformer: "Alice", weakestSkill: "Closing", trends: [{ score: 75 }, { score: 80 }, { score: 82 }] });
    expect(briefing.title).toBeDefined();
    expect(briefing.summary).toBeDefined();
    expect(briefing.metrics.totalReps).toBe(20);
    expect(briefing.metrics.trendDirection).toBe("upward");
    expect(briefing.highlights.length).toBeGreaterThan(0);
    expect(briefing.recommendations.length).toBeGreaterThan(0);
  });

  it("should detect downward trend", () => {
    const briefing = generateDailyBriefing({ totalReps: 10, avgScore: 70, topPerformer: "Bob", weakestSkill: "Discovery", trends: [{ score: 80 }, { score: 75 }, { score: 70 }] });
    expect(briefing.metrics.trendDirection).toBe("downward");
  });
});

describe("generateWeeklySummary()", () => {
  it("should generate weekly summary with improvement calculation", () => {
    const summary = generateWeeklySummary({ startScore: 65, endScore: 78, totalCoachingHours: 12, completionRate: 85 });
    expect(summary.title).toBeDefined();
    expect(summary.metrics.improvement).toBe(13);
  });
});

describe("generateMonthlyReport()", () => {
  it("should generate monthly report", () => {
    const report = generateMonthlyReport({ avgScore: 75, totalCoachingSessions: 45, completionRate: 72, roiRatio: 2.5 });
    expect(report.title).toBeDefined();
    expect(report.metrics.averageScore).toBe(75);
    expect(report.metrics.totalSessions).toBe(45);
  });
});