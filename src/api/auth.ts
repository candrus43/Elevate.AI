/**
 * Auth API handlers: login, register, logout, session.
 */

import { sql } from "~/utils/sql";
import { isDemoCompany } from "~/utils/demo-company";
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
import { seedDemoData } from "~/seed-demo";

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
          isDemo: isDemoCompany({ slug: user.company_slug, name: user.company_name }),
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

    // demo_mode defaults to 1 in the schema; a real signup is never demo data.
    await db(sql`INSERT INTO companies (id, name, slug, tier, demo_mode) VALUES (${companyId}, ${companyName}, ${slug}, 'core', 0)`);
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
          isDemo: isDemoCompany({ slug, name: companyName }),
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
    const isDemo = isDemoCompany({ slug: u.company_slug, name: u.company_name });
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
        isDemo,
      },
    });
  } catch (e) {
    console.error("session error:", e);
    return jsonResponse({ user: null });
  }
}

// ─── POST /api/demo-login ──────────────────────────────────────────────────────
/**
 * Demo login — creates the demo company and user on first call, then creates
 * a session. Automatically seeds demo data on first login.
 * Credentials: demo@elevateai.com / demo123
 */
export async function handleDemoLogin(req: Request): Promise<Response> {
  try {
    const ip = getClientIp(req);
    if (!loginLimiter.check(ip)) {
      return jsonResponse({ success: false, error: "Too many login attempts. Try again in one minute." }, 429);
    }

    const demoEmail = "demo@elevateai.com";
    const demoPassword = "demo123";

    // Check if demo user already exists
    const existing = await db(sql`
      SELECT u.id, u.email, u.password_hash, u.name, u.role, u.avatar_url, u.team_id, u.is_active,
             c.id as company_id, c.name as company_name, c.slug as company_slug, c.tier as company_tier
      FROM users u
      JOIN companies c ON c.id = u.company_id
      WHERE u.email = ${demoEmail}
    `);

    let user: any;
    let isNew = false;

    if (existing.length > 0) {
      user = existing[0];
      // Verify password
      const valid = await Bun.password.verify(demoPassword, user.password_hash);
      if (!valid) return jsonResponse({ success: false, error: "Demo account password mismatch" }, 500);
    } else {
      // Create demo company + user
      isNew = true;
      const companyId = crypto.randomUUID();
      const userId = crypto.randomUUID();
      const passwordHash = await Bun.password.hash(demoPassword);

      await db(sql`
        INSERT INTO companies (id, name, slug, tier, demo_mode)
        VALUES (${companyId}, ${'ElevateAI Demo'}, ${'elevateai-demo'}, ${'enterprise'}, 1)
      `);

      // Create teams
      const sdrTeamId = crypto.randomUUID();
      const aeTeamId = crypto.randomUUID();
      await db(sql`INSERT INTO teams (id, company_id, name) VALUES (${sdrTeamId}, ${companyId}, ${'SDR Team'})`);
      await db(sql`INSERT INTO teams (id, company_id, name) VALUES (${aeTeamId}, ${companyId}, ${'AE Team'})`);

      // Create admin user
      await db(sql`
        INSERT INTO users (id, company_id, email, password_hash, name, role, last_login_at)
        VALUES (${userId}, ${companyId}, ${demoEmail}, ${passwordHash}, ${'Alex Morgan'}, ${'admin'}, datetime('now'))
      `);

      // Create manager + rep users
      const managerId = crypto.randomUUID();
      await db(sql`
        INSERT INTO users (id, company_id, email, password_hash, name, role, team_id, last_login_at)
        VALUES (${managerId}, ${companyId}, ${'manager@elevateai.com'}, ${passwordHash}, ${'Sarah Chen'}, ${'manager'}, ${sdrTeamId}, datetime('now'))
      `);

      const rep1Id = crypto.randomUUID();
      await db(sql`
        INSERT INTO users (id, company_id, email, password_hash, name, role, team_id, last_login_at)
        VALUES (${rep1Id}, ${companyId}, ${'jordan@elevateai.com'}, ${passwordHash}, ${'Jordan Lee'}, ${'rep'}, ${sdrTeamId}, datetime('now'))
      `);

      const rep2Id = crypto.randomUUID();
      await db(sql`
        INSERT INTO users (id, company_id, email, password_hash, name, role, team_id, last_login_at)
        VALUES (${rep2Id}, ${companyId}, ${'taylor@elevateai.com'}, ${passwordHash}, ${'Taylor Brooks'}, ${'rep'}, ${sdrTeamId}, datetime('now'))
      `);

      const rep3Id = crypto.randomUUID();
      await db(sql`
        INSERT INTO users (id, company_id, email, password_hash, name, role, team_id, last_login_at)
        VALUES (${rep3Id}, ${companyId}, ${'drew@elevateai.com'}, ${passwordHash}, ${'Drew Patel'}, ${'rep'}, ${aeTeamId}, datetime('now'))
      `);

      user = {
        id: userId,
        email: demoEmail,
        name: "Alex Morgan",
        role: "admin",
        company_id: companyId,
        company_name: "ElevateAI Demo",
        company_slug: "elevateai-demo",
        company_tier: "enterprise",
        avatar_url: "",
        team_id: null,
      };
    }

    // Create session
    const token = crypto.randomUUID() + crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();
    await db(sql`INSERT INTO sessions (id, user_id, token, expires_at) VALUES (${crypto.randomUUID()}, ${user.id}, ${token}, ${expiresAt})`);
    await db(sql`UPDATE users SET last_login_at = datetime('now') WHERE id = ${user.id}`);

    // Seed demo data on first login (async — don't block the response)
    let seeded = false;
    if (isNew) {
      seedDemoData(user.company_id).then((result) => {
        if (result.success) {
          console.log("✅ Demo data seeded automatically on first login");
        } else {
          console.error("❌ Demo data seeding failed:", result.error);
        }
      }).catch((err) => {
        console.error("❌ Demo data seeding error:", err);
      });
      seeded = true;
    }

    return jsonResponse(
      {
        success: true,
        demo: true,
        seeded,
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
          isDemo: isDemoCompany({ slug: user.company_slug, name: user.company_name }),
        },
      },
      200,
      { "Set-Cookie": makeSetCookie(SESSION_COOKIE, token, SESSION_MAX_AGE) },
    );
  } catch (e) {
    console.error("demo login error:", e);
    return jsonResponse({ success: false, error: "Demo login failed" }, 500);
  }
}

