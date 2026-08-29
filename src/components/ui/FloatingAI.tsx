import { useCallback, useEffect, useState } from "react";
import { cn } from "./cn";
import { BottomSheet } from "./BottomSheet";
import { Badge } from "./Badge";
import { Sparkles, Spinner, AlertTriangle, ChevronRight, ShieldAlert, Info } from "./icons";

/* ─────────────────────────────────────────────────────────────────
 * FloatingAI — floating AI action button + slide-up insight panel.
 *
 * NOT a chat bubble: tapping the FAB opens a proper bottom sheet with
 * grounded, contextual insight cards. Answers the five questions a
 * manager asks every morning:
 *   who needs attention / what changed / what to coach /
 *   what to follow up / what risk.
 *
 * All data comes from the existing rule-based Manager Assistant API
 * (real call scores + coaching records — no fabricated metrics).
 * When there is no data, we say so instead of inventing numbers.
 * ───────────────────────────────────────────────────────────────── */

type Role = "admin" | "manager" | "rep";

type View = "briefing" | "priorities" | "coaching" | "risk" | "followup";

interface FloatingAIProps {
  role: Role;
}

interface Briefing {
  summary: string;
  date: string;
  priorities: Array<{ repName: string; priority: string; reason: string; urgency: string }>;
  teamSnapshot: { totalReps: number; highPerformers: number; needsImprovement: number; atRisk: number };
}

const CHIPS: Array<{ id: View; label: string; icon: string }> = [
  { id: "priorities", label: "Who needs attention?", icon: "🎯" },
  { id: "coaching", label: "What should I coach?", icon: "🧭" },
  { id: "risk", label: "What's at risk?", icon: "⚠️" },
  { id: "followup", label: "What to follow up?", icon: "✅" },
];

function urgencyTone(urgency: string): "negative" | "warning" | "neutral" {
  if (urgency === "high" || urgency === "critical") return "negative";
  if (urgency === "medium") return "warning";
  return "neutral";
}

