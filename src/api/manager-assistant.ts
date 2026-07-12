/**
 * Module 1: AI Manager Assistant — Backend API
 * AI-powered assistant for sales managers: daily priorities, rep analysis, coaching recommendations.
 */

import { sql } from "~/utils/sql";
import { db, jsonResponse, getAuthUser } from "./middleware";
import { analyzeWeaknesses } from "~/utils/coaching-generator";

// ═══════════════════════════════════════════════════════════════════════════════
// RULE-BASED AI LOGIC
// ═══════════════════════════════════════════════════════════════════════════════

interface RepProfile {
  id: string;
  name: string;
  avgScore: number;
  totalCalls: number;
  coachingCompleted: number;
  recentScores: number[];
}

/** Analyze rep strengths — identify top-performing skill categories */
function analyzeStrengths(scores: Array<{ category: string; score: number; maxScore: number }>): Array<{ category: string; strengthScore: number }> {
  const categoryScores: Record<string, number[]> = {};
  for (const s of scores) {
    if (!categoryScores[s.category]) categoryScores[s.category] = [];
    categoryScores[s.category].push((s.score / s.maxScore) * 100);
  }
  return Object.entries(categoryScores)
    .map(([category, vals]) => ({ category, strengthScore: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) }))
    .sort((a, b) => b.strengthScore - a.strengthScore);
}

/** Generate daily coaching priorities from team data */
function generateDailyPriorities(teamData: RepProfile[]): Array<{ repId: string; repName: string; priority: string; reason: string; urgency: "high" | "medium" | "low" }> {
  const priorities: Array<{ repId: string; repName: string; priority: string; reason: string; urgency: "high" | "medium" | "low" }> = [];

  for (const rep of teamData) {
    if (rep.avgScore < 60) {
      priorities.push({ repId: rep.id, repName: rep.name, priority: "Critical performance intervention", reason: `Avg score ${rep.avgScore} — well below target`, urgency: "high" });
    } else if (rep.recentScores.length >= 3 && rep.recentScores.slice(-3).every((s) => s < rep.avgScore)) {
      priorities.push({ repId: rep.id, repName: rep.name, priority: "Declining scores — schedule coaching", reason: "3 consecutive calls below average", urgency: "high" });
    } else if (rep.coachingCompleted === 0 && rep.totalCalls > 5) {
      priorities.push({ repId: rep.id, repName: rep.name, priority: "No coaching engagement", reason: `${rep.totalCalls} calls analyzed, 0 coaching sessions completed`, urgency: "medium" });
    } else if (rep.avgScore >= 80) {
      priorities.push({ repId: rep.id, repName: rep.name, priority: "High perfomer — consider advancement", reason: `Strong avg score of ${rep.avgScore}`, urgency: "low" });
    }
  }

  return priorities.sort((a, b) => (a.urgency === "high" ? -1 : b.urgency === "high" ? 1 : 0));
}

/** Generate risk alerts for a repo */
function generateRiskAlerts(rep: RepProfile): Array<{ type: string; severity: string; title: string; description: string }> {
  const alerts: Array<{ type: string; severity: string; title: string; description: string }> = [];

  if (rep.avgScore < 60) {
    alerts.push({ type: "low_score", severity: "high", title: "Critically low average score", description: `Rep's average score is ${rep.avgScore}, well below the 70 minimum target.` });
  }
  if (rep.recentScores.length >= 3) {
    const last3 = rep.recentScores.slice(-3);
    if (last3.every((s) => s < 70)) {
      alerts.push({ type: "declining_scores", severity: "high", title: "Consistently low recent scores", description: `Last 3 calls scored ${last3.join(", ")}. Immediate coaching needed.` });
    }
  }
  if (rep.coachingCompleted === 0 && rep.totalCalls > 10) {
    alerts.push({ type: "low_engagement", severity: "medium", title: "No coaching engagement", description: `Rep has completed ${rep.totalCalls} calls but 0 coaching sessions.` });
  }

  return alerts;
}

