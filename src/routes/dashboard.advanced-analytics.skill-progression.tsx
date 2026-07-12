import { useEffect, useState } from "react";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassBadge, GlassButton, GlassInput, GlassSelect, GlassStatCard, LoadingSkeleton, EmptyState } from "~/components/GlassCard";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/advanced-analytics/skill-progression")({
  component: SkillProgression,
});

function SkillProgression() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState("discovery");

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      setLoading(false);
    });
  }, [navigate]);

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  const skills = [
    { id: "discovery", label: "Discovery Questions" },
    { id: "objection", label: "Objection Handling" },
    { id: "closing", label: "Closing" },
    { id: "product", label: "Product Knowledge" },
    { id: "listening", label: "Active Listening" },
    { id: "compliance", label: "Compliance" },
  ];

  const repProgression = [
    { name: "Alex Johnson", current: 84, prev: 62, trend: "improving" as const },
    { name: "Maria Garcia", current: 72, prev: 55, trend: "improving" as const },
    { name: "James Wilson", current: 76, prev: 58, trend: "improving" as const },
    { name: "Sarah Thompson", current: 68, prev: 65, trend: "stable" as const },
    { name: "David Kim", current: 60, prev: 62, trend: "declining" as const },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/advanced-analytics" className="text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&larr;</Link>
        <div className="flex-1"><h1 className="text-2xl font-bold text-white">Skill Progression</h1><p className="text-sm text-gray-400">Track skill development over time</p></div>
        <select value={selectedSkill} onChange={(e) => setSelectedSkill(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500/50">
          {skills.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Progression Chart */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="text-lg font-semibold text-white mb-4">Progression Over Time</h3>
          <div className="h-48">
            <svg viewBox="0 0 400 160" className="w-full h-full">
              {[0,1,2,3].map(i => <line key={i} x1="0" y1={40 + i*30} x2="400" y2={40 + i*30} stroke="#e5e7eb" strokeWidth="1" className="dark:stroke-gray-700" />)}
              {/* Team average */}
              <polyline fill="none" stroke="#818cf8" strokeWidth="2" strokeDasharray="6,3" points="20,105 80,98 140,90 200,82 260,75 320,70 380,62" />
              {/* Skill progression */}
              <polyline fill="none" stroke="#22c55e" strokeWidth="3" points="20,120 80,108 140,92 200,76 260,62 320,50 380,38" />
              <polygon fill="url(#skillGrad)" points="20,120 80,108 140,92 200,76 260,62 320,50 380,38 380,160 20,160" />
              <defs>
                <linearGradient id="skillGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                </linearGradient>
              </defs>
              <text x="380" y="60" fontSize="10" fill="#818cf8" textAnchor="end">Team Avg</text>
              <text x="380" y="36" fontSize="10" fill="#22c55e" textAnchor="end">Skill Score</text>
              {["Jan","Feb","Mar","Apr","May","Jun","Jul"].map((m, i) => (
                <text key={i} x={20 + i*51} y="148" fontSize="9" fill="#9ca3af" textAnchor="middle">{m}</text>
              ))}
            </svg>
          </div>
        </div>

        {/* Trend Summary */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="text-sm font-semibold text-white mb-4">Trend Summary</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Current Avg</span>
              <span className="text-lg font-bold text-white">76%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">3 Months Ago</span>
              <span className="text-lg font-bold text-gray-400">62%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Overall Change</span>
              <span className="text-lg font-bold text-green-600">+14%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">vs Team Avg</span>
              <span className="text-lg font-bold text-indigo-600">+2%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Per-Rep Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {repProgression.map((rep, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <p className="text-sm font-medium text-white mb-2">{rep.name}</p>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold text-white">{rep.current}%</span>
              <span className={`text-xs font-bold ${
                rep.trend === "improving" ? "text-green-600" : rep.trend === "stable" ? "text-amber-600" : "text-red-600"
              }`}>
                {rep.trend === "improving" ? "↑" : rep.trend === "stable" ? "→" : "↓"}
                {rep.current - rep.prev >= 0 ? "+" : ""}{rep.current - rep.prev}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
              <span className="text-gray-400">Prev: {rep.prev}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06]">
              <div className={`h-1.5 rounded-full ${
                rep.trend === "improving" ? "bg-green-500" : rep.trend === "stable" ? "bg-amber-500" : "bg-red-500"
              }`} style={{ width: `${rep.current}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}