import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { LoadingSkeleton, GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassButton, GlassInput, GlassBadge } from "~/components/GlassCard";

export const Route = createFileRoute("/dashboard/hodu-integration")({
  component: HoduIntegration,
});

function HoduIntegration() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiEndpoint, setApiEndpoint] = useState("https://api.hoducc.com");
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [clickToDialNumber, setClickToDialNumber] = useState("");
  const [dialActive, setDialActive] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      loadConnection();
      setLoading(false);
    });
  }, [navigate]);

  const loadConnection = async () => {
    try {
      const res = await fetch("/api/integrations/hodu/calls");
      const data = await res.json();
      if (data.connection?.connected) {
        setConnected(true);
        setApiEndpoint(data.connection.api_endpoint || "https://api.hoducc.com");
      }
    } catch {}
  };

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleConnect = async () => {
    if (!apiKey.trim()) {
      showToast("error", "API key is required");
      return;
    }
    if (!apiEndpoint.trim()) {
      showToast("error", "API Endpoint URL is required");
      return;
    }
    setConnecting(true);
    try {
      const res = await fetch("/api/integrations/hodu/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey.trim(), api_endpoint: apiEndpoint.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setConnected(true);
        setShowConnect(false);
        setApiKey("");
        showToast("success", "Connected to HoduCC successfully");
      } else {
        showToast("error", data.error || "Failed to connect");
      }
    } catch {
      showToast("error", "Connection error");
    }
    setConnecting(false);
  };

  const handleDisconnect = async () => {
    try {
      await fetch("/api/integrations/hodu/disconnect", { method: "POST" });
      setConnected(false);
      showToast("success", "Disconnected from HoduCC");
    } catch {
      showToast("error", "Failed to disconnect");
    }
  };

  const handleSync = () => {
    setSyncing(true);
    setSyncProgress(0);
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) { clearInterval(interval); setSyncing(false); return 100; }
        return prev + 10;
      });
    }, 400);
  };

  const handleDial = () => {
    if (!clickToDialNumber.trim()) return;
    setDialActive(true);
    setTimeout(() => setDialActive(false), 3000);
  };

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  const syncHistory = [
    { date: "Jul 11, 2026 2:30 PM", type: "Full Sync", records: 142, status: "success" as const },
    { date: "Jul 10, 2026 9:15 AM", type: "Incremental", records: 38, status: "success" as const },
    { date: "Jul 9, 2026 4:00 PM", type: "Full Sync", records: 156, status: "partial" as const },
    { date: "Jul 8, 2026 11:00 AM", type: "Incremental", records: 42, status: "failed" as const },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/integrations" className="text-2xl text-ink-muted hover:text-ink transition-colors">&larr;</Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 text-sm font-bold text-white shadow-lg">HP</div>
            <div>
              <h1 className="text-2xl font-bold text-ink">Hodu Phone System</h1>
              <p className="text-sm text-ink-muted">Connect HoduCC phone system for call sync, click-to-dial, and live streaming</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <GlassBadge color={connected ? "green" : "default"}>
            <span className={`h-2 w-2 rounded-full ${connected ? "bg-green-500" : "bg-gray-500"} mr-1.5`} />
            {connected ? "Connected" : "Disconnected"}
          </GlassBadge>
          {!connected ? (
            <GlassButton onClick={() => setShowConnect(true)} variant="primary">Connect</GlassButton>
          ) : (
            <button onClick={handleDisconnect}
              className="rounded-xl bg-panel-raised px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-panel-raised transition-all">Disconnect</button>
          )}
        </div>
      </div>

      {/* Connect Modal */}
      {showConnect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <GlassCard padding="lg" className="w-full max-w-md">
            <h2 className="text-lg font-semibold text-ink mb-2">Connect to HoduCC</h2>
            <p className="text-sm text-ink-muted mb-5">Enter your HoduCC API credentials to connect your phone system.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-muted mb-1.5">
                  API Key <span className="text-red-400">*</span>
                </label>
                <GlassInput
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your HoduCC API key"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-muted mb-1.5">
                  API Endpoint URL <span className="text-red-400">*</span>
                </label>
                <GlassInput
                  type="url"
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  placeholder="https://api.hoducc.com"
                />
                <p className="text-xs text-ink-faint mt-1">Your HoduCC instance API endpoint URL</p>
              </div>
              <div className="flex gap-3 pt-2">
                <GlassButton
                  onClick={handleConnect}
                  variant="primary"
                  className="flex-1"
                >
                  {connecting ? "Connecting..." : "Connect"}
                </GlassButton>
                <GlassButton
                  onClick={() => { setShowConnect(false); setApiKey(""); }}
                  variant="ghost"
                >
                  Cancel
                </GlassButton>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Call Sync */}
        <GlassCard padding="md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-ink">Call Sync</h3>
            <GlassBadge color="green">Auto</GlassBadge>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-muted">Last synced</span>
              <span className="text-ink font-medium">2 min ago</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-muted">Total calls</span>
              <span className="text-ink font-medium">1,247</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-muted">Sync interval</span>
              <span className="text-ink font-medium">5 min</span>
            </div>
          </div>
          <GlassButton onClick={handleSync} variant="ghost" className="w-full mt-4" disabled={syncing || !connected}>
            {syncing ? `Syncing... ${syncProgress}%` : "Sync Now"}
          </GlassButton>
          {syncing && (
            <div className="mt-2 h-1.5 rounded-full bg-panel-raised">
              <div className="h-1.5 rounded-full bg-gradient-to-r from-accent-500 to-accent-500 transition-all" style={{ width: `${syncProgress}%` }} />
            </div>
          )}
        </GlassCard>

        {/* Click-to-Dial */}
        <GlassCard padding="md">
          <h3 className="text-sm font-semibold text-ink mb-4">Click-to-Dial</h3>
          <div className="flex gap-2">
            <GlassInput
              type="tel"
              value={clickToDialNumber}
              onChange={(e) => setClickToDialNumber(e.target.value)}
              placeholder="Enter phone number..."
            />
            <GlassButton onClick={handleDial} variant="primary" disabled={!clickToDialNumber.trim() || dialActive}>
              {dialActive ? "Calling..." : "Dial"}
            </GlassButton>
          </div>
          {dialActive && (
            <div className="mt-3 rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-300 animate-fade-in">
              📞 Calling {clickToDialNumber}...
            </div>
          )}
        </GlassCard>

        {/* Live Stream */}
        <GlassCard padding="md">
          <h3 className="text-sm font-semibold text-ink mb-4">Live Stream</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-muted">Status</span>
              <span className="text-green-400 font-medium flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Active
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-muted">Active calls</span>
              <span className="text-ink font-medium">3</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-muted">Today's volume</span>
              <span className="text-ink font-medium">47 calls</span>
            </div>
          </div>
          <GlassButton variant="primary" className="w-full mt-4">
            View Live Feed
          </GlassButton>
        </GlassCard>
      </div>

      {/* Sync History */}
      <GlassCard padding="none">
        <GlassCardHeader>
          <h3 className="text-sm font-semibold text-ink">Sync History</h3>
        </GlassCardHeader>
        <GlassCardBody divide>
          {syncHistory.map((s, i) => (
            <GlassCardRow key={i}>
              <div className="flex items-center gap-3">
                <span className={`text-lg ${s.status === "success" ? "text-green-400" : s.status === "partial" ? "text-amber-400" : "text-red-400"}`}>
                  {s.status === "success" ? "✓" : s.status === "partial" ? "⚠" : "✗"}
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">{s.type}</p>
                  <p className="text-xs text-ink-faint">{s.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-ink-muted">{s.records} records</span>
                <GlassBadge color={s.status === "success" ? "green" : s.status === "partial" ? "amber" : "red"}>
                  {s.status === "success" ? "Success" : s.status === "partial" ? "Partial" : "Failed"}
                </GlassBadge>
              </div>
            </GlassCardRow>
          ))}
        </GlassCardBody>
      </GlassCard>

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