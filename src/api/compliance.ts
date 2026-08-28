/**
 * Compliance Intelligence API handlers.
 *
 * Phase C foundation — rich rules (severity / rule_type / scope / versioning),
 * evidence-based findings, human review workflow, escalation rules, and document
 * traceability. Additive-only on top of the legacy keyword-rule CRUD; existing
 * endpoints keep working.
 *
 * Core principles honored here:
 *  - ElevateAI is NOT the legal authority — rules are customer-configured only.
 *  - Versioning is mandatory — edits write immutable snapshots, never overwrite.
 *  - Tenant isolation via company_id on every query.
 *  - Full audit trail on rule changes and review actions.
 */

import { sql, esc } from "~/utils/sql";
import { db, jsonResponse, getAuthUser, isComplianceAdmin, isComplianceReviewer } from "./middleware";
import { logAuditEvent } from "./admin";
import { chunkDocumentIntoSections } from "~/utils/document-parser";
import { getOpenAIConfig, callOpenAI, getComplianceRuleSuggestionSystemPrompt } from "./openai";

// ─── Role / permission model ───────────────────────────────────────────────────
// Role checks are defined centrally in `middleware.ts` (ROLES / hasRole /
// isComplianceAdmin / isComplianceReviewer). Here we add the one composite level
// needed by the compliance module: rule/document management.
//
//   compliance_admin     → full management (rules, escalation, documents, review)
//   compliance_reviewer  → review findings (confirm/dismiss/escalate/resolve)
//   manager              → manage rules/documents + review findings
//   admin                → tenant superuser (all of the above)

function canManageCompliance(user: { role: string }): boolean {
  return isComplianceAdmin(user) || user.role === "manager";
}

// ─── Enums (documented for the UI layer) ────────────────────────────────────────
export const RULE_SEVERITIES = ["informational", "low", "medium", "high", "critical"] as const;
export const RULE_TYPES = [
  "must_say",
  "must_not_say",
  "must_complete",
  "must_verify",
  "must_disclose",
  "must_receive_consent",
  "contextual_review",
] as const;
export const RULE_STATUSES = ["draft", "active", "archived", "suggested"] as const;
export const FINDING_STATUSES = [
  "AI_FLAGGED",
  "PENDING_REVIEW",
  "CONFIRMED",
  "DISMISSED",
  "NEEDS_COACHING",
  "ESCALATED",
  "RESOLVED",
] as const;
export const FINDING_CONFIDENCES = ["high", "medium", "low", "requires_review"] as const;

// JSON-array fields stored as TEXT in compliance_rules
const RULE_JSON_FIELDS = [
  "script_required_phrases",
  "prohibited_phrases",
  "approved_language",
  "prohibited_language",
  "compliant_examples",
  "noncompliant_examples",
] as const;

function serializeRule(row: any): any {
  const out: any = { ...row };
  for (const f of RULE_JSON_FIELDS) {
    try {
      out[f] = JSON.parse(row[f] || "[]");
    } catch {
      out[f] = [];
    }
  }
  out.version = typeof row.version === "number" ? row.version : Number(row.version ?? 1);
  out.is_ai_suggested = Boolean(row.is_ai_suggested);
  out.is_active = Boolean(row.is_active);
  return out;
}

// ─── Audit helper ────────────────────────────────────────────────────────────────
async function audit(user: any, action: string, resourceType: string, resourceId: string | null, details: string): Promise<void> {
  try {
    await logAuditEvent(user.companyId, user.id, action, resourceType, resourceId, details);
  } catch (e) {
    console.error("compliance audit log error:", e);
  }
}

/** Write an immutable snapshot of the given rule row into compliance_rule_versions. */
async function snapshotRuleVersion(rule: any, createdBy: string | null): Promise<void> {
  await db(sql`
    INSERT INTO compliance_rule_versions (id, rule_id, version, snapshot_json, created_by)
    VALUES (${crypto.randomUUID()}, ${rule.id}, ${rule.version ?? 1}, ${JSON.stringify(rule)}, ${createdBy})
  `);
}

// ════════════════════════════════════════════════════════════════════════════════
// RULES
// ════════════════════════════════════════════════════════════════════════════════

// ─── GET /api/compliance/rules ─────────────────────────────────────────────────
export async function handleListComplianceRules(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const severity = url.searchParams.get("severity");
    const ruleType = url.searchParams.get("rule_type");
    const includeArchived = url.searchParams.get("include_archived") === "1";

    let query = sql`SELECT * FROM compliance_rules WHERE company_id = ${user.companyId}`;
    if (status) query += sql` AND status = ${status}`;
    if (severity) query += sql` AND severity = ${severity}`;
    if (ruleType) query += sql` AND rule_type = ${ruleType}`;
    if (!includeArchived && !status) query += sql` AND status != 'archived'`;
    query += sql` ORDER BY created_at DESC`;

    const rules = await db(query);

    return jsonResponse({ rules: rules.map(serializeRule) });
  } catch (e) {
    console.error("list rules error:", e);
    return jsonResponse({ error: "Failed to load rules" }, 500);
  }
}

