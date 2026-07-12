import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassStatCard, GlassBadge, GlassButton, LoadingSkeleton } from "~/components/GlassCard";

export const Route = createFileRoute("/dashboard/advanced-analytics")({
  component: AdvancedAnalytics,
});

function AdvancedAnalytics() {
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

  const kpis = [
    { label: "Total Improvement", value: "+14.2%", change: "+3.2%", color: "from-emerald-500 to-green-600" },
    { label: "Coaching ROI", value: "312%", change: "+48%", color: "from-violet-500 to-purple-600" },
    { label: "Avg Skill Gain", value: "+18 pts", change: "+4 pts", color: "from-blue-500 to-cyan-600" },
    { label: "Forecasted Growth", value: "+22%", change: "+5%", color: "from-amber-500 to-orange-600" },
  ];

  const quickLinks = [
    { label: "Rep Improvement", href: "/dashboard/advanced-analytics/rep-improvement", icon: "📈" },
    { label: "Coaching ROI", href: "/dashboard/advanced-analytics/coaching-roi", icon: "💰" },
    { label: "Skill Progression", href: "/dashboard/advanced-analytics/skill-progression", icon: "📊" },
    { label: "Team Heatmaps", href: "/dashboard/advanced-analytics/team-heatmaps", icon: "🗺️" },
    { label: "AI Impact", href: "/dashboard/advanced-analytics/ai-impact", icon: "🤖" },
    { label: "Benchmarks", href: "/dashboard/advanced-analytics/benchmarks", icon: "🏆" },
    { label: "Forecasts", href: "/dashboard/advanced-analytics/forecasts", icon: "🔮" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Advanced Coaching Analytics</h1>
        <p className="text-sm text-gray-400 mt-1">Deep insights into coaching performance and impact</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <GlassStatCard key={i} label={kpi.label} value={kpi.value} change={kpi.change} color={kpi.color} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Quick Links */}
        <div className="space-y-2">
          {quickLinks.map((link, i) => (
            <Link
              key={i}
              to={link.href}
              className="flex items-center gap-3 rounded-2xl p-3.5 transition-all duration-300 hover:border-purple-500/20 hover:translate-y-[-1px]"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(139,92,246,0.04) 50%, rgba(255,255,255,0.02) 100%)",
                backdropFilter: "blur(24px)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <span className="text-lg">{link.icon}</span>
              <span className="text-sm font-medium text-gray-300">{link.label}</span>
            </Link>
          ))}
        </div>

        {/* Rep Improvement Timeline */}
        <GlassCard className="lg:col-span-2">
          <GlassCardHeader>
            <h3 className="text-lg font-semibold text-white">Rep Improvement Timeline</h3>
          </GlassCardHeader>
          <GlassCardBody>
            <div className="p-5 sm:p-6">
              <div className="h-48">
                <svg viewBox="0 0 400 160" className="w-full h-full">
                  {[0,1,2,3].map(i => <line key={i} x1="0" y1={40 + i*30} x2="400" y2={40 + i*30} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />)}
                  <polyline fill="none" stroke="#818cf8" strokeWidth="2.5" points="20,130 80,118 140,105 200,88 260,75 320,60 380,48" />
                  <polygon fill="url(#improveGrad)" points="20,130 80,118 140,105 200,88 260,75 320,60 380,48 380,160 20,160" />
                  <defs>
                    <linearGradient id="improveGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[{ x: 80, y: 118, label: "⚡" }, { x: 200, y: 88, label: "🎯" }, { x: 320, y: 60, label: "🏆" }].map((m, i) => (
                    <g key={i}>
                      <circle cx={m.x} cy={m.y} r="5" fill="#818cf8" stroke="#1a1f2e" strokeWidth="2" />
                      <text x={m.x} y={m.y - 10} fontSize="10" textAnchor="middle" fill="#9ca3af">{m.label}</text>
                    </g>
                  ))}
                  {["Jan","Feb","Mar","Apr","May","Jun","Jul"].map((m, i) => (
                    <text key={i} x={20 + i*51} y="148" fontSize="9" fill="#6b7280" textAnchor="middle">{m}</text>
                  ))}
                </svg>
              </div>
            </div>
          </GlassCardBody>
        </GlassCard>
      </div>
    </div>
  );
}