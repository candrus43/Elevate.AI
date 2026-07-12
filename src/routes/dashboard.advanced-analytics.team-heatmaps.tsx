import { useEffect, useState } from "react";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassBadge, GlassButton, GlassInput, GlassSelect, GlassStatCard, LoadingSkeleton, EmptyState } from "~/components/GlassCard";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/advanced-analytics/team-heatmaps")({
  component: TeamHeatmaps,
});

function TeamHeatmaps() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState("all");
  const [selectedCell, setSelectedCell] = useState<{ team: string; metric: string; value: number } | null>(null);

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      setLoading(false);
    });
  }, [navigate]);

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  const teams = ["Enterprise Sales", "SMB Sales", "Customer Success", "Inside Sales", "Account Executives"];
  const metrics = ["Effectiveness", "Completion", "Improvement", "Score"];

  const data: Record<string, Record<string, number>> = {
    "Enterprise Sales": { Effectiveness: 92, Completion: 88, Improvement: 18, Score: 86 },
    "SMB Sales": { Effectiveness: 85, Completion: 82, Improvement: 14, Score: 79 },
    "Customer Success": { Effectiveness: 78, Completion: 75, Improvement: 11, Score: 74 },
    "Inside Sales": { Effectiveness: 72, Completion: 68, Improvement: 8, Score: 68 },
    "Account Executives": { Effectiveness: 65, Completion: 62, Improvement: 5, Score: 62 },
  };

  const getColor = (value: number, metric: string) => {
    if (metric === "Improvement") {
      if (value >= 15) return "bg-emerald-500 text-white";
      if (value >= 10) return "bg-emerald-300 text-emerald-900";
      if (value >= 7) return "bg-amber-300 text-amber-900";
      return "bg-red-400 text-white";
    }
    if (value >= 85) return "bg-emerald-500 text-white";
    if (value >= 75) return "bg-emerald-300 text-emerald-900";
    if (value >= 65) return "bg-amber-300 text-amber-900";
    return "bg-red-400 text-white";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/advanced-analytics" className="text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&larr;</Link>
        <div className="flex-1"><h1 className="text-2xl font-bold text-white">Team Heatmaps</h1><p className="text-sm text-gray-400">Visualize team performance across metrics</p></div>
        <select value={department} onChange={(e) => setDepartment(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500/50">
          <option value="all">All Departments</option>
          <option value="sales">Sales</option>
          <option value="cs">Customer Success</option>
        </select>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-6 py-3 dark:border-gray-700 dark:bg-gray-900">
        <span className="text-xs font-medium text-gray-300">Legend:</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-6 rounded bg-emerald-500" /><span className="text-xs text-gray-500">Strong</span></span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-6 rounded bg-emerald-300" /><span className="text-xs text-gray-500">Good</span></span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-6 rounded bg-amber-300" /><span className="text-xs text-gray-500">Needs Work</span></span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-6 rounded bg-red-400" /><span className="text-xs text-gray-500">Weak</span></span>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto rounded-2xl glass-subtle transition-all duration-300">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Team</th>
              {metrics.map(m => <th key={m} className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">{m}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {teams.map((team, i) => (
              <tr key={i} className="transition-colors hover:bg-white/[0.02]">
                <td className="px-6 py-3 text-sm font-medium text-white">{team}</td>
                {metrics.map((metric, j) => {
                  const value = data[team][metric];
                  return (
                    <td key={j} className="px-2 py-1.5">
                      <button onClick={() => setSelectedCell({ team, metric, value })} className={`w-full rounded-lg py-2 text-center text-xs font-bold transition-all hover:scale-110 ${getColor(value, metric)}`}>
                        {metric === "Improvement" ? `+${value}` : `${value}${metric !== "Score" ? "%" : ""}`}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cell Detail Modal */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setSelectedCell(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Metric Detail</h3>
              <button onClick={() => setSelectedCell(null)} className="text-2xl text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between"><span className="text-sm text-gray-500">Team</span><span className="text-sm font-medium text-white">{selectedCell.team}</span></div>
              <div className="flex items-center justify-between"><span className="text-sm text-gray-500">Metric</span><span className="text-sm font-medium text-white">{selectedCell.metric}</span></div>
              <div className="flex items-center justify-between"><span className="text-sm text-gray-500">Value</span><span className={`text-lg font-bold ${selectedCell.value >= 75 ? "text-green-600" : selectedCell.value >= 65 ? "text-amber-600" : "text-red-600"}`}>{selectedCell.metric === "Improvement" ? `+${selectedCell.value}` : `${selectedCell.value}`}</span></div>
              <div className="h-3 rounded-full bg-white/[0.06]">
                <div className={`h-3 rounded-full ${selectedCell.value >= 75 ? "bg-green-500" : selectedCell.value >= 65 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${selectedCell.metric === "Improvement" ? Math.min(selectedCell.value * 5, 100) : selectedCell.value}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}