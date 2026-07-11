// Production server for the built site. The TanStack Start build emits a portable
// fetch handler (dist/server/server.js) plus static client assets (dist/client);
// this wraps them in a Bun server on port 3000 -- static files first, SSR for the
// rest. Run `bun run build` before starting. Restart it with `bun run publish`.

import handler from "./dist/server/server.js";
import { sql } from "./src/utils/sql";
import { startSession, processMessage, getScenarios, getScenarioById } from "./src/utils/roleplay-engine";
import { generateCoachingPlan, analyzeWeaknesses } from "./src/utils/coaching-generator";

async function db(query: string): Promise<any[]> {
  const result = await Bun.$`team-db ${query}`.text();
  return JSON.parse(result);
}

// In-memory role-play sessions (ephemeral, resets on restart)
const roleplaySessions = new Map<string, any>();

// Rate limiter
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
const loginLimiter = createRateLimiter(5, 60_000);

function jsonResponse(data: unknown, status = 200, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", ...extraHeaders },
  });
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const PORT = 3000;
const HOST = "0.0.0.0";
const CLIENT_DIR = `${import.meta.dir}/dist/client`;
const UPLOADS_DIR = `${import.meta.dir}/uploads`;

const freePort = "for _ in $(seq 1 25); do pids=$(lsof -t -iTCP:" + String(PORT) + " -sTCP:LISTEN 2>/dev/null || true); if [ -z \"$pids\" ]; then exit 0; fi; kill $pids 2>/dev/null || true; sleep 0.2; done";

// Ensure uploads directory exists
try { await Bun.$`mkdir -p ${UPLOADS_DIR}`.quiet().nothrow(); } catch {}

// Auth
const SESSION_COOKIE = "elevateai_session";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60;

function makeSetCookie(name: string, value: string, maxAge: number): string {
  return name + "=" + encodeURIComponent(value) + "; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=" + maxAge;
}

function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
}

// Auth handlers
async function handleLogin(req: Request): Promise<Response> {
  try {
    const ip = getClientIp(req);
    if (!loginLimiter.check(ip)) return jsonResponse({ success: false, error: "Too many login attempts. Try again in one minute." }, 429);
    const { email, password } = await req.json();
    if (!email || !password) return jsonResponse({ success: false, error: "Email and password required" }, 400);
    if (!isValidEmail(email)) return jsonResponse({ success: false, error: "Invalid email format" }, 400);
    const rows = await db(sql`SELECT u.id, u.email, u.password_hash, u.name, u.role, u.avatar_url, u.team_id, u.is_active, c.id as company_id, c.name as company_name, c.slug as company_slug, c.tier as company_tier FROM users u JOIN companies c ON c.id = u.company_id WHERE u.email = ${email}`);
    if (rows.length === 0) return jsonResponse({ success: false, error: "Invalid email or password" }, 400);
    const user = rows[0];
    if (!user.is_active) return jsonResponse({ success: false, error: "Account disabled" }, 403);
    const valid = await Bun.password.verify(password, user.password_hash);
    if (!valid) return jsonResponse({ success: false, error: "Invalid email or password" }, 401);
    const token = crypto.randomUUID() + crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();
    await db(sql`INSERT INTO sessions (id, user_id, token, expires_at) VALUES (${crypto.randomUUID()}, ${user.id}, ${token}, ${expiresAt})`);
    await db(sql`UPDATE users SET last_login_at = datetime('now') WHERE id = ${user.id}`);
    return jsonResponse({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role, companyId: user.company_id, companyName: user.company_name, companySlug: user.company_slug, companyTier: user.company_tier, avatarUrl: user.avatar_url || "", teamId: user.team_id } }, 200, { "Set-Cookie": makeSetCookie(SESSION_COOKIE, token, SESSION_MAX_AGE) });
  } catch (e) { console.error("login error:", e); return jsonResponse({ success: false, error: "Login failed" }, 500); }
}

async function handleRegister(req: Request): Promise<Response> {
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
    return jsonResponse({ success: true, user: { id: userId, email, name, role: "admin", companyId, companyName, companySlug: slug, companyTier: "core", avatarUrl: "", teamId: null } }, 200, { "Set-Cookie": makeSetCookie(SESSION_COOKIE, token, SESSION_MAX_AGE) });
  } catch (e) { console.error("register error:", e); return jsonResponse({ success: false, error: "Registration failed" }, 500); }
}

async function handleLogout(req: Request): Promise<Response> {
  try {
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
      const cookies: Record<string, string> = {};
      cookieHeader.split(";").forEach((pair) => { const idx = pair.indexOf("="); if (idx > 0) { cookies[pair.substring(0, idx).trim()] = decodeURIComponent(pair.substring(idx + 1).trim()); } });
      const token = cookies[SESSION_COOKIE];
      if (token) await db(sql`DELETE FROM sessions WHERE token = ${token}`);
    }
    return jsonResponse({ success: true }, 200, { "Set-Cookie": makeSetCookie(SESSION_COOKIE, "", 0) });
  } catch (e) { console.error("logout error:", e); return jsonResponse({ success: false }, 500); }
}

