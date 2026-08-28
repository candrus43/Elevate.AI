/**
 * Compliance → Coaching / Role-Play integration (Phase D, backend).
 *
 * Closes the loop between detection and remediation: when a compliance finding
 * surfaces (status AI_FLAGGED or CONFIRMED), this module generates a personalized
 * coaching plan targeting the exact behavior that triggered the finding, and
 * optionally attaches a role-play practice assignment that rehearses the correct
 * behavior.
 *
 * Core principles honored here:
 *  - No fabrication — every coaching item is grounded in the actual rule
 *    (name / description / approved_language / prohibited_language) and the
 *    actual finding evidence (evidence_excerpt / explanation / recommended_action).
 *  - Tenant isolation via company_id on every query.
 *  - Full audit trail (generate_compliance_coaching).
 *  - Reuses the existing coaching generator + role-play engine (no new engines).
 */

import { sql, esc } from "~/utils/sql";
import { db, jsonResponse, getAuthUser, isComplianceReviewer } from "./middleware";
import { logAuditEvent } from "./admin";
import { generateCoachingPlan } from "~/utils/coaching-generator";
import type { CallWeakness, CoachingItem } from "~/utils/coaching-generator";
import { getScenarios } from "~/utils/roleplay-engine";

// ─── Constants ──────────────────────────────────────────────────────────────────

/** Findings eligible for automatic coaching generation. */
const COACHABLE_STATUSES = ["AI_FLAGGED", "CONFIRMED"] as const;

/** Upper bound for the batch endpoint — never unbounded. */
const COACH_ALL_LIMIT = 25;

// ─── Helpers ────────────────────────────────────────────────────────────────────

/** Parse a TEXT-encoded JSON array column (rules store JSON arrays as TEXT). */
function parseJsonArray(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map((v) => String(v));
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((v) => String(v)) : [];
  } catch {
    return [];
  }
}

/** Map a finding severity to an approximate performance score (used as a weakness gap). */
function severityToScore(severity: string): number {
  switch ((severity || "medium").toLowerCase()) {
    case "critical": return 10;
    case "high": return 30;
    case "medium": return 50;
    case "low": return 65;
    case "informational": return 75;
    default: return 50;
  }
}

/** Pick a relevant existing role-play scenario for rehearsing the correct behavior. */
function pickRoleplayScenario(ruleType: string | null | undefined): { id: number; title: string } {
  const scenarios = getScenarios();
  if (scenarios.length === 0) return { id: 1, title: "Role-Play Practice" };
  const type = (ruleType || "").toLowerCase();
  const wantedId =
    type === "must_not_say" ? 2 // Handling Objections — resist flagged language under pressure
    : type === "must_complete" || type === "must_verify" || type === "contextual_review" ? 4 // Discovery Call
    : 1; // Cold Call Opening — disclosures / required statements happen up front
  return scenarios.find((s) => s.id === wantedId) ?? scenarios[0];
}

