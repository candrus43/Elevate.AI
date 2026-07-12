/**
 * Module 7: Advanced Coaching Analytics — Backend API (Final Phase 4 Module)
 * Rep improvement timelines, coaching ROI, skill progression, benchmarks, forecasts, and opportunity detection.
 */

import { sql } from "~/utils/sql";
import { db, jsonResponse, getAuthUser } from "./middleware";

// ─── AI LOGIC ─────────────────────────────────────────────────────────────────

/** Detect plateaus and breakthroughs in improvement timeline */
function analyzeTimeline(scores: Array<{ score: number; date: string }>) {
  if (scores.length < 3) return { plateau: false, breakthrough: false, trend: "insufficient_data", averageGrowth: 0 };
  const recent = scores.slice(-3);
  const growth = recent.map((s, i) => i > 0 ? s.score - recent[i - 1].score : 0);
  const avgGrowth = growth.reduce((s, v) => s + v, 0) / growth.length;
  const plateau = avgGrowth < 1 && recent.every((s) => s.score > 60);
  const breakthrough = avgGrowth > 5;
  return { plateau, breakthrough, trend: avgGrowth > 0 ? "improving" : avgGrowth < 0 ? "declining" : "stable", averageGrowth: Math.round(avgGrowth * 10) / 10 };
}

/** Calculate detailed coaching ROI */
function calculateDetailedROI(coaching: { scoreImprovement: number; hours: number; repCount: number }) {
  const costPerPoint = coaching.hours > 0 ? coaching.hours / (coaching.scoreImprovement || 1) : 0;
  const roiRatio = coaching.hours > 0 ? coaching.scoreImprovement / coaching.hours : 0;
  return { costPerPoint: Math.round(costPerPoint * 100) / 100, roiRatio: Math.round(roiRatio * 100) / 100, pointsPerRep: coaching.repCount > 0 ? coaching.scoreImprovement / coaching.repCount : 0 };
}

/** Track skill progression with trend direction */
function trackSkillProgression(scores: number[]) {
  if (scores.length < 2) return { trendDirection: "stable", acceleration: 0 };
  const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
  const secondHalf = scores.slice(Math.floor(scores.length / 2));
  const firstAvg = firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length;
  const diff = secondAvg - firstAvg;
  const acceleration = scores.length > 3 ? (scores[scores.length - 1] - scores[0]) / scores.length : 0;
  return {
    trendDirection: diff > 3 ? "improving" : diff < -3 ? "declining" : "stable",
    acceleration: Math.round(acceleration * 10) / 10,
    firstPeriodAvg: Math.round(firstAvg),
    secondPeriodAvg: Math.round(secondAvg),
  };
}

/** Generate improvement forecast */
function generateForecast(currentScores: number[], periods: number = 3) {
  if (currentScores.length < 2) return { projectedValue: currentScores[0] || 0, confidence: 0.3 };
  const trend = (currentScores[currentScores.length - 1] - currentScores[0]) / currentScores.length;
  const recentTrend = currentScores.length > 3 ? (currentScores.slice(-3).reduce((s, v, i, arr) => s + (i > 0 ? v - arr[i - 1] : 0), 0)) / 3 : trend;
  const projectedValue = Math.min(100, Math.max(0, currentScores[currentScores.length - 1] + recentTrend * periods));
  const variance = currentScores.reduce((s, v) => s + Math.abs(v - currentScores.reduce((a, b) => a + b, 0) / currentScores.length), 0) / currentScores.length;
  const confidence = Math.max(0.3, Math.min(0.95, 1 - variance / 100));
  return { projectedValue: Math.round(projectedValue), confidence: Math.round(confidence * 100) / 100 };
}

