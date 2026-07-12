import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/observeai-integration")({
  component: ObserveAIIntegration,
});

function ObserveAIIntegration() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [calls, setCalls] = useState<any[]>([]);
  const [selectedCall, setSelectedCall] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<any>(null);
  const [scores, setScores] = useState<any>(null);
  const [coaching, setCoaching] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"calls" | "transcript" | "scores" | "coaching" | "skills">("calls");
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      setLoading(false);
    });
  }, [navigate]);

  const handleConnect = async () => {
    const apiKey = (document.getElementById("api-key") as HTMLInputElement)?.value;
    const instanceUrl = (document.getElementById("instance-url") as HTMLInputElement)?.value || "https://api.observe.ai/v1";
    if (!apiKey) return;
    const res = await fetch("/api/integrations/observeai/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey, instance_url: instanceUrl }),
    });
    const data = await res.json();
    if (data.success) {
      setConnected(true);
      setShowConnect(false);
    }
  };

  const handleDisconnect = async () => {
    await fetch("/api/integrations/observeai/disconnect", { method: "POST" });
    setConnected(false);
    setCalls([]);
    setSelectedCall(null);
    setTranscript(null);
    setScores(null);
    setCoaching(null);
    setSkills([]);
  };

  const handleSync = () => {
    setSyncing(true);
    setSyncProgress(0);
    const interval = setInterval(() => {
      setSyncProgress((p) => { if (p >= 100) { clearInterval(interval); return 100; } return p + 20; });
    }, 300);
    fetch("/api/integrations/observeai/sync-calls", { method: "POST" })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setCalls(data.calls || []);
          setSyncProgress(100);
        }
        setTimeout(() => { setSyncing(false); setSyncProgress(0); }, 500);
      })
      .catch(() => { setSyncing(false); setSyncProgress(0); });
  };

  const fetchTranscript = async (callId: string) => {
    setSelectedCall(callId);
    setActiveTab("transcript");
    const res = await fetch(`/api/integrations/observeai/transcript?callId=${callId}`);
    const data = await res.json();
    setTranscript(data.transcript);
  };

  const fetchScores = async (callId: string) => {
    setSelectedCall(callId);
    setActiveTab("scores");
    const res = await fetch(`/api/integrations/observeai/scores?callId=${callId}`);
    const data = await res.json();
    setScores(data.scores);
  };

  const fetchCoaching = async (agentId: string) => {
    setActiveTab("coaching");
    const res = await fetch(`/api/integrations/observeai/coaching?agentId=${agentId}`);
    const data = await res.json();
    setCoaching(data.coaching);
  };

  const fetchSkills = async (agentId: string) => {
    setActiveTab("skills");
    const res = await fetch(`/api/integrations/observeai/skills?agentId=${agentId}`);
    const data = await res.json();
    setSkills(data.skills || []);
  };

  const fetchLogs = async () => {
    const res = await fetch("/api/integrations/observeai/logs");
    const data = await res.json();
    setLogs(data.logs || []);
  };

  useEffect(() => {
    if (connected) {
      handleSync();
      fetchLogs();
    }
  }, [connected]);

  if (loading) return <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center"><div className="text-white/60">Loading...</div></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0a0e17] text-white p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-white/40 mb-2">
              <Link to="/dashboard" className="hover:text-white/60">Dashboard</Link>
              <span>/</span>
              <span className="text-white/60">Integrations</span>
              <span>/</span>
              <span className="text-emerald-400">Observe.ai</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              Observe.ai Integration
            </h1>
            <p className="text-white/40 mt-1">Real conversation intelligence powered by AI</p>
          </div>
          <div className="flex items-center gap-3">
            {!connected ? (
              <button onClick={() => setShowConnect(true)} className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/30 transition-all text-sm">
                Connect
              </button>
            ) : (
              <button onClick={handleDisconnect} className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 hover:bg-red-500/30 transition-all text-sm">
                Disconnect
              </button>
            )}
          </div>
        </div>

        {/* Connect Modal */}
        {showConnect && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#111827] border border-white/10 rounded-xl p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">Connect to Observe.ai</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/60 mb-1">API Key *</label>
                  <input id="api-key" type="password" className="w-full px-3 py-2 bg-[#1a2235] border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50" placeholder="Enter your Observe.ai API key" />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">Instance URL</label>
                  <input id="instance-url" type="text" className="w-full px-3 py-2 bg-[#1a2235] border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50" placeholder="https://api.observe.ai/v1" defaultValue="https://api.observe.ai/v1" />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleConnect} className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 text-sm">Connect</button>
                  <button onClick={() => setShowConnect(false)} className="px-4 py-2 bg-white/5 text-white/60 rounded-lg hover:bg-white/10 text-sm">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#111827] border border-white/5 rounded-xl p-4">
            <div className="text-white/40 text-xs mb-1">Status</div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500" : "bg-white/20"}`} />
              <span className="text-sm font-medium">{connected ? "Connected" : "Disconnected"}</span>
            </div>
          </div>
          <div className="bg-[#111827] border border-white/5 rounded-xl p-4">
            <div className="text-white/40 text-xs mb-1">Calls Synced</div>
            <div className="text-xl font-bold">{calls.length}</div>
          </div>
          <div className="bg-[#111827] border border-white/5 rounded-xl p-4">
            <div className="text-white/40 text-xs mb-1">Avg Score</div>
            <div className="text-xl font-bold">
              {calls.length > 0 ? Math.round(calls.reduce((a: number, c: any) => a + (c.score || 0), 0) / calls.length) : "—"}
            </div>
          </div>
          <div className="bg-[#111827] border border-white/5 rounded-xl p-4">
            <div className="text-white/40 text-xs mb-1">Mode</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-sm">Demo</span>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={handleSync} disabled={syncing || !connected} className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/30 transition-all disabled:opacity-30 text-sm">
            {syncing ? "Syncing..." : "Sync Calls"}
          </button>
          <Link to="/dashboard/integrations" className="px-4 py-2 bg-white/5 text-white/60 rounded-lg hover:bg-white/10 text-sm">
            All Integrations
          </Link>
        </div>

        {syncing && (
          <div className="mb-6 bg-[#111827] border border-emerald-500/20 rounded-xl p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-emerald-400">Syncing calls from Observe.ai...</span>
              <span className="text-white/40">{syncProgress}%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2">
              <div className="bg-emerald-500 h-2 rounded-full transition-all duration-300" style={{ width: `${syncProgress}%` }} />
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-[#111827] rounded-xl p-1 mb-6">
          {(["calls", "transcript", "scores", "coaching", "skills"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? "bg-emerald-500/20 text-emerald-400" : "text-white/40 hover:text-white/60"}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "calls" && (
          <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <h3 className="text-sm font-medium">Synced Calls</h3>
            </div>
            {calls.length === 0 ? (
              <div className="p-8 text-center text-white/20">No calls synced yet. Click "Sync Calls" to pull data from Observe.ai.</div>
            ) : (
              <div className="divide-y divide-white/5">
                {calls.map((call: any) => (
                  <div key={call.callId} className="p-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-white/40">{call.callId}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${call.direction === "inbound" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"}`}>
                          {call.direction}
                        </span>
                        {call.outcome && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/40">{call.outcome}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/40">{Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, "0")}</span>
                        <button onClick={() => fetchTranscript(call.callId)} className="text-xs text-emerald-400 hover:text-emerald-300">Transcript</button>
                        <button onClick={() => fetchScores(call.callId)} className="text-xs text-blue-400 hover:text-blue-300">Scores</button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-white/30">
                      <span>{call.agentName || call.agentId}</span>
                      <span>{call.customerPhone}</span>
                      <span>{new Date(call.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "transcript" && (
          <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
            <h3 className="text-sm font-medium mb-4">Call Transcript {selectedCall && <span className="text-white/40">— {selectedCall}</span>}</h3>
            {!transcript ? (
              <div className="text-center text-white/20 py-8">Select a call to view its transcript</div>
            ) : (
              <div className="space-y-4">
                {transcript.utterances.map((u: any, i: number) => (
                  <div key={i} className={`flex gap-3 ${u.speaker === "agent" ? "" : "flex-row-reverse"}`}>
                    <div className={`text-xs px-2 py-1 rounded-full h-fit ${u.speaker === "agent" ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"}`}>
                      {u.speaker}
                    </div>
                    <div className={`flex-1 p-3 rounded-lg ${u.speaker === "agent" ? "bg-emerald-500/5 border border-emerald-500/10" : "bg-blue-500/5 border border-blue-500/10"}`}>
                      <p className="text-sm">{u.text}</p>
                      <div className="text-xs text-white/20 mt-1">{u.startTime.toFixed(1)}s — {u.endTime.toFixed(1)}s</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "scores" && (
          <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
            <h3 className="text-sm font-medium mb-4">AI Scores {selectedCall && <span className="text-white/40">— {selectedCall}</span>}</h3>
            {!scores ? (
              <div className="text-center text-white/20 py-8">Select a call to view its scores</div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                  <div className="text-3xl font-bold text-emerald-400">{scores.overall}</div>
                  <div className="text-sm text-white/40">Overall Score</div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(scores.categories || {}).map(([key, val]: [string, any]) => (
                    <div key={key} className="p-3 bg-white/5 rounded-lg">
                      <div className="text-xs text-white/40 mb-1 capitalize">{key.replace(/_/g, " ")}</div>
                      <div className="text-lg font-bold">{val}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Compliance", value: scores.compliance },
                    { label: "Sentiment", value: scores.sentiment },
                    { label: "Talk Ratio", value: (scores.talkRatio * 100).toFixed(0) },
                    { label: "Objection Handling", value: scores.objectionHandling },
                    { label: "Closing", value: scores.closing },
                  ].map((s: any) => (
                    <div key={s.label} className="p-3 bg-white/5 rounded-lg">
                      <div className="text-xs text-white/40 mb-1">{s.label}</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white/5 rounded-full h-2">
                          <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${s.value}%` }} />
                        </div>
                        <span className="text-sm font-medium">{s.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "coaching" && (
          <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
            <h3 className="text-sm font-medium mb-4">Coaching Insights</h3>
            <div className="flex gap-2 mb-4">
              {["AG-101", "AG-102", "AG-103", "AG-104"].map((id) => (
                <button key={id} onClick={() => { fetchCoaching(id); fetchSkills(id); }} className={`px-3 py-1.5 rounded-lg text-xs ${selectedCall === id ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/40 hover:bg-white/10"}`}>
                  {id}
                </button>
              ))}
            </div>
            {!coaching ? (
              <div className="text-center text-white/20 py-8">Select an agent to view coaching insights</div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs text-white/40 mb-3">Recommendations</h4>
                  <div className="space-y-2">
                    {coaching.recommendations.map((r: any, i: number) => (
                      <div key={i} className="p-3 bg-white/5 rounded-lg flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">{r.area}</div>
                          <div className="text-xs text-white/40 mt-0.5">{r.description}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${r.priority === "high" ? "bg-red-500/20 text-red-400" : r.priority === "medium" ? "bg-amber-500/20 text-amber-400" : "bg-green-500/20 text-green-400"}`}>
                            {r.priority}
                          </span>
                          <span className="text-sm font-bold">{r.score}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs text-white/40 mb-2">Strengths</h4>
                    <div className="space-y-1">
                      {coaching.strengths.map((s: string, i: number) => (
                        <div key={i} className="text-sm text-emerald-400 flex items-center gap-2">
                          <span>✓</span> {s}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs text-white/40 mb-2">Areas to Improve</h4>
                    <div className="space-y-1">
                      {coaching.weaknesses.map((w: string, i: number) => (
                        <div key={i} className="text-sm text-amber-400 flex items-center gap-2">
                          <span>△</span> {w}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "skills" && (
          <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
            <h3 className="text-sm font-medium mb-4">Skill Assessments</h3>
            {skills.length === 0 ? (
              <div className="text-center text-white/20 py-8">Select an agent to view skill assessments</div>
            ) : (
              <div className="space-y-3">
                {skills.map((skill: any, i: number) => (
                  <div key={i} className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{skill.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${skill.trend === "improving" ? "bg-emerald-500/20 text-emerald-400" : skill.trend === "declining" ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white/40"}`}>
                          {skill.trend}
                        </span>
                      </div>
                      <span className="text-sm font-bold">{skill.score}</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2">
                      <div className={`h-2 rounded-full ${skill.score >= 80 ? "bg-emerald-500" : skill.score >= 60 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${skill.score}%` }} />
                    </div>
                    <div className="text-xs text-white/20 mt-1">Last assessed: {new Date(skill.lastAssessed).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sync Logs */}
        {logs.length > 0 && (
          <div className="mt-8 bg-[#111827] border border-white/5 rounded-xl p-4">
            <h3 className="text-sm font-medium mb-3">Sync History</h3>
            <div className="space-y-1">
              {logs.map((log: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs text-white/30 py-1">
                  <span>{new Date(log.synced_at).toLocaleString()}</span>
                  <span className={log.status === "success" ? "text-emerald-400" : "text-red-400"}>{log.status}</span>
                  <span>{log.records_synced} records</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}