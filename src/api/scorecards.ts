/**
 * Scorecards API handlers: CRUD for scorecards and their criteria.
 */

import { sql } from "~/utils/sql";
import { db, jsonResponse, getAuthUser } from "./middleware";

// ─── GET /api/scorecards ───────────────────────────────────────────────────────
export async function handleListScorecards(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const scorecards = await db(sql`
      SELECT sc.*, (SELECT COUNT(*) FROM scorecard_criteria WHERE scorecard_id = sc.id) as criteria_count
      FROM scorecards sc
      WHERE sc.company_id = ${user.companyId}
      ORDER BY sc.created_at DESC
    `);

    // Fetch criteria for each scorecard
    const result = await Promise.all(
      scorecards.map(async (sc: any) => {
        const criteria = await db(sql`SELECT * FROM scorecard_criteria WHERE scorecard_id = ${sc.id} ORDER BY sort_order`);
        return { ...sc, criteria };
      }),
    );

    return jsonResponse({ scorecards: result });
  } catch (e) {
    console.error("list scorecards error:", e);
    return jsonResponse({ error: "Failed to list scorecards" }, 500);
  }
}

// ─── POST /api/scorecards ──────────────────────────────────────────────────────
export async function handleCreateScorecard(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const { name, description } = await req.json();
    if (!name) return jsonResponse({ error: "Name is required" }, 400);

    const id = crypto.randomUUID();
    await db(sql`INSERT INTO scorecards (id, company_id, name, description) VALUES (${id}, ${user.companyId}, ${name}, ${description || ""})`);

    return jsonResponse({ success: true, scorecard: { id, name, description: description || "", criteria: [], criteria_count: 0 } });
  } catch (e) {
    console.error("create scorecard error:", e);
    return jsonResponse({ error: "Failed to create scorecard" }, 500);
  }
}

// ─── PUT /api/scorecards/:id ───────────────────────────────────────────────────
export async function handleUpdateScorecard(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const id = new URL(req.url).pathname.split("/").pop();
    const { name, description } = await req.json();
    if (!id || !name) return jsonResponse({ error: "Name is required" }, 400);

    await db(sql`UPDATE scorecards SET name = ${name}, description = ${description || ""}, updated_at = datetime('now') WHERE id = ${id} AND company_id = ${user.companyId}`);
    return jsonResponse({ success: true });
  } catch (e) {
    console.error("update scorecard error:", e);
    return jsonResponse({ error: "Failed to update scorecard" }, 500);
  }
}

// ─── DELETE /api/scorecards/:id ────────────────────────────────────────────────
export async function handleDeleteScorecard(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const id = new URL(req.url).pathname.split("/").pop();
    if (!id) return jsonResponse({ error: "ID required" }, 400);

    await db(sql`DELETE FROM scorecards WHERE id = ${id} AND company_id = ${user.companyId}`);
    return jsonResponse({ success: true });
  } catch (e) {
    console.error("delete scorecard error:", e);
    return jsonResponse({ error: "Failed to delete scorecard" }, 500);
  }
}

// ─── POST /api/scorecards/:id/criteria ─────────────────────────────────────────
export async function handleCreateCriteria(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const parts = new URL(req.url).pathname.split("/");
    const scorecardId = parts[3];
    const { name, max_score, weight, category, sort_order } = await req.json();
    if (!name) return jsonResponse({ error: "Name is required" }, 400);

    // Verify scorecard belongs to company
    const sc = await db(sql`SELECT id FROM scorecards WHERE id = ${scorecardId} AND company_id = ${user.companyId}`);
    if (sc.length === 0) return jsonResponse({ error: "Scorecard not found" }, 404);

    const id = crypto.randomUUID();
    const maxScore = max_score != null ? max_score : 10;
    const w = weight != null ? weight : 1.0;
    const cat = category || "";
    const order = sort_order != null ? sort_order : 0;

    await db(sql`INSERT INTO scorecard_criteria (id, scorecard_id, name, max_score, weight, category, sort_order) VALUES (${id}, ${scorecardId}, ${name}, ${maxScore}, ${w}, ${cat}, ${order})`);

    return jsonResponse({ success: true, criteria: { id, name, max_score: maxScore, weight: w, category: cat, sort_order: order } });
  } catch (e) {
    console.error("create criteria error:", e);
    return jsonResponse({ error: "Failed to create criteria" }, 500);
  }
}

// ─── PUT /api/scorecards/:id/criteria/:criteriaId ──────────────────────────────
export async function handleUpdateCriteria(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const parts = new URL(req.url).pathname.split("/");
    const criteriaId = parts[5];
    const { name, max_score, weight, category, sort_order } = await req.json();
    if (!criteriaId || !name) return jsonResponse({ error: "Name is required" }, 400);

    const maxScore = max_score != null ? max_score : 10;
    const w = weight != null ? weight : 1.0;
    const cat = category || "";
    const order = sort_order != null ? sort_order : 0;

    await db(sql`UPDATE scorecard_criteria SET name = ${name}, max_score = ${maxScore}, weight = ${w}, category = ${cat}, sort_order = ${order} WHERE id = ${criteriaId}`);
    return jsonResponse({ success: true });
  } catch (e) {
    console.error("update criteria error:", e);
    return jsonResponse({ error: "Failed to update criteria" }, 500);
  }
}

// ─── DELETE /api/scorecards/:id/criteria/:criteriaId ───────────────────────────
export async function handleDeleteCriteria(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const parts = new URL(req.url).pathname.split("/");
    const criteriaId = parts[5];
    if (!criteriaId) return jsonResponse({ error: "ID required" }, 400);

    await db(sql`DELETE FROM scorecard_criteria WHERE id = ${criteriaId}`);
    return jsonResponse({ success: true });
  } catch (e) {
    console.error("delete criteria error:", e);
    return jsonResponse({ error: "Failed to delete criteria" }, 500);
  }
}