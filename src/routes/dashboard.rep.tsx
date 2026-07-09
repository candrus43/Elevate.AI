import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/rep")({
  component: RepDashboard,
});

function RepDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Your personal performance overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <span className="text-2xl">🎯</span>
          <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">88.5</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">My Avg Score</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <span className="text-2xl">🎧</span>
          <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">47</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Calls This Week</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <span className="text-2xl">📚</span>
          <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">3</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Coaching Items Due</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <span className="text-2xl">🏆</span>
          <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">#4</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Leaderboard Rank</p>
        </div>
      </div>

      {/* Main content row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent calls */}
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Calls</h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {[
              { lead: "Acme Corp", score: 92, duration: "12:34", date: "Today" },
              { lead: "TechStart Inc", score: 78, duration: "8:22", date: "Today" },
              { lead: "Global Solutions", score: 85, duration: "15:10", date: "Yesterday" },
              { lead: "DataFlow Ltd", score: 95, duration: "10:45", date: "Yesterday" },
            ].map((call, i) => (
              <div key={i} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{call.lead}</p>
                  <p className="text-xs text-gray-500">{call.duration} · {call.date}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  call.score >= 90 ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
                  call.score >= 80 ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" :
                  "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                }`}>
                  {call.score}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Coaching plan */}
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Coaching Plan</h3>
          </div>
          <div className="p-6 space-y-4">
            {[
              { title: "Objection Handling Video", status: "completed", progress: 100 },
              { title: "Role Play: Price Objection", status: "in-progress", progress: 60 },
              { title: "Review Top 3 Calls", status: "pending", progress: 0 },
              { title: "Closing Techniques Quiz", status: "pending", progress: 0 },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                  item.status === "completed" ? "border-green-500 bg-green-500" :
                  item.status === "in-progress" ? "border-indigo-500 border-dashed" :
                  "border-gray-300 dark:border-gray-600"
                }`}>
                  {item.status === "completed" && <span className="text-white text-xs">✓</span>}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    item.status === "completed" ? "text-gray-500 line-through" : "text-gray-900 dark:text-white"
                  }`}>{item.title}</p>
                  {item.status === "in-progress" && (
                    <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                      <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${item.progress}%` }} />
                    </div>
                  )}
                </div>
              </div>
            ))}
            <button className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              Start Role Play Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}