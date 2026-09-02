/**
 * Dashboard data handlers — server-side data loading for dashboard + rep routes.
 *
 * These replace the former client-side imports of `~/utils/db.ts`, which ran
 * `Bun.$`team-db`` in the browser and threw `ReferenceError: Bun is not defined`,
 * causing every dashboard/analytics page to silently render empty states.
 *
 * All handlers authenticate via getAuthUser() and scope queries to the caller's
 * company (or the caller themselves for rep-scoped endpoints).
 */
import { sql } from "~/utils/sql";
import { db, jsonResponse, getAuthUser, type AuthUser } from "./middleware";

/** The single demo company slug — used to label data as "Sample data". */
const DEMO_SLUG = "elevateai-demo";

function isDemoCompany(user: AuthUser): boolean {
  return (
    user.demoMode === 1 ||
    user.companySlug === DEMO_SLUG ||
    /demo/i.test(user.companyName || "")
  );
}

async function fetchCompanyUsers(companyId: string) {
  return db(sql`
    SELECT u.id, u.email, u.name, u.role, u.avatar_url, u.team_id, u.is_active,
           t.name as team_name
    FROM users u
    LEFT JOIN teams t ON t.id = u.team_id
    WHERE u.company_id = ${companyId}
    ORDER BY u.name
  `);
}

async function fetchCompanyCalls(companyId: string, limit = 200) {
  return db(sql`
    SELECT c.id, c.user_id, c.direction, c.duration_seconds, c.started_at, c.status,
           ca.overall_score, ca.sentiment, ca.key_topics,
           u.name as rep_name
    FROM calls c
    LEFT JOIN call_analyses ca ON ca.call_id = c.id
    LEFT JOIN users u ON u.id = c.user_id
    WHERE c.company_id = ${companyId}
    ORDER BY c.created_at DESC
    LIMIT ${limit}
  `);
}

async function fetchCompanyMetrics(companyId: string) {
  const rows = await db(sql`
    SELECT * FROM company_metrics
    WHERE company_id = ${companyId}
    ORDER BY period_start DESC
    LIMIT 1
  `);
  return rows.length > 0 ? rows[0] : null;
}

async function fetchRecentActivity(companyId: string, limit = 10) {
  return db(sql`
    SELECT ae.event_type, ae.properties, ae.created_at,
           u.name as user_name
    FROM analytics_events ae
    LEFT JOIN users u ON u.id = ae.user_id
    WHERE ae.company_id = ${companyId}
    ORDER BY ae.created_at DESC
    LIMIT ${limit}
  `);
}

async function fetchUserCalls(userId: string, limit = 10) {
  return db(sql`
    SELECT c.id, c.direction, c.duration_seconds, c.started_at, c.status,
           ca.overall_score, ca.sentiment
    FROM calls c
    LEFT JOIN call_analyses ca ON ca.call_id = c.id
    WHERE c.user_id = ${userId}
    ORDER BY c.created_at DESC
    LIMIT ${limit}
  `);
}

async function fetchUserCoachingPlan(userId: string) {
  const plans = await db(sql`
    SELECT cp.id, cp.title, cp.description, cp.status, cp.due_date, cp.created_at
    FROM coaching_plans cp
    WHERE cp.user_id = ${userId} AND cp.status = 'active'
    ORDER BY cp.created_at DESC
    LIMIT 1
  `);
  if (plans.length === 0) return null;
  const items = await db(sql`
    SELECT cpi.id, cpi.title, cpi.status, cpi.sort_order, cpi.completed_at
    FROM coaching_plan_items cpi
    WHERE cpi.coaching_plan_id = ${plans[0].id}
    ORDER BY cpi.sort_order
  `);
  return { ...plans[0], items };
}

async function fetchUserMetrics(userId: string) {
  const rows = await db(sql`
    SELECT * FROM user_metrics
    WHERE user_id = ${userId}
    ORDER BY period_start DESC
    LIMIT 1
  `);
  return rows.length > 0 ? rows[0] : null;
}

