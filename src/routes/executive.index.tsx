import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassStatCard, GlassBadge } from '~/components/GlassCard';
import { ExecutiveSummaryCard, RiskIndicator, RiskDot, RecommendedAction, ManagerPerformanceTable, KpiSparkline, ProgressBar } from '~/components/executive';
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/executive/")({
  component: ExecutiveDashboard,
});

const kpis = { totalCalls: 2847, analyzedCalls: 2847, activeUsers: 24, avgScore: 82, analysisRate: 100 };
const teamHealth = { totalMembers: 24, highPerformers: 8, needsImprovement: 3, inactive: 2 };
const coachingEffectiveness = { totalPlans: 12, activePlans: 5, completedPlans: 7, avgImprovement: 14 };
const compliance = { totalChecks: 2847, passedChecks: 2733, complianceRate: 96 };
const revenueImpact = { estimatedConversionRate: 32, estimatedDealsFromCoaching: 18 };

const weeklyTrend = [
  { day: "Mon", calls: 120, score: 72 },
  { day: "Tue", calls: 145, score: 75 },
  { day: "Wed", calls: 132, score: 78 },
  { day: "Thu", calls: 158, score: 74 },
  { day: "Fri", calls: 142, score: 76 },
  { day: "Sat", calls: 98, score: 80 },
  { day: "Sun", calls: 52, score: 82 },
];

const managers = [
  { managerId: "m1", managerName: "Sarah Chen", managerEmail: "sarah@enterprise.com", teamName: "Enterprise Sales", teamSize: 8, teamScore: 87, callsAnalyzed: 342, analyzedCalls: 342, coachingPlans: 4, avgImprovement: 12, complianceRate: 98 },
  { managerId: "m2", managerName: "Marcus Johnson", managerEmail: "marcus@smb.com", teamName: "SMB Sales", teamSize: 6, teamScore: 72, callsAnalyzed: 891, analyzedCalls: 891, coachingPlans: 3, avgImprovement: 8, complianceRate: 85 },
  { managerId: "m3", managerName: "Emily Rodriguez", managerEmail: "emily@cs.com", teamName: "Customer Success", teamSize: 4, teamScore: 91, callsAnalyzed: 156, analyzedCalls: 156, coachingPlans: 2, avgImprovement: 16, complianceRate: 100 },
  { managerId: "m4", managerName: "David Kim", managerEmail: "david@inside.com", teamName: "Inside Sales", teamSize: 6, teamScore: 65, callsAnalyzed: 1458, analyzedCalls: 1458, coachingPlans: 5, avgImprovement: 5, complianceRate: 72 },
];

const maxCalls = Math.max(...weeklyTrend.map(d => d.calls), 1);

const kpiCards = [
  { label: "Calls Analyzed", value: "2,847", change: "100%", icon: "🎧", gradient: "from-blue-500 to-cyan-600" },
  { label: "Avg Score", value: "82%", change: "+14pts", icon: "📊", gradient: "from-emerald-500 to-green-600" },
  { label: "Active Reps", value: "24", change: "8 high performers", icon: "👥", gradient: "from-amber-500 to-orange-600" },
  { label: "Coaching Plans", value: "12", change: "7 completed", icon: "🎯", gradient: "from-rose-500 to-pink-600" },
  { label: "Compliance", value: "96%", change: "2,733/2,847 checks", icon: "🛡️", gradient: "from-violet-500 to-purple-600" },
  { label: "Coaching ROI", value: "312%", change: "~18 deals", icon: "💰", gradient: "from-indigo-500 to-purple-600" },
];

