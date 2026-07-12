/**
 * Multi-Tenant Admin API handlers.
 * Organizations management, departments, sub-teams, feature flags, audit logs.
 */

import { sql } from "~/utils/sql";
import { db, jsonResponse, getAuthUser } from "./middleware";

// ─── Auth check helpers ────────────────────────────────────────────────────────
function requireEnterprise(user: { role: string; companyTier?: string }): string | null {
  if (user.role !== "admin") return "Only admins can access this";
  return null;
}

function getAuthUserOrError(req: Request): Promise<Response | { user: any }> {
  return (async () => {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    return { user };
  })();
}

// ─── GET /api/admin/company ──────────────────────────────────────────────────
export async function handleAdminGetCompany(req: Request): Promise<Response> {
  try {
    const authResult = await getAuthUserOrError(req);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult as any;
    const err = requireEnterprise(user);
    if (err) return jsonResponse({ error: err }, 403);

    const rows = await db(sql`SELECT * FROM companies WHERE id = ${user.companyId}`);
    if (rows.length === 0) return jsonResponse({ error: "Company not found" }, 404);
    const company = rows[0];

    // Count users, teams, departments
    const userCount = (await db(sql`SELECT COUNT(*) as c FROM users WHERE company_id = ${user.companyId}`))[0]?.c || 0;
    const teamCount = (await db(sql`SELECT COUNT(*) as c FROM teams WHERE company_id = ${user.companyId}`))[0]?.c || 0;
    const deptCount = (await db(sql`SELECT COUNT(*) as c FROM departments WHERE company_id = ${user.companyId}`))[0]?.c || 0;

    // Feature flags
    const flags = await db(sql`SELECT * FROM feature_flags WHERE company_id = ${user.companyId}`);

    return jsonResponse({
      company: { ...company, settings: JSON.parse(company.settings || "{}"), white_label: JSON.parse(company.white_label || "{}"), features: JSON.parse(company.features || "{}") },
      stats: { users: userCount, teams: teamCount, departments: deptCount },
      featureFlags: flags,
    });
  } catch (e) {
    console.error("admin get company error:", e);
    return jsonResponse({ error: "Failed to load company data" }, 500);
  }
}

// ─── PUT /api/admin/company ──────────────────────────────────────────────────
export async function handleAdminUpdateCompany(req: Request): Promise<Response> {
  try {
    const authResult = await getAuthUserOrError(req);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult as any;
    const err = requireEnterprise(user);
    if (err) return jsonResponse({ error: err }, 403);

    const { name, tier, max_users, white_label, features, settings } = await req.json();
    if (name) await db(sql`UPDATE companies SET name = ${name}, updated_at = datetime('now') WHERE id = ${user.companyId}`);
    if (tier) await db(sql`UPDATE companies SET tier = ${tier}, updated_at = datetime('now') WHERE id = ${user.companyId}`);
    if (max_users != null) await db(sql`UPDATE companies SET max_users = ${max_users}, updated_at = datetime('now') WHERE id = ${user.companyId}`);
    if (white_label) await db(sql`UPDATE companies SET white_label = ${JSON.stringify(white_label)}, updated_at = datetime('now') WHERE id = ${user.companyId}`);
    if (features) await db(sql`UPDATE companies SET features = ${JSON.stringify(features)}, updated_at = datetime('now') WHERE id = ${user.companyId}`);
    if (settings) await db(sql`UPDATE companies SET settings = ${JSON.stringify(settings)}, updated_at = datetime('now') WHERE id = ${user.companyId}`);

    // Audit log
    await logAuditEvent(user.companyId, user.id, "update_company", "company", user.companyId, "Updated company settings");

    return jsonResponse({ success: true });
  } catch (e) {
    console.error("admin update company error:", e);
    return jsonResponse({ error: "Failed to update company" }, 500);
  }
}

// ─── GET /api/admin/users ────────────────────────────────────────────────────
export async function handleAdminListUsers(req: Request): Promise<Response> {
  try {
    const authResult = await getAuthUserOrError(req);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult as any;
    if (user.role !== "admin") return jsonResponse({ error: "Only admins can list users" }, 403);

    const users = await db(sql`
      SELECT u.id, u.email, u.name, u.role, u.avatar_url, u.is_active, u.created_at, u.last_login_at,
             t.name as team_name, d.name as department_name, st.name as sub_team_name
      FROM users u
      LEFT JOIN teams t ON t.id = u.team_id
      LEFT JOIN departments d ON d.id = u.department_id
      LEFT JOIN sub_teams st ON st.id = u.sub_team_id
      WHERE u.company_id = ${user.companyId}
      ORDER BY u.name
    `);
    return jsonResponse({ users });
  } catch (e) {
    console.error("admin list users error:", e);
    return jsonResponse({ error: "Failed to list users" }, 500);
  }
}

