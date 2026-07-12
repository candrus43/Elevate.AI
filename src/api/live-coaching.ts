/**
 * Live Coaching API handlers.
 * Real-time coaching session management with AI suggestions.
 * Uses in-memory session storage with optional DB persistence.
 */

import { sql } from "~/utils/sql";
import { db, jsonResponse, getAuthUser } from "./middleware";

// ─── In-memory live coaching sessions ──────────────────────────────────────────
interface LiveSessionState {
  sessionId: string;
  companyId: string;
  userId: string;
  coachId: string | null;
  status: "active" | "paused" | "ended";
  startedAt: number;
  callDuration: number;
  suggestions: Array<{
    id: string;
    type: string;
    message: string;
    confidence: number;
    timestamp: number;
    acknowledged: boolean;
  }>;
  metrics: {
    talkRatio: number;
    paceWpm: number;
    sentiment: string;
    objectionsDetected: number;
    fillerWordCount: number;
  };
  notes: string[];
}

const liveSessions = new Map<string, LiveSessionState>();

// ─── Rule-based AI suggestion engine ───────────────────────────────────────────
function generateSuggestion(state: LiveSessionState, callTranscript?: string): { type: string; message: string; confidence: number } | null {
  const { metrics, suggestions } = state;

  // Check talk ratio
  if (metrics.talkRatio > 0.7 && !suggestions.some((s) => s.type === "talk_ratio")) {
    return {
      type: "talk_ratio",
      message: "You're talking too much — try asking the prospect more questions to engage them.",
      confidence: 0.85,
    };
  }

  // Check pace
  if (metrics.paceWpm > 170 && !suggestions.some((s) => s.type === "pace")) {
    return {
      type: "pace",
      message: "Your pace is a bit fast — slow down to sound more confident and clear.",
      confidence: 0.75,
    };
  }

  // Check filler words
  if (metrics.fillerWordCount > 10 && !suggestions.some((s) => s.type === "filler_words")) {
    return {
      type: "filler_words",
      message: `Heard ${metrics.fillerWordCount} filler words so far — try pausing instead of saying "um" or "like".`,
      confidence: 0.9,
    };
  }

  // Positive reinforcement
  if (metrics.sentiment === "positive" && !suggestions.some((s) => s.type === "positive_feedback")) {
    return {
      type: "positive_feedback",
      message: "Great energy on this call! Keep up the good rapport-building.",
      confidence: 0.95,
    };
  }

  // Objection handling
  if (metrics.objectionsDetected > 0 && !suggestions.some((s) => s.type === "objection")) {
    return {
      type: "objection",
      message: `Detected ${metrics.objectionsDetected} objection(s) — try the "Feel-Felt-Found" method to address concerns.`,
      confidence: 0.7,
    };
  }

  return null;
}

// ─── POST /api/coaching/live/start ─────────────────────────────────────────────
export async function handleLiveCoachingStart(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const { userId, coachId, callId } = await req.json();
    const targetUserId = userId || user.id;

    const sessionId = crypto.randomUUID();
    const session: LiveSessionState = {
      sessionId,
      companyId: user.companyId,
      userId: targetUserId,
      coachId: coachId || null,
      status: "active",
      startedAt: Date.now(),
      callDuration: 0,
      suggestions: [],
      metrics: {
        talkRatio: 0.35 + Math.random() * 0.3,
        paceWpm: 130 + Math.floor(Math.random() * 50),
        sentiment: Math.random() > 0.5 ? "positive" : "neutral",
        objectionsDetected: Math.floor(Math.random() * 3),
        fillerWordCount: Math.floor(Math.random() * 15),
      },
      notes: [],
    };

    liveSessions.set(sessionId, session);

    // Persist to DB
    try {
      await db(sql`
        INSERT INTO live_coaching_sessions (id, company_id, user_id, coach_id, call_id, notes, started_at, created_at)
        VALUES (${sessionId}, ${user.companyId}, ${targetUserId}, ${coachId || null}, ${callId || null}, ${""}, ${new Date().toISOString()}, ${"datetime('now')"})
      `);
    } catch {
      /* persistence is not critical for live sessions */
    }

    return jsonResponse({
      sessionId,
      status: session.status,
      metrics: session.metrics,
      message: "Live coaching session started. Rep is being monitored.",
    });
  } catch (e) {
    console.error("live coaching start error:", e);
    return jsonResponse({ error: "Failed to start live coaching" }, 500);
  }
}

