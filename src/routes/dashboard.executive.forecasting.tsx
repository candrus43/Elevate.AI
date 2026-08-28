import { LoadingSkeleton } from '~/components/GlassCard';
import { GlassCard, GlassCardHeader, GlassCardBody, GlassStatCard, GlassBadge } from '~/components/GlassCard';
import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/executive/forecasting")({
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

  const months = [
    { month: "Jan", value: 80, revenue: "$80K" },
    { month: "Feb", value: 85, revenue: "$85K" },
    { month: "Mar", value: 90, revenue: "$90K" },
    { month: "Apr", value: 95, revenue: "$95K" },
    { month: "May", value: 100, revenue: "$100K" },
    { month: "Jun", value: 110, revenue: "$110K" },
    { month: "Jul", value: 115, revenue: "$115K" },
    { month: "Aug", value: 120, revenue: "$120K" },
    { month: "Sep", value: 128, revenue: "$128K" },
    { month: "Oct", value: 135, revenue: "$135K" },
    { month: "Nov", value: 142, revenue: "$142K" },
    { month: "Dec", value: 150, revenue: "$150K" },
  ];

  const maxValue = Math.max(...months.map(m => m.value));

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/dashboard/executive" className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-panel-raised transition-colors">
          <svg className="h-5 w-5 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-ink">Forecasting</h1>
          <p className="text-sm text-ink-muted">Revenue projections and trend analysis</p>
        </div>
      </div>

      {/* Key Revenue Projections using GlassStatCard */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <GlassStatCard
          label="Current Month"
          value="$124,500"
          change="↑ 12.3% vs last month"
          color="from-accent-500 to-accent-600"
          icon={<span>📈</span>}
        />
        <GlassStatCard
          label="Next Quarter"
          value="$412,000"
          change="↑ 8.7% projected"
          color="from-emerald-500 to-green-600"
          icon={<span>🔮</span>}
        />
        <GlassStatCard
          label="Annual Run Rate"
          value="$1.49M"
          change="↑ 15.2% YoY"
          color="from-amber-500 to-orange-600"
          icon={<span>🎯</span>}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Monthly Projections Chart */}
        <GlassCard padding="none" className="lg:col-span-2">
          <GlassCardHeader>
            <div className="flex items-center justify-between w-full">
              <h3 className="text-lg font-semibold text-ink">Monthly Revenue Projections</h3>
              <span className="text-xs font-medium text-green-400">↑ 87.5% projected growth</span>
            </div>
          </GlassCardHeader>
          <div className="p-5 sm:p-6">
            <div className="flex items-end gap-1.5 h-64">
              {months.map((m, i) => {
                const height = (m.value / maxValue) * 100;
                const isFuture = i > 5;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 justify-end h-full group">
                    <span className="text-[10px] font-medium text-ink-muted opacity-0 group-hover:opacity-100 transition-opacity">{m.revenue}</span>
                    <div
                      className={`w-full rounded-t transition-all duration-500 group-hover:opacity-90 ${
                        isFuture
                          ? "bg-gradient-to-t from-accent-500/60 to-accent-500/60 border-t border-accent-400/20"
                          : "bg-gradient-to-t from-accent-500 to-accent-500"
                      }`}
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[10px] text-ink-faint">{m.month}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-gradient-to-t from-accent-500 to-accent-500" />
                <span className="text-xs text-ink-muted">Actual</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-gradient-to-t from-accent-500/60 to-accent-500/60" />
                <span className="text-xs text-ink-muted">Projected</span>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Key Metrics Sidebar */}
        <GlassCard padding="none">
          <GlassCardHeader>
            <h3 className="text-lg font-semibold text-ink">Forecast Insights</h3>
          </GlassCardHeader>
          <div className="p-5 sm:p-6 space-y-5">
            {[
              { label: "Pipeline Coverage", value: "3.2x", sub: "Above target", positive: true, icon: "🔬" },
              { label: "Win Rate", value: "28%", sub: "Up from 24%", positive: true, icon: "🎯" },
              { label: "Avg Deal Size", value: "$12,400", sub: "Growing 8%", positive: true, icon: "💎" },
              { label: "Sales Cycle", value: "42 days", sub: "Down 3 days", positive: true, icon: "⏱️" },
              { label: "Headcount Growth", value: "+6", sub: "Next quarter", positive: true, icon: "👥" },
              { label: "Coaching ROI Projected", value: "340%", sub: "Year-end target", positive: true, icon: "📊" },
            ].map((insight, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm opacity-60">{insight.icon}</span>
                  <div>
                    <p className="text-xs text-ink-muted">{insight.label}</p>
                    <p className="text-sm font-bold text-ink">{insight.value}</p>
                  </div>
                </div>
                <span className={`text-xs font-medium ${insight.positive ? "text-green-400" : "text-red-400"}`}>
                  {insight.sub}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Headcount & Coaching ROI Prediction */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[
          {
            title: "Headcount Projection",
            items: [
              { label: "Current", value: "24" },
              { label: "Q3", value: "28 (+4)" },
              { label: "Q4", value: "32 (+4)" },
              { label: "Q1 Next", value: "36 (+4)" },
            ],
            gradient: "from-blue-500 to-cyan-600",
            icon: "👥",
          },
          {
            title: "Coaching ROI Forecast",
            items: [
              { label: "Current ROI", value: "312%" },
              { label: "Q3 Target", value: "325%" },
              { label: "Q4 Target", value: "340%" },
              { label: "Year End", value: "350%+" },
            ],
            gradient: "from-rose-500 to-pink-600",
            icon: "🎯",
          },
        ].map((card, i) => (
          <GlassCard key={i} padding="md">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">{card.icon}</span>
              <h3 className="text-lg font-semibold text-ink">{card.title}</h3>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {card.items.map((item, j) => (
                <div key={j} className="text-center rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <p className={`bg-gradient-to-r ${card.gradient} bg-clip-text text-lg font-bold text-transparent`}>{item.value}</p>
                  <p className="text-xs text-ink-muted mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}