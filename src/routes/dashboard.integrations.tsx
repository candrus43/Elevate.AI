import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { LoadingSkeleton } from "~/components/GlassCard";

export const Route = createFileRoute("/dashboard/integrations")({
  component: Integrations,
});

interface Integration {
  id: string;
  name: string;
  icon: string;
  desc: string;
  status: string;
  color: string;
  category: string;
  mode: "demo" | "live";
}

function Integrations() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [filter, setFilter] = useState("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmInt, setConfirmInt] = useState<Integration | null>(null);
  const [confirmNewMode, setConfirmNewMode] = useState<"demo" | "live">("demo");

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      loadDemoMode();
      setLoading(false);
    });
  }, [navigate]);

  useEffect(() => {
    // Initialize integrations with mode state
    setIntegrations([
      { id: "salesforce", name: "Salesforce", icon: "SF", desc: "Sync call data and coaching scores to Salesforce", status: "connected", color: "bg-blue-500", category: "CRM", mode: demoMode ? "demo" : "live" },
      { id: "hubspot", name: "HubSpot", icon: "HS", desc: "Import contacts and sync call activities", status: "connected", color: "bg-orange-500", category: "CRM", mode: demoMode ? "demo" : "live" },
      { id: "zoom", name: "Zoom", icon: "ZM", desc: "Record and analyze Zoom meetings", status: "connected", color: "bg-blue-600", category: "Video", mode: demoMode ? "demo" : "live" },
      { id: "msteams", name: "Microsoft Teams", icon: "MT", desc: "Analyze Teams call recordings", status: "coming-soon", color: "bg-purple-600", category: "Video", mode: "demo" },
      { id: "ringcentral", name: "RingCentral", icon: "RC", desc: "Connect your RingCentral dialer", status: "disconnected", color: "bg-red-500", category: "Dialer", mode: "demo" },
      { id: "five9", name: "Five9", icon: "F9", desc: "Integrate with Five9 contact center", status: "coming-soon", color: "bg-green-600", category: "Dialer", mode: "demo" },
      { id: "aircall", name: "Aircall", icon: "AC", desc: "Sync Aircall calls and contacts", status: "disconnected", color: "bg-yellow-500", category: "Dialer", mode: "demo" },
      { id: "twilio", name: "Twilio", icon: "TW", desc: "Build custom voice workflows", status: "coming-soon", color: "bg-red-600", category: "Dialer", mode: "demo" },
      { id: "hodu", name: "Hodu Phone", icon: "HP", desc: "Connect HoduCC phone system — call sync, click-to-dial, live streaming", status: "disconnected", color: "bg-indigo-600", category: "Dialer", mode: "demo" },
      { id: "slack", name: "Slack", icon: "SL", desc: "Get coaching alerts and reports in Slack", status: "connected", color: "bg-purple-500", category: "Communication", mode: demoMode ? "demo" : "live" },
      { id: "google-workspace", name: "Google Workspace", icon: "GW", desc: "Sync calendar and contacts", status: "disconnected", color: "bg-blue-500", category: "Productivity", mode: "demo" },
      { id: "microsoft-365", name: "Microsoft 365", icon: "M3", desc: "Calendar and email integration", status: "coming-soon", color: "bg-blue-700", category: "Productivity", mode: "demo" },
      { id: "webhook", name: "Webhook API", icon: "🔗", desc: "Custom webhooks for event-driven integrations", status: "disconnected", color: "bg-gray-600", category: "Developer", mode: "demo" },
      { id: "thoughtspot", name: "ThoughtSpot", icon: "TS", desc: "Pull analytics data to enrich coaching dashboards", status: "disconnected", color: "bg-indigo-600", category: "Analytics", mode: "demo" },
    ]);
  }, [demoMode]);

  const loadDemoMode = async () => {
    try {
      const res = await fetch("/api/settings/demo-mode");
      const data = await res.json();
      if (data.demo_mode !== undefined) setDemoMode(data.demo_mode);
    } catch {}
  };

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleMode = (int: Integration) => {
    const newMode = int.mode === "demo" ? "live" : "demo";
    setConfirmInt(int);
    setConfirmNewMode(newMode);
    setConfirmOpen(true);
  };

  const confirmToggle = async () => {
    if (!confirmInt) return;
    setConfirmOpen(false);
    setTogglingId(confirmInt.id);

    const newMode = confirmNewMode;
    try {
      const res = await fetch(`/api/integrations/${confirmInt.id}/mode`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: newMode }),
      });
      const data = await res.json();
      if (data.success) {
        setIntegrations(prev => prev.map(i => i.id === confirmInt.id ? { ...i, mode: newMode } : i));
        showToast("success", `${confirmInt.name} switched to ${newMode === "demo" ? "Demo" : "Live"} mode`);
      } else {
        showToast("error", data.error || `Failed to switch ${confirmInt.name} mode`);
      }
    } catch {
      showToast("error", `Connection error switching ${confirmInt.name} mode`);
    }
    setTogglingId(null);
  };

  const filtered = filter === "all" ? integrations : integrations.filter(i => i.status === filter);

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Integrations</h1>
          <p className="text-sm text-gray-400 mt-1">Connect your tools to ElevateAI</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Global Demo/Live Mode Indicator */}
          <div className="flex items-center gap-2 rounded-2xl px-3 py-1.5 text-xs font-medium"
            style={{
              background: demoMode ? "rgba(245, 158, 11, 0.1)" : "rgba(34, 197, 94, 0.1)",
              border: demoMode ? "1px solid rgba(245, 158, 11, 0.2)" : "1px solid rgba(34, 197, 94, 0.2)",
            }}
          >
            <span className={`h-2 w-2 rounded-full ${demoMode ? "bg-amber-500" : "bg-green-500"}`} />
            {demoMode ? "🔵 Demo Mode" : "🟢 Live Mode"}
          </div>
          <Link to="/dashboard/webhooks" className="rounded-2xl px-4 py-2 text-sm font-medium transition-all duration-300"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >Manage Webhooks</Link>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-2xl p-1 w-fit"
        style={{
          background: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        {["all", "connected", "disconnected", "coming-soon"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-xl px-4 py-2 text-sm font-medium capitalize transition-all ${
              filter === f
                ? "bg-white/10 text-white shadow-sm"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {f === "coming-soon" ? "Coming Soon" : f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((int) => (
          <div
            key={int.id}
            className={`group rounded-2xl p-5 transition-all duration-300 hover:border-purple-500/20 hover:translate-y-[-1px] ${
              int.status === "coming-soon" ? "opacity-75" : ""
            }`}
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(139,92,246,0.04) 50%, rgba(255,255,255,0.02) 100%)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: int.status === "coming-soon"
                ? "1px dashed rgba(255, 255, 255, 0.15)"
                : "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${int.color} text-sm font-bold text-white shadow-lg`}>
                  {int.icon}
                </div>
                <div>
                  <h3 className="font-medium text-white">{int.name}</h3>
                  <span className="text-xs text-gray-500">{int.category}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  int.status === "connected" ? "bg-green-500/10 text-green-300" :
                  int.status === "disconnected" ? "bg-white/5 text-gray-400" :
                  "bg-amber-500/10 text-amber-300"
                }`}>
                  {int.status === "connected" && <span className="h-1.5 w-1.5 rounded-full bg-green-500" />}
                  {int.status === "coming-soon" ? "Soon" : int.status}
                </span>
                {/* Per-integration mode toggle for connected integrations */}
                {int.status === "connected" && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-[10px] ${int.mode === "demo" ? "text-amber-400" : "text-green-400"}`}>
                      {int.mode === "demo" ? "🔵 Demo" : "🟢 Live"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleMode(int)}
                      disabled={togglingId === int.id}
                      className={`relative h-4 w-7 shrink-0 rounded-full transition-all ${
                        togglingId === int.id ? "opacity-50" : ""
                      } ${int.mode === "live" ? "bg-purple-500" : "bg-white/10"}`}
                      title={`Switch to ${int.mode === "demo" ? "Live" : "Demo"} mode`}
                    >
                      <span className={`absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white transition-all shadow ${
                        int.mode === "live" ? "translate-x-3" : "translate-x-0"
                      }`} />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-3">{int.desc}</p>

            {/* Action buttons */}
            {int.status === "disconnected" && (int.name === "Hodu Phone" || int.name === "ThoughtSpot") && (
              <Link to={`/dashboard/${int.name.toLowerCase().replace(" ", "-")}-integration`} className="inline-block text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors">Connect</Link>
            )}
            {int.status === "disconnected" && int.name !== "Hodu Phone" && int.name !== "ThoughtSpot" && (
              <button className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors">Connect</button>
            )}
            {int.status === "connected" && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-green-400">✓ Connected</span>
                <button className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Configure</button>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  int.mode === "demo" ? "bg-amber-500/10 text-amber-300" : "bg-green-500/10 text-green-300"
                }`}>
                  {int.mode === "demo" ? "Demo" : "Live"}
                </span>
              </div>
            )}
            {int.status === "coming-soon" && (
              <span className="text-xs text-gray-500">Coming soon</span>
            )}
          </div>
        ))}
      </div>

      {/* Confirm Dialog */}
      {confirmOpen && confirmInt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="rounded-2xl p-6 w-full max-w-md"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(139,92,246,0.04) 50%, rgba(255,255,255,0.02) 100%)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            <h3 className="text-lg font-semibold text-white mb-2">
              Switch to {confirmNewMode === "live" ? "Live" : "Demo"} Mode?
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              {confirmNewMode === "live"
                ? `Are you sure? This will connect to your real ${confirmInt.name} account.`
                : `Are you sure? This will switch ${confirmInt.name} to use sample data instead of real connections.`}
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmOpen(false)}
                className="rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/10 transition-all">
                Cancel
              </button>
              <button onClick={confirmToggle}
                className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:from-purple-500 hover:to-indigo-500 transition-all">
                {confirmNewMode === "live" ? "Enable Live Mode" : "Enable Demo Mode"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className={`rounded-2xl px-5 py-3 text-sm font-medium shadow-xl ${
            toast.type === "success"
              ? "bg-green-500/20 text-green-300 border border-green-500/30"
              : "bg-red-500/20 text-red-300 border border-red-500/30"
          }`}
            style={{
              backdropFilter: "blur(12px)",
            }}
          >
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