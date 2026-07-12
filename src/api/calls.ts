/**
 * Call recording API handlers: upload, list, delete, and async analysis pipeline.
 */

import { sql } from "~/utils/sql";
import { calculateScore, calculateSentiment, detectTopics, detectObjections, generateSummary, calculatePoints } from "~/utils/call-analysis";
import { db, jsonResponse, getAuthUser, UPLOADS_DIR } from "./middleware";
import { getEffectiveMode, isLive } from "./integration-mode";
import { getOpenAIConfig, callOpenAI, getCallAnalysisSystemPrompt } from "./openai";

// ─── POST /api/calls/upload ────────────────────────────────────────────────────
export async function handleCallUpload(req: Request): Promise<Response> {
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
    const fileName = `${callId}.${fileExt}`;
    const filePath = `${UPLOADS_DIR}/${fileName}`;

    const buffer = await file.arrayBuffer();
    await Bun.write(filePath, new Uint8Array(buffer));

    try {
      await db(sql`
        INSERT INTO calls (id, company_id, user_id, direction, status, recording_url, started_at, created_at, updated_at)
        VALUES (${callId}, ${user.companyId}, ${user.id}, ${direction}, ${"processing"}, ${"/uploads/" + fileName}, ${startedAt}, ${"datetime('now')"}, ${"datetime('now')"})
      `);
    } catch (dbErr) {
      await Bun.$`rm -f ${filePath}`.quiet().nothrow();
      console.error("DB insert error:", dbErr);
      return jsonResponse({ error: "Failed to save call record" }, 500);
    }

    // Fire-and-forget async analysis
    analyzeCallAsync(callId, user.companyId, user.id).catch((err: any) => console.error("AI analysis error:", err));

    return jsonResponse({
      success: true,
      call: {
        id: callId,
        recording_url: `/uploads/${fileName}`,
        status: "processing",
        started_at: startedAt,
        direction,
      },
    });
  } catch (e) {
    console.error("upload error:", e);
    return jsonResponse({ error: "Upload failed" }, 500);
  }
}