/** Generate action plan items based on weaknesses */
function generateActionItems(weaknesses: Array<{ criterionName: string; category: string; weaknessScore: number }>): Array<{ title: string; description: string }> {
  const items: Array<{ title: string; description: string }> = [];
  const topWeaknesses = weaknesses.slice(0, 3);

  for (const w of topWeaknesses) {
    items.push({
      title: `Improve ${w.criterionName}`,
      description: `Focus on ${w.criterionName} (${w.category}). Review playbook, practice with roleplay, shadow a top performer's calls in this area.`,
    });
  }

  items.push({
    title: "Complete recommended training module",
    description: "Based on identified gaps, complete the relevant training course in the Coaching Academy.",
  });

  items.push({
    title: "Schedule weekly coaching session",
    description: "Book a 30-minute coaching session to review progress on these action items and practice skills.",
  });

  return items;
}

/** Generate SMART goal recommendations */
function generateGoalRecommendations(avgScore: number, weaknesses: Array<{ criterionName: string; category: string; weaknessScore: number }>): Array<{ goalType: string; title: string; description: string; target: number; current: number }> {
  const goals: Array<{ goalType: string; title: string; description: string; target: number; current: number }> = [];

  goals.push({
    goalType: "score",
    title: "Improve average call score",
    description: `Increase average call score from ${avgScore} to ${Math.min(100, avgScore + 10)} within 30 days through focused coaching.`,
    target: Math.min(100, avgScore + 10),
    current: avgScore,
  });

  if (weaknesses.length > 0) {
    const topWeakness = weaknesses[0];
    goals.push({
      goalType: "skill",
      title: `Master ${topWeakness.criterionName}`,
      description: `Achieve a score of 80% or higher in ${topWeakness.criterionName} across the next 10 calls.`,
      target: 80,
      current: Math.max(10, 100 - topWeakness.weaknessScore),
    });
  }

  goals.push({
    goalType: "coaching",
    title: "Complete 4 coaching sessions this month",
    description: "Attend and actively participate in at least 4 coaching sessions this month to accelerate skill development.",
    target: 4,
    current: 0,
  });

  return goals;
}

/** Build a daily briefing summary */
async function buildDailyBriefing(companyId: string, managerId: string, teamReps: RepProfile[]): Promise<{
  date: string; summary: string; priorities: any[]; teamSnapshot: { totalReps: number; highPerformers: number; needsImprovement: number; atRisk: number };
}> {
  const priorities = generateDailyPriorities(teamReps);
  const highPerformers = teamReps.filter((r) => r.avgScore >= 80).length;
  const needsImprovement = teamReps.filter((r) => r.avgScore >= 60 && r.avgScore < 80).length;
  const atRisk = teamReps.filter((r) => r.avgScore < 60).length;
  const avgTeamScore = teamReps.length > 0 ? Math.round(teamReps.reduce((s, r) => s + r.avgScore, 0) / teamReps.length) : 0;

  const summary = `Team overview: ${teamReps.length} reps, avg score ${avgTeamScore}. ${atRisk > 0 ? `${atRisk} rep(s) need immediate attention. ` : ""}${highPerformers > 0 ? `${highPerformers} rep(s) performing well.` : ""}`;

  return {
    date: new Date().toISOString().split("T")[0],
    summary,
    priorities,
    teamSnapshot: { totalReps: teamReps.length, highPerformers, needsImprovement, atRisk },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// API ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

const SKILL_CATEGORIES = ["Opening", "Process", "Skills", "Messaging", "Rules", "Soft Skills", "General"];

/** GET /api/manager-assistant/daily-priorities */
export async function handleDailyPriorities(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (user.role !== "admin" && user.role !== "manager") return jsonResponse({ error: "Access denied" }, 403);

    const teamReps = await buildTeamProfiles(user.companyId, user.id);
    const priorities = generateDailyPriorities(teamReps);

    // Persist as insights
    for (const p of priorities) {
      await db(sql`
        INSERT INTO manager_insights (id, company_id, manager_id, insight_type, title, description, priority, rep_id, date)
        VALUES (${crypto.randomUUID()}, ${user.companyId}, ${user.id}, ${"daily_priority"}, ${p.priority}, ${p.reason}, ${p.urgency === "high" ? 3 : p.urgency === "medium" ? 2 : 1}, ${p.repId}, ${new Date().toISOString().split("T")[0]})
      `).catch(() => {});
    }

    return jsonResponse({ priorities, date: new Date().toISOString().split("T")[0] });
  } catch (e) {
    console.error("daily priorities error:", e);
    return jsonResponse({ error: "Failed to generate priorities" }, 500);
  }
}

/** GET /api/manager-assistant/rep-strengths/:repId */
export async function handleRepStrengths(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const repId = new URL(req.url).pathname.split("/").pop();
    const scores = await getRepSkillScores(user.companyId, repId || "");
    const strengths = analyzeStrengths(scores).filter((s) => s.strengthScore >= 70);

    return jsonResponse({ strengths, repId });
  } catch (e) {
    console.error("rep strengths error:", e);
    return jsonResponse({ error: "Failed to analyze strengths" }, 500);
  }
}