// ─── PUT /api/admin/users/:id ────────────────────────────────────────────────
export async function handleAdminUpdateUser(req: Request): Promise<Response> {
  try {
    const authResult = await getAuthUserOrError(req);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult as any;
    if (user.role !== "admin") return jsonResponse({ error: "Only admins can update users" }, 403);

    const userId = new URL(req.url).pathname.split("/").pop();
    const { role, team_id, department_id, sub_team_id, is_active } = await req.json();

    if (role) await db(sql`UPDATE users SET role = ${role}, updated_at = datetime('now') WHERE id = ${userId} AND company_id = ${user.companyId}`);
    if (team_id !== undefined) await db(sql`UPDATE users SET team_id = ${team_id || null}, updated_at = datetime('now') WHERE id = ${userId} AND company_id = ${user.companyId}`);
    if (department_id !== undefined) await db(sql`UPDATE users SET department_id = ${department_id || null}, updated_at = datetime('now') WHERE id = ${userId} AND company_id = ${user.companyId}`);
    if (sub_team_id !== undefined) await db(sql`UPDATE users SET sub_team_id = ${sub_team_id || null}, updated_at = datetime('now') WHERE id = ${userId} AND company_id = ${user.companyId}`);
    if (is_active !== undefined) await db(sql`UPDATE users SET is_active = ${is_active ? 1 : 0}, updated_at = datetime('now') WHERE id = ${userId} AND company_id = ${user.companyId}`);

    await logAuditEvent(user.companyId, user.id, "update_user", "user", userId, "Updated user profile/role");

    return jsonResponse({ success: true });
  } catch (e) {
    console.error("admin update user error:", e);
    return jsonResponse({ error: "Failed to update user" }, 500);
  }
}

// ─── Departments CRUD ──────────────────────────────────────────────────────────

// ─── GET /api/admin/departments ──────────────────────────────────────────────
export async function handleListDepartments(req: Request): Promise<Response> {
  try {
    const authResult = await getAuthUserOrError(req);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult as any;
    if (user.role !== "admin" && user.role !== "manager") return jsonResponse({ error: "Access denied" }, 403);

    const depts = await db(sql`
      SELECT d.*, u.name as head_name,
             (SELECT COUNT(*) FROM users WHERE department_id = d.id) as member_count,
             (SELECT COUNT(*) FROM sub_teams WHERE department_id = d.id) as sub_team_count
      FROM departments d
      LEFT JOIN users u ON u.id = d.head_user_id
      WHERE d.company_id = ${user.companyId}
      ORDER BY d.name
    `);
    return jsonResponse({ departments: depts });
  } catch (e) {
    console.error("list departments error:", e);
    return jsonResponse({ error: "Failed to list departments" }, 500);
  }
}

// ─── POST /api/admin/departments ─────────────────────────────────────────────
export async function handleCreateDepartment(req: Request): Promise<Response> {
  try {
    const authResult = await getAuthUserOrError(req);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult as any;
    if (user.role !== "admin") return jsonResponse({ error: "Only admins can create departments" }, 403);

    const { name, description, head_user_id, parent_department_id } = await req.json();
    if (!name) return jsonResponse({ error: "Name is required" }, 400);

    const id = crypto.randomUUID();
    await db(sql`
      INSERT INTO departments (id, company_id, name, description, head_user_id, parent_department_id)
      VALUES (${id}, ${user.companyId}, ${name}, ${description || ""}, ${head_user_id || null}, ${parent_department_id || null})
    `);

    await logAuditEvent(user.companyId, user.id, "create_department", "department", id, `Created department: ${name}`);

    return jsonResponse({ success: true, department: { id, name, description: description || "", head_user_id: head_user_id || null, parent_department_id: parent_department_id || null } });
  } catch (e) {
    console.error("create department error:", e);
    return jsonResponse({ error: "Failed to create department" }, 500);
  }
}

