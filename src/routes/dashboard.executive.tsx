import { LoadingSkeleton } from '~/components/GlassCard';
import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/executive")({
  component: ExecutiveDashboard,
});

function ExecutiveDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("7d");

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      setLoading(false);
    });
  }, [navigate]);

  const kpis = [
    { label: "Total Revenue", value: "$124,500", change: "+12.3%", positive: true, icon: "💰", gradient: "from-indigo-500 to-purple-600" },
    { label: "Calls Analyzed", value: "2,847", change: "+8.1%", positive: true, icon: "🎧", gradient: "from-blue-500 to-cyan-600" },
    { label: "Avg Score", value: "74%", change: "+3.2%", positive: true, icon: "📊", gradient: "from-emerald-500 to-green-600" },
    { label: "Active Reps", value: "24", change: "+4", positive: true, icon: "👥", gradient: "from-amber-500 to-orange-600" },
    { label: "Coaching ROI", value: "312%", change: "+28%", positive: true, icon: "🎯", gradient: "from-rose-500 to-pink-600" },
    { label: "Churn Rate", value: "2.1%", change: "-0.5%", positive: true, icon: "🛡️", gradient: "from-violet-500 to-purple-600" },
  ];

  const teamHealth = [
    { name: "Enterprise Sales", score: 87, reps: 8, calls: 342, trend: "up" },
    { name: "SMB Sales", score: 72, reps: 6, calls: 891, trend: "up" },
    { name: "Customer Success", score: 91, reps: 4, calls: 156, trend: "up" },
    { name: "Inside Sales", score: 65, reps: 6, calls: 1458, trend: "down" },
  ];

  const weeklyTrend = [
    { day: "Mon", calls: 120, score: 72 },
    { day: "Tue", calls: 145, score: 75 },
    { day: "Wed", calls: 132, score: 78 },
    { day: "Thu", calls: 158, score: 74 },
    { day: "Fri", calls: 142, score: 76 },
    { day: "Sat", calls: 98, score: 80 },
    { day: "Sun", calls: 52, score: 82 },
  ];

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Executive Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Company-wide KPIs, trends, and actionable insights</p>
        </div>
        <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800">
          {["7d", "30d", "90d", "1y"].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${dateRange === range ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}
            >
              {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : range === "90d" ? "90 Days" : "1 Year"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi, i) => (
          <div key={i} className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 transition-all hover:shadow-lg dark:border-gray-700 dark:bg-gray-900">
            <div className={`absolute right-0 top-0 h-20 w-20 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br ${kpi.gradient} opacity-10 blur-2xl`} />
            <div className="relative">
              <span className="text-xl">{kpi.icon}</span>
              <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">{kpi.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{kpi.label}</p>
              <span className={`inline-flex items-center gap-0.5 mt-1 text-xs font-medium ${kpi.positive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {kpi.positive ? "↑" : "↓"} {kpi.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Weekly Trend Chart */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Weekly Trend</h3>
          <div className="flex items-end gap-2 h-40">
            {weeklyTrend.map((day, i) => {
              const maxCalls = Math.max(...weeklyTrend.map(d => d.calls));
              const height = (day.calls / maxCalls) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs text-gray-500">{day.score}%</span>
                  <div className="w-full flex flex-col items-center" style={{ height: `${height}%` }}>
                    <div className="w-full rounded-t bg-gradient-to-t from-indigo-500 to-purple-500 transition-all" style={{ height: "100%" }} />
                  </div>
                  <span className="text-xs text-gray-500">{day.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team Health */}
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Team Health</h3>
            <a href="/dashboard/executive/team-health" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">View all</a>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {teamHealth.map((team, i) => (
              <div key={i} className="px-6 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{team.name}</p>
                    <p className="text-xs text-gray-500">{team.reps} reps · {team.calls} calls</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{team.score}%</span>
                    <span className={`text-xs ${team.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                      {team.trend === "up" ? "↑" : "↓"}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      team.score >= 80 ? "bg-green-500" : team.score >= 70 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${team.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <a href="/dashboard/executive/forecasting" className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-indigo-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-indigo-600">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">🔮</div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Forecasting</p>
              <p className="text-sm text-gray-500">Revenue projections & trends</p>
            </div>
          </div>
        </a>
        <a href="/dashboard/executive/team-health" className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-indigo-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-indigo-600">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 text-white">❤️</div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Team Health</p>
              <p className="text-sm text-gray-500">Detailed team metrics</p>
            </div>
          </div>
        </a>
        <a href="/dashboard/executive/reports" className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-indigo-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-indigo-600">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">📄</div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Reports</p>
              <p className="text-sm text-gray-500">Scheduled reports & exports</p>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}