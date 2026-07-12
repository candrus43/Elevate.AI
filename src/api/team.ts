/**
 * Team invitation API handlers.
 */

import { sql } from "~/utils/sql";
import { db, jsonResponse, getAuthUser, isValidEmail } from "./middleware";

// ─── POST /api/team/invite ─────────────────────────────────────────────────────
export async function handleCreateInvite(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (user.role !== "admin" && user.role !== "manager") {
      return jsonResponse({ error: "Only admins and managers can invite" }, 403);
    }

    const { email, role, team_id } = await req.json();
    if (!email || !role) return jsonResponse({ error: "Email and role required" }, 400);
    if (!isValidEmail(email)) return jsonResponse({ error: "Invalid email format" }, 400);
    if (!["admin", "manager", "rep"].includes(role)) return jsonResponse({ error: "Invalid role" }, 400);

    const existingMember = await db(sql`SELECT id FROM users WHERE email = ${email} AND company_id = ${user.companyId}`);
    if (existingMember.length > 0) return jsonResponse({ error: "Already a team member" }, 409);

    const existingInvite = await db(sql`SELECT id FROM invitations WHERE email = ${email} AND company_id = ${user.companyId} AND status = 'pending'`);
    if (existingInvite.length > 0) return jsonResponse({ error: "Pending invitation already exists" }, 409);

    const inviteId = crypto.randomUUID();
    const token = crypto.randomUUID() + crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await db(sql`
      INSERT INTO invitations (id, company_id, email, role, team_id, invited_by, token, expires_at)
      VALUES (${inviteId}, ${user.companyId}, ${email}, ${role}, ${team_id || null}, ${user.id}, ${token}, ${expiresAt})
    `);

    return jsonResponse({
      success: true,
      invitation: { id: inviteId, email, role, team_id: team_id || null, token, expires_at: expiresAt },
    });
  } catch (e) {
    console.error("invite error:", e);
    return jsonResponse({ error: "Failed to create invitation" }, 500);
  }
}

// ─── GET /api/team/invites ─────────────────────────────────────────────────────
export async function handleListInvites(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (user.role !== "admin" && user.role !== "manager") {
      return jsonResponse({ error: "Only admins and managers can view invitations" }, 403);
    }

    const invites = await db(sql`
      SELECT i.id, i.email, i.role, i.team_id, i.status, i.created_at, i.expires_at,
             u.name as invited_by_name
      FROM invitations i
      LEFT JOIN users u ON u.id = i.invited_by
      WHERE i.company_id = ${user.companyId} AND i.status = 'pending'
      ORDER BY i.created_at DESC
    `);

    return jsonResponse({ invites });
  } catch (e) {
    console.error("list invites error:", e);
    return jsonResponse({ error: "Failed to list invitations" }, 500);
  }
}

// ─── DELETE /api/team/invite/:id ───────────────────────────────────────────────
export async function handleCancelInvite(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (user.role !== "admin" && user.role !== "manager") {
      return jsonResponse({ error: "Only admins and managers can cancel" }, 403);
    }

    const inviteId = new URL(req.url).pathname.split("/").pop();
    if (!inviteId) return jsonResponse({ error: "Invitation ID required" }, 400);

    await db(sql`UPDATE invitations SET status = 'cancelled' WHERE id = ${inviteId} AND company_id = ${user.companyId} AND status = 'pending'`);
    return jsonResponse({ success: true });
  } catch (e) {
    console.error("cancel invite error:", e);
    return jsonResponse({ error: "Failed to cancel invitation" }, 500);
  }
}