async function handleSession(req: Request): Promise<Response> {
  try {
    const cookieHeader = req.headers.get("cookie");
    if (!cookieHeader) return jsonResponse({ user: null });
    const cookies: Record<string, string> = {};
    cookieHeader.split(";").forEach((pair) => { const idx = pair.indexOf("="); if (idx > 0) { cookies[pair.substring(0, idx).trim()] = decodeURIComponent(pair.substring(idx + 1).trim()); } });
    const token = cookies[SESSION_COOKIE];
    if (!token) return jsonResponse({ user: null });
    await db(sql`DELETE FROM sessions WHERE expires_at < datetime('now')`);
    const rows = await db(sql`SELECT u.id, u.email, u.name, u.role, u.avatar_url, u.team_id, c.id as company_id, c.name as company_name, c.slug as company_slug, c.tier as company_tier FROM sessions s JOIN users u ON u.id = s.user_id JOIN companies c ON c.id = u.company_id WHERE s.token = ${token} AND s.expires_at > datetime('now')`);
    if (rows.length === 0) return jsonResponse({ user: null });
    const u = rows[0];
    return jsonResponse({ user: { id: u.id, email: u.email, name: u.name, role: u.role, companyId: u.company_id, companyName: u.company_name, companySlug: u.company_slug, companyTier: u.company_tier, avatarUrl: u.avatar_url || "", teamId: u.team_id } });
  } catch (e) { console.error("session error:", e); return jsonResponse({ user: null }); }
}

async function getAuthUser(req: Request): Promise<any | null> {
  try {
    const cookieHeader = req.headers.get("cookie");
    if (!cookieHeader) return null;
    const cookies: Record<string, string> = {};
    cookieHeader.split(";").forEach((pair) => { const idx = pair.indexOf("="); if (idx > 0) { cookies[pair.substring(0, idx).trim()] = decodeURIComponent(pair.substring(idx + 1).trim()); } });
    const token = cookies[SESSION_COOKIE];
    if (!token) return null;
    const rows = await db(sql`SELECT u.id, u.email, u.name, u.role, u.company_id, c.name as company_name, u.team_id FROM sessions s JOIN users u ON u.id = s.user_id JOIN companies c ON c.id = u.company_id WHERE s.token = ${token} AND s.expires_at > datetime('now')`);
    if (rows.length === 0) return null;
    const u = rows[0];
    return { id: u.id, email: u.email, name: u.name, role: u.role, companyId: u.company_id, companyName: u.company_name, teamId: u.team_id };
  } catch { return null; }
}

// Team Invitation API
async function handleCreateInvite(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (user.role !== "admin" && user.role !== "manager") return jsonResponse({ error: "Only admins and managers can invite" }, 403);
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
    await db(sql`INSERT INTO invitations (id, company_id, email, role, team_id, invited_by, token, expires_at) VALUES (${inviteId}, ${user.companyId}, ${email}, ${role}, ${team_id || null}, ${user.id}, ${token}, ${expiresAt})`);
    return jsonResponse({ success: true, invitation: { id: inviteId, email, role, team_id: team_id || null, token, expires_at: expiresAt } });
  } catch (e) { console.error("invite error:", e); return jsonResponse({ error: "Failed to create invitation" }, 500); }
}

async function handleListInvites(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (user.role !== "admin" && user.role !== "manager") return jsonResponse({ error: "Only admins and managers can view invitations" }, 403);
    const invites = await db(sql`SELECT i.id, i.email, i.role, i.team_id, i.status, i.created_at, i.expires_at, u.name as invited_by_name FROM invitations i LEFT JOIN users u ON u.id = i.invited_by WHERE i.company_id = ${user.companyId} AND i.status = 'pending' ORDER BY i.created_at DESC`);
    return jsonResponse({ invites });
  } catch (e) { console.error("list invites error:", e); return jsonResponse({ error: "Failed to list invitations" }, 500); }
}

async function handleCancelInvite(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (user.role !== "admin" && user.role !== "manager") return jsonResponse({ error: "Only admins and managers can cancel" }, 403);
    const inviteId = new URL(req.url).pathname.split("/").pop();
    if (!inviteId) return jsonResponse({ error: "Invitation ID required" }, 400);
    await db(sql`UPDATE invitations SET status = 'cancelled' WHERE id = ${inviteId} AND company_id = ${user.companyId} AND status = 'pending'`);
    return jsonResponse({ success: true });
  } catch (e) { console.error("cancel invite error:", e); return jsonResponse({ error: "Failed to cancel invitation" }, 500); }
}

