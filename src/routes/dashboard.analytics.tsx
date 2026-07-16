import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/analytics")({
  component: AnalyticsPage,
});

interface RepKPI {
  id: string;
  name: string;
  avatar: string;
  team: string;
  atp: number;
  fulls: number;
  partials: number;
  salesWithATP: number;
  spr: number;
  inbounds: number;
  manuals: number;
  h2s: number;
  wh2s: number;
  calls: number;
  avgScore: number;
}

const DEMO_REPS: RepKPI[] = [
  { id: "r1", name: "Sarah Chen", avatar: "SC", team: "Enterprise Sales", atp: 42, fulls: 28, partials: 14, salesWithATP: 36, spr: 86, inbounds: 84, manuals: 62, h2s: 31, wh2s: 43, calls: 146, avgScore: 88 },
  { id: "r2", name: "Mike Rodriguez", avatar: "MR", team: "Enterprise Sales", atp: 38, fulls: 22, partials: 16, salesWithATP: 30, spr: 79, inbounds: 72, manuals: 58, h2s: 28, wh2s: 39, calls: 130, avgScore: 82 },
  { id: "r3", name: "Emily Watson", avatar: "EW", team: "Enterprise Sales", atp: 35, fulls: 18, partials: 12, salesWithATP: 26, spr: 74, inbounds: 94, manuals: 46, h2s: 24, wh2s: 35, calls: 140, avgScore: 76 },
  { id: "r4", name: "James Wilson", avatar: "JW", team: "SMB Sales", atp: 20, fulls: 10, partials: 10, salesWithATP: 14, spr: 50, inbounds: 36, manuals: 28, h2s: 18, wh2s: 22, calls: 64, avgScore: 58 },
  { id: "r5", name: "Lisa Park", avatar: "LP", team: "SMB Sales", atp: 44, fulls: 30, partials: 14, salesWithATP: 38, spr: 91, inbounds: 78, manuals: 66, h2s: 34, wh2s: 46, calls: 144, avgScore: 92 },
  { id: "r6", name: "David Kim", avatar: "DK", team: "SMB Sales", atp: 36, fulls: 24, partials: 12, salesWithATP: 30, spr: 83, inbounds: 68, manuals: 54, h2s: 29, wh2s: 40, calls: 122, avgScore: 85 },
];

type SortKey = "name" | "atp" | "fulls" | "partials" | "salesWithATP" | "spr" | "inbounds" | "manuals" | "h2s" | "wh2s" | "calls" | "avgScore";

