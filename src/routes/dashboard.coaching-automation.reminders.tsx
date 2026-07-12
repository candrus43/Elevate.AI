import { useEffect, useState } from "react";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassBadge, GlassButton, GlassInput, GlassSelect, GlassStatCard, LoadingSkeleton, EmptyState } from "~/components/GlassCard";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/coaching-automation/reminders")({
  component: RemindersPage,
});

function RemindersPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      setLoading(false);
    });
  }, [navigate]);

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  const reminders = [
    { id: "r1", title: "1:1 Meeting with Sarah Chen", assignee: "You", due: "Today, 2:00 PM", recurrence: "Weekly", status: "active" as const },
    { id: "r2", title: "Weekly Coaching Report Due", assignee: "You", due: "Tomorrow, 5:00 PM", recurrence: "Weekly", status: "active" as const },
    { id: "r3", title: "Review Alex's Roleplay Session", assignee: "You", due: "Jul 14, 2026", recurrence: "None", status: "active" as const },
    { id: "r4", title: "Monthly Team Performance Review", assignee: "Leadership", due: "Aug 1, 2026", recurrence: "Monthly", status: "active" as const },
    { id: "r5", title: "Complete Compliance Training", assignee: "All Reps", due: "Jul 20, 2026", recurrence: "Quarterly", status: "snoozed" as const },
    { id: "r6", title: "Update Coaching Scorecards", assignee: "You", due: "Jul 8, 2026", recurrence: "Monthly", status: "dismissed" as const },
  ];

  const statusColors = {
    active: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    snoozed: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    dismissed: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/coaching-automation" className="text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&larr;</Link>
        <div className="flex-1"><h1 className="text-2xl font-bold text-white">Reminders</h1><p className="text-sm text-gray-400">Manage coaching reminders and notifications</p></div>
        <button onClick={() => setShowCreate(true)} className="rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:from-purple-500 hover:to-indigo-500">+ Create Reminder</button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {["All", "Active", "Snoozed", "Dismissed"].map((f, i) => (
          <button key={i} className="rounded-full text-white bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-1.5 text-xs font-medium text-white">{f}</button>
        ))}
      </div>

      {/* Reminders List */}
      <div className="rounded-2xl glass-subtle transition-all duration-300">
        <div className="divide-y divide-white/5">
          {reminders.map((r) => (
            <div key={r.id} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-white/[0.02]">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                r.status === "active" ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300" :
                r.status === "snoozed" ? "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300" :
                "bg-gray-100 text-gray-400 dark:bg-gray-800"
              }`}>
                {r.status === "active" ? "⏰" : r.status === "snoozed" ? "💤" : "✅"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white">{r.title}</p>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${statusColors[r.status]}`}>{r.status}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                  <span>📅 {r.due}</span>
                  <span>👤 {r.assignee}</span>
                  <span>🔄 {r.recurrence}</span>
                </div>
              </div>
              <div className="flex gap-1">
                {r.status === "active" && <button className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400">Snooze</button>}
                <button className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400">Dismiss</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Reminder Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold text-white">Create Reminder</h3><button onClick={() => setShowCreate(false)} className="text-2xl text-gray-400 hover:text-gray-600">&times;</button></div>
            <div className="space-y-4">
              <div><label className="mb-1.5 block text-sm font-medium text-gray-300">Title</label><input type="text" placeholder="Reminder title" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" /></div>
              <div><label className="mb-1.5 block text-sm font-medium text-gray-300">Assignee</label><select className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"><option>You</option><option>Team</option><option>All Reps</option></select></div>
              <div><label className="mb-1.5 block text-sm font-medium text-gray-300">Due Date</label><input type="date" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" /></div>
              <div><label className="mb-1.5 block text-sm font-medium text-gray-300">Recurrence</label><select className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"><option>None</option><option>Daily</option><option>Weekly</option><option>Monthly</option><option>Quarterly</option></select></div>
              <button className="w-full rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 py-2.5 text-sm font-medium text-white hover:from-purple-500 hover:to-indigo-500">Create Reminder</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}