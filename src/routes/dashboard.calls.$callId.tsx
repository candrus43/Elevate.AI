import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { getCallDetails } from "~/utils/db";
import type { UserSession } from "~/components/layout/Header";

export const Route = createFileRoute("/dashboard/calls/$callId")({
  component: CallDetail,
});

// ─── Types ────────────────────────────────────────────────

interface CallData {
  id: string;
  company_id: string;
  user_id: string;
  direction: string;
  duration_seconds: number;
  started_at: string;
  ended_at: string;
  status: string;
  transcript: string;
  rep_name: string;
  rep_email: string;

  // From call_analyses (aliased as ca.*)
  overall_score: number;
  sentiment: string;
  talk_ratio_rep: number;
  talk_ratio_customer: number;
  avg_pace_wpm: number;
  filler_word_count: number;
  key_topics: string;
  summary: string;
  objections_detected: string;
  compliance_issues: string;

  scores: Array<{
    total_score: number;
    criteria_scores: string;
    notes: string;
    created_at: string;
    scorecard_name: string;
  }>;

  compliance: Array<{
    passed: number;
    details: string;
    created_at: string;
    rule_name: string;
    rule_description: string;
  }>;
}

// ─── Helpers ──────────────────────────────────────────────

function formatDuration(seconds: number): string {
  if (!seconds) return "-";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function scoreColor(score: number): string {
  if (score >= 85) return "text-green-400";
  if (score >= 70) return "text-yellow-400";
  return "text-red-400";
}

function scoreBg(score: number): string {
  if (score >= 85) return "bg-green-500/10 border-green-500/30";
  if (score >= 70) return "bg-yellow-500/10 border-yellow-500/30";
  return "bg-red-500/10 border-red-500/30";
}

function sentimentColor(sentiment: string): string {
  switch (sentiment) {
    case "positive": return "bg-green-500/10 text-green-400 border-green-500/30";
    case "negative": return "bg-red-500/10 text-red-400 border-red-500/30";
    default: return "bg-gray-500/10 text-ink-muted border-gray-500/30";
  }
}

function statusColor(status: string): string {
  switch (status) {
    case "analyzed": return "bg-green-500/10 text-green-400 border-green-500/30";
    case "processing": return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    default: return "bg-red-500/10 text-red-400 border-red-500/30";
  }
}

function parseJsonArray(raw: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseJsonObj(raw: string): Record<string, number> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

// ─── Component ─────────────────────────────────────────────

function CallDetail() {
  const navigate = useNavigate();
  const { callId } = Route.useParams();

  const [user, setUser] = useState<UserSession | null>(null);
  const [call, setCall] = useState<CallData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);

  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then(async ({ user }) => {
        if (!user) {
          navigate({ to: "/login" });
          return;
        }
        setUser(user);
        try {
          const data = await getCallDetails(callId);
          if (!data) {
            setError("Call not found");
          } else {
            setCall(data as CallData);
          }
        } catch (e) {
          console.error("Failed to load call details", e);
          setError("Failed to load call details. Please try again.");
        }
        setLoading(false);
      })
      .catch(() => {
        navigate({ to: "/login" });
      });
  }, [callId, navigate]);

  // ─── Loading state ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent-500 border-t-transparent" />
        <p className="mt-4 text-sm text-ink-muted">Loading call details...</p>
      </div>
    );
  }

  // ─── Error state ────────────────────────────────────────────
  if (error) {
    return (
      <div className="mx-auto max-w-xl py-24 text-center">
        <div className="mb-4 text-4xl">🔍</div>
        <h2 className="mb-2 text-xl font-semibold text-ink">{error}</h2>
        <p className="mb-6 text-sm text-ink-muted">
          This call may have been deleted or you may not have access to it.
        </p>
        <Link
          to="/dashboard/calls"
          className="inline-flex items-center gap-2 rounded-xl bg-accent-600 px-5 py-2.5 text-sm font-medium text-ink hover:bg-accent-500"
        >
          ← Back to Call List
        </Link>
      </div>
    );
  }

  if (!call) return null;

  // ─── Parse JSON fields ──────────────────────────────────────
  const topics = parseJsonArray(call.key_topics);
  const objections = parseJsonArray(call.objections_detected);
  const complianceIssues = parseJsonArray(call.compliance_issues);
  const criteriaScores = call.scores?.[0] ? parseJsonObj(call.scores[0].criteria_scores) : {};
  const hasComplianceIssues = complianceIssues.length > 0;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* ── Back button + Header ───────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/calls"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-edge bg-panel-raised text-ink-muted transition-colors hover:border-white/20 hover:text-ink"
          >
            ←
          </Link>
          <div>
            <h1 className="text-xl font-bold text-ink sm:text-2xl">Call Review</h1>
            <p className="text-sm text-ink-muted">{call.rep_name} · {formatDate(call.started_at)}</p>
          </div>
        </div>
        <Link
          to="/dashboard/calls"
          className="inline-flex items-center gap-2 rounded-xl border border-edge bg-panel-raised px-4 py-2 text-sm text-ink-muted transition-colors hover:border-white/20 hover:text-ink sm:hidden"
        >
          ← All Calls
        </Link>
      </div>

      {/* ── Score Hero ─────────────────────────────────────── */}
      <div className="border border-edge bg-panel rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
          {/* Big Score Circle */}
          <div className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-2 ${scoreBg(call.overall_score)}`}>
            <span className={`text-3xl font-bold ${scoreColor(call.overall_score)}`}>
              {call.overall_score ?? "-"}
            </span>
          </div>

          {/* Quick info */}
          <div className="flex flex-1 flex-wrap justify-center gap-4 sm:justify-start">
            <QuickStat label="Direction" value={call.direction} />
            <QuickStat label="Duration" value={formatDuration(call.duration_seconds)} />
            <QuickStat label="Status" value={call.status} color={statusColor(call.status)} />
            <QuickStat label="Sentiment" value={call.sentiment} color={sentimentColor(call.sentiment)} />
          </div>
        </div>
      </div>

      {/* ── AI Analysis Grid ───────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Talk Ratio (Rep)"
          value={call.talk_ratio_rep != null ? `${(call.talk_ratio_rep * 100).toFixed(0)}%` : "-"}
          icon="🎙️"
        />
        <MetricCard
          label="Talk Ratio (Customer)"
          value={call.talk_ratio_customer != null ? `${(call.talk_ratio_customer * 100).toFixed(0)}%` : "-"}
          icon="👤"
        />
        <MetricCard
          label="Avg Pace"
          value={call.avg_pace_wpm ? `${Math.round(call.avg_pace_wpm)} wpm` : "-"}
          icon="⚡"
        />
        <MetricCard
          label="Filler Words"
          value={call.filler_word_count != null ? String(call.filler_word_count) : "-"}
          icon="🔊"
        />
      </div>

      {/* ── Key Topics ─────────────────────────────────────── */}
      {topics.length > 0 && (
        <div className="border border-edge bg-panel rounded-2xl p-5 sm:p-6">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-muted">Key Topics</h3>
          <div className="flex flex-wrap gap-2">
            {topics.map((topic, i) => (
              <span
                key={i}
                className="rounded-lg border border-accent-500/20 bg-accent-500/10 px-3 py-1.5 text-sm font-medium text-accent-300"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Two column: Objections + Compliance Issues ────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Objections */}
        <div className="border border-edge bg-panel rounded-2xl p-5 sm:p-6">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-muted">
            Objections Detected
          </h3>
          {objections.length > 0 ? (
            <ul className="space-y-2">
              {objections.map((obj, i) => (
                <li key={i} className="flex items-center gap-2 rounded-lg bg-red-500/5 px-3 py-2 text-sm text-red-300">
                  <span className="text-xs">⚠️</span>
                  <span className="capitalize">{obj}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-faint">No objections detected</p>
          )}
        </div>

        {/* Compliance Issues */}
        <div className="border border-edge bg-panel rounded-2xl p-5 sm:p-6">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-muted">
            Compliance Issues
          </h3>
          {hasComplianceIssues ? (
            <ul className="space-y-2">
              {complianceIssues.map((issue, i) => (
                <li key={i} className="flex items-center gap-2 rounded-lg bg-amber-500/5 px-3 py-2 text-sm text-amber-300">
                  <span className="text-xs">🚩</span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-faint">No compliance issues found</p>
          )}
        </div>
      </div>

      {/* ── AI Summary ────────────────────────────────────── */}
      {call.summary && (
        <div className="border border-edge bg-panel rounded-2xl p-5 sm:p-6">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-muted">AI Summary</h3>
          <p className="text-sm leading-relaxed text-ink-muted">{call.summary}</p>
        </div>
      )}

      {/* ── Scorecard Criteria Breakdown ─────────────────── */}
      {call.scores && call.scores.length > 0 && (
        <div className="border border-edge bg-panel rounded-2xl p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
              Scorecard: {call.scores[0].scorecard_name || "Standard"}
            </h3>
            <span className="rounded-lg border border-edge bg-panel-raised px-3 py-1 text-sm font-medium text-ink">
              Total: {call.scores[0].total_score ?? "-"}
            </span>
          </div>

          {Object.keys(criteriaScores).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(criteriaScores).map(([criterionId, score]) => (
                <div key={criterionId} className="flex items-center gap-3">
                  <span className="w-1/3 truncate text-sm text-ink-muted">{criterionId}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-panel-raised">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent-500 to-accent-500 transition-all"
                      style={{ width: `${Math.min(score, 100)}%` }}
                    />
                  </div>
                  <span className={`w-8 text-right text-sm font-medium ${scoreColor(score)}`}>
                    {score}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-faint">No criteria breakdown available</p>
          )}

          {call.scores[0].notes && (
            <div className="mt-4 rounded-lg bg-panel-raised px-4 py-3">
              <p className="text-xs font-medium text-ink-muted">Notes</p>
              <p className="mt-1 text-sm text-ink-muted">{call.scores[0].notes}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Compliance Checks ─────────────────────────────── */}
      {call.compliance && call.compliance.length > 0 && (
        <div className="border border-edge bg-panel rounded-2xl p-5 sm:p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink-muted">
            Compliance Checks ({call.compliance.filter((c) => c.passed).length}/{call.compliance.length} passed)
          </h3>
          <div className="space-y-3">
            {call.compliance.map((check, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 rounded-lg border p-3 ${
                  check.passed
                    ? "border-green-500/20 bg-green-500/5"
                    : "border-red-500/20 bg-red-500/5"
                }`}
              >
                <span className="mt-0.5 text-lg">{check.passed ? "✅" : "❌"}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink-muted">{check.rule_name}</p>
                  <p className="text-xs text-ink-muted">{check.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Transcript Section ────────────────────────────── */}
      {call.transcript && (
        <div className="border border-edge bg-panel rounded-2xl p-5 sm:p-6">
          <button
            onClick={() => setTranscriptExpanded(!transcriptExpanded)}
            className="flex w-full items-center justify-between"
          >
            <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">Transcript</h3>
            <span
              className={`text-sm text-ink-faint transition-transform ${
                transcriptExpanded ? "rotate-180" : ""
              }`}
            >
              ▼
            </span>
          </button>
          {transcriptExpanded && (
            <div className="mt-4 max-h-96 overflow-y-auto whitespace-pre-wrap rounded-lg bg-panel-raised/50 p-4 font-mono text-sm leading-relaxed text-ink-muted">
              {call.transcript}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────

function QuickStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col items-center sm:items-start">
      <span className="text-xs text-ink-faint">{label}</span>
      {color ? (
        <span className={`mt-0.5 rounded-md border px-2.5 py-0.5 text-xs font-medium ${color}`}>
          {value}
        </span>
      ) : (
        <span className="mt-0.5 text-sm font-medium capitalize text-ink-muted">{value}</span>
      )}
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="border border-edge bg-panel rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-ink-faint">{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="mt-2 text-xl font-bold text-ink">{value}</p>
    </div>
  );
}