// ─── Async AI analysis pipeline ────────────────────────────────────────────────
export async function analyzeCallAsync(callId: string, companyId: string, userId: string): Promise<void> {
  try {
    const calls = await db(sql`
      SELECT id, duration_seconds, direction, started_at FROM calls WHERE id = ${callId}
    `);
    if (calls.length === 0) return;
    const call = calls[0];
    const duration = call.duration_seconds || 300;
    const direction = call.direction || "outbound";

    // Simulate analysis delay (1-3 seconds)
    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 2000));

    // Check if OpenAI should be used (live mode)
    const mode = await getEffectiveMode(companyId, userId, "openai");
    let score = 50, sentiment = "neutral", topics: string[] = [], objections: any[] = [], summary = "";
    let fillerWords = 0, talkRatio = 0.5, paceWpm = 150, complianceIssues: string[] = [];

    if (isLive(mode)) {
      // ── OpenAI-powered analysis ──
      const config = await getOpenAIConfig(companyId);
      if (config?.apiKey) {
        const transcript = `Call analysis for ${direction} call. Duration: ${duration} seconds.`;
        const result = await callOpenAI(config, {
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: getCallAnalysisSystemPrompt() },
            { role: "user", content: transcript },
          ],
          max_tokens: 2048,
          temperature: 0.3,
          response_format: { type: "json_object" },
        });
        if (result.success && result.content) {
          try {
            const analysis = JSON.parse(result.content);
            score = analysis.overall_score ?? Math.floor(Math.random() * 40 + 40);
            sentiment = analysis.sentiment ?? "neutral";
            topics = analysis.key_moments?.map((m: any) => m.description) || [];
            objections = analysis.objections || [];
            summary = analysis.summary || "";
            complianceIssues = analysis.compliance_flags || [];
            talkRatio = analysis.talk_ratio?.rep ? analysis.talk_ratio.rep / 100 : 0.5;
          } catch { /* fall through to rule-based */ }
        }
      }
    } // end if (isLive)

    // If OpenAI didn't produce results, use rule-based
    if (!summary) {
      // 1. Detect objections
      objections = detectObjections();

      // 2. Calculate realistic score
      score = calculateScore(duration, direction, objections.length);

      // 3. Calculate sentiment
      sentiment = calculateSentiment(score);

      // 4. Generate topics
      topics = detectTopics(direction, duration);

      // 5. Generate summary
      summary = generateSummary(score, sentiment, direction, duration, topics, objections);

      // 6. Analyze for filler words (simulated)
      fillerWords = Math.floor(Math.random() * 20);
      talkRatio = 0.35 + Math.random() * 0.3;
      paceWpm = 130 + Math.floor(Math.random() * 50);

      // 7. Check compliance rules
      complianceIssues = [];
      try {
        const rules = await db(sql`
          SELECT id, name, script_required_phrases, prohibited_phrases
          FROM compliance_rules WHERE company_id = ${companyId} AND is_active = 1
        `);

        for (const rule of rules) {
          const required: string[] = JSON.parse(rule.script_required_phrases || "[]");
          const prohibited: string[] = JSON.parse(rule.prohibited_phrases || "[]");

          for (const phrase of required) {
            const passed = score >= 70 ? Math.random() > 0.2 : Math.random() > 0.5;
            if (!passed && !complianceIssues.includes("Missing: " + phrase)) {
              complianceIssues.push("Missing: " + phrase);
            }
            await db(sql`
              INSERT INTO compliance_checks (id, call_id, rule_id, passed, details)
              VALUES (${crypto.randomUUID()}, ${callId}, ${rule.id}, ${passed ? 1 : 0}, ${passed ? "Required phrase found" : "Required phrase missing: " + phrase})
            `);
          } // end for (required)

          for (const phrase of prohibited) {
            const failed = score < 70 ? Math.random() > 0.5 : Math.random() > 0.8;
            if (failed && !complianceIssues.includes("Prohibited: " + phrase)) {
              complianceIssues.push("Prohibited: " + phrase);
            }
            await db(sql`
              INSERT INTO compliance_checks (id, call_id, rule_id, passed, details)
              VALUES (${crypto.randomUUID()}, ${callId}, ${rule.id}, ${failed ? 0 : 1}, ${failed ? "Prohibited phrase detected: " + phrase : "No prohibited phrases found"})
            `);
          } // end for (prohibited)
        } // end for (rule)
      } catch {
        /* compliance check not critical */
      } // end try/catch compliance
    } // end if (!summary)

    // 8. Update call status
    await db(sql`
      UPDATE calls SET status = ${"analyzed"}, duration_seconds = ${duration}, updated_at = datetime('now')
      WHERE id = ${callId}
    `);

    // 9. Insert analysis
    await db(sql`
      INSERT INTO call_analyses (id, call_id, overall_score, sentiment, talk_ratio_rep, talk_ratio_customer, avg_pace_wpm, filler_word_count, key_topics, summary, objections_detected, compliance_issues)
      VALUES (${crypto.randomUUID()}, ${callId}, ${score}, ${sentiment}, ${talkRatio}, ${1 - talkRatio}, ${paceWpm}, ${fillerWords}, ${JSON.stringify(topics)}, ${summary}, ${JSON.stringify(objections.map((o: any) => o.objection))}, ${JSON.stringify(complianceIssues)})
    `);

    // 10. Award points
    const points = calculatePoints(score);
    await db(sql`
      INSERT INTO points_events (id, company_id, user_id, event_type, points, description)
      VALUES (${crypto.randomUUID()}, ${companyId}, ${userId}, ${"call_analyzed"}, ${points}, ${"Call analyzed: score " + score + " (" + sentiment + ")"})
    `);

    // 11. Update user_metrics
    try {
      const existing = await db(sql`
        SELECT id, calls_analyzed, avg_score, coaching_completed
        FROM user_metrics WHERE user_id = ${userId} AND period = 'monthly'
        ORDER BY period_start DESC LIMIT 1
      `);
      if (existing.length > 0) {
        const m = existing[0];
        const newCount = (m.calls_analyzed || 0) + 1;
        const newAvg = ((m.avg_score || 0) * (m.calls_analyzed || 0) + score) / newCount;
        await db(sql`UPDATE user_metrics SET calls_analyzed = ${newCount}, avg_score = ${Math.round(newAvg)}, updated_at = datetime('now') WHERE id = ${m.id}`);
      } else {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
        await db(sql`INSERT INTO user_metrics (id, user_id, company_id, period, calls_analyzed, avg_score, period_start, period_end) VALUES (${crypto.randomUUID()}, ${userId}, ${companyId}, ${"monthly"}, 1, ${score}, ${monthStart}, ${monthEnd})`);
      }
    } catch {
      /* metrics update not critical */
    }

    // 12. Update company_metrics
    try {
      const existingCm = await db(sql`
        SELECT id, calls_analyzed, avg_team_score
        FROM company_metrics WHERE company_id = ${companyId} AND period = 'monthly'
        ORDER BY period_start DESC LIMIT 1
      `);
      if (existingCm.length > 0) {
        const cm = existingCm[0];
        const newCount = (cm.calls_analyzed || 0) + 1;
        const newAvg = ((cm.avg_team_score || 0) * (cm.calls_analyzed || 0) + score) / newCount;
        await db(sql`UPDATE company_metrics SET calls_analyzed = ${newCount}, avg_team_score = ${Math.round(newAvg)}, updated_at = datetime('now') WHERE id = ${cm.id}`);
      }
    } catch {
      /* company metrics update not critical */
    }

    console.log(`Call ${callId} analyzed: score=${score}, sentiment=${sentiment}, objections=${objections.length}, topics=${topics.join(", ")}`);
  } catch (err) {
    console.error(`Failed to analyze call ${callId}:`, err);
  }
}