// ─── GET /api/compliance/rules/:id ─────────────────────────────────────────────
export async function handleGetComplianceRule(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const ruleId = new URL(req.url).pathname.split("/").pop();
    const rows = await db(sql`SELECT * FROM compliance_rules WHERE id = ${ruleId} AND company_id = ${user.companyId}`);
    if (rows.length === 0) return jsonResponse({ error: "Rule not found" }, 404);

    const versions = await db(sql`
      SELECT id, rule_id, version, created_by, created_at FROM compliance_rule_versions
      WHERE rule_id = ${ruleId} ORDER BY version DESC
    `);

    return jsonResponse({ rule: serializeRule(rows[0]), versions });
  } catch (e) {
    console.error("get rule error:", e);
    return jsonResponse({ error: "Failed to load rule" }, 500);
  }
}

// ─── GET /api/compliance/rules/:id/versions ────────────────────────────────────
export async function handleListComplianceRuleVersions(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const ruleId = new URL(req.url).pathname.split("/")[4]; // /api/compliance/rules/:id/versions
    const versions = await db(sql`
      SELECT id, rule_id, version, snapshot_json, created_by, created_at
      FROM compliance_rule_versions WHERE rule_id = ${ruleId} ORDER BY version DESC
    `);

    return jsonResponse({
      versions: versions.map((v: any) => {
        let snapshot: any = {};
        try { snapshot = JSON.parse(v.snapshot_json || "{}"); } catch { /* keep {} */ }
        return { ...v, snapshot };
      }),
    });
  } catch (e) {
    console.error("list rule versions error:", e);
    return jsonResponse({ error: "Failed to load rule versions" }, 500);
  }
}

// ─── POST /api/compliance/rules ────────────────────────────────────────────────
export async function handleCreateComplianceRule(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (!canManageCompliance(user)) {
      return jsonResponse({ error: "Only admins and managers can manage rules" }, 403);
    }

    const body = await req.json();
    if (!body.name) return jsonResponse({ error: "Name is required" }, 400);

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const jsonArray = (v: unknown) => JSON.stringify(Array.isArray(v) ? v : []);

    await db(sql`
      INSERT INTO compliance_rules (
        id, company_id, name, description, script_required_phrases, prohibited_phrases,
        category, severity, rule_type, approved_language, prohibited_language,
        compliant_examples, noncompliant_examples, scope_type, scope_id,
        effective_date, expiration_date, policy_owner, version, status,
        source_document_id, is_ai_suggested, is_active, created_at, updated_at
      ) VALUES (
        ${id}, ${user.companyId}, ${body.name}, ${body.description || ""},
        ${jsonArray(body.script_required_phrases)}, ${jsonArray(body.prohibited_phrases)},
        ${body.category || ""}, ${body.severity || "medium"}, ${body.rule_type || "must_say"},
        ${jsonArray(body.approved_language)}, ${jsonArray(body.prohibited_language)},
        ${jsonArray(body.compliant_examples)}, ${jsonArray(body.noncompliant_examples)},
        ${body.scope_type || ""}, ${body.scope_id || ""},
        ${body.effective_date ?? null}, ${body.expiration_date ?? null},
        ${body.policy_owner || ""}, 1, ${body.status || "active"},
        ${body.source_document_id ?? null}, ${body.is_ai_suggested ? 1 : 0},
        ${body.is_active === undefined ? 1 : (body.is_active ? 1 : 0)}, ${now}, ${now}
      )
    `);

    // Write the initial immutable version snapshot (v1).
    const created = await db(sql`SELECT * FROM compliance_rules WHERE id = ${id}`);
    if (created.length > 0) await snapshotRuleVersion(created[0], user.id);

    await audit(user, "create_compliance_rule", "compliance_rule", id, `Created compliance rule: ${body.name}`);

    return jsonResponse({
      success: true,
      rule: created.length > 0 ? serializeRule(created[0]) : { id, name: body.name },
    });
  } catch (e) {
    console.error("create rule error:", e);
    return jsonResponse({ error: "Failed to create rule" }, 500);
  }
}