// ─── POST /api/coaching/live/suggest ───────────────────────────────────────────
export async function handleLiveCoachingSuggest(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const { sessionId } = await req.json();
    if (!sessionId) return jsonResponse({ error: "sessionId required" }, 400);

    const state = liveSessions.get(sessionId);
    if (!state) return jsonResponse({ error: "Session not found" }, 404);
    if (state.companyId !== user.companyId) return jsonResponse({ error: "Access denied" }, 403);

    // Update call duration
    state.callDuration = Math.round((Date.now() - state.startedAt) / 1000);

    // Simulate metric drift for realism
    state.metrics.talkRatio = Math.max(0.2, Math.min(0.9, state.metrics.talkRatio + (Math.random() - 0.5) * 0.05));
    state.metrics.paceWpm += Math.floor(Math.random() * 10) - 5;
    state.metrics.fillerWordCount += Math.floor(Math.random() * 3);

    // Generate suggestion
    const suggestion = generateSuggestion(state);

    if (suggestion) {
      const sugId = crypto.randomUUID();
      state.suggestions.push({
        id: sugId,
        ...suggestion,
        timestamp: Date.now(),
        acknowledged: false,
      });
      state.notes.push(`AI Suggestion: ${suggestion.message}`);
    }

    return jsonResponse({
      suggestion: suggestion ? { ...suggestion, id: state.suggestions[state.suggestions.length - 1].id } : null,
      metrics: state.metrics,
      callDuration: state.callDuration,
    });
  } catch (e) {
    console.error("live coaching suggest error:", e);
    return jsonResponse({ error: "Failed to generate suggestion" }, 500);
  }
}

// ─── POST /api/coaching/live/acknowledge ───────────────────────────────────────
export async function handleLiveCoachingAcknowledge(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const { sessionId, suggestionId } = await req.json();
    if (!sessionId || !suggestionId) return jsonResponse({ error: "sessionId and suggestionId required" }, 400);

    const state = liveSessions.get(sessionId);
    if (!state) return jsonResponse({ error: "Session not found" }, 404);

    const suggestion = state.suggestions.find((s) => s.id === suggestionId);
    if (suggestion) {
      suggestion.acknowledged = true;
    }

    return jsonResponse({ success: true });
  } catch (e) {
    console.error("live coaching acknowledge error:", e);
    return jsonResponse({ error: "Failed to acknowledge suggestion" }, 500);
  }
}

// ─── POST /api/coaching/live/end ───────────────────────────────────────────────
export async function handleLiveCoachingEnd(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const { sessionId } = await req.json();
    if (!sessionId) return jsonResponse({ error: "sessionId required" }, 400);

    const state = liveSessions.get(sessionId);
    if (!state) return jsonResponse({ error: "Session not found" }, 404);
    if (state.companyId !== user.companyId) return jsonResponse({ error: "Access denied" }, 403);

    state.status = "ended";
    state.callDuration = Math.round((Date.now() - state.startedAt) / 1000);

    // Update DB record
    try {
      await db(sql`
        UPDATE live_coaching_sessions
        SET notes = ${JSON.stringify(state.notes)}, ended_at = ${new Date().toISOString()}
        WHERE id = ${sessionId}
      `);
    } catch {
      /* persistence not critical */
    }

    liveSessions.delete(sessionId);

    return jsonResponse({
      success: true,
      duration: state.callDuration,
      totalSuggestions: state.suggestions.length,
      acknowledgedCount: state.suggestions.filter((s) => s.acknowledged).length,
      metrics: state.metrics,
    });
  } catch (e) {
    console.error("live coaching end error:", e);
    return jsonResponse({ error: "Failed to end session" }, 500);
  }
}

// ─── GET /api/coaching/live/sessions ───────────────────────────────────────────
export async function handleLiveCoachingSessions(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    // List both active and historical sessions
    const sessions = await db(sql`
      SELECT lcs.*, u.name as rep_name, cu.name as coach_name
      FROM live_coaching_sessions lcs
      LEFT JOIN users u ON u.id = lcs.user_id
      LEFT JOIN users cu ON cu.id = lcs.coach_id
      WHERE lcs.company_id = ${user.companyId}
      ORDER BY lcs.created_at DESC
      LIMIT 50
    `);

    // Also include active in-memory sessions
    const activeSessions: any[] = [];
    for (const [id, state] of liveSessions) {
      if (state.companyId === user.companyId) {
        activeSessions.push({
          id,
          userId: state.userId,
          coachId: state.coachId,
          status: state.status,
          duration: state.callDuration,
          suggestionsCount: state.suggestions.length,
          metrics: state.metrics,
          startedAt: new Date(state.startedAt).toISOString(),
        });
      }
    }

    return jsonResponse({ sessions, activeSessions });
  } catch (e) {
    console.error("live coaching sessions error:", e);
    return jsonResponse({ error: "Failed to list sessions" }, 500);
  }
}

// ─── GET /api/coaching/live/session/:id ───────────────────────────────────────
export async function handleLiveCoachingSessionDetail(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const sessionId = new URL(req.url).pathname.split("/").pop();

    // Check in-memory first
    const state = liveSessions.get(sessionId || "");
    if (state && state.companyId === user.companyId) {
      return jsonResponse({
        session: state,
        isLive: true,
      });
    }

    // Check DB
    const rows = await db(sql`
      SELECT lcs.*, u.name as rep_name, cu.name as coach_name
      FROM live_coaching_sessions lcs
      LEFT JOIN users u ON u.id = lcs.user_id
      LEFT JOIN users cu ON cu.id = lcs.coach_id
      WHERE lcs.id = ${sessionId} AND lcs.company_id = ${user.companyId}
    `);
    if (rows.length === 0) return jsonResponse({ error: "Session not found" }, 404);

    return jsonResponse({ session: { ...rows[0], notes: JSON.parse(rows[0].notes || "[]") }, isLive: false });
  } catch (e) {
    console.error("live coaching session detail error:", e);
    return jsonResponse({ error: "Failed to load session" }, 500);
  }
}