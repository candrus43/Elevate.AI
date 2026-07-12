/**
 * Integrations API handlers + Webhook Engine.
 * Manages third-party integrations and provides event-based webhook delivery.
 */

import { sql } from "~/utils/sql";
import { db, jsonResponse, getAuthUser } from "./middleware";

// ─── Integration Providers Catalog ─────────────────────────────────────────────
export const INTEGRATION_PROVIDERS = {
  salesforce: { name: "Salesforce", category: "crm", docs: "https://developer.salesforce.com/docs" },
  hubspot: { name: "HubSpot", category: "crm", docs: "https://developers.hubspot.com" },
  slack: { name: "Slack", category: "communication", docs: "https://api.slack.com" },
  zoom: { name: "Zoom", category: "video", docs: "https://developers.zoom.us" },
  teams: { name: "Microsoft Teams", category: "video", docs: "https://learn.microsoft.com/en-us/graph/teams-concept-overview" },
  ringcentral: { name: "RingCentral", category: "phone", docs: "https://developers.ringcentral.com" },
  five9: { name: "Five9", category: "phone", docs: "https://developer.five9.com" },
  aircall: { name: "Aircall", category: "phone", docs: "https://developer.aircall.io" },
  twilio: { name: "Twilio", category: "phone", docs: "https://www.twilio.com/docs" },
  google: { name: "Google Workspace", category: "productivity", docs: "https://developers.google.com/workspace" },
  microsoft: { name: "Microsoft 365", category: "productivity", docs: "https://learn.microsoft.com/en-us/graph/" },
  calendly: { name: "Calendly", category: "scheduling", docs: "https://developer.calendly.com" },
} as const;

type ProviderKey = keyof typeof INTEGRATION_PROVIDERS;

// ─── GET /api/integrations ─────────────────────────────────────────────────────
export async function handleListIntegrations(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const integrations = await db(sql`
      SELECT i.*, (SELECT COUNT(*) FROM sync_logs WHERE integration_id = i.id) as sync_count,
             (SELECT status FROM sync_logs WHERE integration_id = i.id ORDER BY synced_at DESC LIMIT 1) as last_sync_status
      FROM integrations i
      WHERE i.company_id = ${user.companyId}
      ORDER BY i.provider
    `);

    // Enrich with provider metadata
    const enriched = integrations.map((i: any) => ({
      ...i,
      config: JSON.parse(i.config || "{}"),
      providerInfo: INTEGRATION_PROVIDERS[i.provider as ProviderKey] || { name: i.provider, category: "custom" },
    }));

    return jsonResponse({ integrations: enriched, providers: INTEGRATION_PROVIDERS });
  } catch (e) {
    console.error("list integrations error:", e);
    return jsonResponse({ error: "Failed to list integrations" }, 500);
  }
}

// ─── POST /api/integrations/connect ────────────────────────────────────────────
export async function handleConnectIntegration(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const { provider, credentials, config } = await req.json();
    if (!provider) return jsonResponse({ error: "Provider is required" }, 400);

    if (!INTEGRATION_PROVIDERS[provider as ProviderKey]) {
      return jsonResponse({ error: `Unsupported provider. Supported: ${Object.keys(INTEGRATION_PROVIDERS).join(", ")}` }, 400);
    }

    // Check if already connected
    const existing = await db(sql`SELECT id FROM integrations WHERE company_id = ${user.companyId} AND provider = ${provider}`);
    if (existing.length > 0) {
      // Update existing
      await db(sql`
        UPDATE integrations SET credentials = ${JSON.stringify(credentials || {})}, config = ${JSON.stringify(config || {})}, is_active = 1, updated_at = datetime('now')
        WHERE id = ${existing[0].id}
      `);
      return jsonResponse({ success: true, integration: { id: existing[0].id, provider, is_active: 1 }, message: "Integration updated" });
    }

    const id = crypto.randomUUID();
    await db(sql`
      INSERT INTO integrations (id, company_id, provider, credentials, config)
      VALUES (${id}, ${user.companyId}, ${provider}, ${JSON.stringify(credentials || {})}, ${JSON.stringify(config || {})})
    `);

    // Audit log
    try {
      await db(sql`
        INSERT INTO audit_logs (id, company_id, user_id, action, resource_type, resource_id, details)
        VALUES (${crypto.randomUUID()}, ${user.companyId}, ${user.id}, ${"connect_integration"}, ${"integration"}, ${id}, ${JSON.stringify({ description: `Connected ${provider} integration` })})
      `);
    } catch { /* audit is best-effort */ }

    return jsonResponse({ success: true, integration: { id, provider, is_active: 1 }, message: `${INTEGRATION_PROVIDERS[provider as ProviderKey].name} connected successfully` });
  } catch (e) {
    console.error("connect integration error:", e);
    return jsonResponse({ error: "Failed to connect integration" }, 500);
  }
}

