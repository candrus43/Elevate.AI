// Production server for the built site. The TanStack Start build emits a portable
// fetch handler (dist/server/server.js) plus static client assets (dist/client);
// this wraps them in a Bun server on port 3000 — static files first, SSR for the
// rest. Run `bun run build` before starting. Restart it with `bun run publish`.
//
// Starting a new instance supersedes the old one: it frees the port no matter
// which user owns the current server (provisioning starts it as `engine`; a team
// member's `bun run publish` runs as their own user), so publish never collides
// with an already-running server. Every sandbox user has passwordless sudo, so
// the takeover works across user boundaries.
import handler from "./dist/server/server.js";

// ─── SQL injection-safe query helper ─────────────────────────

import { sql } from "./src/utils/sql";

async function db(query: string): Promise<any[]> {
  const result = await Bun.$`team-db ${query}`.text();
  return JSON.parse(result);
}

// ─── Rate limiter ────────────────────────────────────────────

function createRateLimiter(maxReq: number, windowMs: number) {
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

const loginLimiter = createRateLimiter(5, 60_000); // 5 attempts / IP / minute

// ─── JSON response helper with security headers ──────────────

function jsonResponse(data: unknown, status = 200, extraHeaders?: Record<string, string>): Response {
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

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Pinned, NOT read from the environment. The published preview URL
// (<label>.<PUBLIC_SITE_DOMAIN>) is reverse-proxied to 0.0.0.0:3000 inside the
// sandbox, so the default site MUST bind there. Bun auto-loads .env files, so
// honouring process.env.PORT/HOST would let a stray env var or a .env in the site
// dir silently move the site off :3000 (or onto loopback) and break the public URL.
const PORT = 3000;
const HOST = "0.0.0.0";
const CLIENT_DIR = `${import.meta.dir}/dist/client`;

// Free PORT regardless of which user owns the current listener. lsof runs under
// sudo so it can see (and the kill can signal) a process owned by another user;
// the loop waits for the socket to actually release before we bind.
const freePort =
  `for _ in $(seq 1 25); do ` +
  `pids=$(lsof -t -iTCP:${String(PORT)} -sTCP:LISTEN 2>/dev/null || true); ` +
  `if [ -z "$pids" ]; then exit 0; fi; ` +
  `kill $pids 2>/dev/null || true; sleep 0.2; ` +
  `done`;

// ─── Auth API helpers ──────────────────────────────────────

const SESSION_COOKIE = "elevateai_session";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60;

function makeSetCookie(name: string, value: string, maxAge: number): string {
  return `${name}=${encodeURIComponent(value)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
         req.headers.get("x-real-ip") ??
         "unknown";
}

async function handleLogin(req: Request): Promise<Response> {
  try {
    // Rate limiting
    const ip = getClientIp(req);
    if (!loginLimiter.check(ip)) {
      return jsonResponse({ success: false, error: "Too many login attempts. Please try again in one minute." }, 429);
    }

    const { email, password } = await req.json();
    if (!email || !password) {
      return jsonResponse({ success: false, error: "Email and password are required" }, 400);
    }
    if (!isValidEmail(email)) {
      return jsonResponse({ success: false, error: "Invalid email format" }, 400);
    }

    const rows = await db(sql`
      SELECT u.id, u.email, u.password_hash, u.name, u.role, u.avatar_url, u.team_id, u.is_active,
             c.id as company_id, c.name as company_name, c.slug as company_slug, c.tier as company_tier
      FROM users u JOIN companies c ON c.id = u.company_id
      WHERE u.email = ${email}
    `);

    if (rows.length === 0) {
      return jsonResponse({ success: false, error: "Invalid email or password" }, 400);
    }

    const user = rows[0];
    if (!user.is_active) {
      return jsonResponse({ success: false, error: "Account is disabled" }, 403);
    }

    const valid = await Bun.password.verify(password, user.password_hash);
    if (!valid) {
      return jsonResponse({ success: false, error: "Invalid email or password" }, 401);
    }

    const token = crypto.randomUUID() + crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();
    await db(sql`INSERT INTO sessions (id, user_id, token, expires_at) VALUES (${crypto.randomUUID()}, ${user.id}, ${token}, ${expiresAt})`);
    await db(sql`UPDATE users SET last_login_at = datetime('now') WHERE id = ${user.id}`);

    return jsonResponse({
      success: true,
      user: {
        id: user.id, email: user.email, name: user.name, role: user.role,
        companyId: user.company_id, companyName: user.company_name,
        companySlug: user.company_slug, companyTier: user.company_tier,
        avatarUrl: user.avatar_url || "", teamId: user.team_id,
      },
    }, 200, { "Set-Cookie": makeSetCookie(SESSION_COOKIE, token, SESSION_MAX_AGE) });
  } catch (e) {
    console.error("login error:", e);
    return jsonResponse({ success: false, error: "Login failed" }, 500);
  }
}

async function handleRegister(req: Request): Promise<Response> {
  try {
    // Rate limiting on registration too
    const ip = getClientIp(req);
    if (!loginLimiter.check(ip)) {
      return jsonResponse({ success: false, error: "Too many registration attempts. Please try again in one minute." }, 429);
    }

    const { email, password, name, companyName } = await req.json();
    if (!email || !password || !name || !companyName) {
      return jsonResponse({ success: false, error: "All fields are required" }, 400);
    }
    if (!isValidEmail(email)) {
      return jsonResponse({ success: false, error: "Invalid email format" }, 400);
    }
    if (password.length < 6) {
      return jsonResponse({ success: false, error: "Password must be at least 6 characters" }, 400);
    }

    const existing = await db(sql`SELECT id FROM users WHERE email = ${email}`);
    if (existing.length > 0) {
      return jsonResponse({ success: false, error: "An account with this email already exists" }, 409);
    }

    // Check for pending invitation — auto-join the inviting company
    const pendingInvite = await db(sql`
      SELECT i.*, c.name as company_name, c.slug as company_slug, c.tier
      FROM invitations i
      JOIN companies c ON c.id = i.company_id
      WHERE i.email = ${email} AND i.status = 'pending' AND i.expires_at > datetime('now')
      ORDER BY i.created_at DESC
      LIMIT 1
    `);

    let companyId: string;
    let resolvedCompanyName: string;
    let slug: string;
    let tier: string;
    let teamId: string | null = null;
    let role: string;
    let isInvited = false;

    if (pendingInvite.length > 0) {
      const inv = pendingInvite[0];
      companyId = inv.company_id;
      resolvedCompanyName = inv.company_name;
      slug = inv.company_slug;
      tier = inv.tier;
      teamId = inv.team_id;
      role = inv.role;
      isInvited = true;
    } else {
      companyId = crypto.randomUUID();
      resolvedCompanyName = companyName;
      slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      tier = "core";
      role = "admin";
      await db(sql`INSERT INTO companies (id, name, slug, tier) VALUES (${companyId}, ${resolvedCompanyName}, ${slug}, 'core')`);
    }

    const userId = crypto.randomUUID();
    const passwordHash = await Bun.password.hash(password);
    await db(sql`INSERT INTO users (id, company_id, email, password_hash, name, role, team_id) VALUES (${userId}, ${companyId}, ${email}, ${passwordHash}, ${name}, ${role}, ${teamId})`);

    // If invited, mark invitation as accepted
    if (isInvited && pendingInvite.length > 0) {
      await db(sql`UPDATE invitations SET status = 'accepted' WHERE id = ${pendingInvite[0].id}`);
    }

    const token = crypto.randomUUID() + crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();
    await db(sql`INSERT INTO sessions (id, user_id, token, expires_at) VALUES (${crypto.randomUUID()}, ${userId}, ${token}, ${expiresAt})`);

    return jsonResponse({
          success: true,
          user: {
            id: userId, email, name, role,
            companyId, companyName: resolvedCompanyName, companySlug: slug, companyTier: tier,
            avatarUrl: "", teamId,
          },
        }, 200, { "Set-Cookie": makeSetCookie(SESSION_COOKIE, token, SESSION_MAX_AGE) });
  } catch (e) {
    console.error("register error:", e);
    return jsonResponse({ success: false, error: "Registration failed" }, 500);
  }
}

async function handleLogout(req: Request): Promise<Response> {
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

async function handleSession(req: Request): Promise<Response> {
  try {
    const cookieHeader = req.headers.get("cookie");
    if (!cookieHeader) {
      return jsonResponse({ user: null });
    }

    const cookies: Record<string, string> = {};
    cookieHeader.split(";").forEach((pair) => {
      const idx = pair.indexOf("=");
      if (idx > 0) {
        cookies[pair.substring(0, idx).trim()] = decodeURIComponent(pair.substring(idx + 1).trim());
      }
    });

    const token = cookies[SESSION_COOKIE];
    if (!token) {
      return jsonResponse({ user: null });
    }

    await db(sql`DELETE FROM sessions WHERE expires_at < datetime('now')`);

    const rows = await db(sql`
      SELECT u.id, u.email, u.name, u.role, u.avatar_url, u.team_id,
             c.id as company_id, c.name as company_name, c.slug as company_slug, c.tier as company_tier
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      JOIN companies c ON c.id = u.company_id
      WHERE s.token = ${token} AND s.expires_at > datetime('now')
    `);

    if (rows.length === 0) {
      return jsonResponse({ user: null });
    }

    const u = rows[0];
    return jsonResponse({
      user: {
        id: u.id, email: u.email, name: u.name, role: u.role,
        companyId: u.company_id, companyName: u.company_name,
        companySlug: u.company_slug, companyTier: u.company_tier,
        avatarUrl: u.avatar_url || "", teamId: u.team_id,
      },
    });
  } catch (e) {
    console.error("session error:", e);
    return jsonResponse({ user: null });
  }
}

// ─── Auth helper ────────────────────────────────────────────

async function getAuthUser(req: Request): Promise<{ id: string; email: string; name: string; role: string; companyId: string; companyName: string; teamId: string | null } | null> {
  try {
    const cookieHeader = req.headers.get("cookie");
    if (!cookieHeader) return null;
    const cookies: Record<string, string> = {};
    cookieHeader.split(";").forEach((pair) => {
      const idx = pair.indexOf("=");
      if (idx > 0) {
        cookies[pair.substring(0, idx).trim()] = decodeURIComponent(pair.substring(idx + 1).trim());
      }
    });
    const token = cookies[SESSION_COOKIE];
    if (!token) return null;
    const rows = await db(sql`
      SELECT u.id, u.email, u.name, u.role, u.company_id, c.name as company_name, u.team_id
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      JOIN companies c ON c.id = u.company_id
      WHERE s.token = ${token} AND s.expires_at > datetime('now')
    `);
    if (rows.length === 0) return null;
    const u = rows[0];
    return { id: u.id, email: u.email, name: u.name, role: u.role, companyId: u.company_id, companyName: u.company_name, teamId: u.team_id };
  } catch { return null; }
}

// ─── Team Invitation API ────────────────────────────────────

async function handleCreateInvite(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    // Only admin and manager can invite
    if (user.role !== "admin" && user.role !== "manager") {
      return jsonResponse({ error: "Only admins and managers can invite members" }, 403);
    }

    const { email, role, team_id } = await req.json();
    if (!email || !role) {
      return jsonResponse({ error: "Email and role are required" }, 400);
    }
    if (!isValidEmail(email)) {
      return jsonResponse({ error: "Invalid email format" }, 400);
    }
    const validRoles = ["admin", "manager", "rep"];
    if (!validRoles.includes(role)) {
      return jsonResponse({ error: "Invalid role. Must be admin, manager, or rep" }, 400);
    }

    // Check if user is already a member of this company
    const existingMember = await db(sql`
      SELECT id FROM users WHERE email = ${email} AND company_id = ${user.companyId}
    `);
    if (existingMember.length > 0) {
      return jsonResponse({ error: "This person is already a team member" }, 409);
    }

    // Check if user exists in another company (they'd need to accept invite to switch)
    const existingUser = await db(sql`SELECT id, company_id FROM users WHERE email = ${email}`);

    // Check for existing pending invitation for this email + company
    const existingInvite = await db(sql`
      SELECT id FROM invitations WHERE email = ${email} AND company_id = ${user.companyId} AND status = 'pending'
    `);
    if (existingInvite.length > 0) {
      return jsonResponse({ error: "A pending invitation already exists for this email" }, 409);
    }

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

async function handleListInvites(req: Request): Promise<Response> {
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

async function handleCancelInvite(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (user.role !== "admin" && user.role !== "manager") {
      return jsonResponse({ error: "Only admins and managers can cancel invitations" }, 403);
    }

    const url = new URL(req.url);
    const inviteId = url.pathname.split("/").pop();
    if (!inviteId) return jsonResponse({ error: "Invitation ID is required" }, 400);

    await db(sql`
      UPDATE invitations SET status = 'cancelled'
      WHERE id = ${inviteId} AND company_id = ${user.companyId} AND status = 'pending'
    `);

    return jsonResponse({ success: true });
  } catch (e) {
    console.error("cancel invite error:", e);
    return jsonResponse({ error: "Failed to cancel invitation" }, 500);
  }
}

// ─── Server ─────────────────────────────────────────────────

// Take over the port, re-freeing and retrying if another publish grabbed it in the
// gap between freeing and binding (last publish wins). Bun.serve throws EADDRINUSE
// synchronously, so without this a raced publish would die while the shell already
// reported success.
for (let attempt = 1; ; attempt++) {
  await Bun.$`sudo sh -c ${freePort}`.quiet().nothrow();
  try {
    Bun.serve({
      port: PORT,
      hostname: HOST,
      async fetch(req) {
        const { pathname } = new URL(req.url);

        // ── API Routes ──────────────────────────────────────
        if (pathname === "/api/login" && req.method === "POST") return handleLogin(req);
        if (pathname === "/api/register" && req.method === "POST") return handleRegister(req);
        if (pathname === "/api/logout" && req.method === "POST") return handleLogout(req);
        if (pathname === "/api/session" && req.method === "GET") return handleSession(req);

        // ── Team Invitation API ─────────────────────────────
        if (pathname === "/api/team/invite" && req.method === "POST") return handleCreateInvite(req);
        if (pathname === "/api/team/invites" && req.method === "GET") return handleListInvites(req);
        if (pathname.startsWith("/api/team/invite/") && req.method === "DELETE") return handleCancelInvite(req);

        // ── Static files ────────────────────────────────────
        if (pathname !== "/") {
          const file = Bun.file(CLIENT_DIR + pathname);
          if (await file.exists()) return new Response(file);
        }

        // ── TanStack Start SSR ──────────────────────────────
        return (
          handler as { fetch: (r: Request) => Response | Promise<Response> }
        ).fetch(req);
      },
    });
    break;
  } catch (err) {
    if (attempt >= 10) throw err;
    await Bun.sleep(200);
  }
}

console.log(`team-site serving on http://${HOST}:${String(PORT)}`);