// ─── PUT /api/admin/departments/:id ──────────────────────────────────────────
export async function handleUpdateDepartment(req: Request): Promise<Response> {
  try {
    const authResult = await getAuthUserOrError(req);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult as any;
    if (user.role !== "admin") return jsonResponse({ error: "Only admins can update departments" }, 403);

    const deptId = new URL(req.url).pathname.split("/").pop();
    const { name, description, head_user_id, parent_department_id, is_active } = await req.json();

    if (name) await db(sql`UPDATE departments SET name = ${name}, updated_at = datetime('now') WHERE id = ${deptId} AND company_id = ${user.companyId}`);
    if (description !== undefined) await db(sql`UPDATE departments SET description = ${description}, updated_at = datetime('now') WHERE id = ${deptId} AND company_id = ${user.companyId}`);
    if (head_user_id !== undefined) await db(sql`UPDATE departments SET head_user_id = ${head_user_id || null}, updated_at = datetime('now') WHERE id = ${deptId} AND company_id = ${user.companyId}`);
    if (parent_department_id !== undefined) await db(sql`UPDATE departments SET parent_department_id = ${parent_department_id || null}, updated_at = datetime('now') WHERE id = ${deptId} AND company_id = ${user.companyId}`);
    if (is_active !== undefined) await db(sql`UPDATE departments SET is_active = ${is_active ? 1 : 0}, updated_at = datetime('now') WHERE id = ${deptId} AND company_id = ${user.companyId}`);

    await logAuditEvent(user.companyId, user.id, "update_department", "department", deptId, "Updated department");

    return jsonResponse({ success: true });
  } catch (e) {
    console.error("update department error:", e);
    return jsonResponse({ error: "Failed to update department" }, 500);
  }
}

// ─── DELETE /api/admin/departments/:id ───────────────────────────────────────
export async function handleDeleteDepartment(req: Request): Promise<Response> {
  try {
    const authResult = await getAuthUserOrError(req);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult as any;
    if (user.role !== "admin") return jsonResponse({ error: "Only admins can delete departments" }, 403);

    const deptId = new URL(req.url).pathname.split("/").pop();
    await db(sql`DELETE FROM departments WHERE id = ${deptId} AND company_id = ${user.companyId}`);

    await logAuditEvent(user.companyId, user.id, "delete_department", "department", deptId, "Deleted department");

    return jsonResponse({ success: true });
  } catch (e) {
    console.error("delete department error:", e);
    return jsonResponse({ error: "Failed to delete department" }, 500);
  }
}

// ─── Sub-Teams ─────────────────────────────────────────────────────────────────

// ─── GET /api/admin/sub-teams ────────────────────────────────────────────────
export async function handleListSubTeams(req: Request): Promise<Response> {
  try {
    const authResult = await getAuthUserOrError(req);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult as any;

    const teams = await db(sql`
      SELECT st.*, u.name as lead_name, d.name as department_name,
             (SELECT COUNT(*) FROM users WHERE sub_team_id = st.id) as member_count
      FROM sub_teams st
      LEFT JOIN users u ON u.id = st.lead_user_id
      LEFT JOIN departments d ON d.id = st.department_id
      WHERE st.company_id = ${user.companyId}
      ORDER BY st.name
    `);
    return jsonResponse({ subTeams: teams });
  } catch (e) {
    console.error("list sub-teams error:", e);
    return jsonResponse({ error: "Failed to list sub-teams" }, 500);
  }
}

// ─── POST /api/admin/sub-teams ───────────────────────────────────────────────
export async function handleCreateSubTeam(req: Request): Promise<Response> {
  try {
    const authResult = await getAuthUserOrError(req);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult as any;
    if (user.role !== "admin") return jsonResponse({ error: "Only admins can create sub-teams" }, 403);

    const { name, description, department_id, lead_user_id } = await req.json();
    if (!name) return jsonResponse({ error: "Name is required" }, 400);

    const id = crypto.randomUUID();
    await db(sql`
      INSERT INTO sub_teams (id, company_id, department_id, name, description, lead_user_id)
      VALUES (${id}, ${user.companyId}, ${department_id || null}, ${name}, ${description || ""}, ${lead_user_id || null})
    `);

    return jsonResponse({ success: true, subTeam: { id, name, description: description || "", department_id: department_id || null, lead_user_id: lead_user_id || null } });
  } catch (e) {
    console.error("create sub-team error:", e);
    return jsonResponse({ error: "Failed to create sub-team" }, 500);
  }
}

