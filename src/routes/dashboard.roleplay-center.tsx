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
  const [personalities, setPersonalities] = useState<any[]>([]);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      loadData();
    });
  }, [navigate]);

  const loadData = async () => {
    try {
      const [personalitiesRes, historyRes] = await Promise.all([
        fetch("/api/roleplay-center/personalities"),
        fetch("/api/roleplay-center/history"),
      ]);
      if (personalitiesRes.ok) {
        const data = await personalitiesRes.json();
        if (data.personalities?.length > 0) setPersonalities(data.personalities);
      }
      if (historyRes.ok) {
        const data = await historyRes.json();
        if (data.sessions) setSessionHistory(data.sessions);
      }
    } catch (e) {
      console.error("Failed to load roleplay data:", e);
    } finally {
      setLoading(false);
    }
  };

  const scenarios = [
    { id: "discovery", label: "Discovery Call", icon: "🔍", desc: "Qualify leads and uncover needs" },
    { id: "objection", label: "Objection Handling", icon: "🛡️", desc: "Handle common objections" },
    { id: "closing", label: "Closing", icon: "🎯", desc: "Practice closing techniques" },
    { id: "demo", label: "Product Demo", icon: "📱", desc: "Deliver compelling demos" },
    { id: "negotiation", label: "Negotiation", icon: "🤝", desc: "Navigate pricing discussions" },
    { id: "cold-call", label: "Cold Call", icon: "📞", desc: "Master cold outreach" },
  ];

  const personalityColors = [
    "from-pink-500 to-rose-500",
    "from-blue-500 to-cyan-500",
    "from-purple-500 to-indigo-500",
    "from-green-500 to-emerald-500",
    "from-amber-500 to-orange-500",
    "from-teal-500 to-cyan-500",
    "from-red-500 to-rose-500",
  ];

  const getAvatar = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const getColor = (i: number) => personalityColors[i % personalityColors.length];
  const getDifficultyColor = (d: string) => {
    const dLower = (d || "").toLowerCase();
    return dLower === "easy" ? "green" : dLower === "hard" ? "amber" : dLower === "expert" ? "red" : "blue";
  };

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
            {personalities.slice(0, 3).map((p, i) => (
              <button
                key={p.id}
                onClick={() => navigate({ to: `/dashboard/roleplay-center/session/new-${p.id}` })}
                className="rounded-2xl p-4 text-left transition-all duration-300 hover:border-purple-500/20 hover:translate-y-[-1px]"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(139,92,246,0.04) 50%, rgba(255,255,255,0.02) 100%)",
                  backdropFilter: "blur(24px)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-white">{p.name}</span>
                  <GlassBadge color={getDifficultyColor(p.difficulty)}>{p.difficulty || "Medium"}</GlassBadge>
                </div>
                <p className="text-xs text-gray-500">{p.industry || "General"}</p>
                <p className="text-xs text-purple-400 mt-1">{p.description?.slice(0, 60) || "Practice with this personality"}</p>
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Personalities */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Customer Personalities</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {personalities.map((p, i) => (
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
                <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${getColor(i)} text-sm font-bold text-white shadow-lg`}>{getAvatar(p.name)}</div>
                <div>
                  <p className="font-medium text-white group-hover:text-purple-300 transition-colors">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.tone || "Sales Prospect"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <GlassBadge color={getDifficultyColor(p.difficulty)}>{p.difficulty || "Medium"}</GlassBadge>
                <span className="text-gray-500">{p.industry || "General"}</span>
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
                    {getAvatar(s.personality_name || "Customer")}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{s.personality_name || "Customer"}</p>
                    <p className="text-xs text-gray-500">{s.scenario_type || "Discovery"} · {s.difficulty || "Medium"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${s.overall_score >= 80 ? "text-green-400" : s.overall_score >= 60 ? "text-amber-400" : "text-red-400"}`}>{s.overall_score || "—"}%</span>
                  <span className="text-xs text-gray-500">{s.created_at ? new Date(s.created_at).toLocaleDateString() : ""}</span>
                  <GlassButton
                    variant="ghost"
                    className="!px-2.5 !py-1.5 !text-xs"
                    onClick={() => navigate({ to: `/dashboard/roleplay-center/results/${s.id}` })}
                  >View</GlassButton>
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
                  {personalities.map((p, i) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPersonality(p.id)}
                      className="flex items-center gap-2 rounded-xl p-2.5 text-left transition-all duration-200"
                      style={{
                        background: selectedPersonality === p.id ? "rgba(139, 92, 246, 0.15)" : "rgba(255, 255, 255, 0.05)",
                        border: selectedPersonality === p.id ? "1px solid rgba(139, 92, 246, 0.3)" : "1px solid rgba(255, 255, 255, 0.08)",
                      }}
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getColor(i)} text-xs font-bold text-white`}>{getAvatar(p.name)}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.difficulty || "Medium"}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <GlassButton
                onClick={() => { setShowNewModal(false); navigate({ to: `/dashboard/roleplay-center/session/new-${selectedPersonality || personalities[0]?.id || "default"}` }); }}
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