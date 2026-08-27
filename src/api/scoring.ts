/**
 * Dimensional Call Scoring — Phase B
 *
 * Scores every analyzed call across 5 dimensions with evidence drawn from
 * the real transcript. Builds on the Phase A KPI engine (kpi_definitions).
 *
 * Core Principle 3 (strict): evidence must come from real transcript analysis
 * only. If a dimension can't be confidently scored, mark it "requires_review" —
 * NEVER invent a score or evidence.
 */

import { sql, esc } from "~/utils/sql";
import { db } from "./middleware";
import { getOpenAIConfig, callOpenAI } from "./openai";
import { getEffectiveMode, isLive } from "./integration-mode";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type DimensionKey =
  | "discovery"
  | "objection_handling"
  | "closing"
  | "communication"
  | "process_adherence";

export interface DimensionScore {
  dimension: DimensionKey;
  score: number;       // 0-100
  evidence: Array<{
    timestamp: string; // e.g. "1:23"
    quote: string;     // short excerpt from transcript
    relevance: string; // why this quote supports the score
  }>;
  confidence: number;  // 0.0 - 1.0
  requires_review: boolean;
}

export interface DimensionalScores {
  dimensions: DimensionScore[];
  overall_score: number; // weighted or averaged from dimensions
  analysis_id: string;   // call_analyses row id
}

// ═══════════════════════════════════════════════════════════════════════════════
// TABLE INIT
// ═══════════════════════════════════════════════════════════════════════════════

let tableInitialized = false;

export async function ensureCallDimensionScoresTable(): Promise<void> {  if (tableInitialized) return;
  try {    await db(sql`
      CREATE TABLE IF NOT EXISTS call_dimension_scores (
        id TEXT PRIMARY KEY,
        call_analysis_id TEXT NOT NULL REFERENCES call_analyses(id) ON DELETE CASCADE,
        call_id TEXT NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
        company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        dimension TEXT NOT NULL,
        score INTEGER NOT NULL,
        evidence TEXT NOT NULL DEFAULT '[]',
        confidence REAL NOT NULL DEFAULT 1.0,
        requires_review INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(call_analysis_id, dimension)      )    `);
    await db(sql`      CREATE INDEX IF NOT EXISTS idx_call_dimension_scores_lookup
      ON call_dimension_scores(company_id, dimension, call_id)    `);
    console.log("Dimensional Scoring: Created call_dimension_scores table");
    tableInitialized = true;  } catch (err) {    console.error("Failed to create call_dimension_scores:", err);  }}

/**
 * Compute dimensional scores for a call.
 *
 * @param callId      - the calls.id
 * @param analysisId   - the call_analyses.id (inserted first)
 * @param companyId    - company for OpenAI config lookup
 * @param userId      - user for integration-mode lookup
 * @param overallScore - overall score from main analysis (used as fallback anchor)
 * @param transcript   - transcript or call summary for AI scoring
 */
export async function computeAndStoreDimensionScores(
  callId: string,
  analysisId: string,
  companyId: string,
  userId: string,
  overallScore: number,
  transcript: string,
): Promise<DimensionScore[]> {
  await ensureCallDimensionScoresTable();

  const dimensions = await computeDimensionalScores(callId, companyId, userId, overallScore, transcript);

  // Persist each dimension score
  for (const dim of dimensions) {
    await db(sql`
      INSERT OR REPLACE INTO call_dimension_scores
        (id, call_analysis_id, call_id, company_id, dimension, score, evidence, confidence, requires_review)
      VALUES (
        ${crypto.randomUUID()},
        ${analysisId},
        ${callId},
        ${companyId},
        ${dim.dimension},
        ${dim.score},
        ${JSON.stringify(dim.evidence)},
        ${dim.confidence},
        ${dim.requires_review ? 1 : 0}
      )
    `);
  }

  return dimensions;
}

// �══════════════════════════════════════════════════════════════════════════════════
// CORE SCORING LOGIC
// �══════════════════════════════════════════════════════════════════════════════════

