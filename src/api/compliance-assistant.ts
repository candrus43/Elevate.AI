/**
 * Compliance AI Assistant — Phase E (backend)
 *
 * Natural-language Q&A for managers / compliance reviewers, grounded ONLY in the
 * tenant's real compliance data. Never fabricates numbers.
 *
 * Endpoints:
 *   POST /api/compliance/assistant/ask     — answer a question
 *   GET  /api/compliance/assistant/context — return the grounding payload
 *
 * Grounding strategy: a single tenant-scoped query over `compliance_findings`
 * (joined to rules / calls / agents / teams) is aggregated into the same shape the
 * Compliance Center "Reports" and Executive rollup expose. The aggregation
 * constants below intentionally mirror `compliance-reporting.ts` and
 * `compliance-risk.ts` so the assistant's numbers match the UI (no drift in
 * definitions). We do NOT import/modify those files; the DB is re-queried directly.
 *
 * Core principles honored:
 *  - No fabrication — numbers come only from stored rows; empty tenants get an
 *    explicit "no data" message, never invented counts.
 *  - ElevateAI is NOT the legal authority — legal-advice questions are declined
 *    with a fixed, non-legal response (both a fast keyword guard and a model
 *    instruction).
 *  - Reuses the existing AI provider (same client/config as call analysis and
 *    coaching) — no new provider.
 */

import { esc } from "~/utils/sql";
import { db, jsonResponse, getAuthUser, isComplianceReviewer } from "./middleware";
import { logAuditEvent } from "./admin";
import { getOpenAIConfig, callOpenAI } from "./openai";

// ─── Constants (mirror reporting/risk modules) ─────────────────────────────────

const SEVERITIES = ["critical", "high", "medium", "low", "informational"] as const;
const STATUSES = [
  "AI_FLAGGED",
  "PENDING_REVIEW",
  "CONFIRMED",
  "DISMISSED",
  "NEEDS_COACHING",
  "ESCALATED",
  "RESOLVED",
] as const;

const OPEN_STATUSES = new Set<string>(["AI_FLAGGED", "PENDING_REVIEW", "CONFIRMED", "NEEDS_COACHING", "ESCALATED"]);
const NEEDS_REVIEW_STATUSES = new Set<string>(["AI_FLAGGED", "PENDING_REVIEW"]);
const SCORED_STATUSES = new Set<string>(["CONFIRMED", "AI_FLAGGED"]);

const RISK_WEIGHTS: Record<string, number> = {
  critical: 40,
  high: 28,
  medium: 16,
  low: 6,
  informational: 2,
};

const COMPLIANCE_DEDUCTIONS: Record<string, number> = {
  critical: 20,
  high: 12,
  medium: 6,
  low: 2,
  informational: 1,
};

const TOP_N = 5;

// ─── Types ─────────────────────────────────────────────────────────────────────

interface FindingRow {
  severity: string;
  status: string;
  confidence: string | null;
  rule_name: string | null;
  rule_type: string | null;
  agent_id: string | null;
  agent_name: string | null;
  team_id: string | null;
  team_name: string | null;
}

interface SeverityCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
  informational: number;
}