/** GET /api/manager-assistant/rep-weaknesses/:repId */
export async function handleRepWeaknesses(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const repId = new URL(req.url).pathname.split("/").pop();
    const scores = await getRepSkillScores(user.companyId, repId || "");
    const allAnalyzed = analyzeStrengths(scores);
    const weaknesses = allAnalyzed.filter((s) => s.strengthScore < 70).sort((a, b) => a.strengthScore - b.strengthScore);

    return jsonResponse({ weaknesses, repId });
  } catch (e) {
    console.error("rep weaknesses error:", e);
    return jsonResponse({ error: "Failed to analyze weaknesses" }, 500);
  }
}

/** GET /api/manager-assistant/coaching-recommendations */
export async function handleCoachingRecommendations(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const teamReps = await buildTeamProfiles(user.companyId, user.id);
    const recommendations: Array<{ repId: string; repName: string; type: string; title: string; description: string; priority: number }> = [];

    for (const rep of teamReps) {
      if (rep.avgScore < 70) {
        recommendations.push({
          repId: rep.id, repName: rep.name, type: "score_improvement",
          title: `Improve ${rep.name}'s call score`,
          description: `Current average: ${rep.avgScore}. Recommend focused coaching on call structure and objection handling.`,
          priority: rep.avgScore < 60 ? 3 : 2,
        });
      }
      if (rep.coachingCompleted === 0 && rep.totalCalls > 5) {
        recommendations.push({
          repId: rep.id, repName: rep.name, type: "coaching_engagement",
          title: `Engage ${rep.name} in coaching`,
          description: `${rep.totalCalls} calls analyzed but no coaching completed. Schedule an initial coaching session.`,
          priority: 2,
        });
      }
      if (rep.avgScore >= 80) {
        recommendations.push({
          repId: rep.id, repName: rep.name, type: "advancement",
          title: `Consider ${rep.name} for advancement`,
          description: `Strong performance (avg ${rep.avgScore}). Consider mentoring opportunities or advanced training.`,
          priority: 1,
        });
      }
    }

    // Persist recommendations
    for (const r of recommendations) {
      await db(sql`
        INSERT INTO coaching_recommendations (id, company_id, manager_id, rep_id, recommendation_type, title, description, priority)
        VALUES (${crypto.randomUUID()}, ${user.companyId}, ${user.id}, ${r.repId}, ${r.type}, ${r.title}, ${r.description}, ${r.priority})
      `).catch(() => {});
    }

    return jsonResponse({ recommendations });
  } catch (e) {
    console.error("coaching recommendations error:", e);
    return jsonResponse({ error: "Failed to generate recommendations" }, 500);
  }
}

