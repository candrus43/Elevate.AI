import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassStatCard, GlassBadge, GlassButton, GlassSelect, LoadingSkeleton } from "~/components/GlassCard";

export const Route = createFileRoute("/dashboard/executive-coaching")({
  component: ExecutiveCoachingDashboard,
});

function ExecutiveCoachingDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      setLoading(false);
    });
  }, [navigate]);

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  const kpis = [
    { label: "Coaching Effectiveness", value: "84%", change: "+5.2%", color: "from-emerald-500 to-green-600" },
    { label: "Manager Effectiveness", value: "76", change: "+3.8%", color: "from-blue-500 to-cyan-600" },
    { label: "Team Improvement", value: "68%", change: "+12%", color: "from-violet-500 to-purple-600" },
    { label: "Coaching ROI", value: "312%", change: "+48%", color: "from-amber-500 to-orange-600" },
  ];

  const managers = [
    { name: "Sarah Mitchell", team: "Enterprise Sales", effectiveness: 92, sessions: 48, improvement: 18 },
    { name: "David Chen", team: "SMB Sales", effectiveness: 85, sessions: 36, improvement: 14 },
    { name: "Jessica Park", team: "Customer Success", effectiveness: 78, sessions: 29, improvement: 11 },
    { name: "Michael Torres", team: "Inside Sales", effectiveness: 72, sessions: 22, improvement: 8 },
    { name: "Rachel Kim", team: "Account Executives", effectiveness: 65, sessions: 18, improvement: 5 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Executive Coaching Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Coaching effectiveness metrics and organizational insights</p>
        </div>
        <GlassSelect value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="quarter">This Quarter</option>
        </GlassSelect>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <GlassStatCard key={i} label={kpi.label} value={kpi.value} change={kpi.change} color={kpi.color} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Coaching Effectiveness Trend */}
        <GlassCard className="lg:col-span-2">
          <GlassCardHeader>
            <h3 className="text-lg font-semibold text-white">Coaching Effectiveness Trend</h3>
          </GlassCardHeader>
          <GlassCardBody>
            <div className="p-5 sm:p-6">
              <div className="h-48">
                <svg viewBox="0 0 400 160" className="w-full h-full">
                  {[0,1,2,3].map(i => <line key={i} x1="0" y1={40 + i*30} x2="400" y2={40 + i*30} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />)}
                  <polyline fill="none" stroke="#818cf8" strokeWidth="2.5" points="20,120 80,115 140,108 200,100 260,95 320,88 380,82" className="opacity-60" />
                  <polyline fill="none" stroke="#22c55e" strokeWidth="3" points="20,110 80,95 140,78 200,60 260,50 320,42 380,32" />
                  <polygon fill="url(#coachingGradient)" points="20,110 80,95 140,78 200,60 260,50 320,42 380,32 380,160 20,160" />
                  <defs>
                    <linearGradient id="coachingGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <text x="380" y="30" fontSize="10" fill="#22c55e" textAnchor="end">Post-coaching</text>
                  <text x="380" y="80" fontSize="10" fill="#818cf8" textAnchor="end">Pre-coaching</text>
                  {["Jan","Feb","Mar","Apr","May","Jun","Jul"].map((m, i) => (
                    <text key={i} x={20 + i*51} y="148" fontSize="9" fill="#6b7280" textAnchor="middle">{m}</text>
                  ))}
                </svg>
              </div>
            </div>
          </GlassCardBody>
        </GlassCard>

        {/* Manager Leaderboard */}
        <GlassCard>
          <GlassCardHeader>
            <h3 className="text-sm font-semibold text-white">Manager Effectiveness</h3>
          </GlassCardHeader>
          <GlassCardBody divide>
            {managers.map((m, i) => (
              <GlassCardRow key={i}>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-500 w-5">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{m.name}</p>
                    <p className="text-xs text-gray-500">{m.team}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">{m.effectiveness}%</p>
                  <p className="text-xs text-green-400">+{m.improvement}%</p>
                </div>
              </GlassCardRow>
            ))}
          </GlassCardBody>
        </GlassCard>
      </div>
    </div>
  );
}