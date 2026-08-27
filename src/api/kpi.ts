/**
 * Configurable KPI Engine — handlers + template library + default profile seeding.
 * Phase A foundation. Additive-only; does not break existing endpoints.
 */

import { sql, esc } from "~/utils/sql";
import { db, jsonResponse, getAuthUser } from "./middleware";

// ─── Types ──────────────────────────────────────────────────────────────────────

export type KPICategory =
  | "SALES_PERFORMANCE"
  | "COACHING"
  | "QUALITY"
  | "COMPLIANCE"
  | "RETENTION"
  | "CUSTOMER_EXPERIENCE"
  | "PRODUCTIVITY"
  | "BUSINESS_OUTCOMES";

export type KPIDataSource =
  | "AI_CALL_ANALYSIS"
  | "CRM"
  | "MANUAL_ENTRY"
  | "API_INTEGRATION"
  | "CALCULATED"
  | "SURVEY"
  | "QUALITY_REVIEW"
  | "COMPLIANCE_REVIEW";

export interface KPIDefinition {
  id: string;
  company_id: string;
  name: string;
  description: string;
  category: KPICategory;
  data_source: KPIDataSource;
  formula: string;
  target: number | null;
  min_acceptable: number | null;
  weight: number;
  display_format: string;
  department_id: string | null;
  team_id: string | null;
  role: string;
  campaign_id: string | null;
  product_id: string | null;
  effective_date: string | null;
  expiration_date: string | null;
  status: string;
  is_visible_executive: number;
  is_visible_manager: number;
  is_visible_agent: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ─── Template Library — Default KPIs ──────────────────────────────────────────

interface KPITemplate {
  name: string;
  description: string;
  category: KPICategory;
  data_source: KPIDataSource;
  formula: string;
  target: number | null;
  min_acceptable: number | null;
  weight: number;
  display_format: string;
  sort_order: number;
  is_visible_executive: boolean;
  is_visible_manager: boolean;
  is_visible_agent: boolean;
  status: string;
}

export const DEFAULT_KPI_TEMPLATES: KPITemplate[] = [
  {
    name: "Overall Performance Score",
    description: "Weighted composite score from AI call analysis across all dimensions — primary measure of rep call quality.",
    category: "SALES_PERFORMANCE",
    data_source: "AI_CALL_ANALYSIS",
    formula: "AVG(overall_score) FROM call_analyses",
    target: 85,
    min_acceptable: 70,
    weight: 1.0,
    display_format: "percentage",
    sort_order: 0,
    is_visible_executive: true,
    is_visible_manager: true,
    is_visible_agent: true,
    status: "active",
  },
  {
    name: "Discovery Skills",
    description: "Measures the rep's ability to ask open-ended questions and uncover prospect needs during discovery.",
    category: "SALES_PERFORMANCE",
    data_source: "AI_CALL_ANALYSIS",
    formula: "AVG(discovery_score) FROM call_analyses",
    target: 80,
    min_acceptable: 65,
    weight: 0.9,
    display_format: "percentage",
    sort_order: 1,
    is_visible_executive: true,
    is_visible_manager: true,
    is_visible_agent: true,
    status: "active",
  },
  {
    name: "Objection Handling",
    description: "Effectiveness at addressing and overcoming prospect objections during calls.",
    category: "SALES_PERFORMANCE",
    data_source: "AI_CALL_ANALYSIS",
    formula: "AVG(objection_handling_score) FROM call_analyses",
    target: 80,
    min_acceptable: 60,
    weight: 0.9,
    display_format: "percentage",
    sort_order: 2,
    is_visible_executive: true,
    is_visible_manager: true,
    is_visible_agent: true,
    status: "active",
  },
  {
    name: "Closing Effectiveness",
    description: "Ability to progress calls toward next steps, commitments, and closed outcomes.",
    category: "SALES_PERFORMANCE",
    data_source: "AI_CALL_ANALYSIS",
    formula: "AVG(closing_score) FROM call_analyses",
    target: 78,
    min_acceptable: 60,
    weight: 0.85,
    display_format: "percentage",
    sort_order: 3,
    is_visible_executive: true,
    is_visible_manager: true,
    is_visible_agent: true,
    status: "active",
  },
  {
    name: "Communication & Rapport",
    description: "Clarity, active listening, and rapport-building demonstrated during calls.",
    category: "SALES_PERFORMANCE",
    data_source: "AI_CALL_ANALYSIS",
    formula: "AVG(communication_score) FROM call_analyses",
    target: 85,
    min_acceptable: 70,
    weight: 0.7,
    display_format: "percentage",
    sort_order: 4,
    is_visible_executive: true,
    is_visible_manager: true,
    is_visible_agent: true,
    status: "active",
  },
  {
    name: "Process / Script Adherence",
    description: "Consistency in following the defined sales process, required steps, and scripts.",
    category: "QUALITY",
    data_source: "AI_CALL_ANALYSIS",
    formula: "AVG(process_adherence_score) FROM call_analyses",
    target: 90,
    min_acceptable: 75,
    weight: 0.8,
    display_format: "percentage",
    sort_order: 5,
    is_visible_executive: true,
    is_visible_manager: true,
    is_visible_agent: false,
    status: "active",
  },
  {
    name: "Coaching Completion Rate",
    description: "Percentage of assigned coaching plans completed within the target timeframe.",
    category: "COACHING",
    data_source: "MANUAL_ENTRY",
    formula: "completed_plans / total_assigned_plans * 100",
    target: 90,
    min_acceptable: 70,
    weight: 0.6,
    display_format: "percentage",
    sort_order: 6,
    is_visible_executive: true,
    is_visible_manager: true,
    is_visible_agent: true,
    status: "active",
  },
  {
    name: "Post-Coaching Improvement",
    description: "Average score improvement after completing a coaching plan (post-score minus pre-score).",
    category: "COACHING",
    data_source: "CALCULATED",
    formula: "AVG(post_coaching_score - pre_coaching_score)",
    target: 5,
    min_acceptable: 2,
    weight: 0.7,
    display_format: "points",
    sort_order: 7,
    is_visible_executive: true,
    is_visible_manager: true,
    is_visible_agent: true,
    status: "active",
  },
  {
    name: "Calls Analyzed",
    description: "Number of calls that have been analyzed by the AI engine in the current period.",
    category: "PRODUCTIVITY",
    data_source: "CALCULATED",
    formula: "COUNT(*) FROM calls JOIN call_analyses",
    target: null,
    min_acceptable: null,
    weight: 0.5,
    display_format: "number",
    sort_order: 8,
    is_visible_executive: true,
    is_visible_manager: true,
    is_visible_agent: true,
    status: "active",
  },
  {
    name: "Performance Trend",
    description: "Direction and magnitude of score change over the last 4 weeks — positive means improving.",
    category: "SALES_PERFORMANCE",
    data_source: "CALCULATED",
    formula: "this_week_avg - 4_weeks_ago_avg",
    target: 3,
    min_acceptable: 0,
    weight: 0.5,
    display_format: "points",
    sort_order: 9,
    is_visible_executive: true,
    is_visible_manager: true,
    is_visible_agent: true,
    status: "active",
  },
  {
    name: "Top Coaching Opportunity",
    description: "The skill dimension with the largest gap between current score and target, surfaced for focus.",
    category: "COACHING",
    data_source: "CALCULATED",
    formula: "MAX(target - current_score) across dimensions",
    target: null,
    min_acceptable: null,
    weight: 0.3,
    display_format: "text",
    sort_order: 10,
    is_visible_executive: false,
    is_visible_manager: true,
    is_visible_agent: true,
    status: "active",
  },
  {
    name: "Compliance Score",
    description: "Aggregate compliance rate across all monitored rules. Active once compliance rules are configured.",
    category: "COMPLIANCE",
    data_source: "COMPLIANCE_REVIEW",
    formula: "passed_checks / total_checks * 100",
    target: 95,
    min_acceptable: 85,
    weight: 0.9,
    display_format: "percentage",
    sort_order: 11,
    is_visible_executive: true,
    is_visible_manager: true,
    is_visible_agent: false,
    status: "active_once_configured",
  },
];

// ─── Seed helpers ─────────────────────────────────────────────────────────────

export async function seedDefaultKPIProfile(companyId: string) {
  // Check if default profile already exists
  const existing = await db(sql`
    SELECT id FROM kpi_profiles WHERE company_id = ${companyId} AND is_default = 1
  `);
  if (existing.length > 0) return existing[0].id;

  // Create default profile
  const profileId = crypto.randomUUID();
  await db(sql`
    INSERT INTO kpi_profiles (id, company_id, name, description, is_default)
    VALUES (${profileId}, ${companyId}, ${"Elevate AI — Sales Performance Demo"}, ${"Default KPI profile with industry-agnostic sales performance metrics, coaching KPIs, and compliance readiness. Business-outcome KPIs require CRM integration."}, 1)
  `);

  // Insert each template KPI and link to profile
  for (let i = 0; i < DEFAULT_KPI_TEMPLATES.length; i++) {
    const tpl = DEFAULT_KPI_TEMPLATES[i];
    const kpiId = crypto.randomUUID();
    await db(sql`
      INSERT INTO kpi_definitions (id, company_id, name, description, category, data_source, formula, target, min_acceptable, weight, display_format, status, sort_order, is_visible_executive, is_visible_manager, is_visible_agent)
      VALUES (${kpiId}, ${companyId}, ${tpl.name}, ${tpl.description}, ${tpl.category}, ${tpl.data_source}, ${tpl.formula}, ${tpl.target}, ${tpl.min_acceptable}, ${tpl.weight}, ${tpl.display_format}, ${tpl.status}, ${tpl.sort_order}, ${tpl.is_visible_executive ? 1 : 0}, ${tpl.is_visible_manager ? 1 : 0}, ${tpl.is_visible_agent ? 1 : 0})
    `);

    const itemId = crypto.randomUUID();
    await db(sql`
      INSERT INTO kpi_profile_items (id, profile_id, kpi_definition_id, sort_order)
      VALUES (${itemId}, ${profileId}, ${kpiId}, ${tpl.sort_order})
    `);
  }

  console.log(`KPI Engine: Seeded default profile "${"Elevate AI — Sales Performance Demo"}" (${profileId}) with ${DEFAULT_KPI_TEMPLATES.length} KPIs`);
  return profileId;
}

// ─── KPI Definitions CRUD ─────────────────────────────────────────────────────

export async function handleListKPIDefinitions(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const url = new URL(req.url);
    const category = url.searchParams.get("category");
    const status = url.searchParams.get("status");

    let query = sql`SELECT * FROM kpi_definitions WHERE company_id = ${user.companyId}`;
    if (category) query += sql` AND category = ${category}`;
    if (status) query += sql` AND status = ${status}`;
    query += sql` ORDER BY sort_order, name`;

    const definitions = await db(query);

    return jsonResponse({
      definitions: definitions.map((d: any) => ({
        ...d,
        is_visible_executive: Boolean(d.is_visible_executive),
        is_visible_manager: Boolean(d.is_visible_manager),
        is_visible_agent: Boolean(d.is_visible_agent),
      })),
    });
  } catch (e) {
    console.error("list KPI definitions error:", e);
    return jsonResponse({ error: "Failed to list KPI definitions" }, 500);
  }
}

