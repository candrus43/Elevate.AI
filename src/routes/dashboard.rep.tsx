import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";


import { getUserCalls, getUserCoachingPlan, getUserMetrics, getLeaderboardRank, getUserPoints } from "~/utils/db";

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
        const [callsData, planData, metricsData, rankData, pointsData] = await Promise.all([
          getUserCalls(user.id, 5),
          getUserCoachingPlan(user.id),
          getUserMetrics(user.id),
          getLeaderboardRank(user.id, user.companyId),
          getUserPoints(user.id),
        ]);
        setCalls(callsData);
        setPlan(planData);
        setMetrics(metricsData);
        setRank(rankData);
        setPoints(pointsData);
      } catch (e) {
        console.error("Failed to load rep data", e);
      }
      setLoading(false);
    });
  }, [navigate]);

  if (loading) return <div className="flex items-center justify-center h-48"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" /></div>;

  const avgScore = calls.length > 0 ? (calls.reduce((s, c) => s + (c.overall_score || 0), 0) / calls.length).toFixed(1) : "-";
  const itemsDue = plan?.items?.filter((i: any) => i.status === "pending").length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back, {user?.name}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <span className="text-2xl">🎯</span>
          <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{avgScore}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">My Avg Score</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{calls.length} calls</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <span className="text-2xl">🎧</span>
          <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{calls.length}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Recent Calls</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <span className="text-2xl">📚</span>
          <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{itemsDue}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Coaching Items Due</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <span className="text-2xl">🏆</span>
          <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{rank ? `#${rank.rank}` : "-"}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{rank ? rank.leaderboard_name : "Leaderboard"}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{points} points</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent calls */}
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Calls</h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {calls.length === 0 && <p className="px-6 py-4 text-sm text-gray-400">No calls yet</p>}
            {calls.map((call, i) => (
              <div key={i} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{new Date(call.started_at).toLocaleDateString()}</p>
                  <p className="text-xs text-gray-500">{call.duration_seconds ? `${Math.floor(call.duration_seconds / 60)}:${String(call.duration_seconds % 60).padStart(2, "0")}` : "-"}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  call.overall_score >= 85 ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
                  call.overall_score >= 70 ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" :
                  "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                }`}>
                  {call.overall_score ?? "-"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Active Coaching Plan */}
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {plan ? plan.title : "Active Coaching Plan"}
            </h3>
          </div>
          <div className="p-6 space-y-4">
            {!plan && <p className="text-sm text-gray-400">No active coaching plan</p>}
            {plan?.items?.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  item.status === "completed" ? "border-green-500 bg-green-500" :
                  "border-gray-300 dark:border-gray-600"
                }`}>
                  {item.status === "completed" && <span className="text-white text-xs">✓</span>}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    item.status === "completed" ? "text-gray-500 line-through" : "text-gray-900 dark:text-white"
                  }`}>{item.title}</p>
                </div>
              </div>
            ))}
            {plan && (
              <div className="mt-3">
                <p className="text-xs text-gray-400">
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