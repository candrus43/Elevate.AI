/**
 * Compliance Reporting — Phase E (backend)
 *
 * Read-only reporting layer that powers the Compliance Center "Reports" view and
 * the Executive Dashboard compliance risk rollup. Aggregates `compliance_findings`
 * (joined to rules / calls / agents / teams) into summary stats, trends, top-rule
 * and top-agent breakdowns, and a compact executive rollup.
 *
 * Core principles honored here:
 *  - No fabrication — every number is derived from stored rows. Empty buckets are
 *    never invented; empty tenants get explicit empty/zero structures.
 *  - Empty-state honesty — with zero findings the compliance score reports
 *    "insufficient_data" (null), never a fabricated 100 or 0.
 *  - Tenant isolation via company_id on every query.
 *  - Read access is manager/compliance-reviewer gated and audit-logged.
 *
 * This file is intentionally separate from `compliance-risk.ts` (agent/team risk
 * aggregation) and the coaching files — it does not import from or modify them.
 */

import { esc } from "~/utils/sql";
import { db, jsonResponse, getAuthUser, isComplianceReviewer } from "./middleware";
import { logAuditEvent } from "./admin";

// ─── Constants ──────────────────────────────────────────────────────────────────

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

/** Findings that still represent active (unresolved) risk. */
const OPEN_STATUSES = new Set<string>(["AI_FLAGGED", "PENDING_REVIEW", "CONFIRMED", "NEEDS_COACHING", "ESCALATED"]);

/** Findings that a human has not yet reviewed. */
const NEEDS_REVIEW_STATUSES = new Set<string>(["AI_FLAGGED", "PENDING_REVIEW"]);

/** Only these statuses deduct from the compliance score. */
const SCORED_STATUSES = new Set<string>(["CONFIRMED", "AI_FLAGGED"]);

/** Risk ranking weights (informational < low < medium < high < critical). */
const RISK_WEIGHTS: Record<string, number> = {
  critical: 40,
  high: 28,
  medium: 16,
  low: 6,
  informational: 2,
};

/** Compliance score deductions (subtracted from 100) for scored findings. */
const COMPLIANCE_DEDUCTIONS: Record<string, number> = {
  critical: 20,
  high: 12,
  medium: 6,
  low: 2,
  informational: 1,
};

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

// ─── Types ──────────────────────────────────────────────────────────────────────

interface FindingSignal {
  severity: string;
  status: string;
  confidence?: string | null;
}

interface SeverityCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
  informational: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

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

/**
 * Compliance score (0-100) with deductions weighted by severity, applied only to
 * CONFIRMED / AI_FLAGGED findings. Returns `null` (insufficient_data) when there
 * are no findings at all — never a fabricated 100 or 0.
 */
function computeComplianceScore(findings: FindingSignal[]): { score: number | null; state: "scored" | "insufficient_data" } {
  if (findings.length === 0) return { score: null, state: "insufficient_data" };
  let deduction = 0;
  for (const f of findings) {
    if (SCORED_STATUSES.has(normStatus(f.status))) {
      deduction += COMPLIANCE_DEDUCTIONS[normSeverity(f.severity)] ?? 0;
    }
  }
  return { score: Math.max(0, 100 - deduction), state: "scored" };
}

/** Parse optional from/to date range query params (YYYY-MM-DD or ISO). */
function parseRange(url: URL): { from: string | null; to: string | null; error?: string } {
  const fromRaw = url.searchParams.get("from");
  const toRaw = url.searchParams.get("to");
  let from: string | null = null;
  let to: string | null = null;

  if (fromRaw) {
    const d = new Date(fromRaw);
    if (Number.isNaN(d.getTime())) return { from: null, to: null, error: "Invalid 'from' date" };
    from = d.toISOString().slice(0, 10);
  }
  if (toRaw) {
    const d = new Date(toRaw);
    if (Number.isNaN(d.getTime())) return { from: null, to: null, error: "Invalid 'to' date" };
    to = d.toISOString().slice(0, 10);
  }
  return { from, to };
}

/** WHERE fragment for findings, scoped by company and optional date range. */
function findingsWhere(companyId: string, from: string | null, to: string | null): string {
  let where = `f.company_id = ${esc(companyId)}`;
  if (from) where += ` AND substr(f.created_at, 1, 10) >= ${esc(from)}`;
  if (to) where += ` AND substr(f.created_at, 1, 10) <= ${esc(to)}`;
  return where;
}

