import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

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

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      setLoading(false);
    });
  }, [navigate]);

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

  if (loading) return <div className="flex items-center justify-center h-48"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" /></div>;

  const syncHistory = [
    { date: "Jul 11, 2026 2:30 PM", type: "Full Sync", records: 142, status: "success" as const },
    { date: "Jul 10, 2026 9:15 AM", type: "Incremental", records: 38, status: "success" as const },
    { date: "Jul 9, 2026 4:00 PM", type: "Full Sync", records: 156, status: "partial" as const },
    { date: "Jul 8, 2026 11:00 AM", type: "Incremental", records: 42, status: "failed" as const },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/integrations" className="text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&larr;</Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">HP</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hodu Phone System</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Connect HoduCC phone system for call sync, click-to-dial, and live streaming</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${connected ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`}>
            <span className={`h-2 w-2 rounded-full ${connected ? "bg-green-500" : "bg-gray-400"}`} />
            {connected ? "Connected" : "Disconnected"}
          </span>
          {!connected && (
            <button onClick={() => setShowConnect(true)} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">Connect</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Call Sync */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">📞 Call Log Sync</h3>
            <button onClick={handleSync} disabled={syncing || !connected} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
              {syncing ? "Syncing..." : "Sync Now"}
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-3">Import call history from HoduCC to ElevateAI for analysis and coaching</p>
          {syncing && (
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">Syncing call logs...</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{syncProgress}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300" style={{ width: `${syncProgress}%` }} />
              </div>
            </div>
          )}
          <div className="text-xs text-gray-400">
            <span className="font-medium text-gray-700 dark:text-gray-300">Last sync:</span> Never
          </div>
        </div>

        {/* Click to Dial */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">📞 Click-to-Dial</h3>
          <p className="text-xs text-gray-500 mb-3">Dial numbers directly from ElevateAI through HoduCC</p>
          <div className="flex gap-2">
            <input type="tel" value={clickToDialNumber} onChange={(e) => setClickToDialNumber(e.target.value)} placeholder="+1 (555) 123-4567" className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
            <button onClick={handleDial} disabled={!clickToDialNumber.trim() || !connected || dialActive} className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50">
              {dialActive ? "Calling..." : "Call"}
            </button>
          </div>
          {dialActive && (
            <div className="mt-2 animate-pulse rounded-lg bg-green-100 p-2 text-center text-xs font-medium text-green-700 dark:bg-green-900/50 dark:text-green-300">
              🔴 Calling {clickToDialNumber}...
            </div>
          )}
        </div>

        {/* Live Call Monitor */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">🎙️ Live Call Monitor</h3>
          <p className="text-xs text-gray-500 mb-3">Stream live calls for real-time coaching assistance</p>
          <div className={`rounded-lg border p-4 text-center ${connected ? "border-gray-200 dark:border-gray-700" : "border-dashed border-gray-300 dark:border-gray-600"}`}>
            <span className={`text-2xl block mb-1 ${connected ? "" : "opacity-40"}`}>🎧</span>
            <p className={`text-xs font-medium ${connected ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
              {connected ? "Standing by — live call streaming ready" : "Connect Hodu to enable live monitoring"}
            </p>
            {connected && (
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                <span className="text-xs text-green-600">Ready for incoming calls</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sync History */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sync History</h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {syncHistory.map((entry, i) => (
            <div key={i} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{entry.type}</p>
                <p className="text-xs text-gray-500">{entry.date} · {entry.records} records</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                entry.status === "success" ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" :
                entry.status === "partial" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" :
                "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
              }`}>{entry.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Connect Modal */}
      {showConnect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowConnect(false)}>
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">HP</span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Connect HoduCC</h3>
              </div>
              <button onClick={() => setShowConnect(false)} className="text-2xl text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <p className="text-xs text-gray-500 mb-4">Enter your HoduCC credentials to connect the phone system.</p>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">API Key</label>
                <input type="text" placeholder="hodu_api_key_..." className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Endpoint URL</label>
                <input type="url" placeholder="https://your-instance.hoducc.com/api" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Tenant ID</label>
                <input type="text" placeholder="your-tenant-id" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              </div>
              <button onClick={() => { setShowConnect(false); setConnected(true); }} className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-500">
                Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}