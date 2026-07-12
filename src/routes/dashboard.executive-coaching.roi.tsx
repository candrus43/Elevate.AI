import { useEffect, useState } from "react";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassBadge, GlassButton, GlassInput, GlassSelect, GlassStatCard, LoadingSkeleton, EmptyState } from "~/components/GlassCard";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/executive-coaching/roi")({
  component: CoachingROI,
});

function CoachingROI() {
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

  const roiSummary = [
    { label: "Total Investment", value: "$48,250", icon: "💰", color: "from-rose-500 to-pink-600" },
    { label: "Avg Score Improvement", value: "+14.2%", icon: "📈", color: "from-emerald-500 to-green-600" },
    { label: "Overall ROI Ratio", value: "312%", icon: "📊", color: "from-violet-500 to-purple-600" },
    { label: "Cost Per Point", value: "$3.40", icon: "💎", color: "from-amber-500 to-orange-600" },
  ];

  const programs = [
    { name: "Discovery Training Program", investment: 12500, improvement: 18.2, costPerPoint: 2.10, roi: 425, sessions: 120 },
    { name: "Objection Handling Workshop", investment: 9800, improvement: 22.5, costPerPoint: 1.75, roi: 510, sessions: 85 },
    { name: "Closing Techniques Course", investment: 8750, improvement: 15.8, costPerPoint: 2.40, roi: 380, sessions: 95 },
    { name: "Product Knowledge Immersion", investment: 6500, improvement: 12.4, costPerPoint: 3.10, roi: 290, sessions: 60 },
    { name: "Compliance & Best Practices", investment: 4200, improvement: 8.5, costPerPoint: 4.60, roi: 195, sessions: 45 },
    { name: "Executive Communication", investment: 6500, improvement: 10.2, costPerPoint: 3.80, roi: 240, sessions: 55 },
  ];

  const scatterData = [
    { name: "Discovery", hours: 24, improvement: 18.2, cost: 12500 },
    { name: "Objection", hours: 32, improvement: 22.5, cost: 9800 },
    { name: "Closing", hours: 20, improvement: 15.8, cost: 8750 },
    { name: "Product", hours: 16, improvement: 12.4, cost: 6500 },
    { name: "Compliance", hours: 12, improvement: 8.5, cost: 4200 },
    { name: "Executive", hours: 18, improvement: 10.2, cost: 6500 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/executive-coaching" className="text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&larr;</Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Coaching ROI Analysis</h1>
          <p className="text-sm text-gray-400">Measure the return on coaching investments</p>
        </div>
      </div>

      {/* ROI Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {roiSummary.map((r, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <span className="text-lg mb-2 block">{r.icon}</span>
            <p className="text-sm text-gray-400">{r.label}</p>
            <p className={`bg-gradient-to-r ${r.color} bg-clip-text text-2xl font-bold text-transparent`}>{r.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Score Improvement vs Time Invested */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="text-lg font-semibold text-white mb-4">Score Improvement vs Time Invested</h3>
          <div className="h-56">
            <svg viewBox="0 0 400 180" className="w-full h-full">
              {/* Axes */}
              <line x1="40" y1="10" x2="40" y2="150" stroke="#d1d5db" strokeWidth="1" />
              <line x1="40" y1="150" x2="390" y2="150" stroke="#d1d5db" strokeWidth="1" />
              {/* Y-axis labels */}
              <text x="36" y="148" fontSize="8" fill="#9ca3af" textAnchor="end">0%</text>
              <text x="36" y="112" fontSize="8" fill="#9ca3af" textAnchor="end">10%</text>
              <text x="36" y="76" fontSize="8" fill="#9ca3af" textAnchor="end">20%</text>
              <text x="36" y="40" fontSize="8" fill="#9ca3af" textAnchor="end">30%</text>
              {/* X-axis labels */}
              <text x="40" y="164" fontSize="8" fill="#9ca3af" textAnchor="middle">0h</text>
              <text x="108" y="164" fontSize="8" fill="#9ca3af" textAnchor="middle">10h</text>
              <text x="176" y="164" fontSize="8" fill="#9ca3af" textAnchor="middle">20h</text>
              <text x="244" y="164" fontSize="8" fill="#9ca3af" textAnchor="middle">30h</text>
              <text x="312" y="164" fontSize="8" fill="#9ca3af" textAnchor="middle">40h</text>
              <text x="380" y="164" fontSize="8" fill="#9ca3af" textAnchor="middle">50h</text>
              {/* Data points */}
              {scatterData.map((d, i) => {
                const cx = 40 + (d.hours / 50) * 340;
                const cy = 150 - (d.improvement / 30) * 140;
                const sizes = [8, 10, 7, 6, 5, 6];
                return (
                  <g key={i}>
                    <circle cx={cx} cy={cy} r={sizes[i]} fill="#818cf8" opacity="0.7" className="hover:opacity-100" />
                    <text x={cx} y={cy - sizes[i] - 4} fontSize="8" fill="#6b7280" textAnchor="middle">{d.name}</text>
                  </g>
                );
              })}
            </svg>
          </div>
          <p className="text-xs text-gray-500 mt-2">Bubble size indicates total investment amount</p>
        </div>

        {/* Cost Per Improvement Point */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="text-lg font-semibold text-white mb-4">Cost Per Point</h3>
          <div className="space-y-4">
            {programs.sort((a, b) => a.costPerPoint - b.costPerPoint).slice(0, 5).map((p, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-300">{p.name}</span>
                  <span className="text-xs font-bold text-white">${p.costPerPoint.toFixed(2)}</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.06]">
                  <div className="h-2 rounded-full bg-gradient-to-r from-green-500 to-indigo-500" style={{ width: `${(1 - (p.costPerPoint - 1.5) / 4) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Per-Program ROI Comparison */}
      <div className="rounded-2xl glass-subtle transition-all duration-300">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-white">Per-Program ROI Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Program</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Investment</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Improvement</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Cost/Point</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">ROI</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {programs.sort((a, b) => b.roi - a.roi).map((p, i) => (
                <tr key={i} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-6 py-4 text-sm font-medium text-white">{p.name}</td>
                  <td className="px-4 py-4 text-right text-sm text-gray-300">${p.investment.toLocaleString()}</td>
                  <td className="px-4 py-4 text-right text-sm">
                    <span className="font-semibold text-green-600">+{p.improvement}%</span>
                  </td>
                  <td className="px-4 py-4 text-right text-sm text-gray-300">${p.costPerPoint.toFixed(2)}</td>
                  <td className="px-4 py-4 text-right text-sm">
                    <span className={`font-semibold ${p.roi >= 300 ? "text-green-600" : p.roi >= 200 ? "text-amber-600" : "text-orange-600"}`}>{p.roi}%</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="h-1.5 rounded-full bg-white/[0.06]" style={{ width: "80%" }}>
                      <div className={`h-1.5 rounded-full ${p.roi >= 300 ? "bg-green-500" : p.roi >= 200 ? "bg-amber-500" : "bg-orange-500"}`} style={{ width: `${Math.min(p.roi / 5, 100)}%` }} />
                    </div>
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