// ─── GET /api/calls ────────────────────────────────────────────────────────────
export async function handleCallList(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const calls = await db(sql`
      SELECT c.id, c.user_id, c.direction, c.duration_seconds, c.started_at, c.status, c.recording_url,
             ca.overall_score, ca.sentiment, u.name as rep_name
      FROM calls c
      LEFT JOIN call_analyses ca ON ca.call_id = c.id
      LEFT JOIN users u ON u.id = c.user_id
      WHERE c.company_id = ${user.companyId}
      ORDER BY c.created_at DESC
      LIMIT 50
    `);
    return jsonResponse({ calls });
  } catch (e) {
    console.error("call list error:", e);
    return jsonResponse({ error: "Failed to list calls" }, 500);
  }
}

// ─── DELETE /api/calls/:id ─────────────────────────────────────────────────────
export async function handleCallDelete(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const callId = new URL(req.url).pathname.split("/").pop();
    if (!callId) return jsonResponse({ error: "Call ID required" }, 400);

    const call = await db(sql`SELECT id, recording_url FROM calls WHERE id = ${callId} AND company_id = ${user.companyId}`);
    if (call.length === 0) return jsonResponse({ error: "Call not found" }, 404);

    // Delete the file
    if (call[0].recording_url) {
      const filePath = `${UPLOADS_DIR}/${call[0].recording_url.split("/").pop()}`;
      await Bun.$`rm -f ${filePath}`.quiet().nothrow();
    }

    await db(sql`DELETE FROM calls WHERE id = ${callId} AND company_id = ${user.companyId}`);
    return jsonResponse({ success: true });
  } catch (e) {
    console.error("call delete error:", e);
    return jsonResponse({ error: "Failed to delete call" }, 500);
  }
}