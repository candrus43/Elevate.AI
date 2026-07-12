/**
 * Observe.ai Integration — Real conversation intelligence API client.
 *
 * Connects to Observe.ai REST API for call analysis, transcripts, scores, and coaching insights.
 * Supports demo/live mode via the integration-mode architecture.
 *
 * API Reference: https://docs.observe.ai/api/v1
 * Auth: Bearer token (API key)
 * Base URL: https://api.observe.ai/v1 (or custom instance URL)
 */

import { sql } from "~/utils/sql";
import { db, jsonResponse, getAuthUser } from "./middleware";
import { getEffectiveMode, isLive } from "./integration-mode";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ObserveAIConfig {
  apiKey: string;
  instanceUrl: string;
  webhookSecret?: string;
}

export interface ObserveAICall {
  callId: string;
  agentId: string;
  agentName?: string;
  customerPhone: string;
  direction: "inbound" | "outbound";
  duration: number;
  timestamp: string;
  recordingUrl: string | null;
  status: string;
  outcome?: string;
}

export interface ObserveAITranscript {
  callId: string;
  utterances: Array<{
    speaker: "agent" | "customer";
    text: string;
    startTime: number;
    endTime: number;
  }>;
  fullText: string;
}

export interface ObserveAIScores {
  callId: string;
  overall: number;
  compliance: number;
  sentiment: number;
  talkRatio: number;
  objectionHandling: number;
  closing: number;
  categories: Record<string, number>;
}

export interface ObserveAICoaching {
  agentId: string;
  recommendations: Array<{
    area: string;
    score: number;
    description: string;
    priority: "high" | "medium" | "low";
  }>;
  strengths: string[];
  weaknesses: string[];
}

export interface ObserveAISkill {
  name: string;
  score: number;
  trend: "improving" | "declining" | "stable";
  lastAssessed: string;
}

// ─── Simulated Data (Demo Mode) ────────────────────────────────────────────

function simulateCalls(): ObserveAICall[] {
  return [
    { callId: "OBS-001", agentId: "AG-101", agentName: "Sarah Chen", customerPhone: "+15551234567", direction: "outbound", duration: 342, timestamp: new Date(Date.now() - 86400000).toISOString(), recordingUrl: "https://obs.recording.com/001.mp3", status: "completed", outcome: "meeting_set" },
    { callId: "OBS-002", agentId: "AG-102", agentName: "Mike Johnson", customerPhone: "+15555678901", direction: "inbound", duration: 187, timestamp: new Date(Date.now() - 72000000).toISOString(), recordingUrl: "https://obs.recording.com/002.mp3", status: "completed", outcome: "voicemail" },
    { callId: "OBS-003", agentId: "AG-101", agentName: "Sarah Chen", customerPhone: "+15558765432", direction: "outbound", duration: 523, timestamp: new Date(Date.now() - 43200000).toISOString(), recordingUrl: "https://obs.recording.com/003.mp3", status: "completed", outcome: "discovery" },
    { callId: "OBS-004", agentId: "AG-103", agentName: "Alex Rivera", customerPhone: "+15553456789", direction: "outbound", duration: 245, timestamp: new Date(Date.now() - 21600000).toISOString(), recordingUrl: null, status: "completed", outcome: "no_answer" },
    { callId: "OBS-005", agentId: "AG-102", agentName: "Mike Johnson", customerPhone: "+15559876543", direction: "inbound", duration: 410, timestamp: new Date(Date.now() - 10800000).toISOString(), recordingUrl: "https://obs.recording.com/005.mp3", status: "completed", outcome: "closed_won" },
    { callId: "OBS-006", agentId: "AG-104", agentName: "Emily Park", customerPhone: "+15554567890", direction: "outbound", duration: 156, timestamp: new Date(Date.now() - 3600000).toISOString(), recordingUrl: null, status: "completed", outcome: "callback" },
  ];
}