// ─── PUT/DELETE /api/admin/sub-teams/:id ─────────────────────────────────────
export async function handleUpdateSubTeam(req: Request): Promise<Response> {
  try {
    const authResult = await getAuthUserOrError(req);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult as any;
    if (user.role !== "admin") return jsonResponse({ error: "Only admins can update sub-teams" }, 403);

    const teamId = new URL(req.url).pathname.split("/").pop();
    const { name, description, department_id, lead_user_id, is_active } = await req.json();

    if (name) await db(sql`UPDATE sub_teams SET name = ${name}, updated_at = datetime('now') WHERE id = ${teamId} AND company_id = ${user.companyId}`);
    if (description !== undefined) await db(sql`UPDATE sub_teams SET description = ${description}, updated_at = datetime('now') WHERE id = ${teamId} AND company_id = ${user.companyId}`);
    if (department_id !== undefined) await db(sql`UPDATE sub_teams SET department_id = ${department_id || null}, updated_at = datetime('now') WHERE id = ${teamId} AND company_id = ${user.companyId}`);
    if (lead_user_id !== undefined) await db(sql`UPDATE sub_teams SET lead_user_id = ${lead_user_id || null}, updated_at = datetime('now') WHERE id = ${teamId} AND company_id = ${user.companyId}`);
    if (is_active !== undefined) await db(sql`UPDATE sub_teams SET is_active = ${is_active ? 1 : 0}, updated_at = datetime('now') WHERE id = ${teamId} AND company_id = ${user.companyId}`);

    return jsonResponse({ success: true });
  } catch (e) {
    console.error("update sub-team error:", e);
    return jsonResponse({ error: "Failed to update sub-team" }, 500);
  }
}

export async function handleDeleteSubTeam(req: Request): Promise<Response> {
  try {
    const authResult = await getAuthUserOrError(req);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult as any;
    if (user.role !== "admin") return jsonResponse({ error: "Only admins can delete sub-teams" }, 403);

    const teamId = new URL(req.url).pathname.split("/").pop();
    await db(sql`DELETE FROM sub_teams WHERE id = ${teamId} AND company_id = ${user.companyId}`);
    return jsonResponse({ success: true });
  } catch (e) {
    console.error("delete sub-team error:", e);
    return jsonResponse({ error: "Failed to delete sub-team" }, 500);
  }
}

// ─── Feature Flags ──────────────────────────────────────────────────────────────

// ─── GET /api/admin/feature-flags ────────────────────────────────────────────
export async function handleListFeatureFlags(req: Request): Promise<Response> {
  try {
    const authResult = await getAuthUserOrError(req);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult as any;

    const flags = await db(sql`SELECT * FROM feature_flags WHERE company_id = ${user.companyId} ORDER BY feature_key`);
    return jsonResponse({ featureFlags: flags });
  } catch (e) {
    console.error("list feature flags error:", e);
    return jsonResponse({ error: "Failed to list feature flags" }, 500);
  }
}

// ─── PUT /api/admin/feature-flags ────────────────────────────────────────────
export async function handleUpdateFeatureFlag(req: Request): Promise<Response> {
  try {
    const authResult = await getAuthUserOrError(req);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult as any;
    if (user.role !== "admin") return jsonResponse({ error: "Only admins can manage feature flags" }, 403);

    const { feature_key, is_enabled, config } = await req.json();
    if (!feature_key) return jsonResponse({ error: "feature_key is required" }, 400);

    const existing = await db(sql`SELECT id FROM feature_flags WHERE company_id = ${user.companyId} AND feature_key = ${feature_key}`);
    if (existing.length > 0) {
      await db(sql`UPDATE feature_flags SET is_enabled = ${is_enabled ? 1 : 0}, config = ${config ? JSON.stringify(config) : '{}'}, updated_at = datetime('now') WHERE company_id = ${user.companyId} AND feature_key = ${feature_key}`);
    } else {
      await db(sql`INSERT INTO feature_flags (id, company_id, feature_key, is_enabled, config) VALUES (${crypto.randomUUID()}, ${user.companyId}, ${feature_key}, ${is_enabled ? 1 : 0}, ${config ? JSON.stringify(config) : '{}'})`);
    }

    await logAuditEvent(user.companyId, user.id, "update_feature_flag", "feature_flag", feature_key, `Feature ${feature_key}: ${is_enabled ? "enabled" : "disabled"}`);

    return jsonResponse({ success: true });
  } catch (e) {
    console.error("update feature flag error:", e);
    return jsonResponse({ error: "Failed to update feature flag" }, 500);
  }
}

// ─── Audit Logs ─────────────────────────────────────────────────────────────────

