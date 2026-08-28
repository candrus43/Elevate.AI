import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassBadge, GlassButton, GlassInput, GlassSelect, GlassStatCard } from "~/components/GlassCard";
import { ProgressBar } from "~/components/executive";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/executive/coaching/departments")({
  component: DepartmentComparisons,
});

const departments = [
  {
    name: "Enterprise Sales",
    effectiveness: 92,
    completion: 88,
    improvement: 18,
    reps: 24,
    score: 86,
    trend: "up",
    color: "emerald",
    subTeams: [
      { name: "Enterprise SDRs", reps: 8, score: 84, calls: 156 },
      { name: "Enterprise AEs", reps: 10, score: 89, calls: 124 },
      { name: "Enterprise CS", reps: 6, score: 83, calls: 62 },
    ],
  },
  {
    name: "SMB Sales",
    effectiveness: 85,
    completion: 82,
    improvement: 14,
    reps: 32,
    score: 79,
    trend: "up",
    color: "blue",
    subTeams: [
      { name: "SMB SDRs", reps: 14, score: 76, calls: 423 },
      { name: "SMB AEs", reps: 12, score: 82, calls: 312 },
      { name: "SMB Onboarding", reps: 6, score: 78, calls: 156 },
    ],
  },
  {
    name: "Customer Success",
    effectiveness: 78,
    completion: 75,
    improvement: 11,
    reps: 18,
    score: 74,
    trend: "stable",
    color: "purple",
    subTeams: [
      { name: "CS Onboarding", reps: 6, score: 78, calls: 48 },
      { name: "CS Retention", reps: 8, score: 72, calls: 72 },
      { name: "CS Expansion", reps: 4, score: 70, calls: 36 },
    ],
  },
  {
    name: "Inside Sales",
    effectiveness: 72,
    completion: 68,
    improvement: 8,
    reps: 28,
    score: 68,
    trend: "up",
    color: "amber",
    subTeams: [
      { name: "Inbound ISRs", reps: 12, score: 71, calls: 624 },
      { name: "Outbound ISRs", reps: 10, score: 65, calls: 534 },
      { name: "Qualification", reps: 6, score: 67, calls: 300 },
    ],
  },
  {
    name: "Account Executives",
    effectiveness: 65,
    completion: 62,
    improvement: 5,
    reps: 16,
    score: 62,
    trend: "stable",
    color: "gray",
    subTeams: [
      { name: "Mid-Market AEs", reps: 8, score: 64, calls: 98 },
      { name: "Enterprise AEs", reps: 8, score: 60, calls: 76 },
    ],
  },
];

const colorMap: Record<string, string> = {
  emerald: "from-emerald-500 to-green-500",
  blue: "from-blue-500 to-cyan-500",
  purple: "from-accent-500 to-accent-500",
  amber: "from-amber-500 to-orange-500",
  gray: "from-gray-400 to-gray-500",
};

const colorBgMap: Record<string, string> = {
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  purple: "bg-accent-500/10 text-accent-300 border-accent-500/25",
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  gray: "bg-gray-500/10 text-ink-muted border-gray-500/20",
};

const colorBarMap: Record<string, string> = {
  emerald: "bg-emerald-500",
  blue: "bg-blue-500",
  purple: "bg-accent-500",
  amber: "bg-amber-500",
  gray: "bg-gray-500",
};

function DepartmentComparisons() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to="/executive/coaching" className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-panel-raised transition-colors">
          <svg className="h-5 w-5 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-ink">Department Comparisons</h1>
          <p className="text-sm text-ink-muted">Side-by-side coaching metrics across departments and sub-teams</p>
        </div>
      </div>

      {/* Department Overview Cards with Sub-Teams */}
      <div className="space-y-4">
        {departments.map((dept, i) => (
          <GlassCard key={i} padding="none">
            <GlassCardHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${colorMap[dept.color]} shadow-lg`}>
                    <span className="text-xs font-bold text-ink">{dept.score}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-ink">{dept.name}</h3>
                    <p className="text-xs text-ink-faint">{dept.reps} total reps</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-ink-faint">Effectiveness</p>
                    <p className="text-lg font-bold text-ink">{dept.effectiveness}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-ink-faint">Completion</p>
                    <p className="text-lg font-bold text-ink">{dept.completion}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-ink-faint">Improvement</p>
                    <p className="text-lg font-bold text-green-400">+{dept.improvement}%</p>
                  </div>
                  <span className={`text-lg ${dept.trend === "up" ? "text-emerald-400" : "text-ink-muted"}`}>
                    {dept.trend === "up" ? "↗" : "→"}
                  </span>
                </div>
              </div>
            </GlassCardHeader>

            {/* Sub-Teams Breakdown */}
            <div className="p-5 sm:p-6">
              <p className="text-xs font-semibold text-ink-faint uppercase tracking-wider mb-3">Sub-Teams</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {dept.subTeams.map((sub, j) => (
                  <div key={j} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-ink">{sub.name}</p>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${colorBgMap[dept.color]}`}>
                        {sub.score}%
                      </span>
                    </div>
                    <ProgressBar value={sub.score} size="sm" showLabel={false} />
                    <div className="flex items-center justify-between mt-2 text-xs text-ink-faint">
                      <span>{sub.reps} reps</span>
                      <span>{sub.calls} calls</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Side-by-Side Comparison Table */}
      <GlassCard padding="none">
        <GlassCardHeader>
          <h3 className="text-lg font-semibold text-ink">Side-by-Side Metrics</h3>
        </GlassCardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
                <th className="px-6 py-3 text-left text-[10px] font-semibold text-ink-faint uppercase">Department</th>
                <th className="px-4 py-3 text-right text-[10px] font-semibold text-ink-faint uppercase">Effectiveness</th>
                <th className="px-4 py-3 text-right text-[10px] font-semibold text-ink-faint uppercase">Completion</th>
                <th className="px-4 py-3 text-right text-[10px] font-semibold text-ink-faint uppercase">Improvement</th>
                <th className="px-4 py-3 text-right text-[10px] font-semibold text-ink-faint uppercase">Avg Score</th>
                <th className="px-4 py-3 text-center text-[10px] font-semibold text-ink-faint uppercase">Rank</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "rgba(255, 255, 255, 0.06)" }}>
              {departments.map((dept, i) => (
                <tr key={i} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${colorBarMap[dept.color]}`} />
                      <span className="text-sm font-medium text-ink">{dept.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className={`font-semibold ${dept.effectiveness >= 85 ? "text-emerald-400" : dept.effectiveness >= 70 ? "text-amber-400" : "text-red-400"}`}>{dept.effectiveness}%</span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <div className="h-1.5 w-12 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${dept.completion}%` }} />
                      </div>
                      <span className="text-xs font-medium text-ink">{dept.completion}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-semibold text-emerald-400">+{dept.improvement}%</td>
                  <td className="px-4 py-4 text-right">
                    <span className={`text-sm font-bold ${dept.score >= 80 ? "text-emerald-400" : dept.score >= 70 ? "text-amber-400" : "text-red-400"}`}>{dept.score}%</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold bg-accent-500/10 text-accent-300 border border-accent-500/25">#{i + 1}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}