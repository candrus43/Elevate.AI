import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/")({
  component: ManagerDashboard,
});

function ManagerDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manager Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Team performance overview</p>
        </div>
        <div className="flex gap-3">
          <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            + New Review
          </button>
          <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
            Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Team Score" value="87.4" change="+2.1%" positive icon="📊" />
        <KpiCard title="Calls Analyzed" value="1,247" change="+12.5%" positive icon="🎧" />
        <KpiCard title="Coaching Completion" value="73%" change="+5.3%" positive icon="🎯" />
        <KpiCard title="Conversion Rate" value="24.6%" change="-1.2%" positive={false} icon="📈" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Team Performance Trend</h3>
          <div className="flex h-48 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800">
            <span className="text-sm text-gray-400">Chart: Team scores over time</span>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
          <div className="space-y-3">
            {[
              { name: "Sarah Chen", action: "Completed coaching plan", time: "2h ago", score: "+15" },
              { name: "Mike Rodriguez", action: "Call scored 92", time: "3h ago", score: "92" },
              { name: "Emily Watson", action: "Started role-play session", time: "5h ago", score: "" },
              { name: "James Kim", action: "Achieved 'Top Performer' badge", time: "1d ago", score: "" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.action} · {item.time}</p>
                </div>
                {item.score && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                    {item.score}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team table */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Team Members</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 dark:border-gray-700">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Calls</th>
                <th className="px-6 py-3 font-medium">Avg Score</th>
                <th className="px-6 py-3 font-medium">Coaching</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {[
                { name: "Sarah Chen", calls: 142, score: 88, coaching: "75%", status: "On Track" },
                { name: "Mike Rodriguez", calls: 98, score: 92, coaching: "90%", status: "Excellent" },
                { name: "Emily Watson", calls: 156, score: 76, coaching: "45%", status: "Needs Review" },
                { name: "James Kim", calls: 87, score: 84, coaching: "60%", status: "On Track" },
              ].map((member, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{member.name}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{member.calls}</td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900 dark:text-white">{member.score}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{member.coaching}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      member.status === "Excellent" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
                      member.status === "On Track" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" :
                      "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                    }`}>
                      {member.status}
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

function KpiCard({ title, value, change, positive, icon }: { title: string; value: string; change: string; positive: boolean; icon: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          positive ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
        }`}>
          {change}
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{title}</p>
    </div>
  );
}