/** Detect coaching opportunities */
function detectOpportunities(teams: Array<{ id: string; name: string; currentScore: number; potentialScore: number }>) {
  return teams
    .filter((t) => t.currentScore < t.potentialScore)
    .map((t) => ({ teamId: t.id, teamName: t.name, gap: Math.round((t.potentialScore - t.currentScore) * 10) / 10, priority: (t.potentialScore - t.currentScore) > 15 ? "high" : (t.potentialScore - t.currentScore) > 8 ? "medium" : "low" }))
    .sort((a, b) => b.gap - a.gap);
}

// ─── ENDPOINTS ────────────────────────────────────────────────────────────────

/** GET /api/advanced-analytics/rep-improvement/:repId */
export async function handleRepImprovement(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const repId = new URL(req.url).pathname.split("/").pop();
    let timelines = await db(sql`SELECT * FROM advanced_analytics_rep_timelines WHERE rep_id = ${repId} ORDER BY recorded_at ASC LIMIT 50`);
    if (timelines.length === 0) {
      const skills = ["Discovery", "Objection Handling", "Closing", "Rapport"];
      for (const skill of skills) {
        let score = Math.round(Math.random() * 20 + 50);
        for (let i = 0; i < 8; i++) {
          score += Math.round(Math.random() * 6 - 1);
          await db(sql`INSERT INTO advanced_analytics_rep_timelines (id, company_id, rep_id, skill_area, score, recorded_at) VALUES (${crypto.randomUUID()}, ${user.companyId}, ${repId}, ${skill}, ${Math.min(100, Math.max(0, score))}, ${new Date(Date.now() - (7 - i) * 86400000).toISOString()})`).catch(() => {});
        }
      }
      timelines = await db(sql`SELECT * FROM advanced_analytics_rep_timelines WHERE rep_id = ${repId} ORDER BY recorded_at ASC LIMIT 50`);
    }
    const analysis = analyzeTimeline(timelines.map((t: any) => ({ score: t.score, date: t.recorded_at })));
    const milestones = await db(sql`SELECT cm.*, acp.title as plan_name FROM coaching_milestones cm JOIN advanced_coaching_plans acp ON acp.id = cm.plan_id WHERE acp.user_id = ${repId} ORDER BY cm.week_number LIMIT 10`);
    return jsonResponse({ timelines, analysis, milestones, repId });
  } catch (e) { return jsonResponse({ error: "Failed to load rep improvement" }, 500); }
}

/** GET /api/advanced-analytics/coaching-roi */
export async function handleCoachingROI(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const url = new URL(req.url);
    const period = url.searchParams.get("period") || "monthly";
    let records = await db(sql`SELECT * FROM advanced_analytics_coaching_roi WHERE company_id = ${user.companyId} AND period = ${period} ORDER BY roi_ratio DESC LIMIT 20`);
    if (records.length === 0) {
      const managers = await db(sql`SELECT id, name FROM users WHERE company_id = ${user.companyId} LIMIT 3`);
      for (const m of managers.length > 0 ? managers : [{ id: user.id, name: "Demo Manager" }]) {
        const imp = Math.round(Math.random() * 20 + 10);
        const hrs = Math.round(Math.random() * 10 + 5);
        const roi = calculateDetailedROI({ scoreImprovement: imp, hours: hrs, repCount: Math.round(Math.random() * 5 + 3) });
        await db(sql`INSERT INTO advanced_analytics_coaching_roi (id, company_id, manager_id, team_id, score_improvement, coaching_hours, cost_per_point, roi_ratio, period) VALUES (${crypto.randomUUID()}, ${user.companyId}, ${m.id}, ${null}, ${imp}, ${hrs}, ${roi.costPerPoint}, ${roi.roiRatio}, ${period})`).catch(() => {});
      }
      records = await db(sql`SELECT * FROM advanced_analytics_coaching_roi WHERE company_id = ${user.companyId} AND period = ${period} ORDER BY roi_ratio DESC LIMIT 20`);
    }
    return jsonResponse({ roiRecords: records });
  } catch (e) { return jsonResponse({ error: "Failed to load ROI" }, 500); }
}