// ─── PUT /api/compliance/rules/:id ─────────────────────────────────────────────
export async function handleUpdateComplianceRule(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (!canManageCompliance(user)) {
      return jsonResponse({ error: "Only admins and managers can manage rules" }, 403);
    }

    const ruleId = new URL(req.url).pathname.split("/").pop();
    if (!ruleId) return jsonResponse({ error: "Rule ID required" }, 400);

    const currentRows = await db(sql`SELECT * FROM compliance_rules WHERE id = ${ruleId} AND company_id = ${user.companyId}`);
    if (currentRows.length === 0) return jsonResponse({ error: "Rule not found" }, 404);
    const current = currentRows[0];

    const body = await req.json();
    const sets: string[] = [];
    const jsonArray = (v: unknown) => JSON.stringify(Array.isArray(v) ? v : []);

    // String / text fields
    const textFields: Record<string, string> = {
      name: "name",
      description: "description",
      category: "category",
      severity: "severity",
      rule_type: "rule_type",
      scope_type: "scope_type",
      scope_id: "scope_id",
      policy_owner: "policy_owner",
      status: "status",
      effective_date: "effective_date",
      expiration_date: "expiration_date",
      source_document_id: "source_document_id",
    };
    for (const [key, col] of Object.entries(textFields)) {
      if (body[key] !== undefined) sets.push(`${col} = ${esc(body[key] ?? null)}`);
    }
    // JSON-array fields
    const jsonFields: Record<string, string> = {
      script_required_phrases: "script_required_phrases",
      prohibited_phrases: "prohibited_phrases",
      approved_language: "approved_language",
      prohibited_language: "prohibited_language",
      compliant_examples: "compliant_examples",
      noncompliant_examples: "noncompliant_examples",
    };
    for (const [key, col] of Object.entries(jsonFields)) {
      if (body[key] !== undefined) sets.push(`${col} = ${esc(jsonArray(body[key]))}`);
    }
    // Boolean / integer fields
    if (body.is_active !== undefined) sets.push(`is_active = ${esc(body.is_active ? 1 : 0)}`);
    if (body.is_ai_suggested !== undefined) sets.push(`is_ai_suggested = ${esc(body.is_ai_suggested ? 1 : 0)}`);

    if (sets.length === 0) return jsonResponse({ error: "No fields to update" }, 400);

    const newVersion = (Number(current.version) || 1) + 1;

    // 1) Snapshot the CURRENT (pre-edit) state — never overwrite history.
    await snapshotRuleVersion(current, user.id);

    // 2) Apply the update, bumping the version.
    sets.push(`version = ${esc(newVersion)}`);
    sets.push(`updated_at = ${esc(new Date().toISOString())}`);
    await db(`UPDATE compliance_rules SET ${sets.join(", ")} WHERE id = ${esc(ruleId)} AND company_id = ${esc(user.companyId)}`);

    await audit(user, "update_compliance_rule", "compliance_rule", ruleId, `Updated compliance rule to version ${newVersion}`);

    const updated = await db(sql`SELECT * FROM compliance_rules WHERE id = ${ruleId} AND company_id = ${user.companyId}`);
    return jsonResponse({ success: true, version: newVersion, rule: updated.length > 0 ? serializeRule(updated[0]) : null });
  } catch (e) {
    console.error("update rule error:", e);
    return jsonResponse({ error: "Failed to update rule" }, 500);
  }
}

// ─── DELETE /api/compliance/rules/:id ──────────────────────────────────────────
// Soft archive is the correct compliance posture, but to preserve the legacy
// behavior (and keep the existing UI working) this hard-deletes the live row.
// History remains intact in compliance_rule_versions (no FK cascade).
export async function handleDeleteComplianceRule(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (!canManageCompliance(user)) {
      return jsonResponse({ error: "Only admins and managers can manage rules" }, 403);
    }

    const ruleId = new URL(req.url).pathname.split("/").pop();
    if (!ruleId) return jsonResponse({ error: "Rule ID required" }, 400);

    await db(sql`DELETE FROM compliance_rules WHERE id = ${ruleId} AND company_id = ${user.companyId}`);
    await audit(user, "delete_compliance_rule", "compliance_rule", ruleId, "Deleted compliance rule");

    return jsonResponse({ success: true });
  } catch (e) {
    console.error("delete rule error:", e);
    return jsonResponse({ error: "Failed to delete rule" }, 500);
  }
}

// ─── POST /api/compliance/rules/:id/approve ───────────────────────────────────
// Flips a SUGGESTED (AI-drafted) rule to ACTIVE. A human must explicitly approve
// each AI-suggested rule — suggested rules are never auto-activated.
// Consistent with C-1: writes an immutable pre-approval snapshot + audit event.
export async function handleApproveComplianceRule(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (!canManageCompliance(user)) {
      return jsonResponse({ error: "Only admins and managers can approve rules" }, 403);
    }

    const ruleId = new URL(req.url).pathname.split("/")[4]; // /api/compliance/rules/:id/approve
    if (!ruleId) return jsonResponse({ error: "Rule ID required" }, 400);

    const rows = await db(sql`SELECT * FROM compliance_rules WHERE id = ${ruleId} AND company_id = ${user.companyId}`);
    if (rows.length === 0) return jsonResponse({ error: "Rule not found" }, 404);
    const rule = rows[0];

    if ((rule.status || "").toLowerCase() !== "suggested") {
      return jsonResponse({ error: "Only SUGGESTED rules can be approved" }, 400);
    }

    const newVersion = (Number(rule.version) || 1) + 1;

    // Snapshot the pre-approval state — never overwrite history.
    await snapshotRuleVersion(rule, user.id);

    await db(sql`
      UPDATE compliance_rules
      SET status = 'active', is_active = 1, version = ${newVersion}, updated_at = datetime('now')
      WHERE id = ${ruleId} AND company_id = ${user.companyId}
    `);

    await audit(user, "approve_compliance_rule", "compliance_rule", ruleId, `Approved AI-suggested rule "${rule.name}" (v${newVersion})`);

    const updated = await db(sql`SELECT * FROM compliance_rules WHERE id = ${ruleId} AND company_id = ${user.companyId}`);
    return jsonResponse({ success: true, version: newVersion, rule: updated.length > 0 ? serializeRule(updated[0]) : null });
  } catch (e) {
    console.error("approve rule error:", e);
    return jsonResponse({ error: "Failed to approve rule" }, 500);
  }
}

