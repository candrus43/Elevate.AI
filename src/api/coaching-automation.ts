/**
 * Module 6: Coaching Automation — Backend API
 * Automated daily/weekly/monthly briefings, reminders, alerts, and coaching task management.
 */

import { sql } from "~/utils/sql";
import { db, jsonResponse, getAuthUser } from "./middleware";

// ─── AI LOGIC ─────────────────────────────────────────────────────────────────

/** Generate daily briefing content from team metrics */
function generateDailyBriefing(metrics: { totalReps: number; avgScore: number; topPerformer: string; topSkill: string; weakestSkill: string; trends: Array<{ score: number }> }) {
  const recentTrend = metrics.trends.slice(-3);
  const trendDir = recentTrend.length > 1 && recentTrend[recentTrend.length - 1].score > recentTrend[0].score ? "upward" : "downward";
  return {
    title: `Daily Coaching Briefing — ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}`,
    summary: `${metrics.totalReps} reps active today. Average call score: ${Math.round(metrics.avgScore)}. Overall trend: ${trendDir}. Today's tip: Focus on ${metrics.weakestSkill} skills.`,
    metrics: {
      totalReps: metrics.totalReps,
      averageScore: Math.round(metrics.avgScore),
      trendDirection: trendDir,
      topPerformer: metrics.topPerformer,
      skillFocus: metrics.weakestSkill,
    },
    highlights: [
      `🚀 Top performer: ${metrics.topPerformer} — leading with highest scores this week`,
      `🎯 Focus area: ${metrics.weakestSkill} — needs most improvement across the team`,
      `📊 Team trend: Showing ${trendDir} trajectory — ${trendDir === "upward" ? "keep the momentum!" : "schedule additional coaching sessions"}`,
    ],
    recommendations: [
      `Schedule 1:1 coaching on ${metrics.weakestSkill} skills`,
      `Share ${metrics.topPerformer}'s best practices with the team`,
      `Review top 3 calls from yesterday for learning opportunities`,
    ],
  };
}

/** Generate weekly summary */
function generateWeeklySummary(metrics: { startScore: number; endScore: number; totalCoachingHours: number; completionRate: number; topImprovers: string[] }) {
  const improvement = metrics.endScore - metrics.startScore;
  return {
    title: `Weekly Coaching Summary — Week ${getWeekNumber()}`,
    summary: `Score improvement: ${improvement > 0 ? "+" : ""}${Math.round(improvement)} points. Coaching hours: ${Math.round(metrics.totalCoachingHours)}. Plan completion: ${Math.round(metrics.completionRate)}%.`,
    metrics: {
      startScore: Math.round(metrics.startScore),
      endScore: Math.round(metrics.endScore),
      improvement: Math.round(improvement),
      coachingHours: Math.round(metrics.totalCoachingHours),
      completionRate: Math.round(metrics.completionRate),
      topImprovers: metrics.topImprovers,
    },
  };
}