// ─── PUT /api/integrations/:id ─────────────────────────────────────────────────
export async function handleUpdateIntegration(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const integrationId = new URL(req.url).pathname.split("/").pop();
    const { credentials, config, is_active } = await req.json();

    if (credentials) await db(sql`UPDATE integrations SET credentials = ${JSON.stringify(credentials)}, updated_at = datetime('now') WHERE id = ${integrationId} AND company_id = ${user.companyId}`);
    if (config) await db(sql`UPDATE integrations SET config = ${JSON.stringify(config)}, updated_at = datetime('now') WHERE id = ${integrationId} AND company_id = ${user.companyId}`);
    if (is_active !== undefined) await db(sql`UPDATE integrations SET is_active = ${is_active ? 1 : 0}, updated_at = datetime('now') WHERE id = ${integrationId} AND company_id = ${user.companyId}`);

    return jsonResponse({ success: true });
  } catch (e) {
    console.error("update integration error:", e);
    return jsonResponse({ error: "Failed to update integration" }, 500);
  }
}

// ─── DELETE /api/integrations/:id ──────────────────────────────────────────────
export async function handleDeleteIntegration(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const integrationId = new URL(req.url).pathname.split("/").pop();
    await db(sql`DELETE FROM integrations WHERE id = ${integrationId} AND company_id = ${user.companyId}`);

    return jsonResponse({ success: true });
  } catch (e) {
    console.error("delete integration error:", e);
    return jsonResponse({ error: "Failed to delete integration" }, 500);
  }
}

// ─── POST /api/integrations/:id/sync ───────────────────────────────────────────
export async function handleSyncIntegration(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const integrationId = new URL(req.url).pathname.split("/").pop();
    const integration = await db(sql`SELECT * FROM integrations WHERE id = ${integrationId} AND company_id = ${user.companyId}`);
    if (integration.length === 0) return jsonResponse({ error: "Integration not found" }, 404);

    const int = integration[0];
    const provider = int.provider;

    // Simulate sync
    const recordsSynced = Math.floor(Math.random() * 50) + 5;
    const success = Math.random() > 0.1; // 90% success rate

    await db(sql`
      INSERT INTO sync_logs (id, integration_id, status, records_synced, error_message)
      VALUES (${crypto.randomUUID()}, ${integrationId}, ${success ? "success" : "failed"}, ${recordsSynced}, ${success ? "" : "Simulated sync error: API rate limit exceeded"})
    `);

    if (success) {
      await db(sql`UPDATE integrations SET last_sync_at = datetime('now'), updated_at = datetime('now') WHERE id = ${integrationId}`);
    }

    return jsonResponse({
      success,
      recordsSynced: success ? recordsSynced : 0,
      message: success ? `Synced ${recordsSynced} records` : "Sync failed. Check sync logs for details.",
    });
  } catch (e) {
    console.error("sync integration error:", e);
    return jsonResponse({ error: "Failed to sync integration" }, 500);
  }
}

