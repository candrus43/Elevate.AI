/**
 * Executive Analytics API handlers.
 * Aggregates data from calls, scorecards, coaching plans, and user metrics.
 */

import { sql, esc } from "~/utils/sql";
import { db, jsonResponse, getAuthUser } from "./middleware";

// 30-second in-memory cache for executive dashboard
const execDashboardCache = new Map<string, { data: any; expiresAt: number }>();

// ─── GET /api/analytics/executive ──────────────────────────────────────────────
export async function handleExecutiveDashboard(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const url = new URL(req.url);
    const days = Math.min(parseInt(url.searchParams.get("days") || "30"), 365);
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const companyId = user.companyId;

    // Check 30-second cache
    const cacheKey = `exec_dash_${companyId}_${days}`;
    const cached = execDashboardCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return jsonResponse({ ...cached.data, cached: true });
    }

    // ── KPIs ───────────────────────────────────────────────────────────────
    const totalCalls = (await db(sql`SELECT COUNT(*) as c FROM calls WHERE company_id = ${companyId} AND created_at >= ${cutoff}`))[0]?.c || 0;
    const analyzedCalls = (await db(sql`SELECT COUNT(*) as c FROM call_analyses ca JOIN calls c ON c.id = ca.call_id WHERE c.company_id = ${companyId} AND ca.created_at >= ${cutoff}`))[0]?.c || 0;
    const totalUsers = (await db(sql`SELECT COUNT(*) as c FROM users WHERE company_id = ${companyId} AND is_active = 1`))[0]?.c || 0;

    // Average score
    const avgScoreRow = await db(sql`SELECT AVG(ca.overall_score) as avg_score FROM call_analyses ca JOIN calls c ON c.id = ca.call_id WHERE c.company_id = ${companyId} AND ca.created_at >= ${cutoff}`);
    const avgScore = avgScoreRow[0]?.avg_score ? Math.round(avgScoreRow[0].avg_score) : 0;

    // ── Team Health ─────────────────────────────────────────────────────────
    const teamMembers = await db(sql`
      SELECT u.id, u.name, u.role,
             (SELECT AVG(ca.overall_score) FROM call_analyses ca JOIN calls c ON c.id = ca.call_id WHERE c.user_id = u.id AND ca.created_at >= ${cutoff}) as avg_score,
             (SELECT COUNT(*) FROM calls WHERE user_id = u.id AND created_at >= ${cutoff}) as calls_count
      FROM users u
      WHERE u.company_id = ${companyId} AND u.is_active = 1
      ORDER BY avg_score DESC
    `);

    const teamHealth = {
      totalMembers: teamMembers.length,
      highPerformers: teamMembers.filter((m: any) => (m.avg_score || 0) >= 80).length,
      needsImprovement: teamMembers.filter((m: any) => (m.avg_score || 0) < 60 && (m.avg_score || 0) > 0).length,
      inactive: teamMembers.filter((m: any) => (m.calls_count || 0) === 0).length,
    };

    // ── Coaching Effectiveness ──────────────────────────────────────────────
    const coachingPlans = await db(sql`
      SELECT cp.id, cp.user_id, cp.status, cp.created_at,
             u.name as rep_name,
             (SELECT AVG(ca.overall_score) FROM call_analyses ca JOIN calls c ON c.id = ca.call_id WHERE c.user_id = cp.user_id AND ca.created_at > cp.created_at) as post_coaching_score,
             (SELECT AVG(ca.overall_score) FROM call_analyses ca JOIN calls c ON c.id = ca.call_id WHERE c.user_id = cp.user_id AND ca.created_at < cp.created_at AND ca.created_at >= ${cutoff}) as pre_coaching_score
      FROM coaching_plans cp
      JOIN users u ON u.id = cp.user_id
      WHERE cp.company_id = ${companyId} AND cp.created_at >= ${cutoff}
    `);

    const coachingEffectiveness = {
      totalPlans: coachingPlans.length,
      activePlans: coachingPlans.filter((p: any) => p.status === "active").length,
      completedPlans: coachingPlans.filter((p: any) => p.status === "completed").length,
      avgImprovement: 0,
    };

    let totalImprovement = 0;
    let improvementCount = 0;
    for (const p of coachingPlans) {
      if (p.pre_coaching_score && p.post_coaching_score) {
        totalImprovement += p.post_coaching_score - p.pre_coaching_score;
        improvementCount++;
      }
    }
    coachingEffectiveness.avgImprovement = improvementCount > 0 ? Math.round(totalImprovement / improvementCount) : 0;

    // ── Call Trends (daily) ─────────────────────────────────────────────────
    const dailyCallStats = await db(sql`
      SELECT DATE(c.created_at) as date,
             COUNT(*) as calls,
             AVG(ca.overall_score) as avg_score
      FROM calls c
      LEFT JOIN call_analyses ca ON ca.call_id = c.id
      WHERE c.company_id = ${companyId} AND c.created_at >= ${cutoff}
      GROUP BY DATE(c.created_at)
      ORDER BY date
    `);

    // ── Sentiment Distribution ──────────────────────────────────────────────
    const sentimentDist = await db(sql`
      SELECT ca.sentiment, COUNT(*) as count
      FROM call_analyses ca
      JOIN calls c ON c.id = ca.call_id
      WHERE c.company_id = ${companyId} AND ca.created_at >= ${cutoff}
      GROUP BY ca.sentiment
    `);

    // ── Top Objections ──────────────────────────────────────────────────────
    const objectionsData = await db(sql`
      SELECT ca.objections_detected
      FROM call_analyses ca
      JOIN calls c ON c.id = ca.call_id
      WHERE c.company_id = ${companyId} AND ca.created_at >= ${cutoff}
    `);
    const objectionCounts: Record<string, number> = {};
    for (const row of objectionsData) {
      const objections: string[] = (() => { try { return JSON.parse(row.objections_detected || "[]"); } catch { return []; } })();
      for (const obj of objections) {
        objectionCounts[obj] = (objectionCounts[obj] || 0) + 1;
      }
    }
    const topObjections = Object.entries(objectionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([objection, count]) => ({ objection, count }));

    // ── Compliance Stats ────────────────────────────────────────────────────
    const totalChecks = (await db(sql`SELECT COUNT(*) as c FROM compliance_checks cc JOIN calls c ON c.id = cc.call_id WHERE c.company_id = ${companyId} AND cc.created_at >= ${cutoff}`))[0]?.c || 0;
    const passedChecks = (await db(sql`SELECT COUNT(*) as c FROM compliance_checks cc JOIN calls c ON c.id = cc.call_id WHERE c.company_id = ${companyId} AND cc.passed = 1 AND cc.created_at >= ${cutoff}`))[0]?.c || 0;
    const complianceRate = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100;

    // ── Revenue impact (estimated from scores) ──────────────────────────────
    const revenueImpact = {
      estimatedConversionRate: avgScore > 70 ? Math.round(25 + (avgScore - 70) * 0.5) : Math.round(15 + avgScore * 0.15),
      estimatedDealsFromCoaching: Math.round(coachingEffectiveness.completedPlans * 2.5),
    };

    const responseData = {
      kpis: {
        totalCalls,
        analyzedCalls,
        activeUsers: totalUsers,
        avgScore,
        analysisRate: totalCalls > 0 ? Math.round((analyzedCalls / totalCalls) * 100) : 0,
      },
      teamHealth,
      coachingEffectiveness,
      callTrends: dailyCallStats,
      sentimentDistribution: sentimentDist,
      topObjections,
      compliance: { totalChecks, passedChecks, complianceRate },
      revenueImpact,
      period: { days, from: cutoff, to: new Date().toISOString() },
    };

    // Cache for 30 seconds so repeated loads don't re-run all queries
    execDashboardCache.set(cacheKey, { data: responseData, expiresAt: Date.now() + 30 * 1000 });

    return jsonResponse(responseData);
  } catch (e) {
    console.error("executive dashboard error:", e);
    return jsonResponse({ error: "Failed to load analytics" }, 500);
  }
}

