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
 * Grounding strategy: the assistant calls the existing reporting/risk handlers
 * (compliance-reporting.ts + compliance-risk.ts) internally and feeds their
 * responses to the model as structured context. We do NOT re-implement or
 * duplicate their aggregation — we consume their output so the assistant's
 * numbers are identical to the Reports / risk endpoints.
 *
 * Core principles honored:
 *  - No fabrication — numbers come only from the grounded handlers; empty
 *    tenants get an explicit "no data" message, never invented counts.
 *  - ElevateAI is NOT the legal authority — legal-advice questions are declined
 *    with a fixed, non-legal response (fast keyword guard + model instruction).
 *  - Reuses the existing AI provider (same client/config as call analysis and
 *    coaching) — no new provider.
 */

import { jsonResponse, getAuthUser, isComplianceReviewer } from "./middleware";
import { logAuditEvent } from "./admin";
import { getOpenAIConfig, callOpenAI } from "./openai";
import {
  handleComplianceReportSummary,
  handleComplianceReportByRule,
  handleComplianceReportByAgent,
} from "./compliance-reporting";
import { handleGetTeamRisk } from "./compliance-risk";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface GroundingContext {
  has_data: boolean;
  summary: unknown;
  top_rules: unknown[];
  top_agents: unknown[];
  team_risk: unknown;
  sources: string[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

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

async function safeJson(resp: Response, fallback: unknown): Promise<unknown> {
  if (!resp || !resp.ok) return fallback;
  try {
    return await resp.json();
  } catch {
    return fallback;
  }
}

// ─── Grounding context (calls the existing reporting/risk handlers) ────────────

async function buildGroundingContext(req: Request): Promise<GroundingContext> {
  // Sequential calls — each handler performs its own auth + audit + queries.
  const summary = await safeJson(await handleComplianceReportSummary(req), null);
  const byRule = await safeJson(await handleComplianceReportByRule(req), null);
  const byAgent = await safeJson(await handleComplianceReportByAgent(req), null);
  const teamRisk = await safeJson(await handleGetTeamRisk(req), null);

  const totalFindings = Number((summary as any)?.total_findings ?? 0);
  const hasData = totalFindings > 0;

  return {
    has_data: hasData,
    summary,
    top_rules: (byRule as any)?.rules ?? [],
    top_agents: (byAgent as any)?.agents ?? [],
    team_risk: teamRisk
      ? {
          team_risk_score: (teamRisk as any).team_risk_score,
          risk_level: (teamRisk as any).risk_level,
          agent_count: (teamRisk as any).agent_count,
          agents_with_risk: (teamRisk as any).agents_with_risk,
          max_agent_risk: (teamRisk as any).max_agent_risk,
        }
      : null,
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

    const context = await buildGroundingContext(req);

    // No data → explicit empty-state answer, never invented numbers.
    if (!context.has_data) {
      await logAuditEvent(user.companyId, user.id, "ask_compliance_assistant", "compliance_assistant", null, `question=${question.slice(0, 200)} (no data)`);
      return jsonResponse({
        kind: "no_data",
        answer: "No compliance data yet — connect calls, define compliance rules, and run a compliance evaluation first. Once findings exist I can summarize risk, trends, and coaching needs.",
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

    const context = await buildGroundingContext(req);

    await logAuditEvent(user.companyId, user.id, "view_compliance_assistant_context", "compliance_assistant", null, `has_data=${context.has_data}`);

    return jsonResponse(context);
  } catch (e) {
    console.error("compliance assistant context error:", e);
    return jsonResponse({ error: "Failed to load compliance assistant context" }, 500);
  }
}