// ─── GET /api/integrations/:id/logs ────────────────────────────────────────────
export async function handleIntegrationLogs(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const integrationId = new URL(req.url).pathname.split("/").pop();
    const logs = await db(sql`
      SELECT * FROM sync_logs WHERE integration_id = ${integrationId}
      ORDER BY synced_at DESC LIMIT 50
    `);

    return jsonResponse({ logs });
  } catch (e) {
    console.error("integration logs error:", e);
    return jsonResponse({ error: "Failed to load logs" }, 500);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// WEBHOOK ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

interface WebhookConfig {
  id: string;
  companyId: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  is_active: boolean;
  headers?: Record<string, string>;
  retry_count?: number;
}

// In-memory webhook registry (also persisted to DB)
const webhookRegistry = new Map<string, WebhookConfig>();

// ─── Initialize webhooks from DB ──────────────────────────────────────────────
export async function loadWebhooks(): Promise<void> {
  try {
    const configs = await db(sql`SELECT * FROM integrations WHERE is_active = 1`);
    for (const cfg of configs) {
      const parsed = JSON.parse(cfg.config || "{}");
      if (parsed.webhooks) {
        for (const wh of parsed.webhooks) {
          webhookRegistry.set(wh.id, {
            id: wh.id,
            companyId: cfg.company_id,
            name: wh.name || cfg.provider,
            url: wh.url,
            events: wh.events || [],
            secret: wh.secret || "",
            is_active: wh.is_active !== false,
            headers: wh.headers || {},
            retry_count: wh.retry_count || 3,
          });
        }
      }
    }
    console.log(`Loaded ${webhookRegistry.size} webhook configurations`);
  } catch (e) {
    console.error("Failed to load webhooks:", e);
  }
}

// ─── Register a webhook ───────────────────────────────────────────────────────
export async function registerWebhook(
  companyId: string,
  integrationId: string,
  name: string,
  url: string,
  events: string[],
  secret?: string,
): Promise<string> {
  const id = crypto.randomUUID();
  const wh: WebhookConfig = {
    id,
    companyId,
    name,
    url,
    events,
    secret: secret || crypto.randomUUID(),
    is_active: true,
    retry_count: 3,
  };

  webhookRegistry.set(id, wh);

  // Persist to integration config
  const integration = await db(sql`SELECT config FROM integrations WHERE id = ${integrationId} AND company_id = ${companyId}`);
  if (integration.length > 0) {
    const config = JSON.parse(integration[0].config || "{}");
    config.webhooks = [...(config.webhooks || []).filter((w: any) => w.id !== id), wh];
    await db(sql`UPDATE integrations SET config = ${JSON.stringify(config)}, updated_at = datetime('now') WHERE id = ${integrationId}`);
  }

  return id;
}

// ─── Deliver webhook event with retry ─────────────────────────────────────────
export async function deliverWebhook(event: string, companyId: string, payload: any): Promise<void> {
  const targets = Array.from(webhookRegistry.values()).filter(
    (wh) => wh.companyId === companyId && wh.is_active && wh.events.includes(event),
  );

  for (const target of targets) {
    // Fire-and-forget delivery with retry
    deliverWithRetry(target, event, payload).catch((err) => console.error(`Webhook delivery failed: ${target.id}`, err));
  }
}

async function deliverWithRetry(target: WebhookConfig, event: string, payload: any, attempt = 1): Promise<void> {
  const maxRetries = target.retry_count || 3;
  const body = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    data: payload,
  });

  // HMAC-SHA256 signature
  const encoder = new TextEncoder();
  const keyData = encoder.encode(target.secret);
  const messageData = encoder.encode(body);
  const cryptoKey = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, messageData)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  try {
    const response = await fetch(target.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": `sha256=${signature}`,
        "X-Webhook-Event": event,
        "X-Webhook-Delivery": crypto.randomUUID(),
        ...target.headers,
      },
      body,
    });

    // Log delivery
    await db(sql`
      INSERT INTO sync_logs (id, integration_id, status, records_synced, error_message)
      VALUES (${crypto.randomUUID()}, ${target.id}, ${response.ok ? "success" : "failed"}, ${1}, ${response.ok ? "" : `HTTP ${response.status}: ${response.statusText}`})
    `);

    if (!response.ok && attempt < maxRetries) {
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt - 1) * 1000;
      console.log(`Webhook delivery failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
      return deliverWithRetry(target, event, payload, attempt + 1);
    }
  } catch (err) {
    console.error(`Webhook delivery error (attempt ${attempt}/${maxRetries}):`, err);
    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise((r) => setTimeout(r, delay));
      return deliverWithRetry(target, event, payload, attempt + 1);
    }

    await db(sql`
      INSERT INTO sync_logs (id, integration_id, status, records_synced, error_message)
      VALUES (${crypto.randomUUID()}, ${target.id}, ${"failed"}, ${0}, ${"Max retries exceeded: " + (err instanceof Error ? err.message : "Unknown error")})
    `);
  }
}

// ─── Webhook API Routes ────────────────────────────────────────────────────────

// ─── GET /api/webhooks ─────────────────────────────────────────────────────────
export async function handleListWebhooks(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const companyWebhooks = Array.from(webhookRegistry.values()).filter((wh) => wh.companyId === user.companyId);
    return jsonResponse({ webhooks: companyWebhooks });
  } catch (e) {
    console.error("list webhooks error:", e);
    return jsonResponse({ error: "Failed to list webhooks" }, 500);
  }
}

// ─── POST /api/webhooks/register ───────────────────────────────────────────────
export async function handleRegisterWebhook(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (user.role !== "admin") return jsonResponse({ error: "Only admins can register webhooks" }, 403);

    const { integration_id, name, url, events, secret } = await req.json();
    if (!integration_id || !url || !events?.length) return jsonResponse({ error: "integration_id, url, and events required" }, 400);

    // Verify integration belongs to company
    const integration = await db(sql`SELECT id FROM integrations WHERE id = ${integration_id} AND company_id = ${user.companyId}`);
    if (integration.length === 0) return jsonResponse({ error: "Integration not found" }, 404);

    const id = await registerWebhook(user.companyId, integration_id, name || "Webhook", url, events, secret);

    return jsonResponse({ success: true, webhook: { id, name: name || "Webhook", url, events, is_active: true } });
  } catch (e) {
    console.error("register webhook error:", e);
    return jsonResponse({ error: "Failed to register webhook" }, 500);
  }
}

// ─── PUT /api/webhooks/:id ─────────────────────────────────────────────────────
export async function handleUpdateWebhook(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const webhookId = new URL(req.url).pathname.split("/").pop();
    const wh = webhookRegistry.get(webhookId || "");
    if (!wh || wh.companyId !== user.companyId) return jsonResponse({ error: "Webhook not found" }, 404);

    const { name, url, events, is_active, secret } = await req.json();

    if (name) wh.name = name;
    if (url) wh.url = url;
    if (events) wh.events = events;
    if (is_active !== undefined) wh.is_active = is_active;
    if (secret) wh.secret = secret;

    return jsonResponse({ success: true });
  } catch (e) {
    console.error("update webhook error:", e);
    return jsonResponse({ error: "Failed to update webhook" }, 500);
  }
}

// ─── DELETE /api/webhooks/:id ──────────────────────────────────────────────────
export async function handleDeleteWebhook(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const webhookId = new URL(req.url).pathname.split("/").pop();
    const wh = webhookRegistry.get(webhookId || "");
    if (!wh || wh.companyId !== user.companyId) return jsonResponse({ error: "Webhook not found" }, 404);

    webhookRegistry.delete(webhookId || "");
    return jsonResponse({ success: true });
  } catch (e) {
    console.error("delete webhook error:", e);
    return jsonResponse({ error: "Failed to delete webhook" }, 500);
  }
}

// ─── POST /api/webhooks/test ────────────────────────────────────────────────────
export async function handleTestWebhook(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const { url, secret } = await req.json();
    if (!url) return jsonResponse({ error: "url required" }, 400);

    const testPayload = {
      event: "webhook.test",
      timestamp: new Date().toISOString(),
      data: { message: "This is a test webhook from ElevateAI" },
    };

    // Create a temporary webhook config just for the test
    const tempWh: WebhookConfig = {
      id: crypto.randomUUID(),
      companyId: user.companyId,
      name: "Test",
      url,
      events: ["*"],
      secret: secret || "test-secret",
      is_active: true,
      retry_count: 0, // no retries for test
    };

    // Send the test (with timeout)
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const encoder = new TextEncoder();
      const body = JSON.stringify(testPayload);
      const keyData = encoder.encode(tempWh.secret);
      const messageData = encoder.encode(body);
      const cryptoKey = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      const signature = Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, messageData)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": `sha256=${signature}`,
          "X-Webhook-Event": "webhook.test",
          "X-Webhook-Delivery": crypto.randomUUID(),
        },
        body,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      return jsonResponse({ success: response.ok, statusCode: response.status, message: response.ok ? "Webhook delivered successfully" : `HTTP ${response.status}` });
    } catch (err) {
      return jsonResponse({ success: false, message: err instanceof Error ? err.message : "Connection failed" }, 400);
    }
  } catch (e) {
    console.error("test webhook error:", e);
    return jsonResponse({ error: "Failed to test webhook" }, 500);
  }
}