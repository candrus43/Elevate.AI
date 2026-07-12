/**
 * Settings API handlers: company settings, profile, password, notifications.
 */

import { sql } from "~/utils/sql";
import { db, jsonResponse, getAuthUser, isValidEmail } from "./middleware";
import { getCompanyDemoMode, setCompanyDemoMode, canAccessLiveData, completeUserOnboarding } from "./integration-mode";

// ─── GET /api/settings/company ─────────────────────────────────────────────────
export async function handleGetCompanySettings(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const rows = await db(sql`
      SELECT id, name, slug, tier, settings, created_at
      FROM companies WHERE id = ${user.companyId}
    `);
    if (rows.length === 0) return jsonResponse({ error: "Company not found" }, 404);

    const company = rows[0];
    const teamSize = await db(sql`SELECT COUNT(*) as count FROM users WHERE company_id = ${user.companyId}`);

    return jsonResponse({
      company: {
        ...company,
        settings: JSON.parse(company.settings || "{}"),
        teamSize: teamSize[0]?.count || 0,
      },
    });
  } catch (e) {
    console.error("get company settings error:", e);
    return jsonResponse({ error: "Failed to load settings" }, 500);
  }
}

// ─── PUT /api/settings/company ─────────────────────────────────────────────────
export async function handleUpdateCompanySettings(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (user.role !== "admin") return jsonResponse({ error: "Only admins can update company settings" }, 403);

    const { name, settings } = await req.json();
    if (name) await db(sql`UPDATE companies SET name = ${name}, updated_at = datetime('now') WHERE id = ${user.companyId}`);
    if (settings) await db(sql`UPDATE companies SET settings = ${JSON.stringify(settings)}, updated_at = datetime('now') WHERE id = ${user.companyId}`);

    return jsonResponse({ success: true });
  } catch (e) {
    console.error("update company settings error:", e);
    return jsonResponse({ error: "Failed to update settings" }, 500);
  }
}

// ─── PUT /api/settings/profile ─────────────────────────────────────────────────
export async function handleUpdateProfile(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const { name, email } = await req.json();
    if (!name && !email) return jsonResponse({ error: "Nothing to update" }, 400);

    if (email && email !== user.email) {
      if (!isValidEmail(email)) return jsonResponse({ error: "Invalid email format" }, 400);
      const existing = await db(sql`SELECT id FROM users WHERE email = ${email} AND id != ${user.id}`);
      if (existing.length > 0) return jsonResponse({ error: "Email already in use" }, 409);
    }

    if (name && email) await db(sql`UPDATE users SET name = ${name}, email = ${email}, updated_at = datetime('now') WHERE id = ${user.id}`);
    else if (name) await db(sql`UPDATE users SET name = ${name}, updated_at = datetime('now') WHERE id = ${user.id}`);
    else if (email) await db(sql`UPDATE users SET email = ${email}, updated_at = datetime('now') WHERE id = ${user.id}`);

    return jsonResponse({ success: true, user: { ...user, name: name || user.name, email: email || user.email } });
  } catch (e) {
    console.error("update profile error:", e);
    return jsonResponse({ error: "Failed to update profile" }, 500);
  }
}

// ─── PUT /api/settings/password ────────────────────────────────────────────────
export async function handleChangePassword(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) return jsonResponse({ error: "Current and new password required" }, 400);
    if (newPassword.length < 6) return jsonResponse({ error: "New password must be at least 6 characters" }, 400);

    const rows = await db(sql`SELECT password_hash FROM users WHERE id = ${user.id}`);
    if (rows.length === 0) return jsonResponse({ error: "User not found" }, 404);

    const valid = await Bun.password.verify(currentPassword, rows[0].password_hash);
    if (!valid) return jsonResponse({ error: "Current password is incorrect" }, 403);

    const passwordHash = await Bun.password.hash(newPassword);
    await db(sql`UPDATE users SET password_hash = ${passwordHash}, updated_at = datetime('now') WHERE id = ${user.id}`);

    return jsonResponse({ success: true });
  } catch (e) {
    console.error("change password error:", e);
    return jsonResponse({ error: "Failed to change password" }, 500);
  }
}