/** WHERE fragment for calls, scoped by company and optional date range. */
function callsWhere(companyId: string, from: string | null, to: string | null): string {
  let where = `company_id = ${esc(companyId)}`;
  if (from) where += ` AND substr(coalesce(started_at, created_at), 1, 10) >= ${esc(from)}`;
  if (to) where += ` AND substr(coalesce(started_at, created_at), 1, 10) <= ${esc(to)}`;
  return where;
}

function parseLimit(url: URL): number {
  const raw = Number(url.searchParams.get("limit"));
  if (!Number.isFinite(raw)) return DEFAULT_LIMIT;
  return Math.min(Math.max(Math.floor(raw), 1), MAX_LIMIT);
}

async function auditReport(user: { companyId: string; id: string }, report: string, details: string): Promise<void> {
  try {
    await logAuditEvent(user.companyId, user.id, "view_compliance_report", "compliance_report", report, details);
  } catch (e) {
    console.error("compliance report audit error:", e);
  }
}

// ─── GET /api/compliance/report/summary ────────────────────────────────────────
export async function handleComplianceReportSummary(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (!isComplianceReviewer(user)) return jsonResponse({ error: "Insufficient permissions" }, 403);

    const url = new URL(req.url);
    const { from, to, error } = parseRange(url);
    if (error) return jsonResponse({ error }, 400);

    const rows = await db(`
      SELECT severity, status, confidence
      FROM compliance_findings f
      WHERE ${findingsWhere(user.companyId, from, to)}
    `);

    const by_severity = emptySeverityCounts();
    const by_status = emptyStatusCounts();
    let total = 0;
    let open = 0;
    let resolved = 0;
    let requires_human_review = 0;

    for (const f of rows as FindingSignal[]) {
      total++;
      const sev = normSeverity(f.severity);
      by_severity[sev as keyof SeverityCounts] = (by_severity[sev as keyof SeverityCounts] ?? 0) + 1;
      const st = normStatus(f.status);
      by_status[st] = (by_status[st] ?? 0) + 1;
      if (OPEN_STATUSES.has(st)) open++;
      else resolved++;
      if (NEEDS_REVIEW_STATUSES.has(st) || (f.confidence || "").toLowerCase() === "requires_review") {
        requires_human_review++;
      }
    }

    const compliance_score = computeComplianceScore(rows as FindingSignal[]);

    await auditReport(user, "summary", `range=${from ?? "all"}..${to ?? "all"}, total=${total}`);

    return jsonResponse({
      range: { from, to },
      total_findings: total,
      open_findings: open,
      resolved_findings: resolved,
      requires_human_review,
      by_severity,
      by_status,
      compliance_score,
    });
  } catch (e) {
    console.error("compliance report summary error:", e);
    return jsonResponse({ error: "Failed to load compliance report" }, 500);
  }
}

// ─── GET /api/compliance/report/trends ─────────────────────────────────────────
export async function handleComplianceReportTrends(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (!isComplianceReviewer(user)) return jsonResponse({ error: "Insufficient permissions" }, 403);

    const url = new URL(req.url);
    const { from, to, error } = parseRange(url);
    if (error) return jsonResponse({ error }, 400);
    const granularity = url.searchParams.get("granularity") === "week" ? "week" : "day";

    const rows = await db(`
      SELECT substr(f.created_at, 1, 10) AS day, f.severity, f.status
      FROM compliance_findings f
      WHERE ${findingsWhere(user.companyId, from, to)}
      ORDER BY day
    `);

    // Group findings by bucket (day or Monday-of-week).
    const buckets = new Map<string, FindingSignal[]>();
    for (const r of rows as Array<FindingSignal & { day: string }>) {
      const key = bucketKey(r.day, granularity);
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push({ severity: r.severity, status: r.status });
    }

    // Only emit buckets that actually have findings — never fabricate empty points.
    const trend = [...buckets.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([bucket, findings]) => {
        let confirmed = 0;
        for (const f of findings) {
          if (SCORED_STATUSES.has(normStatus(f.status))) confirmed++;
        }
        return {
          bucket,
          finding_count: findings.length,
          confirmed_count: confirmed,
          compliance_score: computeComplianceScore(findings).score, // number (bucket has data)
        };
      });

    const overall = computeComplianceScore(rows as FindingSignal[]);

    await auditReport(user, "trends", `granularity=${granularity}, range=${from ?? "all"}..${to ?? "all"}, buckets=${trend.length}`);

    return jsonResponse({ range: { from, to }, granularity, buckets: trend, compliance_score: overall });
  } catch (e) {
    console.error("compliance report trends error:", e);
    return jsonResponse({ error: "Failed to load compliance trends" }, 500);
  }
}

