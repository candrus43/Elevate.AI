import { useEffect, useState } from "react";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassBadge, GlassButton, GlassInput, GlassSelect, GlassStatCard, LoadingSkeleton, EmptyState } from "~/components/GlassCard";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/advanced-analytics/forecasts")({
  component: Forecasting,
});

function Forecasting() {
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

  const projections = [
    { label: "1 Month", value: "78%", improvement: "+4%", color: "from-cyan-500 to-blue-600" },
    { label: "3 Months", value: "84%", improvement: "+10%", color: "from-indigo-500 to-purple-600" },
    { label: "6 Months", value: "90%", improvement: "+16%", color: "from-emerald-500 to-green-600" },
  ];

  const scenarios = [
    { name: "Current Trajectory", improvement: 14.2, confidence: 85 },
    { name: "Increased Coaching (+20%)", improvement: 18.5, confidence: 72 },
    { name: "AI Focus (Roleplay Focus)", improvement: 22.0, confidence: 65 },
    { name: "All-Hands Initiative", improvement: 26.0, confidence: 50 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/advanced-analytics" className="text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&larr;</Link>
        <div><h1 className="text-2xl font-bold text-white">Forecasting</h1><p className="text-sm text-gray-400">Projected coaching performance and growth</p></div>
      </div>

      {/* Projections */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {projections.map((p, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <p className="text-sm text-gray-400">{p.label} Projection</p>
            <p className={`bg-gradient-to-r ${p.color} bg-clip-text text-3xl font-bold text-transparent`}>{p.value}</p>
            <p className="text-xs text-green-600">{p.improvement} from current 74%</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Trajectory Chart */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="text-lg font-semibold text-white mb-4">Current Trajectory vs Target</h3>
          <div className="h-48">
            <svg viewBox="0 0 400 160" className="w-full h-full">
              {[0,1,2,3,4].map(i => <line key={i} x1="0" y1={32 + i*26} x2="400" y2={32 + i*26} stroke="#e5e7eb" strokeWidth="1" className="dark:stroke-gray-700" />)}
              {/* Target line */}
              <line x1="20" y1="52" x2="380" y2="52" stroke="#f59e0b" strokeWidth="2" strokeDasharray="8,4" />
              <text x="380" y="49" fontSize="10" fill="#f59e0b" textAnchor="end">Target 90%</text>
              {/* Projection line */}
              <polyline fill="none" stroke="#818cf8" strokeWidth="2.5" strokeDasharray="6,3" points="200,100 260,82 320,65 380,48" />
              <polyline fill="none" stroke="#22c55e" strokeWidth="3" points="20,130 80,118 140,105 200,92" />
              {/* Divider */}
              <line x1="200" y1="10" x2="200" y2="150" stroke="#d1d5db" strokeWidth="1" strokeDasharray="4,4" />
              <text x="200" y="158" fontSize="9" fill="#9ca3af" textAnchor="middle">Now</text>
              <text x="290" y="158" fontSize="9" fill="#9ca3af" textAnchor="middle">Projected</text>
              {["Jan","Feb","Mar","Apr","May","Jun","Jul"].map((m, i) => (
                <text key={i} x={20 + i*51} y="148" fontSize="8" fill="#9ca3af" textAnchor="middle">{m}</text>
              ))}
            </svg>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
            <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-green-500" /> Historical</span>
            <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-indigo-400" /> Projected</span>
            <span className="flex items-center gap-1"><span className="h-2 w-4 border-b-2 border-amber-400 border-dashed" /> Target</span>
          </div>
        </div>

        {/* Scenario Analysis */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="text-lg font-semibold text-white mb-4">Scenario Analysis (What-If)</h3>
          <div className="space-y-4">
            {scenarios.map((s, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">{s.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-green-600">+{s.improvement}%</span>
                    <span className="text-[10px] text-gray-400">{s.confidence}% conf</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-white/[0.06]">
                  <div className={`h-2 rounded-full ${
                    i === 0 ? "bg-gray-500" : i === 1 ? "bg-blue-500" : i === 2 ? "bg-indigo-500" : "bg-emerald-500"
                  }`} style={{ width: `${s.improvement * 3.5}%` }} />
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className={`h-1 w-${s.confidence >= 80 ? "3/4" : s.confidence >= 65 ? "1/2" : "1/4"} rounded-full ${s.confidence >= 80 ? "bg-green-400" : s.confidence >= 65 ? "bg-amber-400" : "bg-red-400"}`} />
                  <span className="text-[10px] text-gray-400">Confidence: {s.confidence}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confidence Intervals */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="text-lg font-semibold text-white mb-4">Forecast Confidence Intervals</h3>
        <div className="space-y-3">
          {[
            { period: "1 Month", range: "76% - 80%", width: "w-3/5" },
            { period: "3 Months", range: "80% - 88%", width: "w-4/5" },
            { period: "6 Months", range: "84% - 94%", width: "w-full" },
          ].map((ci, i) => (
            <div key={i} className="flex items-center gap-4">
              <span className="w-20 text-xs font-medium text-gray-300">{ci.period}</span>
              <div className="flex-1">
                <div className={`h-3 rounded-full bg-indigo-200 dark:bg-indigo-800 ${ci.width} relative`}>
                  <div className="absolute left-1/3 top-0 h-3 w-1/3 rounded-full bg-indigo-500" />
                  <div className="absolute left-0 top-0 h-full w-0.5 bg-indigo-700" />
                  <div className="absolute right-0 top-0 h-full w-0.5 bg-indigo-700" />
                </div>
              </div>
              <span className="w-24 text-xs text-right text-gray-400">{ci.range}</span>
            </div>
          ))}
          <p className="text-[10px] text-gray-400 mt-2">Darker band shows the most likely outcome range. Outer edges show 95% confidence interval.</p>
        </div>
      </div>
    </div>
  );
}