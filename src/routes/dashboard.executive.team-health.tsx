import { LoadingSkeleton } from '~/components/GlassCard';
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassStatCard, GlassBadge } from '~/components/GlassCard';
import { RiskIndicator, RiskDot, ProgressBar } from '~/components/executive';
import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/executive/team-health")({
  component: TeamHealth,
});

function TeamHealth() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      setLoading(false);
    });
  }, [navigate]);

  const teams = [
    { name: "Enterprise Sales", score: 87, trend: "up", reps: 8, calls: 342, avgScore: 82, coaching: 95, revenue: "$1.2M", risk: "low" as const, manager: "Sarah Mitchell" },
    { name: "SMB Sales", score: 72, trend: "up", reps: 6, calls: 891, avgScore: 68, coaching: 78, revenue: "$890K", risk: "medium" as const, manager: "David Chen" },
    { name: "Customer Success", score: 91, trend: "up", reps: 4, calls: 156, avgScore: 88, coaching: 100, revenue: "$650K", risk: "low" as const, manager: "Jessica Park" },
    { name: "Inside Sales", score: 65, trend: "down", reps: 6, calls: 1458, avgScore: 61, coaching: 55, revenue: "$420K", risk: "high" as const, manager: "Michael Torres" },
  ];

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with back nav */}
      <div className="flex items-center gap-4">
        <Link to="/dashboard/executive" className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-panel-raised transition-colors">
          <svg className="h-5 w-5 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-ink">Team Health</h1>
          <p className="text-sm text-ink-muted">Detailed team performance metrics and risk indicators</p>
        </div>
      </div>

      {/* Summary Stats using GlassStatCard */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <GlassStatCard label="Total Teams" value="4" icon={<span>🏢</span>} color="from-accent-500 to-accent-600" />
        <GlassStatCard label="Avg Score" value="78.8%" icon={<span>📊</span>} color="from-emerald-500 to-green-600" />
        <GlassStatCard label="At Risk" value="1" icon={<span>⚠️</span>} color="from-red-500 to-rose-600" />
        <GlassStatCard label="Top Performer" value="91%" icon={<span>🏆</span>} color="from-amber-500 to-orange-600" />
      </div>

      {/* Team detail cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {teams.map((team, i) => (
          <GlassCard key={i} padding="md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <RiskDot level={team.risk} />
                <h3 className="font-semibold text-ink">{team.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <RiskIndicator level={team.risk} size="sm" />
                <span className={`text-xs ${team.trend === "up" ? "text-green-400" : "text-red-400"}`}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={team.trend === "up" ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
                  </svg>
                </span>
              </div>
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-ink-muted">Overall Health</span>
                <span className="text-sm font-bold text-ink">{team.score}%</span>
              </div>
              <ProgressBar value={team.score} size="md" showLabel={false} />
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-faint">Manager</span>
                <span className="text-xs font-medium text-ink">{team.manager}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-faint">Reps</span>
                <span className="text-xs font-medium text-ink">{team.reps}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-faint">Calls</span>
                <span className="text-xs font-medium text-ink">{team.calls}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-faint">Avg Score</span>
                <span className="text-xs font-medium text-ink">{team.avgScore}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-faint">Coaching</span>
                <span className="text-xs font-medium text-ink">{team.coaching}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-faint">Revenue</span>
                <span className="text-xs font-medium text-ink">{team.revenue}</span>
              </div>
            </div>

            {/* Mini bar for coaching */}
            <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-ink-muted">Coaching Engagement</span>
                <span className="text-xs font-medium text-ink">{team.coaching}%</span>
              </div>
              <ProgressBar value={team.coaching} size="sm" color="purple" showLabel={false} />
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Comparison Table using GlassCard */}
      <GlassCard padding="none">
        <GlassCardHeader>
          <h3 className="text-lg font-semibold text-ink">Team Comparison</h3>
        </GlassCardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
                <th className="px-5 sm:px-6 py-3 text-left text-[10px] font-semibold text-ink-faint uppercase tracking-wider">Team</th>
                <th className="px-4 py-3 text-right text-[10px] font-semibold text-ink-faint uppercase tracking-wider">Score</th>
                <th className="px-4 py-3 text-right text-[10px] font-semibold text-ink-faint uppercase tracking-wider">Calls</th>
                <th className="px-4 py-3 text-right text-[10px] font-semibold text-ink-faint uppercase tracking-wider">Avg Score</th>
                <th className="px-4 py-3 text-right text-[10px] font-semibold text-ink-faint uppercase tracking-wider">Coaching</th>
                <th className="px-4 py-3 text-right text-[10px] font-semibold text-ink-faint uppercase tracking-wider">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "rgba(255, 255, 255, 0.06)" }}>
              {teams.map((team, i) => (
                <tr key={i} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-5 sm:px-6 py-4">
                    <div className="flex items-center gap-2">
                      <RiskDot level={team.risk} size="sm" />
                      <span className="text-sm font-medium text-ink">{team.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className={`text-sm font-bold ${
                      team.score >= 80 ? "text-emerald-400" :
                      team.score >= 70 ? "text-amber-400" : "text-red-400"
                    }`}>{team.score}%</span>
                  </td>
                  <td className="px-4 py-4 text-right text-sm text-ink-muted">{team.calls}</td>
                  <td className="px-4 py-4 text-right text-sm text-ink-muted">{team.avgScore}%</td>
                  <td className="px-4 py-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <div className="h-1.5 w-12 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div className="h-1.5 rounded-full bg-gradient-to-r from-accent-500 to-accent-500" style={{ width: `${team.coaching}%` }} />
                      </div>
                      <span className="text-xs font-medium text-ink">{team.coaching}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-medium text-ink">{team.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}