// ─── GET /api/analytics/forecast ───────────────────────────────────────────────
export async function handleAnalyticsForecast(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const companyId = user.companyId;
    const url = new URL(req.url);
    const months = Math.min(parseInt(url.searchParams.get("months") || "3"), 12);

    // Get historical monthly data
    const monthlyData = await db(sql`
      SELECT strftime('%Y-%m', c.created_at) as month,
             COUNT(*) as calls,
             AVG(ca.overall_score) as avg_score
      FROM calls c
      LEFT JOIN call_analyses ca ON ca.call_id = c.id
      WHERE c.company_id = ${companyId}
      GROUP BY strftime('%Y-%m', c.created_at)
      ORDER BY month DESC
      LIMIT 6
    `);

    // Simple linear forecast based on recent trends
    const recentCalls = monthlyData.slice(0, 3).reduce((sum: number, m: any) => sum + (m.calls || 0), 0);
    const avgMonthlyCalls = monthlyData.length > 0 ? Math.round(recentCalls / Math.min(3, monthlyData.length)) : 0;
    const recentAvgScore = monthlyData.length > 0 ? Math.round(monthlyData.slice(0, 3).reduce((sum: number, m: any) => sum + (m.avg_score || 0), 0) / Math.min(3, monthlyData.length)) : 0;

    const forecast = [];
    const now = new Date();
    for (let i = 1; i <= months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      forecast.push({
        month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        projectedCalls: Math.round(avgMonthlyCalls * (1 + i * 0.05)), // 5% growth per month
        projectedAvgScore: Math.min(100, recentAvgScore + i * 2), // 2 point improvement per month
      });
    }

    return jsonResponse({
      historicalData: monthlyData,
      forecast,
      assumptions: {
        monthlyGrowthRate: "5%",
        scoreImprovementPerMonth: "2 points",
        basedOnMonths: months,
      },
    });
  } catch (e) {
    console.error("analytics forecast error:", e);
    return jsonResponse({ error: "Failed to generate forecast" }, 500);
  }
}

