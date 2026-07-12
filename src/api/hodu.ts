/**
 * Hodu Phone System Integration — Backend API
 * Connect ElevateAI to HoduCC cloud contact center for call sync, click-to-dial, live streaming.
 * Simulated for demo — architected for real API integration.
 */

import { sql } from "~/utils/sql";
import { db, jsonResponse, getAuthUser } from "./middleware";

// ─── SIMULATED HODUCC API ────────────────────────────────────────────────────

async function simulateHoduCCApi(endpoint: string, apiKey: string, action: string, params?: any) {
  await new Promise((r) => setTimeout(r, 80));
  switch (action) {
    case "get-call-logs": {
      const calls = [
        { callId: "HODU-001", caller: "+15551234567", callee: "+15559876543", duration: 342, direction: "outbound", outcome: "meeting_set", score: 78, recordingUrl: "https://hodu.recording.com/001.mp3" },
        { callId: "HODU-002", caller: "+15555678901", callee: "+15552345678", duration: 187, direction: "inbound", outcome: "voicemail", score: 55, recordingUrl: "https://hodu.recording.com/002.mp3" },
        { callId: "HODU-003", caller: "+15551234567", callee: "+15558765432", duration: 523, direction: "outbound", outcome: "discovery", score: 82, recordingUrl: "https://hodu.recording.com/003.mp3" },
        { callId: "HODU-004", caller: "+15553456789", callee: "+15557654321", duration: 245, direction: "outbound", outcome: "no_answer", score: 0, recordingUrl: null },
        { callId: "HODU-005", caller: "+15552345678", callee: "+15559876543", duration: 410, direction: "inbound", outcome: "closed_won", score: 91, recordingUrl: "https://hodu.recording.com/005.mp3" },
        { callId: "HODU-006", caller: "+15551234567", callee: "+15554567890", duration: 156, direction: "outbound", outcome: "callback", score: 65, recordingUrl: null },
        { callId: "HODU-007", caller: "+15557890123", callee: "+15553456789", duration: 298, direction: "inbound", outcome: "objection", score: 71, recordingUrl: "https://hodu.recording.com/007.mp3" },
        { callId: "HODU-008", caller: "+15551234567", callee: "+15556789012", duration: 0, direction: "outbound", outcome: "no_answer", score: 0, recordingUrl: null },
      ];
      return { success: true, calls, total: calls.length };
    }
    case "click-to-dial": {
      const { caller, callee } = params || {};
      return { success: true, message: "Call initiated", callId: `HODU-${Math.floor(Math.random() * 9000 + 1000)}`, caller, callee, status: "ringing" };
    }
    case "live-stream": {
      const { action: streamAction, callId } = params || {};
      if (streamAction === "start") return { success: true, message: "Live stream started", streamId: `stream-${Date.now()}`, callId, status: "streaming" };
      return { success: true, message: "Live stream stopped", callId, status: "stopped" };
    }
    default:
      return { success: false, error: "Unknown action" };
  }
}

// ─── ENDPOINTS ────────────────────────────────────────────────────────────────

/** POST /api/integrations/hodu/connect */
export async function handleHoduConnect(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const { api_key, api_endpoint, credentials } = await req.json();
    if (!api_key || !api_endpoint) return jsonResponse({ error: "api_key and api_endpoint required" }, 400);
    const existing = await db(sql`SELECT id FROM hodu_connections WHERE company_id = ${user.companyId} LIMIT 1`);
    const id = existing.length > 0 ? existing[0].id : crypto.randomUUID();
    if (existing.length > 0) {
      await db(sql`UPDATE hodu_connections SET api_key = ${api_key}, api_endpoint = ${api_endpoint}, credentials = ${JSON.stringify(credentials || {})}, connected = 1, updated_at = datetime('now') WHERE id = ${id}`);
    } else {
      await db(sql`INSERT INTO hodu_connections (id, company_id, api_key, api_endpoint, credentials, connected) VALUES (${id}, ${user.companyId}, ${api_key}, ${api_endpoint}, ${JSON.stringify(credentials || {})}, 1)`);
    }
    return jsonResponse({ success: true, connection: { id, api_endpoint, connected: true } });
  } catch (e) { return jsonResponse({ error: "Failed to connect" }, 500); }
}

/** POST /api/integrations/hodu/disconnect */
export async function handleHoduDisconnect(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    await db(sql`UPDATE hodu_connections SET connected = 0, api_key = '', updated_at = datetime('now') WHERE company_id = ${user.companyId}`);
    return jsonResponse({ success: true });
  } catch (e) { return jsonResponse({ error: "Failed to disconnect" }, 500); }
}