// ─── GET /api/compliance/checks (legacy) ───────────────────────────────────────
export async function handleListComplianceChecks(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const checks = await db(sql`
      SELECT cc.*, cr.name as rule_name, u.name as rep_name, c.started_at as call_date
      FROM compliance_checks cc
      JOIN compliance_rules cr ON cr.id = cc.rule_id
      JOIN calls c ON c.id = cc.call_id
      JOIN users u ON u.id = c.user_id
      WHERE cr.company_id = ${user.companyId}
      ORDER BY cc.created_at DESC
      LIMIT 50
    `);

    return jsonResponse({ checks });
  } catch (e) {
    console.error("list checks error:", e);
    return jsonResponse({ error: "Failed to load checks" }, 500);
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// FINDINGS
// ════════════════════════════════════════════════════════════════════════════════

function serializeFinding(row: any): any {
  const out: any = { ...row };
  out.severity = row.severity || "medium";
  out.confidence = row.confidence || "medium";
  return out;
}

// ─── GET /api/compliance/findings ──────────────────────────────────────────────
export async function handleListComplianceFindings(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const severity = url.searchParams.get("severity");
    const confidence = url.searchParams.get("confidence");
    const ruleId = url.searchParams.get("rule_id");
    const callId = url.searchParams.get("call_id");
    const limit = Math.min(Number(url.searchParams.get("limit") ?? "200") || 200, 500);

    let query = sql`
      SELECT f.*, cr.name as rule_name, cr.category as rule_category,
             u.name as rep_name, c.started_at as call_date
      FROM compliance_findings f
      LEFT JOIN compliance_rules cr ON cr.id = f.rule_id
      LEFT JOIN calls c ON c.id = f.call_id
      LEFT JOIN users u ON u.id = c.user_id
      WHERE f.company_id = ${user.companyId}
    `;
    if (status) query += sql` AND f.status = ${status}`;
    if (severity) query += sql` AND f.severity = ${severity}`;
    if (confidence) query += sql` AND f.confidence = ${confidence}`;
    if (ruleId) query += sql` AND f.rule_id = ${ruleId}`;
    if (callId) query += sql` AND f.call_id = ${callId}`;
    query += sql` ORDER BY f.created_at DESC LIMIT ${limit}`;

    const findings = await db(query);

    return jsonResponse({ findings: findings.map(serializeFinding) });
  } catch (e) {
    console.error("list findings error:", e);
    return jsonResponse({ error: "Failed to load findings" }, 500);
  }
}

// ─── GET /api/compliance/findings/:id ──────────────────────────────────────────
export async function handleGetComplianceFinding(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const findingId = new URL(req.url).pathname.split("/").pop();
    const rows = await db(sql`
      SELECT f.*, cr.name as rule_name, cr.category as rule_category,
             u.name as rep_name, c.started_at as call_date, c.transcript as call_transcript
      FROM compliance_findings f
      LEFT JOIN compliance_rules cr ON cr.id = f.rule_id
      LEFT JOIN calls c ON c.id = f.call_id
      LEFT JOIN users u ON u.id = c.user_id
      WHERE f.id = ${findingId} AND f.company_id = ${user.companyId}
    `);
    if (rows.length === 0) return jsonResponse({ error: "Finding not found" }, 404);

    return jsonResponse({ finding: serializeFinding(rows[0]) });
  } catch (e) {
    console.error("get finding error:", e);
    return jsonResponse({ error: "Failed to load finding" }, 500);
  }
}

