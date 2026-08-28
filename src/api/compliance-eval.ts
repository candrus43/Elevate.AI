/**
 * AI Compliance Evaluation — Phase C-3a
 *
 * Turns a call transcript + the tenant's ACTIVE compliance rules into
 * evidence-backed findings, written directly to the `compliance_findings` table.
 *
 * Core Principle 2 (strict): ElevateAI is NOT the legal authority. Every finding
 * is created with status = "AI_FLAGGED" (requires human review) and is never
 * auto-confirmed. Low-confidence results are marked confidence = "requires_review".
 */

import { sql } from "~/utils/sql";
import { db, jsonResponse, getAuthUser, isComplianceReviewer } from "./middleware";
import { getOpenAIConfig, callOpenAI, getComplianceEvalSystemPrompt } from "./openai";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface EvalRule {
  id: string;
  name: string;
  description: string;
  rule_type: string;
  severity: string;
  version: number;
  script_required_phrases: string[];
  prohibited_phrases: string[];
  approved_language: string[];
  prohibited_language: string[];
  compliant_examples: string[];
  noncompliant_examples: string[];
}

interface EvalFinding {
  rule_id: string;
  rule_version: number;
  severity: string;
  confidence: string; // high | medium | low | requires_review
  evidence_excerpt: string;
  evidence_timestamp: string | null;
  explanation: string;
  approved_alternative: string;
  recommended_action: string;
}

const VALID_SEVERITIES = ["informational", "low", "medium", "high", "critical"];
const VALID_CONFIDENCES = ["high", "medium", "low", "requires_review"];

// ─── Rule / transcript loading ─────────────────────────────────────────────────

function parseJsonArray(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      /* fall through */
    }
  }
  return [];
}

/** Load the tenant's ACTIVE compliance rules, fully parsed for evaluation. */
async function loadActiveRules(companyId: string): Promise<EvalRule[]> {
  const rows = await db(sql`
    SELECT id, name, description, rule_type, severity, version,
           script_required_phrases, prohibited_phrases,
           approved_language, prohibited_language,
           compliant_examples, noncompliant_examples
    FROM compliance_rules
    WHERE company_id = ${companyId}
      AND is_active = 1
      AND (status = 'active' OR status = '' OR status IS NULL)
    ORDER BY severity DESC, name
  `);

  return rows.map((r: any) => ({
    id: r.id,
    name: r.name || "",
    description: r.description || "",
    rule_type: r.rule_type || "must_say",
    severity: r.severity || "medium",
    version: typeof r.version === "number" ? r.version : Number(r.version ?? 1),
    script_required_phrases: parseJsonArray(r.script_required_phrases),
    prohibited_phrases: parseJsonArray(r.prohibited_phrases),
    approved_language: parseJsonArray(r.approved_language),
    prohibited_language: parseJsonArray(r.prohibited_language),
    compliant_examples: parseJsonArray(r.compliant_examples),
    noncompliant_examples: parseJsonArray(r.noncompliant_examples),
  }));
}

/** Load a call's transcript (and basic metadata) for the given tenant. */
async function loadCall(callId: string, companyId: string): Promise<{ transcript: string; status: string } | null> {
  const rows = await db(sql`
    SELECT transcript, status FROM calls WHERE id = ${callId} AND company_id = ${companyId} LIMIT 1
  `);
  if (rows.length === 0) return null;
  return { transcript: rows[0].transcript || "", status: rows[0].status || "" };
}

// ─── AI evaluation (primary) ───────────────────────────────────────────────────

function buildRulesBlock(rules: EvalRule[]): string {
  const compact = rules.map((r) => ({
    id: r.id,
    version: r.version,
    name: r.name,
    description: r.description,
    rule_type: r.rule_type,
    severity: r.severity,
    required_phrases: r.script_required_phrases,
    prohibited_phrases: [...r.prohibited_phrases, ...r.prohibited_language],
    approved_language: r.approved_language,
  }));
  return JSON.stringify(compact);
}