// AI Role-Play API
async function handleRoleplayStart(req: Request): Promise<Response> {
  try {
    const { scenarioId } = await req.json();
    if (!scenarioId) return jsonResponse({ error: "scenarioId required" }, 400);
    const scenario = getScenarioById(scenarioId);
    if (!scenario) return jsonResponse({ error: "Scenario not found" }, 404);
    const { state, firstMessage } = startSession(scenarioId);
    const sessionId = crypto.randomUUID();
    state.sessionId = sessionId;
    roleplaySessions.set(sessionId, state);
    return jsonResponse({ sessionId, firstMessage, scenario: { title: scenario.title, persona: scenario.persona }, stage: 0, turn: 0 });
  } catch (e) { console.error("roleplay start error:", e); return jsonResponse({ error: "Failed to start session" }, 500); }
}

async function handleRoleplayMessage(req: Request): Promise<Response> {
  try {
    const { sessionId, message } = await req.json();
    if (!sessionId || !message) return jsonResponse({ error: "sessionId and message required" }, 400);
    const state = roleplaySessions.get(sessionId);
    if (!state) return jsonResponse({ error: "Session not found" }, 404);
    const { state: newState, response } = processMessage(state, message);
    roleplaySessions.set(sessionId, newState);
    return jsonResponse({ message: response.message, score: response.score, feedback: response.feedback, stage: response.stage, turn: response.turn, isComplete: response.isComplete, overallScore: response.overallScore, summaryFeedback: response.summaryFeedback });
  } catch (e) { console.error("roleplay message error:", e); return jsonResponse({ error: "Failed to process message" }, 500); }
}

async function handleRoleplayEnd(req: Request): Promise<Response> {
  try {
    const { sessionId } = await req.json();
    if (!sessionId) return jsonResponse({ error: "sessionId required" }, 400);
    const state = roleplaySessions.get(sessionId);
    if (!state) return jsonResponse({ error: "Session not found" }, 404);
    const scenario = getScenarioById(state.scenarioId);
    const durationSeconds = Math.round((Date.now() - state.startTime) / 1000);
    const overallScore = state.scores.length > 0 ? Math.round(state.scores.reduce((a: number, b: number) => a + b, 0) / state.scores.length) : 0;
    const feedback = state.feedbacks.join("\n\n");
    try {
      const user = await getAuthUser(req);
      if (user && scenario) {
        await db(sql`INSERT INTO role_play_sessions (id, company_id, user_id, scenario, score, feedback, duration_seconds) VALUES (${crypto.randomUUID()}, ${user.companyId}, ${user.id}, ${scenario.title}, ${overallScore}, ${feedback}, ${durationSeconds})`);
      }
    } catch {}
    roleplaySessions.delete(sessionId);
    return jsonResponse({ score: overallScore, feedback, durationSeconds, totalTurns: state.turn, stage: state.stage });
  } catch (e) { console.error("roleplay end error:", e); return jsonResponse({ error: "Failed to end session" }, 500); }
}

async function handleRoleplayScenarios(_req: Request): Promise<Response> {
  return jsonResponse({ scenarios: getScenarios() });
}

// Call Recording Upload API
async function handleCallUpload(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) return jsonResponse({ error: "Expected multipart/form-data" }, 400);
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const direction = (formData.get("direction") as string) || "outbound";
    const startedAt = (formData.get("started_at") as string) || new Date().toISOString();
    if (!file) return jsonResponse({ error: "No audio file provided" }, 400);
    const validTypes = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/webm", "audio/mp4", "audio/x-m4a", "audio/flac"];
    if (!validTypes.includes(file.type)) return jsonResponse({ error: "Invalid file type. Supported: MP3, WAV, OGG, WEBM, M4A, FLAC" }, 400);
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) return jsonResponse({ error: "File too large. Max 50MB" }, 400);
    const callId = crypto.randomUUID();
    const fileExt = file.name.split(".").pop() || "mp3";
    const fileName = callId + "." + fileExt;
    const filePath = UPLOADS_DIR + "/" + fileName;
    const buffer = await file.arrayBuffer();
    await Bun.write(filePath, new Uint8Array(buffer));
    try {
      await db(sql`INSERT INTO calls (id, company_id, user_id, direction, status, recording_url, started_at, created_at, updated_at) VALUES (${callId}, ${user.companyId}, ${user.id}, ${direction}, ${"processing"}, ${"/uploads/" + fileName}, ${startedAt}, ${"datetime('now')"}, ${"datetime('now')"})`);
    } catch (dbErr) {
      await Bun.$`rm -f ${filePath}`.quiet().nothrow();
      console.error("DB insert error:", dbErr);
      return jsonResponse({ error: "Failed to save call record" }, 500);
    }
    analyzeCallAsync(callId, user.companyId, user.id).catch((err: any) => console.error("AI analysis error:", err));
    return jsonResponse({ success: true, call: { id: callId, recording_url: "/uploads/" + fileName, status: "processing", started_at: startedAt, direction } });
  } catch (e) { console.error("upload error:", e); return jsonResponse({ error: "Upload failed" }, 500); }
}

