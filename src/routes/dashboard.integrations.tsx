import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { LoadingSkeleton } from "~/components/GlassCard";

export const Route = createFileRoute("/dashboard/integrations")({
  component: Integrations,
});

interface Integration {
  id: string;
  provider: string;
  name: string;
  icon: string;
  desc: string;
  status: "connected" | "disconnected" | "coming-soon";
  color: string;
  category: string;
  config?: Record<string, any>;
  credentials?: Record<string, any>;
  is_active?: number;
}

const PROVIDER_CATALOG: Record<string, { name: string; icon: string; desc: string; color: string; category: string; configFields: { key: string; label: string; type: string; placeholder: string }[] }> = {
  salesforce: { name: "Salesforce", icon: "SF", desc: "Sync call data and coaching scores to Salesforce", color: "bg-blue-500", category: "CRM", configFields: [{ key: "instance_url", label: "Instance URL", type: "text", placeholder: "https://your-instance.salesforce.com" }, { key: "api_key", label: "API Key / Token", type: "password", placeholder: "Enter your Salesforce API token" }, { key: "client_id", label: "Client ID", type: "text", placeholder: "Connected App Client ID" }] },
  hubspot: { name: "HubSpot", icon: "HS", desc: "Import contacts and sync call activities", color: "bg-orange-500", category: "CRM", configFields: [{ key: "api_key", label: "API Key", type: "password", placeholder: "Enter your HubSpot API key" }, { key: "portal_id", label: "Portal ID", type: "text", placeholder: "Your HubSpot portal ID" }] },
  zoom: { name: "Zoom", icon: "ZM", desc: "Record and analyze Zoom meetings", color: "bg-blue-600", category: "Video", configFields: [{ key: "client_id", label: "Client ID", type: "text", placeholder: "Zoom App Client ID" }, { key: "client_secret", label: "Client Secret", type: "password", placeholder: "Zoom App Client Secret" }] },
  msteams: { name: "Microsoft Teams", icon: "MT", desc: "Analyze Teams call recordings", color: "bg-purple-600", category: "Video", configFields: [
    { key: "tenant_id", label: "Tenant ID", type: "text", placeholder: "Your Azure AD tenant ID" },
    { key: "client_id", label: "Client ID", type: "text", placeholder: "Azure AD app Client ID" },
    { key: "client_secret", label: "Client Secret", type: "password", placeholder: "Azure AD app Client Secret" },
  ] },
  ringcentral: { name: "RingCentral", icon: "RC", desc: "Connect your RingCentral dialer", color: "bg-red-500", category: "Dialer", configFields: [{ key: "api_key", label: "API Key", type: "password", placeholder: "RingCentral API key" }, { key: "extension", label: "Extension", type: "text", placeholder: "Phone extension" }] },
  five9: { name: "Five9", icon: "F9", desc: "Integrate with Five9 contact center", color: "bg-green-600", category: "Dialer", configFields: [
    { key: "api_key", label: "API Key", type: "password", placeholder: "Five9 API key" },
    { key: "domain", label: "Domain", type: "text", placeholder: "your-domain.five9.com" },
  ] },
  aircall: { name: "Aircall", icon: "AC", desc: "Sync Aircall calls and contacts", color: "bg-yellow-500", category: "Dialer", configFields: [{ key: "api_id", label: "API ID", type: "text", placeholder: "Aircall API ID" }, { key: "api_token", label: "API Token", type: "password", placeholder: "Aircall API token" }] },
  twilio: { name: "Twilio", icon: "TW", desc: "Build custom voice workflows", color: "bg-red-600", category: "Dialer", configFields: [{ key: "account_sid", label: "Account SID", type: "text", placeholder: "Twilio Account SID" }, { key: "auth_token", label: "Auth Token", type: "password", placeholder: "Twilio Auth Token" }] },
  hodu: { name: "Hodu Phone", icon: "HP", desc: "Connect HoduCC phone system — call sync, click-to-dial, live streaming", color: "bg-indigo-600", category: "Dialer", configFields: [{ key: "api_key", label: "API Key", type: "password", placeholder: "HoduCC API key" }, { key: "api_url", label: "API URL", type: "text", placeholder: "https://your-hodu-instance.com/api" }] },
  slack: { name: "Slack", icon: "SL", desc: "Get coaching alerts and reports in Slack", color: "bg-purple-500", category: "Communication", configFields: [{ key: "webhook_url", label: "Webhook URL", type: "text", placeholder: "https://hooks.slack.com/services/..." }, { key: "channel", label: "Default Channel", type: "text", placeholder: "#coaching-alerts" }] },
  google: { name: "Google Workspace", icon: "GW", desc: "Sync calendar and contacts", color: "bg-blue-500", category: "Productivity", configFields: [{ key: "client_id", label: "Client ID", type: "text", placeholder: "Google OAuth Client ID" }, { key: "client_secret", label: "Client Secret", type: "password", placeholder: "Google OAuth Client Secret" }] },
  microsoft: { name: "Microsoft 365", icon: "M3", desc: "Calendar and email integration", color: "bg-blue-700", category: "Productivity", configFields: [
    { key: "tenant_id", label: "Tenant ID", type: "text", placeholder: "Your Azure AD tenant ID" },
    { key: "client_id", label: "Client ID", type: "text", placeholder: "Azure AD app Client ID" },
    { key: "client_secret", label: "Client Secret", type: "password", placeholder: "Azure AD app Client Secret" },
  ] },
  thoughtspot: { name: "ThoughtSpot", icon: "TS", desc: "Pull analytics data to enrich coaching dashboards", color: "bg-indigo-600", category: "Analytics", configFields: [{ key: "api_key", label: "API Key", type: "password", placeholder: "ThoughtSpot API key" }, { key: "instance_url", label: "Instance URL", type: "text", placeholder: "https://your-instance.thoughtspot.com" }] },
  openai: { name: "OpenAI", icon: "🤖", desc: "AI engine for call analysis, role-play, and coaching — powered by GPT-4o-mini", color: "bg-green-600", category: "AI", configFields: [{ key: "api_key", label: "API Key", type: "password", placeholder: "sk-..." }, { key: "model", label: "Model", type: "text", placeholder: "gpt-4o-mini" }] },
  observeai: { name: "Observe.ai", icon: "OA", desc: "Real conversation intelligence powered by AI", color: "bg-emerald-600", category: "AI", configFields: [{ key: "api_key", label: "API Key", type: "password", placeholder: "Observe.ai API key" }, { key: "instance_url", label: "Instance URL", type: "text", placeholder: "https://api.observe.ai/v1" }] },
  webhook: { name: "Webhook API", icon: "🔗", desc: "Custom webhooks for event-driven integrations", color: "bg-gray-600", category: "Developer", configFields: [{ key: "endpoint_url", label: "Endpoint URL", type: "text", placeholder: "https://your-server.com/webhook" }, { key: "secret", label: "Secret Key", type: "password", placeholder: "Webhook secret for verification" }] },
};

