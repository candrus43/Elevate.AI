import { useEffect, useState } from "react";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassBadge, GlassButton, GlassInput, GlassSelect, GlassStatCard, LoadingSkeleton, EmptyState } from "~/components/GlassCard";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/coaching-automation/briefings")({
  component: BriefingsReports,
});

function BriefingsReports() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("daily");
  const [showSchedule, setShowSchedule] = useState(false);

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      setLoading(false);
    });
  }, [navigate]);

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  const tabs = [
    { id: "daily", label: "Daily Briefing" },
    { id: "weekly", label: "Weekly Report" },
    { id: "monthly", label: "Monthly Report" },
  ];

  const schedules = [
    { name: "Daily Team Briefing", recipients: "All Managers", time: "8:00 AM", format: "Email + Dashboard", enabled: true },
    { name: "Weekly Coaching Summary", recipients: "VP of Sales", time: "Monday 9:00 AM", format: "Email + PDF", enabled: true },
    { name: "Monthly Executive Report", recipients: "Leadership Team", time: "1st of month", format: "Email + PDF + Dashboard", enabled: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/coaching-automation" className="text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&larr;</Link>
        <div className="flex-1"><h1 className="text-2xl font-bold text-white">Briefings & Reports</h1><p className="text-sm text-gray-400">View and schedule coaching reports</p></div>
        <button onClick={() => setShowSchedule(true)} className="rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:from-purple-500 hover:to-indigo-500">+ Schedule Report</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${tab === t.id ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>{t.label}</button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "daily" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Daily Briefing — Jul 11, 2026</h3>
            <button className="rounded-lg text-white bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:from-purple-500 hover:to-indigo-500">Regenerate</button>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Performance Overview</p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Avg Score", value: "76%", change: "+3%" },
                  { label: "Sessions Completed", value: "12", change: "+20%" },
                  { label: "Coaching Effectiveness", value: "84%", change: "+5%" },
                ].map((s, i) => (
                  <div key={i} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className="text-xl font-bold text-white">{s.value}</p>
                    <p className="text-xs text-green-600">{s.change}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Today's Highlights</p>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>✅ Enterprise Sales: 100% session completion rate</li>
                <li>⚠️ Maria's compliance scores dropped 12 points — review needed</li>
                <li>🚀 James completed Objection Handling Masterclass with 88% score</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {tab === "weekly" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Weekly Report — Jul 5-11, 2026</h3>
            <div className="flex gap-2">
              <button className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">Download PDF</button>
              <button className="rounded-lg text-white bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:from-purple-500 hover:to-indigo-500">Regenerate</button>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Total Sessions", value: "48", change: "+12" },
                { label: "Avg Score", value: "74%", change: "+4%" },
                { label: "Completion Rate", value: "82%", change: "+6%" },
                { label: "Active Reps", value: "24", change: "+2" },
              ].map((s, i) => (
                <div key={i} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-green-600">{s.change}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-indigo-50 p-3 dark:bg-indigo-900/20">
              <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">🤖 Key Insight</p>
              <p className="text-sm text-indigo-600 dark:text-indigo-400">Team coaching volume increased 33% this week. Objection handling remains the biggest skill gap across all teams (avg 65%). Consider a dedicated workshop next week.</p>
            </div>
          </div>
        </div>
      )}

      {tab === "monthly" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Monthly Report — June 2026</h3>
            <div className="flex gap-2">
              <button className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">Download PDF</button>
              <button className="rounded-lg text-white bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:from-purple-500 hover:to-indigo-500">Regenerate</button>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Total Sessions", value: "186", change: "+42" },
                { label: "Avg Improvement", value: "+14.2%", change: "+3.2%" },
                { label: "Coaching ROI", value: "312%", change: "+48%" },
                { label: "Certifications Earned", value: "12", change: "+5" },
              ].map((s, i) => (
                <div key={i} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-green-600">{s.change}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Schedule List */}
      <div className="rounded-2xl glass-subtle transition-all duration-300">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-white">Scheduled Reports</h3>
        </div>
        <div className="divide-y divide-white/5">
          {schedules.map((s, i) => (
            <div key={i} className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-white/[0.02]">
              <div>
                <p className="text-sm font-medium text-white">{s.name}</p>
                <p className="text-xs text-gray-500">{s.recipients} · {s.time} · {s.format}</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" defaultChecked={s.enabled} className="peer sr-only" />
                <div className="h-5 w-9 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:text-white bg-gradient-to-r from-purple-600 to-indigo-600 peer-checked:after:translate-x-full" />
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule Modal */}
      {showSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowSchedule(false)}>
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold text-white">Schedule Report</h3><button onClick={() => setShowSchedule(false)} className="text-2xl text-gray-400 hover:text-gray-600">&times;</button></div>
            <div className="space-y-4">
              <div><label className="mb-1.5 block text-sm font-medium text-gray-300">Report Type</label><select className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"><option>Daily Briefing</option><option>Weekly Report</option><option>Monthly Report</option></select></div>
              <div><label className="mb-1.5 block text-sm font-medium text-gray-300">Recipients</label><input type="text" placeholder="email@company.com" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" /></div>
              <div><label className="mb-1.5 block text-sm font-medium text-gray-300">Time</label><input type="time" defaultValue="09:00" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" /></div>
              <div><label className="mb-1.5 block text-sm font-medium text-gray-300">Format</label><select className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"><option>Email Only</option><option>Email + PDF</option><option>Email + Dashboard</option><option>All</option></select></div>
              <button className="w-full rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 py-2.5 text-sm font-medium text-white hover:from-purple-500 hover:to-indigo-500">Schedule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}