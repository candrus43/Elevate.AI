import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassBadge, GlassButton, GlassSelect, GlassInput, LoadingSkeleton } from "~/components/GlassCard";

export const Route = createFileRoute("/dashboard/roleplay-center")({
  component: RolePlayCenter,
});

function RolePlayCenter() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>("discovery");
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedPersonality, setSelectedPersonality] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      setLoading(false);
    });
  }, [navigate]);

  const scenarios = [
    { id: "discovery", label: "Discovery Call", icon: "🔍", desc: "Qualify leads and uncover needs" },
    { id: "objection", label: "Objection Handling", icon: "🛡️", desc: "Handle common objections" },
    { id: "closing", label: "Closing", icon: "🎯", desc: "Practice closing techniques" },
    { id: "demo", label: "Product Demo", icon: "📱", desc: "Deliver compelling demos" },
    { id: "negotiation", label: "Negotiation", icon: "🤝", desc: "Navigate pricing discussions" },
    { id: "cold-call", label: "Cold Call", icon: "📞", desc: "Master cold outreach" },
  ];

  const personalities = [
    { id: "p1", name: "Sarah Chen", role: "Procurement Director", difficulty: "Medium", industry: "SaaS", avatar: "SC", color: "from-pink-500 to-rose-500" },
    { id: "p2", name: "Mark Johnson", role: "CTO", difficulty: "Hard", industry: "Enterprise Tech", avatar: "MJ", color: "from-blue-500 to-cyan-500" },
    { id: "p3", name: "Lisa Park", role: "VP of Sales", difficulty: "Medium", industry: "SaaS", avatar: "LP", color: "from-purple-500 to-indigo-500" },
    { id: "p4", name: "Tom Wilson", role: "Small Business Owner", difficulty: "Easy", industry: "Retail", avatar: "TW", color: "from-green-500 to-emerald-500" },
    { id: "p5", name: "Dr. Emily Ross", role: "Hospital Admin", difficulty: "Hard", industry: "Healthcare", avatar: "ER", color: "from-amber-500 to-orange-500" },
    { id: "p6", name: "James Liu", role: "VP Engineering", difficulty: "Medium", industry: "FinTech", avatar: "JL", color: "from-teal-500 to-cyan-500" },
    { id: "p7", name: "Rachel Kim", role: "CEO", difficulty: "Expert", industry: "Startup", avatar: "RK", color: "from-red-500 to-rose-500" },
  ];

  const sessionHistory = [
    { id: "s1", personality: "Sarah Chen", type: "Discovery", score: 82, date: "2 days ago", duration: "12 min" },
    { id: "s2", personality: "Mark Johnson", type: "Objection Handling", score: 65, date: "5 days ago", duration: "15 min" },
    { id: "s3", personality: "Tom Wilson", type: "Cold Call", score: 91, date: "1 week ago", duration: "8 min" },
    { id: "s4", personality: "Dr. Emily Ross", type: "Negotiation", score: 73, date: "2 weeks ago", duration: "18 min" },
  ];

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Role Play Center</h1>
          <p className="text-sm text-gray-400 mt-1">Practice sales scenarios with AI-powered customer personalities</p>
        </div>
        <GlassButton onClick={() => setShowNewModal(true)} variant="primary">+ Start New Roleplay</GlassButton>
      </div>

      {/* Scenario Types */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Select Scenario Type</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {scenarios.map((s) => (
            <button
              key={s.id}
              onClick={() => { setSelectedType(s.id); setShowNewModal(true); }}
              className="rounded-2xl p-4 text-center transition-all duration-300 hover:border-purple-500/20 hover:translate-y-[-1px]"
              style={{
                background: selectedType === s.id
                  ? "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(99,102,241,0.08) 100%)"
                  : "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(139,92,246,0.04) 50%, rgba(255,255,255,0.02) 100%)",
                backdropFilter: "blur(24px)",
                border: selectedType === s.id ? "1px solid rgba(139, 92, 246, 0.3)" : "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <span className="text-2xl block mb-1">{s.icon}</span>
              <p className="text-sm font-medium text-white">{s.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recommended Scenarios */}
      <GlassCard className="overflow-hidden" hover={false}>
        <div className="p-5" style={{
          background: "linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(99,102,241,0.04) 100%)",
        }}>
          <h3 className="text-sm font-semibold text-white mb-3">Recommended for You</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { title: "Objection: Price Pushback", personality: "Mark Johnson", difficulty: "Hard", reason: "Improve objection handling skills" },
              { title: "Discovery: SaaS Prospect", personality: "Sarah Chen", difficulty: "Medium", reason: "Practice qualification questions" },
              { title: "Closing: Enterprise Deal", personality: "Rachel Kim", difficulty: "Expert", reason: "Master executive communication" },
            ].map((rec, i) => (
              <button
                key={i}
                onClick={() => { setSelectedPersonality(rec.personality); navigate({ to: `/dashboard/roleplay-center/session/new-${i}` }); }}
                className="rounded-2xl p-4 text-left transition-all duration-300 hover:border-purple-500/20 hover:translate-y-[-1px]"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(139,92,246,0.04) 50%, rgba(255,255,255,0.02) 100%)",
                  backdropFilter: "blur(24px)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-white">{rec.title}</span>
                  <GlassBadge color="amber">{rec.difficulty}</GlassBadge>
                </div>
                <p className="text-xs text-gray-500">vs {rec.personality}</p>
                <p className="text-xs text-purple-400 mt-1">{rec.reason}</p>
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Personalities */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Customer Personalities</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {personalities.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate({ to: `/dashboard/roleplay-center/session/new-${p.id}` })}
              className="group rounded-2xl p-4 text-left transition-all duration-300 hover:border-purple-500/20 hover:translate-y-[-1px]"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(139,92,246,0.04) 50%, rgba(255,255,255,0.02) 100%)",
                backdropFilter: "blur(24px)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${p.color} text-sm font-bold text-white shadow-lg`}>{p.avatar}</div>
                <div>
                  <p className="font-medium text-white group-hover:text-purple-300 transition-colors">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <GlassBadge color={
                  p.difficulty === "Easy" ? "green" :
                  p.difficulty === "Medium" ? "blue" :
                  p.difficulty === "Hard" ? "amber" : "red"
                }>{p.difficulty}</GlassBadge>
                <span className="text-gray-500">{p.industry}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Session History */}
      <GlassCard>
        <GlassCardHeader>
          <h3 className="text-lg font-semibold text-white">Session History</h3>
          <GlassSelect className="!w-auto" defaultValue="All Types">
            <option>All Types</option>
            <option>Discovery</option>
            <option>Objection</option>
            <option>Closing</option>
          </GlassSelect>
        </GlassCardHeader>
        <GlassCardBody divide>
          {sessionHistory.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-gray-500">No sessions yet. Start your first roleplay!</div>
          ) : (
            sessionHistory.map((s) => (
              <GlassCardRow key={s.id}>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-xs font-bold text-white shadow-lg shadow-purple-500/20">
                    {s.personality.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{s.personality}</p>
                    <p className="text-xs text-gray-500">{s.type} · {s.duration}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${s.score >= 80 ? "text-green-400" : s.score >= 60 ? "text-amber-400" : "text-red-400"}`}>{s.score}%</span>
                  <span className="text-xs text-gray-500">{s.date}</span>
                  <GlassButton variant="ghost" className="!px-2.5 !py-1.5 !text-xs" href={`/dashboard/roleplay-center/results/${s.id}`}>View</GlassButton>
                </div>
              </GlassCardRow>
            ))
          )}
        </GlassCardBody>
      </GlassCard>

      {/* Start New Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <GlassCard className="w-full max-w-lg" hover={false}>
            <GlassCardHeader>
              <h3 className="text-lg font-semibold text-white">New Roleplay Session</h3>
              <button onClick={() => setShowNewModal(false)} className="text-2xl text-gray-400 hover:text-white transition-colors">&times;</button>
            </GlassCardHeader>
            <div className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Scenario Type</label>
                <GlassSelect value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="!w-full">
                  {scenarios.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </GlassSelect>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Customer Personality</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {personalities.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPersonality(p.id)}
                      className="flex items-center gap-2 rounded-xl p-2.5 text-left transition-all duration-200"
                      style={{
                        background: selectedPersonality === p.id ? "rgba(139, 92, 246, 0.15)" : "rgba(255, 255, 255, 0.05)",
                        border: selectedPersonality === p.id ? "1px solid rgba(139, 92, 246, 0.3)" : "1px solid rgba(255, 255, 255, 0.08)",
                      }}
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${p.color} text-xs font-bold text-white`}>{p.avatar}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.difficulty}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <GlassButton
                onClick={() => { setShowNewModal(false); navigate({ to: `/dashboard/roleplay-center/session/new-${selectedPersonality || "p1"}` }); }}
                variant="primary"
                className="!w-full"
              >
                Start Session
              </GlassButton>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}