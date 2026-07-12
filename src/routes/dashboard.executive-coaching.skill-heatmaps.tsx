import { useEffect, useState } from "react";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassBadge, GlassButton, GlassInput, GlassSelect, GlassStatCard, LoadingSkeleton, EmptyState } from "~/components/GlassCard";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/executive-coaching/skill-heatmaps")({
  component: SkillHeatmaps,
});

function SkillHeatmaps() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState("all");
  const [selectedCell, setSelectedCell] = useState<{ team: string; skill: string; score: number } | null>(null);

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      setLoading(false);
    });
  }, [navigate]);

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  const teams = ["Enterprise Sales", "SMB Sales", "Customer Success", "Inside Sales", "Account Executives"];
  const skills = ["Discovery", "Objection Handling", "Closing", "Product Knowledge", "Active Listening", "Compliance", "Rapport Building", "Value Prop"];

  const data: Record<string, Record<string, number>> = {
    "Enterprise Sales": { Discovery: 88, "Objection Handling": 82, Closing: 85, "Product Knowledge": 92, "Active Listening": 80, Compliance: 95, "Rapport Building": 84, "Value Prop": 90 },
    "SMB Sales": { Discovery: 82, "Objection Handling": 75, Closing: 78, "Product Knowledge": 85, "Active Listening": 72, Compliance: 88, "Rapport Building": 80, "Value Prop": 79 },
    "Customer Success": { Discovery: 78, "Objection Handling": 72, Closing: 68, "Product Knowledge": 80, "Active Listening": 85, Compliance: 92, "Rapport Building": 82, "Value Prop": 74 },
    "Inside Sales": { Discovery: 72, "Objection Handling": 62, Closing: 65, "Product Knowledge": 70, "Active Listening": 68, Compliance: 80, "Rapport Building": 74, "Value Prop": 66 },
    "Account Executives": { Discovery: 68, "Objection Handling": 58, Closing: 60, "Product Knowledge": 65, "Active Listening": 62, Compliance: 75, "Rapport Building": 70, "Value Prop": 61 },
  };

  const getColor = (score: number) => {
    if (score >= 85) return "bg-emerald-500 text-white";
    if (score >= 75) return "bg-emerald-300 text-emerald-900";
    if (score >= 65) return "bg-amber-300 text-amber-900";
    return "bg-red-400 text-white";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/executive-coaching" className="text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&larr;</Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Skill Heatmaps</h1>
          <p className="text-sm text-gray-400">Visualize skill strengths and gaps across teams</p>
        </div>
        <select value={department} onChange={(e) => setDepartment(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500/50">
          <option value="all">All Departments</option>
          <option value="sales">Sales</option>
          <option value="cs">Customer Success</option>
        </select>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-6 py-3 dark:border-gray-700 dark:bg-gray-900">
        <span className="text-xs font-medium text-gray-300">Legend:</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-6 rounded bg-emerald-500" /><span className="text-xs text-gray-500">Strong (85%+)</span></span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-6 rounded bg-emerald-300" /><span className="text-xs text-gray-500">Good (75-84%)</span></span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-6 rounded bg-amber-300" /><span className="text-xs text-gray-500">Needs Work (65-74%)</span></span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-6 rounded bg-red-400" /><span className="text-xs text-gray-500">Weak (&lt;65%)</span></span>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto rounded-2xl glass-subtle transition-all duration-300">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-48">Team</th>
              {skills.map(s => (
                <th key={s} className="px-3 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">{s}</th>
              ))}
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Avg</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {teams.map((team, i) => {
              const scores = skills.map(s => data[team][s]);
              const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
              return (
                <tr key={i} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-sm font-medium text-white">{team}</td>
                  {skills.map((skill, j) => {
                    const score = data[team][skill];
                    return (
                      <td key={j} className="px-2 py-1.5">
                        <button
                          onClick={() => setSelectedCell({ team, skill, score })}
                          className={`w-full rounded-lg py-2 text-center text-xs font-bold transition-all hover:scale-110 ${getColor(score)}`}
                        >
                          {score}
                        </button>
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      avg >= 85 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" :
                      avg >= 75 ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" :
                      avg >= 65 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" :
                      "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                    }`}>{avg}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Cell Detail Modal */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setSelectedCell(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Skill Detail</h3>
              <button onClick={() => setSelectedCell(null)} className="text-2xl text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Team</span>
                <span className="text-sm font-medium text-white">{selectedCell.team}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Skill</span>
                <span className="text-sm font-medium text-white">{selectedCell.skill}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Score</span>
                <span className={`text-lg font-bold ${selectedCell.score >= 75 ? "text-green-600" : selectedCell.score >= 65 ? "text-amber-600" : "text-red-600"}`}>{selectedCell.score}%</span>
              </div>
              <div className="h-3 rounded-full bg-white/[0.06]">
                <div className={`h-3 rounded-full ${selectedCell.score >= 75 ? "bg-green-500" : selectedCell.score >= 65 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${selectedCell.score}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {selectedCell.score >= 85 ? "🌟 Excellent strength — leverage as a benchmark for other teams"
                : selectedCell.score >= 75 ? "👍 Good performance — minor improvements needed"
                : selectedCell.score >= 65 ? "⚠️ Needs attention — consider targeted coaching"
                : "🔴 Critical gap — prioritize coaching intervention"}
              </p>
              <button
                onClick={() => setSelectedCell(null)}
                className="w-full rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 py-2 text-sm font-medium text-white hover:from-purple-500 hover:to-indigo-500 mt-2"
              >
                Schedule Coaching
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}