export async function handleGetKPIDefinition(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const kpiId = new URL(req.url).pathname.split("/").pop();
    const rows = await db(sql`
SELECT * FROM kpi_definitions WHERE id = ${kpiId} AND company_id = ${user.companyId}
    `);
    if (rows.length === 0) return jsonResponse({ error: "KPI definition not found" }, 404);

    const d = rows[0];
    return jsonResponse({
      ...d,
      is_visible_executive: Boolean(d.is_visible_executive),
      is_visible_manager: Boolean(d.is_visible_manager),
      is_visible_agent: Boolean(d.is_visible_agent),
    });
  } catch (e) {
    console.error("get KPI definition error:", e);
    return jsonResponse({ error: "Failed to get KPI definition" }, 500);
  }
}

export async function handleCreateKPIDefinition(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (user.role !== "admin" && user.role !== "manager") {
      return jsonResponse({ error: "Only admins and managers can manage KPIs" }, 403);
    }

    const body = await req.json();
    if (!body.name) return jsonResponse({ error: "Name is required" }, 400);

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await db(sql`
      INSERT INTO kpi_definitions (id, company_id, name, description, category, data_source, formula, target, min_acceptable, weight, display_format, department_id, team_id, role, campaign_id, product_id, effective_date, expiration_date, status, is_visible_executive, is_visible_manager, is_visible_agent, sort_order, created_at, updated_at)
      VALUES (${id}, ${user.companyId}, ${body.name}, ${body.description || ""}, ${body.category || "SALES_PERFORMANCE"}, ${body.data_source || "AI_CALL_ANALYSIS"}, ${body.formula || ""}, ${body.target ?? null}, ${body.min_acceptable ?? null}, ${body.weight ?? 1.0}, ${body.display_format || "number"}, ${body.department_id ?? null}, ${body.team_id ?? null}, ${body.role || ""}, ${body.campaign_id ?? null}, ${body.product_id ?? null}, ${body.effective_date ?? null}, ${body.expiration_date ?? null}, ${body.status || "active"}, ${body.is_visible_executive ? 1 : 0}, ${body.is_visible_manager ? 1 : 0}, ${body.is_visible_agent ? 1 : 0}, ${body.sort_order ?? 0}, ${now}, ${now})
    `);

    return jsonResponse({ success: true, id });
  } catch (e) {
    console.error("create KPI definition error:", e);
    return jsonResponse({ error: "Failed to create KPI definition" }, 500);
  }
}