function simulateTranscript(callId: string): ObserveAITranscript {
  return {
    callId,
    utterances: [
      { speaker: "agent", text: "Hi, this is Sarah from Acme Corp. Am I speaking with John?", startTime: 0, endTime: 3.2 },
      { speaker: "customer", text: "Yes, this is John. How can I help you?", startTime: 3.5, endTime: 5.8 },
      { speaker: "agent", text: "I'm calling because we have a new solution that could help your team save 30% on operational costs. Do you have a few minutes to discuss?", startTime: 6.0, endTime: 12.5 },
      { speaker: "customer", text: "I'm interested but a bit concerned about the pricing. Can you send me some information?", startTime: 13.0, endTime: 17.2 },
      { speaker: "agent", text: "Absolutely, I'd be happy to. Let me also share a case study from a similar company in your industry.", startTime: 17.5, endTime: 22.0 },
    ],
    fullText: "Hi, this is Sarah from Acme Corp. Am I speaking with John? Yes, this is John. How can I help you? I'm calling because we have a new solution that could help your team save 30% on operational costs...",
  };
}

function simulateScores(callId: string): ObserveAIScores {
  return {
    callId,
    overall: Math.floor(Math.random() * 30 + 65),
    compliance: Math.floor(Math.random() * 20 + 75),
    sentiment: Math.floor(Math.random() * 30 + 60),
    talkRatio: 0.35 + Math.random() * 0.3,
    objectionHandling: Math.floor(Math.random() * 30 + 55),
    closing: Math.floor(Math.random() * 30 + 50),
    categories: { greeting: 85, discovery: 72, value_proposition: 68, objection: 60, closing: 55 },
  };
}

function simulateCoaching(agentId: string): ObserveAICoaching {
  return {
    agentId,
    recommendations: [
      { area: "Objection Handling", score: 60, description: "Practice handling pricing objections more effectively", priority: "high" as const },
      { area: "Discovery Questions", score: 72, description: "Ask more open-ended questions to uncover needs", priority: "medium" as const },
      { area: "Closing Technique", score: 55, description: "Use trial closes and assumptive language", priority: "high" as const },
    ],
    strengths: ["Good rapport building", "Clear articulation of value proposition"],
    weaknesses: ["Struggles with price objections", "Rarely asks for the sale"],
  };
}

function simulateSkills(): ObserveAISkill[] {
  return [
    { name: "Active Listening", score: 78, trend: "improving", lastAssessed: new Date().toISOString() },
    { name: "Objection Handling", score: 60, trend: "declining", lastAssessed: new Date().toISOString() },
    { name: "Product Knowledge", score: 85, trend: "stable", lastAssessed: new Date().toISOString() },
    { name: "Closing", score: 55, trend: "improving", lastAssessed: new Date().toISOString() },
    { name: "Discovery", score: 72, trend: "stable", lastAssessed: new Date().toISOString() },
  ];
}

// ─── Real API Client ───────────────────────────────────────────────────────

interface ObserveAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function callObserveAPI<T>(
  config: ObserveAIConfig,
  endpoint: string,
  options: { method?: string; params?: Record<string, string>; body?: any } = {}
): Promise<ObserveAPIResponse<T>> {
  const { method = "GET", params, body } = options;
  const baseUrl = config.instanceUrl.replace(/\/$/, "");
  let url = `${baseUrl}${endpoint}`;
  if (params) {
    const qs = new URLSearchParams(params).toString();
    url += `?${qs}`;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      return { success: false, error: `Observe.ai API error (${response.status}): ${errorText}` };
    }

    const data = await response.json();
    return { success: true, data: data as T };
  } catch (err: any) {
    if (err.name === "AbortError") {
      return { success: false, error: "Observe.ai API request timed out after 30s" };
    }
    return { success: false, error: `Observe.ai API request failed: ${err.message}` };
  }
}

// ─── Config Management ────────────────────────────────────────────────────

export async function getObserveAIConfig(companyId: string): Promise<ObserveAIConfig | null> {
  try {
    const rows = await db(sql`
      SELECT api_key, instance_url, webhook_secret
      FROM observeai_config
      WHERE company_id = ${companyId}
      LIMIT 1
    `);
    if (rows.length === 0) return null;
    return {
      apiKey: rows[0].api_key,
      instanceUrl: rows[0].instance_url || "https://api.observe.ai/v1",
      webhookSecret: rows[0].webhook_secret,
    };
  } catch {
    return null;
  }
}

