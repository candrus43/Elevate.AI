import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";


import { getCompanyCalls, getCompanyMetrics, getRecentActivity, getCompanyUsers } from "~/utils/db";

export const Route = createFileRoute("/dashboard/")({
  component: ManagerDashboard,
});

function ManagerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserSession | null>(null);
  const [calls, setCalls] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(async ({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      try {
        const [callsData, metricsData, activityData, teamData] = await Promise.all([
          getCompanyCalls(user.companyId),
          getCompanyMetrics(user.companyId),
          getRecentActivity(user.companyId, 8),
          getCompanyUsers(user.companyId),
        ]);
        setCalls(callsData);
        setMetrics(metricsData);
        setActivity(activityData);
        setTeam(teamData.filter((u: any) => u.role === "rep"));
      } catch (e) {
        console.error("Failed to fetch dashboard data", e);
      }
      setLoading(false);
    });
  }, [navigate]);

  if (loading) return <div className="flex items-center justify-center h-48"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" /></div>;

  const avgScore = calls.length > 0 ? (calls.reduce((s, c) => s + (c.overall_score || 0), 0) / calls.length).toFixed(1) : "0";
  const analyzedCalls = calls.filter(c => c.status === "analyzed").length;
  const completionRate = metrics?.coaching_completion_rate ? `${(metrics.coaching_completion_rate * 100).toFixed(0)}%` : "-";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manager Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back, {user?.name}</p>
        </div>
        <Link to="/dashboard/calls" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          + New Review
        </Link>
      </div>

      {/* KPI Cards from live data */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Team Avg Score" value={avgScore} subtitle="across all calls" icon="📊" />
        <KpiCard title="Calls Analyzed" value={String(analyzedCalls)} subtitle="total" icon="🎧" />
        <KpiCard title="Coaching Completion" value={completionRate} subtitle="rate" icon="🎯" />
        <KpiCard title="Active Reps" value={String(team.length)} subtitle="team members" icon="👥" />
      </div>

      {/* Activity + Recent Calls */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
          <div className="space-y-3">
            {activity.length === 0 && <p className="text-sm text-gray-400">No recent activity</p>}
            {activity.map((item, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.user_name || "System"}</p>
                  <p className="text-xs text-gray-500">{item.event_type?.replace(/_/g, " ")} · {item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Recent Calls</h3>
          <div className="space-y-3">
            {calls.slice(0, 5).map((call, i) => (
              <Link key={i} to="/dashboard/calls/$callId" params={{ callId: call.id }} className="flex items-center justify-between rounded-lg bg-gray-50 p-3 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{call.rep_name || "Unknown"}</p>
                  <p className="text-xs text-gray-500">{call.started_at ? new Date(call.started_at).toLocaleDateString() : ""} · {call.duration_seconds ? `${Math.floor(call.duration_seconds / 60)}m` : ""}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  call.overall_score >= 85 ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
                  call.overall_score >= 70 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" :
                  "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                }`}>
                  {call.overall_score ?? "-"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Team Members</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 dark:border-gray-700">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Team</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {team.map((member, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{member.name}</td>
                  <td className="px-6 py-4 capitalize text-gray-600 dark:text-gray-400">{member.role}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{member.team_name || "-"}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      member.is_active ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
                      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    }`}>
                      {member.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, subtitle, icon }: { title: string; value: string; subtitle: string; icon: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>
    </div>
  );
}