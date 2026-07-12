/**
 * ThoughtSpot Integration — Backend API
 * Connect ElevateAI to ThoughtSpot's REST API for analytics data enrichment.
 * Simulated for demo — architected for real API integration.
 * Integrates with existing Integrations Hub architecture.
 */

import { sql } from "~/utils/sql";
import { db, jsonResponse, getAuthUser } from "./middleware";

// ─── SIMULATED THOUGHTSPOT API ───────────────────────────────────────────────

/** Simulated ThoughtSpot REST API call */
async function simulateThoughtSpotQuery(endpoint: string, token: string, queryType: string) {
  // In production: fetch(apiEndpoint, { headers: { Authorization: `Bearer ${token}` } })
  await new Promise((r) => setTimeout(r, 100)); // simulate network latency

  const mockData: Record<string, any> = {
    sales_performance: {
      query: "Rep sales performance by month",
      data: [
        { rep: "Alex Chen", deals_closed: 8, pipeline_value: 450000, win_rate: 0.62, avg_deal_size: 56250 },
        { rep: "Jordan Lee", deals_closed: 6, pipeline_value: 380000, win_rate: 0.55, avg_deal_size: 63333 },
        { rep: "Taylor Smith", deals_closed: 10, pipeline_value: 520000, win_rate: 0.71, avg_deal_size: 52000 },
        { rep: "Morgan Davis", deals_closed: 5, pipeline_value: 290000, win_rate: 0.48, avg_deal_size: 58000 },
        { rep: "Casey Brown", deals_closed: 7, pipeline_value: 410000, win_rate: 0.58, avg_deal_size: 58571 },
      ],
    },
    pipeline_metrics: {
      query: "Sales pipeline by stage",
      data: [
        { stage: "Prospecting", count: 45, value: 1800000 },
        { stage: "Qualification", count: 32, value: 2500000 },
        { stage: "Proposal", count: 18, value: 3200000 },
        { stage: "Negotiation", count: 12, value: 4100000 },
        { stage: "Closed Won", count: 8, value: 2100000 },
        { stage: "Closed Lost", count: 15, value: 1800000 },
      ],
    },
    team_metrics: {
      query: "Team performance KPIs",
      data: {
        total_reps: 12,
        avg_win_rate: 0.58,
        avg_deal_size: 57680,
        total_pipeline: 15500000,
        quota_attainment: 0.85,
        avg_call_volume: 42,
        coaching_hours: 18.5,
      },
    },
    skill_benchmarks: {
      query: "Skill benchmarks vs industry",
      data: [
        { skill: "Discovery", rep_avg: 72, team_avg: 75, industry_avg: 68, top_performer: 88 },
        { skill: "Objection Handling", rep_avg: 68, team_avg: 70, industry_avg: 65, top_performer: 85 },
        { skill: "Closing", rep_avg: 65, team_avg: 68, industry_avg: 62, top_performer: 82 },
        { skill: "Product Knowledge", rep_avg: 78, team_avg: 80, industry_avg: 72, top_performer: 92 },
        { skill: "Compliance", rep_avg: 85, team_avg: 82, industry_avg: 78, top_performer: 95 },
      ],
    },
  };

  return { success: true, data: mockData[queryType] || { query: queryType, data: [] }, queryType };
}

/** Map ThoughtSpot data to ElevateAI coaching context */
function mapThoughtSpotDataToCoaching(rawData: any, dataType: string): any {
  switch (dataType) {
    case "sales_performance":
      return {
        enriched: rawData.data.map((r: any) => ({
          repName: r.rep,
          fieldMetrics: { dealsClosed: r.deals_closed, pipelineValue: r.pipeline_value, winRate: r.win_rate, avgDealSize: r.avg_deal_size },
          coachingInsight: `Win rate: ${(r.win_rate * 100).toFixed(0)}% — ${r.win_rate > 0.6 ? "Strong performer" : r.win_rate > 0.5 ? "Room for improvement" : "Needs coaching focus"}`,
        })),
        summary: { totalDeals: rawData.data.reduce((s: number, r: any) => s + r.deals_closed, 0), totalPipeline: rawData.data.reduce((s: number, r: any) => s + r.pipeline_value, 0), avgWinRate: (rawData.data.reduce((s: number, r: any) => s + r.win_rate, 0) / rawData.data.length).toFixed(2) },
      };
    case "team_metrics":
      return {
        enriched: { ...rawData.data, coachingHours: rawData.data.coaching_hours, quotaAttainment: rawData.data.quota_attainment },
        coachingInsight: `Quota attainment: ${(rawData.data.quota_attainment * 100).toFixed(0)}% — ${rawData.data.quota_attainment < 0.8 ? "Below target, increase coaching hours" : "On track"}`,
      };
    case "skill_benchmarks":
      return {
        enriched: rawData.data.map((s: any) => ({
          skill: s.skill, repAvg: s.rep_avg, teamAvg: s.team_avg, industryAvg: s.industry_avg, topPerformer: s.top_performer,
          gapToIndustry: (s.industry_avg - s.rep_avg).toFixed(1), gapToTop: (s.top_performer - s.rep_avg).toFixed(1),
        })),
        summary: { biggestGap: rawData.data.sort((a: any, b: any) => (b.industry_avg - b.rep_avg) - (a.industry_avg - a.rep_avg))[0]?.skill, biggestGapValue: Math.max(...rawData.data.map((s: any) => s.industry_avg - s.rep_avg).filter((v: number) => v > 0)) },
      };
    default:
      return { enriched: rawData.data, insight: "Data mapped to coaching context" };
  }
}