// ─── GET /api/analytics/export ─────────────────────────────────────────────────
export async function handleAnalyticsExport(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const url = new URL(req.url);
    const format = url.searchParams.get("format") || "json";
    const reportType = url.searchParams.get("type") || "calls";

    const companyId = user.companyId;
    const days = parseInt(url.searchParams.get("days") || "90");
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    let data: any;

    switch (reportType) {
      case "calls": {
        const calls = await db(sql`
          SELECT c.id, c.direction, c.duration_seconds, c.started_at, c.status,
                 u.name as rep_name, ca.overall_score, ca.sentiment, ca.key_topics
          FROM calls c
          LEFT JOIN users u ON u.id = c.user_id
          LEFT JOIN call_analyses ca ON ca.call_id = c.id
          WHERE c.company_id = ${companyId} AND c.created_at >= ${cutoff}
          ORDER BY c.created_at DESC
        `);
        data = calls;
        break;
      }
      case "users": {
        const users = await db(sql`
          SELECT u.id, u.email, u.name, u.role, u.is_active, u.created_at,
                 t.name as team_name,
                 (SELECT AVG(ca.overall_score) FROM call_analyses ca JOIN calls c ON c.id = ca.call_id WHERE c.user_id = u.id) as avg_score,
                 (SELECT COUNT(*) FROM calls WHERE user_id = u.id) as total_calls
          FROM users u
          LEFT JOIN teams t ON t.id = u.team_id
          WHERE u.company_id = ${companyId}
          ORDER BY u.name
        `);
        data = users;
        break;
      }
      case "scorecards": {
        const scorecards = await db(sql`
          SELECT sc.*, (SELECT COUNT(*) FROM scorecard_criteria WHERE scorecard_id = sc.id) as criteria_count
          FROM scorecards sc
          WHERE sc.company_id = ${companyId}
          ORDER BY sc.name
        `);
        data = scorecards;
        break;
      }
      case "coaching": {
        const plans = await db(sql`
          SELECT cp.id, cp.title, cp.status, cp.created_at,
                 u.name as rep_name, m.name as manager_name
          FROM coaching_plans cp
          JOIN users u ON u.id = cp.user_id
          LEFT JOIN users m ON m.id = cp.manager_id
          WHERE cp.company_id = ${companyId} AND cp.created_at >= ${cutoff}
          ORDER BY cp.created_at DESC
        `);
        data = plans;
        break;
      }
      default: {
        // Combined summary
        const callCount = (await db(sql`SELECT COUNT(*) as c FROM calls WHERE company_id = ${companyId} AND created_at >= ${cutoff}`))[0]?.c || 0;
        const avgScore = (await db(sql`SELECT AVG(overall_score) as avg_score FROM call_analyses ca JOIN calls c ON c.id = ca.call_id WHERE c.company_id = ${companyId} AND ca.created_at >= ${cutoff}`))[0]?.avg_score || 0;
        data = {
          reportType: "summary",
          period: { days },
          generatedAt: new Date().toISOString(),
          companyId,
          totalCalls: callCount,
          averageScore: Math.round(avgScore),
        };
      }
    }

    if (format === "csv") {
      // Simple CSV conversion
      const headers = data.length > 0 ? Object.keys(data[0]).join(",") : "";
      const rows = data.map((row: any) => Object.values(row).map((v: any) => `"${String(v || "").replace(/"/g, '""')}"`).join(",")).join("\n");
      const csv = `${headers}\n${rows}`;
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${reportType}-export-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    return jsonResponse({ data, reportType, generatedAt: new Date().toISOString(), period: { days } });
  } catch (e) {
    console.error("analytics export error:", e);
    return jsonResponse({ error: "Failed to export analytics" }, 500);
  }
}