export async function handleUpdateKPIDefinition(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (user.role !== "admin" && user.role !== "manager") {
      return jsonResponse({ error: "Only admins and managers can manage KPIs" }, 403);
    }

    const kpiId = new URL(req.url).pathname.split("/").pop();
    const body = await req.json();
    const now = new Date().toISOString();

    const sets: string[] = ["updated_at = " + esc(now)];
    const vals: unknown[] = [];
    const fields: Record<string, string> = {
      name: "name", description: "description", category: "category",
      data_source: "data_source", formula: "formula", display_format: "display_format",
      department_id: "department_id", team_id: "team_id", role: "role",
      campaign_id: "campaign_id", product_id: "product_id",
      effective_date: "effective_date", expiration_date: "expiration_date",
      status: "status", sort_order: "sort_order",
    };
    for (const [key, col] of Object.entries(fields)) {
      if (body[key] !== undefined) {
        sets.push(`${col} = ` + esc(body[key]));
      }
    }
    const numFields: Record<string, string> = {
      target: "target", min_acceptable: "min_acceptable", weight: "weight",
      is_visible_executive: "is_visible_executive",
      is_visible_manager: "is_visible_manager",
      is_visible_agent: "is_visible_agent",
    };
    for (const [key, col] of Object.entries(numFields)) {
      if (body[key] !== undefined) {
        sets.push(`${col} = ` + esc(body[key] ? 1 : 0));
      }
    }

    if (sets.length === 1) return jsonResponse({ error: "No fields to update" }, 400);

    await db(`UPDATE kpi_definitions SET ${sets.join(", ")} WHERE id = ${esc(kpiId)} AND company_id = ${esc(user.companyId)}`);

    return jsonResponse({ success: true });
  } catch (e) {
    console.error("update KPI definition error:", e);
    return jsonResponse({ error: "Failed to update KPI definition" }, 500);
  }
}

