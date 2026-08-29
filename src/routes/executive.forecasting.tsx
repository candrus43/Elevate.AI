import { useState } from "react";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassStatCard, GlassBadge } from '~/components/GlassCard';
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/executive/forecasting")({
  component: Forecasting,
});

const allMonths = [
  { month: "2026-02", calls: 980, score: 68, projected: false },
  { month: "2026-03", calls: 1050, score: 71, projected: false },
  { month: "2026-04", calls: 1120, score: 73, projected: false },
  { month: "2026-05", calls: 1180, score: 75, projected: false },
  { month: "2026-06", calls: 1240, score: 78, projected: false },
  { month: "2026-07", calls: 1320, score: 80, projected: false },
  { month: "2026-08", calls: 1386, score: 82, projected: true },
  { month: "2026-09", calls: 1455, score: 84, projected: true },
  { month: "2026-10", calls: 1528, score: 86, projected: true },
  { month: "2026-11", calls: 1604, score: 88, projected: true },
  { month: "2026-12", calls: 1684, score: 90, projected: true },
  { month: "2027-01", calls: 1768, score: 91, projected: true },
];

const maxValue = Math.max(...allMonths.map(m => m.calls), 1);
const formatCurrency = (n: number) => {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n}`;
};

function Forecasting() {
  const [period, setPeriod] = useState("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const periods = [
    { value: "7d", label: "7 Days" },
    { value: "30d", label: "30 Days" },
    { value: "90d", label: "90 Days" },
    { value: "custom", label: "Custom" },
  ];

  const currentMonth = allMonths[5]; // July 2026
  const nextQuarter = allMonths.slice(6, 9).reduce((sum, m) => sum + m.calls, 0);
  const annualRunRate = allMonths.slice(6, 12).reduce((sum, m) => sum + m.calls, 0);

  const currentRevenue = currentMonth.calls * 50;
  const nextQuarterRevenue = nextQuarter * 50;
  const annualRevenue = annualRunRate * 50;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to="/executive" className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-panel-raised transition-colors">
          <svg className="h-5 w-5 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-ink">Forecasting</h1>
          <p className="text-sm text-ink-muted">Revenue projections and trend analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-edge bg-panel-raised p-1">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
                  period === p.value
                    ? "bg-accent-500/20 text-accent-300"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {period === "custom" && (
            <div className="flex items-center gap-2 rounded-xl border border-edge bg-panel-raised px-3 py-1.5">
              <span className="text-xs text-ink-muted">From</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-24 sm:w-32 rounded-lg border border-edge bg-panel-raised px-2 py-1 text-xs text-ink placeholder-ink-faint focus:border-accent-500/50 focus:outline-none"
              />
              <span className="text-xs text-ink-muted">To</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-24 sm:w-32 rounded-lg border border-edge bg-panel-raised px-2 py-1 text-xs text-ink placeholder-ink-faint focus:border-accent-500/50 focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <GlassStatCard label="Current Month (est.)" value={formatCurrency(currentRevenue)} change={`${currentMonth.calls} calls at avg ${currentMonth.score}%`} color="from-accent-500 to-accent-600" icon={<span>📈</span>} />
        <GlassStatCard label="Next Quarter" value={formatCurrency(nextQuarterRevenue)} change="↑ 5% growth/mo" color="from-emerald-500 to-green-600" icon={<span>🔮</span>} />
        <GlassStatCard label="Annual Run Rate" value={formatCurrency(annualRevenue)} change="Based on 2pt improvement/mo" color="from-amber-500 to-orange-600" icon={<span>🎯</span>} />
      </div>

      <GlassCard padding="none">
        <GlassCardHeader>
          <h3 className="text-lg font-semibold text-ink">Monthly Projections</h3>
        </GlassCardHeader>
        <div className="p-5 sm:p-6 space-y-2">
          {allMonths.map((m, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-16 text-xs text-ink-faint">{m.month}</span>
              {m.projected && <span className="text-[10px] text-accent-300 font-medium">est</span>}
              <div className="flex-1 h-5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className={`h-5 rounded-full transition-all duration-500 ${m.projected ? "bg-gradient-to-r from-accent-400/60 to-accent-400/60" : "bg-gradient-to-r from-accent-500 to-accent-500"}`}
                  style={{ width: `${(m.calls / maxValue) * 100}%` }} />
              </div>
              <span className="w-16 text-right text-xs font-medium text-ink">{m.calls}</span>
              <span className="w-8 text-right text-[10px] text-ink-faint">{m.score}%</span>
            </div>
          ))}
        </div>
        <div className="px-5 sm:px-6 pb-4 flex items-center gap-4 text-xs text-ink-faint">
          <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-gradient-to-r from-accent-500 to-accent-500" /> Historical</span>
          <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-gradient-to-r from-accent-400/60 to-accent-400/60" /> Projected</span>
        </div>
      </GlassCard>

      <GlassCard padding="md">
        <p className="text-xs text-ink-faint mb-1">Assumptions</p>
        <p className="text-sm text-ink">Monthly growth: 5%</p>
        <p className="text-sm text-ink">Score improvement: 2 points per month</p>
      </GlassCard>
    </div>
  );
}