export async function saveObserveAIConfig(
  companyId: string,
  config: ObserveAIConfig
): Promise<boolean> {
  try {
    await db(sql`
      INSERT INTO observeai_config (company_id, api_key, instance_url, webhook_secret, updated_at)
      VALUES (${companyId}, ${config.apiKey}, ${config.instanceUrl}, ${config.webhookSecret || null}, ${"datetime('now')"})
      ON CONFLICT(company_id) DO UPDATE SET
        api_key = ${config.apiKey},
        instance_url = ${config.instanceUrl},
        webhook_secret = ${config.webhookSecret || null},
        updated_at = datetime('now')
    `);
    return true;
  } catch (err) {
    console.error("Failed to save Observe.ai config:", err);
    return false;
  }
}

// ─── Data Sync Functions ───────────────────────────────────────────────────

export async function syncCalls(
  companyId: string,
  userId: string,
  config: ObserveAIConfig
): Promise<{ success: boolean; calls: ObserveAICall[]; error?: string }> {
  const mode = await getEffectiveMode(companyId, userId, "observeai");

  if (isLive(mode)) {
    // Live mode — call real Observe.ai API
    const result = await callObserveAI<{ calls: ObserveAICall[] }>(config, "/v1/calls", {
      params: { limit: "50", sort: "desc" },
    });
    if (result.success && result.data) {
      return { success: true, calls: result.data.calls || [] };
    }
    return { success: false, calls: [], error: result.error };
  }

  // Demo mode — return simulated data
  return { success: true, calls: simulateCalls() };
}

export async function syncTranscript(
  companyId: string,
  userId: string,
  callId: string,
  config: ObserveAIConfig
): Promise<{ success: boolean; transcript?: ObserveAITranscript; error?: string }> {
  const mode = await getEffectiveMode(companyId, userId, "observeai");

  if (isLive(mode)) {
    const result = await callObserveAI<ObserveAITranscript>(config, `/v1/calls/${callId}/transcript`);
    if (result.success && result.data) {
      return { success: true, transcript: result.data };
    }
    return { success: false, error: result.error };
  }

  return { success: true, transcript: simulateTranscript(callId) };
}

export async function syncScores(
  companyId: string,
  userId: string,
  callId: string,
  config: ObserveAIConfig
): Promise<{ success: boolean; scores?: ObserveAIScores; error?: string }> {
  const mode = await getEffectiveMode(companyId, userId, "observeai");

  if (isLive(mode)) {
    const result = await callObserveAI<ObserveAIScores>(config, `/v1/calls/${callId}/scores`);
    if (result.success && result.data) {
      return { success: true, scores: result.data };
    }
    return { success: false, error: result.error };
  }

  return { success: true, scores: simulateScores(callId) };
}

export async function syncCoaching(
  companyId: string,
  userId: string,
  agentId: string,
  config: ObserveAIConfig
): Promise<{ success: boolean; coaching?: ObserveAICoaching; error?: string }> {
  const mode = await getEffectiveMode(companyId, userId, "observeai");

  if (isLive(mode)) {
    const result = await callObserveAI<ObserveAICoaching>(config, `/v1/agents/${agentId}/coaching`);
    if (result.success && result.data) {
      return { success: true, coaching: result.data };
    }
    return { success: false, error: result.error };
  }

  return { success: true, coaching: simulateCoaching(agentId) };
}

export async function syncSkills(
  companyId: string,
  userId: string,
  agentId: string,
  config: ObserveAIConfig
): Promise<{ success: boolean; skills?: ObserveAISkill[]; error?: string }> {
  const mode = await getEffectiveMode(companyId, userId, "observeai");

  if (isLive(mode)) {
    const result = await callObserveAI<{ skills: ObserveAISkill[] }>(config, `/v1/agents/${agentId}/skills`);
    if (result.success && result.data) {
      return { success: true, skills: result.data.skills || [] };
    }
    return { success: false, error: result.error };
  }

  return { success: true, skills: simulateSkills() };
}

// ─── Webhook Registration ─────────────────────────────────────────────────