export async function handleDeleteKPIDefinition(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (user.role !== "admin") return jsonResponse({ error: "Only admins can delete KPIs" }, 403);

    const kpiId = new URL(req.url).pathname.split("/").pop();
    await db(sql`DELETE FROM kpi_profile_items WHERE kpi_definition_id = ${kpiId}`);
    await db(sql`DELETE FROM kpi_definitions WHERE id = ${kpiId} AND company_id = ${user.companyId}`);

    return jsonResponse({ success: true });
  } catch (e) {
    console.error("delete KPI definition error:", e);
    return jsonResponse({ error: "Failed to delete KPI definition" }, 500);
  }
}

// ─── KPI Profiles CRUD ────────────────────────────────────────────────────────

export async function handleListKPIProfiles(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const profiles = await db(sql`
      SELECT * FROM kpi_profiles WHERE company_id = ${user.companyId} ORDER BY is_default DESC, created_at DESC
    `);
    return jsonResponse({ profiles });
  } catch (e) {
    console.error("list KPI profiles error:", e);
    return jsonResponse({ error: "Failed to list KPI profiles" }, 500);
  }
}

export async function handleGetKPIProfile(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const profileId = new URL(req.url).pathname.split("/").pop();
    const rows = await db(sql`SELECT * FROM kpi_profiles WHERE id = ${profileId} AND company_id = ${user.companyId}`);
    if (rows.length === 0) return jsonResponse({ error: "Profile not found" }, 404);

    const items = await db(sql`
      SELECT pi.*, kd.name, kd.description, kd.category, kd.data_source, kd.target, kd.min_acceptable, kd.weight, kd.display_format, kd.status, kd.is_visible_executive, kd.is_visible_manager, kd.is_visible_agent
      FROM kpi_profile_items pi
      JOIN kpi_definitions kd ON kd.id = pi.kpi_definition_id
      WHERE pi.profile_id = ${profileId}
      ORDER BY pi.sort_order
    `);

    return jsonResponse({
      profile: rows[0],
      items: items.map((i: any) => ({
        ...i,
        is_visible_executive: Boolean(i.is_visible_executive),
        is_visible_manager: Boolean(i.is_visible_manager),
        is_visible_agent: Boolean(i.is_visible_agent),
        weight_effective: i.weight_override ?? i.weight,
        target_effective: i.target_override ?? i.target,
      })),
    });
  } catch (e) {
    console.error("get KPI profile error:", e);
    return jsonResponse({ error: "Failed to get KPI profile" }, 500);
  }
}