/** Truncate long text defensively so plan descriptions stay readable. */
function clip(text: string, max = 240): string {
  const t = String(text || "").trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

// ─── Plan construction ──────────────────────────────────────────────────────────

interface FindingRow {
  id: string;
  call_id: string | null;
  rule_id: string | null;
  severity: string;
  status: string;
  evidence_excerpt?: string | null;
  evidence_timestamp?: string | null;
  explanation?: string | null;
  approved_alternative?: string | null;
  recommended_action?: string | null;
  rule_name?: string | null;
  rule_description?: string | null;
  rule_type?: string | null;
  rule_approved_language?: string | null;
  rule_prohibited_language?: string | null;
  rule_compliant_examples?: string | null;
  rep_user_id?: string | null;
  rep_name?: string | null;
}

interface CoachingPlanDraft {
  title: string;
  description: string;
  items: CoachingItem[];
}

/**
 * Build a coaching plan grounded in the actual rule + finding evidence.
 * Uses `generateCoachingPlan` for the generic "Compliance" reinforcement items,
 * then prepends rule/finding-specific items so the plan never fabricates content.
 */
function buildFindingCoachingPlan(
  finding: FindingRow,
  includeRoleplay: boolean,
): CoachingPlanDraft {
  const ruleName = finding.rule_name || "Compliance requirement";
  const severity = (finding.severity || "medium").toLowerCase();
  const approved = parseJsonArray(finding.rule_approved_language);
  const prohibited = parseJsonArray(finding.rule_prohibited_language);
  const compliantExamples = parseJsonArray(finding.rule_compliant_examples);

  // Weakness scaffold (feeds the existing generator for the "Compliance" category).
  const weakness: CallWeakness = {
    category: "Compliance",
    criterionName: ruleName,
    score: severityToScore(severity),
    maxScore: 100,
    gap: 100 - severityToScore(severity),
    weight: severity === "critical" || severity === "high" ? 1 : 0.7,
  };
  const base = generateCoachingPlan([weakness], finding.rep_name || undefined);

  // Rule/finding-specific items (grounded — no fabrication).
  const items: CoachingItem[] = [];

  items.push({
    title: `Review policy: ${ruleName}`,
    description: finding.rule_description
      ? `${clip(finding.rule_description)} (Severity: ${severity})`
      : `Review the "${ruleName}" requirement. Severity: ${severity}.`,
    resourceUrl: finding.rule_id ? `/dashboard/compliance/rules/${finding.rule_id}` : "/dashboard/compliance",
    sortOrder: items.length,
  });

  if (prohibited.length > 0 || approved.length > 0) {
    let desc = "";
    if (prohibited.length > 0) desc += `Avoid: ${prohibited.map((p) => `"${p}"`).join(", ")}. `;
    if (approved.length > 0) desc += `Instead, say: ${approved.map((a) => `"${a}"`).join(", ")}.`;
    items.push({
      title: "Replace flagged language with approved alternatives",
      description: clip(desc.trim(), 320),
      resourceUrl: "/learning/prohibited-language",
      sortOrder: items.length,
    });
  }

  if (finding.evidence_excerpt) {
    let desc = `On your call, this moment was flagged: "${clip(finding.evidence_excerpt, 180)}"`;
    if (finding.explanation) desc += ` ${clip(finding.explanation, 160)}`;
    items.push({
      title: "Review the flagged moment on your call",
      description: clip(desc, 360),
      resourceUrl: finding.call_id ? `/dashboard/calls/${finding.call_id}` : "/dashboard/calls",
      sortOrder: items.length,
    });
  }

  if (finding.approved_alternative || finding.recommended_action) {
    let desc = "";
    if (finding.approved_alternative) desc += `Approved alternative: ${clip(finding.approved_alternative, 160)}. `;
    if (finding.recommended_action) desc += `Recommended next step: ${clip(finding.recommended_action, 160)}.`;
    items.push({
      title: "Apply the recommended correction",
      description: clip(desc.trim(), 340),
      resourceUrl: "/dashboard/coaching",
      sortOrder: items.length,
    });
  }

  if (includeRoleplay) {
    const scenario = pickRoleplayScenario(finding.rule_type);
    items.push({
      title: `Role-play: practice ${ruleName} correctly`,
      description: `Rehearse the correct behavior in a simulated "${scenario.title}" call so it becomes second nature.${compliantExamples.length ? ` Model example: ${clip(compliantExamples[0], 140)}` : ""}`,
      resourceUrl: `/dashboard/roleplay?scenario=${scenario.id}`,
      sortOrder: items.length,
    });
  }

  // Merge generic "Compliance" reinforcement items (dedup by title, capped).
  const seen = new Set(items.map((i) => i.title.toLowerCase()));
  for (const generic of base.items) {
    if (items.length >= 6) break;
    if (seen.has(generic.title.toLowerCase())) continue;
    items.push({ ...generic, sortOrder: items.length });
    seen.add(generic.title.toLowerCase());
  }

  const title = `Compliance Coaching: ${ruleName}`;
  const description =
    `Auto-generated coaching plan from a compliance finding (severity: ${severity}) for rule "${ruleName}".` +
    (finding.rep_name ? ` Assigned to ${finding.rep_name}.` : "");

  return { title, description, items };
}

/** Load a single finding (tenant-scoped) with its rule + call + rep context. */
async function loadFinding(user: { companyId: string }, findingId: string): Promise<FindingRow | null> {
  const rows = await db(sql`
    SELECT f.*,
           cr.name as rule_name, cr.description as rule_description, cr.rule_type as rule_type,
           cr.approved_language as rule_approved_language,
           cr.prohibited_language as rule_prohibited_language,
           cr.compliant_examples as rule_compliant_examples,
           c.user_id as rep_user_id, c.started_at as call_date,
           u.name as rep_name
    FROM compliance_findings f
    LEFT JOIN compliance_rules cr ON cr.id = f.rule_id
    LEFT JOIN calls c ON c.id = f.call_id
    LEFT JOIN users u ON u.id = c.user_id
    WHERE f.id = ${findingId} AND f.company_id = ${user.companyId}
  `);
  return rows.length > 0 ? (rows[0] as FindingRow) : null;
}

/** Persist a draft plan into coaching_plans + coaching_plan_items, linked to the finding. */
async function persistPlan(
  user: { companyId: string; id: string },
  draft: CoachingPlanDraft,
  finding: FindingRow,
): Promise<string> {
  const planId = crypto.randomUUID();
  await db(sql`
    INSERT INTO coaching_plans (id, company_id, user_id, manager_id, title, description, status, source_finding_id, created_at)
    VALUES (${planId}, ${user.companyId}, ${finding.rep_user_id}, ${user.id}, ${draft.title}, ${draft.description}, ${"active"}, ${finding.id}, datetime('now'))
  `);

  for (const item of draft.items) {
    await db(sql`
      INSERT INTO coaching_plan_items (id, coaching_plan_id, title, description, resource_url, status, sort_order)
      VALUES (${crypto.randomUUID()}, ${planId}, ${item.title}, ${item.description}, ${item.resourceUrl || ""}, ${"pending"}, ${item.sortOrder})
    `);
  }

  return planId;
}

// ─── POST /api/compliance/findings/:id/coach ───────────────────────────────────
export async function handleCoachComplianceFinding(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (!isComplianceReviewer(user)) {
      return jsonResponse({ error: "Only managers and compliance reviewers can generate compliance coaching" }, 403);
    }

    const findingId = new URL(req.url).pathname.split("/")[4]; // /api/compliance/findings/:id/coach
    if (!findingId) return jsonResponse({ error: "Finding ID required" }, 400);

    const finding = await loadFinding(user, findingId);
    if (!finding) return jsonResponse({ error: "Finding not found" }, 404);

    if (!(COACHABLE_STATUSES as readonly string[]).includes(finding.status)) {
      return jsonResponse({ error: `Finding status "${finding.status}" is not coachable` }, 400);
    }
    if (!finding.rep_user_id) {
      return jsonResponse({ error: "Finding has no associated call/rep to coach" }, 400);
    }

    // Idempotency: one plan per finding.
    const existing = await db(sql`
      SELECT id FROM coaching_plans WHERE company_id = ${user.companyId} AND source_finding_id = ${findingId} LIMIT 1
    `);
    if (existing.length > 0) {
      return jsonResponse({ success: true, alreadyGenerated: true, planId: existing[0].id });
    }

    const body = await req.json().catch(() => ({}));
    const includeRoleplay = body.include_roleplay !== false;

    const draft = buildFindingCoachingPlan(finding, includeRoleplay);
    const planId = await persistPlan(user, draft, finding);

    await logAuditEvent(
      user.companyId,
      user.id,
      "generate_compliance_coaching",
      "compliance_finding",
      findingId,
      `Generated compliance coaching plan for finding (rule: ${finding.rule_name || "unknown"})`,
    );

    return jsonResponse({ success: true, planId, plan: { ...draft, id: planId, user_id: finding.rep_user_id } });
  } catch (e) {
    console.error("compliance coaching generate error:", e);
    return jsonResponse({ error: "Failed to generate compliance coaching" }, 500);
  }
}

