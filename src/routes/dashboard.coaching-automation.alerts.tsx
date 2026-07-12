import { useEffect, useState } from "react";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassBadge, GlassButton, GlassInput, GlassSelect, GlassStatCard, LoadingSkeleton, EmptyState } from "~/components/GlassCard";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/coaching-automation/alerts")({
  component: AlertsNotifications,
});

function AlertsNotifications() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      setLoading(false);
    });
  }, [navigate]);

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  const alerts = [
    { id: "a1", message: "Maria's objection handling score dropped to 58%", type: "skill", severity: "high" as const, time: "2 hours ago", read: false },
    { id: "a2", message: "Enterprise Sales team completed all assigned courses", type: "performance", severity: "low" as const, time: "5 hours ago", read: false },
    { id: "a3", message: "James hasn't completed a coaching session in 7 days", type: "performance", severity: "medium" as const, time: "1 day ago", read: true },
    { id: "a4", message: "Sarah improved discovery score by 15 points this week", type: "performance", severity: "low" as const, time: "1 day ago", read: true },
    { id: "a5", message: "Compliance breach detected on 3 outbound calls", type: "compliance", severity: "high" as const, time: "2 days ago", read: true },
    { id: "a6", message: "Alex completed 5 roleplay sessions this week — new record", type: "performance", severity: "low" as const, time: "2 days ago", read: true },
    { id: "a7", message: "Team coaching volume dropped 20% this week", type: "performance", severity: "medium" as const, time: "3 days ago", read: true },
    { id: "a8", message: "New objection handling workshop available for assignment", type: "skill", severity: "low" as const, time: "3 days ago", read: true },
  ];

  const filtered = filter === "all" ? alerts : filter === "unread" ? alerts.filter(a => !a.read) : alerts.filter(a => a.severity === filter);

  const severityDots = { high: "bg-red-500", medium: "bg-amber-500", low: "bg-green-500" };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/coaching-automation" className="text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&larr;</Link>
        <div className="flex-1"><h1 className="text-2xl font-bold text-white">Alerts & Notifications</h1><p className="text-sm text-gray-400">Stay informed about coaching activities</p></div>
        <div className="flex gap-2">
          <button className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">Mark All Read</button>
          <button className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">Dismiss All</button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: "all", label: "All Alerts", count: alerts.length },
          { id: "unread", label: "Unread", count: alerts.filter(a => !a.read).length },
          { id: "high", label: "High", count: alerts.filter(a => a.severity === "high").length },
          { id: "medium", label: "Medium", count: alerts.filter(a => a.severity === "medium").length },
          { id: "low", label: "Low", count: alerts.filter(a => a.severity === "low").length },
        ].map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${filter === f.id ? "text-white bg-gradient-to-r from-purple-600 to-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"}`}>
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="rounded-2xl glass-subtle transition-all duration-300">
        <div className="divide-y divide-white/5">
          {filtered.map((alert) => (
            <div key={alert.id} className={`flex items-start gap-4 px-6 py-4 transition-colors hover:bg-white/[0.02] ${!alert.read ? "bg-indigo-50/50 dark:bg-indigo-900/10" : ""}`}>
              <div className="flex flex-col items-center gap-1.5 pt-1">
                <span className={`h-2.5 w-2.5 rounded-full ${severityDots[alert.severity]}`} />
                {!alert.read && <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-medium text-white">{alert.message}</p>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${alert.severity === "high" ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" : alert.severity === "medium" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" : "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"}`}>{alert.severity}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600 dark:bg-gray-800 dark:text-gray-400">{alert.type}</span>
                  <span>{alert.time}</span>
                </div>
              </div>
              <button className="shrink-0 rounded-lg px-2 py-1 text-xs text-gray-500 transition-colors hover:bg-white/[0.02]">
                {alert.read ? "Mark Unread" : "Mark Read"}
              </button>
            </div>
          ))}
          {filtered.length === 0 && <div className="px-6 py-8 text-center text-sm text-gray-500">No alerts found.</div>}
        </div>
      </div>
    </div>
  );
}