function Integrations() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [filter, setFilter] = useState("all");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [connectModal, setConnectModal] = useState<{ provider: string; fields: Record<string, string> } | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      loadIntegrations();
      setLoading(false);
    });
  }, [navigate]);

  const loadIntegrations = async () => {
    try {
      const res = await fetch("/api/integrations");
      const data = await res.json();
      if (data.integrations) {
        // Merge API data with catalog
        const merged = Object.entries(PROVIDER_CATALOG).map(([provider, info]) => {
          const apiInt = data.integrations.find((i: any) => i.provider === provider);
          return {
            id: apiInt?.id || provider,
            provider,
            ...info,
            status: apiInt?.is_active ? "connected" : "disconnected" as "connected" | "disconnected",
            is_active: apiInt?.is_active || 0,
            config: apiInt?.config || {},
            credentials: apiInt?.credentials || {},
          };
        });
        setIntegrations(merged);
      }
    } catch (e) {
      // Fallback to catalog
      setIntegrations(
        Object.entries(PROVIDER_CATALOG).map(([provider, info]) => ({
          id: provider,
          provider,
          ...info,
          status: "disconnected" as "connected" | "disconnected",
        }))
      );
    }
  };

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleConnect = async () => {
    if (!connectModal) return;
    setConnecting(true);
    try {
      const res = await fetch("/api/integrations/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: connectModal.provider,
          credentials: connectModal.fields,
          config: {},
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", `${PROVIDER_CATALOG[connectModal.provider]?.name || connectModal.provider} connected successfully`);
        setConnectModal(null);
        loadIntegrations(); // Refresh
      } else {
        showToast("error", data.error || "Failed to connect");
      }
    } catch {
      showToast("error", "Connection error");
    }
    setConnecting(false);
  };

  const handleDisconnect = async (integration: Integration) => {
    if (!integration.id) return;
    try {
      const res = await fetch(`/api/integrations/${integration.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", `${integration.name} disconnected`);
        loadIntegrations();
      }
    } catch {
      showToast("error", "Failed to disconnect");
    }
  };

  const openConnectModal = (provider: string) => {
    const fields: Record<string, string> = {};
    setConnectModal({ provider, fields });
  };

  const filtered = filter === "all" ? integrations : integrations.filter(i => i.status === filter);
  const comingSoonProviders = ["five9"];

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Integrations</h1>
          <p className="text-sm text-gray-400 mt-1">Connect your tools to ElevateAI</p>
        </div>
        <div className="flex items-center gap-3">
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
        {filtered.map((int) => {
          const isComingSoon = comingSoonProviders.includes(int.provider);
          return (
            <div
              key={int.provider}
              className={`group rounded-2xl p-5 transition-all duration-300 hover:border-purple-500/20 hover:translate-y-[-1px] ${
                isComingSoon ? "opacity-75" : ""
              }`}
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(139,92,246,0.04) 50%, rgba(255,255,255,0.02) 100%)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: isComingSoon
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
                    {isComingSoon ? "Soon" : int.status}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-3">{int.desc}</p>

              {/* Action buttons */}
              {!isComingSoon && int.status === "disconnected" && (
                <button onClick={() => openConnectModal(int.provider)}
                  className="inline-block text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors">
                  Connect
                </button>
              )}
              {!isComingSoon && int.status === "connected" && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-green-400">✓ Connected</span>
                  <button onClick={() => openConnectModal(int.provider)}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                    Configure
                  </button>
                  <button onClick={() => handleDisconnect(int)}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors">
                    Disconnect
                  </button>
                </div>
              )}
              {isComingSoon && (
                <span className="text-xs text-gray-500">Coming soon</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Connect Modal */}
      {connectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="rounded-2xl p-6 w-full max-w-md"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(139,92,246,0.04) 50%, rgba(255,255,255,0.02) 100%)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            <h3 className="text-lg font-semibold text-white mb-2">
              {PROVIDER_CATALOG[connectModal.provider]?.name || connectModal.provider}
            </h3>
            <p className="text-sm text-gray-400 mb-4">Enter your credentials to connect</p>
            <div className="space-y-4">
              {PROVIDER_CATALOG[connectModal.provider]?.configFields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-300 mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    onChange={(e) => setConnectModal(prev => prev ? { ...prev, fields: { ...prev.fields, [field.key]: e.target.value } } : null)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
                  />
                </div>
              ))}
              <div className="flex gap-3 justify-end pt-2">
                <button onClick={() => setConnectModal(null)}
                  className="rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/10 transition-all">
                  Cancel
                </button>
                <button onClick={handleConnect} disabled={connecting}
                  className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:from-purple-500 hover:to-indigo-500 transition-all disabled:opacity-50">
                  {connecting ? "Connecting..." : "Connect"}
                </button>
              </div>
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