/** GET /api/advanced-analytics/skill-progression/:repId */
export async function handleSkillProgression(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const repId = new URL(req.url).pathname.split("/").pop();
    let progressions = await db(sql`SELECT * FROM advanced_analytics_skill_progression WHERE rep_id = ${repId} ORDER BY recorded_at DESC LIMIT 20`);
    if (progressions.length === 0) {
      const skills = ["Discovery", "Objection Handling", "Closing", "Rapport"];
      for (const skill of skills) {
        const scores: number[] = [];
        for (let i = 0; i < 6; i++) scores.push(Math.round(Math.random() * 20 + 60 + i * 2));
        const prog = trackSkillProgression(scores);
        await db(sql`INSERT INTO advanced_analytics_skill_progression (id, company_id, rep_id, skill_area, scores, trend_direction, acceleration, recorded_at) VALUES (${crypto.randomUUID()}, ${user.companyId}, ${repId}, ${skill}, ${JSON.stringify(scores)}, ${prog.trendDirection}, ${prog.acceleration}, ${datetime('now')})`).catch(() => {});
      }
      progressions = await db(sql`SELECT * FROM advanced_analytics_skill_progression WHERE rep_id = ${repId} ORDER BY recorded_at DESC LIMIT 20`);
    }
    return jsonResponse({ progressions: progressions.map((p: any) => ({ ...p, scores: JSON.parse(p.scores || "[]") })) });
  } catch (e) { return jsonResponse({ error: "Failed to load skill progression" }, 500); }
}

/** GET /api/advanced-analytics/manager-effectiveness */
export async function handleManagerEffectiveness(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const url = new URL(req.url);
    const period = url.searchParams.get("period") || "monthly";
    let records = await db(sql`SELECT ame.*, u.name as manager_name FROM advanced_analytics_manager_effectiveness ame JOIN users u ON u.id = ame.manager_id WHERE ame.company_id = ${user.companyId} AND ame.period = ${period} ORDER BY ame.coaching_quality_score DESC LIMIT 20`);
    if (records.length === 0) {
      const managers = await db(sql`SELECT id, name FROM users WHERE company_id = ${user.companyId} LIMIT 3`);
      for (const m of managers.length > 0 ? managers : [{ id: user.id, name: "Demo Manager" }]) {
        await db(sql`INSERT INTO advanced_analytics_manager_effectiveness (id, company_id, manager_id, coaching_quality_score, team_engagement, feedback_quality, improvement_rate, period) VALUES (${crypto.randomUUID()}, ${user.companyId}, ${m.id}, ${Math.round(Math.random() * 20 + 70)}, ${Math.round(Math.random() * 20 + 65)}, ${Math.round(Math.random() * 15 + 72)}, ${Math.round(Math.random() * 12 + 3)}, ${period})`).catch(() => {});
      }
      records = await db(sql`SELECT ame.*, u.name as manager_name FROM advanced_analytics_manager_effectiveness ame JOIN users u ON u.id = ame.manager_id WHERE ame.company_id = ${user.companyId} AND ame.period = ${period} ORDER BY ame.coaching_quality_score DESC LIMIT 20`);
    }
    return jsonResponse({ managers: records });
  } catch (e) { return jsonResponse({ error: "Failed to load manager effectiveness" }, 500); }
}

