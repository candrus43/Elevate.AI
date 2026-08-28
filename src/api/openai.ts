/**
 * OpenAI API Client — Powers call analysis, role-play, coaching, and live coaching.
 * Hybrid architecture:
 *   Demo mode → rule-based scripts (current behavior)
 *   Live mode  → OpenAI GPT-4o-mini API calls
 */

import { sql } from "~/utils/sql";
import { db, jsonResponse, getAuthUser } from "./middleware";

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_MODEL = "gpt-4o-mini";
const MAX_TOKENS = 4096;
const TIMEOUT_MS = 30000;

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  organizationId?: string;
  baseUrl?: string;
}

export interface OpenAIRequest {
  model: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  max_tokens?: number;
  temperature?: number;
  response_format?: { type: "json_object" | "text" };
  signal?: AbortSignal;
}

export interface OpenAIResponse {
  success: boolean;
  content?: string;
  error?: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIG MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export async function getOpenAIConfig(companyId: string): Promise<OpenAIConfig | null> {
  const rows = await db(sql`
    SELECT api_key, model, max_tokens, organization_id, base_url
    FROM openai_config WHERE company_id = ${companyId} LIMIT 1
  `);
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    apiKey: row.api_key,
    model: row.model || DEFAULT_MODEL,
    maxTokens: row.max_tokens || MAX_TOKENS,
    organizationId: row.organization_id,
    baseUrl: row.base_url || undefined,
  };
}

