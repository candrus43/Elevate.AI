/**
 * Shared middleware and utilities for the API layer.
 * All API modules import from here for common functions.
 */

import { sql } from "~/utils/sql";

// ─── Database helper ──────────────────────────────────────────────────────────
export async function db(query: string): Promise<any[]> {
  const result = await Bun.$`team-db ${query}`.text();
  return JSON.parse(result);
}

// ─── Constants ─────────────────────────────────────────────────────────────────
export const SESSION_COOKIE = "elevateai_session";
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60;
export const PORT = 3000;
export const HOST = "0.0.0.0";
export const CLIENT_DIR = `${import.meta.dir}/../dist/client`;
export const UPLOADS_DIR = `${import.meta.dir}/../uploads`;

// ─── Response helpers ──────────────────────────────────────────────────────────
export function jsonResponse(data: unknown, status = 200, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      ...extraHeaders,
    },
  });
}

export function makeSetCookie(name: string, value: string, maxAge: number): string {
  return `${name}=${encodeURIComponent(value)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

// ─── Validation helpers ────────────────────────────────────────────────────────
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
}

// ─── Cookie parsing ────────────────────────────────────────────────────────────
export function parseCookies(header: string): Record<string, string> {
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

// ─── Rate limiter ──────────────────────────────────────────────────────────────
export function createRateLimiter(maxReq: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  const timer = setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [key, timestamps] of hits) {
      const recent = timestamps.filter((t) => t > cutoff);
      if (recent.length === 0) hits.delete(key);
      else hits.set(key, recent);
    }
  }, 60_000);
  if (timer.unref) timer.unref();
  return {
    check(key: string): boolean {
      const cutoff = Date.now() - windowMs;
      const timestamps = hits.get(key) ?? [];
      const recent = timestamps.filter((t) => t > cutoff);
      recent.push(Date.now());
      hits.set(key, recent);
      return recent.length <= maxReq;
    },
  };
}

export const loginLimiter = createRateLimiter(5, 60_000);

// ─── Auth user retrieval ───────────────────────────────────────────────────────
export async function getAuthUser(req: Request): Promise<AuthUser | null> {
  try {
    const cookieHeader = req.headers.get("cookie");
    if (!cookieHeader) return null;
    const cookies = parseCookies(cookieHeader);
    const token = cookies[SESSION_COOKIE];
    if (!token) return null;
    const rows = await db(sql`
      SELECT u.id, u.email, u.name, u.role, u.company_id,
             c.name as company_name, u.team_id
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      JOIN companies c ON c.id = u.company_id
      WHERE s.token = ${token} AND s.expires_at > datetime('now')
    `);
    if (rows.length === 0) return null;
    const u = rows[0];
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      companyId: u.company_id,
      companyName: u.company_name,
      teamId: u.team_id,
    };
  } catch {
    return null;
  }
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  companyId: string;
  companyName: string;
  teamId: string | null;
}

// ─── Onboarding / Live Data Access Check ───────────────────────────────────────
/**
 * Check if a user can access live data. Returns null if allowed, or an error
 * Response (403) if blocked by onboarding or demo mode.
 * Handlers call this when they need to enforce live-data restrictions.
 */
export async function requireLiveDataAccess(user: AuthUser): Promise<Response | null> {
  try {
    const rows = await db(sql`
      SELECT u.demo_mode, u.onboarding_completed, c.demo_mode as company_demo_mode
      FROM users u
      JOIN companies c ON c.id = u.company_id
      WHERE u.id = ${user.id} AND u.company_id = ${user.companyId}
      LIMIT 1
    `);
    if (rows.length === 0) return jsonResponse({ error: "User not found" }, 404);

    const u = rows[0];
    if (u.company_demo_mode === 1) {
      return jsonResponse({ error: "Company is in demo mode. Live data access requires switching to live mode." }, 403);
    }
    if (u.onboarding_completed === 0) {
      return jsonResponse({ error: "Onboarding not completed. Please complete onboarding to access live data." }, 403);
    }
    if (u.demo_mode === 1) {
      return jsonResponse({ error: "User is in demo mode. Enable live mode to access live data." }, 403);
    }
    return null; // Allowed
  } catch (e) {
    console.error("requireLiveDataAccess error:", e);
    return jsonResponse({ error: "Failed to verify data access permissions" }, 500);
  }
}