interface GroundingContext {
  has_data: boolean;
  summary: {
    total_findings: number;
    open_findings: number;
    resolved_findings: number;
    requires_human_review: number;
    by_severity: SeverityCounts;
    by_status: Record<string, number>;
    compliance_score: { score: number | null; state: "scored" | "insufficient_data" };
  };
  top_rules: Array<{ rule_name: string; rule_type: string; total: number; open: number; by_severity: SeverityCounts }>;
  top_agents: Array<{ agent_name: string; team_name: string | null; total: number; open: number; by_severity: SeverityCounts }>;
  highest_risk_team: { team_name: string; open_findings: number; critical_high: number } | null;
  sources: string[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function emptySeverityCounts(): SeverityCounts {
  return { critical: 0, high: 0, medium: 0, low: 0, informational: 0 };
}

function emptyStatusCounts(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of STATUSES) out[s] = 0;
  return out;
}

function normSeverity(s: unknown): string {
  const v = String(s || "medium").toLowerCase();
  return (SEVERITIES as readonly string[]).includes(v) ? v : "medium";
}

function normStatus(s: unknown): string {
  return String(s || "AI_FLAGGED");
}

function computeComplianceScore(findings: Array<{ severity: string; status: string }>): { score: number | null; state: "scored" | "insufficient_data" } {
  if (findings.length === 0) return { score: null, state: "insufficient_data" };
  let deduction = 0;
  for (const f of findings) {
    if (SCORED_STATUSES.has(f.status)) deduction += COMPLIANCE_DEDUCTIONS[f.severity] ?? 0;
  }
  return { score: Math.max(0, 100 - deduction), state: "scored" };
}

/** Lightweight pre-check for obvious legal-advice / legal-conclusion requests. */
function isLegalAdviceQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  const phrases = [
    "legal advice",
    "legal opinion",
    "legal conclusion",
    "legal counsel",
    "attorney",
    "lawyer",
    "lawsuit",
    "litigation",
    "liability",
    "liable",
    "is this legal",
    "legal action",
    "class action",
  ];
  if (phrases.some((p) => lower.includes(p))) return true;
  return /\bsue[ds]?\b|\bsuing\b|\bsues\b/.test(lower);
}

// ─── Grounding context ─────────────────────────────────────────────────────────