// ─── POST /api/compliance/findings ─────────────────────────────────────────────
// Used by the (later) AI evaluation slice and manual/import tooling. Always
// creates with status=AI_FLAGGED and requires human review for confirmation.
export async function handleCreateComplianceFinding(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (!isComplianceReviewer(user)) {
      return jsonResponse({ error: "Insufficient permissions to create findings" }, 403);
    }

    const body = await req.json();
    if (!body.rule_id) return jsonResponse({ error: "rule_id is required" }, 400);

    // Validate the rule belongs to this tenant.
    const ruleRows = await db(sql`SELECT id, version FROM compliance_rules WHERE id = ${body.rule_id} AND company_id = ${user.companyId}`);
    if (ruleRows.length === 0) return jsonResponse({ error: "Rule not found" }, 404);

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const confidence = body.confidence && (FINDING_CONFIDENCES as readonly string[]).includes(body.confidence)
      ? body.confidence : "medium";
    const severity = body.severity && (RULE_SEVERITIES as readonly string[]).includes(body.severity)
      ? body.severity : "medium";

    await db(sql`
      INSERT INTO compliance_findings (
        id, company_id, call_id, rule_id, rule_version, severity, confidence,
        evidence_excerpt, evidence_timestamp, explanation, approved_alternative,
        recommended_action, status, created_at, updated_at
      ) VALUES (
        ${id}, ${user.companyId}, ${body.call_id ?? null}, ${body.rule_id},
        ${body.rule_version ?? ruleRows[0].version ?? null}, ${severity}, ${confidence},
        ${body.evidence_excerpt || ""}, ${body.evidence_timestamp ?? null},
        ${body.explanation || ""}, ${body.approved_alternative || ""},
        ${body.recommended_action || ""}, 'AI_FLAGGED', ${now}, ${now}
      )
    `);

    return jsonResponse({ success: true, id });
  } catch (e) {
    console.error("create finding error:", e);
    return jsonResponse({ error: "Failed to create finding" }, 500);
  }
}

// ─── POST /api/compliance/findings/:id/review ──────────────────────────────────
// Human review workflow. Actions: confirm, dismiss, change_severity, add_note,
// assign_coaching, escalate, resolve. Writes an audit event for each action.
export async function handleReviewComplianceFinding(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (!isComplianceReviewer(user)) {
      return jsonResponse({ error: "Insufficient permissions to review findings" }, 403);
    }

    const findingId = new URL(req.url).pathname.split("/")[4]; // /api/compliance/findings/:id/review
    const body = await req.json();
    // Accept both hyphenated and underscored action names.
    const action = String(body.action || "").replace(/-/g, "_");

    const rows = await db(sql`SELECT * FROM compliance_findings WHERE id = ${findingId} AND company_id = ${user.companyId}`);
    if (rows.length === 0) return jsonResponse({ error: "Finding not found" }, 404);
    const finding = rows[0];

    const now = new Date().toISOString();
    const sets: string[] = [`updated_at = ${esc(now)}`, `reviewer_id = ${esc(user.id)}`, `reviewed_at = ${esc(now)}`];
    let auditAction = "review_compliance_finding";
    let auditDetail = "";

    switch (action) {
      case "confirm":
        sets.push("status = 'CONFIRMED'");
        auditDetail = "Confirmed finding";
        break;
      case "dismiss":
        sets.push("status = 'DISMISSED'");
        auditDetail = "Dismissed finding";
        break;
      case "change_severity": {
        const sev = body.severity;
        if (!sev || !(RULE_SEVERITIES as readonly string[]).includes(sev)) {
          return jsonResponse({ error: "Valid severity required for change_severity" }, 400);
        }
        sets.push(`severity = ${esc(sev)}`);
        auditDetail = `Changed severity to ${sev}`;
        break;
      }
      case "add_note": {
        if (!body.notes) return jsonResponse({ error: "notes is required for add_note" }, 400);
        const combined = [finding.notes, String(body.notes)].filter(Boolean).join("\n");
        sets.push(`notes = ${esc(combined)}`);
        auditDetail = "Added review note";
        break;
      }
      case "assign_coaching":
        sets.push("status = 'NEEDS_COACHING'");
        auditDetail = "Assigned coaching";
        break;
      case "escalate":
        sets.push("status = 'ESCALATED'");
        auditDetail = "Escalated finding";
        break;
      case "resolve":
        sets.push("status = 'RESOLVED'");
        auditDetail = "Resolved finding";
        break;
      default:
        return jsonResponse({ error: `Unknown review action: ${body.action}` }, 400);
    }

    // allow optional note with any action
    if (body.notes !== undefined && action !== "add_note") {
      sets.push(`notes = ${esc(String(body.notes))}`);
    }

    await db(`UPDATE compliance_findings SET ${sets.join(", ")} WHERE id = ${esc(findingId)} AND company_id = ${esc(user.companyId)}`);
    await audit(user, auditAction, "compliance_finding", findingId, auditDetail);

    const updated = await db(sql`SELECT * FROM compliance_findings WHERE id = ${findingId} AND company_id = ${user.companyId}`);
    return jsonResponse({ success: true, finding: updated.length > 0 ? serializeFinding(updated[0]) : null });
  } catch (e) {
    console.error("review finding error:", e);
    return jsonResponse({ error: "Failed to review finding" }, 500);
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// DOCUMENTS (policy sources — parsing/AI-suggest is a later slice)
// ════════════════════════════════════════════════════════════════════════════════

// ─── GET /api/compliance/documents ─────────────────────────────────────────────
export async function handleListComplianceDocuments(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const documents = await db(sql`
      SELECT d.*, u.name as uploader_name
      FROM compliance_documents d
      LEFT JOIN users u ON u.id = d.uploaded_by
      WHERE d.company_id = ${user.companyId}
      ORDER BY d.created_at DESC
    `);

    return jsonResponse({ documents });
  } catch (e) {
    console.error("list documents error:", e);
    return jsonResponse({ error: "Failed to load documents" }, 500);
  }
}