/** GET /api/manager-assistant/one-on-one-prep/:repId */
export async function handleOneOnOnePrep(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const repId = new URL(req.url).pathname.split("/").pop();
    const rep = await db(sql`SELECT name FROM users WHERE id = ${repId} AND company_id = ${user.companyId}`);
    if (rep.length === 0) return jsonResponse({ error: "Rep not found" }, 404);

    const scores = await getRepSkillScores(user.companyId, repId || "");
    const strengths = analyzeStrengths(scores).filter((s) => s.strengthScore >= 70).slice(0, 3);
    const weaknesses = analyzeStrengths(scores).filter((s) => s.strengthScore < 70).sort((a, b) => a.strengthScore - b.strengthScore).slice(0, 3);

    const recentCalls = await db(sql`
      SELECT c.id, ca.overall_score, ca.sentiment, c.duration_seconds, c.created_at
      FROM calls c LEFT JOIN call_analyses ca ON ca.call_id = c.id
      WHERE c.user_id = ${repId} ORDER BY c.created_at DESC LIMIT 5
    `);

    const coachingPlans = await db(sql`
      SELECT COUNT(*) as total, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM coaching_plans WHERE user_id = ${repId}
    `);

    const prep = {
      repName: rep[0].name,
      strengths: strengths.map((s) => s.category),
      improvements: weaknesses.map((w) => ({ area: w.category, score: w.strengthScore })),
      topics: weaknesses.length > 0
        ? [`Improving ${weaknesses[0].category} skills`, `Review recent call scores and trends`, `Set goals for next 30 days`]
        : ["Review recent performance", "Set coaching goals"],
      recentCallsNotes: recentCalls.map((c: any) => `Call scored ${c.overall_score || "pending"} (${c.sentiment || "N/A"}) - ${Math.round(c.duration_seconds / 60)}min`).join("\n"),
      coachingProgress: `${coachingPlans[0]?.completed || 0}/${coachingPlans[0]?.total || 0} plans completed`,
      actionItems: generateActionItems(weaknesses.map((w) => ({ criterionName: w.category, category: w.category, weaknessScore: 100 - w.strengthScore }))),
    };

    // Store prep data
    await db(sql`
      INSERT INTO one_on_one_prep (id, company_id, rep_id, manager_id, strengths, improvements, topics, recent_calls_notes, coaching_progress, action_items)
      VALUES (${crypto.randomUUID()}, ${user.companyId}, ${repId}, ${user.id}, ${JSON.stringify(prep.strengths)}, ${JSON.stringify(prep.improvements)}, ${JSON.stringify(prep.topics)}, ${prep.recentCallsNotes}, ${prep.coachingProgress}, ${JSON.stringify(prep.actionItems)})
    `).catch(() => {});

    return jsonResponse({ prep });
  } catch (e) {
    console.error("one-on-one prep error:", e);
    return jsonResponse({ error: "Failed to generate prep data" }, 500);
  }
}

/** GET /api/manager-assistant/coaching-history/:repId */
export async function handleCoachingHistory(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const repId = new URL(req.url).pathname.split("/").pop();
    const plans = await db(sql`
      SELECT cp.id, cp.title, cp.status, cp.created_at, cp.due_date,
             (SELECT COUNT(*) FROM coaching_plan_items WHERE coaching_plan_id = cp.id AND status = 'completed') as items_completed,
             (SELECT COUNT(*) FROM coaching_plan_items WHERE coaching_plan_id = cp.id) as items_total
      FROM coaching_plans cp WHERE cp.user_id = ${repId} ORDER BY cp.created_at DESC
    `);

    const roleplaySessions = await db(sql`
      SELECT scenario, score, duration_seconds, created_at FROM role_play_sessions
      WHERE user_id = ${repId} ORDER BY created_at DESC LIMIT 10
    `);

    const callScores = await db(sql`
      SELECT ca.overall_score, ca.created_at FROM call_analyses ca
      JOIN calls c ON c.id = ca.call_id WHERE c.user_id = ${repId}
      ORDER BY ca.created_at DESC LIMIT 20
    `);

    return jsonResponse({ history: { coachingPlans: plans, roleplaySessions, callScores }, repId });
  } catch (e) {
    console.error("coaching history error:", e);
    return jsonResponse({ error: "Failed to load coaching history" }, 500);
  }
}

/** GET /api/manager-assistant/action-plans */
export async function handleListActionPlans(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const plans = await db(sql`
      SELECT ap.*, u.name as rep_name
      FROM action_plans ap JOIN users u ON u.id = ap.rep_id
      WHERE ap.company_id = ${user.companyId}
      ORDER BY ap.created_at DESC LIMIT 50
    `);

    return jsonResponse({ plans: plans.map((p: any) => ({ ...p, items: JSON.parse(p.items || "[]"), metadata: JSON.parse(p.metadata || "{}") })) });
  } catch (e) {
    console.error("list action plans error:", e);
    return jsonResponse({ error: "Failed to list action plans" }, 500);
  }
}

