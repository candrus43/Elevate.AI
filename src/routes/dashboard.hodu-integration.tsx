import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { LoadingSkeleton } from "~/components/GlassCard";

export const Route = createFileRoute("/dashboard/hodu-integration")({
  component: HoduIntegration,
});

function HoduIntegration() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [clickToDialNumber, setClickToDialNumber] = useState("");
  const [dialActive, setDialActive] = useState(false);
  const [mode, setMode] = useState<"demo" | "live">("demo");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingMode, setPendingMode] = useState<"demo" | "live">("demo");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      loadMode();
      setLoading(false);
    });
  }, [navigate]);

  const loadMode = async () => {
    try {
      const res = await fetch("/api/settings/demo-mode");
      const data = await res.json();
      if (data.demo_mode) setMode("demo");
      else setMode("live");
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
      const res = await fetch("/api/integrations/hodu/mode", {
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
        <Link to="/dashboard/integrations" className="text-2xl text-gray-400 hover:text-white transition-colors">&larr;</Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-sm font-bold text-white shadow-lg">HP</div>
            <div>
              <h1 className="text-2xl font-bold text-white">Hodu Phone System</h1>
              <p className="text-sm text-gray-400">Connect HoduCC phone system for call sync, click-to-dial, and live streaming</p>
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
            connected ? "bg-green-500/10 text-green-300" : "bg-white/5 text-gray-400"
          }`}>
            <span className={`h-2 w-2 rounded-full ${connected ? "bg-green-500" : "bg-gray-500"}`} />
            {connected ? "Connected" : "Disconnected"}
          </span>
          {!connected && (
            <button onClick={() => setShowConnect(true)}
              className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white hover:from-purple-500 hover:to-indigo-500 transition-all">Connect</button>
          )}
        </div>
      </div>

      {/* Mode indicator banner */}
      {mode === "demo" && connected && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-sm text-amber-300">
          ⚠️ Demo mode is active. This integration is using sample data. Switch to Live Mode to connect to your real HoduCC account.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Call Sync */}
        <div className="rounded-2xl p-5"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(139,92,246,0.04) 50%, rgba(255,255,255,0.02) 100%)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Call Sync</h3>
            <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Auto</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Last synced</span>
              <span className="text-white font-medium">2 min ago</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Total calls</span>
              <span className="text-white font-medium">1,247</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Sync interval</span>
              <span className="text-white font-medium">5 min</span>
            </div>
          </div>
          <button onClick={handleSync} disabled={syncing}
            className="mt-4 w-full rounded-xl bg-white/5 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-white/10 transition-all disabled:opacity-50">
            {syncing ? `Syncing... ${syncProgress}%` : "Sync Now"}
          </button>
          {syncing && (
            <div className="mt-2 h-1.5 rounded-full bg-white/5">
              <div className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all" style={{ width: `${syncProgress}%` }} />
            </div>
          )}
        </div>

        {/* Click-to-Dial */}
        <div className="rounded-2xl p-5"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(139,92,246,0.04) 50%, rgba(255,255,255,0.02) 100%)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          <h3 className="text-sm font-semibold text-white mb-4">Click-to-Dial</h3>
          <div className="flex gap-2">
            <input type="tel" value={clickToDialNumber} onChange={(e) => setClickToDialNumber(e.target.value)}
              placeholder="Enter phone number..."
              className="flex-1 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            />
            <button onClick={handleDial} disabled={!clickToDialNumber.trim() || dialActive}
              className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:from-purple-500 hover:to-indigo-500 transition-all disabled:opacity-40">
              {dialActive ? "Calling..." : "Dial"}
            </button>
          </div>
          {dialActive && (
            <div className="mt-3 rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-300 animate-fade-in">
              📞 Calling {clickToDialNumber}...
            </div>
          )}
        </div>

        {/* Live Stream */}
        <div className="rounded-2xl p-5"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(139,92,246,0.04) 50%, rgba(255,255,255,0.02) 100%)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          <h3 className="text-sm font-semibold text-white mb-4">Live Stream</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Status</span>
              <span className="text-green-400 font-medium flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Active
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Active calls</span>
              <span className="text-white font-medium">3</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Today's volume</span>
              <span className="text-white font-medium">47 calls</span>
            </div>
          </div>
          <button className="mt-4 w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white hover:from-purple-500 hover:to-indigo-500 transition-all">
            View Live Feed
          </button>
        </div>
      </div>

      {/* Sync History */}
      <div className="rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(139,92,246,0.04) 50%, rgba(255,255,255,0.02) 100%)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <div className="px-5 sm:px-6 py-3.5 sm:py-4" style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
          <h3 className="text-sm font-semibold text-white">Sync History</h3>
        </div>
        <div className="divide-y divide-white/5">
          {syncHistory.map((s, i) => (
            <div key={i} className="flex items-center justify-between px-5 sm:px-6 py-3.5 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-3">
                <span className={`text-lg ${s.status === "success" ? "text-green-400" : s.status === "partial" ? "text-amber-400" : "text-red-400"}`}>
                  {s.status === "success" ? "✓" : s.status === "partial" ? "⚠" : "✗"}
                </span>
                <div>
                  <p className="text-sm font-medium text-white">{s.type}</p>
                  <p className="text-xs text-gray-500">{s.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{s.records} records</span>
                <span className={`text-xs font-medium ${s.status === "success" ? "text-green-400" : s.status === "partial" ? "text-amber-400" : "text-red-400"}`}>
                  {s.status === "success" ? "Success" : s.status === "partial" ? "Partial" : "Failed"}
                </span>
              </div>
            </div>
          ))}
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
                ? "Are you sure? This will connect to your real HoduCC account."
                : "Are you sure? This will switch Hodu Phone to use sample data instead of real connections."}
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