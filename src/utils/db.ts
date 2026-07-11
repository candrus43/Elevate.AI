import { createServerFn } from "@tanstack/react-start";
import type { UserSession } from "~/utils/auth";

// ─── Database helper ────────────────────────────────────

export async function db(query: string): Promise<any[]> {
  const result = await Bun.$`team-db ${query}`.text();
  return JSON.parse(result);
}

// ─── Query helpers ──────────────────────────────────────

export async function getCompanyUsers(companyId: string) {
  return db(
    `SELECT u.id, u.email, u.name, u.role, u.avatar_url, u.team_id, u.is_active,
            t.name as team_name
     FROM users u
     LEFT JOIN teams t ON t.id = u.team_id
     WHERE u.company_id = '${companyId.replace(/'/g, "''")}'
     ORDER BY u.name`
  );
}

export async function getCompanyCalls(companyId: string, limit = 50, offset = 0) {
  return db(
    `SELECT c.id, c.user_id, c.direction, c.duration_seconds, c.started_at, c.status,
            ca.overall_score, ca.sentiment, ca.key_topics,
            u.name as rep_name
     FROM calls c
     LEFT JOIN call_analyses ca ON ca.call_id = c.id
     LEFT JOIN users u ON u.id = c.user_id
     WHERE c.company_id = '${companyId.replace(/'/g, "''")}'
     ORDER BY c.created_at DESC
     LIMIT ${limit} OFFSET ${offset}`
  );
}

export async function getCallDetails(callId: string) {
  const calls = await db(
    `SELECT c.*, ca.*, u.name as rep_name, u.email as rep_email
     FROM calls c
     LEFT JOIN call_analyses ca ON ca.call_id = c.id
     LEFT JOIN users u ON u.id = c.user_id
     WHERE c.id = '${callId.replace(/'/g, "''")}'`
  );
  if (calls.length === 0) return null;

  const scores = await db(
    `SELECT cs.total_score, cs.criteria_scores, cs.notes, cs.created_at,
            sc.name as scorecard_name
     FROM call_scores cs
     LEFT JOIN scorecards sc ON sc.id = cs.scorecard_id
     WHERE cs.call_id = '${callId.replace(/'/g, "''")}'`
  );

  const compliance = await db(
    `SELECT cc.passed, cc.details, cc.created_at,
            cr.name as rule_name, cr.description as rule_description
     FROM compliance_checks cc
     LEFT JOIN compliance_rules cr ON cr.id = cc.rule_id
     WHERE cc.call_id = '${callId.replace(/'/g, "''")}'`
  );

  return { ...calls[0], scores, compliance };
}

export async function getUserCalls(userId: string, limit = 10) {
  return db(
    `SELECT c.id, c.direction, c.duration_seconds, c.started_at, c.status,
            ca.overall_score, ca.sentiment
     FROM calls c
     LEFT JOIN call_analyses ca ON ca.call_id = c.id
     WHERE c.user_id = '${userId.replace(/'/g, "''")}'
     ORDER BY c.created_at DESC
     LIMIT ${limit}`
  );
}

export async function getUserCoachingPlan(userId: string) {
  const plans = await db(
    `SELECT cp.id, cp.title, cp.description, cp.status, cp.due_date, cp.created_at
     FROM coaching_plans cp
     WHERE cp.user_id = '${userId.replace(/'/g, "''")}' AND cp.status = 'active'
     ORDER BY cp.created_at DESC
     LIMIT 1`
  );
  if (plans.length === 0) return null;

  const items = await db(
    `SELECT cpi.id, cpi.title, cpi.status, cpi.sort_order, cpi.completed_at
     FROM coaching_plan_items cpi
     WHERE cpi.coaching_plan_id = '${plans[0].id.replace(/'/g, "''")}'
     ORDER BY cpi.sort_order`
  );

  return { ...plans[0], items };
}

export async function getUserMetrics(userId: string) {
  const metrics = await db(
    `SELECT * FROM user_metrics
     WHERE user_id = '${userId.replace(/'/g, "''")}'
     ORDER BY period_start DESC
     LIMIT 1`
  );
  return metrics.length > 0 ? metrics[0] : null;
}

export async function getCompanyMetrics(companyId: string) {
  const metrics = await db(
    `SELECT * FROM company_metrics
     WHERE company_id = '${companyId.replace(/'/g, "''")}'
     ORDER BY period_start DESC
     LIMIT 1`
  );
  return metrics.length > 0 ? metrics[0] : null;
}

export async function getLeaderboardRank(userId: string, companyId: string) {
  const entries = await db(
    `SELECT le.rank, le.score, lb.name as leaderboard_name, lb.period
     FROM leaderboard_entries le
     JOIN leaderboards lb ON lb.id = le.leaderboard_id
     WHERE le.user_id = '${userId.replace(/'/g, "''")}'
       AND lb.company_id = '${companyId.replace(/'/g, "''")}'
       AND lb.is_active = 1
     ORDER BY le.created_at DESC
     LIMIT 1`
  );
  return entries.length > 0 ? entries[0] : null;
}

export async function getUserPoints(userId: string) {
  const result = await db(
    `SELECT COALESCE(SUM(points), 0) as total_points
     FROM points_events
     WHERE user_id = '${userId.replace(/'/g, "''")}'`
  );
  return result[0]?.total_points || 0;
}

export async function getRecentActivity(companyId: string, limit = 10) {
  return db(
    `SELECT ae.event_type, ae.properties, ae.created_at,
            u.name as user_name
     FROM analytics_events ae
     LEFT JOIN users u ON u.id = ae.user_id
     WHERE ae.company_id = '${companyId.replace(/'/g, "''")}'
     ORDER BY ae.created_at DESC
     LIMIT ${limit}`
  );
}

// ─── Server-side data fetchers ──────────────────────────

export const getDashboardData = createServerFn({ method: "GET" })
  .handler(async ({ request }) => {
    const cookieHeader = request.headers.get("cookie");
    if (!cookieHeader) return { error: "Not authenticated" };

    const cookies = parseCookies(cookieHeader);
    const token = cookies["elevateai_session"];
    if (!token) return { error: "Not authenticated" };

    const rows = await db(
      `SELECT u.id, u.email, u.name, u.role, u.company_id,
              c.name as company_name, c.slug as company_slug, c.tier as company_tier
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       JOIN companies c ON c.id = u.company_id
       WHERE s.token = '${token.replace(/'/g, "''")}' AND s.expires_at > datetime('now')`
    );
    if (rows.length === 0) return { error: "Session expired" };

    const user = rows[0];
    const companyId = user.company_id;

    const [calls, metrics, companyMetrics, activity] = await Promise.all([
      getCompanyCalls(companyId),
      getUserMetrics(user.id),
      getCompanyMetrics(companyId),
      getRecentActivity(companyId),
    ]);

    return { calls, metrics, companyMetrics, activity, user };
  });

function parseCookies(header: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  header.split(";").forEach((pair) => {
    const idx = pair.indexOf("=");
    if (idx > 0) {
      const key = pair.substring(0, idx).trim();
      const val = pair.substring(idx + 1).trim();
      cookies[key] = decodeURIComponent(val);
    }
  });
  return cookies;
}