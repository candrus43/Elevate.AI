import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { UserSession } from "~/utils/auth";
import { getCompanyCalls, getCompanyUsers } from "~/utils/db";

export const Route = createFileRoute("/dashboard/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserSession | null>(null);
  const [calls, setCalls] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7d");

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
          const [callsData, teamData] = await Promise.all([
            getCompanyCalls(user.companyId, 200),
            getCompanyUsers(user.companyId),
          ]);
          setCalls(callsData);
          setTeam(teamData.filter((u: any) => u.role === "rep"));
        } catch (e) {
          console.error("Failed to fetch analytics data", e);
        }
        setLoading(false);
      })
      .catch(() => {
        navigate({ to: "/login" });
      });
  }, [navigate]);

  const periods = [
    { value: "7d", label: "7 Days" },
    { value: "30d", label: "30 Days" },
    { value: "90d", label: "90 Days" },
  ];

  const filteredCalls = calls.filter((c) => {
    if (!c.started_at) return true;
    const date = new Date(c.started_at);
    const now = new Date();
    const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    if (period === "7d") return diffDays <= 7;
    if (period === "30d") return diffDays <= 30;
    return true; // 90d includes all
  });

  const avgScore = filteredCalls.length > 0
    ? (filteredCalls.reduce((s, c) => s + (c.overall_score || 0), 0) / filteredCalls.length).toFixed(1)
    : "0";

  const highScoreCount = filteredCalls.filter((c) => c.overall_score >= 85).length;
  const mediumScoreCount = filteredCalls.filter((c) => c.overall_score >= 70 && c.overall_score < 85).length;
  const lowScoreCount = filteredCalls.filter((c) => c.overall_score < 70).length;
  const maxCount = Math.max(highScoreCount, mediumScoreCount, lowScoreCount, 1);

  // Per-rep stats
  const repStats = team.map((rep) => {
    const repCalls = filteredCalls.filter((c) => c.rep_name === rep.name);
    const avg = repCalls.length > 0
      ? (repCalls.reduce((s, c) => s + (c.overall_score || 0), 0) / repCalls.length).toFixed(1)
      : "0";
    return { name: rep.name, calls: repCalls.length, avgScore: avg };
  }).sort((a, b) => Number(b.avgScore) - Number(a.avgScore));

  if (loading) return <AnalyticsSkeleton />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-sm text-gray-400">Team performance insights</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period Selector */}
          <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
                  period === p.value
                    ? "bg-purple-500/20 text-purple-300"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button className="btn-ghost rounded-xl border border-white/5 px-3 py-1.5 text-xs">
            <svg className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4 sm:p-5">
          <p className="text-xs text-gray-400 mb-1">Avg Score</p>
          <p className="text-2xl sm:text-3xl font-bold text-white">{avgScore}</p>
          <p className="text-xs text-gray-500 mt-1">{filteredCalls.length} calls analyzed</p>
        </div>
        <div className="glass-card rounded-xl p-4 sm:p-5">
          <p className="text-xs text-gray-400 mb-1">High Performers</p>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-400">{highScoreCount}</p>
          <p className="text-xs text-gray-500 mt-1">Score ≥ 85</p>
        </div>
        <div className="glass-card rounded-xl p-4 sm:p-5">
          <p className="text-xs text-gray-400 mb-1">Needs Improvement</p>
          <p className="text-2xl sm:text-3xl font-bold text-amber-400">{lowScoreCount}</p>
          <p className="text-xs text-gray-500 mt-1">Score &lt; 70</p>
        </div>
        <div className="glass-card rounded-xl p-4 sm:p-5">
          <p className="text-xs text-gray-400 mb-1">Active Reps</p>
          <p className="text-2xl sm:text-3xl font-bold text-white">{team.length}</p>
          <p className="text-xs text-gray-500 mt-1">{filteredCalls.length > 0 ? `${(filteredCalls.length / Math.max(team.length, 1)).toFixed(0)} calls/rep` : "No data"}</p>
        </div>
      </div>

      {/* Score Distribution Chart */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-base font-semibold text-white mb-4">Score Distribution</h3>
        <div className="space-y-3">
          {/* High Scores */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="text-xs text-gray-400">High (85+)</span>
              </div>
              <span className="text-xs font-mono text-gray-300">{highScoreCount}</span>
            </div>
            <div className="h-3 w-full rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
                style={{ width: `${(highScoreCount / maxCount) * 100}%` }}
              />
            </div>
          </div>

          {/* Medium Scores */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="text-xs text-gray-400">Medium (70-84)</span>
              </div>
              <span className="text-xs font-mono text-gray-300">{mediumScoreCount}</span>
            </div>
            <div className="h-3 w-full rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-700"
                style={{ width: `${(mediumScoreCount / maxCount) * 100}%` }}
              />
            </div>
          </div>

          {/* Low Scores */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="text-xs text-gray-400">Low (&lt;70)</span>
              </div>
              <span className="text-xs font-mono text-gray-300">{lowScoreCount}</span>
            </div>
            <div className="h-3 w-full rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-700"
                style={{ width: `${(lowScoreCount / maxCount) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Team Trends */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-base font-semibold text-white mb-4">Rep Performance</h3>

        {repStats.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-gray-400">No rep data available for this period.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {repStats.map((rep, i) => {
              const avgNum = Number(rep.avgScore);
              const maxScore = Math.max(...repStats.map((r) => Number(r.avgScore)), 1);
              const barWidth = Math.max((avgNum / maxScore) * 100, 5);

              return (
                <div key={i} className="flex items-center gap-3 sm:gap-4">
                  <span className="w-6 text-xs text-gray-500 font-mono text-right">#{i + 1}</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/30 to-indigo-600/30 text-xs font-medium text-purple-300 shrink-0">
                    {rep.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-white truncate">{rep.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{rep.calls} calls</span>
                        <span className={`text-xs font-bold font-mono ${
                          avgNum >= 85 ? "text-emerald-400" :
                          avgNum >= 70 ? "text-amber-300" :
                          "text-gray-400"
                        }`}>
                          {rep.avgScore}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-400 transition-all duration-700"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Call Volume Trend */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-base font-semibold text-white mb-4">Call Volume</h3>
        <div className="flex items-end justify-between gap-1 sm:gap-2 h-32 sm:h-40">
          {generateVolumeBars(filteredCalls).map((bar, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="flex-1 w-full rounded-t-md bg-gradient-to-t from-purple-600/30 to-purple-500/50 transition-all duration-500 relative group" style={{ height: `${bar.height}%` }}>
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-purple-300 whitespace-nowrap">
                  {bar.count}
                </div>
              </div>
              <span className="text-[8px] sm:text-[10px] text-gray-500">{bar.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function generateVolumeBars(calls: any[]) {
  // Group by day, last 7 days
  const days: { [key: string]: number } = {};
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("en-US", { weekday: "short" });
    days[key] = 0;
  }

  calls.forEach((c) => {
    if (!c.started_at) return;
    const d = new Date(c.started_at);
    const key = d.toLocaleDateString("en-US", { weekday: "short" });
    if (days[key] !== undefined) days[key]++;
  });

  const maxCount = Math.max(...Object.values(days), 1);
  return Object.entries(days).map(([label, count]) => ({
    label,
    count,
    height: (count / maxCount) * 100,
  }));
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-28 rounded-lg bg-white/5 animate-pulse" />
          <div className="h-4 w-36 rounded-lg bg-white/5 animate-pulse" />
        </div>
        <div className="h-8 w-52 rounded-xl bg-white/5 animate-pulse" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-card rounded-xl p-5 space-y-3">
            <div className="h-3 w-20 rounded bg-white/5 animate-pulse" />
            <div className="h-8 w-16 rounded bg-white/5 animate-pulse" />
            <div className="h-3 w-24 rounded bg-white/5 animate-pulse" />
          </div>
        ))}
      </div>

      <div className="glass-card rounded-xl p-5 space-y-4">
        <div className="h-5 w-36 rounded bg-white/5 animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 rounded bg-white/5 animate-pulse" />
              <div className="h-3 w-8 rounded bg-white/5 animate-pulse" />
            </div>
            <div className="h-3 w-full rounded-full bg-white/5 animate-pulse" />
          </div>
        ))}
      </div>

      <div className="glass-card rounded-xl p-5 space-y-4">
        <div className="h-5 w-28 rounded bg-white/5 animate-pulse" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-4 w-6 rounded bg-white/5 animate-pulse" />
            <div className="h-8 w-8 rounded-full bg-white/5 animate-pulse" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-24 rounded bg-white/5 animate-pulse" />
              <div className="h-2 w-full rounded-full bg-white/5 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}