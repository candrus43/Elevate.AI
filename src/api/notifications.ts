/**
 * Notifications API — Slack webhooks, notification preferences, and event-triggered dispatch.
 * Supports demo/live mode: demo mode logs to audit_logs, live mode sends real Slack webhooks.
 */

import { sql } from "~/utils/sql";
import { db, jsonResponse, getAuthUser } from "./middleware";
import { getEffectiveMode, isLive } from "./integration-mode";

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED — sendSlackWebhook (with rate-limit retry)
// ═══════════════════════════════════════════════════════════════════════════════

interface SlackWebhookResult {
  success: boolean;
  status?: number;
  error?: string;
}

/**
 * Send a payload to a Slack webhook URL with rate-limit handling.
 * Retries on HTTP 429 (Too Many Requests) with exponential backoff.
 * Max 3 retries with delays: 1s, 2s, 4s.
 */
export async function sendSlackWebhook(
  webhookUrl: string,
  payload: Record<string, any>,
): Promise<SlackWebhookResult> {
  const maxRetries = 3;
  let lastError: string | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        return { success: true, status: response.status };
      }

      if (response.status === 429 && attempt < maxRetries) {
        // Rate limited — exponential backoff: 1s, 2s, 4s
        const delayMs = Math.pow(2, attempt) * 1000;
        console.warn(
          `Slack webhook rate limited (429), retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        lastError = `Rate limited (HTTP 429)`;
        continue;
      }

      return {
        success: false,
        status: response.status,
        error: `Slack returned HTTP ${response.status}`,
      };
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Connection error";
      if (attempt < maxRetries) {
        const delayMs = Math.pow(2, attempt) * 1000;
        console.warn(
          `Slack webhook connection error, retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries}): ${lastError}`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  return { success: false, error: lastError || "Failed after retries" };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLACK WEBHOOKS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GET /api/notifications/slack ─────────────────────────────────────────────
export async function handleListSlackWebhooks(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const hooks = await db(sql`
      SELECT * FROM slack_webhooks
      WHERE company_id = ${user.companyId}
      ORDER BY created_at DESC
    `);
    return jsonResponse({ webhooks: hooks.map((h: any) => ({ ...h, events: JSON.parse(h.events || "[]") })) });
  } catch (e) {
    console.error("list slack webhooks error:", e);
    return jsonResponse({ error: "Failed to list webhooks" }, 500);
  }
}

// ─── POST /api/notifications/slack ────────────────────────────────────────────
export async function handleCreateSlackWebhook(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const { name, webhook_url, channel, events } = await req.json();
    if (!name || !webhook_url) return jsonResponse({ error: "Name and webhook_url required" }, 400);
    if (!webhook_url.startsWith("https://hooks.slack.com/")) {
      return jsonResponse({ error: "Invalid Slack webhook URL. Must start with https://hooks.slack.com/" }, 400);
    }

    const id = crypto.randomUUID();
    await db(sql`
      INSERT INTO slack_webhooks (id, company_id, user_id, name, webhook_url, channel, events)
      VALUES (${id}, ${user.companyId}, ${user.id}, ${name}, ${webhook_url}, ${channel || ""}, ${JSON.stringify(events || ["call_analyzed"])})
    `);

    return jsonResponse({ success: true, webhook: { id, name, webhook_url, channel: channel || "", events: events || ["call_analyzed"], is_active: 1 } });
  } catch (e) {
    console.error("create slack webhook error:", e);
    return jsonResponse({ error: "Failed to create webhook" }, 500);
  }
}

// ─── PUT /api/notifications/slack/:id ─────────────────────────────────────────
export async function handleUpdateSlackWebhook(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const hookId = new URL(req.url).pathname.split("/").pop();
    const { name, webhook_url, channel, events, is_active } = await req.json();

    if (name) await db(sql`UPDATE slack_webhooks SET name = ${name}, updated_at = datetime('now') WHERE id = ${hookId} AND company_id = ${user.companyId}`);
    if (webhook_url) await db(sql`UPDATE slack_webhooks SET webhook_url = ${webhook_url}, updated_at = datetime('now') WHERE id = ${hookId} AND company_id = ${user.companyId}`);
    if (channel !== undefined) await db(sql`UPDATE slack_webhooks SET channel = ${channel}, updated_at = datetime('now') WHERE id = ${hookId} AND company_id = ${user.companyId}`);
    if (events) await db(sql`UPDATE slack_webhooks SET events = ${JSON.stringify(events)}, updated_at = datetime('now') WHERE id = ${hookId} AND company_id = ${user.companyId}`);
    if (is_active !== undefined) await db(sql`UPDATE slack_webhooks SET is_active = ${is_active ? 1 : 0}, updated_at = datetime('now') WHERE id = ${hookId} AND company_id = ${user.companyId}`);

    return jsonResponse({ success: true });
  } catch (e) {
    console.error("update slack webhook error:", e);
    return jsonResponse({ error: "Failed to update webhook" }, 500);
  }
}

// ─── DELETE /api/notifications/slack/:id ──────────────────────────────────────
export async function handleDeleteSlackWebhook(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const hookId = new URL(req.url).pathname.split("/").pop();
    await db(sql`DELETE FROM slack_webhooks WHERE id = ${hookId} AND company_id = ${user.companyId}`);
    return jsonResponse({ success: true });
  } catch (e) {
    console.error("delete slack webhook error:", e);
    return jsonResponse({ error: "Failed to delete webhook" }, 500);
  }
}

// ─── POST /api/notifications/slack/:id/test ───────────────────────────────────
/**
 * Test a Slack webhook. In demo mode, logs the test event to audit_logs instead
 * of sending a real message. In live mode, sends the actual Slack message with
 * rate-limit retry handling.
 */
export async function handleTestSlackWebhook(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const hookId = new URL(req.url).pathname.split("/").pop();
    const hooks = await db(sql`SELECT * FROM slack_webhooks WHERE id = ${hookId} AND company_id = ${user.companyId}`);
    if (hooks.length === 0) return jsonResponse({ error: "Webhook not found" }, 404);

    const hook = hooks[0];

    // Resolve mode: company + user level, provider = "slack"
    const mode = await getEffectiveMode(user.companyId, user.id, "slack");

    if (isLive(mode)) {
      // ── LIVE MODE: Send real Slack message ────────────────────────────────
      const payload = {
        text: `🔔 *ElevateAI Test Notification*\n\nThis is a test from *ElevateAI* for *${user.companyName}*.\n\n✅ Webhook configured by: ${user.name}\n📡 Channel: ${hook.channel || "default"}\n🕐 Time: ${new Date().toISOString()}`,
        username: "ElevateAI",
        icon_emoji: ":rocket:",
      };

      const result = await sendSlackWebhook(hook.webhook_url, payload);

      await db(sql`UPDATE slack_webhooks SET last_test_at = datetime('now') WHERE id = ${hookId}`);

      if (result.success) {
        return jsonResponse({ success: true, message: "Test notification sent successfully!" });
      } else {
        return jsonResponse({ success: false, message: result.error || "Failed to send" }, 400);
      }
    } else {
      // ── DEMO MODE: Log to audit_logs and return simulated success ─────────
      await db(sql`
        INSERT INTO audit_logs (id, company_id, user_id, action, resource_type, resource_id, details, created_at)
        VALUES (${crypto.randomUUID()}, ${user.companyId}, ${user.id}, 'test_slack_webhook', 'slack_webhook', ${hookId},
          ${JSON.stringify({
            mode: "demo",
            webhook_name: hook.name,
            channel: hook.channel || "default",
            simulated: true,
            message: "Test notification simulated (demo mode)",
          })},
          datetime('now'))
      `);

      await db(sql`UPDATE slack_webhooks SET last_test_at = datetime('now') WHERE id = ${hookId}`);

      return jsonResponse({
        success: true,
        message: "Test notification logged (demo mode — no real message sent). Switch to live mode to send actual Slack notifications.",
        demo: true,
      });
    }
  } catch (e) {
    console.error("test slack webhook error:", e);
    return jsonResponse({ error: "Failed to test webhook" }, 500);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION PREFERENCES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GET /api/notifications/preferences ────────────────────────────────────────
export async function handleGetNotificationPreferences(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const rows = await db(sql`SELECT * FROM notification_preferences WHERE user_id = ${user.id}`);
    if (rows.length === 0) {
      const id = crypto.randomUUID();
      await db(sql`INSERT INTO notification_preferences (id, user_id) VALUES (${id}, ${user.id})`);
      return jsonResponse({
        preferences: {
          call_analyzed: 1, coaching_assigned: 1, leaderboard_changes: 1,
          call_reviewed: 0, coaching_started: 0, compliance_violation: 0,
          slack_enabled: 0, email_enabled: 1,
        },
      });
    }
    return jsonResponse({ preferences: rows[0] });
  } catch (e) {
    console.error("get notification preferences error:", e);
    return jsonResponse({ error: "Failed to load preferences" }, 500);
  }
}

// ─── PUT /api/notifications/preferences ───────────────────────────────────────
export async function handleUpdateNotificationPreferences(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const { call_analyzed, coaching_assigned, leaderboard_changes, call_reviewed, coaching_started, compliance_violation, slack_enabled, email_enabled } = await req.json();

    await db(sql`
      INSERT INTO notification_preferences (id, user_id, call_analyzed, coaching_assigned, leaderboard_changes, call_reviewed, coaching_started, compliance_violation, slack_enabled, email_enabled)
      VALUES (${crypto.randomUUID()}, ${user.id}, ${call_analyzed ? 1 : 0}, ${coaching_assigned ? 1 : 0}, ${leaderboard_changes ? 1 : 0}, ${call_reviewed ? 1 : 0}, ${coaching_started ? 1 : 0}, ${compliance_violation ? 1 : 0}, ${slack_enabled ? 1 : 0}, ${email_enabled !== false ? 1 : 0})
      ON CONFLICT(user_id) DO UPDATE SET
        call_analyzed = ${call_analyzed ? 1 : 0},
        coaching_assigned = ${coaching_assigned ? 1 : 0},
        leaderboard_changes = ${leaderboard_changes ? 1 : 0},
        call_reviewed = ${call_reviewed ? 1 : 0},
        coaching_started = ${coaching_started ? 1 : 0},
        compliance_violation = ${compliance_violation ? 1 : 0},
        slack_enabled = ${slack_enabled ? 1 : 0},
        email_enabled = ${email_enabled !== false ? 1 : 0},
        updated_at = datetime('now')
    `);

    return jsonResponse({ success: true });
  } catch (e) {
    console.error("update notification preferences error:", e);
    return jsonResponse({ error: "Failed to update preferences" }, 500);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT-TRIGGERED NOTIFICATION DISPATCHER
// ═══════════════════════════════════════════════════════════════════════════════

export type NotificationEvent =
  | "call_analyzed"
  | "call_reviewed"
  | "coaching_assigned"
  | "coaching_started"
  | "compliance_violation"
  | "leaderboard_changes";

/**
 * Build a rich Slack Block Kit message for a notification event.
 */
function buildSlackBlocks(
  event: NotificationEvent,
  title: string,
  message: string,
  metadata: Record<string, any> = {},
) {
  const blocks: any[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${getEventEmoji(event)} ${title}`,
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: message,
      },
    },
  ];

  // Add metadata fields as a section with fields
  const metaEntries = Object.entries(metadata).filter(([, v]) => v !== undefined && v !== null);
  if (metaEntries.length > 0) {
    const fields = metaEntries.map(([k, v]) => ({
      type: "mrkdwn",
      text: `*${formatFieldName(k)}:*\n${String(v)}`,
    }));

    // Slack allows up to 10 fields per section; chunk into groups of 10
    for (let i = 0; i < fields.length; i += 10) {
      blocks.push({
        type: "section",
        fields: fields.slice(i, i + 10),
      });
    }
  }

  // Add dashboard link if present
  if (metadata.dashboardUrl) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `<${metadata.dashboardUrl}|📊 View in ElevateAI Dashboard>`,
      },
    });
  }

  // Footer with branding
  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `🤖 *ElevateAI* — ${new Date().toLocaleString()}`,
      },
    ],
  });

  return blocks;
}

