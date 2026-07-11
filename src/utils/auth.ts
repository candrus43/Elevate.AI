import { createServerFn } from "@tanstack/react-start";

// ─── Types ─────────────────────────────────────────────────

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: "admin" | "manager" | "rep";
  companyId: string;
  companyName: string;
  companySlug: string;
  companyTier: string;
  avatarUrl: string;
  teamId: string | null;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: UserSession;
}

// ─── Cookie helpers ─────────────────────────────────────

const SESSION_COOKIE = "elevateai_session";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

function parseCookies(header: string): Record<string, string> {
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

function makeSetCookie(name: string, value: string, maxAge: number): string {
  return `${name}=${encodeURIComponent(value)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

// ─── Database helper ────────────────────────────────────

async function db(query: string): Promise<any[]> {
  const result = await Bun.$`team-db ${query}`.text();
  return JSON.parse(result);
}

// ─── Auth Server Functions ───────────────────────────────

/** Get the current user from the session cookie. Safe to call from any component. */
export const getSession = createServerFn({ method: "GET" })
  .handler(async ({ request }: { request: Request }) => {
    try {
      const cookieHeader = request.headers.get("cookie");
      if (!cookieHeader) return { user: null } as { user: UserSession | null };

      const cookies = parseCookies(cookieHeader);
      const token = cookies[SESSION_COOKIE];
      if (!token) return { user: null } as { user: UserSession | null };

      // Clean expired sessions
      await db(`DELETE FROM sessions WHERE expires_at < datetime('now')`);

      const rows = await db(
        `SELECT u.id, u.email, u.name, u.role, u.avatar_url, u.team_id,
                c.id as company_id, c.name as company_name, c.slug as company_slug, c.tier as company_tier
         FROM sessions s
         JOIN users u ON u.id = s.user_id
         JOIN companies c ON c.id = u.company_id
         WHERE s.token = '${token.replace(/'/g, "''")}' AND s.expires_at > datetime('now')`
      );

      if (rows.length === 0) return { user: null } as { user: UserSession | null };

      const u = rows[0];
      return {
        user: {
          id: u.id, email: u.email, name: u.name, role: u.role,
          companyId: u.company_id, companyName: u.company_name,
          companySlug: u.company_slug, companyTier: u.company_tier,
          avatarUrl: u.avatar_url || "", teamId: u.team_id,
        },
      } as { user: UserSession };
    } catch (e) {
      console.error("getSession error:", e);
      return { user: null } as { user: UserSession | null };
    }
  });

export const register = createServerFn({ method: "POST" })
  .validator((d: unknown) => d as { email: string; password: string; name: string; companyName: string })
  .handler(async ({ data, response }: { data: { email: string; password: string; name: string; companyName: string }; response: Response }) => {
    try {
      const { email, password, name, companyName } = data;

      if (!email || !password || !name || !companyName) {
        return { success: false, error: "All fields are required" } as AuthResult;
      }
      if (password.length < 6) {
        return { success: false, error: "Password must be at least 6 characters" } as AuthResult;
      }

      const existing = await db(`SELECT id FROM users WHERE email = '${email.replace(/'/g, "''")}'`);
      if (existing.length > 0) {
        return { success: false, error: "An account with this email already exists" } as AuthResult;
      }

      const companyId = crypto.randomUUID();
      const userId = crypto.randomUUID();
      const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

      await db(
        `INSERT INTO companies (id, name, slug, tier) VALUES ('${companyId}', '${companyName.replace(/'/g, "''")}', '${slug}', 'core')`
      );

      const passwordHash = await Bun.password.hash(password);

      await db(
        `INSERT INTO users (id, company_id, email, password_hash, name, role) VALUES ('${userId}', '${companyId}', '${email.replace(/'/g, "''")}', '${passwordHash}', '${name.replace(/'/g, "''")}', 'admin')`
      );

      const token = crypto.randomUUID() + crypto.randomUUID();
      const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();
      await db(
        `INSERT INTO sessions (id, user_id, token, expires_at) VALUES ('${crypto.randomUUID()}', '${userId}', '${token}', '${expiresAt}')`
      );
      await db(`UPDATE users SET last_login_at = datetime('now') WHERE id = '${userId}'`);

      response.headers.set("Set-Cookie", makeSetCookie(SESSION_COOKIE, token, SESSION_MAX_AGE));

      return {
        success: true,
        user: {
          id: userId, email, name, role: "admin" as const,
          companyId, companyName, companySlug: slug, companyTier: "core",
          avatarUrl: "", teamId: null,
        },
      } as AuthResult;
    } catch (e) {
      console.error("register error:", e);
      return { success: false, error: "Registration failed. Please try again." } as AuthResult;
    }
  });

export const login = createServerFn({ method: "POST" })
  .validator((d: unknown) => d as { email: string; password: string })
  .handler(async ({ data, response }: { data: { email: string; password: string }; response: Response }) => {
    try {
      const { email, password } = data;

      if (!email || !password) {
        return { success: false, error: "Email and password are required" } as AuthResult;
      }

      const rows = await db(
        `SELECT u.id, u.email, u.password_hash, u.name, u.role, u.avatar_url, u.team_id, u.is_active,
                c.id as company_id, c.name as company_name, c.slug as company_slug, c.tier as company_tier
         FROM users u JOIN companies c ON c.id = u.company_id
         WHERE u.email = '${email.replace(/'/g, "''")}'`
      );
      if (rows.length === 0) return { success: false, error: "Invalid email or password" } as AuthResult;

      const user = rows[0];
      if (!user.is_active) return { success: false, error: "Account is disabled" } as AuthResult;

      const valid = await Bun.password.verify(password, user.password_hash);
      if (!valid) return { success: false, error: "Invalid email or password" } as AuthResult;

      const token = crypto.randomUUID() + crypto.randomUUID();
      const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();
      await db(`INSERT INTO sessions (id, user_id, token, expires_at) VALUES ('${crypto.randomUUID()}', '${user.id}', '${token}', '${expiresAt}')`);
      await db(`UPDATE users SET last_login_at = datetime('now') WHERE id = '${user.id}'`);

      response.headers.set("Set-Cookie", makeSetCookie(SESSION_COOKIE, token, SESSION_MAX_AGE));

      return {
        success: true,
        user: {
          id: user.id, email: user.email, name: user.name, role: user.role,
          companyId: user.company_id, companyName: user.company_name,
          companySlug: user.company_slug, companyTier: user.company_tier,
          avatarUrl: user.avatar_url || "", teamId: user.team_id,
        },
      } as AuthResult;
    } catch (e) {
      console.error("login error:", e);
      return { success: false, error: "Login failed. Please try again." } as AuthResult;
    }
  });

export const logout = createServerFn({ method: "POST" })
  .handler(async ({ request, response }: { request: Request; response: Response }) => {
    try {
      const cookieHeader = request.headers.get("cookie");
      if (cookieHeader) {
        const cookies = parseCookies(cookieHeader);
        const token = cookies[SESSION_COOKIE];
        if (token) await db(`DELETE FROM sessions WHERE token = '${token.replace(/'/g, "''")}'`);
      }
      response.headers.set("Set-Cookie", makeSetCookie(SESSION_COOKIE, "", 0));
      return { success: true };
    } catch (e) {
      console.error("logout error:", e);
      return { success: false };
    }
  });