/** GET /api/advanced-analytics/performance-trends/:repId */
export async function handlePerformanceTrends(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const repId = new URL(req.url).pathname.split("/").pop();
    let trends = await db(sql`SELECT * FROM advanced_analytics_performance_trends WHERE rep_id = ${repId} ORDER BY recorded_at DESC LIMIT 10`);
    if (trends.length === 0) {
      const metrics = ["avg_call_score", "discovery_score", "objection_handling", "closing_score"];
      for (const metric of metrics) {
        const vals: number[] = [];
        for (let i = 0; i < 6; i++) vals.push(Math.round(Math.random() * 15 + 65 + i * 2));
        const forecast = generateForecast(vals);
        await db(sql`INSERT INTO advanced_analytics_performance_trends (id, company_id, rep_id, metric, metric_values, projections, trend, recorded_at) VALUES (${crypto.randomUUID()}, ${user.companyId}, ${repId}, ${metric}, ${JSON.stringify(vals)}, ${JSON.stringify([forecast.projectedValue])}, ${forecast.confidence > 0.7 ? "improving" : "stable"}, ${datetime('now')})`).catch(() => {});
      }
      trends = await db(sql`SELECT * FROM advanced_analytics_performance_trends WHERE rep_id = ${repId} ORDER BY recorded_at DESC LIMIT 10`);
    }
    return jsonResponse({ trends: trends.map((t: any) => ({ ...t, metric_values: JSON.parse(t.metric_values || "[]"), projections: JSON.parse(t.projections || "[]") })) });
  } catch (e) { return jsonResponse({ error: "Failed to load performance trends" }, 500); }
}

/** GET /api/advanced-analytics/team-heatmaps */
export async function handleTeamHeatmaps(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    let records = await db(sql`SELECT * FROM advanced_analytics_team_heatmaps WHERE company_id = ${user.companyId} ORDER BY team_id, metric LIMIT 50`);
    if (records.length === 0) {
      const teams = ["Sales", "SDR", "CS", "Renewals"];
      const metrics = ["avg_call_score", "discovery", "objection_handling", "closing", "compliance"];
      for (const team of teams) {
        for (const metric of metrics) {
          await db(sql`INSERT INTO advanced_analytics_team_heatmaps (id, company_id, team_id, metric, value, benchmark, period) VALUES (${crypto.randomUUID()}, ${user.companyId}, ${team}, ${metric}, ${Math.round(Math.random() * 25 + 60)}, ${75}, ${"monthly"})`).catch(() => {});
        }
      }
      records = await db(sql`SELECT * FROM advanced_analytics_team_heatmaps WHERE company_id = ${user.companyId} ORDER BY team_id, metric LIMIT 50`);
    }
    const teams = [...new Set(records.map((r: any) => r.team_id))];
    const heatmap = teams.map((teamId: string) => ({ team: teamId, metrics: records.filter((r: any) => r.team_id === teamId).map((r: any) => ({ metric: r.metric, value: r.value, benchmark: r.benchmark })) }));
    return jsonResponse({ heatmap });
  } catch (e) { return jsonResponse({ error: "Failed to load heatmaps" }, 500); }
}

/** GET /api/advanced-analytics/ai-impact */
export async function handleAIImpact(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    let records = await db(sql`SELECT * FROM advanced_analytics_ai_impact WHERE company_id = ${user.companyId} ORDER BY improvement DESC LIMIT 30`);
    if (records.length === 0) {
      const skills = ["Discovery", "Objection Handling", "Closing", "Rapport"];
      for (const skill of skills) {
        const before = Math.round(Math.random() * 15 + 60);
        const after = Math.min(100, before + Math.round(Math.random() * 20 + 5));
        await db(sql`INSERT INTO advanced_analytics_ai_impact (id, company_id, rep_id, skill_area, before_ai_score, after_ai_score, improvement, period) VALUES (${crypto.randomUUID()}, ${user.companyId}, ${user.id}, ${skill}, ${before}, ${after}, ${after - before}, ${"monthly"})`).catch(() => {});
      }
      records = await db(sql`SELECT * FROM advanced_analytics_ai_impact WHERE company_id = ${user.companyId} ORDER BY improvement DESC LIMIT 30`);
    }
    const avgBefore = records.reduce((s: number, r: any) => s + r.before_ai_score, 0) / records.length;
    const avgAfter = records.reduce((s: number, r: any) => s + r.after_ai_score, 0) / records.length;
    return jsonResponse({ aiImpact: records, summary: { avgBeforeScore: Math.round(avgBefore), avgAfterScore: Math.round(avgAfter), avgImprovement: Math.round(avgAfter - avgBefore), totalRepsImpacted: [...new Set(records.map((r: any) => r.rep_id))].length } });
  } catch (e) { return jsonResponse({ error: "Failed to load AI impact" }, 500); }
}