export async function saveOpenAIConfig(companyId: string, config: Partial<OpenAIConfig>): Promise<void> {
  const existing = await db(sql`SELECT id FROM openai_config WHERE company_id = ${companyId} LIMIT 1`);
  if (existing.length > 0) {
    await db(sql`
      UPDATE openai_config SET
        api_key = COALESCE(${config.apiKey || null}, api_key),
        model = COALESCE(${config.model || null}, model),
        max_tokens = COALESCE(${config.maxTokens || null}, max_tokens),
        organization_id = COALESCE(${config.organizationId || null}, organization_id),
        base_url = COALESCE(${config.baseUrl || null}, base_url),
        updated_at = datetime('now')
      WHERE company_id = ${companyId}
    `);
  } else {
    await db(sql`
      INSERT INTO openai_config (id, company_id, api_key, model, max_tokens, organization_id, base_url)
      VALUES (${crypto.randomUUID()}, ${companyId}, ${config.apiKey || ""}, ${config.model || DEFAULT_MODEL}, ${config.maxTokens || MAX_TOKENS}, ${config.organizationId || ""}, ${config.baseUrl || "https://api.openai.com/v1"})
    `);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPENAI API CALL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Make an OpenAI chat completion call.
 * Returns parsed JSON content when response_format is json_object.
 */
export async function callOpenAI(config: OpenAIConfig, request: OpenAIRequest): Promise<OpenAIResponse> {
  try {
    // Use external signal if provided, otherwise create our own
    const externalSignal = request.signal;
    let controller: AbortController | null = null;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    if (!externalSignal) {
      controller = new AbortController();
      timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    }

    const signal = externalSignal || controller!.signal;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.apiKey}`,
    };
    if (config.organizationId) headers["OpenAI-Organization"] = config.organizationId;

    const baseUrl = (config.baseUrl || "https://api.openai.com/v1").replace(/\/$/, "");

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: request.model || config.model,
        messages: request.messages,
        max_tokens: request.max_tokens || config.maxTokens,
        temperature: request.temperature ?? 0.7,
        response_format: request.response_format,
      }),
      signal,
    });

    if (timeout) clearTimeout(timeout);

    if (!response.ok) {
      const errorBody = await response.text();
      return { success: false, error: `OpenAI API error ${response.status}: ${errorBody}` };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    return { success: true, content, usage };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown OpenAI error";
    return { success: false, error: message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS: System Prompts
// ═══════════════════════════════════════════════════════════════════════════════

export function getCallAnalysisSystemPrompt(): string {
  return `You are an expert sales call analyst. Analyze the call transcript and return a JSON object with:
- "overall_score": number 0-100
- "objections": array of { "objection": string, "handled": boolean, "handler_quality": "poor"|"average"|"excellent" }
- "sentiment": "positive"|"neutral"|"negative"
- "talk_ratio": { "rep": number (0-100), "customer": number (0-100) }
- "compliance_flags": array of strings (e.g. "missing_disclaimer", "promised_unrealistic_results")
- "key_moments": array of { "timestamp": string, "description": string, "type": "positive"|"negative"|"neutral" }
- "summary": string (2-3 sentence summary)
- "improvement_areas": array of strings`;
}

export function getRolePlaySystemPrompt(personalityProfile: string): string {
  return `You are a sales role-play partner. Personality: ${personalityProfile}
Respond naturally as a prospect. Stay in character. React to the rep's approach realistically.
Keep responses 1-3 sentences. Do not break character. Do not evaluate the rep.`;
}

export function getCoachingPlanSystemPrompt(): string {
  return `You are a sales coaching expert. Analyze the rep's call history and return a JSON object with:
- "strengths": array of strings
- "weaknesses": array of strings
- "action_items": array of { "priority": "high"|"medium"|"low", "task": string, "expected_impact": string }
- "focus_area": string (single area to focus on)
- "exercises": array of { "name": string, "description": string, "frequency": string }`;
}

export function getLiveCoachingSystemPrompt(): string {
  return `You are a real-time sales coach. Given the current call context, return a JSON object with:
- "suggestion": string (brief actionable suggestion)
- "type": "objection_handling"|"closing"|"discovery"|"compliance"|"talk_ratio"
- "urgency": "high"|"medium"|"low"
- "trigger": string (what triggered this suggestion)`;
}

/**
 * System prompt for the compliance evaluation pass (Phase C-3a).
 * The transcript + the tenant's active rules are supplied in the user message.
 * Core Principle 2: the model is an assistant, never the legal authority —
 * every output is a "flag" for human review, never a confirmed violation.
 */
export function getComplianceEvalSystemPrompt(): string {
  return `You are a compliance analyst assistant for a sales-quality platform.
You evaluate a single call transcript against a tenant's ACTIVE compliance rules.

You are NOT the legal authority. Your output is a *flag* that a human reviewer must
confirm or dismiss. Never phrase a finding as a confirmed violation — always as a
potential issue for review.

Return ONLY valid JSON — no prose outside the JSON — in exactly this shape:
{
  "findings": [
    {
      "rule_id": "<the exact rule id from the rules list>",
      "rule_version": <integer version of that rule>,
      "severity": "informational"|"low"|"medium"|"high"|"critical",
      "confidence": 0.0-1.0,
      "evidence_excerpt": "<verbatim quote from the transcript, short>",
      "evidence_timestamp": "<MM:SS or null if unknown>",
      "explanation": "<1-2 sentences: what the rep said/did and which rule clause it may violate>",
      "approved_alternative": "<suggested compliant phrasing, or empty string if none>",
      "recommended_action": "<what the reviewer should consider: coach, escalate, confirm, dismiss>"
    }
  ]
}

Rules for evaluation:
- Evaluate EVERY rule provided. If a rule is satisfied, do NOT emit a finding for it.
- Only emit a finding when the transcript appears to violate OR omit a required
  element of a rule.
- "evidence_excerpt" MUST be a verbatim substring of the transcript. NEVER invent,
  paraphrase, or hallucinate quotes. If you cannot quote it exactly, set
  evidence_excerpt to "" and explanation to note "no verbatim excerpt available".
- Set confidence based on how certain you are a violation occurred:
  >= 0.85 (high), 0.7-0.84 (medium), 0.5-0.69 (low), < 0.5 (requires human review).
- If the transcript is empty or too short to evaluate a rule, do NOT emit a finding
  for that rule.
- For "must_say" / "must_disclose" / "must_receive_consent" rules: emit a finding
  when the required language/step is absent or incomplete.
- For "must_not_say" rules: emit a finding when prohibited language appears.
- For "contextual_review" rules: only emit when there is a concrete, quotable signal.`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// API HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GET /api/openai/config ─────────────────────────────────────────────────────
export async function handleGetOpenAIConfig(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const config = await getOpenAIConfig(user.companyId);
    return jsonResponse({
      configured: config !== null,
      model: config?.model || DEFAULT_MODEL,
      maxTokens: config?.maxTokens || MAX_TOKENS,
      baseUrl: config?.baseUrl || "https://api.openai.com/v1",
      // Never expose the API key
    });
  } catch (e) {
    console.error("get openai config error:", e);
    return jsonResponse({ error: "Failed to get config" }, 500);
  }
}

// ─── PUT /api/openai/config ─────────────────────────────────────────────────────
export async function handleSaveOpenAIConfig(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (user.role !== "admin" && user.role !== "manager") return jsonResponse({ error: "Only admins and managers can configure the AI provider" }, 403);

    const { apiKey, model, maxTokens, organizationId, baseUrl } = await req.json();
    if (!apiKey) return jsonResponse({ error: "API key is required" }, 400);

    await saveOpenAIConfig(user.companyId, { apiKey, model, maxTokens, organizationId, baseUrl });
    return jsonResponse({ success: true, message: "OpenAI configuration saved" });
  } catch (e) {
    console.error("save openai config error:", e);
    return jsonResponse({ error: "Failed to save config" }, 500);
  }
}

// ─── POST /api/openai/test ────────────────────────────────────────────────────
export async function handleTestOpenAIConnection(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const body = await req.json().catch(() => ({}));
    const apiKey = body.apiKey || undefined;
    const baseUrl = body.baseUrl || undefined;

    // If no API key provided in request body, try the saved config
    let config: OpenAIConfig | null = null;
    if (apiKey) {
      config = { apiKey, model: DEFAULT_MODEL, maxTokens: MAX_TOKENS, baseUrl };
    } else {
      config = await getOpenAIConfig(user.companyId);
    }

    if (!config || !config.apiKey) {
      return jsonResponse({ success: false, error: "No API key configured. Please enter an API key first." });
    }

    // Make a simple test call to OpenAI
    const result = await callOpenAI(config, {
      model: config.model,
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Reply with exactly the word 'connected' if you receive this message." },
      ],
      max_tokens: 10,
      temperature: 0,
    });

    if (result.success) {
      return jsonResponse({ success: true, message: "Connection successful! OpenAI API is working correctly." });
    } else {
      return jsonResponse({ success: false, error: result.error || "Connection failed" });
    }
  } catch (e) {
    console.error("test openai connection error:", e);
    return jsonResponse({ success: false, error: "Failed to test connection" });
  }
}