export async function handleCreateKPIProfile(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (user.role !== "admin" && user.role !== "manager") {
      return jsonResponse({ error: "Only admins and managers can manage profiles" }, 403);
    }

    const { name, description } = await req.json();
    if (!name) return jsonResponse({ error: "Name is required" }, 400);

    const id = crypto.randomUUID();
    await db(sql`
      INSERT INTO kpi_profiles (id, company_id, name, description, is_default)
      VALUES (${id}, ${user.companyId}, ${name}, ${description || ""}, 0)
    `);

    return jsonResponse({ success: true, id });
  } catch (e) {
    console.error("create KPI profile error:", e);
    return jsonResponse({ error: "Failed to create KPI profile" }, 500);
  }
}

export async function handleUpdateKPIProfile(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (user.role !== "admin" && user.role !== "manager") {
      return jsonResponse({ error: "Only admins and managers can manage profiles" }, 403);
    }

    const profileId = new URL(req.url).pathname.split("/").pop();
    const { name, description, is_default } = await req.json();

    const sets: string[] = ["updated_at = datetime('now')"];
    if (name !== undefined) sets.push("name = " + esc(name));
    if (description !== undefined) sets.push("description = " + esc(description));
    if (is_default !== undefined) sets.push("is_default = " + esc(is_default ? 1 : 0));

    await db(`UPDATE kpi_profiles SET ${sets.join(", ")} WHERE id = ${esc(profileId)} AND company_id = ${esc(user.companyId)}`);

    return jsonResponse({ success: true });
  } catch (e) {
    console.error("update KPI profile error:", e);
    return jsonResponse({ error: "Failed to update KPI profile" }, 500);
  }
}

