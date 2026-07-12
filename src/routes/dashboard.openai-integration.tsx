import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { LoadingSkeleton } from "~/components/GlassCard";

export const Route = createFileRoute("/dashboard/openai-integration")({
  component: OpenAIIntegration,
});

function OpenAIIntegration() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [mode, setMode] = useState<"demo" | "live">("demo");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingMode, setPendingMode] = useState<"demo" | "live">("demo");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form fields
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-4o-mini");
  const [maxTokens, setMaxTokens] = useState(4096);
  const [organizationId, setOrganizationId] = useState("");

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      loadConfig();
      loadMode();
      setLoading(false);
    });
  }, [navigate]);

  const loadConfig = async () => {
    try {
      const res = await fetch("/api/openai/config");
      const data = await res.json();
      if (data.configured) {
        setConfigured(true);
        if (data.model) setModel(data.model);
        if (data.maxTokens) setMaxTokens(data.maxTokens);
      }
    } catch {}
  };

  const loadMode = async () => {
    try {
      const res = await fetch("/api/settings/demo-mode");
      const data = await res.json();
      if (data.demo_mode !== undefined) setMode(data.demo_mode ? "demo" : "live");
    } catch {}
  };

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleMode = () => {
    const newMode = mode === "demo" ? "live" : "demo";
    setPendingMode(newMode);
    setConfirmOpen(true);
  };

  const confirmToggle = async () => {
    setConfirmOpen(false);
    try {
      const res = await fetch("/api/integrations/openai/mode", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: pendingMode }),
      });
      const data = await res.json();
      if (data.success) {
        setMode(pendingMode);
        showToast("success", `Switched to ${pendingMode === "demo" ? "Demo" : "Live"} mode`);
      } else {
        showToast("error", data.error || "Failed to switch mode");
      }
    } catch {
      showToast("error", "Connection error switching mode");
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      showToast("error", "API key is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/openai/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          model,
          maxTokens: Number(maxTokens) || 4096,
          organizationId: organizationId.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setConfigured(true);
        showToast("success", "OpenAI configuration saved successfully");
      } else {
        showToast("error", data.error || "Failed to save configuration");
      }
    } catch {
      showToast("error", "Connection error saving configuration");
    }
    setSaving(false);
  };

  const handleTest = async () => {
    if (!apiKey.trim() && !configured) {
      showToast("error", "Please enter an API key first");
      return;
    }
    setTesting(true);
    try {
      const res = await fetch("/api/openai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", data.message || "Connection successful!");
      } else {
        showToast("error", data.error || "Connection failed");
      }
    } catch {
      showToast("error", "Connection error testing OpenAI");
    }
    setTesting(false);
  };

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/dashboard/integrations" className="text-2xl text-gray-400 hover:text-white transition-colors">&larr;</Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-lg font-bold text-white shadow-lg">🤖</div>
            <div>
              <h1 className="text-2xl font-bold text-white">OpenAI</h1>
              <p className="text-sm text-gray-400">AI engine for call analysis, role-play, and coaching — powered by GPT-4o-mini</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Mode Toggle */}
          <div className="flex items-center gap-2 rounded-2xl px-3 py-1.5"
            style={{
              background: mode === "live" ? "rgba(34, 197, 94, 0.1)" : "rgba(245, 158, 11, 0.1)",
              border: mode === "live" ? "1px solid rgba(34, 197, 94, 0.2)" : "1px solid rgba(245, 158, 11, 0.2)",
            }}
          >
            <span className={`h-2 w-2 rounded-full ${mode === "live" ? "bg-green-500" : "bg-amber-500"}`} />
            <span className={`text-xs font-medium ${mode === "live" ? "text-green-300" : "text-amber-300"}`}>
              {mode === "live" ? "🟢 Live" : "🔵 Demo"}
            </span>
            <button type="button" onClick={handleToggleMode}
              className={`relative h-4 w-7 shrink-0 rounded-full transition-all ml-1 ${mode === "live" ? "bg-purple-500" : "bg-white/10"}`}
              title={`Switch to ${mode === "demo" ? "Live" : "Demo"} mode`}
            >
              <span className={`absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white transition-all shadow ${mode === "live" ? "translate-x-3" : "translate-x-0"}`} />
            </button>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
            configured ? "bg-green-500/10 text-green-300" : "bg-white/5 text-gray-400"
          }`}>
            <span className={`h-2 w-2 rounded-full ${configured ? "bg-green-500" : "bg-gray-500"}`} />
            {configured ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>

      {/* Mode indicator banner */}
      {mode === "demo" && configured && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-sm text-amber-300">
          ⚠️ Demo mode is active. This integration is using sample data. Switch to Live Mode to connect to your real OpenAI account.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Configuration Form */}
        <div className="lg:col-span-2 rounded-2xl p-6"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(139,92,246,0.04) 50%, rgba(255,255,255,0.02) 100%)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          <h2 className="text-lg font-semibold text-white mb-6">API Configuration</h2>

          <div className="space-y-5">
            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                API Key <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={configured ? "•••••••••••••••••••••••••• (enter new key to replace)" : "sk-..."}
                className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Your API key is stored securely and never exposed to the frontend. 
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 ml-1">Get a key →</a>
              </p>
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <option value="gpt-4o-mini" className="bg-gray-900">GPT-4o Mini (Recommended — fastest & most cost-effective)</option>
                <option value="gpt-4o" className="bg-gray-900">GPT-4o (Best quality, higher cost)</option>
                <option value="gpt-4" className="bg-gray-900">GPT-4 (Legacy, most expensive)</option>
                <option value="gpt-3.5-turbo" className="bg-gray-900">GPT-3.5 Turbo (Fastest, least capable)</option>
              </select>
            </div>

            {/* Max Tokens & Organization ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Max Tokens</label>
                <input
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(Number(e.target.value))}
                  min={256}
                  max={32768}
                  step={128}
                  className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                />
                <p className="text-xs text-gray-500 mt-1">Max tokens per response (default: 4096)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Organization ID</label>
                <input
                  type="text"
                  value={organizationId}
                  onChange={(e) => setOrganizationId(e.target.value)}
                  placeholder="Optional — for org accounts"
                  className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving || !apiKey.trim()}
                className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:from-purple-500 hover:to-indigo-500 transition-all disabled:opacity-40"
              >
                {saving ? "Saving..." : "Save Configuration"}
              </button>
              <button
                onClick={handleTest}
                disabled={testing || (!apiKey.trim() && !configured)}
                className="rounded-xl bg-white/5 px-5 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/10 transition-all disabled:opacity-40"
              >
                {testing ? "Testing..." : "Test Connection"}
              </button>
              {configured && (
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Connected
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div className="rounded-2xl p-6"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(139,92,246,0.04) 50%, rgba(255,255,255,0.02) 100%)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          <h3 className="text-sm font-semibold text-white mb-4">About the AI Engine</h3>
          <div className="space-y-4 text-sm text-gray-400">
            <p>
              OpenAI powers all AI features in ElevateAI, including:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">🎯</span>
                <span><strong className="text-gray-300">Call Analysis</strong> — AI evaluates call transcripts, detects objections, and scores performance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">🎭</span>
                <span><strong className="text-gray-300">Role-Play</strong> — Practice with AI-powered sales scenarios and realistic prospect personalities</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">🎙️</span>
                <span><strong className="text-gray-300">Live Coaching</strong> — Real-time suggestions during active calls</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">📋</span>
                <span><strong className="text-gray-300">Coaching Plans</strong> — Personalized development plans based on call data</span>
              </li>
            </ul>
            <div className="rounded-xl p-4 mt-4"
              style={{
                background: "rgba(139, 92, 246, 0.08)",
                border: "1px solid rgba(139, 92, 246, 0.15)",
              }}
            >
              <p className="text-xs text-purple-300">
                💡 <strong>Tip:</strong> GPT-4o Mini is the recommended model — it offers the best balance of speed, quality, and cost for sales coaching.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="rounded-2xl p-6 w-full max-w-md"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(139,92,246,0.04) 50%, rgba(255,255,255,0.02) 100%)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            <h3 className="text-lg font-semibold text-white mb-2">Switch to {pendingMode === "live" ? "Live" : "Demo"} Mode?</h3>
            <p className="text-sm text-gray-400 mb-4">
              {pendingMode === "live"
                ? "Are you sure? This will use your real OpenAI API key for all AI features."
                : "Are you sure? This will switch OpenAI to use sample data instead of real AI calls."}
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmOpen(false)}
                className="rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/10 transition-all">Cancel</button>
              <button onClick={confirmToggle}
                className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:from-purple-500 hover:to-indigo-500 transition-all">
                {pendingMode === "live" ? "Enable Live Mode" : "Enable Demo Mode"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className={`rounded-2xl px-5 py-3 text-sm font-medium shadow-xl ${
            toast.type === "success"
              ? "bg-green-500/20 text-green-300 border border-green-500/30"
              : "bg-red-500/20 text-red-300 border border-red-500/30"
          }`} style={{ backdropFilter: "blur(12px)" }}>
            <div className="flex items-center gap-2">
              <span>{toast.type === "success" ? "✓" : "✗"}</span>
              {toast.message}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}