// ─── POST /api/seed-demo ───────────────────────────────────────────────────────
/**
 * Trigger demo data seeding for the authenticated user's company.
 * Returns seeding stats or an error if already seeded.
 */
export async function handleSeedDemo(req: Request): Promise<Response> {
  try {
    const cookieHeader = req.headers.get("cookie");
    if (!cookieHeader) return jsonResponse({ error: "Not authenticated" }, 401);

    const cookies: Record<string, string> = {};
    cookieHeader.split(";").forEach((pair) => {
      const idx = pair.indexOf("=");
      if (idx > 0) {
        cookies[pair.substring(0, idx).trim()] = decodeURIComponent(pair.substring(idx + 1).trim());
      }
    });
    const token = cookies[SESSION_COOKIE];
    if (!token) return jsonResponse({ error: "Not authenticated" }, 401);

    const rows = await db(sql`
      SELECT u.company_id, c.name as company_name
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      JOIN companies c ON c.id = u.company_id
      WHERE s.token = ${token} AND s.expires_at > datetime('now')
    `);
    if (rows.length === 0) return jsonResponse({ error: "Session expired" }, 401);

    const { company_id, company_name } = rows[0];

    // Check if already seeded (has calls)
    const existingCalls = await db(sql`
      SELECT id FROM calls WHERE company_id = ${company_id} LIMIT 1
    `);
    if (existingCalls.length > 0) {
      return jsonResponse({
        success: true,
        message: "Demo data already seeded for this company.",
        alreadySeeded: true,
      });
    }

    const result = await seedDemoData(company_id);
    if (result.success) {
      return jsonResponse({
        success: true,
        message: "Demo data seeded successfully!",
        companyName: company_name,
        stats: result.stats,
      });
    } else {
      return jsonResponse({ success: false, error: result.error || "Seeding failed" }, 500);
    }
  } catch (e) {
    console.error("seed demo error:", e);
    return jsonResponse({ error: "Failed to seed demo data" }, 500);
  }
}