// ─── POST /api/compliance/coach-all ─────────────────────────────────────────────
export async function handleCoachAllComplianceFindings(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (!isComplianceReviewer(user)) {
      return jsonResponse({ error: "Only managers and compliance reviewers can generate compliance coaching" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const includeRoleplay = body.include_roleplay !== false;
    const limit = Math.min(Math.max(Number(body.limit) || COACH_ALL_LIMIT, 1), COACH_ALL_LIMIT);

    // Build a safe IN (...) list from the app-controlled constant, then interpolate.
    const statusList = (COACHABLE_STATUSES as readonly string[]).map((s) => esc(s)).join(", ");
    const findings = await db(`
      SELECT f.id
      FROM compliance_findings f
      WHERE f.company_id = ${esc(user.companyId)} AND f.status IN (${statusList})
      ORDER BY f.created_at DESC
      LIMIT ${limit}
    `);

    const generated: string[] = [];
    let skipped = 0;
    const errors: Array<{ findingId: string; error: string }> = [];

    for (const row of findings) {
      const finding = await loadFinding(user, row.id);
      if (!finding) { skipped++; continue; }
      if (!finding.rep_user_id) { skipped++; continue; }

      const existing = await db(sql`
        SELECT id FROM coaching_plans WHERE company_id = ${user.companyId} AND source_finding_id = ${row.id} LIMIT 1
      `);
      if (existing.length > 0) { skipped++; continue; }

      try {
        const draft = buildFindingCoachingPlan(finding, includeRoleplay);
        const planId = await persistPlan(user, draft, finding);
        generated.push(planId);
      } catch (e) {
        console.error("coach-all item error:", e);
        errors.push({ findingId: row.id, error: "Failed to generate" });
      }
    }

    await logAuditEvent(
      user.companyId,
      user.id,
      "generate_compliance_coaching",
      "compliance_finding",
      null,
      `Batch compliance coaching: generated ${generated.length}, skipped ${skipped}, errors ${errors.length}`,
    );

    return jsonResponse({
      success: true,
      generated: generated.length,
      skipped,
      errors,
      planIds: generated,
    });
  } catch (e) {
    console.error("compliance coach-all error:", e);
    return jsonResponse({ error: "Failed to generate compliance coaching" }, 500);
  }
}
