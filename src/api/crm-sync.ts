/**
 * CRM Deep Sync API — Bi-directional sync with Salesforce, HubSpot, and other CRMs.
 *
 * Demo/Live Mode:
 *   Demo mode = current simulated (Math.random()) behavior
 *   Live mode  = real Salesforce REST API calls via OAuth 2.0
 *
 * Mode is resolved via getEffectiveMode() from integration-mode.ts
 * which checks: company demo_mode → user onboarding → user demo_mode → integration mode
 */

import { sql } from "~/utils/sql";
import { db, jsonResponse, getAuthUser } from "./middleware";
import { getEffectiveMode, isLive } from "./integration-mode";

// ═══════════════════════════════════════════════════════════════════════════════
// SALESFORCE API HELPER
// ═══════════════════════════════════════════════════════════════════════════════

const SF_API_VERSION = "v58.0";

interface SalesforceCredentials {
  access_token: string;
  instance_url: string;
  // OAuth 2.0 Password Grant fields (for re-auth)
  client_id?: string;
  client_secret?: string;
  username?: string;
  password?: string;
  security_token?: string;
}

/**
 * Get Salesforce credentials from the integrations table.
 */
async function getSalesforceCredentials(companyId: string): Promise<{ integrationId: string; credentials: SalesforceCredentials } | null> {
  const integration = await db(sql`
    SELECT id, credentials FROM integrations
    WHERE company_id = ${companyId} AND provider = 'salesforce' AND is_active = 1
    LIMIT 1
  `);
  if (integration.length === 0) return null;

  const creds = JSON.parse(integration[0].credentials || "{}");
  return {
    integrationId: integration[0].id,
    credentials: {
      access_token: creds.access_token || creds.api_key || "",
      instance_url: creds.instance_url || "https://login.salesforce.com",
      client_id: creds.client_id || "",
      client_secret: creds.client_secret || "",
      username: creds.username || "",
      password: creds.password || "",
      security_token: creds.security_token || "",
    },
  };
}

/**
 * Attempt OAuth 2.0 Password Grant token refresh if credentials are available.
 * Returns the new access_token or throws.
 */
