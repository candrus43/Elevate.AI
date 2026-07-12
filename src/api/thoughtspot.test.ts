/**
 * ThoughtSpot Integration — Core Logic Tests
 */

import { describe, it, expect } from "bun:test";

function mapThoughtSpotDataToCoaching(rawData: any, dataType: string): any {
  switch (dataType) {
    case "sales_performance":
      return {
        enriched: rawData.data.map((r: any) => ({
          repName: r.rep, fieldMetrics: { dealsClosed: r.deals_closed, winRate: r.win_rate },
          coachingInsight: `Win rate: ${(r.win_rate * 100).toFixed(0)}%`,
        })),
        summary: { totalDeals: rawData.data.reduce((s: number, r: any) => s + r.deals_closed, 0) },
      };
    case "team_metrics":
      return { enriched: { ...rawData.data }, coachingInsight: `Quota: ${(rawData.data.quota_attainment * 100).toFixed(0)}%` };
    case "skill_benchmarks":
      return {
        enriched: rawData.data.map((s: any) => ({ skill: s.skill, gapToIndustry: (s.industry_avg - s.rep_avg).toFixed(1) })),
        summary: { biggestGap: rawData.data.sort((a: any, b: any) => (b.industry_avg - b.rep_avg) - (a.industry_avg - a.rep_avg))[0]?.skill },
      };
    default:
      return { enriched: rawData.data, insight: "Mapped" };
  }
}

const QUERY_TYPES = ["sales_performance", "pipeline_metrics", "team_metrics", "skill_benchmarks"];

describe("mapThoughtSpotDataToCoaching()", () => {
  it("should map sales performance data", () => {
    const data = { data: [{ rep: "Alex", deals_closed: 8, pipeline_value: 450000, win_rate: 0.62, avg_deal_size: 56250 }] };
    const mapped = mapThoughtSpotDataToCoaching(data, "sales_performance");
    expect(mapped.enriched[0].repName).toBe("Alex");
    expect(mapped.enriched[0].coachingInsight).toContain("62%");
    expect(mapped.summary.totalDeals).toBe(8);
  });

  it("should map team metrics", () => {
    const data = { data: { total_reps: 12, avg_win_rate: 0.58, quota_attainment: 0.85, coaching_hours: 18.5 } };
    const mapped = mapThoughtSpotDataToCoaching(data, "team_metrics");
    expect(mapped.coachingInsight).toContain("85%");
  });

  it("should map skill benchmarks", () => {
    const data = { data: [{ skill: "Discovery", rep_avg: 72, industry_avg: 68, top_performer: 88 }, { skill: "Closing", rep_avg: 65, industry_avg: 62, top_performer: 82 }] };
    const mapped = mapThoughtSpotDataToCoaching(data, "skill_benchmarks");
    expect(mapped.enriched[0].skill).toBe("Discovery");
    expect(mapped.summary.biggestGap).toBeDefined();
  });

  it("should handle default case", () => {
    const mapped = mapThoughtSpotDataToCoaching({ data: [{ id: 1 }] }, "unknown_type");
    expect(mapped.insight).toBe("Mapped");
  });
});

describe("QUERY_TYPES", () => {
  it("should include 4 query types", () => {
    expect(QUERY_TYPES.length).toBe(4);
    expect(QUERY_TYPES).toContain("sales_performance");
    expect(QUERY_TYPES).toContain("skill_benchmarks");
  });
});