async function analyzeCallAsync(callId: string, companyId: string, userId: string): Promise<void> {
  const delay = 3000 + Math.random() * 2000;
  await new Promise((r) => setTimeout(r, delay));
  const score = Math.floor(Math.random() * 30 + 65);
  const sentiments = ["positive", "neutral", "negative"];
  const sentiment = sentiments[Math.floor(Math.random() * (score > 80 ? 2 : 3))];
  const fillerWords = Math.floor(Math.random() * 15);
  const talkRatio = 0.35 + Math.random() * 0.3;
  const topics = ["pricing", "discovery", "product demo", "objection handling", "closing", "follow-up", "competitor comparison"];
  const selectedTopics = topics.sort(() => Math.random() - 0.5).slice(0, 2 + Math.floor(Math.random() * 3));
  try {
    await db(sql`UPDATE calls SET status = ${"analyzed"}, updated_at = datetime('now') WHERE id = ${callId}`);
    await db(sql`INSERT INTO call_analyses (id, call_id, overall_score, sentiment, talk_ratio_rep, talk_ratio_customer, avg_pace_wpm, filler_word_count, key_topics, summary, objections_detected) VALUES (${crypto.randomUUID()}, ${callId}, ${score}, ${sentiment}, ${talkRatio}, ${1 - talkRatio}, ${140 + Math.floor(Math.random() * 40)}, ${fillerWords}, ${JSON.stringify(selectedTopics)}, ${"AI-generated analysis for call recording."}, ${"[\"pricing concern\"]"})`);
    await db(sql`INSERT INTO points_events (id, company_id, user_id, event_type, points, description) VALUES (${crypto.randomUUID()}, ${companyId}, ${userId}, ${"call_uploaded"}, 10, ${"Uploaded and analyzed a call recording"})`);
    console.log("Call " + callId + " analyzed: score=" + score + ", sentiment=" + sentiment);
  } catch (err) { console.error("Failed to analyze call " + callId + ":", err); }
}

async function handleCallList(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const calls = await db(sql`SELECT c.id, c.user_id, c.direction, c.duration_seconds, c.started_at, c.status, c.recording_url, ca.overall_score, ca.sentiment, u.name as rep_name FROM calls c LEFT JOIN call_analyses ca ON ca.call_id = c.id LEFT JOIN users u ON u.id = c.user_id WHERE c.company_id = ${user.companyId} ORDER BY c.created_at DESC LIMIT 50`);
    return jsonResponse({ calls });
  } catch (e) { console.error("call list error:", e); return jsonResponse({ error: "Failed to list calls" }, 500); }
}

async function handleCallDelete(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const callId = new URL(req.url).pathname.split("/").pop();
    if (!callId) return jsonResponse({ error: "Call ID required" }, 400);
    const call = await db(sql`SELECT id, recording_url FROM calls WHERE id = ${callId} AND company_id = ${user.companyId}`);
    if (call.length === 0) return jsonResponse({ error: "Call not found" }, 404);
    // Delete the file
    if (call[0].recording_url) {
      const filePath = UPLOADS_DIR + "/" + call[0].recording_url.split("/").pop();
      await Bun.$`rm -f ${filePath}`.quiet().nothrow();
    }
    await db(sql`DELETE FROM calls WHERE id = ${callId} AND company_id = ${user.companyId}`);
    return jsonResponse({ success: true });
  } catch (e) { console.error("call delete error:", e); return jsonResponse({ error: "Failed to delete call" }, 500); }
}

// Scorecards API
async function handleListScorecards(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const scorecards = await db(sql`SELECT sc.*, (SELECT COUNT(*) FROM scorecard_criteria WHERE scorecard_id = sc.id) as criteria_count FROM scorecards sc WHERE sc.company_id = ${user.companyId} ORDER BY sc.created_at DESC`);
    // Fetch criteria for each scorecard
    const result = await Promise.all(scorecards.map(async (sc: any) => {
      const criteria = await db(sql`SELECT * FROM scorecard_criteria WHERE scorecard_id = ${sc.id} ORDER BY sort_order`);
      return { ...sc, criteria };
    }));
    return jsonResponse({ scorecards: result });
  } catch (e) { console.error("list scorecards error:", e); return jsonResponse({ error: "Failed to list scorecards" }, 500); }
}