async function computeDimensionalScores(
  _callId: string,
  companyId: string,
  userId: string,
  overallScore: number,
  transcript: string,
): Promise<DimensionScore[]> {
  // Check integration mode
  const mode = await getEffectiveMode(companyId, userId, "openai");

  if (isLive(mode)) {
    const aiDimensions = await scoreWithAI(companyId, transcript);
    if (aiDimensions) return aiDimensions;
  }

  // Demo / fallback: derive dimension scores from overall score
  // with realistic variance — each dimension varies ±15 points
  return deriveFromOverall(overallScore);
}

// �══════════════════════════════════════════════════════════════════════════════════
// AI-POWERED DIMENSIONAL SCORING (LIVE MODE)
// �══════════════════════════════════════════════════════════════════════════════════

export function getDimensionalScoringSystemPrompt(): string {
  return `You are an expert sales call analyst specializing in multi-dimensional performance evaluation.
Analyze the provided call transcript and score the rep across 5 dimensions.
Return ONLY valid JSON — no explanation outside the JSON.

Required output format:
{
  "dimensions": [
    {
      "dimension": "discovery",
      "score": 0-100,
      "confidence": 0.0-1.0,
      "requires_review": true|false,
      "evidence": [
        { "timestamp": "MM:SS", "quote": "...", "relevance": "why this matters" }
      ]
    },
    ... // same structure for all 5 dimensions
  ]
}

The 5 dimensions to score:
1. "discovery" — How effectively does the rep uncover needs, ask open-ended questions, and explore the prospect's situation?
2. "objection_handling" — How well does the rep identify, address, and overcome objections?
3. "closing" — Does the rep advance toward next steps, secure commitment, or close effectively?
4. "communication" — Clarity, active listening, tone, rapport-building, and talk-listen balance.
5. "process_adherence" — Does the rep follow defined process steps, required disclosures, and scripted elements?

Rules:
- Every dimension MUST have a score (0–100).
- If you are NOT confident about a dimension, set confidence < 0.7 AND requires_review = true, and note why in the first evidence item.
- Every piece of evidence MUST quote the transcript verbatim with a timestamp.
- If no transcript content supports a dimension, set score = null, confidence = 0, requires_review = true, and evidence = [{"timestamp": "N/A", "quote": "Insufficient transcript data", "relevance": "No relevant content found"}].
- NEVER invent quotes, timestamps, or scores.`;
}

