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
  const [personalities, setPersonalities] = useState<any[]>([]);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<string>("discovery");
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedPersonality, setSelectedPersonality] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      loadData();
    });
  }, [navigate]);

  async function loadData() {
    try {
      // Fetch personalities from API
      const [personalityRes, historyRes] = await Promise.all([
        fetch("/api/roleplay-center/personalities"),
        fetch("/api/roleplay-center/history"),
      ]);
      const personalityData = await personalityRes.json();
      const historyData = await historyRes.json();
      setPersonalities(personalityData.personalities || []);
      setSessionHistory(historyData.sessions || []);
    } catch (e) {
      console.error("Failed to load roleplay data:", e);
    } finally {
      setLoading(false);
    }
  }

  const scenarios = [
    { id: "discovery", label: "Discovery Call", icon: "🔍", desc: "Qualify leads and uncover needs" },
    { id: "objection", label: "Objection Handling", icon: "🛡️", desc: "Handle common objections" },
    { id: "closing", label: "Closing", icon: "🎯", desc: "Practice closing techniques" },
    { id: "demo", label: "Product Demo", icon: "📱", desc: "Deliver compelling demos" },
    { id: "negotiation", label: "Negotiation", icon: "🤝", desc: "Navigate pricing discussions" },
    { id: "cold-call", label: "Cold Call", icon: "📞", desc: "Master cold outreach" },
  ];

  function getPersonalityColor(name: string): string {
    const colors = [
      "from-pink-500 to-rose-500",
      "from-blue-500 to-cyan-500",
      "from-accent-500 to-accent-500",
      "from-green-500 to-emerald-500",
      "from-amber-500 to-orange-500",
      "from-teal-500 to-cyan-500",
      "from-red-500 to-rose-500",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }

  function getInitials(name: string): string {
    return name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  }

  function getDifficultyColor(difficulty: string): "green" | "blue" | "amber" | "red" {
    if (difficulty === "easy") return "green";
    if (difficulty === "medium") return "blue";
    if (difficulty === "hard") return "amber";
    return "red";
  }

  function startNewSession(personalityId: string | null) {
    const id = personalityId || "default";
    navigate({ to: `/dashboard/roleplay-center/session/new-${id}` });
  }

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">AI Role Play Center</h1>
          <p className="text-sm text-ink-muted mt-1">Practice sales scenarios with AI-powered customer personalities</p>
        </div>
        <GlassButton onClick={() => setShowNewModal(true)} variant="primary">+ Start New Roleplay</GlassButton>
      </div>

      {/* Scenario Types */}
      <div>
        <h3 className="text-sm font-semibold text-ink mb-3">Select Scenario Type</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {scenarios.map((s) => (
            <button
              key={s.id}
              onClick={() => { setSelectedType(s.id); setShowNewModal(true); }}
              className="rounded-2xl p-4 text-center transition-all duration-300 hover:border-accent-500/25 hover:translate-y-[-1px]"
              style={{
                background: selectedType === s.id
                  ? "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(99,102,241,0.08) 100%)"
                  : "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(139,92,246,0.04) 50%, rgba(255,255,255,0.02) 100%)",
                backdropFilter: "blur(24px)",
                border: selectedType === s.id ? "1px solid rgba(139, 92, 246, 0.3)" : "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <span className="text-2xl block mb-1">{s.icon}</span>
              <p className="text-sm font-medium text-ink">{s.label}</p>
              <p className="text-xs text-ink-faint mt-0.5">{s.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recommended Scenarios */}
      <GlassCard className="overflow-hidden" hover={false}>
        <div className="p-5" style={{
          background: "linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(99,102,241,0.04) 100%)",
        }}>
          <h3 className="text-sm font-semibold text-ink mb-3">Recommended for You</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {personalities.slice(0, 3).map((p, i) => (
              <button
                key={p.id}
                onClick={() => startNewSession(p.id)}
                className="rounded-2xl p-4 text-left transition-all duration-300 hover:border-accent-500/25 hover:translate-y-[-1px]"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(139,92,246,0.04) 50%, rgba(255,255,255,0.02) 100%)",
                  backdropFilter: "blur(24px)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-ink">Practice with {p.name}</span>
                  <GlassBadge color={getDifficultyColor(p.difficulty)}>{p.difficulty}</GlassBadge>
                </div>
                <p className="text-xs text-ink-faint">{p.industry}</p>
                <p className="text-xs text-accent-300 mt-1">{p.description?.slice(0, 60)}...</p>
              </button>
            ))}
            {personalities.length === 0 && (
              <>
                <div className="rounded-2xl p-4 text-left" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-sm font-medium text-ink">Objection: Price Pushback</p>
                  <p className="text-xs text-ink-faint mt-1">Practice handling price objections</p>
                </div>
                <div className="rounded-2xl p-4 text-left" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-sm font-medium text-ink">Discovery: SaaS Prospect</p>
                  <p className="text-xs text-ink-faint mt-1">Practice qualification questions</p>
                </div>
                <div className="rounded-2xl p-4 text-left" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-sm font-medium text-ink">Closing: Enterprise Deal</p>
                  <p className="text-xs text-ink-faint mt-1">Master executive communication</p>
                </div>
              </>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Personalities */}
      <div>
        <h3 className="text-sm font-semibold text-ink mb-3">Customer Personalities</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {personalities.length === 0 ? (
            <p className="text-sm text-ink-faint col-span-full text-center py-8">Loading personalities...</p>
          ) : (
            personalities.map((p) => (
              <button
                key={p.id}
                onClick={() => startNewSession(p.id)}
                className="group rounded-2xl p-4 text-left transition-all duration-300 hover:border-accent-500/25 hover:translate-y-[-1px]"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(139,92,246,0.04) 50%, rgba(255,255,255,0.02) 100%)",
                  backdropFilter: "blur(24px)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${getPersonalityColor(p.name)} text-sm font-bold text-ink shadow-lg`}>
                    {getInitials(p.name)}
                  </div>
                  <div>
                    <p className="font-medium text-ink group-hover:text-accent-300 transition-colors">{p.name}</p>
                    <p className="text-xs text-ink-faint capitalize">{p.industry}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <GlassBadge color={getDifficultyColor(p.difficulty)}>{p.difficulty}</GlassBadge>
                  <span className="text-ink-faint capitalize">{p.tone}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Session History */}
      <GlassCard>
        <GlassCardHeader>
          <h3 className="text-lg font-semibold text-ink">Session History</h3>
        </GlassCardHeader>
        <GlassCardBody divide>
          {sessionHistory.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-ink-faint">No sessions yet. Start your first roleplay!</div>
          ) : (
            sessionHistory.map((s: any) => (
              <GlassCardRow key={s.id}>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-600 text-xs font-bold text-white shadow-lg shadow-accent-500/20">
                    {getInitials(s.personality_name || "??")}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink">{s.personality_name || "Unknown"}</p>
                    <p className="text-xs text-ink-faint capitalize">{s.scenario_type} · {s.difficulty}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {s.overall_score && (
                    <span className={`text-sm font-bold ${s.overall_score >= 80 ? "text-green-400" : s.overall_score >= 60 ? "text-amber-400" : "text-red-400"}`}>
                      {s.overall_score}%
                    </span>
                  )}
                  <span className="text-xs text-ink-faint">{s.status === "completed" ? "Completed" : "In Progress"}</span>
                  <GlassButton variant="ghost" className="!px-2.5 !py-1.5 !text-xs" 
                    onClick={() => navigate({ to: `/dashboard/roleplay-center/session/${s.id}` })}>
                    {s.status === "completed" ? "View" : "Continue"}
                  </GlassButton>
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
              <h3 className="text-lg font-semibold text-ink">New Roleplay Session</h3>
              <button onClick={() => setShowNewModal(false)} className="text-2xl text-ink-muted hover:text-ink transition-colors">&times;</button>
            </GlassCardHeader>
            <div className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-muted">Scenario Type</label>
                <GlassSelect value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="!w-full">
                  {scenarios.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </GlassSelect>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-muted">Customer Personality</label>
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
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getPersonalityColor(p.name)} text-xs font-bold text-ink`}>
                        {getInitials(p.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{p.name}</p>
                        <p className="text-xs text-ink-faint capitalize">{p.difficulty}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <GlassButton
                onClick={() => { setShowNewModal(false); startNewSession(selectedPersonality); }}
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