import { LoadingSkeleton } from '~/components/GlassCard';
import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/thoughtspot-integration")({
  component: ThoughtSpotIntegration,
});

function ThoughtSpotIntegration() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const [schedule, setSchedule] = useState("manual");

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      setLoading(false);
    });
  }, [navigate]);

  const handlePull = () => {
    setPulling(true);
    setPullProgress(0);
    const interval = setInterval(() => {
      setPullProgress(prev => {
        if (prev >= 100) { clearInterval(interval); setPulling(false); return 100; }
        return prev + 8;
      });
    }, 350);
  };

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  const analyticsFields = [
    { name: "Revenue", value: "$1,245,000", type: "currency", trend: "up" },
    { name: "Pipeline", value: "$3.8M", type: "currency", trend: "up" },
    { name: "Win Rate", value: "32.5%", type: "percent", trend: "up" },
    { name: "Avg Deal Size", value: "$42,800", type: "currency", trend: "stable" },
    { name: "Sales Cycle", value: "45 days", type: "duration", trend: "down" },
    { name: "Activity Score", value: "86/100", type: "score", trend: "up" },
  ];

  const syncHistory = [
    { date: "Jul 11, 2026 2:30 PM", type: "Scheduled", records: 847, status: "success" as const },
    { date: "Jul 11, 2026 8:00 AM", type: "Scheduled", records: 832, status: "success" as const },
    { date: "Jul 10, 2026 2:30 PM", type: "Scheduled", records: 820, status: "partial" as const },
    { date: "Jul 10, 2026 8:00 AM", type: "Scheduled", records: 0, status: "failed" as const },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/integrations" className="text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&larr;</Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">TS</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ThoughtSpot Analytics</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pull analytics data to enrich coaching dashboards and rep profiles</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${connected ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`}>
            <span className={`h-2 w-2 rounded-full ${connected ? "bg-green-500" : "bg-gray-400"}`} />
            {connected ? "Connected" : "Disconnected"}
          </span>
          {connected ? (
            <button onClick={() => setConnected(false)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400">Disconnect</button>
          ) : (
            <button onClick={() => setShowConnect(true)} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">Connect</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Pull Analytics Data */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">📊 Pull Analytics Data</h3>
          <p className="text-xs text-gray-500 mb-3">Fetch revenue, pipeline, win rates, and other metrics from ThoughtSpot</p>
          <button onClick={handlePull} disabled={pulling || !connected} className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
            {pulling ? "Pulling Data..." : "Pull Now"}
          </button>
          {pulling && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">Fetching analytics...</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{pullProgress}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300" style={{ width: `${pullProgress}%` }} />
              </div>
            </div>
          )}
          {connected && (
            <div className="mt-2 text-xs text-gray-400">
              <span className="font-medium text-gray-700 dark:text-gray-300">Last pulled:</span> {pullProgress >= 100 ? "Just now" : "Jul 11, 2026 2:30 PM"}
            </div>
          )}
        </div>

        {/* Data Preview */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">📋 Data Preview</h3>
          <p className="text-xs text-gray-500 mb-3">Available analytics fields from ThoughtSpot</p>
          <div className={`space-y-2.5 ${!connected ? "opacity-40" : ""}`}>
            {analyticsFields.map((field, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-xs text-gray-700 dark:text-gray-300">{field.name}</span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-bold ${
                    field.type === "currency" ? "text-green-600" :
                    field.type === "percent" ? "text-blue-600" : "text-gray-900 dark:text-white"
                  }`}>{field.value}</span>
                  <span className={`text-[10px] ${field.trend === "up" ? "text-green-500" : field.trend === "down" ? "text-red-500" : "text-gray-400"}`}>
                    {field.trend === "up" ? "↑" : field.trend === "down" ? "↓" : "→"}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {!connected && <p className="text-xs text-gray-400 mt-2 text-center">Connect to see live data</p>}
        </div>

        {/* Sync Scheduling */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">⏰ Sync Scheduling</h3>
          <p className="text-xs text-gray-500 mb-3">Configure how often analytics data is refreshed</p>
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="radio" name="schedule" value="manual" checked={schedule === "manual"} onChange={() => setSchedule("manual")} className="text-indigo-600" />
              Manual (pull on demand)
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="radio" name="schedule" value="daily" checked={schedule === "daily"} onChange={() => setSchedule("daily")} className="text-indigo-600" />
              Daily (every 24h)
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="radio" name="schedule" value="weekly" checked={schedule === "weekly"} onChange={() => setSchedule("weekly")} className="text-indigo-600" />
              Weekly (every Monday)
            </label>
          </div>
          {schedule !== "manual" && (
            <button className="mt-3 w-full rounded-lg bg-indigo-600 py-2 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50" disabled={!connected}>
              Save Schedule
            </button>
          )}
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
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">TS</span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Connect ThoughtSpot</h3>
              </div>
              <button onClick={() => setShowConnect(false)} className="text-2xl text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <p className="text-xs text-gray-500 mb-4">Enter your ThoughtSpot credentials to pull analytics data.</p>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">API Endpoint URL</label>
                <input type="url" placeholder="https://your-instance.thoughtspot.cloud/api/rest/2.0" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Authentication Token</label>
                <input type="password" placeholder="Bearer token..." className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Data Source</label>
                <select className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                  <option>Revenue Analytics</option>
                  <option>Sales Performance</option>
                  <option>Pipeline Analysis</option>
                  <option>Custom View</option>
                </select>
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