/** POST /api/manager-assistant/action-plans */
export async function handleCreateActionPlan(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const { rep_id, title, description, items, due_date } = await req.json();
    if (!rep_id || !title) return jsonResponse({ error: "rep_id and title required" }, 400);

    const id = crypto.randomUUID();
    const planItems = items || generateActionItems([]).map((item) => item.title);

    await db(sql`
      INSERT INTO action_plans (id, company_id, rep_id, manager_id, title, description, items, due_date)
      VALUES (${id}, ${user.companyId}, ${rep_id}, ${user.id}, ${title}, ${description || ""}, ${JSON.stringify(planItems)}, ${due_date || null})
    `);

    return jsonResponse({ success: true, plan: { id, title, description: description || "", items: planItems, status: "active" } });
  } catch (e) {
    console.error("create action plan error:", e);
    return jsonResponse({ error: "Failed to create action plan" }, 500);
  }
}

/** GET /api/manager-assistant/goal-recommendations */
export async function handleGoalRecommendations(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const teamReps = await buildTeamProfiles(user.companyId, user.id);
    const allRecommendations: Array<{ repId: string; repName: string; goals: any[] }> = [];

    for (const rep of teamReps) {
      const scores = await getRepSkillScores(user.companyId, rep.id);
      const weaknesses = analyzeStrengths(scores).filter((s) => s.strengthScore < 70).sort((a, b) => a.strengthScore - b.strengthScore);
      const goals = generateGoalRecommendations(
        rep.avgScore,
        weaknesses.map((w) => ({ criterionName: w.category, category: w.category, weaknessScore: 100 - w.strengthScore })),
      );

      allRecommendations.push({ repId: rep.id, repName: rep.name, goals });

      // Persist
      for (const g of goals) {
        await db(sql`
          INSERT INTO goal_recommendations (id, company_id, rep_id, manager_id, goal_type, title, description, target_value, current_value, status)
          VALUES (${crypto.randomUUID()}, ${user.companyId}, ${rep.id}, ${user.id}, ${g.goalType}, ${g.title}, ${g.description}, ${g.target}, ${g.current}, ${"suggested"})
        `).catch(() => {});
      }
    }

    return jsonResponse({ recommendations: allRecommendations });
  } catch (e) {
    console.error("goal recommendations error:", e);
    return jsonResponse({ error: "Failed to generate goals" }, 500);
  }
}

/** GET /api/manager-assistant/rep-risk-alerts */
export async function handleRepRiskAlerts(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const teamReps = await buildTeamProfiles(user.companyId, user.id);
    const allAlerts: Array<{ repId: string; repName: string; alerts: any[] }> = [];

    for (const rep of teamReps) {
      const alerts = generateRiskAlerts(rep);
      if (alerts.length > 0) {
        allAlerts.push({ repId: rep.id, repName: rep.name, alerts });
        // Persist
        for (const a of alerts) {
          await db(sql`
            INSERT INTO rep_risk_alerts (id, company_id, rep_id, alert_type, severity, title, description)
            VALUES (${crypto.randomUUID()}, ${user.companyId}, ${rep.id}, ${a.type}, ${a.severity}, ${a.title}, ${a.description})
          `).catch(() => {});
        }
      }
    }

    return jsonResponse({ alerts: allAlerts });
  } catch (e) {
    console.error("rep risk alerts error:", e);
    return jsonResponse({ error: "Failed to generate risk alerts" }, 500);
  }
}

/** GET /api/manager-assistant/improvement-tracking/:repId */
export async function handleImprovementTracking(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const repId = new URL(req.url).pathname.split("/").pop();

    const tracked = await db(sql`
      SELECT skill_area, score, previous_score, change, date
      FROM improvement_tracking WHERE rep_id = ${repId}
      ORDER BY date DESC LIMIT 50
    `);

    // Aggregate by skill area
    const bySkill: Record<string, { scores: number[]; dates: string[] }> = {};
    for (const t of tracked) {
      if (!bySkill[t.skill_area]) bySkill[t.skill_area] = { scores: [], dates: [] };
      bySkill[t.skill_area].scores.push(t.score);
      bySkill[t.skill_area].dates.push(t.date);
    }

    return jsonResponse({ improvementBySkill: bySkill, rawData: tracked, repId });
  } catch (e) {
    console.error("improvement tracking error:", e);
    return jsonResponse({ error: "Failed to load improvement data" }, 500);
  }
}

