import { useEffect, useState } from "react";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassBadge, GlassButton, GlassInput, GlassSelect, GlassStatCard, LoadingSkeleton, EmptyState } from "~/components/GlassCard";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/executive-coaching/team-improvement")({
  component: TeamImprovement,
});

function TeamImprovement() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState("enterprise");

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      setLoading(false);
    });
  }, [navigate]);

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  const teams = [
    { id: "enterprise", name: "Enterprise Sales" },
    { id: "smb", name: "SMB Sales" },
    { id: "cs", name: "Customer Success" },
    { id: "inside", name: "Inside Sales" },
    { id: "ae", name: "Account Executives" },
  ];

  const skills = [
    { name: "Discovery", pre: 62, post: 84, avg: 78 },
    { name: "Objection Handling", pre: 55, post: 72, avg: 68 },
    { name: "Closing", pre: 58, post: 76, avg: 70 },
    { name: "Product Knowledge", pre: 70, post: 91, avg: 82 },
    { name: "Active Listening", pre: 65, post: 80, avg: 74 },
    { name: "Compliance", pre: 85, post: 94, avg: 88 },
  ];

  const completion = [
    { month: "Jan", rate: 62 },
    { month: "Feb", rate: 68 },
    { month: "Mar", rate: 72 },
    { month: "Apr", rate: 78 },
    { month: "May", rate: 81 },
    { month: "Jun", rate: 85 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/executive-coaching" className="text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&larr;</Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Team Improvement Trends</h1>
          <p className="text-sm text-gray-400">Track coaching impact and skill development over time</p>
        </div>
        <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500/50">
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Improvement Trend Chart */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="text-lg font-semibold text-white mb-4">Score Improvement Over Time</h3>
          <div className="h-48">
            <svg viewBox="0 0 400 160" className="w-full h-full">
              {[0,1,2,3].map(i => <line key={i} x1="0" y1={40 + i*30} x2="400" y2={40 + i*30} stroke="#e5e7eb" strokeWidth="1" className="dark:stroke-gray-700" />)}
              {/* Company average */}
              <polyline fill="none" stroke="#818cf8" strokeWidth="2" strokeDasharray="6,3" points="20,105 80,98 140,90 200,82 260,75 320,70 380,62" />
              {/* Team line */}
              <polyline fill="none" stroke="#22c55e" strokeWidth="3" points="20,115 80,105 140,90 200,74 260,60 320,48 380,35" />
              <polygon fill="url(#teamGradient)" points="20,115 80,105 140,90 200,74 260,60 320,48 380,35 380,160 20,160" />
              <defs>
                <linearGradient id="teamGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                </linearGradient>
              </defs>
              <text x="380" y="33" fontSize="10" fill="#22c55e" textAnchor="end">Selected Team</text>
              <text x="380" y="60" fontSize="10" fill="#818cf8" textAnchor="end">Company Avg</text>
              {["Jan","Feb","Mar","Apr","May","Jun","Jul"].map((m, i) => (
                <text key={i} x={20 + i*51} y="148" fontSize="9" fill="#9ca3af" textAnchor="middle">{m}</text>
              ))}
            </svg>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
            <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-green-500" /> Selected Team</span>
            <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-indigo-400" /> Company Average</span>
          </div>
        </div>

        {/* Coaching Completion Rates */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="text-lg font-semibold text-white mb-4">Coaching Completion Rates</h3>
          <div className="space-y-3">
            {completion.map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-8 text-xs text-gray-500">{c.month}</span>
                <div className="flex-1 h-3 rounded-full bg-white/[0.06]">
                  <div className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${c.rate}%` }} />
                </div>
                <span className="w-10 text-right text-xs font-semibold text-white">{c.rate}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Per-Skill Improvement Breakdown */}
      <div className="rounded-2xl glass-subtle transition-all duration-300">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-white">Per-Skill Improvement Breakdown</h3>
        </div>
        <div className="divide-y divide-white/5">
          {skills.map((s, i) => {
            const improvement = s.post - s.pre;
            return (
              <div key={i} className="px-6 py-4 transition-colors hover:bg-white/[0.02]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">{s.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">Pre: {s.pre}%</span>
                    <span className="text-xs font-bold text-green-600">+{improvement}%</span>
                    <span className="text-xs text-gray-400">Post: {s.post}%</span>
                    <span className="text-xs text-indigo-400">Avg: {s.avg}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-3 rounded-full bg-white/[0.06] relative overflow-hidden">
                    <div className="h-3 rounded-full bg-indigo-300 dark:bg-indigo-700" style={{ width: `${s.pre}%` }} />
                    <div className="absolute inset-0 h-3 rounded-full bg-gradient-to-r from-green-400 to-green-500" style={{ width: `${s.post}%` }} />
                    {/* Average marker */}
                    <div className="absolute top-0 h-3 w-0.5 bg-yellow-400" style={{ left: `${s.avg}%` }} />
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-1">
                  <span className="flex items-center gap-0.5"><span className="h-1.5 w-2 rounded bg-indigo-300" /> Pre</span>
                  <span className="flex items-center gap-0.5"><span className="h-1.5 w-2 rounded bg-green-500" /> Post</span>
                  <span className="flex items-center gap-0.5"><span className="h-1.5 w-0.5 bg-yellow-400" /> Company Avg</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}