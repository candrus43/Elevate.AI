import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/advanced-coaching")({
  component: AdvancedCoaching,
});

function AdvancedCoaching() {
  const navigate = useNavigate();
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

  const plans = [
    { id: "p1", rep: "Emily Watson", type: "Discovery", progress: 80, status: "on-track", score: 82, sessions: 8, nextMilestone: "Objection Handling" },
    { id: "p2", rep: "James Kim", type: "Closing", progress: 45, status: "needs-attention", score: 65, sessions: 4, nextMilestone: "Role-play Practice" },
    { id: "p3", rep: "Lisa Rodriguez", type: "Objection Handling", progress: 30, status: "at-risk", score: 54, sessions: 2, nextMilestone: "Shadow Calls" },
    { id: "p4", rep: "Mike Chen", type: "Advanced Discovery", progress: 95, status: "on-track", score: 88, sessions: 12, nextMilestone: "Certification" },
    { id: "p5", rep: "Sarah Park", type: "Compliance", progress: 60, status: "on-track", score: 90, sessions: 6, nextMilestone: "Assessment" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Advanced AI Coaching</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Personalized coaching plans, skill gap analysis, and development tracking</p>
        </div>
        <a href="/dashboard/advanced-coaching/skill-gap" className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500">View Skill Gaps</a>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active Plans", value: "12", change: "+3 this week", icon: "📋", color: "from-indigo-500 to-purple-600" },
          { label: "Avg. Score", value: "76%", change: "+4% vs last month", icon: "📊", color: "from-emerald-500 to-green-600" },
          { label: "Skill Gaps Found", value: "8", change: "2 resolved", icon: "🔍", color: "from-amber-500 to-orange-600" },
          { label: "Completion Rate", value: "82%", change: "+6% improvement", icon: "✅", color: "from-blue-500 to-cyan-600" },
        ].map((kpi, i) => (
          <div key={i} className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-lg dark:border-gray-700 dark:bg-gray-900">
            <div className={`absolute right-0 top-0 h-20 w-20 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br ${kpi.color} opacity-10 blur-2xl`} />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{kpi.icon}</span>
                <span className="text-xs font-medium text-green-600">{kpi.change}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpi.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Coaching Plans Overview */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Coaching Plans</h3>
          <a href="/dashboard/advanced-coaching/practice" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">Practice Assignments →</a>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {plans.map((plan) => (
            <div key={plan.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white">
                    {plan.rep.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <a href={`/dashboard/advanced-coaching/plan/${plan.id}`} className="font-medium text-gray-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400">{plan.rep}</a>
                    <p className="text-sm text-gray-500">{plan.type} · {plan.sessions} sessions</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                    plan.status === "on-track" ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" :
                    plan.status === "needs-attention" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" :
                    "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                  }`}>
                    {plan.status.replace("-", " ")}
                  </span>
                  <span className={`text-lg font-bold ${plan.score >= 80 ? "text-green-600" : plan.score >= 60 ? "text-amber-600" : "text-red-600"}`}>{plan.score}%</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-medium text-gray-900 dark:text-white">{plan.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                    <div className={`h-2 rounded-full transition-all duration-500 ${
                      plan.progress >= 80 ? "bg-green-500" : plan.progress >= 40 ? "bg-amber-500" : "bg-red-500"
                    }`} style={{ width: `${plan.progress}%` }} />
                  </div>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">Next: {plan.nextMilestone}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <a href="/dashboard/advanced-coaching/skill-gap" className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-indigo-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-indigo-600">
          <span className="text-2xl block mb-2">🔍</span>
          <p className="font-medium text-gray-900 dark:text-white">Skill Gap Analysis</p>
          <p className="text-sm text-gray-500">Identify strengths & weaknesses</p>
        </a>
        <a href="/dashboard/advanced-coaching/practice" className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-indigo-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-indigo-600">
          <span className="text-2xl block mb-2">🎯</span>
          <p className="font-medium text-gray-900 dark:text-white">Practice Assignments</p>
          <p className="text-sm text-gray-500">AI-generated practice tasks</p>
        </a>
        <a href="/dashboard/advanced-coaching/development" className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-indigo-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-indigo-600">
          <span className="text-2xl block mb-2">📈</span>
          <p className="font-medium text-gray-900 dark:text-white">Development Plans</p>
          <p className="text-sm text-gray-500">Individual growth roadmaps</p>
        </a>
      </div>
    </div>
  );
}