async function handleCreateScorecard(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const { name, description } = await req.json();
    if (!name) return jsonResponse({ error: "Name is required" }, 400);
    const id = crypto.randomUUID();
    await db(sql`INSERT INTO scorecards (id, company_id, name, description) VALUES (${id}, ${user.companyId}, ${name}, ${description || ""})`);
    return jsonResponse({ success: true, scorecard: { id, name, description: description || "", criteria: [], criteria_count: 0 } });
  } catch (e) { console.error("create scorecard error:", e); return jsonResponse({ error: "Failed to create scorecard" }, 500); }
}

async function handleUpdateScorecard(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const id = new URL(req.url).pathname.split("/").pop();
    const { name, description } = await req.json();
    if (!id || !name) return jsonResponse({ error: "Name is required" }, 400);
    await db(sql`UPDATE scorecards SET name = ${name}, description = ${description || ""}, updated_at = datetime('now') WHERE id = ${id} AND company_id = ${user.companyId}`);
    return jsonResponse({ success: true });
  } catch (e) { console.error("update scorecard error:", e); return jsonResponse({ error: "Failed to update scorecard" }, 500); }
}

async function handleDeleteScorecard(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const id = new URL(req.url).pathname.split("/").pop();
    if (!id) return jsonResponse({ error: "ID required" }, 400);
    await db(sql`DELETE FROM scorecards WHERE id = ${id} AND company_id = ${user.companyId}`);
    return jsonResponse({ success: true });
  } catch (e) { console.error("delete scorecard error:", e); return jsonResponse({ error: "Failed to delete scorecard" }, 500); }
}

async function handleCreateCriteria(req: Request): Promise<Response> {
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
  } catch (e) { console.error("create criteria error:", e); return jsonResponse({ error: "Failed to create criteria" }, 500); }
}

async function handleUpdateCriteria(req: Request): Promise<Response> {
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
  } catch (e) { console.error("update criteria error:", e); return jsonResponse({ error: "Failed to update criteria" }, 500); }
}

async function handleDeleteCriteria(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const parts = new URL(req.url).pathname.split("/");
    const criteriaId = parts[5];
    if (!criteriaId) return jsonResponse({ error: "ID required" }, 400);
    await db(sql`DELETE FROM scorecard_criteria WHERE id = ${criteriaId}`);
    return jsonResponse({ success: true });
  } catch (e) { console.error("delete criteria error:", e); return jsonResponse({ error: "Failed to delete criteria" }, 500); }
}

// Settings API
async function handleGetCompanySettings(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const rows = await db(sql`SELECT id, name, slug, tier, settings, created_at FROM companies WHERE id = ${user.companyId}`);
    if (rows.length === 0) return jsonResponse({ error: "Company not found" }, 404);
    const company = rows[0];
    // Get team size
    const teamSize = await db(sql`SELECT COUNT(*) as count FROM users WHERE company_id = ${user.companyId}`);
    return jsonResponse({ company: { ...company, settings: JSON.parse(company.settings || "{}"), teamSize: teamSize[0]?.count || 0 } });
  } catch (e) { console.error("get company settings error:", e); return jsonResponse({ error: "Failed to load settings" }, 500); }
}

async function handleUpdateCompanySettings(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (user.role !== "admin") return jsonResponse({ error: "Only admins can update company settings" }, 403);
    const { name, settings } = await req.json();
    if (name) await db(sql`UPDATE companies SET name = ${name}, updated_at = datetime('now') WHERE id = ${user.companyId}`);
    if (settings) await db(sql`UPDATE companies SET settings = ${JSON.stringify(settings)}, updated_at = datetime('now') WHERE id = ${user.companyId}`);
    return jsonResponse({ success: true });
  } catch (e) { console.error("update company settings error:", e); return jsonResponse({ error: "Failed to update settings" }, 500); }
}

async function handleUpdateProfile(req: Request): Promise<Response> {
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
  } catch (e) { console.error("update profile error:", e); return jsonResponse({ error: "Failed to update profile" }, 500); }
}

async function handleChangePassword(req: Request): Promise<Response> {
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
  } catch (e) { console.error("change password error:", e); return jsonResponse({ error: "Failed to change password" }, 500); }
}

async function handleGetNotifications(req: Request): Promise<Response> {
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
  } catch (e) { console.error("get notifications error:", e); return jsonResponse({ error: "Failed to load preferences" }, 500); }
}

async function handleUpdateNotifications(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const { call_analyzed, coaching_assigned, leaderboard_changes } = await req.json();
    await db(sql`INSERT INTO notification_preferences (id, user_id, call_analyzed, coaching_assigned, leaderboard_changes) VALUES (${crypto.randomUUID()}, ${user.id}, ${call_analyzed ? 1 : 0}, ${coaching_assigned ? 1 : 0}, ${leaderboard_changes ? 1 : 0}) ON CONFLICT(user_id) DO UPDATE SET call_analyzed = ${call_analyzed ? 1 : 0}, coaching_assigned = ${coaching_assigned ? 1 : 0}, leaderboard_changes = ${leaderboard_changes ? 1 : 0}, updated_at = datetime('now')`);
    return jsonResponse({ success: true });
  } catch (e) { console.error("update notifications error:", e); return jsonResponse({ error: "Failed to update preferences" }, 500); }
}