// ─── GET /api/analytics/reports/scheduled ──────────────────────────────────────
export async function handleScheduledReports(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const reports = await db(sql`
      SELECT sr.*, u.name as created_by_name
      FROM scheduled_reports sr
      LEFT JOIN users u ON u.id = sr.user_id
      WHERE sr.company_id = ${user.companyId}
      ORDER BY sr.created_at DESC
    `);

    return jsonResponse({ reports: reports.map((r: any) => ({ ...r, recipients: JSON.parse(r.recipients || "[]"), config: JSON.parse(r.config || "{}") })) });
  } catch (e) {
    console.error("scheduled reports error:", e);
    return jsonResponse({ error: "Failed to list reports" }, 500);
  }
}

// ─── POST /api/analytics/reports/schedule ──────────────────────────────────────
export async function handleCreateScheduledReport(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const { name, report_type, schedule, recipients, config } = await req.json();
    if (!name || !report_type) return jsonResponse({ error: "Name and report_type required" }, 400);

    const id = crypto.randomUUID();
    await db(sql`
      INSERT INTO scheduled_reports (id, company_id, user_id, name, report_type, schedule, recipients, config)
      VALUES (${id}, ${user.companyId}, ${user.id}, ${name}, ${report_type}, ${schedule || "weekly"}, ${JSON.stringify(recipients || [])}, ${JSON.stringify(config || {})})
    `);

    return jsonResponse({ success: true, report: { id, name, report_type, schedule: schedule || "weekly", recipients: recipients || [], config: config || {} } });
  } catch (e) {
    console.error("create scheduled report error:", e);
    return jsonResponse({ error: "Failed to create report" }, 500);
  }
}