// ─── POST /api/compliance/documents ────────────────────────────────────────────
export async function handleCreateComplianceDocument(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (!canManageCompliance(user)) {
      return jsonResponse({ error: "Only admins and managers can upload documents" }, 403);
    }

    const body = await req.json();
    if (!body.name) return jsonResponse({ error: "Name is required" }, 400);

    const id = crypto.randomUUID();
    await db(sql`
      INSERT INTO compliance_documents (id, company_id, name, file_type, storage_path, uploaded_by, status)
      VALUES (${id}, ${user.companyId}, ${body.name}, ${body.file_type || ""}, ${body.storage_path || ""}, ${user.id}, ${body.status || "uploaded"})
    `);

    // Optional sections payload for traceability.
    const sections = Array.isArray(body.sections) ? body.sections : [];
    for (let i = 0; i < sections.length; i++) {
      const s = sections[i];
      await db(sql`
        INSERT INTO compliance_document_sections (id, document_id, section_title, content_text, sort_order)
        VALUES (${crypto.randomUUID()}, ${id}, ${s.section_title || ""}, ${s.content_text || ""}, ${i})
      `);
    }

    await audit(user, "create_compliance_document", "compliance_document", id, `Uploaded compliance document: ${body.name}`);

    return jsonResponse({ success: true, id });
  } catch (e) {
    console.error("create document error:", e);
    return jsonResponse({ error: "Failed to create document" }, 500);
  }
}

// ─── POST /api/compliance/documents/ingest ─────────────────────────────────────
// Accepts plain-text / markdown content (JSON body `content` OR multipart `.txt`/
// `.md` file) and auto-chunks it into `compliance_document_sections`.
//
// This is the dependency-free seam for future PDF/DOCX: those formats get
// converted to text first, then reuse `chunkDocumentIntoSections` here.
export async function handleIngestComplianceDocument(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (!canManageCompliance(user)) {
      return jsonResponse({ error: "Only admins and managers can ingest documents" }, 403);
    }

    const contentType = req.headers.get("content-type") || "";
    let name = "";
    let content = "";
    let fileType = "text/plain";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      name = (formData.get("name") as string) || file?.name || "Untitled document";
      if (!file) return jsonResponse({ error: "No file provided" }, 400);

      const lower = file.name.toLowerCase();
      if (!/\.(txt|md|markdown|text)$/.test(lower) && !file.type.startsWith("text/")) {
        return jsonResponse({ error: "Only .txt / .md / text files are supported (PDF/DOCX deferred)" }, 400);
      }
      content = await file.text();
      fileType = file.type || (/(\.md|\.markdown)$/.test(lower) ? "text/markdown" : "text/plain");
    } else {
      const body = await req.json();
      name = body.name;
      content = body.content ?? body.text ?? "";
      if (body.file_type) fileType = body.file_type;
    }

    if (!name || !String(name).trim()) return jsonResponse({ error: "Name is required" }, 400);
    if (!content || !String(content).trim()) return jsonResponse({ error: "Document content is empty" }, 400);

    const sections = chunkDocumentIntoSections(String(content));
    if (sections.length === 0) return jsonResponse({ error: "Could not extract any sections from document" }, 400);

    const id = crypto.randomUUID();
    await db(sql`
      INSERT INTO compliance_documents (id, company_id, name, file_type, storage_path, uploaded_by, status)
      VALUES (${id}, ${user.companyId}, ${String(name).trim()}, ${fileType}, ${""}, ${user.id}, ${"parsed"})
    `);

    for (const s of sections) {
      await db(sql`
        INSERT INTO compliance_document_sections (id, document_id, section_title, content_text, sort_order)
        VALUES (${crypto.randomUUID()}, ${id}, ${s.section_title}, ${s.content_text}, ${s.sort_order})
      `);
    }

    await audit(user, "ingest_compliance_document", "compliance_document", id, `Ingested compliance document: ${String(name).trim()} (${sections.length} sections)`);

    return jsonResponse({ success: true, id, sectionCount: sections.length, sections });
  } catch (e) {
    console.error("ingest document error:", e);
    return jsonResponse({ error: "Failed to ingest document" }, 500);
  }
}

// ─── GET /api/compliance/documents/:id ─────────────────────────────────────────
export async function handleGetComplianceDocument(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const documentId = new URL(req.url).pathname.split("/").pop();
    const rows = await db(sql`SELECT * FROM compliance_documents WHERE id = ${documentId} AND company_id = ${user.companyId}`);
    if (rows.length === 0) return jsonResponse({ error: "Document not found" }, 404);

    const sections = await db(sql`
      SELECT * FROM compliance_document_sections WHERE document_id = ${documentId} ORDER BY sort_order
    `);

    return jsonResponse({ document: rows[0], sections });
  } catch (e) {
    console.error("get document error:", e);
    return jsonResponse({ error: "Failed to load document" }, 500);
  }
}