export async function handleDeleteKPIProfile(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (user.role !== "admin") return jsonResponse({ error: "Only admins can delete profiles" }, 403);

    const profileId = new URL(req.url).pathname.split("/").pop();
    await db(sql`DELETE FROM kpi_profile_items WHERE profile_id = ${profileId}`);
    await db(sql`DELETE FROM kpi_profiles WHERE id = ${profileId} AND company_id = ${user.companyId} AND is_default = 0`);

    return jsonResponse({ success: true });
  } catch (e) {
    console.error("delete KPI profile error:", e);
    return jsonResponse({ error: "Failed to delete KPI profile" }, 500);
  }
}

// ─── Profile Items Management ─────────────────────────────────────────────────

export async function handleAddProfileItem(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (user.role !== "admin" && user.role !== "manager") {
      return jsonResponse({ error: "Only admins and managers can manage profiles" }, 403);
    }

    const profileId = new URL(req.url).pathname.split("/")[4]; // /api/kpi/profiles/:id/items
    const { kpi_definition_id, weight_override, target_override, sort_order } = await req.json();
    if (!kpi_definition_id) return jsonResponse({ error: "kpi_definition_id is required" }, 400);

    const id = crypto.randomUUID();
    await db(sql`
      INSERT INTO kpi_profile_items (id, profile_id, kpi_definition_id, weight_override, target_override, sort_order)
      VALUES (${id}, ${profileId}, ${kpi_definition_id}, ${weight_override ?? null}, ${target_override ?? null}, ${sort_order ?? 0})
    `);

    return jsonResponse({ success: true, id });
  } catch (e) {
    console.error("add profile item error:", e);
    return jsonResponse({ error: "Failed to add profile item" }, 500);
  }
}

export async function handleRemoveProfileItem(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (user.role !== "admin" && user.role !== "manager") {
      return jsonResponse({ error: "Only admins and managers can manage profiles" }, 403);
    }

    const itemId = new URL(req.url).pathname.split("/").pop();
    await db(sql`DELETE FROM kpi_profile_items WHERE id = ${itemId}`);

    return jsonResponse({ success: true });
  } catch (e) {
    console.error("remove profile item error:", e);
    return jsonResponse({ error: "Failed to remove profile item" }, 500);
  }
}

export async function handleSetItemOverride(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (user.role !== "admin" && user.role !== "manager") {
      return jsonResponse({ error: "Only admins and managers can manage profiles" }, 403);
    }

    const itemId = new URL(req.url).pathname.split("/").pop();
    const { weight_override, target_override, sort_order } = await req.json();

    const sets: string[] = [];
    if (weight_override !== undefined) sets.push("weight_override = " + esc(weight_override));
    if (target_override !== undefined) sets.push("target_override = " + esc(target_override));
    if (sort_order !== undefined) sets.push("sort_order = " + esc(sort_order));

    if (sets.length === 0) return jsonResponse({ error: "No fields to update" }, 400);

    await db(`UPDATE kpi_profile_items SET ${sets.join(", ")} WHERE id = ${esc(itemId)}`);

    return jsonResponse({ success: true });
  } catch (e) {
    console.error("set item override error:", e);
    return jsonResponse({ error: "Failed to update profile item" }, 500);
  }
}

// ─── Template Library ──────────────────────────────────────────────────────────────

export async function handleGetKPITemplates(_req: Request): Promise<Response> {
  return jsonResponse({ templates: DEFAULT_KPI_TEMPLATES });
}

export async function handleSeedDefaultProfile(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (user.role !== "admin") return jsonResponse({ error: "Only admins can seed profiles" }, 403);

    const profileId = await seedDefaultKPIProfile(user.companyId);

    return jsonResponse({ success: true, profileId });
  } catch (e) {
    console.error("seed default profile error:", e);
    return jsonResponse({ error: "Failed to seed default profile" }, 500);
  }
}