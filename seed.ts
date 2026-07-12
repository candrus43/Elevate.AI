#!/usr/bin/env bun
/**
 * ElevateAI Demo Data Seeder
 *
 * Creates a comprehensive demo dataset so the owner can log in and
 * experience a fully populated application.
 *
 * Usage: bun run seed.ts
 */

import { $ } from "bun";
import { sql } from "./src/utils/sql";

// ─── Helpers ────────────────────────────────────────────────

function uuid() {
  return crypto.randomUUID();
}

function now() {
  return new Date().toISOString().replace("T", " ").split(".")[0];
}

function daysAgo(n: number) {
  const d = new Date(Date.now() - n * 86400000);
  return d.toISOString().replace("T", " ").split(".")[0];
}

async function db(query: string) {
  const result = await $`team-db ${query}`.text();
  return JSON.parse(result);
}

// ─── Seed Data ───────────────────────────────────────────────

const DEMO_PASSWORD = "demo123456";
const DEMO_COMPANY = { id: uuid(), name: "Acme Corp", slug: "acme-corp", tier: "enterprise" };
const DEMO_COMPANY_2 = { id: uuid(), name: "TechStart Inc", slug: "techstart-inc", tier: "pro" };

let passwordHash: string;

async function main() {
  console.log("🌱 ElevateAI Demo Data Seeder");
  console.log("──────────────────────────────\n");

  // Hash password once
  passwordHash = await Bun.password.hash(DEMO_PASSWORD);
  console.log("✓ Password hash generated");

  // ── 1. Companies ──────────────────────────────────────────
  await db(sql`INSERT INTO companies (id, name, slug, tier, settings) VALUES (${DEMO_COMPANY.id}, ${DEMO_COMPANY.name}, ${DEMO_COMPANY.slug}, ${DEMO_COMPANY.tier}, ${'{"maxUsers": 100, "maxStorageGb": 500}'})`);
  await db(sql`INSERT INTO companies (id, name, slug, tier, settings) VALUES (${DEMO_COMPANY_2.id}, ${DEMO_COMPANY_2.name}, ${DEMO_COMPANY_2.slug}, ${DEMO_COMPANY_2.tier}, ${'{"maxUsers": 25, "maxStorageGb": 100}'})`);
  console.log(`✓ Created 2 companies`);

  // ── 2. Teams ──────────────────────────────────────────────
  const teams = [
    { id: uuid(), companyId: DEMO_COMPANY.id, name: "Enterprise Sales" },
    { id: uuid(), companyId: DEMO_COMPANY.id, name: "SMB Sales" },
    { id: uuid(), companyId: DEMO_COMPANY_2.id, name: "Growth Team" },
  ];
  for (const t of teams) {
    await db(sql`INSERT INTO teams (id, company_id, name) VALUES (${t.id}, ${t.companyId}, ${t.name})`);
  }
  console.log(`✓ Created ${teams.length} teams`);

  // ── 3. Users ──────────────────────────────────────────────
  const users = [
    { id: uuid(), companyId: DEMO_COMPANY.id, email: "admin@acme.com", name: "Sarah Connor", role: "admin", teamId: null },
    { id: uuid(), companyId: DEMO_COMPANY.id, email: "manager@acme.com", name: "Mike Chen", role: "manager", teamId: teams[0].id },
    { id: uuid(), companyId: DEMO_COMPANY.id, email: "rep1@acme.com", name: "Emily Watson", role: "rep", teamId: teams[0].id },
    { id: uuid(), companyId: DEMO_COMPANY.id, email: "rep2@acme.com", name: "James Kim", role: "rep", teamId: teams[0].id },
    { id: uuid(), companyId: DEMO_COMPANY.id, email: "rep3@acme.com", name: "Lisa Rodriguez", role: "rep", teamId: teams[1].id },
    { id: uuid(), companyId: DEMO_COMPANY_2.id, email: "admin@techstart.io", name: "Alex Turner", role: "admin", teamId: teams[2].id },
    { id: uuid(), companyId: DEMO_COMPANY_2.id, email: "rep@techstart.io", name: "Jordan Lee", role: "rep", teamId: teams[2].id },
  ];
  for (const u of users) {
    await db(
      sql`INSERT INTO users (id, company_id, email, password_hash, name, role, team_id, last_login_at) VALUES (${u.id}, ${u.companyId}, ${u.email}, ${passwordHash}, ${u.name}, ${u.role}, ${u.teamId}, ${daysAgo(0)})`
    );
  }
  console.log(`✓ Created ${users.length} users (password: ${DEMO_PASSWORD})`);

  // ── 4. Scorecards ─────────────────────────────────────────
  const scorecard = { id: uuid(), companyId: DEMO_COMPANY.id, name: "Standard Sales Call Scorecard" };
  await db(sql`INSERT INTO scorecards (id, company_id, name, description, is_default) VALUES (${scorecard.id}, ${scorecard.companyId}, ${scorecard.name}, ${'Standard evaluation criteria for outbound sales calls'}, 1)`);

  const criteria = [
    { scorecardId: scorecard.id, name: "Opening & Greeting", maxScore: 10, weight: 1.0, category: "Structure", sortOrder: 1 },
    { scorecardId: scorecard.id, name: "Discovery Questions", maxScore: 15, weight: 1.5, category: "Discovery", sortOrder: 2 },
    { scorecardId: scorecard.id, name: "Value Proposition", maxScore: 15, weight: 1.5, category: "Messaging", sortOrder: 3 },
    { scorecardId: scorecard.id, name: "Objection Handling", maxScore: 20, weight: 2.0, category: "Skills", sortOrder: 4 },
    { scorecardId: scorecard.id, name: "Closing Technique", maxScore: 15, weight: 1.5, category: "Skills", sortOrder: 5 },
    { scorecardId: scorecard.id, name: "Compliance & Script", maxScore: 10, weight: 1.0, category: "Compliance", sortOrder: 6 },
    { scorecardId: scorecard.id, name: "Tone & Professionalism", maxScore: 10, weight: 1.0, category: "Soft Skills", sortOrder: 7 },
    { scorecardId: scorecard.id, name: "Next Steps", maxScore: 5, weight: 0.5, category: "Structure", sortOrder: 8 },
  ];
  for (const c of criteria) {
    await db(
      sql`INSERT INTO scorecard_criteria (id, scorecard_id, name, max_score, weight, category, sort_order) VALUES (${uuid()}, ${c.scorecardId}, ${c.name}, ${c.maxScore}, ${c.weight}, ${c.category}, ${c.sortOrder})`
    );
  }
  console.log(`✓ Created scorecard with ${criteria.length} criteria`);

  // ── 5. Calls ──────────────────────────────────────────────
  const callData = [
    { user: users[2], lead: "Acme Corp Procurement", duration: 845, score: 92, sentiment: "positive", topics: "pricing, implementation, timeline" },
    { user: users[2], lead: "GlobalTech Solutions", duration: 612, score: 78, sentiment: "neutral", topics: "demo request, feature comparison, budget" },
    { user: users[2], lead: "DataSync Inc", duration: 1024, score: 85, sentiment: "positive", topics: "integration, API, security compliance" },
    { user: users[3], lead: "SmartBuild Systems", duration: 543, score: 95, sentiment: "positive", topics: "ROI, case studies, reference call" },
    { user: users[3], lead: "CloudPeak Services", duration: 734, score: 72, sentiment: "neutral", topics: "objection handling, competitor comparison" },
    { user: users[3], lead: "NorthStar Analytics", duration: 921, score: 88, sentiment: "positive", topics: "needs analysis, solution fit, pricing" },
    { user: users[4], lead: "Velocity Ventures", duration: 456, score: 65, sentiment: "negative", topics: "cold outreach, gatekeeper, follow-up" },
    { user: users[4], lead: "Premier Health Group", duration: 1102, score: 91, sentiment: "positive", topics: "compliance, HIPAA, security features" },
    { user: users[6], lead: "StartupHub", duration: 387, score: 82, sentiment: "positive", topics: "demo, onboarding, pricing" },
    { user: users[6], lead: "DevTool Inc", duration: 678, score: 70, sentiment: "neutral", topics: "feature request, roadmap, integration" },
  ];

  const calls: Array<{ id: string; userId: string }> = [];
  for (const cd of callData) {
    const callId = uuid();
    calls.push({ id: callId, userId: cd.user.id });
    const startedAt = daysAgo(Math.floor(Math.random() * 14));
    await db(
      sql`INSERT INTO calls (id, company_id, user_id, direction, duration_seconds, started_at, ended_at, status, transcript, created_at) VALUES (${callId}, ${cd.user.companyId}, ${cd.user.id}, ${'outbound'}, ${cd.duration}, ${startedAt}, ${startedAt}, ${'analyzed'}, ${'Demo call transcript for ' + cd.lead}, ${startedAt})`
    );

    // Call analysis
    const fillerWords = Math.floor(Math.random() * 20);
    const talkRatio = 0.4 + Math.random() * 0.3;
    await db(
      sql`INSERT INTO call_analyses (id, call_id, overall_score, sentiment, talk_ratio_rep, talk_ratio_customer, avg_pace_wpm, filler_word_count, key_topics, summary, objections_detected) VALUES (${uuid()}, ${callId}, ${cd.score}, ${cd.sentiment}, ${talkRatio}, ${1 - talkRatio}, ${140 + Math.floor(Math.random() * 40)}, ${fillerWords}, ${'["' + cd.topics.replace(/, /g, '","') + '"]'}, ${'Call with ' + cd.lead + '. Rep demonstrated strong product knowledge.'}, ${'["pricing concern", "competitor mention"]'})`
    );

    // Call score
    const criteriaScores = JSON.stringify({
      [criteria[0].name]: Math.floor(Math.random() * 3 + 8),
      [criteria[1].name]: Math.floor(Math.random() * 5 + 10),
      [criteria[2].name]: Math.floor(Math.random() * 4 + 11),
      [criteria[3].name]: Math.floor(Math.random() * 6 + 14),
      [criteria[4].name]: Math.floor(Math.random() * 4 + 11),
      [criteria[5].name]: Math.floor(Math.random() * 2 + 8),
      [criteria[6].name]: Math.floor(Math.random() * 2 + 8),
      [criteria[7].name]: Math.floor(Math.random() * 2 + 3),
    });
    await db(
      sql`INSERT INTO call_scores (id, call_id, scorecard_id, total_score, criteria_scores, reviewer_id, notes) VALUES (${uuid()}, ${callId}, ${scorecard.id}, ${cd.score}, ${criteriaScores}, ${users[1].id}, ${'Good call overall. Work on objection handling.'})`
    );
  }
  console.log(`✓ Created ${calls.length} calls with analysis and scores`);

  // ── 6. Coaching Plans ─────────────────────────────────────
  const plans = [
    { userId: users[2].id, title: "Objection Handling Mastery", items: ["Watch objection handling video", "Role-play: price objection scenario", "Review top 3 objection calls", "Shadow senior rep (2 calls)", "Complete objection handling quiz"] },
    { userId: users[3].id, title: "Discovery & Qualification", items: ["Discovery questions workshop", "Practice: BANT framework", "Review 5 discovery calls", "Complete qualification quiz"] },
    { userId: users[4].id, title: "Cold Calling Fundamentals", items: ["Opening script review", "Gatekeeper handling techniques", "Value proposition practice", "Call recording review session"] },
  ];

  for (const plan of plans) {
    const planId = uuid();
    await db(
      sql`INSERT INTO coaching_plans (id, company_id, user_id, manager_id, title, description, status, due_date, created_at) VALUES (${planId}, ${DEMO_COMPANY.id}, ${plan.userId}, ${users[1].id}, ${plan.title}, ${'Personalized coaching plan'}, ${'active'}, ${daysAgo(-14)}, ${daysAgo(7)})`
    );
    for (let i = 0; i < plan.items.length; i++) {
      const status = i < 2 ? "completed" : "pending";
      await db(
        sql`INSERT INTO coaching_plan_items (id, coaching_plan_id, title, status, sort_order, completed_at) VALUES (${uuid()}, ${planId}, ${plan.items[i]}, ${status}, ${i}, ${status === "completed" ? daysAgo(i + 1) : null})`
      );
    }
  }
  console.log(`✓ Created ${plans.length} coaching plans with items`);

  // ── 7. Coaching Sessions ──────────────────────────────────
  const sessions = [
    { userId: users[2].id, type: "roleplay", scenario: "Price objection: Customer says competitor is cheaper", score: 85 },
    { userId: users[2].id, type: "review", callId: calls[0].id, score: 92 },
    { userId: users[3].id, type: "roleplay", scenario: "Discovery: Uncover customer needs", score: 78 },
    { userId: users[4].id, type: "live", callId: calls[6].id, score: 65 },
    { userId: users[6].id, type: "roleplay", scenario: "Demo: Product walkthrough", score: 82 },
  ];

  for (const s of sessions) {
    if (s.type === "roleplay") {
      await db(
        sql`INSERT INTO role_play_sessions (id, company_id, user_id, scenario, score, feedback, duration_seconds, created_at) VALUES (${uuid()}, ${DEMO_COMPANY.id}, ${s.userId}, ${s.scenario}, ${s.score}, ${'Good effort. Try to ask more open-ended questions.'}, ${300 + Math.floor(Math.random() * 600)}, ${daysAgo(Math.floor(Math.random() * 5))})`
      );
    } else {
      await db(
        sql`INSERT INTO live_coaching_sessions (id, company_id, user_id, coach_id, call_id, notes, started_at, ended_at, created_at) VALUES (${uuid()}, ${DEMO_COMPANY.id}, ${s.userId}, ${users[1].id}, ${s.callId ?? null}, ${'Live coaching session notes'}, ${daysAgo(2)}, ${daysAgo(2)}, ${daysAgo(2)})`
      );
    }
  }
  console.log(`✓ Created ${sessions.length} coaching sessions`);

  // ── 8. Gamification ───────────────────────────────────────
  // Badges
  const badges = [
    { companyId: DEMO_COMPANY.id, name: "Top Performer", description: "Score 90+ on 10 calls", criteria: '{"type": "call_score", "threshold": 90, "count": 10}' },
    { companyId: DEMO_COMPANY.id, name: "Objection Handler", description: "Complete objection handling training", criteria: '{"type": "coaching", "module": "objection_handling"}' },
    { companyId: DEMO_COMPANY.id, name: "Rising Star", description: "Improve score by 15 points", criteria: '{"type": "improvement", "points": 15}' },
    { companyId: DEMO_COMPANY_2.id, name: "Fast Learner", description: "Complete 5 courses", criteria: '{"type": "learning", "courses": 5}' },
  ];
  for (const b of badges) {
    await db(
      sql`INSERT INTO badges (id, company_id, name, description, criteria) VALUES (${uuid()}, ${b.companyId}, ${b.name}, ${b.description}, ${b.criteria})`
    );
  }
  console.log(`✓ Created ${badges.length} badges`);

  // User badges
  await db(sql`INSERT INTO user_badges (id, user_id, badge_id) VALUES (${uuid()}, ${users[2].id}, (SELECT id FROM badges WHERE name = 'Top Performer' LIMIT 1))`);
  await db(sql`INSERT INTO user_badges (id, user_id, badge_id) VALUES (${uuid()}, ${users[3].id}, (SELECT id FROM badges WHERE name = 'Rising Star' LIMIT 1))`);
  console.log("✓ Awarded badges to users");

  // Points events
  const pointEvents = [
    { userId: users[2].id, event: "call_analyzed", points: 10 },
    { userId: users[2].id, event: "coaching_completed", points: 50 },
    { userId: users[2].id, event: "high_score", points: 25 },
    { userId: users[3].id, event: "call_analyzed", points: 10 },
    { userId: users[3].id, event: "roleplay_completed", points: 30 },
    { userId: users[4].id, event: "call_analyzed", points: 10 },
    { userId: users[4].id, event: "coaching_completed", points: 50 },
    { userId: users[6].id, event: "call_analyzed", points: 10 },
    { userId: users[6].id, event: "course_completed", points: 40 },
  ];
  for (const pe of pointEvents) {
    const user = users.find(u => u.id === pe.userId)!;
    await db(
      sql`INSERT INTO points_events (id, company_id, user_id, event_type, points, description) VALUES (${uuid()}, ${user.companyId}, ${pe.userId}, ${pe.event}, ${pe.points}, ${pe.event.replace(/_/g, " ")})`
    );
  }
  console.log(`✓ Created ${pointEvents.length} points events`);

  // Leaderboard
  const lbId = uuid();
  await db(sql`INSERT INTO leaderboards (id, company_id, name, period) VALUES (${lbId}, ${DEMO_COMPANY.id}, ${'Monthly Top Performers'}, ${'monthly'})`);
  const periodStart = daysAgo(30);
  const periodEnd = daysAgo(0);
  const leaderboardUsers = [users[2], users[3], users[4]];
  for (let i = 0; i < leaderboardUsers.length; i++) {
    const score = 95 - i * 10;
    await db(
      sql`INSERT INTO leaderboard_entries (id, leaderboard_id, user_id, score, rank, period_start, period_end) VALUES (${uuid()}, ${lbId}, ${leaderboardUsers[i].id}, ${score}, ${i + 1}, ${periodStart}, ${periodEnd})`
    );
  }
  console.log("✓ Created leaderboard with entries");

  // ── 9. Courses ────────────────────────────────────────────
  const courses = [
    { companyId: DEMO_COMPANY.id, title: "Objection Handling Pro", category: "Sales Skills", difficulty: "intermediate", duration: 45 },
    { companyId: DEMO_COMPANY.id, title: "Discovery Call Mastery", category: "Sales Process", difficulty: "beginner", duration: 30 },
    { companyId: DEMO_COMPANY_2.id, title: "Cold Calling 101", category: "Fundamentals", difficulty: "beginner", duration: 20 },
  ];

  for (const course of courses) {
    const courseId = uuid();
    await db(
      sql`INSERT INTO courses (id, company_id, title, description, category, difficulty, duration_minutes, is_required) VALUES (${courseId}, ${course.companyId}, ${course.title}, ${'Comprehensive training on ' + course.title.toLowerCase()}, ${course.category}, ${course.difficulty}, ${course.duration}, ${course.difficulty === "beginner" ? 1 : 0})`
    );

    // Modules
    const moduleCount = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < moduleCount; i++) {
      const types = ["video", "article", "quiz"];
      const contentType = types[i % 3];
      await db(
        sql`INSERT INTO course_modules (id, course_id, title, content_type, content_url, order_index, duration_minutes) VALUES (${uuid()}, ${courseId}, ${'Module ' + (i + 1) + ': ' + contentType.charAt(0).toUpperCase() + contentType.slice(1)}, ${contentType}, ${'https://elevateai.demo/courses/' + courseId + '/module-' + i}, ${i}, ${Math.floor(course.duration / moduleCount)})`
      );
    }
  }
  console.log(`✓ Created ${courses.length} courses with modules`);

  // Course progress for some users
  const progressUsers = [users[2], users[3], users[6]];
  for (const pu of progressUsers) {
    const userCourses = await db(
      sql`SELECT id FROM courses WHERE company_id = ${pu.companyId} LIMIT 1`
    );
    if (userCourses.length > 0) {
      const modules = await db(
        sql`SELECT id FROM course_modules WHERE course_id = ${userCourses[0].id} LIMIT 2`
      );
      for (const mod of modules) {
        await db(
          sql`INSERT INTO user_course_progress (id, user_id, course_module_id, status, score) VALUES (${uuid()}, ${pu.id}, ${mod.id}, ${'completed'}, ${70 + Math.floor(Math.random() * 30)})`
        );
      }
    }
  }
  console.log("✓ Created course progress records");

  // ── 10. Certifications ────────────────────────────────────
  const certs = [
    { userId: users[2].id, name: "Sales Fundamentals", companyId: DEMO_COMPANY.id },
    { userId: users[3].id, name: "Advanced Discovery", companyId: DEMO_COMPANY.id },
    { userId: users[6].id, name: "Product Knowledge", companyId: DEMO_COMPANY_2.id },
  ];
  for (const c of certs) {
    await db(
      sql`INSERT INTO certifications (id, user_id, name, description, issued_at, expires_at) VALUES (${uuid()}, ${c.userId}, ${c.name}, ${'Certified in ' + c.name.toLowerCase()}, ${daysAgo(60)}, ${daysAgo(-365)})`
    );
  }
  console.log(`✓ Created ${certs.length} certifications`);

  // ── 11. Compliance Rules ──────────────────────────────────
  const rules = [
    { companyId: DEMO_COMPANY.id, name: "Required Opening", required: '["thank you for taking my call", "i appreciate your time"]', prohibited: "[]" },
    { companyId: DEMO_COMPANY.id, name: "No Guarantees", required: "[]", prohibited: '["guaranteed results", "100% success"]' },
    { companyId: DEMO_COMPANY_2.id, name: "Compliance Script", required: '["this call may be recorded"]', prohibited: "[]" },
  ];
  for (const r of rules) {
    await db(
      sql`INSERT INTO compliance_rules (id, company_id, name, description, script_required_phrases, prohibited_phrases) VALUES (${uuid()}, ${r.companyId}, ${r.name}, ${'Auto-generated compliance rule'}, ${r.required}, ${r.prohibited})`
    );
  }
  console.log(`✓ Created ${rules.length} compliance rules`);

  // Compliance checks on calls
  const complianceCalls = calls.slice(0, 5);
  for (const call of complianceCalls) {
    const rulesList = await db(sql`SELECT id FROM compliance_rules WHERE company_id = (SELECT company_id FROM calls WHERE id = ${call.id}) LIMIT 2`);
    for (const rule of rulesList) {
      await db(
        sql`INSERT INTO compliance_checks (id, call_id, rule_id, passed, details) VALUES (${uuid()}, ${call.id}, ${rule.id}, ${Math.random() > 0.2 ? 1 : 0}, ${'Auto-check completed'})`
      );
    }
  }
  console.log("✓ Created compliance checks");

  // ── 12. Analytics Events ──────────────────────────────────
  const eventTypes = ["login", "call_uploaded", "dashboard_viewed", "report_exported", "coaching_started"];
  for (const u of users.slice(0, 5)) {
    for (let i = 0; i < 5; i++) {
      await db(
        sql`INSERT INTO analytics_events (id, company_id, user_id, event_type, properties) VALUES (${uuid()}, ${u.companyId}, ${u.id}, ${eventTypes[Math.floor(Math.random() * eventTypes.length)]}, ${'{"source": "demo_seed", "timestamp": "' + daysAgo(Math.floor(Math.random() * 7)) + '"}'})`
      );
    }
  }
  console.log("✓ Created analytics events");

  // ── 13. User Metrics ──────────────────────────────────────
  for (const u of users) {
    const periodStart = daysAgo(30);
    const periodEnd = daysAgo(0);
    await db(
      sql`INSERT INTO user_metrics (id, user_id, company_id, period, calls_analyzed, avg_score, coaching_completed, conversion_rate, period_start, period_end) VALUES (${uuid()}, ${u.id}, ${u.companyId}, ${'monthly'}, ${Math.floor(Math.random() * 50 + 10)}, ${Math.floor(Math.random() * 30 + 70)}, ${Math.floor(Math.random() * 5 + 1)}, ${(Math.random() * 0.2 + 0.15).toFixed(2)}, ${periodStart}, ${periodEnd})`
    );
  }
  console.log("✓ Created user metrics");

  // ── 14. Company Metrics ───────────────────────────────────
  await db(
    sql`INSERT INTO company_metrics (id, company_id, period, active_users, calls_analyzed, avg_team_score, coaching_completion_rate, period_start, period_end) VALUES (${uuid()}, ${DEMO_COMPANY.id}, ${'monthly'}, 5, ${calls.length}, 83, 0.72, ${daysAgo(30)}, ${daysAgo(0)})`
  );
  await db(
    sql`INSERT INTO company_metrics (id, company_id, period, active_users, calls_analyzed, avg_team_score, coaching_completion_rate, period_start, period_end) VALUES (${uuid()}, ${DEMO_COMPANY_2.id}, ${'monthly'}, 2, 2, 76, 0.5, ${daysAgo(30)}, ${daysAgo(0)})`
  );
  console.log("✓ Created company metrics");

  // ── Done ──────────────────────────────────────────────────
  console.log("\n✅ Seeding complete!");
  console.log("──────────────────────────────────────");
  console.log("📧 Login credentials:");
  console.log(`   Admin:   admin@acme.com / ${DEMO_PASSWORD}`);
  console.log(`   Manager: manager@acme.com / ${DEMO_PASSWORD}`);
  console.log(`   Rep:     rep1@acme.com / ${DEMO_PASSWORD}`);
  console.log(`   Rep:     rep2@acme.com / ${DEMO_PASSWORD}`);
  console.log(`   Rep:     rep3@acme.com / ${DEMO_PASSWORD}`);
  console.log("──────────────────────────────────────");
}

main().catch(console.error);