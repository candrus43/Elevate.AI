import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/integrations")({
  component: Integrations,
});

function Integrations() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      setLoading(false);
    });
  }, [navigate]);

  const integrations = [
    { name: "Salesforce", icon: "SF", desc: "Sync call data and coaching scores to Salesforce", status: "connected", color: "bg-blue-500", category: "CRM" },
    { name: "HubSpot", icon: "HS", desc: "Import contacts and sync call activities", status: "connected", color: "bg-orange-500", category: "CRM" },
    { name: "Zoom", icon: "ZM", desc: "Record and analyze Zoom meetings", status: "connected", color: "bg-blue-600", category: "Video" },
    { name: "Microsoft Teams", icon: "MT", desc: "Analyze Teams call recordings", status: "coming-soon", color: "bg-purple-600", category: "Video" },
    { name: "RingCentral", icon: "RC", desc: "Connect your RingCentral dialer", status: "disconnected", color: "bg-red-500", category: "Dialer" },
    { name: "Five9", icon: "F9", desc: "Integrate with Five9 contact center", status: "coming-soon", color: "bg-green-600", category: "Dialer" },
    { name: "Aircall", icon: "AC", desc: "Sync Aircall calls and contacts", status: "disconnected", color: "bg-yellow-500", category: "Dialer" },
    { name: "Twilio", icon: "TW", desc: "Build custom voice workflows", status: "coming-soon", color: "bg-red-600", category: "Dialer" },
    { name: "Hodu Phone", icon: "HP", desc: "Connect HoduCC phone system — call sync, click-to-dial, live streaming", status: "disconnected", color: "bg-indigo-600", category: "Dialer" },
    { name: "Slack", icon: "SL", desc: "Get coaching alerts and reports in Slack", status: "connected", color: "bg-purple-500", category: "Communication" },
    { name: "Google Workspace", icon: "GW", desc: "Sync calendar and contacts", status: "disconnected", color: "bg-blue-500", category: "Productivity" },
    { name: "Microsoft 365", icon: "M3", desc: "Calendar and email integration", status: "coming-soon", color: "bg-blue-700", category: "Productivity" },
    { name: "Webhook API", icon: "🔗", desc: "Custom webhooks for event-driven integrations", status: "disconnected", color: "bg-gray-600", category: "Developer" },
    { name: "ThoughtSpot", icon: "TS", desc: "Pull analytics data to enrich coaching dashboards", status: "disconnected", color: "bg-indigo-600", category: "Analytics" },
  ];

  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? integrations : integrations.filter(i => i.status === filter);

  if (loading) return <div className="flex items-center justify-center h-48"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Integrations</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Connect your tools to ElevateAI</p>
        </div>
        <a href="/dashboard/webhooks" className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800">Manage Webhooks</a>
      </div>

      <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 w-fit dark:border-gray-700 dark:bg-gray-800">
        {["all", "connected", "disconnected", "coming-soon"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-all ${filter === f ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}>
            {f === "coming-soon" ? "Coming Soon" : f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((int, i) => (
          <div key={i} className={`group rounded-xl border bg-white p-5 transition-all hover:shadow-md dark:bg-gray-900 ${int.status === "coming-soon" ? "border-dashed border-gray-300 dark:border-gray-600 opacity-75" : "border-gray-200 dark:border-gray-700"}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${int.color} text-sm font-bold text-white`}>{int.icon}</div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{int.name}</h3>
                  <span className="text-xs text-gray-500">{int.category}</span>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                int.status === "connected" ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" :
                int.status === "disconnected" ? "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400" :
                "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
              }`}>
                {int.status === "connected" && <span className="h-1.5 w-1.5 rounded-full bg-green-500" />}
                {int.status === "coming-soon" ? "Soon" : int.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{int.desc}</p>
            {int.status === "disconnected" && (int.name === "Hodu Phone" || int.name === "ThoughtSpot") && (
              <Link to={`/dashboard/${int.name.toLowerCase().replace(" ", "-")}-integration`} className="inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">Connect</Link>
            )}
            {int.status === "disconnected" && int.name !== "Hodu Phone" && int.name !== "ThoughtSpot" && (
              <button className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">Connect</button>
            )}
            {int.status === "connected" && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-green-600">✓ Connected</span>
                <button className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Configure</button>
              </div>
            )}
            {int.status === "coming-soon" && (
              <span className="text-xs text-gray-400">Coming soon</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}