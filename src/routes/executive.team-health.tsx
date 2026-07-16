import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassStatCard, GlassBadge } from '~/components/GlassCard';
import { RiskDot, ProgressBar } from '~/components/executive';
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/executive/team-health")({
  component: TeamHealth,
});

const teams = [
  { name: "Enterprise Sales", score: 87, trend: "up", reps: 8, calls: 342, avgScore: 82, coaching: 95, revenue: "$1.2M" },
  { name: "SMB Sales", score: 72, trend: "up", reps: 6, calls: 891, avgScore: 68, coaching: 78, revenue: "$890K" },
  { name: "Customer Success", score: 91, trend: "up", reps: 4, calls: 156, avgScore: 88, coaching: 100, revenue: "$650K" },
  { name: "Inside Sales", score: 65, trend: "down", reps: 6, calls: 1458, avgScore: 61, coaching: 55, revenue: "$420K" },
];

const topObjections = [
  { objection: "budget", count: 45 },
  { objection: "timing", count: 38 },
  { objection: "competitor", count: 29 },
  { objection: "authority", count: 22 },
  { objection: "need", count: 18 },
];

const maxObjectionCount = Math.max(...topObjections.map(o => o.count), 1);

const sentimentData = [
  { sentiment: "positive", count: 156, pct: 54, color: "bg-gradient-to-t from-emerald-500 to-green-500" },
  { sentiment: "neutral", count: 89, pct: 31, color: "bg-gradient-to-t from-gray-400 to-gray-500" },
  { sentiment: "negative", count: 42, pct: 15, color: "bg-gradient-to-t from-red-500 to-rose-500" },
];

function TeamHealth() {
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
      <div className="flex items-center gap-4">
        <Link to="/executive" className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/5 transition-colors">
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Team Health</h1>
          <p className="text-sm text-gray-400">Detailed team performance metrics</p>
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

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <GlassStatCard label="Avg Score" value="82%" change="2,847 calls analyzed" color="from-emerald-500 to-green-600" icon={<span>📊</span>} />
        <GlassStatCard label="Active Users" value="24" change="8 high performers" color="from-amber-500 to-orange-600" icon={<span>👥</span>} />
        <GlassStatCard label="Coaching Completion" value="7" change="5 active plans" color="from-violet-500 to-purple-600" icon={<span>🎯</span>} />
      </div>

      {/* Team Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {teams.map((team, i) => (
          <GlassCard key={i} padding="md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">{team.name}</h3>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                team.score >= 80 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                team.score >= 60 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                "bg-red-500/10 text-red-400 border-red-500/20"
              }`}>{team.score}%</span>
            </div>
            <ProgressBar value={team.score} size="md" showLabel={false} />
            <div className="grid grid-cols-2 gap-3 text-sm mt-4">
              <div><p className="text-xs text-gray-500">Reps</p><p className="font-medium text-white">{team.reps}</p></div>
              <div><p className="text-xs text-gray-500">Calls</p><p className="font-medium text-white">{team.calls}</p></div>
              <div><p className="text-xs text-gray-500">Avg Score</p><p className="font-medium text-white">{team.avgScore}%</p></div>
              <div><p className="text-xs text-gray-500">Coaching</p><p className="font-medium text-white">{team.coaching}%</p></div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Top Objections */}
      <GlassCard padding="none">
        <GlassCardHeader>
          <h3 className="text-lg font-semibold text-white">Top Objections</h3>
        </GlassCardHeader>
        <div className="p-5 sm:p-6 space-y-2">
          {topObjections.map((obj, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-6 text-xs text-gray-500">{i + 1}.</span>
              <span className="flex-1 text-sm text-white capitalize">{obj.objection.replace(/_/g, " ")}</span>
              <div className="w-32 h-4 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="h-4 rounded-full bg-gradient-to-r from-amber-500 to-red-500" style={{ width: `${(obj.count / maxObjectionCount) * 100}%` }} />
              </div>
              <span className="w-8 text-right text-xs text-gray-500">{obj.count}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Sentiment Distribution */}
      <GlassCard padding="none">
        <GlassCardHeader>
          <h3 className="text-lg font-semibold text-white">Sentiment Distribution</h3>
        </GlassCardHeader>
        <div className="p-5 sm:p-6">
          <div className="flex items-end gap-4 h-32">
            {sentimentData.map((s) => (
              <div key={s.sentiment} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-medium text-white">{s.pct}%</span>
                <div className="w-full rounded-t" style={{ height: `${s.pct}%`, minHeight: "8px" }}>
                  <div className={`w-full rounded-t ${s.color}`} style={{ height: "100%" }} />
                </div>
                <span className="text-xs text-gray-500 capitalize">{s.sentiment}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-center gap-6 text-sm">
            <div className="text-center">
              <p className="text-xs text-gray-500">Total Calls</p>
              <p className="text-lg font-bold text-white">2,847</p>
            </div>
            <div className="h-8 w-px" style={{ background: "rgba(255,255,255,0.08)" }} />
            <div className="text-center">
              <p className="text-xs text-gray-500">Positive Rate</p>
              <p className="text-lg font-bold text-emerald-400">54%</p>
            </div>
            <div className="h-8 w-px" style={{ background: "rgba(255,255,255,0.08)" }} />
            <div className="text-center">
              <p className="text-xs text-gray-500">Negative Rate</p>
              <p className="text-lg font-bold text-red-400">15%</p>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}