/** GET /api/manager-assistant/daily-briefing */
export async function handleDailyBriefing(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (user.role !== "admin" && user.role !== "manager") return jsonResponse({ error: "Access denied" }, 403);

    const teamReps = await buildTeamProfiles(user.companyId, user.id);
    const briefing = await buildDailyBriefing(user.companyId, user.id, teamReps);

    // Track improvement data
    for (const rep of teamReps) {
      await db(sql`
        INSERT INTO improvement_tracking (id, company_id, rep_id, skill_area, score, previous_score, change, date)
        VALUES (${crypto.randomUUID()}, ${user.companyId}, ${rep.id}, ${"overall_score"}, ${rep.avgScore}, ${rep.avgScore}, 0, ${briefing.date})
      `).catch(() => {});
    }

    // Persist briefing
    await db(sql`
      INSERT INTO manager_briefings (id, company_id, manager_id, date, title, summary, priorities, team_snapshot)
      VALUES (${crypto.randomUUID()}, ${user.companyId}, ${user.id}, ${briefing.date}, ${"Daily Briefing - " + briefing.date}, ${briefing.summary}, ${JSON.stringify(briefing.priorities)}, ${JSON.stringify(briefing.teamSnapshot)})
    `).catch(() => {});

    return jsonResponse({ briefing });
  } catch (e) {
    console.error("daily briefing error:", e);
    return jsonResponse({ error: "Failed to generate briefing" }, 500);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

async function buildTeamProfiles(companyId: string, managerId: string): Promise<RepProfile[]> {
  // Get all reps managed by this manager (or all reps if admin)
  const reps = await db(sql`
    SELECT u.id, u.name
    FROM users u
    WHERE u.company_id = ${companyId} AND u.role = 'rep' AND u.is_active = 1
  `);

  const profiles: RepProfile[] = [];

  for (const rep of reps) {
    const analyses = await db(sql`
      SELECT ca.overall_score FROM call_analyses ca
      JOIN calls c ON c.id = ca.call_id
      WHERE c.user_id = ${rep.id}
      ORDER BY ca.created_at DESC LIMIT 10
    `);

    const scores = analyses.map((a: any) => a.overall_score || 0);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((s: number, v: number) => s + v, 0) / scores.length) : 0;

    const coachingPlans = await db(sql`
      SELECT COUNT(*) as total, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM coaching_plans WHERE user_id = ${rep.id}
    `);

    profiles.push({
      id: rep.id,
      name: rep.name,
      avgScore,
      totalCalls: scores.length,
      coachingCompleted: coachingPlans[0]?.completed || 0,
      recentScores: scores.slice(0, 5),
    });
  }

  return profiles;
}

async function getRepSkillScores(companyId: string, repId: string): Promise<Array<{ category: string; score: number; maxScore: number }>> {
  const callScores = await db(sql`
    SELECT cs.criteria_scores, cs.total_score FROM call_scores cs
    JOIN calls c ON c.id = cs.call_id
    WHERE c.user_id = ${repId}
    ORDER BY cs.created_at DESC LIMIT 10
  `);

  const scores: Array<{ category: string; score: number; maxScore: number }> = [];
  for (const cs of callScores) {
    const criteriaScores = (() => { try { return JSON.parse(cs.criteria_scores || "{}"); } catch { return {}; } })();
    const categories = Object.keys(criteriaScores);
    if (categories.length > 0) {
      for (const cat of categories) {
        scores.push({ category: cat, score: criteriaScores[cat] || 0, maxScore: 10 });
      }
    } else {
      // Fallback: use overall score
      scores.push({ category: "General", score: cs.total_score || 0, maxScore: 100 });
    }
  }

  // If no call scores, add default scores for analysis
  if (scores.length === 0) {
    const roleplays = await db(sql`SELECT score FROM role_play_sessions WHERE user_id = ${repId} ORDER BY created_at DESC LIMIT 5`);
    if (roleplays.length > 0) {
      scores.push({ category: "General", score: roleplays.reduce((s: number, r: any) => s + (r.score || 0), 0) / roleplays.length, maxScore: 100 });
    } else {
      // Empty data — provide defaults so strength analysis still works
      scores.push({ category: "General", score: 0, maxScore: 100 });
    }
  }

  return scores;
}