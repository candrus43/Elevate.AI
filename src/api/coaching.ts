/**
 * Coaching API handlers: roleplay and AI-generated coaching plans.
 */

import { sql } from "~/utils/sql";
import { startSession, processMessage, getScenarios, getScenarioById } from "~/utils/roleplay-engine";
import { generateCoachingPlan, analyzeWeaknesses } from "~/utils/coaching-generator";
import { db, jsonResponse, getAuthUser } from "./middleware";

// ─── In-memory role-play sessions (ephemeral, resets on restart) ───────────────
const roleplaySessions = new Map<string, any>();

// ─── GET /api/roleplay/scenarios ───────────────────────────────────────────────
export async function handleRoleplayScenarios(_req: Request): Promise<Response> {
  return jsonResponse({ scenarios: getScenarios() });
}

// ─── POST /api/roleplay/start ──────────────────────────────────────────────────
export async function handleRoleplayStart(req: Request): Promise<Response> {
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
  } catch (e) {
    console.error("roleplay start error:", e);
    return jsonResponse({ error: "Failed to start session" }, 500);
  }
}

// ─── POST /api/roleplay/message ────────────────────────────────────────────────
export async function handleRoleplayMessage(req: Request): Promise<Response> {
  try {
    const { sessionId, message } = await req.json();
    if (!sessionId || !message) return jsonResponse({ error: "sessionId and message required" }, 400);

    const state = roleplaySessions.get(sessionId);
    if (!state) return jsonResponse({ error: "Session not found" }, 404);

    const { state: newState, response } = processMessage(state, message);
    roleplaySessions.set(sessionId, newState);

    return jsonResponse({
      message: response.message,
      score: response.score,
      feedback: response.feedback,
      stage: response.stage,
      turn: response.turn,
      isComplete: response.isComplete,
      overallScore: response.overallScore,
      summaryFeedback: response.summaryFeedback,
    });
  } catch (e) {
    console.error("roleplay message error:", e);
    return jsonResponse({ error: "Failed to process message" }, 500);
  }
}

// ─── POST /api/roleplay/end ────────────────────────────────────────────────────
export async function handleRoleplayEnd(req: Request): Promise<Response> {
  try {
    const { sessionId } = await req.json();
    if (!sessionId) return jsonResponse({ error: "sessionId required" }, 400);

    const state = roleplaySessions.get(sessionId);
    if (!state) return jsonResponse({ error: "Session not found" }, 404);

    const scenario = getScenarioById(state.scenarioId);
    const durationSeconds = Math.round((Date.now() - state.startTime) / 1000);
    const overallScore = state.scores.length > 0
      ? Math.round(state.scores.reduce((a: number, b: number) => a + b, 0) / state.scores.length)
      : 0;
    const feedback = state.feedbacks.join("\n\n");

    try {
      const user = await getAuthUser(req);
      if (user && scenario) {
        await db(sql`
          INSERT INTO role_play_sessions (id, company_id, user_id, scenario, score, feedback, duration_seconds)
          VALUES (${crypto.randomUUID()}, ${user.companyId}, ${user.id}, ${scenario.title}, ${overallScore}, ${feedback}, ${durationSeconds})
        `);
      }
    } catch {
      /* persisting roleplay result is not critical */
    }

    roleplaySessions.delete(sessionId);
    return jsonResponse({ score: overallScore, feedback, durationSeconds, totalTurns: state.turn, stage: state.stage });
  } catch (e) {
    console.error("roleplay end error:", e);
    return jsonResponse({ error: "Failed to end session" }, 500);
  }
}

// ─── POST /api/coaching/generate ───────────────────────────────────────────────
export async function handleGenerateCoachingPlan(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const { user_id } = await req.json();
    const targetUserId = user_id || user.id;

    // Get recent call scores
    const callScores = await db(sql`
      SELECT cs.total_score, cs.criteria_scores, cs.scorecard_id, sc.name as scorecard_name
      FROM call_scores cs
      JOIN scorecards sc ON sc.id = cs.scorecard_id
      JOIN calls c ON c.id = cs.call_id
      WHERE c.user_id = ${targetUserId}
      ORDER BY cs.created_at DESC
      LIMIT 10
    `);

    // Analyze weaknesses from criteria scores
    const criteriaWeaknesses: Array<{
      criterionName: string;
      category: string;
      score: number;
      maxScore: number;
      weight: number;
    }> = [];

    for (const cs of callScores) {
      const criteria = await db(sql`
        SELECT name, max_score, weight, category
        FROM scorecard_criteria
        WHERE scorecard_id = ${cs.scorecard_id}
        ORDER BY sort_order
      `);
      const criteriaScores = (() => {
        try {
          return JSON.parse(cs.criteria_scores || "{}");
        } catch {
          return {};
        }
      })();
      for (const c of criteria) {
        const score = criteriaScores[c.name] ?? (cs.total_score / Math.max(1, criteria.length));
        criteriaWeaknesses.push({
          criterionName: c.name,
          category: c.category || "General",
          score,
          maxScore: c.max_score,
          weight: c.weight,
        });
      }
    }

    // Fallback: use overall call analysis scores
    const analyses = await db(sql`
      SELECT overall_score FROM call_analyses ca
      JOIN calls c ON c.id = ca.call_id
      WHERE c.user_id = ${targetUserId}
      ORDER BY ca.created_at DESC
      LIMIT 5
    `);
    const avgScore = analyses.length > 0
      ? analyses.reduce((s: number, a: any) => s + (a.overall_score || 0), 0) / analyses.length
      : 0;

    if (avgScore < 70 && criteriaWeaknesses.length === 0) {
      criteriaWeaknesses.push({
        criterionName: "Overall Call Performance",
        category: "General",
        score: avgScore,
        maxScore: 100,
        weight: 1.0,
      });
    }

    const rep = await db(sql`SELECT name FROM users WHERE id = ${targetUserId}`);
    const repName = rep.length > 0 ? rep[0].name : undefined;

    const weaknesses = analyzeWeaknesses(criteriaWeaknesses);
    const plan = generateCoachingPlan(weaknesses, repName);

    // Persist the coaching plan
    const planId = crypto.randomUUID();
    await db(sql`
      INSERT INTO coaching_plans (id, company_id, user_id, manager_id, title, description, status, created_at)
      VALUES (${planId}, ${user.companyId}, ${targetUserId}, ${user.id}, ${plan.title}, ${plan.description}, ${"active"}, ${"datetime('now')"})
    `);

    for (const item of plan.items) {
      await db(sql`
        INSERT INTO coaching_plan_items (id, coaching_plan_id, title, description, resource_url, status, sort_order)
        VALUES (${crypto.randomUUID()}, ${planId}, ${item.title}, ${item.description}, ${item.resourceUrl || ""}, ${"pending"}, ${item.sortOrder})
      `);
    }

    return jsonResponse({
      success: true,
      plan: {
        id: planId,
        title: plan.title,
        description: plan.description,
        items: plan.items,
        weaknesses: weaknesses.slice(0, 5),
      },
    });
  } catch (e) {
    console.error("coaching generate error:", e);
    return jsonResponse({ error: "Failed to generate coaching plan" }, 500);
  }
}