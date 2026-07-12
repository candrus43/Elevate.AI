/**
 * Compliance API handlers: rules CRUD and checks listing.
 */

import { sql } from "~/utils/sql";
import { db, jsonResponse, getAuthUser } from "./middleware";

// ─── GET /api/compliance/rules ─────────────────────────────────────────────────
export async function handleListComplianceRules(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const rules = await db(sql`
      SELECT * FROM compliance_rules WHERE company_id = ${user.companyId} ORDER BY created_at DESC
    `);

    // Parse JSON string fields
    return jsonResponse({
      rules: rules.map((r: any) => ({
        ...r,
        script_required_phrases: JSON.parse(r.script_required_phrases || "[]"),
        prohibited_phrases: JSON.parse(r.prohibited_phrases || "[]"),
      })),
    });
  } catch (e) {
    console.error("list rules error:", e);
    return jsonResponse({ error: "Failed to load rules" }, 500);
  }
}

// ─── POST /api/compliance/rules ────────────────────────────────────────────────
export async function handleCreateComplianceRule(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (user.role !== "admin" && user.role !== "manager") {
      return jsonResponse({ error: "Only admins and managers can manage rules" }, 403);
    }

    const { name, description, script_required_phrases, prohibited_phrases } = await req.json();
    if (!name) return jsonResponse({ error: "Name is required" }, 400);

    const id = crypto.randomUUID();
    await db(sql`
      INSERT INTO compliance_rules (id, company_id, name, description, script_required_phrases, prohibited_phrases)
      VALUES (${id}, ${user.companyId}, ${name}, ${description || ""}, ${JSON.stringify(script_required_phrases || [])}, ${JSON.stringify(prohibited_phrases || [])})
    `);

    return jsonResponse({
      success: true,
      rule: {
        id,
        name,
        description: description || "",
        script_required_phrases: script_required_phrases || [],
        prohibited_phrases: prohibited_phrases || [],
        is_active: 1,
      },
    });
  } catch (e) {
    console.error("create rule error:", e);
    return jsonResponse({ error: "Failed to create rule" }, 500);
  }
}

// ─── PUT /api/compliance/rules/:id ─────────────────────────────────────────────
export async function handleUpdateComplianceRule(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (user.role !== "admin" && user.role !== "manager") {
      return jsonResponse({ error: "Only admins and managers can manage rules" }, 403);
    }

    const ruleId = new URL(req.url).pathname.split("/").pop();
    const { name, description, script_required_phrases, prohibited_phrases, is_active } = await req.json();
    if (!ruleId) return jsonResponse({ error: "Rule ID required" }, 400);

    if (name) await db(sql`UPDATE compliance_rules SET name = ${name}, updated_at = datetime('now') WHERE id = ${ruleId} AND company_id = ${user.companyId}`);
    if (description !== undefined) await db(sql`UPDATE compliance_rules SET description = ${description}, updated_at = datetime('now') WHERE id = ${ruleId} AND company_id = ${user.companyId}`);
    if (script_required_phrases) await db(sql`UPDATE compliance_rules SET script_required_phrases = ${JSON.stringify(script_required_phrases)}, updated_at = datetime('now') WHERE id = ${ruleId} AND company_id = ${user.companyId}`);
    if (prohibited_phrases) await db(sql`UPDATE compliance_rules SET prohibited_phrases = ${JSON.stringify(prohibited_phrases)}, updated_at = datetime('now') WHERE id = ${ruleId} AND company_id = ${user.companyId}`);
    if (is_active !== undefined) await db(sql`UPDATE compliance_rules SET is_active = ${is_active ? 1 : 0}, updated_at = datetime('now') WHERE id = ${ruleId} AND company_id = ${user.companyId}`);

    return jsonResponse({ success: true });
  } catch (e) {
    console.error("update rule error:", e);
    return jsonResponse({ error: "Failed to update rule" }, 500);
  }
}

// ─── DELETE /api/compliance/rules/:id ──────────────────────────────────────────
export async function handleDeleteComplianceRule(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (user.role !== "admin" && user.role !== "manager") {
      return jsonResponse({ error: "Only admins and managers can manage rules" }, 403);
    }

    const ruleId = new URL(req.url).pathname.split("/").pop();
    if (!ruleId) return jsonResponse({ error: "Rule ID required" }, 400);

    await db(sql`DELETE FROM compliance_rules WHERE id = ${ruleId} AND company_id = ${user.companyId}`);
    return jsonResponse({ success: true });
  } catch (e) {
    console.error("delete rule error:", e);
    return jsonResponse({ error: "Failed to delete rule" }, 500);
  }
}

// ─── GET /api/compliance/checks ────────────────────────────────────────────────
export async function handleListComplianceChecks(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const checks = await db(sql`
      SELECT cc.*, cr.name as rule_name, u.name as rep_name, c.started_at as call_date
      FROM compliance_checks cc
      JOIN compliance_rules cr ON cr.id = cc.rule_id
      JOIN calls c ON c.id = cc.call_id
      JOIN users u ON u.id = c.user_id
      WHERE cr.company_id = ${user.companyId}
      ORDER BY cc.created_at DESC
      LIMIT 50
    `);

    return jsonResponse({ checks });
  } catch (e) {
    console.error("list checks error:", e);
    return jsonResponse({ error: "Failed to load checks" }, 500);
  }
}