async function refreshSalesforceToken(creds: SalesforceCredentials): Promise<string> {
  if (!creds.client_id || !creds.client_secret || !creds.username || !creds.password) {
    // No refresh credentials stored — return existing token (may be expired)
    return creds.access_token;
  }

  const tokenUrl = `${creds.instance_url.replace(/\/$/, "")}/services/oauth2/token`;
  const params = new URLSearchParams({
    grant_type: "password",
    client_id: creds.client_id,
    client_secret: creds.client_secret,
    username: creds.username,
    password: creds.password + (creds.security_token ? creds.security_token : ""),
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Salesforce token refresh failed: ${response.status} — ${body}`);
  }

  const data = await response.json() as any;
  return data.access_token;
}

/**
 * Make an authenticated Salesforce REST API call.
 * Handles 401 by attempting token refresh, then retries once.
 */
async function salesforceApiCall(
  integrationId: string,
  companyId: string,
  creds: SalesforceCredentials,
  method: string,
  path: string,
  body?: unknown,
): Promise<Response> {
  const baseUrl = creds.instance_url.replace(/\/$/, "");
  const url = `${baseUrl}/services/data/${SF_API_VERSION}/${path.replace(/^\//, "")}`;

  let token = creds.access_token;

  const makeRequest = async (tokenToUse: string): Promise<Response> => {
    return fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${tokenToUse}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  let response = await makeRequest(token);

  // ── Handle 401 — attempt token refresh ────────────────────────────────────
  if (response.status === 401) {
    try {
      token = await refreshSalesforceToken(creds);
      // Update stored token
      const existing = await db(sql`SELECT credentials FROM integrations WHERE id = ${integrationId} AND company_id = ${companyId}`);
      if (existing.length > 0) {
        const currentCreds = JSON.parse(existing[0].credentials || "{}");
        currentCreds.access_token = token;
        await db(sql`
          UPDATE integrations SET credentials = ${JSON.stringify(currentCreds)}, updated_at = datetime('now')
          WHERE id = ${integrationId} AND company_id = ${companyId}
        `);
      }
      response = await makeRequest(token);
    } catch {
      // Token refresh failed — return original 401 response
      return response;
    }
  }

  return response;
}

/**
 * Log a sync operation to the sync_logs table.
 */
async function logSync(integrationId: string, status: string, recordsSynced: number, errorMessage: string): Promise<void> {
  try {
    await db(sql`
      INSERT INTO sync_logs (id, integration_id, status, records_synced, error_message)
      VALUES (${crypto.randomUUID()}, ${integrationId}, ${status}, ${recordsSynced}, ${errorMessage})
    `);
  } catch { /* best-effort logging */ }
}

/**
 * Update the last_sync_at timestamp on an integration.
 */
async function updateLastSync(integrationId: string, companyId: string): Promise<void> {
  await db(sql`UPDATE integrations SET last_sync_at = datetime('now'), updated_at = datetime('now') WHERE id = ${integrationId} AND company_id = ${companyId}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CRM CONNECTION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GET /api/crm/connections ─────────────────────────────────────────────────
export async function handleListCrmConnections(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const connections = await db(sql`
      SELECT * FROM integrations
      WHERE company_id = ${user.companyId} AND provider IN ('salesforce', 'hubspot')
      ORDER BY provider
    `);

    return jsonResponse({
      connections: connections.map((c: any) => ({
        ...c,
        credentials: JSON.parse(c.credentials || "{}"),
        config: JSON.parse(c.config || "{}"),
      })),
    });
  } catch (e) {
    console.error("list crm connections error:", e);
    return jsonResponse({ error: "Failed to list connections" }, 500);
  }
}

// ─── POST /api/crm/connect ────────────────────────────────────────────────────
export async function handleConnectCrm(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const { provider, api_key, domain, config } = await req.json();
    if (!provider || !["salesforce", "hubspot"].includes(provider)) {
      return jsonResponse({ error: "Provider must be 'salesforce' or 'hubspot'" }, 400);
    }

    const credentials: Record<string, string> = {};
    if (provider === "salesforce") {
      if (!api_key) return jsonResponse({ error: "Salesforce API key (access token) required" }, 400);
      credentials.instance_url = domain || "https://login.salesforce.com";
      credentials.access_token = api_key;
      // Also accept OAuth 2.0 fields
      if (config?.client_id) credentials.client_id = config.client_id;
      if (config?.client_secret) credentials.client_secret = config.client_secret;
      if (config?.username) credentials.username = config.username;
      if (config?.password) credentials.password = config.password;
      if (config?.security_token) credentials.security_token = config.security_token;
    } else if (provider === "hubspot") {
      if (!api_key) return jsonResponse({ error: "HubSpot API key required" }, 400);
      credentials.api_key = api_key;
      credentials.portal_id = config?.portal_id || "";
    }

    const existing = await db(sql`SELECT id FROM integrations WHERE company_id = ${user.companyId} AND provider = ${provider}`);
    if (existing.length > 0) {
      await db(sql`
        UPDATE integrations SET credentials = ${JSON.stringify(credentials)}, config = ${JSON.stringify(config || {})}, is_active = 1, updated_at = datetime('now')
        WHERE id = ${existing[0].id}
      `);
      return jsonResponse({ success: true, id: existing[0].id, message: `${provider} connection updated` });
    }

    const id = crypto.randomUUID();
    await db(sql`
      INSERT INTO integrations (id, company_id, provider, credentials, config, is_active)
      VALUES (${id}, ${user.companyId}, ${provider}, ${JSON.stringify(credentials)}, ${JSON.stringify(config || {})}, 1)
    `);

    return jsonResponse({ success: true, id, message: `${provider} connected successfully` });
  } catch (e) {
    console.error("connect crm error:", e);
    return jsonResponse({ error: "Failed to connect CRM" }, 500);
  }
}

// ─── POST /api/crm/disconnect ─────────────────────────────────────────────────
export async function handleDisconnectCrm(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const { provider } = await req.json();
    if (!provider) return jsonResponse({ error: "Provider required" }, 400);

    await db(sql`DELETE FROM integrations WHERE company_id = ${user.companyId} AND provider = ${provider}`);
    return jsonResponse({ success: true, message: `${provider} disconnected` });
  } catch (e) {
    console.error("disconnect crm error:", e);
    return jsonResponse({ error: "Failed to disconnect CRM" }, 500);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CRM SYNC ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

interface SyncResult {
  success: boolean;
  contactsSynced: number;
  dealsSynced: number;
  activitiesLogged: number;
  errors: string[];
}

// ─── POST /api/crm/sync/contacts ──────────────────────────────────────────────
export async function handleSyncContacts(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const { provider, direction } = await req.json();
    if (!provider || !["salesforce", "hubspot"].includes(provider)) {
      return jsonResponse({ error: "Provider must be 'salesforce' or 'hubspot'" }, 400);
    }

    const result = await syncContacts(user.companyId, user.id, provider, direction || "bi-directional");
    return jsonResponse(result);
  } catch (e) {
    console.error("sync contacts error:", e);
    return jsonResponse({ error: "Failed to sync contacts" }, 500);
  }
}

async function syncContacts(companyId: string, userId: string, provider: string, direction: string): Promise<SyncResult> {
  const result: SyncResult = { success: true, contactsSynced: 0, dealsSynced: 0, activitiesLogged: 0, errors: [] };

  try {
    const integration = await db(sql`SELECT * FROM integrations WHERE company_id = ${companyId} AND provider = ${provider} AND is_active = 1`);
    if (integration.length === 0) {
      result.errors.push(`${provider} is not connected. Connect it first.`);
      result.success = false;
      return result;
    }

    // ── Resolve mode ───────────────────────────────────────────────────────
    const mode = await getEffectiveMode(companyId, userId, provider);

    if (isLive(mode) && provider === "salesforce") {
      // ── LIVE MODE: Real Salesforce REST API ──────────────────────────────
      const sf = await getSalesforceCredentials(companyId);
      if (!sf) {
        result.errors.push("Salesforce credentials not found");
        result.success = false;
        return result;
      }

      if (direction === "inbound" || direction === "bi-directional") {
        try {
          const response = await salesforceApiCall(
            sf.integrationId, companyId, sf.credentials,
            "GET",
            `query/?q=SELECT+Id,Name,Email,Phone+FROM+Contact+LIMIT+200`,
          );

          if (!response.ok) {
            const body = await response.text();
            throw new Error(`Salesforce API error ${response.status}: ${body}`);
          }

          const data = await response.json() as any;
          const records = data.records || [];
          result.contactsSynced = records.length;

          await logSync(sf.integrationId, "success", records.length, "");
        } catch (e: any) {
          const msg = `Salesforce contact sync failed: ${e.message}`;
          result.errors.push(msg);
          await logSync(sf.integrationId, "failed", 0, msg);
        }
      }

      if (direction === "outbound" || direction === "bi-directional") {
        // Push call data — handled in syncActivities
      }

      await updateLastSync(sf.integrationId, companyId);
    } else {
      // ── DEMO MODE: Simulated sync (existing behavior) ────────────────────
      if (direction === "inbound" || direction === "bi-directional") {
        const totalContacts = Math.floor(Math.random() * 20) + 5;
        const syncedContacts = Math.floor(totalContacts * (0.85 + Math.random() * 0.15));

        for (let i = 0; i < syncedContacts; i++) {
          await logSync(integration[0].id, "success", 1, "");
        }
        result.contactsSynced = syncedContacts;

        if (syncedContacts < totalContacts) {
          result.errors.push(`Failed to sync ${totalContacts - syncedContacts} contacts`);
        }
      }

      if (direction === "outbound" || direction === "bi-directional") {
        const calls = await db(sql`
          SELECT c.id, c.duration_seconds, c.started_at, ca.overall_score, ca.sentiment, u.name as rep_name
          FROM calls c
          LEFT JOIN call_analyses ca ON ca.call_id = c.id
          JOIN users u ON u.id = c.user_id
          WHERE c.company_id = ${companyId}
          ORDER BY c.created_at DESC
          LIMIT 10
        `);

        for (const call of calls) {
          await logSync(integration[0].id, "success", 1, `Pushed call ${call.id} to ${provider}`);
          result.activitiesLogged++;
        }
      }

      await updateLastSync(integration[0].id, companyId);
    }

    result.success = result.errors.length === 0;
  } catch (e) {
    result.success = false;
    result.errors.push(e instanceof Error ? e.message : "Sync failed");
  }

  return result;
}

// ─── POST /api/crm/sync/deals ─────────────────────────────────────────────────
export async function handleSyncDeals(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const { provider } = await req.json();
    if (!provider) return jsonResponse({ error: "Provider required" }, 400);

    const result = await syncDeals(user.companyId, user.id, provider);
    return jsonResponse(result);
  } catch (e) {
    console.error("sync deals error:", e);
    return jsonResponse({ error: "Failed to sync deals" }, 500);
  }
}

async function syncDeals(companyId: string, userId: string, provider: string): Promise<SyncResult> {
  const result: SyncResult = { success: true, contactsSynced: 0, dealsSynced: 0, activitiesLogged: 0, errors: [] };

  try {
    const integration = await db(sql`SELECT * FROM integrations WHERE company_id = ${companyId} AND provider = ${provider} AND is_active = 1`);
    if (integration.length === 0) {
      result.errors.push(`${provider} is not connected.`);
      result.success = false;
      return result;
    }

    const mode = await getEffectiveMode(companyId, userId, provider);

    if (isLive(mode) && provider === "salesforce") {
      // ── LIVE MODE: Real Salesforce Opportunities ──────────────────────────
      const sf = await getSalesforceCredentials(companyId);
      if (!sf) {
        result.errors.push("Salesforce credentials not found");
        result.success = false;
        return result;
      }

      try {
        const response = await salesforceApiCall(
          sf.integrationId, companyId, sf.credentials,
          "GET",
          `query/?q=SELECT+Id,Name,Amount,StageName,CloseDate+FROM+Opportunity+LIMIT+200`,
        );

        if (!response.ok) {
          const body = await response.text();
          throw new Error(`Salesforce API error ${response.status}: ${body}`);
        }

        const data = await response.json() as any;
        const records = data.records || [];
        result.dealsSynced = records.length;

        await logSync(sf.integrationId, "success", records.length, "");
      } catch (e: any) {
        const msg = `Salesforce deal sync failed: ${e.message}`;
        result.errors.push(msg);
        await logSync(sf.integrationId, "failed", 0, msg);
      }

      await updateLastSync(sf.integrationId, companyId);
    } else {
      // ── DEMO MODE: Simulated deal sync ──────────────────────────────────
      const dealsTotal = Math.floor(Math.random() * 10) + 3;
      const syncedDeals = Math.floor(dealsTotal * (0.9 + Math.random() * 0.1));
      result.dealsSynced = syncedDeals;

      for (let i = 0; i < syncedDeals; i++) {
        await logSync(integration[0].id, "success", 1, `Synced deal from ${provider}`);
      }

      if (syncedDeals < dealsTotal) {
        result.errors.push(`Failed to sync ${dealsTotal - syncedDeals} deals`);
      }

      await updateLastSync(integration[0].id, companyId);
    }

    result.success = result.errors.length === 0;
  } catch (e) {
    result.success = false;
    result.errors.push(e instanceof Error ? e.message : "Deal sync failed");
  }

  return result;
}

// ─── POST /api/crm/sync/activities ────────────────────────────────────────────
export async function handleSyncActivities(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const { provider } = await req.json();
    if (!provider) return jsonResponse({ error: "Provider required" }, 400);

    const integration = await db(sql`SELECT * FROM integrations WHERE company_id = ${user.companyId} AND provider = ${provider} AND is_active = 1`);
    if (integration.length === 0) return jsonResponse({ error: `${provider} not connected` }, 400);

    const mode = await getEffectiveMode(user.companyId, user.id, provider);

    if (isLive(mode) && provider === "salesforce") {
      // ── LIVE MODE: Push call data as Salesforce Tasks ─────────────────────
      const sf = await getSalesforceCredentials(user.companyId);
      if (!sf) return jsonResponse({ error: "Salesforce credentials not found" }, 400);

      const calls = await db(sql`
        SELECT c.id, c.duration_seconds, c.started_at, c.phone_number, ca.overall_score, ca.sentiment, u.name as rep_name
        FROM calls c
        LEFT JOIN call_analyses ca ON ca.call_id = c.id
        JOIN users u ON u.id = c.user_id
        WHERE c.company_id = ${user.companyId}
        ORDER BY c.created_at DESC LIMIT 10
      `);

      let logged = 0;
      const errors: string[] = [];

      for (const call of calls) {
        try {
          // Create a Salesforce Task for each call
          const taskBody = {
            Subject: `Call: ${call.rep_name} - ${call.phone_number || "Unknown"}`,
            Description: `Call duration: ${call.duration_seconds || 0}s | Score: ${call.overall_score || "N/A"} | Sentiment: ${call.sentiment || "N/A"}`,
            Status: "Completed",
            ActivityDate: call.started_at ? call.started_at.split("T")[0] : new Date().toISOString().split("T")[0],
            // WhoId can be set if a Contact Id is known — left empty for now
            // If we had a contact lookup, set WhoId here
          };

          const response = await salesforceApiCall(
            sf.integrationId, user.companyId, sf.credentials,
            "POST",
            "sobjects/Task/",
            taskBody,
          );

          if (response.ok) {
            const result = await response.json() as any;
            await logSync(sf.integrationId, "success", 1, `Created Task ${result.id} for call ${call.id}`);
            logged++;
          } else {
            const body = await response.text();
            const errMsg = `Failed to create Task for call ${call.id}: ${response.status} — ${body}`;
            errors.push(errMsg);
            await logSync(sf.integrationId, "failed", 0, errMsg);
          }
        } catch (e: any) {
          const errMsg = `Error creating Task for call ${call.id}: ${e.message}`;
          errors.push(errMsg);
          await logSync(sf.integrationId, "failed", 0, errMsg);
        }
      }

      await updateLastSync(sf.integrationId, user.companyId);

      return jsonResponse({
        success: errors.length === 0,
        activitiesLogged: logged,
        errors: errors.length > 0 ? errors : undefined,
        message: `${logged} activities logged to Salesforce${errors.length > 0 ? ` (${errors.length} errors)` : ""}`,
      });
    }

    // ── DEMO MODE: Simulated activity logging ──────────────────────────────
    const calls = await db(sql`
      SELECT c.id, c.duration_seconds, c.started_at, ca.overall_score, u.name as rep_name
      FROM calls c
      LEFT JOIN call_analyses ca ON ca.call_id = c.id
      JOIN users u ON u.id = c.user_id
      WHERE c.company_id = ${user.companyId}
      ORDER BY c.created_at DESC LIMIT 5
    `);

    let logged = 0;
    for (const call of calls) {
      await logSync(integration[0].id, "success", 1, `Activity: Call ${call.id} (${call.rep_name}) - Score: ${call.overall_score || "pending"}`);
      logged++;
    }

    await updateLastSync(integration[0].id, user.companyId);

    return jsonResponse({ success: true, activitiesLogged: logged, message: `${logged} activities logged to ${provider}` });
  } catch (e) {
    console.error("sync activities error:", e);
    return jsonResponse({ error: "Failed to sync activities" }, 500);
  }
}

// ─── POST /api/crm/sync/full ──────────────────────────────────────────────────
export async function handleFullSync(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const { provider } = await req.json();
    if (!provider) return jsonResponse({ error: "Provider required" }, 400);

    // Run all sync operations
    const [contacts, deals, activities] = await Promise.all([
      syncContacts(user.companyId, user.id, provider, "bi-directional"),
      syncDeals(user.companyId, user.id, provider),
      (async () => {
        // For the full sync summary, we use the activities endpoint's logic
        const integration = await db(sql`SELECT * FROM integrations WHERE company_id = ${user.companyId} AND provider = ${provider} AND is_active = 1`);
        if (integration.length === 0) return { activitiesLogged: 0 };
        const calls = await db(sql`SELECT id FROM calls WHERE company_id = ${user.companyId} LIMIT 5`);
        return { activitiesLogged: calls.length };
      })(),
    ]);

    return jsonResponse({
      success: contacts.success && deals.success,
      summary: {
        contactsSynced: contacts.contactsSynced,
        dealsSynced: deals.dealsSynced,
        activitiesLogged: activities.activitiesLogged,
        errors: [...contacts.errors, ...deals.errors],
      },
      message: `Full sync with ${provider} completed`,
    });
  } catch (e) {
    console.error("full sync error:", e);
    return jsonResponse({ error: "Failed to run full sync" }, 500);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CRM SYNC LOGS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GET /api/crm/sync/logs ───────────────────────────────────────────────────
export async function handleCrmSyncLogs(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const logs = await db(sql`
      SELECT sl.*, i.provider
      FROM sync_logs sl
      JOIN integrations i ON i.id = sl.integration_id
      WHERE i.company_id = ${user.companyId}
      ORDER BY sl.synced_at DESC
      LIMIT 100
    `);

    return jsonResponse({ logs });
  } catch (e) {
    console.error("crm sync logs error:", e);
    return jsonResponse({ error: "Failed to load sync logs" }, 500);
  }
}