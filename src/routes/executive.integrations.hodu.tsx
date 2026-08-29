import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { LoadingSkeleton, GlassCard, GlassCardHeader, GlassCardBody, GlassBadge, GlassCardRow } from "~/components/GlassCard";

export const Route = createFileRoute("/executive/integrations/hodu")({
  component: HoduIntegrationPage,
});

function HoduIntegrationPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [syncStats, setSyncStats] = useState({ calls: 0, lastSync: "Never" });

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      checkStatus();
      setLoading(false);
    });
  }, [navigate]);

  const checkStatus = async () => {
    try {
      const res = await fetch("/api/integrations");
      const data = await res.json();
      const hodu = data.integrations?.find((i: any) => i.provider === "hodu");
      if (hodu?.is_active) {
        setConnected(true);
        setApiKey(hodu.credentials?.api_key || "");
        setApiUrl(hodu.credentials?.api_url || "");
        setSyncStats({ calls: hodu.sync_count || 0, lastSync: hodu.last_sync_status || "Never" });
      }
    } catch {}
  };

  const handleConnect = async () => {
    if (!apiKey || !apiUrl) {
      setToast({ type: "error", message: "API Key and URL are required" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/integrations/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "hodu",
          credentials: { api_key: apiKey, api_url: apiUrl },
          config: { auto_sync: true, sync_interval: 15 },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setConnected(true);
        setToast({ type: "success", message: "Hodu Phone connected successfully" });
      } else {
        setToast({ type: "error", message: data.error || "Failed to connect" });
      }
    } catch {
      setToast({ type: "error", message: "Connection failed" });
    }
    setSaving(false);
  };

  const handleDisconnect = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/hodu/disconnect", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setConnected(false);
        setApiKey("");
        setApiUrl("");
        setToast({ type: "success", message: "Disconnected successfully" });
      }
    } catch {
      setToast({ type: "error", message: "Failed to disconnect" });
    }
    setSaving(false);
  };

  const handleSync = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/hodu/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setToast({ type: "success", message: `Synced ${data.calls || 0} calls` });
        checkStatus();
      }
    } catch {
      setToast({ type: "error", message: "Sync failed" });
    }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
          toast.type === "success" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-red-500/20 text-red-300 border border-red-500/30"
        }`}>
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-3 opacity-70 hover:opacity-100">&times;</button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link to="/executive/integrations" className="text-ink-muted hover:text-ink transition-colors">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-ink">Hodu Phone Integration</h1>
          </div>
          <p className="text-sm text-ink-muted mt-1">Connect your HoduCC phone system for call sync, click-to-dial, and live streaming</p>
        </div>
        <GlassBadge variant={connected ? "success" : "default"}>
          {connected ? "Connected" : "Disconnected"}
        </GlassBadge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Configuration */}
        <GlassCard padding="md" glow>
          <GlassCardHeader>
            <h3 className="text-lg font-semibold text-ink">Configuration</h3>
          </GlassCardHeader>
          <GlassCardBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-muted mb-1">API URL</label>
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://your-hodu-instance.com/api"
                  className="w-full rounded-lg border border-edge bg-panel-raised px-3 py-2 text-sm text-ink placeholder-ink-faint focus:border-accent-500/50 focus:outline-none"
                  disabled={connected}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-muted mb-1">API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your HoduCC API key"
                  className="w-full rounded-lg border border-edge bg-panel-raised px-3 py-2 text-sm text-ink placeholder-ink-faint focus:border-accent-500/50 focus:outline-none"
                  disabled={connected}
                />
              </div>
              <div className="flex gap-3 pt-2">
                {!connected ? (
                  <button
                    onClick={handleConnect}
                    disabled={saving}
                    className="rounded-lg bg-gradient-to-r from-accent-500 to-accent-600 px-4 py-2 text-sm font-medium text-white transition-all hover:from-accent-600 hover:to-accent-700 disabled:opacity-50"
                  >
                    {saving ? "Connecting..." : "Connect"}
                  </button>
                ) : (
                  <button
                    onClick={handleDisconnect}
                    disabled={saving}
                    className="rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 transition-all hover:bg-red-500/10 disabled:opacity-50"
                  >
                    {saving ? "Disconnecting..." : "Disconnect"}
                  </button>
                )}
              </div>
            </div>
          </GlassCardBody>
        </GlassCard>

        {/* Sync Status */}
        <GlassCard padding="md" glow>
          <GlassCardHeader>
            <h3 className="text-lg font-semibold text-ink">Sync Status</h3>
          </GlassCardHeader>
          <GlassCardBody>
            <div className="space-y-4">
              <GlassCardRow>
                <span className="text-sm text-ink-muted">Status</span>
                <span className={`text-sm font-medium ${connected ? "text-emerald-400" : "text-ink-faint"}`}>
                  {connected ? "Active" : "Inactive"}
                </span>
              </GlassCardRow>
              <GlassCardRow>
                <span className="text-sm text-ink-muted">Calls Synced</span>
                <span className="text-sm font-medium text-ink">{syncStats.calls}</span>
              </GlassCardRow>
              <GlassCardRow>
                <span className="text-sm text-ink-muted">Last Sync</span>
                <span className="text-sm font-medium text-ink">{syncStats.lastSync}</span>
              </GlassCardRow>
              {connected && (
                <button
                  onClick={handleSync}
                  disabled={saving}
                  className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-2 text-sm font-medium text-white transition-all hover:from-emerald-600 hover:to-green-700 disabled:opacity-50"
                >
                  {saving ? "Syncing..." : "Sync Now"}
                </button>
              )}
            </div>
          </GlassCardBody>
        </GlassCard>
      </div>

      {/* Features */}
      <GlassCard padding="md">
        <GlassCardHeader>
          <h3 className="text-lg font-semibold text-ink">Features</h3>
        </GlassCardHeader>
        <GlassCardBody>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { icon: "📞", title: "Call Sync", desc: "Automatically import and analyze HoduCC calls" },
              { icon: "🎯", title: "Click-to-Dial", desc: "Enable one-click dialing from the platform" },
              { icon: "📡", title: "Live Streaming", desc: "Stream live calls for real-time coaching" },
            ].map((feature, i) => (
              <div key={i} className="rounded-xl bg-panel-raised p-4">
                <span className="text-2xl">{feature.icon}</span>
                <h4 className="mt-2 font-medium text-ink">{feature.title}</h4>
                <p className="mt-1 text-sm text-ink-muted">{feature.desc}</p>
              </div>
            ))}
          </div>
        </GlassCardBody>
      </GlassCard>
    </div>
  );
}