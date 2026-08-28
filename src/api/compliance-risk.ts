/**
 * Compliance risk aggregation — Phase D (backend)
 *
 * Aggregates `compliance_findings` into per-agent and team-level risk signals.
 * Read-only and tenant-scoped: every number is derived from rows actually in the
 * database — no fabricated metrics.
 *
 * Risk model (per finding):
 *   contribution = severity_weight × confidence_multiplier × status_factor
 * Open findings (AI_FLAGGED / PENDING_REVIEW / CONFIRMED / NEEDS_COACHING /
 * ESCALATED) carry weight; DISMISSED and RESOLVED findings carry zero.
 *
 * Core Principle 2 is preserved: an AI_FLAGGED (unreviewed) finding contributes
 * *less* than a CONFIRMED one, so the score never asserts a confirmed violation
 * where only an unreviewed flag exists.
 */

import { sql } from "~/utils/sql";
import { db, jsonResponse, getAuthUser, isComplianceReviewer, ROLES } from "./middleware";

// ─── Weighting model ────────────────────────────────────────────────────────────

const SEVERITY_WEIGHTS: Record<string, number> = {
  critical: 40,
  high: 28,
  medium: 16,
  low: 6,
  informational: 2,
};

const CONFIDENCE_MULTIPLIERS: Record<string, number> = {
  high: 1.0,
  medium: 0.7,
  low: 0.4,
  requires_review: 0.5,
};

// status → factor reflecting whether the finding still represents open risk.
const STATUS_FACTORS: Record<string, number> = {
  AI_FLAGGED: 0.8,
  PENDING_REVIEW: 0.8,
  CONFIRMED: 1.0,
  NEEDS_COACHING: 0.9,
  ESCALATED: 1.0,
  DISMISSED: 0.0,
  RESOLVED: 0.0,
};

const OPEN_STATUSES = new Set(["AI_FLAGGED", "PENDING_REVIEW", "CONFIRMED", "NEEDS_COACHING", "ESCALATED"]);
const SEVERITIES = ["critical", "high", "medium", "low", "informational"] as const;

// ─── Types ─────────────────────────────────────────────────────────────────────

interface FindingSignal {
  severity: string;
  confidence: string;
  status: string;
}

interface FindingWithAgent extends FindingSignal {
  agent_id: string | null;
  agent_name?: string | null;
  agent_email?: string | null;
  agent_role?: string | null;
  agent_team_id?: string | null;
}

interface SeverityCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
  informational: number;
}

