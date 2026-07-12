import { useEffect, useState } from "react";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassBadge, GlassButton, GlassInput, GlassSelect, GlassStatCard, LoadingSkeleton, EmptyState } from "~/components/GlassCard";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/advanced-analytics/ai-impact")({
  component: AIImpact,
});

function AIImpact() {
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

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  const summary = [
    { label: "AI-Coached Reps", value: "18", change: "+6", color: "from-indigo-500 to-purple-600" },
    { label: "Avg Improvement", value: "+22%", change: "+8%", color: "from-emerald-500 to-green-600" },
    { label: "Non-AI-Coached Avg", value: "+8%", change: "+2%", color: "from-amber-500 to-orange-600" },
    { label: "AI Impact Multiplier", value: "2.75x", change: "+0.5x", color: "from-cyan-500 to-blue-600" },
  ];

  const attribution = [
    { factor: "AI Live Coaching", percent: 35, color: "bg-indigo-500" },
    { factor: "AI Roleplay", percent: 25, color: "bg-purple-500" },
    { factor: "Manager Coaching", percent: 20, color: "bg-emerald-500" },
    { factor: "Self-Study", percent: 12, color: "bg-amber-500" },
    { factor: "Peer Learning", percent: 8, color: "bg-cyan-500" },
  ];

  const comparison = [
    { skill: "Discovery", aiCoached: 84, nonAi: 68 },
    { skill: "Objection Handling", aiCoached: 72, nonAi: 55 },
    { skill: "Closing", aiCoached: 76, nonAi: 60 },
    { skill: "Product Knowledge", aiCoached: 91, nonAi: 78 },
    { skill: "Active Listening", aiCoached: 80, nonAi: 65 },
    { skill: "Compliance", aiCoached: 94, nonAi: 88 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/advanced-analytics" className="text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&larr;</Link>
        <div><h1 className="text-2xl font-bold text-white">AI Coaching Impact</h1><p className="text-sm text-gray-400">Measure the impact of AI-powered coaching</p></div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summary.map((s, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <p className="text-sm text-gray-400">{s.label}</p>
            <p className={`bg-gradient-to-r ${s.color} bg-clip-text text-2xl font-bold text-transparent`}>{s.value}</p>
            <p className="text-xs text-green-600">{s.change} vs last period</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Improvement Attribution */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="text-lg font-semibold text-white mb-4">Improvement Attribution</h3>
          <div className="space-y-3">
            {attribution.map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-300">{item.factor}</span>
                  <span className="text-sm font-bold text-white">{item.percent}%</span>
                </div>
                <div className="h-3 rounded-full bg-white/[0.06]">
                  <div className={`h-3 rounded-full ${item.color}`} style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Before/After Comparison */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="text-lg font-semibold text-white mb-4">AI-Coached vs Non-AI-Coached</h3>
          <div className="space-y-4">
            {comparison.map((c, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">{c.skill}</span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-red-500">{c.nonAi}%</span>
                    <span className="text-green-600">{c.aiCoached}%</span>
                  </div>
                </div>
                <div className="h-3 rounded-full bg-white/[0.06] relative overflow-hidden">
                  <div className="h-3 rounded-full bg-red-300" style={{ width: `${c.nonAi}%` }} />
                  <div className="absolute inset-0 h-3 rounded-full bg-gradient-to-r from-green-400 to-green-500" style={{ width: `${c.aiCoached}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-3">
            <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-red-300" /> Non-AI Coached</span>
            <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-green-500" /> AI Coached</span>
          </div>
        </div>
      </div>
    </div>
  );
}