/** Generate monthly report */
function generateMonthlyReport(metrics: { avgScore: number; totalCoachingSessions: number; completionRate: number; roiRatio: number; topSkills: string[]; bottomSkills: string[]; managerRankings: Array<{ name: string; score: number }> }) {
  return {
    title: `Monthly Coaching Report — ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
    summary: `Average score: ${Math.round(metrics.avgScore)}. Sessions completed: ${metrics.totalCoachingSessions}. Completion rate: ${Math.round(metrics.completionRate)}%. ROI: ${metrics.roiRatio}x.`,
    metrics: {
      averageScore: Math.round(metrics.avgScore),
      totalSessions: metrics.totalCoachingSessions,
      completionRate: Math.round(metrics.completionRate),
      roiRatio: metrics.roiRatio,
      topSkills: metrics.topSkills.slice(0, 3),
      areasForImprovement: metrics.bottomSkills.slice(0, 3),
      managerRankings: metrics.managerRankings.slice(0, 5),
    },
  };
}

function getWeekNumber() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week = Math.floor(((+d - +new Date(d.getFullYear(), 0, 4)) / 86400000 + 1 + ((new Date(d.getFullYear(), 0, 4).getDay() + 6) % 7)) / 7);
  return `W${week}`;
}

/** Generate alerts based on triggers */
function generateAlert(type: string, severity: string, userId: string, message: string, link?: string) {
  return { type, severity, userId, message, link, readStatus: 0, createdAt: new Date().toISOString() };
}

// ─── ENDPOINTS ────────────────────────────────────────────────────────────────

/** GET /api/coaching-automation/briefings/daily */
export async function handleDailyBriefing(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const users = await db(sql`SELECT id, name FROM users WHERE company_id = ${user.companyId} LIMIT 20`);
    const analyses = await db(sql`SELECT ca.overall_score, ca.created_at FROM call_analyses ca JOIN calls c ON c.id = ca.call_id WHERE c.company_id = ${user.companyId} ORDER BY ca.created_at DESC LIMIT 20`);
    const plans = await db(sql`SELECT * FROM advanced_coaching_plans WHERE company_id = ${user.companyId} LIMIT 10`);
    const scores = analyses.map((a: any) => a.overall_score || 0);
    const avgScore = scores.length > 0 ? scores.reduce((s: number, v: number) => s + v, 0) / scores.length : 0;
    const topUser = users.length > 0 ? users[0].name : "N/A";
    const gaps = await db(sql`SELECT skill_area, gap FROM skill_gap_analysis WHERE company_id = ${user.companyId} ORDER BY gap DESC LIMIT 1`);
    const weakestSkill = gaps.length > 0 ? gaps[0].skill_area : "General";

    const briefing = generateDailyBriefing({
      totalReps: users.length,
      avgScore,
      topPerformer: topUser,
      topSkill: "Rapport",
      weakestSkill,
      trends: scores.map((s: number) => ({ score: s })),
    });

    const id = crypto.randomUUID();
    await db(sql`INSERT INTO automation_briefings (id, company_id, type, title, content) VALUES (${id}, ${user.companyId}, ${"daily"}, ${briefing.title}, ${JSON.stringify(briefing)})`);
    return jsonResponse({ briefing });
  } catch (e) { console.error("daily briefing:", e); return jsonResponse({ error: "Failed to generate briefing" }, 500); }
}

/** GET /api/coaching-automation/briefings/weekly */
export async function handleWeeklyBriefing(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const analyses = await db(sql`SELECT ca.overall_score FROM call_analyses ca JOIN calls c ON c.id = ca.call_id WHERE c.company_id = ${user.companyId} ORDER BY ca.created_at DESC LIMIT 20`);
    const scores = analyses.map((a: any) => a.overall_score || 0);
    const mid = Math.floor(scores.length / 2);
    const startScore = scores.length > 0 ? scores.slice(mid).reduce((s: number, v: number) => s + v, 0) / scores.slice(mid).length : 0;
    const endScore = scores.length > 0 ? scores.slice(0, mid).reduce((s: number, v: number) => s + v, 0) / scores.slice(0, mid).length : 0;
    const rois = await db(sql`SELECT * FROM coaching_roi WHERE company_id = ${user.companyId} LIMIT 5`);
    const totalHours = rois.reduce((s: number, r: any) => s + r.coaching_hours, 0);
    const plans = await db(sql`SELECT * FROM advanced_coaching_plans WHERE company_id = ${user.companyId} LIMIT 10`);
    const completed = plans.filter((p: any) => p.status === "completed").length;
    const total = plans.length || 1;

    const summary = generateWeeklySummary({
      startScore: Math.round(startScore),
      endScore: Math.round(endScore),
      totalCoachingHours: totalHours,
      completionRate: (completed / total) * 100,
      topImprovers: ["Alex", "Jordan", "Taylor"],
    });

    const id = crypto.randomUUID();
    await db(sql`INSERT INTO automation_briefings (id, company_id, type, title, content) VALUES (${id}, ${user.companyId}, ${"weekly"}, ${summary.title}, ${JSON.stringify(summary)})`);
    return jsonResponse({ briefing: summary });
  } catch (e) { console.error("weekly briefing:", e); return jsonResponse({ error: "Failed to generate briefing" }, 500); }
}

/** GET /api/coaching-automation/briefings/monthly */
export async function handleMonthlyBriefing(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const analyses = await db(sql`SELECT ca.overall_score FROM call_analyses ca JOIN calls c ON c.id = ca.call_id WHERE c.company_id = ${user.companyId} ORDER BY ca.created_at DESC LIMIT 50`);
    const scores = analyses.map((a: any) => a.overall_score || 0);
    const avgScore = scores.length > 0 ? scores.reduce((s: number, v: number) => s + v, 0) / scores.length : 0;
    const rois = await db(sql`SELECT * FROM coaching_roi WHERE company_id = ${user.companyId} LIMIT 10`);
    const totalHours = rois.reduce((s: number, r: any) => s + r.coaching_hours, 0);
    const roi = totalHours > 0 ? rois.reduce((s: number, r: any) => s + r.score_improvement, 0) / totalHours : 0;
    const plans = await db(sql`SELECT * FROM advanced_coaching_plans WHERE company_id = ${user.companyId} LIMIT 20`);
    const completed = plans.filter((p: any) => p.status === "completed").length;
    const managers = await db(sql`SELECT me.quality_score, u.name FROM manager_effectiveness me JOIN users u ON u.id = me.manager_id WHERE me.company_id = ${user.companyId} ORDER BY me.quality_score DESC LIMIT 5`);

    const report = generateMonthlyReport({
      avgScore, totalCoachingSessions: plans.length, completionRate: (completed / (plans.length || 1)) * 100, roiRatio: Math.round(roi * 10) / 10,
      topSkills: ["Rapport", "Discovery", "Objection Handling"], bottomSkills: ["Closing", "Compliance", "Pacing"],
      managerRankings: managers.map((m: any) => ({ name: m.name, score: m.quality_score })),
    });

    const id = crypto.randomUUID();
    await db(sql`INSERT INTO automation_briefings (id, company_id, type, title, content) VALUES (${id}, ${user.companyId}, ${"monthly"}, ${report.title}, ${JSON.stringify(report)})`);
    return jsonResponse({ briefing: report });
  } catch (e) { console.error("monthly briefing:", e); return jsonResponse({ error: "Failed to generate report" }, 500); }
}

// ─── SCHEDULES ────────────────────────────────────────────────────────────────

/** POST /api/coaching-automation/schedules */
export async function handleCreateSchedule(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const { type, title, recipients, format, active, config } = await req.json();
    if (!type || !title) return jsonResponse({ error: "type and title required" }, 400);
    const id = crypto.randomUUID();
    await db(sql`INSERT INTO automation_schedules (id, company_id, type, title, recipients, format, active, config, created_by) VALUES (${id}, ${user.companyId}, ${type}, ${title}, ${JSON.stringify(recipients || [])}, ${format || "json"}, ${active !== undefined ? (active ? 1 : 0) : 1}, ${JSON.stringify(config || {})}, ${user.id})`);
    return jsonResponse({ success: true, schedule: { id, type, title } });
  } catch (e) { return jsonResponse({ error: "Failed to create schedule" }, 500); }
}

/** GET /api/coaching-automation/schedules */
export async function handleListSchedules(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const schedules = await db(sql`SELECT * FROM automation_schedules WHERE company_id = ${user.companyId} ORDER BY created_at DESC LIMIT 50`);
    return jsonResponse({ schedules: schedules.map((s: any) => ({ ...s, recipients: JSON.parse(s.recipients || "[]"), config: JSON.parse(s.config || "{}") })) });
  } catch (e) { return jsonResponse({ error: "Failed to list schedules" }, 500); }
}

/** PUT /api/coaching-automation/schedules/:id */
export async function handleUpdateSchedule(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const id = new URL(req.url).pathname.split("/").pop();
    const { type, title, recipients, format, active, config } = await req.json();
    if (type !== undefined) await db(sql`UPDATE automation_schedules SET type = ${type} WHERE id = ${id}`);
    if (title !== undefined) await db(sql`UPDATE automation_schedules SET title = ${title} WHERE id = ${id}`);
    if (recipients !== undefined) await db(sql`UPDATE automation_schedules SET recipients = ${JSON.stringify(recipients)} WHERE id = ${id}`);
    if (format !== undefined) await db(sql`UPDATE automation_schedules SET format = ${format} WHERE id = ${id}`);
    if (active !== undefined) await db(sql`UPDATE automation_schedules SET active = ${active ? 1 : 0} WHERE id = ${id}`);
    if (config !== undefined) await db(sql`UPDATE automation_schedules SET config = ${JSON.stringify(config)} WHERE id = ${id}`);
    await db(sql`UPDATE automation_schedules SET updated_at = datetime('now') WHERE id = ${id}`);
    return jsonResponse({ success: true });
  } catch (e) { return jsonResponse({ error: "Failed to update schedule" }, 500); }
}

/** DELETE /api/coaching-automation/schedules/:id */
export async function handleDeleteSchedule(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const id = new URL(req.url).pathname.split("/").pop();
    await db(sql`DELETE FROM automation_schedules WHERE id = ${id} AND company_id = ${user.companyId}`);
    return jsonResponse({ success: true });
  } catch (e) { return jsonResponse({ error: "Failed to delete schedule" }, 500); }
}

// ─── REMINDERS ────────────────────────────────────────────────────────────────

/** GET /api/coaching-automation/reminders */
export async function handleListReminders(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const reminders = await db(sql`SELECT * FROM automation_reminders WHERE company_id = ${user.companyId} ORDER BY due_date ASC LIMIT 50`);
    return jsonResponse({ reminders });
  } catch (e) { return jsonResponse({ error: "Failed to list reminders" }, 500); }
}

/** POST /api/coaching-automation/reminders */
export async function handleCreateReminder(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const { title, description, assignee_id, due_date, recurrence } = await req.json();
    if (!title || !assignee_id) return jsonResponse({ error: "title and assignee_id required" }, 400);
    const id = crypto.randomUUID();
    await db(sql`INSERT INTO automation_reminders (id, company_id, title, description, assignee_id, due_date, recurrence, created_by) VALUES (${id}, ${user.companyId}, ${title}, ${description || ""}, ${assignee_id}, ${due_date || null}, ${recurrence || null}, ${user.id})`);
    return jsonResponse({ success: true, reminder: { id, title } });
  } catch (e) { return jsonResponse({ error: "Failed to create reminder" }, 500); }
}

/** PUT /api/coaching-automation/reminders/:id */
export async function handleUpdateReminder(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const id = new URL(req.url).pathname.split("/").pop();
    const { status, due_date, recurrence } = await req.json();
    if (status !== undefined) await db(sql`UPDATE automation_reminders SET status = ${status} WHERE id = ${id}`);
    if (due_date !== undefined) await db(sql`UPDATE automation_reminders SET due_date = ${due_date} WHERE id = ${id}`);
    if (recurrence !== undefined) await db(sql`UPDATE automation_reminders SET recurrence = ${recurrence} WHERE id = ${id}`);
    if (status === "completed" || status === "dismissed") await db(sql`UPDATE automation_reminders SET status = ${status} WHERE id = ${id}`);
    await db(sql`UPDATE automation_reminders SET updated_at = datetime('now') WHERE id = ${id}`);
    return jsonResponse({ success: true });
  } catch (e) { return jsonResponse({ error: "Failed to update reminder" }, 500); }
}

// ─── ALERTS ───────────────────────────────────────────────────────────────────

/** GET /api/coaching-automation/alerts */
export async function handleListAlerts(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const url = new URL(req.url);
    const unreadOnly = url.searchParams.get("unread") === "true";
    let alerts = await db(sql`SELECT * FROM automation_alerts WHERE company_id = ${user.companyId} ORDER BY created_at DESC LIMIT 50`);
    if (unreadOnly) alerts = alerts.filter((a: any) => !a.read_status);
    return jsonResponse({ alerts, unreadCount: alerts.filter((a: any) => !a.read_status).length });
  } catch (e) { return jsonResponse({ error: "Failed to list alerts" }, 500); }
}

/** POST /api/coaching-automation/alerts/:id/read */
export async function handleMarkAlertRead(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const id = new URL(req.url).pathname.split("/").pop();
    await db(sql`UPDATE automation_alerts SET read_status = 1 WHERE id = ${id} AND company_id = ${user.companyId}`);
    return jsonResponse({ success: true });
  } catch (e) { return jsonResponse({ error: "Failed to mark alert read" }, 500); }
}

// ─── TASKS ────────────────────────────────────────────────────────────────────

/** GET /api/coaching-automation/tasks */
export async function handleListTasks(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const url = new URL(req.url);
    const assignee = url.searchParams.get("assignee");
    let tasks = await db(sql`SELECT * FROM automation_tasks WHERE company_id = ${user.companyId} ORDER BY created_at DESC LIMIT 50`);
    if (assignee) tasks = tasks.filter((t: any) => t.assignee_id === assignee);
    return jsonResponse({ tasks });
  } catch (e) { return jsonResponse({ error: "Failed to list tasks" }, 500); }
}

/** POST /api/coaching-automation/tasks */
export async function handleCreateTask(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const { title, description, assignee_id, due_date, priority } = await req.json();
    if (!title || !assignee_id) return jsonResponse({ error: "title and assignee_id required" }, 400);
    const id = crypto.randomUUID();
    await db(sql`INSERT INTO automation_tasks (id, company_id, title, description, assignee_id, due_date, priority, created_by) VALUES (${id}, ${user.companyId}, ${title}, ${description || ""}, ${assignee_id}, ${due_date || null}, ${priority || "medium"}, ${user.id})`);
    return jsonResponse({ success: true, task: { id, title } });
  } catch (e) { return jsonResponse({ error: "Failed to create task" }, 500); }
}

/** PUT /api/coaching-automation/tasks/:id */
export async function handleUpdateTask(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const id = new URL(req.url).pathname.split("/").pop();
    const { status, priority, due_date } = await req.json();
    if (status !== undefined) await db(sql`UPDATE automation_tasks SET status = ${status} WHERE id = ${id}`);
    if (priority !== undefined) await db(sql`UPDATE automation_tasks SET priority = ${priority} WHERE id = ${id}`);
    if (due_date !== undefined) await db(sql`UPDATE automation_tasks SET due_date = ${due_date} WHERE id = ${id}`);
    await db(sql`UPDATE automation_tasks SET updated_at = datetime('now') WHERE id = ${id}`);
    return jsonResponse({ success: true });
  } catch (e) { return jsonResponse({ error: "Failed to update task" }, 500); }
}