// ─── POST /api/compliance/documents/:id/suggest-rules ─────────────────────────
// Takes an ingested document's sections, sends them to OpenAI with a dedicated
// prompt, and inserts the returned rules as status = 'suggested' (is_active = 0).
// Core Principle 2: suggested rules are NEVER auto-activated — a human approves
// each via POST /api/compliance/rules/:id/approve.
export async function handleSuggestComplianceRules(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (!canManageCompliance(user)) {
      return jsonResponse({ error: "Only admins and managers can suggest rules" }, 403);
    }

    const documentId = new URL(req.url).pathname.split("/")[4]; // /api/compliance/documents/:id/suggest-rules
    if (!documentId) return jsonResponse({ error: "Document ID required" }, 400);

    const docs = await db(sql`SELECT * FROM compliance_documents WHERE id = ${documentId} AND company_id = ${user.companyId}`);
    if (docs.length === 0) return jsonResponse({ error: "Document not found" }, 404);
    const doc = docs[0];

    const sections = await db(sql`
      SELECT * FROM compliance_document_sections WHERE document_id = ${documentId} ORDER BY sort_order
    `);
    if (sections.length === 0) return jsonResponse({ error: "Document has no sections to analyze" }, 400);

    const config = await getOpenAIConfig(user.companyId);
    if (!config || !config.apiKey) {
      return jsonResponse({ error: "AI provider is not configured. Configure an API key first." }, 400);
    }

    const sectionsText = sections
      .map((s: any, i: number) => `### ${s.section_title || `Section ${i + 1}`}\n${s.content_text || ""}`)
      .join("\n\n");

    const result = await callOpenAI(config, {
      model: config.model,
      messages: [
        { role: "system", content: getComplianceRuleSuggestionSystemPrompt() },
        { role: "user", content: `DOCUMENT: ${doc.name || "Untitled"}\n\n${sectionsText}` },
      ],
      max_tokens: 4096,
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    if (!result.success || !result.content) {
      return jsonResponse({ error: result.error || "AI suggestion failed" }, 502);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(result.content);
    } catch {
      return jsonResponse({ error: "AI returned invalid JSON" }, 502);
    }

    const suggestions = Array.isArray(parsed.suggested_rules) ? parsed.suggested_rules : [];
    const arr = (v: unknown) => JSON.stringify(Array.isArray(v) ? v : []);
    const created: any[] = [];
    let skipped = 0;
    const now = new Date().toISOString();

    for (const s of suggestions) {
      const name = String(s?.name || "").trim();
      if (!name) { skipped++; continue; }

      const ruleType = (RULE_TYPES as readonly string[]).includes(s.rule_type) ? s.rule_type : "must_say";
      const severity = (RULE_SEVERITIES as readonly string[]).includes(s.severity) ? s.severity : "medium";
      // Mirror prohibited_language into the legacy prohibited_phrases column for
      // backward compatibility with the keyword check path.
      const prohibitedLanguage = arr(s.prohibited_language);
      const prohibitedPhrases = arr(Array.isArray(s.prohibited_phrases) && s.prohibited_phrases.length > 0 ? s.prohibited_phrases : s.prohibited_language);

      const id = crypto.randomUUID();
      await db(sql`
        INSERT INTO compliance_rules (
          id, company_id, name, description, script_required_phrases, prohibited_phrases,
          category, severity, rule_type, approved_language, prohibited_language,
          compliant_examples, noncompliant_examples, scope_type, scope_id,
          effective_date, expiration_date, policy_owner, version, status,
          source_document_id, is_ai_suggested, is_active, created_at, updated_at
        ) VALUES (
          ${id}, ${user.companyId}, ${name}, ${String(s.description || "")},
          ${arr(s.script_required_phrases)}, ${prohibitedPhrases},
          ${String(s.category || "")}, ${severity}, ${ruleType},
          ${arr(s.approved_language)}, ${prohibitedLanguage},
          ${arr(s.compliant_examples)}, ${arr(s.noncompliant_examples)},
          ${""}, ${""}, ${null}, ${null}, ${String(s.policy_owner || "")}, 1, ${"suggested"},
          ${documentId}, 1, 0, ${now}, ${now}
        )
      `);

      const createdRows = await db(sql`SELECT * FROM compliance_rules WHERE id = ${id}`);
      if (createdRows.length > 0) {
        await snapshotRuleVersion(createdRows[0], user.id);
        created.push(serializeRule(createdRows[0]));
      }
    }

    await audit(user, "suggest_compliance_rules", "compliance_document", documentId, `AI suggested ${created.length} rule(s) from document: ${doc.name}`);

    return jsonResponse({ success: true, suggested: created.length, skipped, rules: created });
  } catch (e) {
    console.error("suggest rules error:", e);
    return jsonResponse({ error: "Failed to suggest rules" }, 500);
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// ESCALATION RULES
// ════════════════════════════════════════════════════════════════════════════════

function serializeEscalationRule(row: any): any {
  const out: any = { ...row };
  try { out.trigger_config = JSON.parse(row.trigger_config || "{}"); } catch { out.trigger_config = {}; }
  try { out.notify_user_ids = JSON.parse(row.notify_user_ids || "[]"); } catch { out.notify_user_ids = []; }
  out.enabled = Boolean(row.enabled);
  return out;
}

// ─── GET /api/compliance/escalation-rules ──────────────────────────────────────
export async function handleListComplianceEscalationRules(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const rules = await db(sql`
      SELECT * FROM compliance_escalation_rules WHERE company_id = ${user.companyId} ORDER BY created_at DESC
    `);

    return jsonResponse({ escalationRules: rules.map(serializeEscalationRule) });
  } catch (e) {
    console.error("list escalation rules error:", e);
    return jsonResponse({ error: "Failed to load escalation rules" }, 500);
  }
}

// ─── POST /api/compliance/escalation-rules ─────────────────────────────────────
export async function handleCreateComplianceEscalationRule(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (!isComplianceAdmin(user)) {
      return jsonResponse({ error: "Only compliance admins can manage escalation rules" }, 403);
    }

    const body = await req.json();
    if (!body.name) return jsonResponse({ error: "Name is required" }, 400);

    const id = crypto.randomUUID();
    await db(sql`
      INSERT INTO compliance_escalation_rules (id, company_id, name, trigger_type, trigger_config, action, notify_user_ids, enabled)
      VALUES (${id}, ${user.companyId}, ${body.name}, ${body.trigger_type || "severity"},
        ${JSON.stringify(body.trigger_config ?? {})}, ${body.action || "notify"},
        ${JSON.stringify(Array.isArray(body.notify_user_ids) ? body.notify_user_ids : [])},
        ${body.enabled === undefined ? 1 : (body.enabled ? 1 : 0)})
    `);

    await audit(user, "create_compliance_escalation_rule", "compliance_escalation_rule", id, `Created escalation rule: ${body.name}`);

    return jsonResponse({ success: true, id });
  } catch (e) {
    console.error("create escalation rule error:", e);
    return jsonResponse({ error: "Failed to create escalation rule" }, 500);
  }
}

// ─── PUT /api/compliance/escalation-rules/:id ──────────────────────────────────
export async function handleUpdateComplianceEscalationRule(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (!isComplianceAdmin(user)) {
      return jsonResponse({ error: "Only compliance admins can manage escalation rules" }, 403);
    }

    const ruleId = new URL(req.url).pathname.split("/").pop();
    const body = await req.json();
    const sets: string[] = [];
    if (body.name !== undefined) sets.push(`name = ${esc(body.name)}`);
    if (body.trigger_type !== undefined) sets.push(`trigger_type = ${esc(body.trigger_type)}`);
    if (body.trigger_config !== undefined) sets.push(`trigger_config = ${esc(JSON.stringify(body.trigger_config ?? {}))}`);
    if (body.action !== undefined) sets.push(`action = ${esc(body.action)}`);
    if (body.notify_user_ids !== undefined) sets.push(`notify_user_ids = ${esc(JSON.stringify(Array.isArray(body.notify_user_ids) ? body.notify_user_ids : []))}`);
    if (body.enabled !== undefined) sets.push(`enabled = ${esc(body.enabled ? 1 : 0)}`);

    if (sets.length === 0) return jsonResponse({ error: "No fields to update" }, 400);

    await db(`UPDATE compliance_escalation_rules SET ${sets.join(", ")} WHERE id = ${esc(ruleId)} AND company_id = ${esc(user.companyId)}`);
    await audit(user, "update_compliance_escalation_rule", "compliance_escalation_rule", ruleId, "Updated escalation rule");

    return jsonResponse({ success: true });
  } catch (e) {
    console.error("update escalation rule error:", e);
    return jsonResponse({ error: "Failed to update escalation rule" }, 500);
  }
}

// ─── DELETE /api/compliance/escalation-rules/:id ───────────────────────────────
export async function handleDeleteComplianceEscalationRule(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (!isComplianceAdmin(user)) {
      return jsonResponse({ error: "Only compliance admins can manage escalation rules" }, 403);
    }

    const ruleId = new URL(req.url).pathname.split("/").pop();
    await db(sql`DELETE FROM compliance_escalation_rules WHERE id = ${ruleId} AND company_id = ${user.companyId}`);
    await audit(user, "delete_compliance_escalation_rule", "compliance_escalation_rule", ruleId, "Deleted escalation rule");

    return jsonResponse({ success: true });
  } catch (e) {
    console.error("delete escalation rule error:", e);
    return jsonResponse({ error: "Failed to delete escalation rule" }, 500);
  }
}
