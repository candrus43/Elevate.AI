#!/usr/bin/env bun
/**
 * ElevateAI Demo Data Seeder
 *
 * Seeds the database with demo data for owner testing.
 * Run: bun run src/utils/seed.ts
 *
 * Credentials: demo@elevateai.com / demo123
 */

import { $ } from "bun";
import { sql } from "./sql";

function uuid() { return crypto.randomUUID(); }
function days(n: number) { const d = new Date(Date.now() - n * 86400000); return d.toISOString().replace("T", " ").split(".")[0]; }

async function db(query: string) {
  const result = await $`team-db ${query}`.text();
  return JSON.parse(result);
}

async function main() {
  console.log("🌱 ElevateAI Demo Data Seeder");
  console.log("──────────────────────────────\n");

  // Hash password
  const passwordHash = await Bun.password.hash("demo123");
  console.log("✓ Password hash generated");

  // ── 1. Company ──────────────────────────────────────────
  const companyId = uuid();
  try {
    await db(sql`INSERT INTO companies (id, name, slug, tier) VALUES (${companyId}, ${'ElevateAI Demo'}, ${'elevateai-demo'}, ${'enterprise'})`);
    console.log("✓ Company created");
  } catch {
    console.log("⚠ Company already exists, skipping");
  }

  // ── 2. Teams ────────────────────────────────────────────
  const sdrTeamId = uuid();
  const aeTeamId = uuid();
  try {
    await db(sql`INSERT INTO teams (id, company_id, name) VALUES (${sdrTeamId}, ${companyId}, ${'SDR Team'})`);
    await db(sql`INSERT INTO teams (id, company_id, name) VALUES (${aeTeamId}, ${companyId}, ${'AE Team'})`);
    console.log("✓ Teams created");
  } catch { console.log("⚠ Teams exist, skipping"); }

  // ── 3. Users ────────────────────────────────────────────
  const users: Record<string, { id: string }> = {};
  const userData = [
    { key: "admin", email: "demo@elevateai.com", name: "Alex Morgan", role: "admin", team: null },
    { key: "manager", email: "manager@elevateai.com", name: "Sarah Chen", role: "manager", team: sdrTeamId },
    { key: "rep1", email: "mike@elevateai.com", name: "Mike Rodriguez", role: "rep", team: sdrTeamId },
    { key: "rep2", email: "emily@elevateai.com", name: "Emily Watson", role: "rep", team: sdrTeamId },
    { key: "rep3", email: "sarah@elevateai.com", name: "Sarah Chen", role: "rep", team: aeTeamId },
  ];
  for (const u of userData) {
    const uid = uuid();
    users[u.key] = { id: uid };
    try {
      await db(sql`INSERT INTO users (id, company_id, email, password_hash, name, role, team_id, last_login_at) VALUES (${uid}, ${companyId}, ${u.email}, ${passwordHash}, ${u.name}, ${u.role}, ${u.team}, ${days(0)})`);
    } catch { console.log(`⚠ User ${u.email} exists`); }
  }
  console.log("✓ Users created (demo@elevateai.com / demo123)");

  // ── 4. Scorecards ───────────────────────────────────────
  const sc1 = uuid();
  await db(sql`INSERT INTO scorecards (id, company_id, name, is_default) VALUES (${sc1}, ${companyId}, ${'Standard Sales Scorecard'}, 1)`);
  const sc1Criteria = [
    { n: "Greeting", s: 10, w: 1.0, c: "Opening", o: 1 },
    { n: "Discovery", s: 20, w: 2.0, c: "Process", o: 2 },
    { n: "Objection Handling", s: 20, w: 2.0, c: "Skills", o: 3 },
    { n: "Value Proposition", s: 15, w: 1.5, c: "Messaging", o: 4 },
    { n: "Closing", s: 15, w: 1.5, c: "Skills", o: 5 },
    { n: "Compliance", s: 10, w: 1.0, c: "Rules", o: 6 },
    { n: "Rapport", s: 10, w: 1.0, c: "Soft Skills", o: 7 },
  ];
  for (const c of sc1Criteria) {
    await db(sql`INSERT INTO scorecard_criteria (id, scorecard_id, name, max_score, weight, category, sort_order) VALUES (${uuid()}, ${sc1}, ${c.n}, ${c.s}, ${c.w}, ${c.c}, ${c.o})`);
  }
  const sc2 = uuid();
  await db(sql`INSERT INTO scorecards (id, company_id, name) VALUES (${sc2}, ${companyId}, ${'Cold Call Scorecard'})`);
  const sc2Criteria = [
    { n: "Opening Hook", s: 15, w: 1.5, c: "Opening", o: 1 },
    { n: "Qualification", s: 20, w: 2.0, c: "Process", o: 2 },
    { n: "Engagement", s: 20, w: 2.0, c: "Soft Skills", o: 3 },
    { n: "Next Steps", s: 15, w: 1.5, c: "Structure", o: 4 },
    { n: "Compliance", s: 15, w: 1.5, c: "Rules", o: 5 },
    { n: "Energy", s: 15, w: 1.5, c: "Soft Skills", o: 6 },
  ];
  for (const c of sc2Criteria) {
    await db(sql`INSERT INTO scorecard_criteria (id, scorecard_id, name, max_score, weight, category, sort_order) VALUES (${uuid()}, ${sc2}, ${c.n}, ${c.s}, ${c.w}, ${c.c}, ${c.o})`);
  }
  console.log("✓ 2 scorecards created with criteria");

  // ── 5. Sample Calls ─────────────────────────────────────
  const callData = [
    { user: "rep1", lead: "Acme Corp Procurement", dur: 845, score: 92, sentiment: "positive", topics: "pricing, implementation, timeline", objections: "budget, timeline" },
    { user: "rep1", lead: "GlobalTech Solutions", dur: 612, score: 78, sentiment: "neutral", topics: "demo request, feature comparison", objections: "competitor pricing" },
    { user: "rep1", lead: "DataSync Inc", dur: 1024, score: 85, sentiment: "positive", topics: "integration, API, security", objections: "security concerns" },
    { user: "rep2", lead: "SmartBuild Systems", dur: 543, score: 95, sentiment: "positive", topics: "ROI, case studies, reference call", objections: "none" },
    { user: "rep2", lead: "CloudPeak Services", dur: 734, score: 72, sentiment: "neutral", topics: "objection handling, competitor", objections: "too expensive, not now" },
    { user: "rep2", lead: "NorthStar Analytics", dur: 921, score: 88, sentiment: "positive", topics: "needs analysis, solution fit", objections: "implementation concerns" },
    { user: "rep3", lead: "Velocity Ventures", dur: 456, score: 65, sentiment: "negative", topics: "cold outreach, follow-up", objections: "not interested, call back" },
    { user: "rep3", lead: "Premier Health Group", dur: 1102, score: 91, sentiment: "positive", topics: "compliance, security features", objections: "HIPAA compliance" },
    { user: "rep1", lead: "OmniTech Corp", dur: 678, score: 60, sentiment: "negative", topics: "pricing dispute, feature gaps", objections: "too expensive, missing features" },
    { user: "rep2", lead: "Quantum Data Systems", dur: 890, score: 82, sentiment: "positive", topics: "demo, technical requirements", objections: "integration complexity" },
    { user: "rep3", lead: "BlueSky Solutions", dur: 523, score: 98, sentiment: "positive", topics: "renewal, upsell, expansion", objections: "none" },
    { user: "rep1", lead: "IronClad Security", dur: 765, score: 75, sentiment: "neutral", topics: "trial feedback, feature request", objections: "product limitations" },
  ];
  const calls: Array<{ id: string; userId: string }> = [];
  for (const cd of callData) {
    const callId = uuid();
    const user = users[cd.user];
    if (!user) continue;
    calls.push({ id: callId, userId: user.id });
    const startedAt = days(Math.floor(Math.random() * 14));
    const complianceFlag = cd.score < 70 ? 1 : 0;

    await db(sql`INSERT INTO calls (id, company_id, user_id, direction, duration_seconds, started_at, ended_at, status, transcript, created_at) VALUES (${callId}, ${companyId}, ${user.id}, ${'outbound'}, ${cd.dur}, ${startedAt}, ${startedAt}, ${'analyzed'}, ${'Call transcript for ' + cd.lead}, ${startedAt})`);

    await db(sql`INSERT INTO call_analyses (id, call_id, overall_score, sentiment, talk_ratio_rep, talk_ratio_customer, avg_pace_wpm, filler_word_count, key_topics, summary, objections_detected, compliance_issues) VALUES (${uuid()}, ${callId}, ${cd.score}, ${cd.sentiment}, ${0.4 + Math.random() * 0.3}, ${0.3 + Math.random() * 0.3}, ${140 + Math.floor(Math.random() * 40)}, ${Math.floor(Math.random() * 15)}, ${'["' + cd.topics.replace(/, /g, '","') + '"]'}, ${'Call with ' + cd.lead + '. ' + (cd.score >= 80 ? 'Strong performance.' : 'Areas for improvement identified.')}, ${'["' + cd.objections.replace(/, /g, '","') + '"]'}, ${complianceFlag ? '["missing disclosure"]' : '[]'})`);

    await db(sql`INSERT INTO call_scores (id, call_id, scorecard_id, total_score, criteria_scores, reviewer_id, notes) VALUES (${uuid()}, ${callId}, ${sc1}, ${cd.score}, ${'{}'}, ${users.manager.id}, ${cd.score >= 80 ? 'Good call' : 'Needs improvement'})`);
  }
  console.log(`✓ ${calls.length} calls created with analysis`);

  // ── 6. Coaching Plans ───────────────────────────────────
  const plans = [
    { user: "rep1", title: "Objection Handling Mastery", items: ["Watch objection handling techniques video", "Role-play: price objection scenario", "Complete objection handling quiz"] },
    { user: "rep2", title: "Closing Techniques", items: ["Read closing playbook", "Practice assumptive close", "Shadow top performer (2 calls)", "Complete closing techniques assessment"] },
    { user: "rep3", title: "Discovery Call Excellence", items: ["Discovery questions workshop", "Practice BANT qualification framework"] },
  ];
  for (const plan of plans) {
    const planId = uuid();
    await db(sql`INSERT INTO coaching_plans (id, company_id, user_id, manager_id, title, status, due_date, created_at) VALUES (${planId}, ${companyId}, ${users[plan.user]?.id}, ${users.manager?.id}, ${plan.title}, ${'active'}, ${days(-14)}, ${days(7)})`);
    for (let i = 0; i < plan.items.length; i++) {
      const status = i < 2 ? "completed" : "pending";
      await db(sql`INSERT INTO coaching_plan_items (id, coaching_plan_id, title, status, sort_order, completed_at) VALUES (${uuid()}, ${planId}, ${plan.items[i]}, ${status}, ${i}, ${status === "completed" ? days(i + 1) : null})`);
    }
  }
  console.log("✓ 3 coaching plans created");

  // ── 7. Gamification ─────────────────────────────────────
  const badgeData = [
    { name: "Top Performer", desc: "Score 90+ on 10 calls", criteria: '{"threshold":90,"count":10}' },
    { name: "Rising Star", desc: "Improve score by 15 points", criteria: '{"improvement":15}' },
    { name: "Objection Handler", desc: "Complete objection training", criteria: '{"module":"objections"}' },
    { name: "Consistency King", desc: "Score 80+ for 5 consecutive calls", criteria: '{"streak":5,"min_score":80}' },
    { name: "Closing Champion", desc: "Close 5 deals in a month", criteria: '{"deals":5,"period":"monthly"}' },
  ];
  for (const b of badgeData) {
    await db(sql`INSERT INTO badges (id, company_id, name, description, criteria) VALUES (${uuid()}, ${companyId}, ${b.name}, ${b.desc}, ${b.criteria})`);
  }
  // Award badges
  await db(sql`INSERT INTO user_badges (id, user_id, badge_id) VALUES (${uuid()}, ${users.rep1?.id}, (SELECT id FROM badges WHERE name='Top Performer' LIMIT 1))`);
  await db(sql`INSERT INTO user_badges (id, user_id, badge_id) VALUES (${uuid()}, ${users.rep2?.id}, (SELECT id FROM badges WHERE name='Rising Star' LIMIT 1))`);
  await db(sql`INSERT INTO user_badges (id, user_id, badge_id) VALUES (${uuid()}, ${users.rep3?.id}, (SELECT id FROM badges WHERE name='Objection Handler' LIMIT 1))`);

  // Points
  const pts = [
    { u: "rep1", t: "call_analyzed", p: 10 }, { u: "rep1", t: "high_score", p: 25 }, { u: "rep1", t: "coaching_completed", p: 50 },
    { u: "rep2", t: "call_analyzed", p: 10 }, { u: "rep2", t: "roleplay_completed", p: 30 }, { u: "rep2", t: "high_score", p: 25 },
    { u: "rep3", t: "call_analyzed", p: 10 }, { u: "rep3", t: "coaching_completed", p: 50 }, { u: "manager", t: "review_completed", p: 20 },
  ];
  for (const p of pts) {
    await db(sql`INSERT INTO points_events (id, company_id, user_id, event_type, points, description) VALUES (${uuid()}, ${companyId}, ${users[p.u]?.id}, ${p.t}, ${p.p}, ${p.t.replace(/_/g, " ")})`);
  }

  // Leaderboards
  const lbW = uuid();
  await db(sql`INSERT INTO leaderboards (id, company_id, name, period) VALUES (${lbW}, ${companyId}, ${'Weekly Top Performers'}, ${'weekly'})`);
  const lbM = uuid();
  await db(sql`INSERT INTO leaderboards (id, company_id, name, period) VALUES (${lbM}, ${companyId}, ${'Monthly Champions'}, ${'monthly'})`);
  const reps = [users.rep1, users.rep2, users.rep3];
  for (let i = 0; i < reps.length; i++) {
    if (!reps[i]) continue;
    await db(sql`INSERT INTO leaderboard_entries (id, leaderboard_id, user_id, score, rank, period_start, period_end) VALUES (${uuid()}, ${lbW}, ${reps[i].id}, ${95 - i * 8}, ${i + 1}, ${days(7)}, ${days(0)})`);
    await db(sql`INSERT INTO leaderboard_entries (id, leaderboard_id, user_id, score, rank, period_start, period_end) VALUES (${uuid()}, ${lbM}, ${reps[i].id}, ${90 - i * 10}, ${i + 1}, ${days(30)}, ${days(0)})`);
  }
  console.log("✓ Gamification data created");

  // ── 8. Courses ──────────────────────────────────────────
  const courseData = [
    { title: "Objection Handling 101", cat: "Sales Skills", diff: "beginner", dur: 45, mods: ["Video: Types of Objections", "Article: Response Framework", "Quiz: Objection Handling"] },
    { title: "Discovery Call Mastery", cat: "Sales Process", diff: "intermediate", dur: 30, mods: ["Video: BANT Framework", "Article: Questioning Techniques"] },
    { title: "Closing Techniques That Work", cat: "Closing", diff: "advanced", dur: 60, mods: ["Video: Assumptive Close", "Article: Urgency Creation", "Video: Trial Close", "Quiz: Closing Scenarios"] },
  ];
  for (const c of courseData) {
    const courseId = uuid();
    await db(sql`INSERT INTO courses (id, company_id, title, category, difficulty, duration_minutes, is_required) VALUES (${courseId}, ${companyId}, ${c.title}, ${c.cat}, ${c.diff}, ${c.dur}, ${c.diff === "beginner" ? 1 : 0})`);
    for (let i = 0; i < c.mods.length; i++) {
      const contentType = c.mods[i].startsWith("Video") ? "video" : c.mods[i].startsWith("Quiz") ? "quiz" : "article";
      await db(sql`INSERT INTO course_modules (id, course_id, title, content_type, order_index, duration_minutes) VALUES (${uuid()}, ${courseId}, ${c.mods[i]}, ${contentType}, ${i}, ${Math.floor(c.dur / c.mods.length)})`);
    }
  }
  // Progress
  for (const rep of [users.rep1, users.rep2]) {
    if (!rep) continue;
    const firstCourse = await db(sql`SELECT id FROM courses WHERE company_id = ${companyId} LIMIT 1`);
    if (firstCourse.length > 0) {
      const mods = await db(sql`SELECT id FROM course_modules WHERE course_id = ${firstCourse[0].id} LIMIT 2`);
      for (const mod of mods) {
        await db(sql`INSERT INTO user_course_progress (id, user_id, course_module_id, status, score) VALUES (${uuid()}, ${rep.id}, ${mod.id}, ${'completed'}, ${80 + Math.floor(Math.random() * 20)})`);
      }
    }
  }
  console.log("✓ 3 courses with modules created");

  // ── 9. Compliance Rules ─────────────────────────────────
  const cr1 = uuid();
  await db(sql`INSERT INTO compliance_rules (id, company_id, name, script_required_phrases, prohibited_phrases) VALUES (${cr1}, ${companyId}, ${'Required Disclosures'}, ${'["We offer","There is no obligation"]'}, ${'[]'})`);
  const cr2 = uuid();
  await db(sql`INSERT INTO compliance_rules (id, company_id, name, script_required_phrases, prohibited_phrases) VALUES (${cr2}, ${companyId}, ${'Prohibited Language'}, ${'[]'}, ${'["Guarantee","Risk-free"]'})`);
  // Checks
  for (const call of calls.slice(0, 5)) {
    await db(sql`INSERT INTO compliance_checks (id, call_id, rule_id, passed, details) VALUES (${uuid()}, ${call.id}, ${cr1}, ${Math.random() > 0.2 ? 1 : 0}, ${'Disclosure check completed'})`);
    await db(sql`INSERT INTO compliance_checks (id, call_id, rule_id, passed, details) VALUES (${uuid()}, ${call.id}, ${cr2}, ${Math.random() > 0.1 ? 1 : 0}, ${'Prohibited language check completed'})`);
  }
  console.log("✓ Compliance rules created");

  // ── 10. Integrations ────────────────────────────────────
  await db(sql`INSERT INTO integrations (id, company_id, provider, config, is_active) VALUES (${uuid()}, ${companyId}, ${'salesforce'}, ${'{"apiVersion":"v58.0"}'}, 0)`);
  await db(sql`INSERT INTO integrations (id, company_id, provider, config, is_active) VALUES (${uuid()}, ${companyId}, ${'hubspot'}, ${'{"apiVersion":"v3"}'}, 0)`);
  await db(sql`INSERT INTO integrations (id, company_id, provider, config, is_active) VALUES (${uuid()}, ${companyId}, ${'five9'}, ${'{"region":"us-west"}'}, 0)`);
  console.log("✓ Integration configs created");

  // ── 11. Analytics Events ────────────────────────────────
  const eventTypes = ["login", "dashboard_viewed", "call_uploaded", "report_exported"];
  for (const u of [users.admin, users.manager, users.rep1, users.rep2, users.rep3]) {
    if (!u) continue;
    for (let i = 0; i < 4; i++) {
      await db(sql`INSERT INTO analytics_events (id, company_id, user_id, event_type, properties) VALUES (${uuid()}, ${companyId}, ${u.id}, ${eventTypes[i]}, ${'{"timestamp":"' + days(Math.floor(Math.random() * 7)) + '"}'})`);
    }
  }
  console.log("✓ Analytics events created");

  // ── 12. Departments & Sub-Teams (Multi-Tenant) ──────────
  const deptSales = uuid();
  const deptSdr = uuid();
  const deptAe = uuid();
  try {
    await db(sql`INSERT INTO departments (id, company_id, name, description, head_user_id) VALUES (${deptSales}, ${companyId}, ${'Sales'}, ${'Sales organization'}, ${users.manager?.id})`);
    await db(sql`INSERT INTO departments (id, company_id, name, parent_department_id, description, head_user_id) VALUES (${deptSdr}, ${companyId}, ${'SDR'}, ${deptSales}, ${'Sales Development'}, ${users.rep1?.id})`);
    await db(sql`INSERT INTO departments (id, company_id, name, parent_department_id, description, head_user_id) VALUES (${deptAe}, ${companyId}, ${'Account Executives'}, ${deptSales}, ${'Closing team'}, ${users.rep2?.id})`);
    console.log("✓ 3 departments created");
  } catch { console.log("⚠ Departments exist, skipping"); }

  // Sub-teams
  try {
    await db(sql`INSERT INTO sub_teams (id, company_id, department_id, name, lead_user_id) VALUES (${uuid()}, ${companyId}, ${deptSdr}, ${'Outbound SDR'}, ${users.rep1?.id})`);
    await db(sql`INSERT INTO sub_teams (id, company_id, department_id, name, lead_user_id) VALUES (${uuid()}, ${companyId}, ${deptSdr}, ${'Inbound SDR'}, ${users.rep3?.id})`);
    await db(sql`INSERT INTO sub_teams (id, company_id, department_id, name, lead_user_id) VALUES (${uuid()}, ${companyId}, ${deptAe}, ${'Enterprise AE'}, ${users.rep2?.id})`);
    console.log("✓ 3 sub-teams created");
  } catch { console.log("⚠ Sub-teams exist, skipping"); }

  // ── 13. Feature Flags ────────────────────────────────────
  try {
    await db(sql`INSERT INTO feature_flags (id, company_id, feature_key, is_enabled, config) VALUES (${uuid()}, ${companyId}, ${'live_coaching'}, 1, ${'{"max_sessions":10}'})`);
    await db(sql`INSERT INTO feature_flags (id, company_id, feature_key, is_enabled, config) VALUES (${uuid()}, ${companyId}, ${'ai_roleplay'}, 1, ${'{"max_daily":5}'})`);
    await db(sql`INSERT INTO feature_flags (id, company_id, feature_key, is_enabled, config) VALUES (${uuid()}, ${companyId}, ${'analytics_export'}, 1, ${'{"formats":["json","csv"]}'})`);
    await db(sql`INSERT INTO feature_flags (id, company_id, feature_key, is_enabled, config) VALUES (${uuid()}, ${companyId}, ${'custom_scorecards'}, 1, ${'{"max_custom":20}'})`);
    await db(sql`INSERT INTO feature_flags (id, company_id, feature_key, is_enabled, config) VALUES (${uuid()}, ${companyId}, ${'white_labeling'}, 0, ${'{}'})`);
    console.log("✓ 5 feature flags created");
  } catch { console.log("⚠ Feature flags exist, skipping"); }

  // ── 14. Audit Logs ──────────────────────────────────────
  const auditActions = ["login", "dashboard_viewed", "call_uploaded", "report_exported", "settings_updated", "user_invited"];
  for (const u of [users.admin, users.manager, users.rep1, users.rep2, users.rep3]) {
    if (!u) continue;
    for (let i = 0; i < 3; i++) {
      await db(sql`INSERT INTO audit_logs (id, company_id, user_id, action, resource_type, resource_id, details, ip_address, created_at) VALUES (${uuid()}, ${companyId}, ${u.id}, ${auditActions[i % auditActions.length]}, ${'system'}, ${companyId}, ${'{"description":"' + auditActions[i % auditActions.length] + ' action"}'}, ${'192.168.1.' + (i + 1)}, ${days(Math.floor(Math.random() * 7))})`);
    }
  }
  console.log("✓ Audit log entries created");

  // ── 15. Usage Metrics ───────────────────────────────────
  const metricKeys = ["calls_recorded", "minutes_tracked", "coaching_sessions", "scorecards_used"];
  for (const key of metricKeys) {
    for (let i = 0; i < 7; i++) {
      await db(sql`INSERT INTO usage_metrics (id, company_id, metric_key, metric_value, recorded_at) VALUES (${uuid()}, ${companyId}, ${key}, ${Math.floor(Math.random() * 50 + 5)}, ${days(i)})`);
    }
  }
  console.log("✓ Usage metrics created (7 days x 4 keys)");

  // ── 16. Update company white_label / max_users / features ──
  await db(sql`UPDATE companies SET white_label = ${'{"logo_url":"","primary_color":"#1a73e8","secondary_color":"#34a853","company_tagline":"Elevate Your Sales"}'}, max_users = 50, features = ${'{"live_coaching":true,"ai_roleplay":true,"analytics_export":true,"custom_scorecards":true}'} WHERE id = ${companyId}`);

  // ── 17. Metrics ─────────────────────────────────────────
  for (const u of [users.admin, users.manager, users.rep1, users.rep2, users.rep3]) {
    if (!u) continue;
    await db(sql`INSERT INTO user_metrics (id, user_id, company_id, period, calls_analyzed, avg_score, coaching_completed, conversion_rate, period_start, period_end) VALUES (${uuid()}, ${u.id}, ${companyId}, ${'monthly'}, ${Math.floor(Math.random() * 40 + 10)}, ${Math.floor(Math.random() * 25 + 70)}, ${Math.floor(Math.random() * 4 + 1)}, ${(Math.random() * 0.15 + 0.18).toFixed(2)}, ${days(30)}, ${days(0)})`);
  }
  await db(sql`INSERT INTO company_metrics (id, company_id, period, active_users, calls_analyzed, avg_team_score, coaching_completion_rate, period_start, period_end) VALUES (${uuid()}, ${companyId}, ${'monthly'}, 5, ${calls.length}, 82, 0.65, ${days(30)}, ${days(0)})`);
  console.log("✓ Metrics created");

  console.log("\n✅ Seeding complete!");
  console.log("──────────────────────────────────────");
  console.log("📧 Login: demo@elevateai.com / demo123");
  console.log("📧 Manager: manager@elevateai.com / demo123");
  console.log("📧 RePs: mike@elevateai.com, emily@elevateai.com, sarah@elevateai.com");
}

main().catch(console.error);