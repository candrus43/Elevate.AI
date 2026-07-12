import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/advanced-coaching/plan/")({
  component: CoachingPlanDetail,
});

function CoachingPlanDetail() {
  const navigate = useNavigate();
  const params = useParams({ from: "/dashboard/advanced-coaching/plan/$planId" });
  const planId = params.planId;
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      setLoading(false);
    });
  }, [navigate]);

  if (loading) return <div className="flex items-center justify-center h-48"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" /></div>;

  const milestones = [
    { name: "Assessment Complete", done: true, date: "Jun 15" },
    { name: "Foundational Training", done: true, date: "Jun 22" },
    { name: "Role-play Practice", done: true, date: "Jul 1" },
    { name: "Shadow Calls (5)", done: false, date: "Jul 10" },
    { name: "Live Application", done: false, date: "Jul 20" },
    { name: "Final Assessment", done: false, date: "Jul 30" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate({ to: "/dashboard/advanced-coaching" })} className="text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&larr;</button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Coaching Plan</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Plan ID: {planId}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {/* Plan Info */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-lg font-bold text-white">EW</div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Emily Watson</p>
                  <p className="text-sm text-gray-500">Discovery Call Mastery</p>
                </div>
              </div>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/50 dark:text-green-300">On Track</span>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div><p className="text-xs text-gray-500">Progress</p><p className="text-lg font-bold text-gray-900 dark:text-white">80%</p></div>
              <div><p className="text-xs text-gray-500">Current Score</p><p className="text-lg font-bold text-green-600">82%</p></div>
              <div><p className="text-xs text-gray-500">Sessions</p><p className="text-lg font-bold text-gray-900 dark:text-white">8</p></div>
              <div><p className="text-xs text-gray-500">Target Score</p><p className="text-lg font-bold text-gray-900 dark:text-white">90%</p></div>
            </div>
            <div className="mt-4 h-2 rounded-full bg-gray-200 dark:bg-gray-700">
              <div className="h-2 rounded-full bg-green-500" style={{ width: "80%" }} />
            </div>
          </div>

          {/* Milestones */}
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Milestones</h3>
            </div>
            <div className="p-6">
              <div className="relative">
                {milestones.map((m, i) => (
                  <div key={i} className="flex items-start gap-4 pb-6 last:pb-0">
                    {i < milestones.length - 1 && <div className={`absolute left-4 top-10 h-full w-0.5 ${m.done ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`} />}
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      m.done ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                    }`}>
                      {m.done ? "✓" : i + 1}
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-center justify-between">
                        <p className={`font-medium ${m.done ? "text-green-700 dark:text-green-300" : "text-gray-900 dark:text-white"}`}>{m.name}</p>
                        <span className="text-xs text-gray-500">{m.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Skills */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Target Skills</h3>
            <div className="space-y-3">
              {[
                { name: "Discovery Questions", score: 85, target: 90 },
                { name: "Active Listening", score: 72, target: 85 },
                { name: "Needs Analysis", score: 78, target: 88 },
                { name: "Objection Handling", score: 65, target: 80 },
              ].map((s, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 dark:text-gray-400">{s.name}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{s.score}% / {s.target}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
                    <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${(s.score / s.target) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Actions</h3>
            <div className="space-y-2">
              <button className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500">Schedule Session</button>
              <button className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">View Progress</button>
              <button className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Generate Report</button>
            </div>
          </div>

          {/* Next Recommendation */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-900/20">
            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">💡 AI Recommendation</h3>
            <p className="text-xs text-amber-700 dark:text-amber-400">Emily needs to focus on objection handling. Recommend 3 role-play sessions before live application.</p>
            <div className="mt-2 flex items-center gap-1">
              <span className="text-xs text-amber-600 dark:text-amber-400">92% confidence</span>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}