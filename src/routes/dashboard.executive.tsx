import { LoadingSkeleton } from '~/components/GlassCard';
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassStatCard, GlassBadge, GlassButton } from '~/components/GlassCard';
import { ExecutiveSummaryCard, RiskIndicator, RecommendedAction, ManagerPerformanceTable, KpiSparkline, ProgressBar } from '~/components/executive';
import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/executive")({
  component: ExecutiveDashboard,
});

function ExecutiveDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("7d");

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      setLoading(false);
    });
  }, [navigate]);

  // Sparkline data points for each KPI
  const sparklineData = [
    [45, 52, 48, 65, 58, 72, 68, 75, 82, 78, 85, 90, 88, 92],
    [120, 145, 132, 158, 142, 98, 52, 168, 175, 155, 142, 180, 165, 148],
    [62, 65, 68, 64, 70, 72, 68, 74, 76, 73, 78, 75, 80, 82],
    [18, 20, 22, 21, 24, 24, 23, 25, 24, 26, 26, 27, 28, 30],
  ];

  const kpis = [
    { label: "Total Revenue", value: "$124,500", change: "+12.3%", positive: true, icon: "💰", gradient: "from-accent-500 to-accent-600", sparkline: sparklineData[0] },
    { label: "Calls Analyzed", value: "2,847", change: "+8.1%", positive: true, icon: "🎧", gradient: "from-blue-500 to-cyan-600", sparkline: sparklineData[1] },
    { label: "Avg Score", value: "74%", change: "+3.2%", positive: true, icon: "📊", gradient: "from-emerald-500 to-green-600", sparkline: sparklineData[2] },
    { label: "Active Reps", value: "24", change: "+4", positive: true, icon: "👥", gradient: "from-amber-500 to-orange-600", sparkline: sparklineData[3] },
    { label: "Coaching ROI", value: "312%", change: "+28%", positive: true, icon: "🎯", gradient: "from-rose-500 to-pink-600" },
    { label: "Churn Rate", value: "2.1%", change: "-0.5%", positive: true, icon: "🛡️", gradient: "from-accent-500 to-accent-600" },
  ];

  const teamHealth = [
    { name: "Enterprise Sales", score: 87, reps: 8, calls: 342, trend: "up", risk: "low" as const },
    { name: "SMB Sales", score: 72, reps: 6, calls: 891, trend: "up", risk: "medium" as const },
    { name: "Customer Success", score: 91, reps: 4, calls: 156, trend: "up", risk: "low" as const },
    { name: "Inside Sales", score: 65, reps: 6, calls: 1458, trend: "down", risk: "high" as const },
  ];

  const weeklyTrend = [
    { day: "Mon", calls: 120, score: 72 },
    { day: "Tue", calls: 145, score: 75 },
    { day: "Wed", calls: 132, score: 78 },
    { day: "Thu", calls: 158, score: 74 },
    { day: "Fri", calls: 142, score: 76 },
    { day: "Sat", calls: 98, score: 80 },
    { day: "Sun", calls: 52, score: 82 },
  ];

  const maxCalls = Math.max(...weeklyTrend.map(d => d.calls));

  const managers = [
    { id: "1", name: "Sarah Mitchell", team: "Enterprise", score: 87, calls: 342, coaching: 95, revenue: "$1.2M", trend: "up" as const },
    { id: "2", name: "David Chen", team: "SMB", score: 72, calls: 891, coaching: 78, revenue: "$890K", trend: "up" as const },
    { id: "3", name: "Jessica Park", team: "Customer Success", score: 91, calls: 156, coaching: 100, revenue: "$650K", trend: "up" as const },
    { id: "4", name: "Michael Torres", team: "Inside Sales", score: 65, calls: 1458, coaching: 55, revenue: "$420K", trend: "down" as const },
  ];

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Command Center subtitle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-500 to-accent-600 shadow-lg shadow-accent-500/25">
              <svg className="h-4 w-4 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ink">Command Center</h1>
              <p className="text-sm text-ink-muted">Company-wide KPIs, trends, and actionable insights</p>
            </div>
          </div>
        </div>
        <div className="flex gap-1 rounded-xl p-1" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {["7d", "30d", "90d", "1y"].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                dateRange === range
                  ? "bg-accent-500/20 text-accent-300 shadow-sm"
                  : "text-ink-faint hover:text-ink-muted"
              }`}
            >
              {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : range === "90d" ? "90 Days" : "1 Year"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Grid — using GlassStatCard component */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi, i) => (
          <GlassStatCard
            key={i}
            label={kpi.label}
            value={kpi.value}
            change={`${kpi.positive ? "↑" : "↓"} ${kpi.change}`}
            color={kpi.gradient}
            icon={<span>{kpi.icon}</span>}
          />
        ))}
      </div>

      {/* AI Executive Summary — using the new ExecutiveSummaryCard */}
      <ExecutiveSummaryCard
        title="AI Executive Summary"
        icon="🧠"
        gradient="from-accent-500 to-accent-600"
        confidence={92}
        summary={`Based on ${dateRange === "7d" ? "7-day" : dateRange === "30d" ? "30-day" : dateRange === "90d" ? "90-day" : "annual"} data analysis, revenue is tracking ${kpis[0].change} above target with strong coaching ROI at ${kpis[4].value}. Inside Sales requires immediate attention with a dip to 65% average score. Recommend focused coaching interventions for the Inside Sales team to address objection handling and closing techniques. Customer Success is the top performer at 91% score.`}
        action={
          <Link to="/dashboard/ai-assistant" className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-300 hover:text-accent-300 transition-colors">
            View full AI analysis
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        }
      />

      {/* Weekly Trend Chart + Team Health using GlassCard */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Weekly Trend Chart */}
        <GlassCard padding="none">
          <GlassCardHeader>
            <div className="flex items-center justify-between w-full">
              <h3 className="text-lg font-semibold text-ink">Weekly Trend</h3>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-ink-muted">
                  <span className="h-2.5 w-2.5 rounded-full bg-accent-500" />
                  Calls
                </span>
                <span className="flex items-center gap-1.5 text-ink-muted">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Score
                </span>
              </div>
            </div>
          </GlassCardHeader>
          <div className="p-5 sm:p-6">
            <div className="flex items-end gap-2 h-48">
              {weeklyTrend.map((day, i) => {
                const height = (day.calls / maxCalls) * 100;
                const scoreHeight = (day.score / 100) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 justify-end h-full">
                    <span className="text-xs font-medium text-emerald-400">{day.score}%</span>
                    <div className="w-full relative flex items-end justify-center gap-[2px]" style={{ height: `${Math.max(height, 20)}%` }}>
                      <div className="w-1/2 rounded-t-sm bg-gradient-to-t from-accent-500/80 to-accent-500/80 transition-all" style={{ height: `${height}%` }} />
                      <div className="w-1/2 rounded-t-sm bg-gradient-to-t from-emerald-500/80 to-green-500/80 transition-all" style={{ height: `${scoreHeight * 0.7}%` }} />
                    </div>
                    <span className="text-xs text-ink-faint mt-1">{day.day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </GlassCard>

        {/* Team Health */}
        <GlassCard padding="none">
          <GlassCardHeader>
            <div className="flex items-center justify-between w-full">
              <h3 className="text-lg font-semibold text-ink">Team Health</h3>
              <Link to="/dashboard/executive/team-health" className="text-sm font-medium text-accent-300 hover:text-accent-300 transition-colors">View all</Link>
            </div>
          </GlassCardHeader>
          <GlassCardBody divide>
            {teamHealth.map((team, i) => (
              <GlassCardRow key={i} hover>
                <div className="flex items-center gap-2">
                  <RiskIndicator level={team.risk} size="sm" showLabel={false} />
                  <div>
                    <p className="text-sm font-medium text-ink">{team.name}</p>
                    <p className="text-xs text-ink-faint">{team.reps} reps · {team.calls} calls</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-ink">{team.score}%</span>
                  <span className={`text-xs ${team.trend === "up" ? "text-green-400" : "text-red-400"}`}>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={team.trend === "up" ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
                    </svg>
                  </span>
                </div>
              </GlassCardRow>
            ))}
          </GlassCardBody>
        </GlassCard>
      </div>

      {/* Recommended Actions — using the new RecommendedAction component */}
      <div>
        <h3 className="text-lg font-semibold text-ink mb-4">Recommended Actions</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <RecommendedAction
            title="Inside Sales Intervention"
            description="Team score dropped to 65%. Deploy focused coaching on objection handling and closing techniques."
            priority="high"
            icon="🚨"
            action={
              <Link to="/dashboard/executive/team-health" className="text-xs font-medium text-accent-300 hover:text-accent-300 transition-colors">
                View team details →
              </Link>
            }
          />
          <RecommendedAction
            title="Scale Coaching Program"
            description="Coaching ROI at 312% — expanding to SMB team could yield additional $120K in revenue."
            priority="medium"
            icon="📈"
            action={
              <Link to="/dashboard/executive-coaching/roi" className="text-xs font-medium text-accent-300 hover:text-accent-300 transition-colors">
                View ROI analysis →
              </Link>
            }
          />
          <RecommendedAction
            title="Customer Success Upsell"
            description="Top-performing team at 91%. Leverage for case studies and upskill other teams."
            priority="low"
            icon="🏆"
            action={
              <Link to="/dashboard/executive/team-health" className="text-xs font-medium text-accent-300 hover:text-accent-300 transition-colors">
                View team details →
              </Link>
            }
          />
        </div>
      </div>

      {/* Manager Performance Table — using the new ManagerPerformanceTable component */}
      <ManagerPerformanceTable managers={managers} title="Manager Performance Overview" />

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { to: "/dashboard/executive/forecasting", icon: "🔮", title: "Forecasting", desc: "Revenue projections & trends", gradient: "from-accent-500 to-accent-600" },
          { to: "/dashboard/executive/team-health", icon: "❤️", title: "Team Health", desc: "Detailed team metrics", gradient: "from-emerald-500 to-green-600" },
          { to: "/dashboard/executive/reports", icon: "📄", title: "Reports", desc: "Scheduled reports & exports", gradient: "from-amber-500 to-orange-600" },
        ].map((item, i) => (
          <Link
            key={i}
            to={item.to}
            className="group rounded-2xl p-5 transition-all duration-300 hover:border-accent-500/25 hover:translate-y-[-1px]"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(139,92,246,0.04) 50%, rgba(255,255,255,0.02) 100%)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${item.gradient} shadow-lg`}>
                <span className="text-lg">{item.icon}</span>
              </div>
              <div>
                <p className="font-medium text-ink group-hover:text-accent-300 transition-colors">{item.title}</p>
                <p className="text-sm text-ink-muted">{item.desc}</p>
              </div>
              <svg className="h-4 w-4 text-ink-faint ml-auto group-hover:text-accent-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}