/** POST /api/integrations/hodu/sync-calls */
export async function handleHoduSyncCalls(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const connections = await db(sql`SELECT * FROM hodu_connections WHERE company_id = ${user.companyId} AND connected = 1 LIMIT 1`);
    if (connections.length === 0) return jsonResponse({ error: "No active Hodu connection" }, 400);
    const conn = connections[0];
    const syncId = crypto.randomUUID();
    await db(sql`INSERT INTO hodu_sync_logs (id, company_id, status, started_at) VALUES (${syncId}, ${user.companyId}, ${"running"}, ${datetime('now')})`);
    const result = await simulateHoduCCApi(conn.api_endpoint, conn.api_key, "get-call-logs");
    let pulled = 0;
    if (result.success) {
      for (const call of result.calls) {
        await db(sql`INSERT INTO hodu_calls (id, company_id, hodu_call_id, caller, callee, duration_seconds, direction, outcome, score, recording_url) VALUES (${crypto.randomUUID()}, ${user.companyId}, ${call.callId}, ${call.caller}, ${call.callee}, ${call.duration}, ${call.direction}, ${call.outcome}, ${call.score}, ${call.recordingUrl})`).catch(() => {});
        pulled++;
      }
    }
    await db(sql`UPDATE hodu_sync_logs SET status = 'completed', calls_pulled = ${pulled}, completed_at = datetime('now') WHERE id = ${syncId}`);
    await db(sql`UPDATE hodu_connections SET last_sync_at = datetime('now') WHERE id = ${conn.id}`);
    return jsonResponse({ success: true, sync: { id: syncId, callsPulled: pulled, status: "completed" } });
  } catch (e) { return jsonResponse({ error: "Failed to sync calls" }, 500); }
}

/** GET /api/integrations/hodu/calls */
export async function handleHoduCalls(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const url = new URL(req.url);
    const direction = url.searchParams.get("direction");
    const outcome = url.searchParams.get("outcome");
    let calls = await db(sql`SELECT * FROM hodu_calls WHERE company_id = ${user.companyId} ORDER BY synced_at DESC LIMIT 50`);
    if (direction) calls = calls.filter((c: any) => c.direction === direction);
    if (outcome) calls = calls.filter((c: any) => c.outcome === outcome);
    return jsonResponse({ calls, total: calls.length, connection: (await db(sql`SELECT id, api_endpoint, connected, last_sync_at FROM hodu_connections WHERE company_id = ${user.companyId} LIMIT 1`))[0] || null });
  } catch (e) { return jsonResponse({ error: "Failed to load calls" }, 500); }
}

/** POST /api/integrations/hodu/click-to-dial */
export async function handleHoduClickToDial(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const connections = await db(sql`SELECT * FROM hodu_connections WHERE company_id = ${user.companyId} AND connected = 1 LIMIT 1`);
    if (connections.length === 0) return jsonResponse({ error: "No active Hodu connection" }, 400);
    const { caller, callee } = await req.json();
    if (!caller || !callee) return jsonResponse({ error: "caller and callee required" }, 400);
    const result = await simulateHoduCCApi(connections[0].api_endpoint, connections[0].api_key, "click-to-dial", { caller, callee });
    return jsonResponse({ ...result, message: "Call initiated from ElevateAI" });
  } catch (e) { return jsonResponse({ error: "Failed to dial" }, 500); }
}

/** POST /api/integrations/hodu/live-stream */
export async function handleHoduLiveStream(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const connections = await db(sql`SELECT * FROM hodu_connections WHERE company_id = ${user.companyId} AND connected = 1 LIMIT 1`);
    if (connections.length === 0) return jsonResponse({ error: "No active Hodu connection" }, 400);
    const { action, call_id } = await req.json();
    if (!action || !["start", "stop"].includes(action)) return jsonResponse({ error: "action must be 'start' or 'stop'" }, 400);
    const result = await simulateHoduCCApi(connections[0].api_endpoint, connections[0].api_key, "live-stream", { action, callId: call_id });
    return jsonResponse(result);
  } catch (e) { return jsonResponse({ error: "Failed to stream" }, 500); }
}

/** GET /api/integrations/hodu/logs */
export async function handleHoduLogs(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const logs = await db(sql`SELECT * FROM hodu_sync_logs WHERE company_id = ${user.companyId} ORDER BY started_at DESC LIMIT 20`);
    return jsonResponse({ logs });
  } catch (e) { return jsonResponse({ error: "Failed to load logs" }, 500); }
}
