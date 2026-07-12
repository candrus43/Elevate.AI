import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/advanced-coaching/skill-gap")({
  component: SkillGapAnalysis,
});

function SkillGapAnalysis() {
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

  const skillCategories = [
    {
      category: "Discovery", avgScore: 72, gap: "Medium",
      skills: [
        { name: "Questioning Technique", repAvg: 68, benchmark: 85, gap: 17 },
        { name: "Needs Identification", repAvg: 75, benchmark: 88, gap: 13 },
        { name: "Active Listening", repAvg: 70, benchmark: 82, gap: 12 },
        { name: "Pain Point Discovery", repAvg: 78, benchmark: 86, gap: 8 },
      ],
    },
    {
      category: "Objection Handling", avgScore: 61, gap: "High",
      skills: [
        { name: "Common Objections", repAvg: 58, benchmark: 80, gap: 22 },
        { name: "ROI Articulation", repAvg: 62, benchmark: 78, gap: 16 },
        { name: "Competitive Response", repAvg: 65, benchmark: 82, gap: 17 },
        { name: "Price Pushback", repAvg: 55, benchmark: 75, gap: 20 },
      ],
    },
    {
      category: "Closing", avgScore: 68, gap: "Medium",
      skills: [
        { name: "Trial Closes", repAvg: 72, benchmark: 85, gap: 13 },
        { name: "Commitment Asking", repAvg: 65, benchmark: 82, gap: 17 },
        { name: "Next Step Setting", repAvg: 70, benchmark: 80, gap: 10 },
        { name: "Urgency Creation", repAvg: 62, benchmark: 78, gap: 16 },
      ],
    },
    {
      category: "Compliance", avgScore: 88, gap: "Low",
      skills: [
        { name: "Script Adherence", repAvg: 85, benchmark: 90, gap: 5 },
        { name: "Disclosure Statements", repAvg: 90, benchmark: 95, gap: 5 },
        { name: "Data Privacy", repAvg: 92, benchmark: 95, gap: 3 },
        { name: "Call Recording Consent", repAvg: 88, benchmark: 92, gap: 4 },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate({ to: "/dashboard/advanced-coaching" })} className="text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&larr;</button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Skill Gap Analysis</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">AI-identified skill gaps across your team</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { label: "High Priority Gaps", value: "3", icon: "🔴", desc: "Need immediate attention" },
          { label: "Medium Priority", value: "5", icon: "🟡", desc: "Scheduled for next cycle" },
          { label: "Low Priority", value: "4", icon: "🟢", desc: "On track or minor" },
          { label: "Gaps Resolved", value: "2", icon: "✅", desc: "This month" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xl">{s.icon}</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {skillCategories.map((cat, ci) => (
          <div key={ci} className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{cat.category}</h3>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  cat.gap === "High" ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" :
                  cat.gap === "Medium" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" :
                  "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                }`}>{cat.gap} Gap</span>
              </div>
              <span className="text-sm font-medium">Avg: {cat.avgScore}%</span>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {cat.skills.map((skill, si) => (
                <div key={si} className="px-6 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{skill.name}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-gray-500">Team: <strong className="text-gray-900 dark:text-white">{skill.repAvg}%</strong></span>
                      <span className="text-gray-500">Target: <strong>{skill.benchmark}%</strong></span>
                      <span className={`font-semibold ${
                        skill.gap >= 15 ? "text-red-600" : skill.gap >= 10 ? "text-amber-600" : "text-green-600"
                      }`}>Gap: {skill.gap}pts</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                      <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${skill.repAvg}%` }} />
                    </div>
                    <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                      <div className="h-2 rounded-full bg-gray-400" style={{ width: `${skill.benchmark}%` }} />
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                    <span>Current</span>
                    <span>Target</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}