function AnalyticsPage() {
  const [period, setPeriod] = useState("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("spr");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const periods = [
    { value: "7d", label: "7 Days" },
    { value: "30d", label: "30 Days" },
    { value: "90d", label: "90 Days" },
    { value: "custom", label: "Custom" },
  ];

  const totals = useMemo(() => ({
    totalATP: DEMO_REPS.reduce((s, r) => s + r.atp, 0),
    totalFulls: DEMO_REPS.reduce((s, r) => s + r.fulls, 0),
    totalPartials: DEMO_REPS.reduce((s, r) => s + r.partials, 0),
    totalSalesWithATP: DEMO_REPS.reduce((s, r) => s + r.salesWithATP, 0),
    avgSPR: Math.round(DEMO_REPS.reduce((s, r) => s + r.spr, 0) / DEMO_REPS.length),
    totalInbounds: DEMO_REPS.reduce((s, r) => s + r.inbounds, 0),
    totalManuals: DEMO_REPS.reduce((s, r) => s + r.manuals, 0),
    avgH2S: Math.round(DEMO_REPS.reduce((s, r) => s + r.h2s, 0) / DEMO_REPS.length),
    avgWH2S: Math.round(DEMO_REPS.reduce((s, r) => s + r.wh2s, 0) / DEMO_REPS.length),
    totalCalls: DEMO_REPS.reduce((s, r) => s + r.calls, 0),
    avgScore: Math.round(DEMO_REPS.reduce((s, r) => s + r.avgScore, 0) / DEMO_REPS.length),
    activeReps: DEMO_REPS.length,
  }), []);

  const sortedReps = useMemo(() => {
    return [...DEMO_REPS].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
      }
      return sortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortArrow = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <span className="ml-1 text-gray-600">↕</span>;
    return <span className="ml-1 text-purple-400">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-sm text-gray-400">Team performance insights & KPI dashboard</p>
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
          <button className="btn-ghost rounded-xl border border-white/5 px-3 py-1.5 text-xs">
            <svg className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Team Performance Summary */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">Team Performance Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="glass-card rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg">🏆</span>
              <p className="text-xs text-gray-400">Total ATP</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white">{totals.totalATP}</p>
            <p className="text-xs text-gray-500 mt-1">Appointments</p>
          </div>

          <div className="glass-card rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg">✅</span>
              <p className="text-xs text-gray-400">Total Fulls</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-400">{totals.totalFulls}</p>
            <p className="text-xs text-gray-500 mt-1">Full sales closed</p>
          </div>

          <div className="glass-card rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg">📋</span>
              <p className="text-xs text-gray-400">Total Partials</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-amber-400">{totals.totalPartials}</p>
            <p className="text-xs text-gray-500 mt-1">Partial sales closed</p>
          </div>

          <div className="glass-card rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg">🎯</span>
              <p className="text-xs text-gray-400">Sales w/ ATP</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-purple-400">{totals.totalSalesWithATP}</p>
            <p className="text-xs text-gray-500 mt-1">Sales with appointments</p>
          </div>

          <div className="glass-card rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg">📊</span>
              <p className="text-xs text-gray-400">Avg SPR</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white">{totals.avgSPR}%</p>
            <p className="text-xs text-gray-500 mt-1">Sales Performance Rating</p>
          </div>

          <div className="glass-card rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg">📞</span>
              <p className="text-xs text-gray-400">Total Inbounds</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white">{totals.totalInbounds}</p>
            <p className="text-xs text-gray-500 mt-1">Inbound calls</p>
          </div>

          <div className="glass-card rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg">🔁</span>
              <p className="text-xs text-gray-400">Total Manuals</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white">{totals.totalManuals}</p>
            <p className="text-xs text-gray-500 mt-1">Manual dials</p>
          </div>

          <div className="glass-card rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg">🔄</span>
              <p className="text-xs text-gray-400">Avg H2S</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-400">{totals.avgH2S}%</p>
            <p className="text-xs text-gray-500 mt-1">Handle to Sale</p>
          </div>

          <div className="glass-card rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg">🔥</span>
              <p className="text-xs text-gray-400">Avg WH2S</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-amber-400">{totals.avgWH2S}%</p>
            <p className="text-xs text-gray-500 mt-1">Warm Handle to Sale</p>
          </div>

          <div className="glass-card rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg">💎</span>
              <p className="text-xs text-gray-400">Avg Score</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white">{totals.avgScore}</p>
            <p className="text-xs text-gray-500 mt-1">{totals.totalCalls} total calls</p>
          </div>
        </div>
      </div>

      {/* Rep KPI Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Individual Rep Performance</h3>
          <p className="text-xs text-gray-500">{DEMO_REPS.length} reps · Click column headers to sort</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="sticky left-0 bg-[#0f0a1e] px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors min-w-[140px]" onClick={() => handleSort("name")}>
                  <div className="flex items-center">
                    Rep
                    <SortArrow column="name" />
                  </div>
                </th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors whitespace-nowrap" onClick={() => handleSort("calls")}>
                  <div className="flex items-center justify-end">
                    Calls
                    <SortArrow column="calls" />
                  </div>
                </th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors whitespace-nowrap" onClick={() => handleSort("avgScore")}>
                  <div className="flex items-center justify-end">
                    Score
                    <SortArrow column="avgScore" />
                  </div>
                </th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors whitespace-nowrap" onClick={() => handleSort("atp")}>
                  <div className="flex items-center justify-end">
                    ATP
                    <SortArrow column="atp" />
                  </div>
                </th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors whitespace-nowrap" onClick={() => handleSort("fulls")}>
                  <div className="flex items-center justify-end">
                    Fulls
                    <SortArrow column="fulls" />
                  </div>
                </th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors whitespace-nowrap" onClick={() => handleSort("partials")}>
                  <div className="flex items-center justify-end">
                    Partials
                    <SortArrow column="partials" />
                  </div>
                </th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors whitespace-nowrap" onClick={() => handleSort("salesWithATP")}>
                  <div className="flex items-center justify-end">
                    Sales w/ ATP
                    <SortArrow column="salesWithATP" />
                  </div>
                </th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors whitespace-nowrap" onClick={() => handleSort("spr")}>
                  <div className="flex items-center justify-end">
                    SPR %
                    <SortArrow column="spr" />
                  </div>
                </th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors whitespace-nowrap" onClick={() => handleSort("inbounds")}>
                  <div className="flex items-center justify-end">
                    Inbounds
                    <SortArrow column="inbounds" />
                  </div>
                </th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors whitespace-nowrap" onClick={() => handleSort("manuals")}>
                  <div className="flex items-center justify-end">
                    Manuals
                    <SortArrow column="manuals" />
                  </div>
                </th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors whitespace-nowrap" onClick={() => handleSort("h2s")}>
                  <div className="flex items-center justify-end">
                    H2S %
                    <SortArrow column="h2s" />
                  </div>
                </th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors whitespace-nowrap" onClick={() => handleSort("wh2s")}>
                  <div className="flex items-center justify-end">
                    WH2S %
                    <SortArrow column="wh2s" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedReps.map((rep, i) => {
                const isTopPerformer = rep.avgScore >= 85;
                const isStruggling = rep.avgScore < 65;
                return (
                  <tr key={rep.id} className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors animate-fade-up`} style={{ animationDelay: `${i * 50}ms` }}>
                    <td className="sticky left-0 bg-[#0f0a1e] px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-xs font-semibold text-white">
                          {rep.avatar}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{rep.name}</p>
                          <p className="text-xs text-gray-500">{rep.team}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      <span className="text-sm font-semibold text-white">{rep.calls}</span>
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      <span className={`text-sm font-bold font-mono ${
                        isTopPerformer ? "text-emerald-400" :
                        isStruggling ? "text-red-400" :
                        "text-amber-300"
                      }`}>
                        {rep.avgScore}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      <span className="text-sm font-semibold text-white">{rep.atp}</span>
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      <span className="text-sm font-semibold text-emerald-400">{rep.fulls}</span>
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      <span className="text-sm font-semibold text-amber-400">{rep.partials}</span>
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      <span className="text-sm font-semibold text-purple-400">{rep.salesWithATP}</span>
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="hidden sm:block w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              rep.spr >= 80 ? "bg-emerald-400" :
                              rep.spr >= 65 ? "bg-amber-400" :
                              "bg-red-400"
                            }`}
                            style={{ width: `${rep.spr}%` }}
                          />
                        </div>
                        <span className={`text-sm font-bold font-mono ${
                          rep.spr >= 80 ? "text-emerald-400" :
                          rep.spr >= 65 ? "text-amber-300" :
                          "text-red-400"
                        }`}>
                          {rep.spr}%
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      <span className="text-sm font-semibold text-white">{rep.inbounds}</span>
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      <span className="text-sm font-semibold text-white">{rep.manuals}</span>
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      <span className={`text-sm font-bold font-mono ${
                        rep.h2s >= 30 ? "text-emerald-400" :
                        rep.h2s >= 22 ? "text-amber-300" :
                        "text-red-400"
                      }`}>
                        {rep.h2s}%
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      <span className={`text-sm font-bold font-mono ${
                        rep.wh2s >= 40 ? "text-emerald-400" :
                        rep.wh2s >= 30 ? "text-amber-300" :
                        "text-red-400"
                      }`}>
                        {rep.wh2s}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <span className="text-lg">⭐</span>
          </div>
          <div>
            <p className="text-xs text-gray-400">Top Performer</p>
            <p className="text-sm font-semibold text-white">
              {DEMO_REPS.reduce((best, r) => r.avgScore > best.avgScore ? r : best, DEMO_REPS[0]).name}
            </p>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
            <span className="text-lg">📈</span>
          </div>
          <div>
            <p className="text-xs text-gray-400">Highest ATP</p>
            <p className="text-sm font-semibold text-white">
              {DEMO_REPS.reduce((best, r) => r.atp > best.atp ? r : best, DEMO_REPS[0]).name}
              {" "}
              <span className="text-purple-400">({DEMO_REPS.reduce((max, r) => Math.max(max, r.atp), 0)})</span>
            </p>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
            <span className="text-lg">🔔</span>
          </div>
          <div>
            <p className="text-xs text-gray-400">Needs Coaching</p>
            <p className="text-sm font-semibold text-white">
              {DEMO_REPS.reduce((worst, r) => r.avgScore < worst.avgScore ? r : worst, DEMO_REPS[0]).name}
            </p>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
            <span className="text-lg">📊</span>
          </div>
          <div>
            <p className="text-xs text-gray-400">Best H2S Rate</p>
            <p className="text-sm font-semibold text-white">
              {DEMO_REPS.reduce((best, r) => r.h2s > best.h2s ? r : best, DEMO_REPS[0]).name}
              {" "}
              <span className="text-blue-400">({DEMO_REPS.reduce((max, r) => Math.max(max, r.h2s), 0)}%)</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}