async function fetchLeaderboardRank(userId: string, companyId: string) {
  const rows = await db(sql`
    SELECT le.rank, le.score, lb.name as leaderboard_name, lb.period
    FROM leaderboard_entries le
    JOIN leaderboards lb ON lb.id = le.leaderboard_id
    WHERE le.user_id = ${userId}
      AND lb.company_id = ${companyId}
      AND lb.is_active = 1
    ORDER BY le.created_at DESC
    LIMIT 1
  `);
  return rows.length > 0 ? rows[0] : null;
}

async function fetchUserPoints(userId: string) {
  const rows = await db(sql`
    SELECT COALESCE(SUM(points), 0) as total_points
    FROM points_events
    WHERE user_id = ${userId}
  `);
  return rows[0]?.total_points || 0;
}

// ─── GET /api/dashboard/overview ────────────────────────────────────────────────
export async function handleDashboardOverview(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const [calls, companyMetrics, activity, members] = await Promise.all([
      fetchCompanyCalls(user.companyId, 200),
      fetchCompanyMetrics(user.companyId),
      fetchRecentActivity(user.companyId, 8),
      fetchCompanyUsers(user.companyId),
    ]);
    return jsonResponse({ calls, companyMetrics, activity, members, isDemo: isDemoCompany(user) });
  } catch (e) {
    console.error("dashboard overview error:", e);
    return jsonResponse({ error: "Failed to load dashboard" }, 500);
  }
}

// ─── GET /api/dashboard/team ────────────────────────────────────────────────────
export async function handleDashboardTeam(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const members = await fetchCompanyUsers(user.companyId);
    return jsonResponse({ members, isDemo: isDemoCompany(user) });
  } catch (e) {
    console.error("dashboard team error:", e);
    return jsonResponse({ error: "Failed to load team" }, 500);
  }
}

// ─── GET /api/dashboard/leaderboard?period=weekly|monthly ───────────────────────
export async function handleDashboardLeaderboard(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const period = new URL(req.url).searchParams.get("period") || "weekly";
    const entries = await db(sql`
      SELECT le.rank, u.name as user_name, u.id as user_id, u.avatar_url, le.score,
             (SELECT COUNT(*) FROM calls c WHERE c.user_id = u.id) as calls_count,
             CASE WHEN u.id = ${user.id} THEN 1 ELSE 0 END as is_current_user
      FROM leaderboard_entries le
      JOIN users u ON u.id = le.user_id
      JOIN leaderboards lb ON lb.id = le.leaderboard_id
      WHERE lb.company_id = ${user.companyId}
        AND lb.period = ${period}
        AND lb.is_active = 1
      ORDER BY le.rank ASC
      LIMIT 20
    `);
    return jsonResponse({ entries, isDemo: isDemoCompany(user) });
  } catch (e) {
    console.error("dashboard leaderboard error:", e);
    return jsonResponse({ error: "Failed to load leaderboard" }, 500);
  }
}

// ─── GET /api/dashboard/coaching ────────────────────────────────────────────────
export async function handleDashboardCoaching(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const plans = await db(sql`
      SELECT cp.id, cp.user_id, cp.title, cp.description, cp.status, cp.due_date, cp.created_at,
             u.name as user_name,
             (SELECT COUNT(*) FROM coaching_plan_items cpi WHERE cpi.coaching_plan_id = cp.id) as total_items,
             (SELECT COUNT(*) FROM coaching_plan_items cpi WHERE cpi.coaching_plan_id = cp.id AND cpi.status = 'completed') as completed_items
      FROM coaching_plans cp
      JOIN users u ON u.id = cp.user_id
      WHERE cp.company_id = ${user.companyId}
      ORDER BY cp.created_at DESC
    `);
    return jsonResponse({ plans, isDemo: isDemoCompany(user) });
  } catch (e) {
    console.error("dashboard coaching error:", e);
    return jsonResponse({ error: "Failed to load coaching plans" }, 500);
  }
}