/** Map a date string to its bucket key: the date itself, or the Monday of its week. */
function bucketKey(dateStr: string, granularity: "day" | "week"): string {
  if (granularity === "day") return dateStr;
  const d = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return dateStr;
  const diff = (d.getUTCDay() + 6) % 7; // days since Monday
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}

// ─── GET /api/compliance/report/by-rule ────────────────────────────────────────
export async function handleComplianceReportByRule(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (!isComplianceReviewer(user)) return jsonResponse({ error: "Insufficient permissions" }, 403);

    const url = new URL(req.url);
    const { from, to, error } = parseRange(url);
    if (error) return jsonResponse({ error }, 400);
    const limit = parseLimit(url);

    const rows = await db(`
      SELECT f.rule_id, f.severity, f.status,
             cr.name AS rule_name, cr.rule_type AS rule_type
      FROM compliance_findings f
      LEFT JOIN compliance_rules cr ON cr.id = f.rule_id
      WHERE ${findingsWhere(user.companyId, from, to)}
    `);

    const byRule = new Map<string, {
      rule_id: string | null;
      rule_name: string;
      rule_type: string;
      total: number;
      open: number;
      by_severity: SeverityCounts;
      risk: number;
    }>();

    for (const r of rows as any[]) {
      const key = r.rule_id || "__deleted__";
      if (!byRule.has(key)) {
        byRule.set(key, {
          rule_id: r.rule_id,
          rule_name: r.rule_name || "Deleted rule",
          rule_type: r.rule_type || "",
          total: 0,
          open: 0,
          by_severity: emptySeverityCounts(),
          risk: 0,
        });
      }
      const agg = byRule.get(key)!;
      const sev = normSeverity(r.severity);
      const st = normStatus(r.status);
      agg.total++;
      agg.by_severity[sev as keyof SeverityCounts] = (agg.by_severity[sev as keyof SeverityCounts] ?? 0) + 1;
      if (OPEN_STATUSES.has(st)) {
        agg.open++;
        agg.risk += RISK_WEIGHTS[sev] ?? 0;
      }
    }

    const rules = [...byRule.values()]
      .sort((a, b) => b.risk - a.risk || b.total - a.total)
      .slice(0, limit);

    await auditReport(user, "by-rule", `limit=${limit}, range=${from ?? "all"}..${to ?? "all"}`);

    return jsonResponse({ range: { from, to }, rules });
  } catch (e) {
    console.error("compliance report by-rule error:", e);
    return jsonResponse({ error: "Failed to load rule breakdown" }, 500);
  }
}

// ─── GET /api/compliance/report/by-agent ───────────────────────────────────────
export async function handleComplianceReportByAgent(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (!isComplianceReviewer(user)) return jsonResponse({ error: "Insufficient permissions" }, 403);

    const url = new URL(req.url);
    const { from, to, error } = parseRange(url);
    if (error) return jsonResponse({ error }, 400);
    const limit = parseLimit(url);

    const rows = await db(`
      SELECT f.severity, f.status,
             c.user_id AS agent_id, u.name AS agent_name, u.team_id AS team_id
      FROM compliance_findings f
      LEFT JOIN calls c ON c.id = f.call_id
      LEFT JOIN users u ON u.id = c.user_id
      WHERE ${findingsWhere(user.companyId, from, to)}
    `);

    const byAgent = new Map<string, {
      agent_id: string;
      agent_name: string;
      team_id: string | null;
      total: number;
      open: number;
      by_severity: SeverityCounts;
      risk: number;
    }>();
    let unattributed = 0;

    for (const r of rows as any[]) {
      if (!r.agent_id) {
        unattributed++;
        continue;
      }
      const key = r.agent_id;
      if (!byAgent.has(key)) {
        byAgent.set(key, {
          agent_id: r.agent_id,
          agent_name: r.agent_name || "Unknown agent",
          team_id: r.team_id ?? null,
          total: 0,
          open: 0,
          by_severity: emptySeverityCounts(),
          risk: 0,
        });
      }
      const agg = byAgent.get(key)!;
      const sev = normSeverity(r.severity);
      const st = normStatus(r.status);
      agg.total++;
      agg.by_severity[sev as keyof SeverityCounts] = (agg.by_severity[sev as keyof SeverityCounts] ?? 0) + 1;
      if (OPEN_STATUSES.has(st)) {
        agg.open++;
        agg.risk += RISK_WEIGHTS[sev] ?? 0;
      }
    }

    const agents = [...byAgent.values()]
      .sort((a, b) => b.risk - a.risk || b.total - a.total)
      .slice(0, limit);

    await auditReport(user, "by-agent", `limit=${limit}, range=${from ?? "all"}..${to ?? "all"}`);

    return jsonResponse({ range: { from, to }, agents, unattributed_findings: unattributed });
  } catch (e) {
    console.error("compliance report by-agent error:", e);
    return jsonResponse({ error: "Failed to load agent breakdown" }, 500);
  }
}

