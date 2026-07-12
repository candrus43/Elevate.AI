import { useEffect, useState } from "react";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassBadge, GlassButton, GlassInput, GlassSelect, GlassStatCard, LoadingSkeleton, EmptyState } from "~/components/GlassCard";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/ai-assistant/rep/")({
  component: RepDetail,
});

function RepDetail() {
  const navigate = useNavigate();
  const params = useParams({ from: "/dashboard/ai-assistant/rep/$repId" });
  const repId = params.repId;
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      setLoading(false);
    });
  }, [navigate]);

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  const repName = repId.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  const skills = [
    { name: "Discovery Questions", score: 82, trend: "up", change: "+5%" },
    { name: "Objection Handling", score: 65, trend: "down", change: "-8%" },
    { name: "Closing", score: 71, trend: "up", change: "+3%" },
    { name: "Product Knowledge", score: 88, trend: "up", change: "+2%" },
    { name: "Compliance", score: 95, trend: "up", change: "+1%" },
    { name: "Talk/Listen Ratio", score: 58, trend: "down", change: "-12%" },
  ];

  const recommendations = [
    { action: "Practice objection handling scenarios", type: "practice", priority: "high", reason: "Score dropped 8% this month" },
    { action: "Focus on listening skills", type: "coaching", priority: "high", reason: "Talk ratio is 68% vs target 50%" },
    { action: "Review discovery call framework", type: "review", priority: "medium", reason: "Room for improvement in qualification" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate({ to: "/dashboard/ai-assistant" })} className="text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&larr;</button>
        <div>
          <h1 className="text-2xl font-bold text-white">{repName}</h1>
          <p className="text-sm text-gray-400">AI Manager Assistant · Rep Overview</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { label: "Overall Score", value: "76%", change: "+2%", icon: "📊" },
          { label: "Calls This Month", value: "42", change: "+8", icon: "🎧" },
          { label: "Coaching Sessions", value: "6", change: "+2", icon: "🎯" },
          { label: "Improvement Rate", value: "82%", change: "+5%", icon: "📈" },
        ].map((stat, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-1">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-xs text-green-600 font-medium">{stat.change}</span>
            </div>
            <p className="text-xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl glass-subtle transition-all duration-300">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700"><h3 className="text-lg font-semibold text-white">Skill Assessment</h3></div>
          <div className="divide-y divide-white/5">
            {skills.map((s, i) => (
              <div key={i} className="px-6 py-3.5 transition-colors hover:bg-white/[0.02]">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{s.name}</span>
                    <span className={`text-xs ${s.trend === "up" ? "text-green-600" : "text-red-600"}`}>{s.trend === "up" ? "↑" : "↓"} {s.change}</span>
                  </div>
                  <span className={`text-sm font-bold ${s.score >= 80 ? "text-green-600" : s.score >= 60 ? "text-amber-600" : "text-red-600"}`}>{s.score}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.06]">
                  <div className={`h-1.5 rounded-full ${s.score >= 80 ? "bg-green-500" : s.score >= 60 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${s.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl glass-subtle transition-all duration-300">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700"><h3 className="text-lg font-semibold text-white">AI Recommendations</h3></div>
            <div className="divide-y divide-white/5">
              {recommendations.map((r, i) => (
                <div key={i} className="px-6 py-4 transition-colors hover:bg-white/[0.02]">
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 text-lg ${r.priority === "high" ? "text-amber-500" : "text-blue-500"}`}>{r.type === "practice" ? "🎯" : r.type === "coaching" ? "💡" : "📋"}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">{r.action}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${r.priority === "high" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" : "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"}`}>{r.priority}</span>
                      </div>
                      <p className="text-sm text-gray-500">{r.reason}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="text-sm font-semibold text-white mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <button className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Schedule 1:1</button>
              <button className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Create Plan</button>
              <button className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Review Calls</button>
              <button className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Send Feedback</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}