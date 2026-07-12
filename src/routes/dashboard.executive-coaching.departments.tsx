import { useEffect, useState } from "react";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassBadge, GlassButton, GlassInput, GlassSelect, GlassStatCard, LoadingSkeleton, EmptyState } from "~/components/GlassCard";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/executive-coaching/departments")({
  component: DepartmentComparisons,
});

function DepartmentComparisons() {
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

  const departments = [
    { name: "Enterprise Sales", effectiveness: 92, completion: 88, improvement: 18, reps: 24, score: 86, trend: "up" },
    { name: "SMB Sales", effectiveness: 85, completion: 82, improvement: 14, reps: 32, score: 79, trend: "up" },
    { name: "Customer Success", effectiveness: 78, completion: 75, improvement: 11, reps: 18, score: 74, trend: "stable" },
    { name: "Inside Sales", effectiveness: 72, completion: 68, improvement: 8, reps: 28, score: 68, trend: "up" },
    { name: "Account Executives", effectiveness: 65, completion: 62, improvement: 5, reps: 16, score: 62, trend: "stable" },
  ];

  const comparisonMetrics = ["Effectiveness", "Completion Rate", "Improvement", "Avg Score"];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/executive-coaching" className="text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&larr;</Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Department Comparisons</h1>
          <p className="text-sm text-gray-400">Side-by-side coaching metrics across departments</p>
        </div>
      </div>

      {/* Department Detail Cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {departments.map((dept, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center gap-2 mb-3">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${i === 0 ? "bg-emerald-500" : i === 1 ? "bg-blue-500" : i === 2 ? "bg-purple-500" : i === 3 ? "bg-amber-500" : "bg-gray-500"}`}>{dept.score}</span>
              <span className="text-sm font-medium text-white">{dept.name}</span>
              <span className={`ml-auto text-xs ${dept.trend === "up" ? "text-green-600" : "text-gray-400"}`}>{dept.trend === "up" ? "↗" : "→"}</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Effectiveness</span>
                <span className="font-semibold text-white">{dept.effectiveness}%</span>
              </div>
              <div className="h-1 rounded-full bg-white/[0.06]">
                <div className="h-1 rounded-full bg-emerald-500" style={{ width: `${dept.effectiveness}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Completion</span>
                <span className="font-semibold text-white">{dept.completion}%</span>
              </div>
              <div className="h-1 rounded-full bg-white/[0.06]">
                <div className="h-1 rounded-full bg-blue-500" style={{ width: `${dept.completion}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Improvement</span>
                <span className="font-semibold text-green-600">+{dept.improvement}%</span>
              </div>
              <p className="text-[10px] text-gray-400">{dept.reps} active reps</p>
            </div>
          </div>
        ))}
      </div>

      {/* Side-by-Side Comparison */}
      <div className="rounded-2xl glass-subtle transition-all duration-300">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-white">Side-by-Side Metrics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Department</th>
                {comparisonMetrics.map(m => (
                  <th key={m} className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">{m}</th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Rank</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {departments.map((dept, i) => (
                <tr key={i} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-6 py-4 text-sm font-medium text-white">{dept.name}</td>
                  <td className="px-4 py-4 text-right">
                    <span className={`font-semibold ${dept.effectiveness >= 85 ? "text-green-600" : dept.effectiveness >= 70 ? "text-amber-600" : "text-red-600"}`}>{dept.effectiveness}%</span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <div className="h-1.5 w-12 rounded-full bg-white/[0.06] inline-block">
                        <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${dept.completion}%` }} />
                      </div>
                      <span className="text-xs font-medium text-white">{dept.completion}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-semibold text-green-600">+{dept.improvement}%</td>
                  <td className="px-4 py-4 text-right">
                    <span className={`text-sm font-bold ${dept.score >= 80 ? "text-green-600" : dept.score >= 70 ? "text-amber-600" : "text-red-600"}`}>{dept.score}%</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      i === 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" :
                      i === 1 ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" :
                      "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500"
                    }`}>#{i+1}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Comparison Bars */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="text-lg font-semibold text-white mb-4">Metric Comparison Chart</h3>
        <div className="space-y-5">
          {comparisonMetrics.map((metric, i) => (
            <div key={i}>
              <p className="text-sm font-medium text-white mb-2">{metric}</p>
              <div className="space-y-1.5">
                {departments.map((dept, j) => {
                  const value = metric === "Effectiveness" ? dept.effectiveness : metric === "Completion Rate" ? dept.completion : metric === "Improvement" ? dept.improvement * 5 : dept.score;
                  const color = j === 0 ? "bg-emerald-500" : j === 1 ? "bg-blue-500" : j === 2 ? "bg-purple-500" : j === 3 ? "bg-amber-500" : "bg-gray-500";
                  const displayValue = metric === "Improvement" ? `+${dept.improvement}%` : `${metric === "Completion Rate" ? dept.completion : metric === "Effectiveness" ? dept.effectiveness : dept.score}%`;
                  return (
                    <div key={j} className="flex items-center gap-2">
                      <span className="w-28 text-xs text-gray-400 truncate">{dept.name}</span>
                      <div className="flex-1 h-3 rounded-full bg-white/[0.06]">
                        <div className={`h-3 rounded-full ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
                      </div>
                      <span className="w-12 text-right text-xs font-semibold text-white">{displayValue}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}