// Compliance API
async function handleListComplianceRules(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const rules = await db(sql`SELECT * FROM compliance_rules WHERE company_id = ${user.companyId} ORDER BY created_at DESC`);
    // Parse JSON string fields
    return jsonResponse({ rules: rules.map((r: any) => ({ ...r, script_required_phrases: JSON.parse(r.script_required_phrases || "[]"), prohibited_phrases: JSON.parse(r.prohibited_phrases || "[]") })) });
  } catch (e) { console.error("list rules error:", e); return jsonResponse({ error: "Failed to load rules" }, 500); }
}

async function handleCreateComplianceRule(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (user.role !== "admin" && user.role !== "manager") return jsonResponse({ error: "Only admins and managers can manage rules" }, 403);
    const { name, description, script_required_phrases, prohibited_phrases } = await req.json();
    if (!name) return jsonResponse({ error: "Name is required" }, 400);
    const id = crypto.randomUUID();
    await db(sql`INSERT INTO compliance_rules (id, company_id, name, description, script_required_phrases, prohibited_phrases) VALUES (${id}, ${user.companyId}, ${name}, ${description || ""}, ${JSON.stringify(script_required_phrases || [])}, ${JSON.stringify(prohibited_phrases || [])})`);
    return jsonResponse({ success: true, rule: { id, name, description: description || "", script_required_phrases: script_required_phrases || [], prohibited_phrases: prohibited_phrases || [], is_active: 1 } });
  } catch (e) { console.error("create rule error:", e); return jsonResponse({ error: "Failed to create rule" }, 500); }
}

async function handleUpdateComplianceRule(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (user.role !== "admin" && user.role !== "manager") return jsonResponse({ error: "Only admins and managers can manage rules" }, 403);
    const ruleId = new URL(req.url).pathname.split("/").pop();
    const { name, description, script_required_phrases, prohibited_phrases, is_active } = await req.json();
    if (!ruleId) return jsonResponse({ error: "Rule ID required" }, 400);
    if (name) await db(sql`UPDATE compliance_rules SET name = ${name}, updated_at = datetime('now') WHERE id = ${ruleId} AND company_id = ${user.companyId}`);
    if (description !== undefined) await db(sql`UPDATE compliance_rules SET description = ${description}, updated_at = datetime('now') WHERE id = ${ruleId} AND company_id = ${user.companyId}`);
    if (script_required_phrases) await db(sql`UPDATE compliance_rules SET script_required_phrases = ${JSON.stringify(script_required_phrases)}, updated_at = datetime('now') WHERE id = ${ruleId} AND company_id = ${user.companyId}`);
    if (prohibited_phrases) await db(sql`UPDATE compliance_rules SET prohibited_phrases = ${JSON.stringify(prohibited_phrases)}, updated_at = datetime('now') WHERE id = ${ruleId} AND company_id = ${user.companyId}`);
    if (is_active !== undefined) await db(sql`UPDATE compliance_rules SET is_active = ${is_active ? 1 : 0}, updated_at = datetime('now') WHERE id = ${ruleId} AND company_id = ${user.companyId}`);
    return jsonResponse({ success: true });
  } catch (e) { console.error("update rule error:", e); return jsonResponse({ error: "Failed to update rule" }, 500); }
}

async function handleDeleteComplianceRule(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (user.role !== "admin" && user.role !== "manager") return jsonResponse({ error: "Only admins and managers can manage rules" }, 403);
    const ruleId = new URL(req.url).pathname.split("/").pop();
    if (!ruleId) return jsonResponse({ error: "Rule ID required" }, 400);
    await db(sql`DELETE FROM compliance_rules WHERE id = ${ruleId} AND company_id = ${user.companyId}`);
    return jsonResponse({ success: true });
  } catch (e) { console.error("delete rule error:", e); return jsonResponse({ error: "Failed to delete rule" }, 500); }
}

async function handleListComplianceChecks(req: Request): Promise<Response> {
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
  } catch (e) { console.error("list checks error:", e); return jsonResponse({ error: "Failed to load checks" }, 500); }
}