/**
 * Format a camelCase/snake_case field name into a human-readable label.
 */
function formatFieldName(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

/**
 * Dispatch a notification to all configured channels for the given event.
 *
 * In LIVE mode: sends real Slack messages via webhook with Block Kit formatting.
 * In DEMO mode: logs the notification to audit_logs instead.
 *
 * Mode is resolved at the company level (no user context available for dispatch).
 */
export async function dispatchNotification(
  companyId: string,
  event: NotificationEvent,
  title: string,
  message: string,
  metadata: Record<string, any> = {},
): Promise<void> {
  try {
    // 1. Check notification preferences — find users who want this notification
    const prefs = await db(sql`
      SELECT np.user_id, np.slack_enabled
      FROM notification_preferences np
      JOIN users u ON u.id = np.user_id
      WHERE u.company_id = ${companyId}
        AND np.${sqlid(event)} = 1
    `);

    // 2. Find Slack webhooks that handle this event
    const hooks = await db(sql`
      SELECT * FROM slack_webhooks
      WHERE company_id = ${companyId}
        AND is_active = 1
    `);

    const matchingHooks = hooks.filter((h: any) => {
      const events: string[] = JSON.parse(h.events || "[]");
      return events.includes(event) || events.includes("*");
    });

    if (matchingHooks.length === 0) return;

    // 3. Resolve mode at company level (no user context in dispatch)
    //    We use the first user in the company to check mode
    const firstUser = await db(sql`
      SELECT id FROM users WHERE company_id = ${companyId} LIMIT 1
    `);

    let isLiveMode = false;
    if (firstUser.length > 0) {
      const mode = await getEffectiveMode(companyId, firstUser[0].id, "slack");
      isLiveMode = isLive(mode);
    }

    if (isLiveMode) {
      // ── LIVE MODE: Send real Slack messages with Block Kit ────────────────
      const blocks = buildSlackBlocks(event, title, message, metadata);

      for (const hook of matchingHooks) {
        const slackPayload = {
          text: `*${title}*\n\n${message}`,
          username: "ElevateAI",
          icon_emoji: getEventEmoji(event),
          blocks,
        };

        const result = await sendSlackWebhook(hook.webhook_url, slackPayload);
        if (!result.success) {
          console.error(
            `Failed to send Slack notification to ${hook.webhook_url}:`,
            result.error,
          );
        }
      }
    } else {
      // ── DEMO MODE: Log notifications to audit_logs ────────────────────────
      for (const hook of matchingHooks) {
        await db(sql`
          INSERT INTO audit_logs (id, company_id, user_id, action, resource_type, resource_id, details, created_at)
          VALUES (${crypto.randomUUID()}, ${companyId}, NULL, 'notification_demo', 'slack_webhook', ${hook.id},
            ${JSON.stringify({
              mode: "demo",
              event,
              title,
              message,
              metadata,
              webhook_name: hook.name,
              channel: hook.channel || "default",
              simulated: true,
            })},
            datetime('now'))
        `);
      }
    }
  } catch (e) {
    console.error("dispatch notification error:", e);
  }
}

function getEventEmoji(event: string): string {
  const emojis: Record<string, string> = {
    call_analyzed: ":telephone_receiver:",
    call_reviewed: ":white_check_mark:",
    coaching_assigned: ":mortar_board:",
    coaching_started: ":arrow_forward:",
    compliance_violation: ":warning:",
    leaderboard_changes: ":trophy:",
  };
  return emojis[event] || ":bell:";
}

function getEventColor(event: string): string {
  const colors: Record<string, string> = {
    call_analyzed: "#1a73e8",
    call_reviewed: "#34a853",
    coaching_assigned: "#fbbc04",
    coaching_started: "#4285f4",
    compliance_violation: "#ea4335",
    leaderboard_changes: "#ff6d01",
  };
  return colors[event] || "#1a73e8";
}

// Helper for safe identifier in SQL
function sqlid(str: string) {
  return '"' + str.replace(/"/g, '""') + '"';
}
