/**
 * Notifications API — Slack webhooks, notification preferences, and event-triggered dispatch.
 */

import { sql } from "~/utils/sql";
import { db, jsonResponse, getAuthUser } from "./middleware";

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
export async function handleTestSlackWebhook(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const hookId = new URL(req.url).pathname.split("/").pop();
    const hooks = await db(sql`SELECT * FROM slack_webhooks WHERE id = ${hookId} AND company_id = ${user.companyId}`);
    if (hooks.length === 0) return jsonResponse({ error: "Webhook not found" }, 404);

    const hook = hooks[0];
    const payload = {
      text: `🔔 *ElevateAI Test Notification*\n\nThis is a test from *ElevateAI* for *${user.companyName}*.\n\n✅ Webhook configured by: ${user.name}\n📡 Channel: ${hook.channel || "default"}\n🕐 Time: ${new Date().toISOString()}`,
      username: "ElevateAI",
      icon_emoji: ":rocket:",
    };

    try {
      const response = await fetch(hook.webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      await db(sql`UPDATE slack_webhooks SET last_test_at = datetime('now') WHERE id = ${hookId}`);

      if (response.ok) {
        return jsonResponse({ success: true, message: "Test notification sent successfully!" });
      } else {
        return jsonResponse({ success: false, message: `Slack returned HTTP ${response.status}` }, 400);
      }
    } catch (err) {
      return jsonResponse({ success: false, message: "Failed to reach Slack: " + (err instanceof Error ? err.message : "Connection error") }, 400);
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
 * Dispatch a notification to all configured channels for the given event.
 * Currently supports Slack webhooks. Extensible for email/SMS/etc.
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

    // 3. Send to each matching webhook
    for (const hook of matchingHooks) {
      const slackPayload = {
        text: `*${title}*\n\n${message}`,
        username: "ElevateAI",
        icon_emoji: getEventEmoji(event),
        attachments: Object.keys(metadata).length > 0
          ? [{ color: getEventColor(event), fields: Object.entries(metadata).map(([k, v]) => ({ title: k, value: String(v), short: true })) }]
          : undefined,
      };

      try {
        await fetch(hook.webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(slackPayload),
        });
      } catch (err) {
        console.error(`Failed to send Slack notification to ${hook.webhook_url}:`, err);
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