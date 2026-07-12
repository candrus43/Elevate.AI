/**
 * Executive Analytics API handlers.
 * Aggregates data from calls, scorecards, coaching plans, and user metrics.
 */

import { sql } from "~/utils/sql";
import { db, jsonResponse, getAuthUser } from "./middleware";

// ─── GET /api/analytics/executive ──────────────────────────────────────────────
export async function handleExecutiveDashboard(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const url = new URL(req.url);
    const days = Math.min(parseInt(url.searchParams.get("days") || "30"), 365);
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const companyId = user.companyId;

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

    return jsonResponse({
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
    });
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