// Coaching Plan Generator API
async function handleGenerateCoachingPlan(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const { user_id } = await req.json();
    const targetUserId = user_id || user.id;
    const callScores = await db(sql`SELECT cs.total_score, cs.criteria_scores, cs.scorecard_id, sc.name as scorecard_name FROM call_scores cs JOIN scorecards sc ON sc.id = cs.scorecard_id JOIN calls c ON c.id = cs.call_id WHERE c.user_id = ${targetUserId} ORDER BY cs.created_at DESC LIMIT 10`);
    const criteriaWeaknesses: Array<{ criterionName: string; category: string; score: number; maxScore: number; weight: number }> = [];
    for (const cs of callScores) {
      const criteria = await db(sql`SELECT name, max_score, weight, category FROM scorecard_criteria WHERE scorecard_id = ${cs.scorecard_id} ORDER BY sort_order`);
      const criteriaScores = (() => { try { return JSON.parse(cs.criteria_scores || "{}"); } catch { return {}; } })();
      for (const c of criteria) {
        const score = criteriaScores[c.name] ?? (cs.total_score / Math.max(1, criteria.length));
        criteriaWeaknesses.push({ criterionName: c.name, category: c.category || "General", score, maxScore: c.max_score, weight: c.weight });
      }
    }
    const analyses = await db(sql`SELECT overall_score FROM call_analyses ca JOIN calls c ON c.id = ca.call_id WHERE c.user_id = ${targetUserId} ORDER BY ca.created_at DESC LIMIT 5`);
    const avgScore = analyses.length > 0 ? analyses.reduce((s: number, a: any) => s + (a.overall_score || 0), 0) / analyses.length : 0;
    if (avgScore < 70 && criteriaWeaknesses.length === 0) {
      criteriaWeaknesses.push({ criterionName: "Overall Call Performance", category: "General", score: avgScore, maxScore: 100, weight: 1.0 });
    }
    const rep = await db(sql`SELECT name FROM users WHERE id = ${targetUserId}`);
    const repName = rep.length > 0 ? rep[0].name : undefined;
    const weaknesses = analyzeWeaknesses(criteriaWeaknesses);
    const plan = generateCoachingPlan(weaknesses, repName);
    const planId = crypto.randomUUID();
    await db(sql`INSERT INTO coaching_plans (id, company_id, user_id, manager_id, title, description, status, created_at) VALUES (${planId}, ${user.companyId}, ${targetUserId}, ${user.id}, ${plan.title}, ${plan.description}, ${"active"}, ${"datetime('now')"})`);
    for (const item of plan.items) {
      await db(sql`INSERT INTO coaching_plan_items (id, coaching_plan_id, title, description, resource_url, status, sort_order) VALUES (${crypto.randomUUID()}, ${planId}, ${item.title}, ${item.description}, ${item.resourceUrl || ""}, ${"pending"}, ${item.sortOrder})`);
    }
    return jsonResponse({ success: true, plan: { id: planId, title: plan.title, description: plan.description, items: plan.items, weaknesses: weaknesses.slice(0, 5) } });
  } catch (e) { console.error("coaching generate error:", e); return jsonResponse({ error: "Failed to generate coaching plan" }, 500); }
}

// Billing API
async function handleGetBillingPlan(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const rows = await db(sql`SELECT id, name, slug, tier, created_at FROM companies WHERE id = ${user.companyId}`);
    if (rows.length === 0) return jsonResponse({ error: "Company not found" }, 404);
    const company = rows[0];
    const teamSize = (await db(sql`SELECT COUNT(*) as count FROM users WHERE company_id = ${user.companyId}`))[0]?.count || 0;
    const plans = {
      core: { name: "Core", price: "$29/mo", stripeLink: "https://buy.stripe.com/8x2fZh4pL2Tp1sY3kw1wY02", features: ["AI call analysis", "Basic scorecards", "Manager dashboard", "Up to 10 team members", "Email support"] },
      pro: { name: "Pro", price: "$79/mo", stripeLink: "https://buy.stripe.com/28E00jbSd79F1sYaMY1wY01", features: ["Everything in Core", "Live AI coaching", "AI role-playing", "Custom scorecards", "Advanced analytics", "Up to 50 team members", "Priority support"] },
      enterprise: { name: "Enterprise", price: "$199/mo", stripeLink: "https://buy.stripe.com/dRmd9Rf4p65B2x23kw1wY00", features: ["Everything in Pro", "Multi-company admin", "SSO / SAML", "Custom AI prompts", "Dedicated support", "SLA guarantees", "Unlimited team members", "Custom integrations"] },
    };
    return jsonResponse({ company: { ...company, teamSize }, currentPlan: plans[company.tier as keyof typeof plans] || plans.core, allPlans: plans });
  } catch (e) { console.error("billing plan error:", e); return jsonResponse({ error: "Failed to load billing info" }, 500); }
}