interface RiskResult {
  risk_score: number;
  risk_level: string;
  finding_counts: {
    total: number;
    open: number;
    resolved: number;
    by_severity: SeverityCounts;
    by_status: Record<string, number>;
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function findingPoints(f: FindingSignal): number {
  const sev = SEVERITY_WEIGHTS[f.severity] ?? 0;
  const conf = CONFIDENCE_MULTIPLIERS[f.confidence] ?? 0.5;
  const stat = STATUS_FACTORS[f.status] ?? 0.8; // unknown status → treat as open (conservative)
  return sev * conf * stat;
}

function riskLevel(score: number): string {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  if (score > 0) return "low";
  return "none";
}

function emptySeverityCounts(): SeverityCounts {
  return { critical: 0, high: 0, medium: 0, low: 0, informational: 0 };
}

function computeFromFindings(findings: FindingSignal[]): RiskResult {
  const by_severity = emptySeverityCounts();
  const by_status: Record<string, number> = {};
  let total = 0;
  let open = 0;
  let resolved = 0;
  let points = 0;

  for (const f of findings) {
    total++;
    if (by_severity[f.severity] !== undefined) by_severity[f.severity]++;
    by_status[f.status] = (by_status[f.status] ?? 0) + 1;
    if (OPEN_STATUSES.has(f.status)) open++;
    else resolved++;
    points += findingPoints(f);
  }

  return {
    risk_score: Math.min(100, Math.round(points)),
    risk_level: riskLevel(Math.min(100, Math.round(points))),
    finding_counts: { total, open, resolved, by_severity, by_status },
  };
}

// ─── GET /api/compliance/risk/agent/:id ────────────────────────────────────────
export async function handleGetAgentRisk(req: Request): Promise<Response> {
  const user = await getAuthUser(req);
  if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
  if (!isComplianceReviewer(user)) return jsonResponse({ error: "Insufficient permissions" }, 403);

  const agentId = new URL(req.url).pathname.split("/").pop();
  if (!agentId) return jsonResponse({ error: "Agent id is required" }, 400);

  const agents = await db(sql`
    SELECT id, name, email, role, team_id
    FROM users
    WHERE id = ${agentId} AND company_id = ${user.companyId}
    LIMIT 1
  `);
  if (agents.length === 0) return jsonResponse({ error: "Agent not found" }, 404);
  const agent = agents[0];

  const findings = await db(sql`
    SELECT f.severity, f.confidence, f.status
    FROM compliance_findings f
    JOIN calls c ON c.id = f.call_id
    WHERE c.user_id = ${agentId} AND f.company_id = ${user.companyId}
  `);

  const risk = computeFromFindings(findings as FindingSignal[]);

  return jsonResponse({
    agent: {
      id: agent.id,
      name: agent.name,
      email: agent.email,
      role: agent.role,
      team_id: agent.team_id,
    },
    ...risk,
  });
}

// ─── GET /api/compliance/risk/team ─────────────────────────────────────────────
export async function handleGetTeamRisk(req: Request): Promise<Response> {
  const user = await getAuthUser(req);
  if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
  if (!isComplianceReviewer(user)) return jsonResponse({ error: "Insufficient permissions" }, 403);

  // Full agent roster (reps) so agents with zero findings still appear.
  const reps = await db(sql`
    SELECT id, name, email, role, team_id
    FROM users
    WHERE company_id = ${user.companyId} AND role = ${ROLES.REP}
  `);

  // Every finding in the tenant, attributed to the agent who took the call.
  const findings = await db(sql`
    SELECT
      f.severity, f.confidence, f.status,
      c.user_id AS agent_id,
      u.name AS agent_name, u.email AS agent_email,
      u.role AS agent_role, u.team_id AS agent_team_id
    FROM compliance_findings f
    LEFT JOIN calls c ON c.id = f.call_id
    LEFT JOIN users u ON u.id = c.user_id
    WHERE f.company_id = ${user.companyId}
  `);

  // Group attributed findings by agent; count unattributed (no call / no agent).
  const byAgent = new Map<string, FindingSignal[]>();
  const agentMeta = new Map<string, { name: string | null; email: string | null; role: string | null; team_id: string | null }>();
  let unattributed = 0;

  for (const f of findings as FindingWithAgent[]) {
    if (f.agent_id) {
      if (!byAgent.has(f.agent_id)) byAgent.set(f.agent_id, []);
      byAgent.get(f.agent_id)!.push({ severity: f.severity, confidence: f.confidence, status: f.status });
      if (!agentMeta.has(f.agent_id)) {
        agentMeta.set(f.agent_id, {
          name: f.agent_name ?? null,
          email: f.agent_email ?? null,
          role: f.agent_role ?? null,
          team_id: f.agent_team_id ?? null,
        });
      }
    } else {
      unattributed++;
    }
  }

  // Build per-agent risk, starting from the rep roster (zero-risk default).
  const seen = new Set<string>();
  const agents: any[] = [];
  let scoreSum = 0;
  let agentsWithRisk = 0;

  for (const rep of reps as any[]) {
    const f = byAgent.get(rep.id) ?? [];
    const risk = computeFromFindings(f);
    agents.push({
      id: rep.id,
      name: rep.name,
      email: rep.email,
      role: rep.role,
      team_id: rep.team_id,
      ...risk,
    });
    scoreSum += risk.risk_score;
    if (risk.risk_score > 0) agentsWithRisk++;
    seen.add(rep.id);
  }

  // Include any caller with findings who isn't in the rep roster (edge case).
  for (const [agentId, f] of byAgent) {
    if (seen.has(agentId)) continue;
    const meta = agentMeta.get(agentId);
    const risk = computeFromFindings(f);
    agents.push({
      id: agentId,
      name: meta?.name ?? null,
      email: meta?.email ?? null,
      role: meta?.role ?? null,
      team_id: meta?.team_id ?? null,
      ...risk,
    });
    scoreSum += risk.risk_score;
    if (risk.risk_score > 0) agentsWithRisk++;
    seen.add(agentId);
  }

  const agentCount = agents.length;
  const teamRiskScore = agentCount > 0 ? Math.round(scoreSum / agentCount) : 0;

  // Company-level finding totals (including unattributed findings).
  const companyTotals = computeFromFindings(findings as FindingSignal[]);

  agents.sort((a, b) => b.risk_score - a.risk_score);

  return jsonResponse({
    company_id: user.companyId,
    team_risk_score: teamRiskScore,
    risk_level: riskLevel(teamRiskScore),
    agent_count: agentCount,
    agents_with_risk: agentsWithRisk,
    max_agent_risk: agents.length > 0 ? Math.max(...agents.map((a) => a.risk_score)) : 0,
    finding_counts: companyTotals.finding_counts,
    unattributed_findings: unattributed,
    agents,
  });
}
