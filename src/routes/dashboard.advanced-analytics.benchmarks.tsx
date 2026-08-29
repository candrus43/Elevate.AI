import { useEffect, useState } from "react";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassBadge, GlassButton, GlassInput, GlassSelect, GlassStatCard, LoadingSkeleton, EmptyState } from "~/components/GlassCard";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/advanced-analytics/benchmarks")({
  component: Benchmarks,
});

function Benchmarks() {
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

  const rankings = [
    { name: "Enterprise Sales", score: 86, benchmark: 72, gap: "+14" },
    { name: "SMB Sales", score: 79, benchmark: 72, gap: "+7" },
    { name: "Customer Success", score: 74, benchmark: 72, gap: "+2" },
    { name: "Inside Sales", score: 68, benchmark: 72, gap: "-4" },
    { name: "Account Executives", score: 62, benchmark: 72, gap: "-10" },
  ];

  const skillBenchmarks = [
    { skill: "Discovery", us: 84, industry: 72 },
    { skill: "Objection Handling", us: 72, industry: 65 },
    { skill: "Closing", us: 76, industry: 70 },
    { skill: "Product Knowledge", us: 91, industry: 78 },
    { skill: "Active Listening", us: 80, industry: 68 },
    { skill: "Compliance", us: 94, industry: 82 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/advanced-analytics" className="text-2xl text-ink-muted hover:text-gray-600 dark:hover:text-ink-muted">&larr;</Link>
        <div><h1 className="text-2xl font-bold text-ink">Benchmark Comparisons</h1><p className="text-sm text-ink-muted">Compare team performance against benchmarks</p></div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Team Rankings */}
        <div className="rounded-2xl glass-subtle transition-all duration-300">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-ink">Internal Team Rankings</h3>
          </div>
          <div className="divide-y divide-edge">
            {rankings.map((r, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-white/[0.02]">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-ink-muted"}`}>#{i+1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink">{r.name}</span>
                    <span className="text-sm font-bold text-accent-600">{r.score}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-ink-muted">Benchmark: {r.benchmark}%</span>
                    <span className={`font-medium ${r.gap.startsWith("+") ? "text-green-600" : "text-red-600"}`}>{r.gap}pts</span>
                  </div>
                  <div className="mt-1 flex gap-1">
                    <div className="flex-1 h-2 rounded-full bg-white/[0.06]">
                      <div className={`h-2 rounded-full ${r.score >= r.benchmark ? "bg-green-500" : "bg-red-500"}`} style={{ width: `${r.score}%` }} />
                    </div>
                    <div className="w-0.5 h-4 bg-yellow-400 -mt-1" style={{ marginLeft: `-${100 - r.benchmark}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Industry Benchmarks */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="text-lg font-semibold text-ink mb-4">Industry Benchmark Comparison</h3>
          <div className="space-y-4">
            {skillBenchmarks.map((s, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-ink">{s.skill}</span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-ink-muted">Industry: {s.industry}%</span>
                    <span className="text-green-600">Us: {s.us}%</span>
                  </div>
                </div>
                <div className="h-3 rounded-full bg-white/[0.06] relative overflow-hidden">
                  <div className="h-3 rounded-full bg-accent-300" style={{ width: `${s.industry}%` }} />
                  <div className="absolute inset-0 h-3 rounded-full bg-gradient-to-r from-green-400 to-green-500" style={{ width: `${s.us}%` }} />
                </div>
                <div className="text-[10px] text-green-600 mt-0.5">+{s.us - s.industry}pt ahead of industry</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}