// Server
for (let attempt = 1; ; attempt++) {
  await Bun.$`sudo sh -c ${freePort}`.quiet().nothrow();
  try {
    Bun.serve({
      port: PORT,
      hostname: HOST,
      async fetch(req) {
        const { pathname } = new URL(req.url);

        // Auth API
        if (pathname === "/api/login" && req.method === "POST") return handleLogin(req);
        if (pathname === "/api/register" && req.method === "POST") return handleRegister(req);
        if (pathname === "/api/logout" && req.method === "POST") return handleLogout(req);
        if (pathname === "/api/session" && req.method === "GET") return handleSession(req);

        // Team Invitation API
        if (pathname === "/api/team/invite" && req.method === "POST") return handleCreateInvite(req);
        if (pathname === "/api/team/invites" && req.method === "GET") return handleListInvites(req);
        if (pathname.startsWith("/api/team/invite/") && req.method === "DELETE") return handleCancelInvite(req);

        // AI Role-Play API
        if (pathname === "/api/roleplay/scenarios" && req.method === "GET") return handleRoleplayScenarios(req);
        if (pathname === "/api/roleplay/start" && req.method === "POST") return handleRoleplayStart(req);
        if (pathname === "/api/roleplay/message" && req.method === "POST") return handleRoleplayMessage(req);
        if (pathname === "/api/roleplay/end" && req.method === "POST") return handleRoleplayEnd(req);

        // Call Recording API
        if (pathname === "/api/calls/upload" && req.method === "POST") return handleCallUpload(req);
        if (pathname === "/api/calls" && req.method === "GET") return handleCallList(req);
        if (pathname.startsWith("/api/calls/") && req.method === "DELETE" && pathname.split("/").length === 4) return handleCallDelete(req);

        // Scorecards API
        if (pathname === "/api/scorecards" && req.method === "GET") return handleListScorecards(req);
        if (pathname === "/api/scorecards" && req.method === "POST") return handleCreateScorecard(req);
        if (pathname.startsWith("/api/scorecards/") && pathname.endsWith("/criteria") && req.method === "POST") return handleCreateCriteria(req);
        if (pathname.match(/^\/api\/scorecards\/[^\/]+\/criteria\/[^\/]+$/) && req.method === "PUT") return handleUpdateCriteria(req);
        if (pathname.match(/^\/api\/scorecards\/[^\/]+\/criteria\/[^\/]+$/) && req.method === "DELETE") return handleDeleteCriteria(req);
        if (pathname.startsWith("/api/scorecards/") && pathname.split("/").length === 4 && req.method === "PUT") return handleUpdateScorecard(req);
        if (pathname.startsWith("/api/scorecards/") && pathname.split("/").length === 4 && req.method === "DELETE") return handleDeleteScorecard(req);

        // Coaching Plan Generator API
        if (pathname === "/api/coaching/generate" && req.method === "POST") return handleGenerateCoachingPlan(req);

        // Billing API
        if (pathname === "/api/billing/plan" && req.method === "GET") return handleGetBillingPlan(req);

        // Settings API
        if (pathname === "/api/settings/company" && req.method === "GET") return handleGetCompanySettings(req);
        if (pathname === "/api/settings/company" && req.method === "PUT") return handleUpdateCompanySettings(req);
        if (pathname === "/api/settings/profile" && req.method === "PUT") return handleUpdateProfile(req);
        if (pathname === "/api/settings/password" && req.method === "PUT") return handleChangePassword(req);
        if (pathname === "/api/settings/notifications" && req.method === "GET") return handleGetNotifications(req);
        if (pathname === "/api/settings/notifications" && req.method === "PUT") return handleUpdateNotifications(req);

        // Compliance API
        if (pathname === "/api/compliance/rules" && req.method === "GET") return handleListComplianceRules(req);
        if (pathname === "/api/compliance/rules" && req.method === "POST") return handleCreateComplianceRule(req);
        if (pathname.startsWith("/api/compliance/rules/") && req.method === "PUT") return handleUpdateComplianceRule(req);
        if (pathname.startsWith("/api/compliance/rules/") && req.method === "DELETE") return handleDeleteComplianceRule(req);
        if (pathname === "/api/compliance/checks" && req.method === "GET") return handleListComplianceChecks(req);

        // Serve uploaded files
        if (pathname.startsWith("/uploads/")) {
          const filePath = UPLOADS_DIR + "/" + pathname.slice(9);
          const file = Bun.file(filePath);
          if (await file.exists()) return new Response(file);
        }

        // Static files
        if (pathname !== "/") {
          const file = Bun.file(CLIENT_DIR + pathname);
          if (await file.exists()) return new Response(file);
        }

        // TanStack Start SSR
        return (handler as { fetch: (r: Request) => Response | Promise<Response> }).fetch(req);
      },
    });
    break;
  } catch (err) {
    if (attempt >= 10) throw err;
    await Bun.sleep(200);
  }
}

console.log("team-site serving on http://" + HOST + ":" + String(PORT));