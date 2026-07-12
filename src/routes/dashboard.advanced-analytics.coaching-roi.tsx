import { useEffect, useState } from "react";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassBadge, GlassButton, GlassInput, GlassSelect, GlassStatCard, LoadingSkeleton, EmptyState } from "~/components/GlassCard";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/advanced-analytics/coaching-roi")({
  component: CoachingROIAnalytics,
});

function CoachingROIAnalytics() {
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
    { label: "Total Investment", value: "$48,250", icon: "💰", color: "from-rose-500 to-pink-600" },
    { label: "Score Improvement", value: "+14.2%", icon: "📈", color: "from-emerald-500 to-green-600" },
    { label: "Overall ROI", value: "312%", icon: "📊", color: "from-violet-500 to-purple-600" },
    { label: "Cost Per Point", value: "$3.40", icon: "💎", color: "from-amber-500 to-orange-600" },
  ];

  const programs = [
    { name: "Objection Handling Workshop", investment: 9800, improvement: 22.5, cost: 1.75, roi: 510 },
    { name: "Discovery Training Program", investment: 12500, improvement: 18.2, cost: 2.10, roi: 425 },
    { name: "Closing Techniques Course", investment: 8750, improvement: 15.8, cost: 2.40, roi: 380 },
    { name: "Product Knowledge Immersion", investment: 6500, improvement: 12.4, cost: 3.10, roi: 290 },
    { name: "Executive Communication", investment: 6500, improvement: 10.2, cost: 3.80, roi: 240 },
    { name: "Compliance & Best Practices", investment: 4200, improvement: 8.5, cost: 4.60, roi: 195 },
  ];

  const managers = [
    { name: "Sarah Mitchell", investment: 12500, improvement: 18.2, roi: 425 },
    { name: "David Chen", investment: 9800, improvement: 15.4, roi: 380 },
    { name: "Jessica Park", investment: 7500, improvement: 12.8, roi: 310 },
    { name: "Michael Torres", investment: 6200, improvement: 9.5, roi: 240 },
    { name: "Rachel Kim", investment: 4800, improvement: 7.2, roi: 185 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/advanced-analytics" className="text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&larr;</Link>
        <div><h1 className="text-2xl font-bold text-white">Coaching ROI Analysis</h1><p className="text-sm text-gray-400">Detailed return on coaching investments</p></div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summary.map((s, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <span className="text-lg block mb-2">{s.icon}</span>
            <p className="text-sm text-gray-400">{s.label}</p>
            <p className={`bg-gradient-to-r ${s.color} bg-clip-text text-2xl font-bold text-transparent`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Per-Program ROI */}
        <div className="rounded-2xl glass-subtle transition-all duration-300">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-white">Per-Program ROI</h3>
          </div>
          <div className="divide-y divide-white/5">
            {programs.map((p, i) => (
              <div key={i} className="px-6 py-3 transition-colors hover:bg-white/[0.02]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">{p.name}</span>
                  <span className={`text-sm font-bold ${p.roi >= 300 ? "text-green-600" : p.roi >= 200 ? "text-amber-600" : "text-red-600"}`}>{p.roi}%</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-1">
                  <span>${p.investment.toLocaleString()}</span>
                  <span>+{p.improvement}% improvement</span>
                  <span>${p.cost.toFixed(2)}/pt</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.06]">
                  <div className={`h-1.5 rounded-full ${p.roi >= 300 ? "bg-green-500" : p.roi >= 200 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${Math.min(p.roi / 6, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Per-Manager ROI */}
        <div className="rounded-2xl glass-subtle transition-all duration-300">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-white">Per-Manager ROI Rankings</h3>
          </div>
          <div className="divide-y divide-white/5">
            {managers.map((m, i) => (
              <div key={i} className="px-6 py-3 transition-colors hover:bg-white/[0.02]">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>{i+1}</span>
                    <span className="text-sm font-medium text-white">{m.name}</span>
                  </div>
                  <span className="text-sm font-bold text-indigo-600">{m.roi}%</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 ml-8">
                  <span>Invested: ${m.investment.toLocaleString()}</span>
                  <span className="text-green-600">+{m.improvement}%</span>
                </div>
                <div className="ml-8 mt-1 h-1.5 rounded-full bg-white/[0.06]">
                  <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${Math.min(m.roi / 5, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cost Per Point Table */}
      <div className="rounded-2xl glass-subtle transition-all duration-300">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-white">Cost Per Improvement Point</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Program</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Investment</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Improvement</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Cost/Point</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Efficiency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {programs.map((p, i) => (
                <tr key={i} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-6 py-4 text-sm font-medium text-white">{p.name}</td>
                  <td className="px-4 py-4 text-right text-sm text-gray-300">${p.investment.toLocaleString()}</td>
                  <td className="px-4 py-4 text-right text-sm text-green-600 font-semibold">+{p.improvement}%</td>
                  <td className="px-4 py-4 text-right text-sm text-gray-300">${p.cost.toFixed(2)}</td>
                  <td className="px-4 py-4 text-right">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${p.cost < 2.5 ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" : p.cost < 4 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"}`}>
                      {p.cost < 2.5 ? "High" : p.cost < 4 ? "Medium" : "Low"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}