async function buildGroundingContext(companyId: string): Promise<GroundingContext> {
  const rows = (await db(`
    SELECT
      f.severity, f.status, f.confidence,
      cr.name AS rule_name, cr.rule_type AS rule_type,
      c.user_id AS agent_id, u.name AS agent_name, u.team_id AS team_id,
      t.name AS team_name
    FROM compliance_findings f
    LEFT JOIN compliance_rules cr ON cr.id = f.rule_id
    LEFT JOIN calls c ON c.id = f.call_id
    LEFT JOIN users u ON u.id = c.user_id
    LEFT JOIN teams t ON t.id = u.team_id
    WHERE f.company_id = ${esc(companyId)}
  `)) as FindingRow[];

  const hasData = rows.length > 0;

  const by_severity = emptySeverityCounts();
  const by_status = emptyStatusCounts();
  let total = 0;
  let open = 0;
  let resolved = 0;
  let requiresHumanReview = 0;
  const scoredFindings: Array<{ severity: string; status: string }> = [];

  const ruleMap = new Map<string, { rule_name: string; rule_type: string; total: number; open: number; by_severity: SeverityCounts; risk: number }>();
  const agentMap = new Map<string, { agent_name: string; team_name: string | null; total: number; open: number; by_severity: SeverityCounts; risk: number }>();
  const teamMap = new Map<string, { team_name: string; open_findings: number; critical_high: number; risk: number }>();

  for (const f of rows) {
    total++;
    const sev = normSeverity(f.severity);
    const st = normStatus(f.status);

    by_severity[sev as keyof SeverityCounts] = (by_severity[sev as keyof SeverityCounts] ?? 0) + 1;
    by_status[st] = (by_status[st] ?? 0) + 1;
    if (OPEN_STATUSES.has(st)) open++;
    else resolved++;
    if (NEEDS_REVIEW_STATUSES.has(st) || (f.confidence || "").toLowerCase() === "requires_review") requiresHumanReview++;

    scoredFindings.push({ severity: sev, status: st });

    // Rule aggregation
    const rKey = f.rule_name || "(deleted rule)";
    if (!ruleMap.has(rKey)) {
      ruleMap.set(rKey, { rule_name: rKey, rule_type: f.rule_type || "", total: 0, open: 0, by_severity: emptySeverityCounts(), risk: 0 });
    }
    const rAgg = ruleMap.get(rKey)!;
    rAgg.total++;
    rAgg.by_severity[sev as keyof SeverityCounts] = (rAgg.by_severity[sev as keyof SeverityCounts] ?? 0) + 1;
    if (OPEN_STATUSES.has(st)) {
      rAgg.open++;
      rAgg.risk += RISK_WEIGHTS[sev] ?? 0;
    }

    // Agent aggregation
    if (f.agent_id) {
      if (!agentMap.has(f.agent_id)) {
        agentMap.set(f.agent_id, { agent_name: f.agent_name || "Unknown agent", team_name: f.team_name ?? null, total: 0, open: 0, by_severity: emptySeverityCounts(), risk: 0 });
      }
      const aAgg = agentMap.get(f.agent_id)!;
      aAgg.total++;
      aAgg.by_severity[sev as keyof SeverityCounts] = (aAgg.by_severity[sev as keyof SeverityCounts] ?? 0) + 1;
      if (OPEN_STATUSES.has(st)) {
        aAgg.open++;
        aAgg.risk += RISK_WEIGHTS[sev] ?? 0;
      }
    }

    // Team aggregation (open risk only)
    if (f.team_id && OPEN_STATUSES.has(st)) {
      if (!teamMap.has(f.team_id)) {
        teamMap.set(f.team_id, { team_name: f.team_name || "Unnamed team", open_findings: 0, critical_high: 0, risk: 0 });
      }
      const tAgg = teamMap.get(f.team_id)!;
      tAgg.open_findings++;
      if (sev === "critical" || sev === "high") tAgg.critical_high++;
      tAgg.risk += RISK_WEIGHTS[sev] ?? 0;
    }
  }

  const topRules = [...ruleMap.values()]
    .sort((a, b) => b.risk - a.risk || b.total - a.total)
    .slice(0, TOP_N)
    .map(({ risk: _risk, ...rest }) => rest);

  const topAgents = [...agentMap.values()]
    .sort((a, b) => b.risk - a.risk || b.total - a.total)
    .slice(0, TOP_N)
    .map(({ risk: _risk, ...rest }) => rest);

  const topTeam = [...teamMap.values()].sort((a, b) => b.risk - a.risk)[0] ?? null;
  const highestRiskTeam = topTeam
    ? { team_name: topTeam.team_name, open_findings: topTeam.open_findings, critical_high: topTeam.critical_high }
    : null;

  return {
    has_data: hasData,
    summary: {
      total_findings: total,
      open_findings: open,
      resolved_findings: resolved,
      requires_human_review: requiresHumanReview,
      by_severity,
      by_status,
      compliance_score: computeComplianceScore(scoredFindings),
    },
    top_rules: topRules,
    top_agents: topAgents,
    highest_risk_team: highestRiskTeam,
    sources: ["summary", "by-rule", "by-agent", "team-risk"],
  };
}

// ─── System prompt ─────────────────────────────────────────────────────────────

const ASSISTANT_SYSTEM_PROMPT = `You are ElevateAI's compliance assistant for a sales organization. You answer questions from managers and compliance reviewers about the tenant's compliance program, using ONLY the structured data provided under "COMPLIANCE CONTEXT".

STRICT RULES:
1. Ground every factual claim, number, count, score, or trend in the COMPLIANCE CONTEXT. Never invent, estimate, or extrapolate numbers that are not present.
2. If the context does not contain the information needed to answer, say so explicitly (e.g., "I don't have that data") rather than guessing.
3. You are NOT a legal authority. If the question asks for legal advice, a legal opinion, or a legal conclusion (for example whether something is "legal", "illegal", "compliant with law", or exposes the company to liability), respond that ElevateAI is not a legal authority, that compliance findings are evaluated against customer-approved rules and require human review, and that the user should consult qualified legal counsel. Never provide legal advice.
4. Keep answers concise and specific, citing the relevant numbers from the context.
5. Respond ONLY with a JSON object in the form {"answer": "..."}.`;

