import { useEffect, useState } from "react";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassBadge, GlassButton, GlassInput, GlassSelect, GlassStatCard, LoadingSkeleton, EmptyState } from "~/components/GlassCard";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/academy/analytics")({
  component: LearningAnalytics,
});

function LearningAnalytics() {
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

  const overview = [
    { label: "Avg Completion Rate", value: "72%", change: "+8%", color: "from-emerald-500 to-green-600" },
    { label: "Avg Quiz Score", value: "84%", change: "+5%", color: "from-indigo-500 to-purple-600" },
    { label: "Active Learners", value: "142", change: "+12", color: "from-cyan-500 to-blue-600" },
    { label: "Total Content Items", value: "48", change: "+6", color: "from-amber-500 to-orange-600" },
  ];

  const popular = [
    { title: "Enterprise Sales Mastery", completions: 32, type: "Course" },
    { title: "Product Knowledge: ElevateAI", completions: 28, type: "Course" },
    { title: "Objection Handling Scenarios", completions: 24, type: "Quiz" },
    { title: "Cold Calling Script", completions: 22, type: "Content" },
    { title: "ElevateAI Product Demo", completions: 20, type: "Video" },
  ];

  const skillGaps = [
    { skill: "Objection Handling", score: 58, gap: "High" },
    { skill: "Closing Techniques", score: 65, gap: "Medium" },
    { skill: "Discovery Questions", score: 72, gap: "Low" },
    { skill: "Product Knowledge", score: 85, gap: "None" },
    { skill: "Compliance", score: 88, gap: "None" },
  ];

  const teams = [
    { name: "Enterprise Sales", completion: 88, score: 86 },
    { name: "SMB Sales", completion: 82, score: 79 },
    { name: "Customer Success", completion: 75, score: 74 },
    { name: "Inside Sales", completion: 68, score: 68 },
    { name: "Account Executives", completion: 62, score: 62 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/academy" className="text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&larr;</Link>
        <div><h1 className="text-2xl font-bold text-white">Learning Analytics</h1><p className="text-sm text-gray-400">Insights into learning engagement and outcomes</p></div>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {overview.map((o, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <p className="text-sm text-gray-400">{o.label}</p>
            <p className={`bg-gradient-to-r ${o.color} bg-clip-text text-2xl font-bold text-transparent`}>{o.value}</p>
            <p className="text-xs text-green-600 mt-0.5">{o.change} vs last month</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Most Popular Content */}
        <div className="rounded-2xl glass-subtle transition-all duration-300">
          <div className="border-b border-gray-200 px-5 py-3 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-white">Most Popular Content</h3>
          </div>
          <div className="divide-y divide-white/5">
            {popular.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-5">#{i+1}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      item.type === "Course" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300" :
                      item.type === "Quiz" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" :
                      item.type === "Video" ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" :
                      "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
                    }`}>{item.type}</span>
                  </div>
                </div>
                <span className="text-sm font-semibold text-white">{item.completions}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Skill Gap Analysis */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="text-sm font-semibold text-white mb-3">Skill Gap Analysis</h3>
          <div className="space-y-4">
            {skillGaps.map((skill, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">{skill.skill}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-300">{skill.score}%</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      skill.gap === "High" ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" :
                      skill.gap === "Medium" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" :
                      skill.gap === "Low" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" :
                      "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                    }`}>{skill.gap} Gap</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-white/[0.06]">
                  <div className={`h-2 rounded-full ${
                    skill.gap === "High" ? "bg-red-500" : skill.gap === "Medium" ? "bg-amber-500" : skill.gap === "Low" ? "bg-blue-500" : "bg-green-500"
                  }`} style={{ width: `${skill.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Comparison */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="text-sm font-semibold text-white mb-4">Team Comparison</h3>
        <div className="space-y-3">
          {teams.map((t, i) => (
            <div key={i} className="flex items-center gap-4">
              <span className="w-36 text-xs font-medium text-white">{t.name}</span>
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-1">
                  <div className="flex-1 h-2 rounded-full bg-white/[0.06]">
                    <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${t.completion}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-500 w-16 text-right">Completion: {t.completion}%</span>
                  <span className={`text-xs font-bold ${t.score >= 75 ? "text-green-600" : "text-amber-600"}`}>{t.score}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}