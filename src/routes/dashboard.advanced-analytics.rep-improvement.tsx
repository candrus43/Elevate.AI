import { useEffect, useState } from "react";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassBadge, GlassButton, GlassInput, GlassSelect, GlassStatCard, LoadingSkeleton, EmptyState } from "~/components/GlassCard";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/advanced-analytics/rep-improvement")({
  component: RepImprovement,
});

function RepImprovement() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRep, setSelectedRep] = useState("r1");

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      setLoading(false);
    });
  }, [navigate]);

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  const reps = [
    { id: "r1", name: "Alex Johnson" },
    { id: "r2", name: "Maria Garcia" },
    { id: "r3", name: "James Wilson" },
    { id: "r4", name: "Sarah Thompson" },
    { id: "r5", name: "David Kim" },
  ];

  const skills = [
    { name: "Discovery", before: 62, after: 84, change: "+22" },
    { name: "Objection Handling", before: 55, after: 72, change: "+17" },
    { name: "Closing", before: 58, after: 76, change: "+18" },
    { name: "Product Knowledge", before: 70, after: 91, change: "+21" },
    { name: "Active Listening", before: 65, after: 80, change: "+15" },
    { name: "Compliance", before: 85, after: 94, change: "+9" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/advanced-analytics" className="text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&larr;</Link>
        <div className="flex-1"><h1 className="text-2xl font-bold text-white">Rep Improvement</h1><p className="text-sm text-gray-400">Track individual rep coaching progress</p></div>
        <select value={selectedRep} onChange={(e) => setSelectedRep(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500/50">
          {reps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Timeline */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="text-lg font-semibold text-white mb-4">Improvement Timeline</h3>
          <div className="h-48">
            <svg viewBox="0 0 400 160" className="w-full h-full">
              {[0,1,2,3].map(i => <line key={i} x1="0" y1={40 + i*30} x2="400" y2={40 + i*30} stroke="#e5e7eb" strokeWidth="1" className="dark:stroke-gray-700" />)}
              <polyline fill="none" stroke="#22c55e" strokeWidth="3" points="20,140 80,125 140,108 200,90 260,72 320,55 380,38" />
              <polygon fill="url(#repGrad)" points="20,140 80,125 140,108 200,90 260,72 320,55 380,38 380,160 20,160" />
              <defs>
                <linearGradient id="repGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                </linearGradient>
              </defs>
              <circle cx="140" cy="108" r="5" fill="#22c55e" stroke="#fff" strokeWidth="2" />
              <circle cx="200" cy="90" r="5" fill="#22c55e" stroke="#fff" strokeWidth="2" />
              <circle cx="320" cy="55" r="5" fill="#22c55e" stroke="#fff" strokeWidth="2" />
              {["Jan","Feb","Mar","Apr","May","Jun","Jul"].map((m, i) => (
                <text key={i} x={20 + i*51} y="148" fontSize="9" fill="#9ca3af" textAnchor="middle">{m}</text>
              ))}
            </svg>
          </div>
        </div>

        {/* Coaching ROI */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="text-sm font-semibold text-white mb-4">Coaching Impact</h3>
          <div className="space-y-4">
            {[
              { label: "Total Sessions", value: "24" },
              { label: "Score Improvement", value: "+18%", color: "text-green-600" },
              { label: "Coaching ROI", value: "425%" },
              { label: "Hours Invested", value: "12h" },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between border-b border-gray-100 pb-2 dark:border-gray-800 last:border-0">
                <span className="text-xs text-gray-500">{s.label}</span>
                <span className={`text-sm font-bold ${s.color || "text-white"}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Skill Breakdown */}
      <div className="rounded-2xl glass-subtle transition-all duration-300">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-white">Skill-by-Skill Breakdown</h3>
        </div>
        <div className="divide-y divide-white/5">
          {skills.map((s, i) => (
            <div key={i} className="px-6 py-4 transition-colors hover:bg-white/[0.02]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">{s.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">Before: {s.before}%</span>
                  <span className="text-xs font-bold text-green-600">+{s.change}</span>
                  <span className="text-xs text-gray-400">After: {s.after}%</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-3 rounded-full bg-white/[0.06] relative overflow-hidden">
                  <div className="h-3 rounded-full bg-indigo-300" style={{ width: `${s.before}%` }} />
                  <div className="absolute inset-0 h-3 rounded-full bg-gradient-to-r from-green-400 to-green-500" style={{ width: `${s.after}%` }} />
                </div>
                <span className="text-xs text-green-600">{s.change}pts ↑</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}