function ExecutiveDashboard() {
  const [period, setPeriod] = useState("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const periods = [
    { value: "7d", label: "7 Days" },
    { value: "30d", label: "30 Days" },
    { value: "90d", label: "90 Days" },
    { value: "custom", label: "Custom" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/25">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Executive Dashboard</h1>
              <p className="text-sm text-gray-400">Company-wide KPIs, trends, and actionable insights</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
                  period === p.value
                    ? "bg-purple-500/20 text-purple-300"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {period === "custom" && (
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5">
              <span className="text-xs text-gray-400">From</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-32 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none"
              />
              <span className="text-xs text-gray-400">To</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-32 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpiCards.map((kpi, i) => (
          <GlassStatCard key={i} label={kpi.label} value={kpi.value} change={kpi.change} color={kpi.gradient} icon={<span>{kpi.icon}</span>} />
        ))}
      </div>

      {/* AI Executive Summary */}
      <ExecutiveSummaryCard
        title="AI Executive Summary"
        icon="🧠"
        gradient="from-purple-500 to-violet-600"
        confidence={88}
        summary="Based on 30-day data: 2,847 calls analyzed with avg score of 82%. 7 coaching plans completed with +14pt average improvement. Compliance at 96%. Estimated 18 deals influenced by coaching. Top improvement areas: objection handling (+22%), talk-to-listen ratio (+15%), and discovery questions (+18%)."
        action={
          <Link to="/dashboard/ai-assistant" className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors">
            View full AI analysis
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Weekly Trend Chart */}
        <GlassCard padding="none">
          <GlassCardHeader>
            <h3 className="text-lg font-semibold text-white">Call Trends (Last 7 Days)</h3>
          </GlassCardHeader>
          <div className="p-5 sm:p-6">
            <div className="flex items-end gap-2 h-40">
              {weeklyTrend.map((day, i) => {
                const height = (day.calls / maxCalls) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs text-gray-500">{day.score}%</span>
                    <div className="w-full flex flex-col items-center" style={{ height: `${Math.max(height, 4)}%` }}>
                      <div className="w-full rounded-t bg-gradient-to-t from-indigo-500 to-purple-500 transition-all" style={{ height: "100%" }} />
                    </div>
                    <span className="text-xs text-gray-500">{day.day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </GlassCard>

        {/* Team Health Summary */}
        <GlassCard padding="none">
          <GlassCardHeader>
            <div className="flex items-center justify-between w-full">
              <h3 className="text-lg font-semibold text-white">Team Health</h3>
              <Link to="/executive/team-health" className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors">View all</Link>
            </div>
          </GlassCardHeader>
          <GlassCardBody divide>
            <GlassCardRow>
              <div><p className="text-sm font-medium text-white">Total Members</p><p className="text-xs text-gray-500">24 active users</p></div>
              <span className="text-lg font-bold text-white">24</span>
            </GlassCardRow>
            <GlassCardRow>
              <div><p className="text-sm font-medium text-white">High Performers</p><p className="text-xs text-gray-500">Score ≥ 80</p></div>
              <span className="text-lg font-bold text-emerald-400">8</span>
            </GlassCardRow>
            <GlassCardRow>
              <div><p className="text-sm font-medium text-white">Needs Improvement</p><p className="text-xs text-gray-500">Score &lt; 60</p></div>
              <span className="text-lg font-bold text-amber-400">3</span>
            </GlassCardRow>
            <GlassCardRow>
              <div><p className="text-sm font-medium text-white">Inactive</p><p className="text-xs text-gray-500">No calls this period</p></div>
              <span className="text-lg font-bold text-gray-400">2</span>
            </GlassCardRow>
          </GlassCardBody>
        </GlassCard>
      </div>

      {/* Recommended Actions */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Recommended Actions</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <RecommendedAction title="Improve Low Performers" description="3 rep(s) scoring below 60. Schedule focused coaching interventions." priority="high" icon="🚨"
            action={<Link to="/executive/team-health" className="text-xs font-medium text-purple-400 hover:text-purple-300">View team details →</Link>} />
          <RecommendedAction title="Scale Coaching Program" description="7 plans completed with +14pt avg improvement. Expand to more reps." priority="medium" icon="📈"
            action={<Link to="/executive/coaching" className="text-xs font-medium text-purple-400 hover:text-purple-300">View ROI analysis →</Link>} />
          <RecommendedAction title="Compliance Check" description="96% compliance rate. On track. Continue monitoring." priority="low" icon="🛡️"
            action={<Link to="/executive/team-health" className="text-xs font-medium text-purple-400 hover:text-purple-300">View details →</Link>} />
        </div>
      </div>

      {/* Manager Performance */}
      <GlassCard padding="none">
        <GlassCardHeader>
          <h3 className="text-lg font-semibold text-white">Manager Performance</h3>
          <span className="text-xs text-gray-500">4 managers</span>
        </GlassCardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
                <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Manager</th>
                <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Team</th>
                <th className="px-6 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Size</th>
                <th className="px-6 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Calls</th>
                <th className="px-6 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Plans</th>
                <th className="px-6 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Improvement</th>
                <th className="px-6 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "rgba(255, 255, 255, 0.06)" }}>
              {managers.map((mgr) => (
                <tr key={mgr.managerId} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-[10px] font-bold text-white shadow-lg">
                        {mgr.managerName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-white">{mgr.managerName}</p>
                        <p className="text-[10px] text-gray-500">{mgr.managerEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-400">{mgr.teamName}</td>
                  <td className="px-6 py-3 text-center font-medium text-white">{mgr.teamSize}</td>
                  <td className="px-6 py-3 text-center">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      mgr.teamScore >= 80 ? "bg-emerald-500/10 text-emerald-300" :
                      mgr.teamScore >= 60 ? "bg-amber-500/10 text-amber-300" : "bg-red-500/10 text-red-300"
                    }`}>{mgr.teamScore}%</span>
                  </td>
                  <td className="px-6 py-3 text-center text-sm text-gray-300">{mgr.callsAnalyzed}</td>
                  <td className="px-6 py-3 text-center text-sm text-gray-300">{mgr.coachingPlans}</td>
                  <td className="px-6 py-3 text-center">
                    <span className={`text-xs font-medium ${mgr.avgImprovement >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {mgr.avgImprovement >= 0 ? "+" : ""}{mgr.avgImprovement}pts
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="h-1.5 w-12 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div className={`h-1.5 rounded-full ${mgr.complianceRate >= 80 ? "bg-gradient-to-r from-emerald-500 to-green-500" : mgr.complianceRate >= 60 ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-gradient-to-r from-red-500 to-rose-500"}`}
                          style={{ width: `${mgr.complianceRate}%` }} />
                      </div>
                      <span className="text-xs text-gray-400">{mgr.complianceRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Bottom links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link to="/executive/forecasting" className="group rounded-2xl p-5 transition-all duration-300 hover:border-purple-500/20 hover:translate-y-[-1px]"
          style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(139,92,246,0.04) 50%, rgba(255,255,255,0.02) 100%)", backdropFilter: "blur(24px)", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">🔮</div>
            <div><p className="font-medium text-white group-hover:text-purple-300 transition-colors">Forecasting</p><p className="text-sm text-gray-400">Revenue projections & trends</p></div>
          </div>
        </Link>
        <Link to="/executive/team-health" className="group rounded-2xl p-5 transition-all duration-300 hover:border-purple-500/20 hover:translate-y-[-1px]"
          style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(139,92,246,0.04) 50%, rgba(255,255,255,0.02) 100%)", backdropFilter: "blur(24px)", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg">❤️</div>
            <div><p className="font-medium text-white group-hover:text-purple-300 transition-colors">Team Health</p><p className="text-sm text-gray-400">Detailed team metrics</p></div>
          </div>
        </Link>
        <Link to="/executive/reports" className="group rounded-2xl p-5 transition-all duration-300 hover:border-purple-500/20 hover:translate-y-[-1px]"
          style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(139,92,246,0.04) 50%, rgba(255,255,255,0.02) 100%)", backdropFilter: "blur(24px)", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">📄</div>
            <div><p className="font-medium text-white group-hover:text-purple-300 transition-colors">Reports</p><p className="text-sm text-gray-400">Scheduled reports & exports</p></div>
          </div>
        </Link>
      </div>
    </div>
  );
}