export function FloatingAI({ role }: FloatingAIProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("briefing");
  const [loading, setLoading] = useState(false);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Manager-only: reps have their own AI Coach surface, and the underlying
  // Manager Assistant API is gated to admin/manager.
  if (role === "rep") return null;

  const load = useCallback(async (next: View) => {
    setView(next);
    setError(null);
    setLoading(true);
    setRows([]);

    try {
      if (next === "briefing") {
        const res = await fetch("/api/manager-assistant/daily-briefing");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load briefing");
        setBriefing(json.briefing);
      } else {
        const endpoint: Record<Exclude<View, "briefing">, string> = {
          priorities: "/api/manager-assistant/daily-priorities",
          coaching: "/api/manager-assistant/coaching-recommendations",
          risk: "/api/manager-assistant/rep-risk-alerts",
          followup: "/api/manager-assistant/action-plans",
        };
        const res = await fetch(endpoint[next as Exclude<View, "briefing">]);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load insights");
        setRows(
          json.priorities ?? json.recommendations ?? json.alerts ?? json.plans ?? [],
        );
      }
    } catch (e: any) {
      setError(e?.message || "Something went wrong loading insights");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load the briefing when the panel first opens.
  useEffect(() => {
    if (open && view === "briefing" && !briefing) load("briefing");
  }, [open, view, briefing, load]);

  const toggle = () => setOpen((o) => !o);

  const hasTeam = !!briefing && briefing.teamSnapshot.totalReps > 0;

  return (
    <>
      {/* Floating action button */}
      <button
        type="button"
        onClick={toggle}
        aria-label="Open AI Copilot"
        aria-expanded={open}
        className={cn(
          "fixed bottom-20 right-4 z-[70] flex h-14 w-14 items-center justify-center rounded-full",
          "bg-gradient-to-br from-accent-500 to-accent-600 text-white",
          "shadow-glow transition-transform duration-200 active:scale-95",
          "sm:bottom-6 sm:right-6",
          open && "rotate-90",
        )}
      >
        <Sparkles className="h-6 w-6" />
      </button>

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title={
          <span className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-500/15 text-accent-400">
              <Sparkles className="h-4 w-4" />
            </span>
            AI Copilot
          </span>
        }
        description="Your team's most important signals, surfaced."
        footer={
          <a
            href="/dashboard/ai-assistant"
            className="inline-flex w-full items-center justify-between rounded-lg px-2 py-1 text-sm font-medium text-accent-300 transition-colors hover:bg-panel-raised"
          >
            Open full assistant
            <ChevronRight className="h-4 w-4" />
          </a>
        }
      >
        {/* Question chips */}
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => load("briefing")}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              view === "briefing"
                ? "border-accent-500/40 bg-accent-500/15 text-accent-200"
                : "border-edge text-ink-muted hover:border-edge-strong hover:text-ink",
            )}
          >
            ✨ Briefing
          </button>
          {CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => load(chip.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                view === chip.id
                  ? "border-accent-500/40 bg-accent-500/15 text-accent-200"
                  : "border-edge text-ink-muted hover:border-edge-strong hover:text-ink",
              )}
            >
              {chip.icon} {chip.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-ink-faint">
            <Spinner className="h-4 w-4 animate-spin" />
            Analyzing your team…
          </div>
        )}

        {!loading && error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Briefing view */}
        {!loading && !error && view === "briefing" && briefing && (
          <div className="space-y-3">
            <div className="rounded-lg border border-edge bg-panel-raised/50 p-3">
              <p className="text-sm leading-relaxed text-ink">{briefing.summary}</p>
              {!hasTeam && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-faint">
                  <Info className="h-3.5 w-3.5" />
                  No analyzed calls yet — connect calls to surface coaching signals.
                </p>
              )}
            </div>

            {hasTeam && (
              <div className="grid grid-cols-3 gap-2">
                <SnapshotStat label="At risk" value={briefing.teamSnapshot.atRisk} tone="negative" />
                <SnapshotStat label="Needs work" value={briefing.teamSnapshot.needsImprovement} tone="warning" />
                <SnapshotStat label="Strong" value={briefing.teamSnapshot.highPerformers} tone="positive" />
              </div>
            )}

            {briefing.priorities.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
                  Top priorities
                </p>
                {briefing.priorities.slice(0, 4).map((p, i) => (
                  <div key={i} className="rounded-lg border border-edge p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-ink">{p.repName}</span>
                      <Badge tone={urgencyTone(p.urgency)}>{p.urgency}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-ink-muted">{p.priority}</p>
                    <p className="mt-0.5 text-xs text-ink-faint">{p.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* List views (priorities / coaching / risk / followup) */}
        {!loading && !error && view !== "briefing" && (
          <div className="space-y-2">
            {rows.length === 0 && <EmptyForView view={view} />}
            {view === "priorities" &&
              rows.map((p, i) => (
                <div key={i} className="rounded-lg border border-edge p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-ink">{p.repName}</span>
                    <Badge tone={urgencyTone(p.urgency)}>{p.urgency}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">{p.priority}</p>
                  <p className="mt-0.5 text-xs text-ink-faint">{p.reason}</p>
                </div>
              ))}

            {view === "coaching" &&
              rows.map((r, i) => (
                <div key={i} className="rounded-lg border border-edge p-3">
                  <p className="text-sm font-medium text-ink">{r.repName}</p>
                  <p className="mt-1 text-xs text-ink-muted">{r.title}</p>
                  <p className="mt-0.5 text-xs text-ink-faint">{r.description}</p>
                </div>
              ))}

            {view === "risk" &&
              rows.map((r, i) => (
                <div key={i} className="rounded-lg border border-edge p-3">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
                    <ShieldAlert className="h-4 w-4 text-amber-400" />
                    {r.repName}
                  </p>
                  <div className="mt-2 space-y-1.5">
                    {r.alerts.map((a: any, j: number) => (
                      <div key={j} className="flex items-start gap-2">
                        <Badge tone={a.severity === "high" ? "negative" : "warning"}>
                          {a.severity}
                        </Badge>
                        <p className="min-w-0 text-xs text-ink-muted">{a.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

            {view === "followup" &&
              rows.map((p, i) => (
                <div key={i} className="rounded-lg border border-edge p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-ink">{p.title}</p>
                    {p.status && <Badge tone="info">{p.status}</Badge>}
                  </div>
                  {p.rep_name && (
                    <p className="mt-0.5 text-xs text-ink-faint">{p.rep_name}</p>
                  )}
                </div>
              ))}
          </div>
        )}
      </BottomSheet>
    </>
  );
}

/* ── Small helpers ─────────────────────────────────────────────── */

function SnapshotStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "positive" | "warning" | "negative";
}) {
  const color =
    tone === "positive"
      ? "text-emerald-400"
      : tone === "warning"
        ? "text-amber-400"
        : "text-red-400";
  return (
    <div className="rounded-lg border border-edge bg-panel-raised/50 p-2 text-center">
      <p className={cn("text-xl font-bold tabular-nums", color)}>{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</p>
    </div>
  );
}

function EmptyForView({ view }: { view: View }) {
  const msg: Record<Exclude<View, "briefing">, string> = {
    priorities: "No coaching priorities right now — everyone's on track.",
    coaching: "No coaching recommendations yet — add reps and analyze calls.",
    risk: "No risk alerts right now.",
    followup: "No action plans yet — create one from a rep's coaching plan.",
  };
  return (
    <p className="rounded-lg border border-edge bg-panel-raised/50 px-3 py-6 text-center text-sm text-ink-faint">
      {msg[view as Exclude<View, "briefing">]}
    </p>
  );
}