// ─── GET /api/dashboard/rep (rep overview) ──────────────────────────────────────
export async function handleRepDashboard(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const [calls, plan, metrics, rank, points] = await Promise.all([
      fetchUserCalls(user.id, 5),
      fetchUserCoachingPlan(user.id),
      fetchUserMetrics(user.id),
      fetchLeaderboardRank(user.id, user.companyId),
      fetchUserPoints(user.id),
    ]);
    return jsonResponse({ calls, plan, metrics, rank, points, isDemo: isDemoCompany(user) });
  } catch (e) {
    console.error("rep dashboard error:", e);
    return jsonResponse({ error: "Failed to load rep dashboard" }, 500);
  }
}

// ─── GET /api/dashboard/rep/calls ───────────────────────────────────────────────
export async function handleRepCalls(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const calls = await fetchUserCalls(user.id, 50);
    return jsonResponse({ calls, isDemo: isDemoCompany(user) });
  } catch (e) {
    console.error("rep calls error:", e);
    return jsonResponse({ error: "Failed to load calls" }, 500);
  }
}

// ─── GET /api/dashboard/rep/coaching ────────────────────────────────────────────
export async function handleRepCoaching(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const plan = await fetchUserCoachingPlan(user.id);
    return jsonResponse({ plan, isDemo: isDemoCompany(user) });
  } catch (e) {
    console.error("rep coaching error:", e);
    return jsonResponse({ error: "Failed to load coaching plan" }, 500);
  }
}

// ─── GET /api/dashboard/rep/leaderboard ─────────────────────────────────────────
export async function handleRepLeaderboard(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const [rank, points] = await Promise.all([
      fetchLeaderboardRank(user.id, user.companyId),
      fetchUserPoints(user.id),
    ]);
    return jsonResponse({ rank, points, isDemo: isDemoCompany(user) });
  } catch (e) {
    console.error("rep leaderboard error:", e);
    return jsonResponse({ error: "Failed to load leaderboard" }, 500);
  }
}

// ─── GET /api/calls/:id (call detail) ───────────────────────────────────────────
export async function handleCallDetail(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const callId = new URL(req.url).pathname.split("/").pop();
    if (!callId) return jsonResponse({ error: "Call ID required" }, 400);
    const calls = await db(sql`
      SELECT c.*, ca.*, u.name as rep_name, u.email as rep_email
      FROM calls c
      LEFT JOIN call_analyses ca ON ca.call_id = c.id
      LEFT JOIN users u ON u.id = c.user_id
      WHERE c.id = ${callId} AND c.company_id = ${user.companyId}
    `);
    if (calls.length === 0) return jsonResponse({ call: null });
    const scores = await db(sql`
      SELECT cs.total_score, cs.criteria_scores, cs.notes, cs.created_at,
             sc.name as scorecard_name
      FROM call_scores cs
      LEFT JOIN scorecards sc ON sc.id = cs.scorecard_id
      WHERE cs.call_id = ${callId}
    `);
    const compliance = await db(sql`
      SELECT cc.passed, cc.details, cc.created_at,
             cr.name as rule_name, cr.description as rule_description
      FROM compliance_checks cc
      LEFT JOIN compliance_rules cr ON cr.id = cc.rule_id
      WHERE cc.call_id = ${callId}
    `);
    return jsonResponse({ call: { ...calls[0], scores, compliance }, isDemo: isDemoCompany(user) });
  } catch (e) {
    console.error("call detail error:", e);
    return jsonResponse({ error: "Failed to load call" }, 500);
  }
}

// ─── GET /api/dashboard/learning ────────────────────────────────────────────────
export async function handleLearningCourses(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const courses = await db(sql`
      SELECT c.id, c.title, c.description, c.category, c.difficulty,
             c.duration_minutes, NULL as image_url,
             0 as is_enrolled, 0 as enrolled_progress
      FROM courses c
      WHERE c.company_id = ${user.companyId}
      ORDER BY c.created_at DESC
      LIMIT 20
    `);
    return jsonResponse({ courses, isDemo: isDemoCompany(user) });
  } catch (e) {
    console.error("learning courses error:", e);
    return jsonResponse({ error: "Failed to load courses" }, 500);
  }
}