// ─── ENDPOINTS ────────────────────────────────────────────────────────────────

/** POST /api/integrations/thoughtspot/connect */
export async function handleThoughtSpotConnect(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const { api_endpoint, api_token, config } = await req.json();
    if (!api_endpoint || !api_token) return jsonResponse({ error: "api_endpoint and api_token required" }, 400);

    const existing = await db(sql`SELECT id FROM thoughtspot_connections WHERE company_id = ${user.companyId} LIMIT 1`);
    const id = existing.length > 0 ? existing[0].id : crypto.randomUUID();

    if (existing.length > 0) {
      await db(sql`UPDATE thoughtspot_connections SET api_endpoint = ${api_endpoint}, api_token = ${api_token}, connected = 1, config = ${JSON.stringify(config || {})}, updated_at = datetime('now') WHERE id = ${id}`);
    } else {
      await db(sql`INSERT INTO thoughtspot_connections (id, company_id, api_endpoint, api_token, connected, config) VALUES (${id}, ${user.companyId}, ${api_endpoint}, ${api_token}, 1, ${JSON.stringify(config || {})})`);
    }

    return jsonResponse({ success: true, connection: { id, api_endpoint, connected: true } });
  } catch (e) { return jsonResponse({ error: "Failed to connect" }, 500); }
}

/** POST /api/integrations/thoughtspot/disconnect */
export async function handleThoughtSpotDisconnect(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    await db(sql`UPDATE thoughtspot_connections SET connected = 0, api_token = '', updated_at = datetime('now') WHERE company_id = ${user.companyId}`);
    return jsonResponse({ success: true });
  } catch (e) { return jsonResponse({ error: "Failed to disconnect" }, 500); }
}

/** POST /api/integrations/thoughtspot/sync */
export async function handleThoughtSpotSync(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const connections = await db(sql`SELECT * FROM thoughtspot_connections WHERE company_id = ${user.companyId} AND connected = 1 LIMIT 1`);
    if (connections.length === 0) return jsonResponse({ error: "No active ThoughtSpot connection" }, 400);

    const conn = connections[0];
    const syncId = crypto.randomUUID();
    await db(sql`INSERT INTO thoughtspot_sync_logs (id, company_id, status, started_at) VALUES (${syncId}, ${user.companyId}, ${"running"}, ${datetime('now')})`);

    const queryTypes = ["sales_performance", "pipeline_metrics", "team_metrics", "skill_benchmarks"];
    let totalRecords = 0;

    for (const queryType of queryTypes) {
      const result = await simulateThoughtSpotQuery(conn.api_endpoint, conn.api_token, queryType);
      if (result.success) {
        const mapped = mapThoughtSpotDataToCoaching(result.data, queryType);
        const dataId = crypto.randomUUID();
        await db(sql`INSERT INTO thoughtspot_data (id, company_id, data_type, raw_data, mapped_data, sync_id) VALUES (${dataId}, ${user.companyId}, ${queryType}, ${JSON.stringify(result.data)}, ${JSON.stringify(mapped)}, ${syncId})`).catch(() => {});
        totalRecords++;
      }
    }

    await db(sql`UPDATE thoughtspot_sync_logs SET status = 'completed', records_pulled = ${totalRecords}, completed_at = datetime('now') WHERE id = ${syncId}`);
    await db(sql`UPDATE thoughtspot_connections SET last_sync_at = datetime('now') WHERE id = ${conn.id}`);

    return jsonResponse({ success: true, sync: { id: syncId, recordsPulled: totalRecords, status: "completed" } });
  } catch (e) { return jsonResponse({ error: "Failed to sync" }, 500); }
}

/** GET /api/integrations/thoughtspot/data */
export async function handleThoughtSpotData(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const url = new URL(req.url);
    const type = url.searchParams.get("type");

    let data = await db(sql`SELECT * FROM thoughtspot_data WHERE company_id = ${user.companyId} ORDER BY pulled_at DESC LIMIT 20`);
    if (type) data = data.filter((d: any) => d.data_type === type);

    return jsonResponse({
      data: data.map((d: any) => ({ ...d, raw_data: JSON.parse(d.raw_data || "{}"), mapped_data: JSON.parse(d.mapped_data || "{}") })),
      connection: (await db(sql`SELECT id, api_endpoint, connected, last_sync_at FROM thoughtspot_connections WHERE company_id = ${user.companyId} LIMIT 1`))[0] || null,
    });
  } catch (e) { return jsonResponse({ error: "Failed to load data" }, 500); }
}

/** GET /api/integrations/thoughtspot/logs */
export async function handleThoughtSpotLogs(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const logs = await db(sql`SELECT * FROM thoughtspot_sync_logs WHERE company_id = ${user.companyId} ORDER BY started_at DESC LIMIT 20`);
    return jsonResponse({ logs });
  } catch (e) { return jsonResponse({ error: "Failed to load logs" }, 500); }
}