async function evaluateWithAI(
  companyId: string,
  transcript: string,
  rules: EvalRule[],
): Promise<EvalFinding[] | null> {
  if (rules.length === 0) return [];
  const config = await getOpenAIConfig(companyId);
  if (!config?.apiKey) return null;

  const result = await callOpenAI(config, {
    model: config.model,
    messages: [
      { role: "system", content: getComplianceEvalSystemPrompt() },
      {
        role: "user",
        content:
          `ACTIVE RULES:\n${buildRulesBlock(rules)}\n\n` +
          `CALL TRANSCRIPT:\n${transcript || "(empty — no transcript available)"}`,
      },
    ],
    max_tokens: 3072,
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  if (!result.success || !result.content) return null;

  try {
    const parsed = JSON.parse(result.content);
    const rawFindings = Array.isArray(parsed.findings) ? parsed.findings : [];
    return normalizeAIForward(rawFindings, rules);
  } catch (err) {
    console.error("compliance-eval: failed to parse AI response:", err);
    return null;
  }
}

/** Sanitize + validate AI output, mapping numeric confidence to enum strings. */
function normalizeAIForward(raw: any[], rules: EvalRule[]): EvalFinding[] {
  const validRuleIds = new Set(rules.map((r) => r.id));
  const ruleVersionById = new Map(rules.map((r) => [r.id, r.version]));
  const out: EvalFinding[] = [];

  for (const f of raw) {
    if (!f || typeof f !== "object") continue;
    const ruleId = String(f.rule_id || f.ruleId || "");
    if (!ruleId || !validRuleIds.has(ruleId)) continue;

    const confidence = mapConfidence(f.confidence);
    out.push({
      rule_id: ruleId,
      rule_version: Number(f.rule_version ?? ruleVersionById.get(ruleId) ?? 1),
      severity: VALID_SEVERITIES.includes(f.severity) ? f.severity : "medium",
      confidence,
      evidence_excerpt: String(f.evidence_excerpt || "").slice(0, 2000),
      evidence_timestamp: f.evidence_timestamp ? String(f.evidence_timestamp).slice(0, 32) : null,
      explanation: String(f.explanation || "").slice(0, 2000),
      approved_alternative: String(f.approved_alternative || "").slice(0, 2000),
      recommended_action: String(f.recommended_action || "").slice(0, 500),
    });
  }
  return out;
}

function mapConfidence(raw: unknown): string {
  if (typeof raw === "number") {
    if (raw >= 0.85) return "high";
    if (raw >= 0.7) return "medium";
    if (raw >= 0.5) return "low";
    return "requires_review";
  }
  const s = String(raw || "").toLowerCase();
  if (s === "high") return "high";
  if (s === "medium") return "medium";
  if (s === "low") return "low";
  if (s === "requires_review" || s === "requires review") return "requires_review";
  // Unknown confidence → require review (never assume confidence).
  return "requires_review";
}

// ─── Deterministic fallback (no AI / no config) ────────────────────────────────

/**
 * Keyword-based fallback so the feature works even without a configured AI
 * provider. Produces the same AI_FLAGGED status; confidence reflects that this
 * is heuristic matching rather than semantic analysis.
 */
function evaluateWithRules(transcript: string, rules: EvalRule[]): EvalFinding[] {
  const findings: EvalFinding[] = [];
  const lower = (transcript || "").toLowerCase();
  if (!lower.trim()) return findings;

  for (const rule of rules) {
    // must_not_say / prohibited phrases
    const prohibited = [...rule.prohibited_phrases, ...rule.prohibited_language];
    for (const phrase of prohibited) {
      if (!phrase) continue;
      const idx = lower.indexOf(phrase.toLowerCase());
      if (idx >= 0) {
        findings.push({
          rule_id: rule.id,
          rule_version: rule.version,
          severity: rule.severity,
          confidence: "medium",
          evidence_excerpt: phrase,
          evidence_timestamp: null,
          explanation: `Prohibited phrase "${phrase}" matched in transcript (heuristic keyword match).`,
          approved_alternative: rule.approved_language[0] || "",
          recommended_action: "confirm",
        });
        break; // one finding per rule is enough for deterministic fallback
      }
    }

    // must_say / required phrases (missing → finding)
    if (rule.rule_type === "must_say" || rule.rule_type === "must_disclose" || rule.rule_type === "must_receive_consent") {
      const required = rule.script_required_phrases;
      if (required.length > 0) {
        const missing = required.filter((p) => p && !lower.includes(p.toLowerCase()));
        if (missing.length > 0) {
          findings.push({
            rule_id: rule.id,
            rule_version: rule.version,
            severity: rule.severity,
            confidence: "low",
            evidence_excerpt: "",
            evidence_timestamp: null,
            explanation: `Required language not detected in transcript: ${missing.join(", ")}.`,
            approved_alternative: missing[0] || "",
            recommended_action: "confirm",
          });
        }
      }
    }
  }
  return findings;
}

// ─── Persistence ────────────────────────────────────────────────────────────────

async function storeFindings(companyId: string, callId: string, findings: EvalFinding[]): Promise<number> {
  const now = new Date().toISOString();
  let inserted = 0;
  for (const f of findings) {
    await db(sql`
      INSERT INTO compliance_findings (
        id, company_id, call_id, rule_id, rule_version, severity, confidence,
        evidence_excerpt, evidence_timestamp, explanation, approved_alternative,
        recommended_action, status, created_at, updated_at
      ) VALUES (
        ${crypto.randomUUID()}, ${companyId}, ${callId}, ${f.rule_id},
        ${f.rule_version}, ${f.severity}, ${f.confidence},
        ${f.evidence_excerpt}, ${f.evidence_timestamp}, ${f.explanation},
        ${f.approved_alternative}, ${f.recommended_action},
        'AI_FLAGGED', ${now}, ${now}
      )
    `);
    inserted++;
  }
  return inserted;
}

// ─── Orchestrator ───────────────────────────────────────────────────────────────

/**
 * Evaluate one call against the tenant's active rules and persist findings.
 * Returns { callId, findings, inserted, mode }.
 */
export async function evaluateCallCompliance(
  callId: string,
  companyId: string,
): Promise<{ callId: string; findings: EvalFinding[]; inserted: number; mode: "ai" | "rules" | "none" }> {
  const call = await loadCall(callId, companyId);
  if (!call) throw new Error("Call not found");
  if (!call.transcript || !call.transcript.trim()) {
    return { callId, findings: [], inserted: 0, mode: "none" };
  }

  const rules = await loadActiveRules(companyId);
  if (rules.length === 0) {
    return { callId, findings: [], inserted: 0, mode: "none" };
  }

  let findings: EvalFinding[] | null = await evaluateWithAI(companyId, call.transcript, rules);
  let mode: "ai" | "rules" = "ai";

  if (findings === null) {
    findings = evaluateWithRules(call.transcript, rules);
    mode = "rules";
  }

  const inserted = await storeFindings(companyId, callId, findings);
  return { callId, findings, inserted, mode };
}

// ─── Route handler ──────────────────────────────────────────────────────────────

// ─── POST /api/compliance/evaluate ──────────────────────────────────────────────
export async function handleEvaluateCallCompliance(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (!isComplianceReviewer(user)) {
      return jsonResponse({ error: "Insufficient permissions to run compliance evaluation" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const callId = body.call_id || body.callId;
    if (!callId) return jsonResponse({ error: "call_id is required" }, 400);

    // Verify the call belongs to this tenant before evaluating.
    const callRows = await db(sql`SELECT id FROM calls WHERE id = ${callId} AND company_id = ${user.companyId} LIMIT 1`);
    if (callRows.length === 0) return jsonResponse({ error: "Call not found" }, 404);

    const result = await evaluateCallCompliance(callId, user.companyId);

    return jsonResponse({
      success: true,
      call_id: result.callId,
      mode: result.mode,
      findings_count: result.findings.length,
      inserted: result.inserted,
      findings: result.findings,
    });
  } catch (e) {
    console.error("compliance evaluate error:", e);
    return jsonResponse({ error: "Failed to evaluate call compliance" }, 500);
  }
}

// ─── Batch: evaluate all analyzed calls for a company ──────────────────────────
// POST /api/compliance/evaluate/all
export async function handleEvaluateAllCalls(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (!isComplianceReviewer(user)) {
      return jsonResponse({ error: "Insufficient permissions to run compliance evaluation" }, 403);
    }

    const rows = await db(sql`
      SELECT c.id FROM calls c
      WHERE c.company_id = ${user.companyId}
        AND c.status = 'analyzed'
        AND c.transcript != ''
      ORDER BY c.created_at DESC
      LIMIT 100
    `);

    let evaluated = 0;
    let inserted = 0;
    for (const row of rows) {
      try {
        const r = await evaluateCallCompliance(row.id, user.companyId);
        evaluated++;
        inserted += r.inserted;
      } catch (e) {
        console.error(`compliance evaluate failed for call ${row.id}:`, e);
      }
    }

    return jsonResponse({ success: true, calls_evaluated: evaluated, findings_inserted: inserted });
  } catch (e) {
    console.error("compliance evaluate all error:", e);
    return jsonResponse({ error: "Failed to evaluate calls" }, 500);
  }
}