async function scoreWithAI(
  companyId: string,
  transcript: string,
): Promise<DimensionScore[] | null> {
  const config = await getOpenAIConfig(companyId);
  if (!config?.apiKey) return null;

  const result = await callOpenAI(config, {
    model: config.model,
    messages: [
      { role: "system", content: getDimensionalScoringSystemPrompt() },
      { role: "user", content: `Call transcript:\n${transcript || "No transcript available."}` },
    ],
    max_tokens: 3072,
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  if (!result.success || !result.content) return null;

  try {
    const parsed = JSON.parse(result.content);
    const dims = parsed.dimensions || parsed.dimension_scores || [];

    if (!Array.isArray(dims) || dims.length ===0) return null;

    return dims.map((d: any) => ({
      dimension: mapDimensionKey(d.dimension || d.dimension_key || d.name),
      score: typeof d.score === "number" ? Math.max(0, Math.min(100, Math.round(d.score))) : 0,
      evidence: normalizeEvidence(d.evidence || d.evdence || []),
      confidence: typeof d.confidence === "number" ? Math.max(0, Math.min(1, d.confidence)) : 0.5,
      requires_review: Boolean(d.requires_review || (d.confidence != null && d.confidence < 0.7)),
    }));
  } catch {
    console.error("Dimensional scoring: Failed to parse AI response");
    return null;
  }
}

// �══════════════════════════════════════════════════════════════════════════════════
// DEMO / FALLBACK SCORING
// �══════════════════════════════════════════════════════════════════════════════════

/**
 * In demo mode (or when AI is unavailable), derive dimension scores
 * from the overall call score with realistic variance.
 * This is expressly labeled in evidence — never fabricated as real.
 */
function deriveFromOverall(overallScore: number): DimensionScore[] {
  // Seeded variance per dimension to simulate realistic strengths/weaknesses
  const varianceSeed = (overallScore * 13) % 100;
  const dimensions: Array<{ key: DimensionKey; label: string; baseWeight: number }> = [
    { key: "discovery", label: "Discovery", baseWeight: 1.0 },
    { key: "objection_handling", label: "Objection Handling", baseWeight: 0.95 },
    { key: "closing", label: "Closing", baseWeight: 0.85 },
    { key: "communication", label: "Communication & Rapport", baseWeight: 1.05 },
    { key: "process_adherence", label: "Process Adherence", baseWeight: 0.9 },
  ];

  return dimensions.map((dim, i) => {
    // Each dimension varies ±15 points from the overall, with a unique offset
    const offset = ((varianceSeed + i * 7) % 30) - 15;
    const weightedBase = Math.round(overallScore * dim.baseWeight);
    const score = Math.max(0, Math.min(100, weightedBase + offset));

    // Confidence is moderate for derived scores — always flaggable
    const confidence = 0.6;

    return {
      dimension: dim.key,
      score,
      evidence: [
        {
          timestamp: "Demo",
          quote: `Derived from overall score (${overallScore}) ± dimension variance`,
          relevance: `Approximate ${dim.label} score — use live AI mode for genuine transcript-based evidence.`,
        },
      ],
      confidence,
      requires_review: true,
    };
  });
}

// �══════════════════════════════════════════════════════════════════════════════════
// HELPERS
// �══════════════════════════════════════════════════════════════════════════════════

function mapDimensionKey(raw: string): DimensionKey {
  const normalized = (raw || "").toLowerCase().trim();
  if (normalized.includes("discovery") || normalized.includes("needs")) return "discovery";
  if (normalized.includes("objection") || normalized.includes("handling")) return "objection_handling";
  if (normalized.includes("closing") || normalized.includes("commitment") || normalized.includes("next_step")) return "closing";
  if (normalized.includes("communica") || normalized.includes("rapport") || normalized.includes("listen")) return "communication";
  if (normalized.includes("process") || normalized.includes("adherence") || normalized.includes("script") || normalized.includes("complianc")) return "process_adherence";
  return "communication"; // safe default
}

function normalizeEvidence(raw: any): Array<{ timestamp: string; quote: string; relevance: string }> {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 5).map((e: any) => ({
    timestamp: String(e.timestamp || e.time || ""),
    quote: String(e.quote || e.text || e.excerpt || ""),
    relevance: String(e.relevance || e.explanation || e.reason || ""),
  }));
}

// �══════════════════════════════════════════════════════════════════════════════════
// AGGREGATE QUERIES (for analytics)
// �══════════════════════════════════════════════════════════════════════════════════

/**
 * Fetch average dimensional scores for a company within a time range.
 * Used by the executive dashboard and manager views.
 */
export async function getCompanyDimensionAverages(
  companyId: string,
  cutoff: string,
): Promise<Array<{ dimension: DimensionKey; avg_score: number; count: number }> {
  await ensureCallDimensionScoresTable();

  const rows = await db(sql`
    SELECT
      cds.dimension,
      ROUND(AVG(cds.score)) as avg_score,
      COUNT(*) as count
    FROM call_dimension_scores cds
    WHERE cds.company_id = ${companyId}
      AND cds.created_at >= ${cutoff}
    GROUP BY cds.dimension
    ORDER BY cds.dimension
  `);

  return rows.map((r: any) => ({
    dimension: r.dimension as DimensionKey,
    avg_score: r.avg_score || 0,
    count: r.count || 0,
  }));
}

/**
 * Fetch dimensional scores for a specific call analysis.
 */
export async function getCallDimensionScores(analysysId: string): Promise<DimensionScore[]> {
  await ensureCallDimensionScoresTable();

  const rows = await db(sql`
    SELECT * FROM call_dimension_scores
    WHERE call_analysis_id = ${analysysId}
    ORDER BY dimension
  `);

  return rows.map((r: any) => ({
    dimension: r.dimension as DimensionKey,
    score: r.score,
    evidence: JSON.parse(r.evidence || "[]"),
    confidence: r.confidence,
    requires_review: Boolean(r.requires_review),
  }));
}