// ─── GET /api/analytics/executive/managers ──────────────────────────────────────
export async function handleExecutiveManagers(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const companyId = user.companyId;
    const url = new URL(req.url);
    const days = Math.min(parseInt(url.searchParams.get("days") || "30"), 365);
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Get all managers in the company
    const managers = await db(sql`
      SELECT u.id, u.name, u.email, u.team_id, t.name as team_name
      FROM users u
      LEFT JOIN teams t ON t.id = u.team_id
      WHERE u.company_id = ${companyId} AND u.role = 'manager' AND u.is_active = 1
      ORDER BY u.name
    `);

    // For each manager, aggregate their team's performance
    const managerPerformance = [];
    for (const mgr of managers) {
      // Find the team members for this manager
      const teamMembers = await db(sql`
        SELECT u.id, u.name, u.role
        FROM users u
        WHERE u.company_id = ${companyId} AND u.is_active = 1
        AND u.team_id = ${mgr.team_id}
        AND u.id != ${mgr.id}
        GROUP BY u.id
      `);

      const teamIds = teamMembers.map((m: any) => m.id);
      const teamSize = teamIds.length;

      // Aggregate team call metrics
      let teamScore = 0;
      let callsAnalyzed = 0;
      let totalCalls = 0;
      if (teamIds.length > 0) {
        const inClause = teamIds.map(id => esc(id)).join(",");
        const scoreResult = await db(`
          SELECT AVG(ca.overall_score) as avg_score, COUNT(*) as analyzed_count
          FROM call_analyses ca
          JOIN calls c ON c.id = ca.call_id
          WHERE c.user_id IN (${inClause}) AND ca.created_at >= ${esc(cutoff)}
        `);
        teamScore = scoreResult[0]?.avg_score ? Math.round(scoreResult[0].avg_score) : 0;
        callsAnalyzed = scoreResult[0]?.analyzed_count || 0;

        const callCountResult = await db(`
          SELECT COUNT(*) as c FROM calls WHERE user_id IN (${inClause}) AND created_at >= ${esc(cutoff)}
        `);
        totalCalls = callCountResult[0]?.c || 0;
      }

      // Count coaching plans
      const coachingPlansResult = await db(sql`
        SELECT COUNT(*) as c FROM coaching_plans
        WHERE company_id = ${companyId} AND manager_id = ${mgr.id} AND created_at >= ${cutoff}
      `);
      const coachingPlans = coachingPlansResult[0]?.c || 0;

      // Compliance rate
      let complianceRate = 100;
      if (teamIds.length > 0) {
        const inClause = teamIds.map(id => esc(id)).join(",");
        const compResult = await db(`
          SELECT
            COUNT(*) as total,
            SUM(CASE WHEN cc.passed = 1 THEN 1 ELSE 0 END) as passed
          FROM compliance_checks cc
          JOIN calls c ON c.id = cc.call_id
          WHERE c.user_id IN (${inClause}) AND cc.created_at >= ${esc(cutoff)}
        `);
        const total = compResult[0]?.total || 0;
        const passed = compResult[0]?.passed || 0;
        complianceRate = total > 0 ? Math.round((passed / total) * 100) : 100;
      }

      // Calculate average improvement
      let avgImprovement = 0;
      if (teamIds.length > 0) {
        const inClause = teamIds.map(id => esc(id)).join(",");
        const improvementResult = await db(`
          SELECT cp.user_id,
            (SELECT AVG(ca2.overall_score) FROM call_analyses ca2 JOIN calls c2 ON c2.id = ca2.call_id WHERE c2.user_id = cp.user_id AND ca2.created_at > cp.created_at) as post_score,
            (SELECT AVG(ca3.overall_score) FROM call_analyses ca3 JOIN calls c3 ON c3.id = ca3.call_id WHERE c3.user_id = cp.user_id AND ca3.created_at < cp.created_at AND ca3.created_at >= ${esc(cutoff)}) as pre_score
          FROM coaching_plans cp
          WHERE cp.manager_id = ${esc(mgr.id)} AND cp.created_at >= ${esc(cutoff)}
          HAVING post_score IS NOT NULL AND pre_score IS NOT NULL
        `);
        if (improvementResult.length > 0) {
          const totalImp = improvementResult.reduce((sum: number, r: any) => sum + (r.post_score - r.pre_score), 0);
          avgImprovement = Math.round(totalImp / improvementResult.length);
        }
      }

      managerPerformance.push({
        managerId: mgr.id,
        managerName: mgr.name,
        managerEmail: mgr.email,
        teamName: mgr.team_name || "Unassigned",
        teamSize,
        teamScore,
        callsAnalyzed: totalCalls,
        analyzedCalls: callsAnalyzed,
        coachingPlans,
        avgImprovement,
        complianceRate,
      });
    }

    return jsonResponse({ managers: managerPerformance, period: { days } });
  } catch (e) {
    console.error("executive managers error:", e);
    return jsonResponse({ error: "Failed to load manager data" }, 500);
  }
}

// ─── DELETE /api/analytics/reports/schedule/:id ────────────────────────────────
    export async function handleDeleteScheduledReport(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const reportId = new URL(req.url).pathname.split("/").pop();
    await db(sql`DELETE FROM scheduled_reports WHERE id = ${reportId} AND company_id = ${user.companyId}`);
    return jsonResponse({ success: true });
  } catch (e) {
    console.error("delete scheduled report error:", e);
    return jsonResponse({ error: "Failed to delete report" }, 500);
  }
}

// ─── GET /api/analytics/executive/ai-insights ──────────────────────────────────
// Cached AI-powered executive insights using OpenAI
const aiInsightsCache = new Map<string, { data: any; expiresAt: number }>();