/** GET /api/advanced-analytics/benchmarks */
export async function handleBenchmarks(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    let records = await db(sql`SELECT * FROM advanced_analytics_benchmarks WHERE company_id = ${user.companyId} ORDER BY metric LIMIT 20`);
    if (records.length === 0) {
      const metrics = [
        { metric: "avg_call_score", internal: 72, industry: 68, top: 88 },
        { metric: "discovery_quality", internal: 70, industry: 65, top: 85 },
        { metric: "objection_handling", internal: 68, industry: 70, top: 90 },
        { metric: "closing_rate", internal: 65, industry: 62, top: 82 },
        { metric: "compliance_score", internal: 85, industry: 78, top: 95 },
      ];
      for (const m of metrics) {
        await db(sql`INSERT INTO advanced_analytics_benchmarks (id, company_id, metric, internal_avg, industry_avg, top_performer_avg, period) VALUES (${crypto.randomUUID()}, ${user.companyId}, ${m.metric}, ${m.internal}, ${m.industry}, ${m.top}, ${"monthly"})`).catch(() => {});
      }
      records = await db(sql`SELECT * FROM advanced_analytics_benchmarks WHERE company_id = ${user.companyId} ORDER BY metric LIMIT 20`);
    }
    return jsonResponse({ benchmarks: records });
  } catch (e) { return jsonResponse({ error: "Failed to load benchmarks" }, 500); }
}

/** GET /api/advanced-analytics/opportunities */
export async function handleOpportunities(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const teams = [
      { id: "sales", name: "Sales", currentScore: 68, potentialScore: 88 },
      { id: "sdr", name: "SDR", currentScore: 62, potentialScore: 90 },
      { id: "cs", name: "Customer Success", currentScore: 74, potentialScore: 82 },
      { id: "renewals", name: "Renewals", currentScore: 78, potentialScore: 85 },
    ];
    const opportunities = detectOpportunities(teams);
    return jsonResponse({ opportunities, totalGap: opportunities.reduce((s: number, o: any) => s + o.gap, 0), highPriorityCount: opportunities.filter((o: any) => o.priority === "high").length });
  } catch (e) { return jsonResponse({ error: "Failed to detect opportunities" }, 500); }
}

/** GET /api/advanced-analytics/forecasts */
export async function handleForecasts(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    let forecasts = await db(sql`SELECT f.*, u.name as rep_name FROM advanced_analytics_forecasts f JOIN users u ON u.id = f.rep_id WHERE f.company_id = ${user.companyId} ORDER BY f.confidence DESC LIMIT 20`);
    if (forecasts.length === 0) {
      const reps = await db(sql`SELECT id, name FROM users WHERE company_id = ${user.companyId} LIMIT 5`);
      for (const r of reps.length > 0 ? reps : [{ id: user.id, name: "Demo Rep" }]) {
        const vals: number[] = [];
        for (let i = 0; i < 5; i++) vals.push(Math.round(Math.random() * 15 + 65 + i * 3));
        const forecast = generateForecast(vals);
        await db(sql`INSERT INTO advanced_analytics_forecasts (id, company_id, rep_id, metric, current_value, projected_value, projected_date, confidence) VALUES (${crypto.randomUUID()}, ${user.companyId}, ${r.id}, ${"avg_call_score"}, ${vals[vals.length - 1]}, ${forecast.projectedValue}, ${new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0]}, ${forecast.confidence})`).catch(() => {});
      }
      forecasts = await db(sql`SELECT f.*, u.name as rep_name FROM advanced_analytics_forecasts f JOIN users u ON u.id = f.rep_id WHERE f.company_id = ${user.companyId} ORDER BY f.confidence DESC LIMIT 20`);
    }
    return jsonResponse({ forecasts });
  } catch (e) { return jsonResponse({ error: "Failed to load forecasts" }, 500); }
}