export async function registerWebhook(
  config: ObserveAIConfig,
  webhookUrl: string,
  events: string[] = ["call.completed", "analysis.ready", "score.updated"]
): Promise<{ success: boolean; error?: string }> {
  const result = await callObserveAI<{ id: string }>(config, "/v1/webhooks", {
    method: "POST",
    body: { url: webhookUrl, events, active: true },
  });
  if (result.success) return { success: true };
  return { success: false, error: result.error };
}

// ─── API Handlers ─────────────────────────────────────────────────────────

/** POST /api/integrations/observeai/connect */
export async function handleObserveAIConnect(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const { api_key, instance_url, webhook_secret } = await req.json();
    if (!api_key) return jsonResponse({ error: "API key is required" }, 400);

    const saved = await saveObserveAIConfig(user.companyId, {
      apiKey: api_key,
      instanceUrl: instance_url || "https://api.observe.ai/v1",
      webhookSecret: webhook_secret,
    });

    // Create or update the integration record
    const existing = await db(sql`
      SELECT id FROM integrations WHERE company_id = ${user.companyId} AND provider = 'observeai'
    `);

    if (existing.length === 0) {
      await db(sql`
        INSERT INTO integrations (id, company_id, provider, name, status, config, created_at, updated_at)
        VALUES (${crypto.randomUUID()}, ${user.companyId}, ${"observeai"}, ${"Observe.ai"}, ${"connected"}, ${JSON.stringify({ instanceUrl: instance_url || "https://api.observe.ai/v1" })}, ${"datetime('now')"}, ${"datetime('now')"})
      `);
    } else {
      await db(sql`
        UPDATE integrations SET status = ${"connected"}, updated_at = datetime('now')
        WHERE id = ${existing[0].id}
      `);
    }

    if (!saved) return jsonResponse({ error: "Failed to save configuration" }, 500);
    return jsonResponse({ success: true, message: "Connected to Observe.ai" });
  } catch (e) {
    console.error("Observe.ai connect error:", e);
    return jsonResponse({ error: "Failed to connect" }, 500);
  }
}

/** POST /api/integrations/observeai/disconnect */
export async function handleObserveAIDisconnect(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    await db(sql`
      DELETE FROM observeai_config WHERE company_id = ${user.companyId}
    `);
    await db(sql`
      UPDATE integrations SET status = ${"disconnected"}, updated_at = datetime('now')
      WHERE company_id = ${user.companyId} AND provider = 'observeai'
    `);

    return jsonResponse({ success: true, message: "Disconnected from Observe.ai" });
  } catch (e) {
    console.error("Observe.ai disconnect error:", e);
    return jsonResponse({ error: "Failed to disconnect" }, 500);
  }
}

/** POST /api/integrations/observeai/sync-calls */
export async function handleObserveAISyncCalls(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const config = await getObserveAIConfig(user.companyId);
    if (!config) return jsonResponse({ error: "Observe.ai not configured" }, 400);

    const result = await syncCalls(user.companyId, user.id, config);
    if (!result.success) return jsonResponse({ error: result.error || "Sync failed" }, 500);

    // Store synced calls in the database
    for (const call of result.calls) {
      const existing = await db(sql`
        SELECT id FROM calls WHERE id = ${call.callId}
      `);
      if (existing.length === 0) {
        await db(sql`
          INSERT INTO calls (id, company_id, user_id, direction, status, recording_url, started_at, duration_seconds, created_at, updated_at)
          VALUES (${call.callId}, ${user.companyId}, ${user.id}, ${call.direction}, ${"analyzed"}, ${call.recordingUrl || ""}, ${call.timestamp}, ${call.duration}, ${"datetime('now')"}, ${"datetime('now')"})
        `).catch(() => {});
      }
    }

    // Log the sync
    const integration = await db(sql`
      SELECT id FROM integrations WHERE company_id = ${user.companyId} AND provider = 'observeai' LIMIT 1
    `);
    if (integration.length > 0) {
      await db(sql`
        INSERT INTO sync_logs (id, integration_id, status, records_synced, synced_at)
        VALUES (${crypto.randomUUID()}, ${integration[0].id}, ${"success"}, ${result.calls.length}, ${"datetime('now')"})
      `);
    }

    return jsonResponse({ success: true, calls: result.calls, total: result.calls.length });
  } catch (e) {
    console.error("Observe.ai sync error:", e);
    return jsonResponse({ error: "Sync failed" }, 500);
  }
}

