/**
 * Auth API handlers: login, register, logout, session.
 */

import { sql } from "~/utils/sql";
import {
  db,
  jsonResponse,
  makeSetCookie,
  isValidEmail,
  getClientIp,
  loginLimiter,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "./middleware";

// ─── POST /api/login ───────────────────────────────────────────────────────────
export async function handleLogin(req: Request): Promise<Response> {
  try {
    const ip = getClientIp(req);
    if (!loginLimiter.check(ip)) {
      return jsonResponse({ success: false, error: "Too many login attempts. Try again in one minute." }, 429);
    }
    const { email, password } = await req.json();
    if (!email || !password) return jsonResponse({ success: false, error: "Email and password required" }, 400);
    if (!isValidEmail(email)) return jsonResponse({ success: false, error: "Invalid email format" }, 400);

    const rows = await db(sql`
      SELECT u.id, u.email, u.password_hash, u.name, u.role, u.avatar_url, u.team_id, u.is_active,
             c.id as company_id, c.name as company_name, c.slug as company_slug, c.tier as company_tier
      FROM users u
      JOIN companies c ON c.id = u.company_id
      WHERE u.email = ${email}
    `);
    if (rows.length === 0) return jsonResponse({ success: false, error: "Invalid email or password" }, 400);
    const user = rows[0];
    if (!user.is_active) return jsonResponse({ success: false, error: "Account disabled" }, 403);

    const valid = await Bun.password.verify(password, user.password_hash);
    if (!valid) return jsonResponse({ success: false, error: "Invalid email or password" }, 401);

    const token = crypto.randomUUID() + crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();
    await db(sql`INSERT INTO sessions (id, user_id, token, expires_at) VALUES (${crypto.randomUUID()}, ${user.id}, ${token}, ${expiresAt})`);
    await db(sql`UPDATE users SET last_login_at = datetime('now') WHERE id = ${user.id}`);

    return jsonResponse(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.company_id,
          companyName: user.company_name,
          companySlug: user.company_slug,
          companyTier: user.company_tier,
          avatarUrl: user.avatar_url || "",
          teamId: user.team_id,
        },
      },
      200,
      { "Set-Cookie": makeSetCookie(SESSION_COOKIE, token, SESSION_MAX_AGE) },
    );
  } catch (e) {
    console.error("login error:", e);
    return jsonResponse({ success: false, error: "Login failed" }, 500);
  }
}

// ─── POST /api/register ────────────────────────────────────────────────────────
export async function handleRegister(req: Request): Promise<Response> {
  try {
    const ip = getClientIp(req);
    if (!loginLimiter.check(ip)) return jsonResponse({ success: false, error: "Too many registration attempts." }, 429);

    const { email, password, name, companyName } = await req.json();
    if (!email || !password || !name || !companyName) return jsonResponse({ success: false, error: "All fields required" }, 400);
    if (!isValidEmail(email)) return jsonResponse({ success: false, error: "Invalid email format" }, 400);
    if (password.length < 6) return jsonResponse({ success: false, error: "Password must be at least 6 characters" }, 400);

    const existing = await db(sql`SELECT id FROM users WHERE email = ${email}`);
    if (existing.length > 0) return jsonResponse({ success: false, error: "Account already exists" }, 409);

    const companyId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    await db(sql`INSERT INTO companies (id, name, slug, tier) VALUES (${companyId}, ${companyName}, ${slug}, 'core')`);
    const passwordHash = await Bun.password.hash(password);
    await db(sql`INSERT INTO users (id, company_id, email, password_hash, name, role) VALUES (${userId}, ${companyId}, ${email}, ${passwordHash}, ${name}, 'admin')`);

    const token = crypto.randomUUID() + crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();
    await db(sql`INSERT INTO sessions (id, user_id, token, expires_at) VALUES (${crypto.randomUUID()}, ${userId}, ${token}, ${expiresAt})`);

    return jsonResponse(
      {
        success: true,
        user: {
          id: userId,
          email,
          name,
          role: "admin",
          companyId,
          companyName,
          companySlug: slug,
          companyTier: "core",
          avatarUrl: "",
          teamId: null,
        },
      },
      200,
      { "Set-Cookie": makeSetCookie(SESSION_COOKIE, token, SESSION_MAX_AGE) },
    );
  } catch (e) {
    console.error("register error:", e);
    return jsonResponse({ success: false, error: "Registration failed" }, 500);
  }
}

// ─── POST /api/logout ──────────────────────────────────────────────────────────
export async function handleLogout(req: Request): Promise<Response> {
  try {
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
      const cookies: Record<string, string> = {};
      cookieHeader.split(";").forEach((pair) => {
        const idx = pair.indexOf("=");
        if (idx > 0) {
          cookies[pair.substring(0, idx).trim()] = decodeURIComponent(pair.substring(idx + 1).trim());
        }
      });
      const token = cookies[SESSION_COOKIE];
      if (token) await db(sql`DELETE FROM sessions WHERE token = ${token}`);
    }
    return jsonResponse({ success: true }, 200, { "Set-Cookie": makeSetCookie(SESSION_COOKIE, "", 0) });
  } catch (e) {
    console.error("logout error:", e);
    return jsonResponse({ success: false }, 500);
  }
}

// ─── GET /api/session ──────────────────────────────────────────────────────────
export async function handleSession(req: Request): Promise<Response> {
  try {
    const cookieHeader = req.headers.get("cookie");
    if (!cookieHeader) return jsonResponse({ user: null });

    const cookies: Record<string, string> = {};
    cookieHeader.split(";").forEach((pair) => {
      const idx = pair.indexOf("=");
      if (idx > 0) {
        cookies[pair.substring(0, idx).trim()] = decodeURIComponent(pair.substring(idx + 1).trim());
      }
    });
    const token = cookies[SESSION_COOKIE];
    if (!token) return jsonResponse({ user: null });

    await db(sql`DELETE FROM sessions WHERE expires_at < datetime('now')`);
    const rows = await db(sql`
      SELECT u.id, u.email, u.name, u.role, u.avatar_url, u.team_id,
             c.id as company_id, c.name as company_name, c.slug as company_slug, c.tier as company_tier
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      JOIN companies c ON c.id = u.company_id
      WHERE s.token = ${token} AND s.expires_at > datetime('now')
    `);
    if (rows.length === 0) return jsonResponse({ user: null });

    const u = rows[0];
    return jsonResponse({
      user: {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        companyId: u.company_id,
        companyName: u.company_name,
        companySlug: u.company_slug,
        companyTier: u.company_tier,
        avatarUrl: u.avatar_url || "",
        teamId: u.team_id,
      },
    });
  } catch (e) {
    console.error("session error:", e);
    return jsonResponse({ user: null });
  }
}