// ─── GET /api/admin/audit-logs ───────────────────────────────────────────────
export async function handleListAuditLogs(req: Request): Promise<Response> {
  try {
    const authResult = await getAuthUserOrError(req);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult as any;
    if (user.role !== "admin") return jsonResponse({ error: "Access denied" }, 403);

    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const action = url.searchParams.get("action") || "";

    let query = sql`
      SELECT al.*, u.name as user_name
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      WHERE al.company_id = ${user.companyId}
    `;
    if (action) query = sql`${query} AND al.action = ${action}`;
    query = sql`${query} ORDER BY al.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const logs = await db(query);
    return jsonResponse({ auditLogs: logs });
  } catch (e) {
    console.error("list audit logs error:", e);
    return jsonResponse({ error: "Failed to list audit logs" }, 500);
  }
}

// ─── Usage Metrics ──────────────────────────────────────────────────────────────

// ─── GET /api/admin/usage ────────────────────────────────────────────────────
export async function handleGetUsageMetrics(req: Request): Promise<Response> {
  try {
    const authResult = await getAuthUserOrError(req);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult as any;

    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get("days") || "30");

    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const metrics = await db(sql`
      SELECT metric_key, SUM(metric_value) as total, COUNT(*) as records
      FROM usage_metrics
      WHERE company_id = ${user.companyId} AND recorded_at >= ${cutoff}
      GROUP BY metric_key
      ORDER BY metric_key
    `);

    // Compute aggregate stats
    const callsCount = (await db(sql`SELECT COUNT(*) as c FROM calls WHERE company_id = ${user.companyId} AND created_at >= ${cutoff}`))[0]?.c || 0;
    const analysesCount = (await db(sql`SELECT COUNT(*) as c FROM call_analyses ca JOIN calls c ON c.id = ca.call_id WHERE c.company_id = ${user.companyId} AND ca.created_at >= ${cutoff}`))[0]?.c || 0;
    const activeUsers = (await db(sql`SELECT COUNT(*) as c FROM users WHERE company_id = ${user.companyId} AND is_active = 1`))[0]?.c || 0;

    return jsonResponse({
      usageMetrics: metrics,
      aggregates: {
        callsRecorded: callsCount,
        callsAnalyzed: analysesCount,
        activeUsers,
        periodDays: days,
      },
    });
  } catch (e) {
    console.error("get usage metrics error:", e);
    return jsonResponse({ error: "Failed to get usage metrics" }, 500);
  }
}

// ─── White Label ────────────────────────────────────────────────────────────────

// ─── GET /api/admin/white-label ──────────────────────────────────────────────
export async function handleGetWhiteLabel(req: Request): Promise<Response> {
  try {
    const authResult = await getAuthUserOrError(req);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult as any;
    if (user.role !== "admin") return jsonResponse({ error: "Access denied" }, 403);

    const rows = await db(sql`SELECT white_label FROM companies WHERE id = ${user.companyId}`);
    if (rows.length === 0) return jsonResponse({ error: "Company not found" }, 404);

    return jsonResponse({ whiteLabel: JSON.parse(rows[0].white_label || "{}") });
  } catch (e) {
    console.error("get white label error:", e);
    return jsonResponse({ error: "Failed to load white label config" }, 500);
  }
}

// ─── PUT /api/admin/white-label ──────────────────────────────────────────────
export async function handleUpdateWhiteLabel(req: Request): Promise<Response> {
  try {
    const authResult = await getAuthUserOrError(req);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult as any;
    if (user.role !== "admin") return jsonResponse({ error: "Access denied" }, 403);

    const { logo_url, primary_color, secondary_color, company_tagline, custom_domain } = await req.json();
    const config = { logo_url, primary_color, secondary_color, company_tagline, custom_domain };

    await db(sql`UPDATE companies SET white_label = ${JSON.stringify(config)}, updated_at = datetime('now') WHERE id = ${user.companyId}`);

    return jsonResponse({ success: true, whiteLabel: config });
  } catch (e) {
    console.error("update white label error:", e);
    return jsonResponse({ error: "Failed to update white label" }, 500);
  }
}

// ─── Audit Log Helper ───────────────────────────────────────────────────────────
export async function logAuditEvent(
  companyId: string,
  userId: string | null,
  action: string,
  resourceType: string,
  resourceId: string | null,
  details: string,
  ipAddress = "",
  userAgent = "",
): Promise<void> {
  try {
    await db(sql`
      INSERT INTO audit_logs (id, company_id, user_id, action, resource_type, resource_id, details, ip_address, user_agent)
      VALUES (${crypto.randomUUID()}, ${companyId}, ${userId}, ${action}, ${resourceType}, ${resourceId}, ${JSON.stringify({ description: details })}, ${ipAddress}, ${userAgent})
    `);
  } catch (e) {
    console.error("audit log error:", e);
  }
}