// ─── GET /api/settings/notifications ───────────────────────────────────────────
export async function handleGetNotifications(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const rows = await db(sql`SELECT * FROM notification_preferences WHERE user_id = ${user.id}`);
    if (rows.length === 0) {
      // Create default preferences
      const id = crypto.randomUUID();
      await db(sql`INSERT INTO notification_preferences (id, user_id) VALUES (${id}, ${user.id})`);
      return jsonResponse({ preferences: { call_analyzed: 1, coaching_assigned: 1, leaderboard_changes: 1 } });
    }

    return jsonResponse({ preferences: rows[0] });
  } catch (e) {
    console.error("get notifications error:", e);
    return jsonResponse({ error: "Failed to load preferences" }, 500);
  }
}

// ─── PUT /api/settings/notifications ───────────────────────────────────────────
export async function handleUpdateNotifications(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const { call_analyzed, coaching_assigned, leaderboard_changes } = await req.json();

    await db(sql`
      INSERT INTO notification_preferences (id, user_id, call_analyzed, coaching_assigned, leaderboard_changes)
      VALUES (${crypto.randomUUID()}, ${user.id}, ${call_analyzed ? 1 : 0}, ${coaching_assigned ? 1 : 0}, ${leaderboard_changes ? 1 : 0})
      ON CONFLICT(user_id) DO UPDATE SET
        call_analyzed = ${call_analyzed ? 1 : 0},
        coaching_assigned = ${coaching_assigned ? 1 : 0},
        leaderboard_changes = ${leaderboard_changes ? 1 : 0},
        updated_at = datetime('now')
    `);

    return jsonResponse({ success: true });
  } catch (e) {
    console.error("update notifications error:", e);
    return jsonResponse({ error: "Failed to update preferences" }, 500);
  }
}

// ─── GET /api/settings/demo-mode ────────────────────────────────────────────────
export async function handleGetDemoMode(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const companyDemoMode = await getCompanyDemoMode(user.companyId);
    const access = await canAccessLiveData(user.id, user.companyId);

    return jsonResponse({
      companyDemoMode,
      userDemoMode: !access.allowed,
      onboardingCompleted: access.allowed,
      reason: access.reason,
      allowed: access.allowed,
    });
  } catch (e) {
    console.error("get demo mode error:", e);
    return jsonResponse({ error: "Failed to get demo mode status" }, 500);
  }
}

// ─── PUT /api/settings/demo-mode ────────────────────────────────────────────────
export async function handleSetDemoMode(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (user.role !== "admin") return jsonResponse({ error: "Only admins can change demo mode" }, 403);

    const { demoMode } = await req.json();
    if (typeof demoMode !== "boolean") return jsonResponse({ error: "demoMode must be a boolean" }, 400);

    await setCompanyDemoMode(user.companyId, demoMode);

    return jsonResponse({ success: true, demoMode });
  } catch (e) {
    console.error("set demo mode error:", e);
    return jsonResponse({ error: "Failed to set demo mode" }, 500);
  }
}

// ─── GET /api/settings/onboarding-status ─────────────────────────────────────────
export async function handleGetOnboardingStatus(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const rows = await db(sql`
      SELECT demo_mode, onboarding_completed FROM users
      WHERE id = ${user.id} AND company_id = ${user.companyId}
    `);

    if (rows.length === 0) return jsonResponse({ error: "User not found" }, 404);

    const userRecord = rows[0];
    const companyDemoMode = await getCompanyDemoMode(user.companyId);
    const access = await canAccessLiveData(user.id, user.companyId);

    return jsonResponse({
      companyDemoMode,
      userDemoMode: userRecord.demo_mode === 1,
      onboardingCompleted: userRecord.onboarding_completed === 1,
      canAccessLiveData: access.allowed,
      reason: access.reason,
    });
  } catch (e) {
    console.error("get onboarding status error:", e);
    return jsonResponse({ error: "Failed to get onboarding status" }, 500);
  }
}

// ─── POST /api/settings/complete-onboarding ─────────────────────────────────────
export async function handleCompleteOnboarding(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    await completeUserOnboarding(user.id, user.companyId);

    return jsonResponse({ success: true, message: "Onboarding completed. Live mode access granted." });
  } catch (e) {
    console.error("complete onboarding error:", e);
    return jsonResponse({ error: "Failed to complete onboarding" }, 500);
  }
}