// ─── POST /api/compliance/assistant/ask ───────────────────────────────────────
export async function handleComplianceAssistantAsk(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (!isComplianceReviewer(user)) return jsonResponse({ error: "Insufficient permissions" }, 403);

    const body = await req.json().catch(() => ({}));
    const question = String(body.question || body.prompt || "").trim();
    if (!question) return jsonResponse({ error: "question is required" }, 400);

    // Fast-path guardrail: decline legal-advice requests before touching the AI.
    if (isLegalAdviceQuestion(question)) {
      await logAuditEvent(user.companyId, user.id, "ask_compliance_assistant", "compliance_assistant", null, `question=${question.slice(0, 200)} (legal refusal)`);
      return jsonResponse({
        kind: "legal_refusal",
        answer: "I can't provide legal advice or a legal conclusion. ElevateAI is not a legal authority — compliance findings are evaluated against your organization's own customer-approved rules and are flagged for human review. For legal questions, please consult qualified legal counsel.",
        grounded: false,
        sources: [],
        context: null,
      });
    }

    const context = await buildGroundingContext(user.companyId);

    // No data → explicit empty-state answer, never invented numbers.
    if (!context.has_data) {
      await logAuditEvent(user.companyId, user.id, "ask_compliance_assistant", "compliance_assistant", null, `question=${question.slice(0, 200)} (no data)`);
      return jsonResponse({
        kind: "no_data",
        answer: "No compliance data yet — connect calls and define compliance rules first, then run a compliance evaluation. Once findings exist I can summarize risk, trends, and coaching needs.",
        grounded: false,
        sources: [],
        context,
      });
    }

    const config = await getOpenAIConfig(user.companyId);
    if (!config?.apiKey) {
      await logAuditEvent(user.companyId, user.id, "ask_compliance_assistant", "compliance_assistant", null, `question=${question.slice(0, 200)} (no AI provider)`);
      return jsonResponse({
        kind: "no_ai",
        answer: "I can't answer yet — no AI provider is configured. An admin can add one under Settings → AI Provider.",
        grounded: false,
        sources: [],
        context,
      });
    }

    const result = await callOpenAI(config, {
      model: config.model,
      messages: [
        { role: "system", content: ASSISTANT_SYSTEM_PROMPT },
        {
          role: "user",
          content: `QUESTION: ${question}\n\nCOMPLIANCE CONTEXT (the ONLY data you may use):\n${JSON.stringify(context)}`,
        },
      ],
      max_tokens: 1024,
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    if (!result.success || !result.content) {
      await logAuditEvent(user.companyId, user.id, "ask_compliance_assistant", "compliance_assistant", null, `question=${question.slice(0, 200)} (AI error)`);
      return jsonResponse({
        kind: "error",
        answer: "Sorry, I couldn't generate an answer right now. Please try again.",
        grounded: false,
        sources: [],
        context,
        error: result.error || "AI provider error",
      });
    }

    let answer = "";
    try {
      const parsed = JSON.parse(result.content);
      answer = String(parsed.answer || "").trim();
    } catch {
      // If the model returned plain text rather than JSON, fall back to it.
      answer = String(result.content).trim();
    }
    if (!answer) answer = "Sorry, I couldn't generate an answer. Please try again.";

    await logAuditEvent(user.companyId, user.id, "ask_compliance_assistant", "compliance_assistant", null, `question=${question.slice(0, 200)} (answered)`);

    return jsonResponse({
      kind: "answer",
      answer,
      grounded: true,
      sources: context.sources,
      context,
    });
  } catch (e) {
    console.error("compliance assistant ask error:", e);
    return jsonResponse({ error: "Failed to answer compliance question" }, 500);
  }
}

// ─── GET /api/compliance/assistant/context ────────────────────────────────────
export async function handleComplianceAssistantContext(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (!isComplianceReviewer(user)) return jsonResponse({ error: "Insufficient permissions" }, 403);

    const context = await buildGroundingContext(user.companyId);

    await logAuditEvent(user.companyId, user.id, "view_compliance_assistant_context", "compliance_assistant", null, `has_data=${context.has_data}`);

    return jsonResponse(context);
  } catch (e) {
    console.error("compliance assistant context error:", e);
    return jsonResponse({ error: "Failed to load compliance assistant context" }, 500);
  }
}