// ─── GET /api/compliance/report/executive ──────────────────────────────────────
export async function handleComplianceReportExecutive(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    if (!isComplianceReviewer(user)) return jsonResponse({ error: "Insufficient permissions" }, 403);

    const url = new URL(req.url);
    const { from, to, error } = parseRange(url);
    if (error) return jsonResponse({ error }, 400);

    const findings = await db(`
      SELECT f.severity, f.status, f.call_id,
             u.team_id AS team_id, t.name AS team_name
      FROM compliance_findings f
      LEFT JOIN calls c ON c.id = f.call_id
      LEFT JOIN users u ON u.id = c.user_id
      LEFT JOIN teams t ON t.id = u.team_id
      WHERE ${findingsWhere(user.companyId, from, to)}
    `) as Array<FindingSignal & { call_id: string | null; team_id: string | null; team_name: string | null }>;

    const totalCalls = await db(`
      SELECT COUNT(*) AS c FROM calls WHERE ${callsWhere(user.companyId, from, to)}
    `);

    const hasData = findings.length > 0;
    const compliance_score = computeComplianceScore(findings);

    let openCriticalHigh = 0;
    const callsWithFindings = new Set<string>();

    // Team-level open-risk aggregation for "highest-risk team".
    const teamAgg = new Map<string, { team_id: string; team_name: string; open_findings: number; critical_high: number; risk: number }>();

    for (const f of findings) {
      const st = normStatus(f.status);
      const sev = normSeverity(f.severity);
      if (f.call_id) callsWithFindings.add(f.call_id);

      if (OPEN_STATUSES.has(st) && (sev === "critical" || sev === "high")) openCriticalHigh++;

      if (f.team_id && OPEN_STATUSES.has(st)) {
        if (!teamAgg.has(f.team_id)) {
          teamAgg.set(f.team_id, { team_id: f.team_id, team_name: f.team_name || "Unnamed team", open_findings: 0, critical_high: 0, risk: 0 });
        }
        const t = teamAgg.get(f.team_id)!;
        t.open_findings++;
        if (sev === "critical" || sev === "high") t.critical_high++;
        t.risk += RISK_WEIGHTS[sev] ?? 0;
      }
    }

    const highestRiskTeam = [...teamAgg.values()].sort((a, b) => b.risk - a.risk)[0] ?? null;

    const totalCallsCount = Number(totalCalls[0]?.c ?? 0);
    const pctCallsWithFindings = totalCallsCount > 0
      ? Math.round((callsWithFindings.size / totalCallsCount) * 1000) / 10
      : null;

    await auditReport(user, "executive", `range=${from ?? "all"}..${to ?? "all"}, hasData=${hasData}`);

    return jsonResponse({
      range: { from, to },
      has_data: hasData,
      compliance_score,
      open_critical_high: openCriticalHigh,
      total_findings: findings.length,
      total_calls: totalCallsCount,
      calls_with_findings: callsWithFindings.size,
      pct_calls_with_findings: pctCallsWithFindings,
      highest_risk_team: highestRiskTeam,
    });
  } catch (e) {
    console.error("compliance report executive error:", e);
    return jsonResponse({ error: "Failed to load executive rollup" }, 500);
  }
}