/** GET /api/integrations/observeai/calls */
export async function handleObserveAICalls(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const config = await getObserveAIConfig(user.companyId);
    if (!config) return jsonResponse({ error: "Observe.ai not configured" }, 400);

    const result = await syncCalls(user.companyId, user.id, config);
    if (!result.success) return jsonResponse({ error: result.error }, 500);

    return jsonResponse({ calls: result.calls, total: result.calls.length });
  } catch (e) {
    console.error("Observe.ai calls error:", e);
    return jsonResponse({ error: "Failed to fetch calls" }, 500);
  }
}

/** GET /api/integrations/observeai/transcript */
export async function handleObserveAITranscript(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const url = new URL(req.url);
    const callId = url.searchParams.get("callId");
    if (!callId) return jsonResponse({ error: "callId parameter required" }, 400);

    const config = await getObserveAIConfig(user.companyId);
    if (!config) return jsonResponse({ error: "Observe.ai not configured" }, 400);

    const result = await syncTranscript(user.companyId, user.id, callId, config);
    if (!result.success) return jsonResponse({ error: result.error }, 500);

    return jsonResponse({ transcript: result.transcript });
  } catch (e) {
    console.error("Observe.ai transcript error:", e);
    return jsonResponse({ error: "Failed to fetch transcript" }, 500);
  }
}

/** GET /api/integrations/observeai/scores */
export async function handleObserveAIScores(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const url = new URL(req.url);
    const callId = url.searchParams.get("callId");
    if (!callId) return jsonResponse({ error: "callId parameter required" }, 400);

    const config = await getObserveAIConfig(user.companyId);
    if (!config) return jsonResponse({ error: "Observe.ai not configured" }, 400);

    const result = await syncScores(user.companyId, user.id, callId, config);
    if (!result.success) return jsonResponse({ error: result.error }, 500);

    return jsonResponse({ scores: result.scores });
  } catch (e) {
    console.error("Observe.ai scores error:", e);
    return jsonResponse({ error: "Failed to fetch scores" }, 500);
  }
}

/** GET /api/integrations/observeai/coaching */
export async function handleObserveAICoaching(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const url = new URL(req.url);
    const agentId = url.searchParams.get("agentId") || "AG-101";

    const config = await getObserveAIConfig(user.companyId);
    if (!config) return jsonResponse({ error: "Observe.ai not configured" }, 400);

    const result = await syncCoaching(user.companyId, user.id, agentId, config);
    if (!result.success) return jsonResponse({ error: result.error }, 500);

    return jsonResponse({ coaching: result.coaching });
  } catch (e) {
    console.error("Observe.ai coaching error:", e);
    return jsonResponse({ error: "Failed to fetch coaching" }, 500);
  }
}

/** GET /api/integrations/observeai/skills */
export async function handleObserveAISkills(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const url = new URL(req.url);
    const agentId = url.searchParams.get("agentId") || "AG-101";

    const config = await getObserveAIConfig(user.companyId);
    if (!config) return jsonResponse({ error: "Observe.ai not configured" }, 400);

    const result = await syncSkills(user.companyId, user.id, agentId, config);
    if (!result.success) return jsonResponse({ error: result.error }, 500);

    return jsonResponse({ skills: result.skills });
  } catch (e) {
    console.error("Observe.ai skills error:", e);
    return jsonResponse({ error: "Failed to fetch skills" }, 500);
  }
}

/** GET /api/integrations/observeai/logs */
export async function handleObserveAILogs(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const integration = await db(sql`
      SELECT id FROM integrations WHERE company_id = ${user.companyId} AND provider = 'observeai' LIMIT 1
    `);
    if (integration.length === 0) return jsonResponse({ logs: [] });

    const logs = await db(sql`
      SELECT * FROM sync_logs WHERE integration_id = ${integration[0].id} ORDER BY synced_at DESC LIMIT 20
    `);

    return jsonResponse({ logs });
  } catch (e) {
    console.error("Observe.ai logs error:", e);
    return jsonResponse({ error: "Failed to fetch logs" }, 500);
  }
}