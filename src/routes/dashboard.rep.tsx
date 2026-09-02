import { LoadingSkeleton } from '~/components/GlassCard';
import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";



export const Route = createFileRoute("/dashboard/rep")({
  component: RepDashboard,
});

function RepDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserSession | null>(null);
  const [calls, setCalls] = useState<any[]>([]);
  const [plan, setPlan] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [rank, setRank] = useState<any>(null);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(async ({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      try {
        const res = await fetch("/api/dashboard/rep");
        const data = await res.json();
        setCalls(data.calls || []);
        setPlan(data.plan);
        setMetrics(data.metrics);
        setRank(data.rank);
        setPoints(data.points || 0);
      } catch (e) {
        console.error("Failed to load rep data", e);
      }
      setLoading(false);
    });
  }, [navigate]);

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  const avgScore = calls.length > 0 ? (calls.reduce((s, c) => s + (c.overall_score || 0), 0) / calls.length).toFixed(1) : "-";
  const itemsDue = plan?.items?.filter((i: any) => i.status === "pending").length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">My Dashboard</h1>
        <p className="text-sm text-ink-muted">Welcome back, {user?.name}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-edge bg-panel p-5">
          <span className="text-2xl">🎯</span>
          <p className="mt-3 text-2xl font-bold text-ink">{avgScore}</p>
          <p className="text-sm text-ink-muted">My Avg Score</p>
          <p className="text-xs text-ink-faint">{calls.length} calls</p>
        </div>
        <div className="rounded-xl border border-edge bg-panel p-5">
          <span className="text-2xl">🎧</span>
          <p className="mt-3 text-2xl font-bold text-ink">{calls.length}</p>
          <p className="text-sm text-ink-muted">Recent Calls</p>
        </div>
        <div className="rounded-xl border border-edge bg-panel p-5">
          <span className="text-2xl">📚</span>
          <p className="mt-3 text-2xl font-bold text-ink">{itemsDue}</p>
          <p className="text-sm text-ink-muted">Coaching Items Due</p>
        </div>
        <div className="rounded-xl border border-edge bg-panel p-5">
          <span className="text-2xl">🏆</span>
          <p className="mt-3 text-2xl font-bold text-ink">{rank ? `#${rank.rank}` : "-"}</p>
          <p className="text-sm text-ink-muted">{rank ? rank.leaderboard_name : "Leaderboard"}</p>
          <p className="text-xs text-ink-faint">{points} points</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent calls */}
        <div className="rounded-xl border border-edge bg-panel">
          <div className="border-b border-edge px-6 py-4">
            <h3 className="text-lg font-semibold text-ink">Recent Calls</h3>
          </div>
          <div className="divide-y divide-edge">
            {calls.length === 0 && <p className="px-6 py-4 text-sm text-ink-muted">No calls yet</p>}
            {calls.map((call, i) => (
              <div key={i} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm font-medium text-ink">{new Date(call.started_at).toLocaleDateString()}</p>
                  <p className="text-xs text-ink-faint">{call.duration_seconds ? `${Math.floor(call.duration_seconds / 60)}:${String(call.duration_seconds % 60).padStart(2, "0")}` : "-"}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  call.overall_score >= 85 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25" :
                  call.overall_score >= 70 ? "bg-accent-500/10 text-accent-300 border border-accent-500/25" :
                  "bg-amber-500/10 text-amber-400 border border-amber-500/25"
                }`}>
                  {call.overall_score ?? "-"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Active Coaching Plan */}
        <div className="rounded-xl border border-edge bg-panel">
          <div className="border-b border-edge px-6 py-4">
            <h3 className="text-lg font-semibold text-ink">
              {plan ? plan.title : "Active Coaching Plan"}
            </h3>
          </div>
          <div className="p-6 space-y-4">
            {!plan && <p className="text-sm text-ink-muted">No active coaching plan</p>}
            {plan?.items?.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  item.status === "completed" ? "border-emerald-500 bg-emerald-500" :
                  "border-edge"
                }`}>
                  {item.status === "completed" && <span className="text-white text-xs">✓</span>}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    item.status === "completed" ? "text-ink-faint line-through" : "text-ink"
                  }`}>{item.title}</p>
                </div>
              </div>
            ))}
            {plan && (
              <div className="mt-3">
                <p className="text-xs text-ink-muted">
                  {plan.items?.filter((i: any) => i.status === "completed").length || 0}/{plan.items?.length || 0} completed
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}