export async function handleExecutiveAIInsights(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const url = new URL(req.url);
    const days = Math.min(parseInt(url.searchParams.get("days") || "7"), 365);
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const companyId = user.companyId;

    // Check cache (5 min TTL)
    const cacheKey = `${companyId}_${days}`;
    const cached = aiInsightsCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return jsonResponse({ ...cached.data, cached: true });
    }

    // Fetch aggregated data for AI analysis
    const totalCalls = (await db(sql`SELECT COUNT(*) as c FROM calls WHERE company_id = ${companyId} AND created_at >= ${cutoff}`))[0]?.c || 0;
    const analyzedCalls = (await db(sql`SELECT COUNT(*) as c FROM call_analyses ca JOIN calls c ON c.id = ca.call_id WHERE c.company_id = ${companyId} AND ca.created_at >= ${cutoff}`))[0]?.c || 0;
    const avgScoreRow = await db(sql`SELECT AVG(ca.overall_score) as avg_score FROM call_analyses ca JOIN calls c ON c.id = ca.call_id WHERE c.company_id = ${companyId} AND ca.created_at >= ${cutoff}`);
    const avgScore = avgScoreRow[0]?.avg_score ? Math.round(avgScoreRow[0].avg_score) : 0;
    const totalUsers = (await db(sql`SELECT COUNT(*) as c FROM users WHERE company_id = ${companyId} AND is_active = 1`))[0]?.c || 0;

    // Weekly trend
    const weeklyTrend = await db(sql`
      SELECT DATE(c.created_at) as date, COUNT(*) as calls, AVG(ca.overall_score) as avg_score
      FROM calls c LEFT JOIN call_analyses ca ON ca.call_id = c.id
      WHERE c.company_id = ${companyId} AND c.created_at >= ${cutoff}
      GROUP BY DATE(c.created_at) ORDER BY date
    `);

    // Top objections
    const objectionsData = await db(sql`
      SELECT ca.objections_detected FROM call_analyses ca
      JOIN calls c ON c.id = ca.call_id
      WHERE c.company_id = ${companyId} AND ca.created_at >= ${cutoff}
    `);
    const objectionCounts: Record<string, number> = {};
    for (const row of objectionsData) {
      const objections: string[] = (() => { try { return JSON.parse(row.objections_detected || "[]"); } catch { return []; } })();
      for (const obj of objections) objectionCounts[obj] = (objectionCounts[obj] || 0) + 1;
    }
    const topObjections = Object.entries(objectionCounts).sort(([, a], [, b]) => b - a).slice(0, 5).map(([o, c]) => ({ objection: o, count: c }));

    // Compliance stats
    const totalChecks = (await db(sql`SELECT COUNT(*) as c FROM compliance_checks cc JOIN calls c ON c.id = cc.call_id WHERE c.company_id = ${companyId} AND cc.created_at >= ${cutoff}`))[0]?.c || 0;
    const passedChecks = (await db(sql`SELECT COUNT(*) as c FROM compliance_checks cc JOIN calls c ON c.id = cc.call_id WHERE c.company_id = ${companyId} AND cc.passed = 1 AND cc.created_at >= ${cutoff}`))[0]?.c || 0;
    const complianceRate = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100;

    // Coaching stats
    const coachingPlans = await db(sql`
      SELECT COUNT(*) as total, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM coaching_plans WHERE company_id = ${companyId} AND created_at >= ${cutoff}
    `);
    const coachingTotal = coachingPlans[0]?.total || 0;
    const coachingCompleted = coachingPlans[0]?.completed || 0;

    // Sentiment distribution
    const sentimentDist = await db(sql`
      SELECT ca.sentiment, COUNT(*) as count FROM call_analyses ca
      JOIN calls c ON c.id = ca.call_id WHERE c.company_id = ${companyId} AND ca.created_at >= ${cutoff}
      GROUP BY ca.sentiment
    `);
    const sentimentMap: Record<string, number> = {};
    for (const s of sentimentDist) sentimentMap[s.sentiment || "neutral"] = s.count;

    // ── Try to generate AI insights ──
    try {
      const { getOpenAIConfig, callOpenAI } = await import("./openai");
      const config = await getOpenAIConfig(companyId);

      if (config && config.apiKey) {
        const prompt = `You are an executive analytics AI. Analyze this sales data and return a JSON object with:
- "summary": A 2-3 sentence executive summary of the week's key findings
- "topRisks": Array of 2-3 objects with { "risk": string, "severity": "high"|"medium"|"low", "detail": string }
- "recommendedActions": Array of 2-3 objects with { "action": string, "impact": string, "priority": "high"|"medium"|"low" }
- "trendAnalysis": A 2-3 sentence natural language analysis of the trends

Data for the last ${days} days:
- Total calls: ${totalCalls}
- Analyzed calls: ${analyzedCalls}
- Average score: ${avgScore}%
- Active users: ${totalUsers}
- Compliance rate: ${complianceRate}%
- Coaching plans created: ${coachingTotal}, completed: ${coachingCompleted}
- Top objections: ${JSON.stringify(topObjections)}
- Sentiment distribution: ${JSON.stringify(sentimentMap)}
- Weekly trend (last ${weeklyTrend.length} days): ${JSON.stringify(weeklyTrend.slice(-7))}`;

        // 5-second timeout to prevent hanging if OpenAI is slow
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), 5000);

        try {
          const result = await callOpenAI(config, {
            model: config.model,
            messages: [
              { role: "system", content: "You are an executive analytics AI. Return valid JSON only." },
              { role: "user", content: prompt },
            ],
            max_tokens: 2048,
            temperature: 0.3,
            response_format: { type: "json_object" },
            signal: abortController.signal,
          });

          if (result.success && result.content) {
            try {
              const insights = JSON.parse(result.content);
              const responseData = {
                insights,
                generatedAt: new Date().toISOString(),
                period: { days },
                cached: false,
              };
              // Cache for 5 minutes
              aiInsightsCache.set(cacheKey, { data: responseData, expiresAt: Date.now() + 5 * 60 * 1000 });
              return jsonResponse(responseData);
            } catch (parseError) {
              // Fallback if AI response is not valid JSON
            }
          }
        } finally {
          clearTimeout(timeoutId);
        }
      }
    } catch (aiError) {
      console.error("AI insights generation failed, using fallback:", aiError);
    }

    // ── Fallback: rule-based insights ──
    const fallbackInsights = {
      summary: `Over the last ${days} days, your team handled ${totalCalls} calls with an average score of ${avgScore}%. ${analyzedCalls > 0 ? `${Math.round((analyzedCalls / Math.max(totalCalls, 1)) * 100)}% of calls were analyzed.` : ""} ${complianceRate >= 90 ? "Compliance is strong at " + complianceRate + "%." : "Compliance at " + complianceRate + "% needs attention."}`,
      topRisks: [
        ...(complianceRate < 90 ? [{ risk: "Compliance Rate Below Target", severity: "high" as const, detail: `Current compliance rate is ${complianceRate}%, below the 90% target.` }] : []),
        ...(avgScore < 70 ? [{ risk: "Below Average Call Scores", severity: "medium" as const, detail: `Average call score is ${avgScore}%, indicating room for improvement in sales techniques.` }] : []),
        ...(topObjections.length > 0 ? [{ risk: `Top Objection: "${topObjections[0]?.objection}"`, severity: "medium" as const, detail: `This objection appeared ${topObjections[0]?.count} times in recent calls.` }] : []),
      ],
      recommendedActions: [
        ...(complianceRate < 90 ? [{ action: "Review Compliance Failures", impact: "Reduce legal risk and improve call quality", priority: "high" as const }] : []),
        ...(avgScore < 75 ? [{ action: "Focus on Call Quality Improvement", impact: "Increase average score by targeting bottom performers", priority: "medium" as const }] : []),
        ...(coachingTotal > 0 && coachingCompleted < coachingTotal ? [{ action: "Follow Up on Coaching Plans", impact: `${coachingTotal - coachingCompleted} plans still in progress`, priority: "medium" as const }] : []),
        { action: "Review Top Objection Handling", impact: `"${topObjections[0]?.objection || "Pricing"}" is the most common objection`, priority: "medium" as const },
      ],
      trendAnalysis: `Call volume is trending ${weeklyTrend.length >= 2 && weeklyTrend[weeklyTrend.length - 1]?.calls > weeklyTrend[0]?.calls ? "upward" : "stable"} with ${weeklyTrend.length} days of data. Average scores are ${avgScore >= 75 ? "healthy" : "below target"} at ${avgScore}%.`,
    };

    return jsonResponse({
      insights: fallbackInsights,
      generatedAt: new Date().toISOString(),
      period: { days },
      cached: false,
      aiUnavailable: true,
    });
  } catch (e) {
    console.error("executive AI insights error:", e);
    return jsonResponse({ error: "Failed to generate AI insights" }, 500);
  }
}