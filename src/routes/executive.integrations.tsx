import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { LoadingSkeleton, GlassCard, GlassCardHeader, GlassCardBody, GlassBadge } from "~/components/GlassCard";

export const Route = createFileRoute("/executive/integrations")({
  component: ExecutiveIntegrations,
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
  is_active?: number;
}

const PROVIDER_CATALOG: Record<string, { name: string; icon: string; desc: string; color: string; category: string }> = {
  salesforce: { name: "Salesforce", icon: "SF", desc: "Sync call data and coaching scores to Salesforce", color: "bg-blue-500", category: "CRM" },
  hubspot: { name: "HubSpot", icon: "HS", desc: "Import contacts and sync call activities", color: "bg-orange-500", category: "CRM" },
  hodu: { name: "Hodu Phone", icon: "HP", desc: "Connect HoduCC phone system for call sync, click-to-dial, and live streaming", color: "bg-indigo-600", category: "Dialer" },
  five9: { name: "Five9", icon: "F9", desc: "Integrate with Five9 contact center", color: "bg-green-600", category: "Dialer" },
  slack: { name: "Slack", icon: "SL", desc: "Get coaching alerts and reports in Slack", color: "bg-purple-500", category: "Communication" },
  zoom: { name: "Zoom", icon: "ZM", desc: "Record and analyze Zoom meetings", color: "bg-blue-600", category: "Video" },
  ringcentral: { name: "RingCentral", icon: "RC", desc: "Connect your RingCentral dialer", color: "bg-red-500", category: "Dialer" },
  aircall: { name: "Aircall", icon: "AC", desc: "Sync Aircall calls and contacts", color: "bg-yellow-500", category: "Dialer" },
  twilio: { name: "Twilio", icon: "TW", desc: "Build custom voice workflows", color: "bg-red-600", category: "Dialer" },
  openai: { name: "AI Provider", icon: "🤖", desc: "AI engine for call analysis, role-play, and coaching", color: "bg-green-600", category: "AI" },
  observeai: { name: "Observe.ai", icon: "OA", desc: "Real conversation intelligence powered by AI", color: "bg-emerald-600", category: "AI" },
  thoughtspot: { name: "ThoughtSpot", icon: "TS", desc: "Pull analytics data to enrich coaching dashboards", color: "bg-indigo-600", category: "Analytics" },
  msteams: { name: "Microsoft Teams", icon: "MT", desc: "Analyze Teams call recordings", color: "bg-purple-600", category: "Video" },
  google: { name: "Google Workspace", icon: "GW", desc: "Sync calendar and contacts", color: "bg-blue-500", category: "Productivity" },
  microsoft: { name: "Microsoft 365", icon: "M3", desc: "Calendar and email integration", color: "bg-blue-700", category: "Productivity" },
};

function ExecutiveIntegrations() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [filter, setFilter] = useState("all");

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
        const merged = Object.entries(PROVIDER_CATALOG).map(([provider, info]) => {
          const apiInt = data.integrations.find((i: any) => i.provider === provider);
          return {
            id: apiInt?.id || provider,
            provider,
            ...info,
            status: apiInt?.is_active ? "connected" : "disconnected" as "connected" | "disconnected",
            is_active: apiInt?.is_active || 0,
          };
        });
        setIntegrations(merged);
      }
    } catch {
      setIntegrations(
        Object.entries(PROVIDER_CATALOG).map(([provider, info]) => ({
          id: provider,
          provider,
          ...info,
          status: "disconnected" as const,
          is_active: 0,
        }))
      );
    }
  };

  const categories = ["all", ...new Set(Object.values(PROVIDER_CATALOG).map((p) => p.category))];
  const filtered = filter === "all" ? integrations : integrations.filter((i) => i.category === filter);

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Integrations</h1>
        <p className="text-sm text-gray-400">Connect your tools to ElevateAI for seamless data sync and automation</p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              filter === cat
                ? "bg-purple-500/20 text-purple-300"
                : "text-gray-500 hover:text-gray-300 bg-white/5"
            }`}
          >
            {cat === "all" ? "All" : cat}
          </button>
        ))}
      </div>

      {/* Integration grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((integration) => (
          <Link
            key={integration.provider}
            to={`/executive/integrations/${integration.provider}`}
            className="group rounded-2xl p-5 transition-all duration-300 hover:border-purple-500/20 hover:translate-y-[-1px]"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(139,92,246,0.04) 50%, rgba(255,255,255,0.02) 100%)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            <div className="flex items-start gap-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${integration.color} shadow-lg shrink-0`}>
                {integration.icon.length > 2 ? (
                  <span className="text-lg">{integration.icon}</span>
                ) : (
                  <span className="text-xs font-bold text-white">{integration.icon}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="font-medium text-white group-hover:text-purple-300 transition-colors truncate">{integration.name}</h3>
                  <GlassBadge variant={integration.status === "connected" ? "success" : "default"}>
                    {integration.status === "connected" ? "Connected" : "Disconnected"}
                  </GlassBadge>
                </div>
                <p className="text-sm text-gray-400 line-clamp-2">{integration.desc}</p>
                <span className="inline-block mt-2 text-[10px] text-gray-500 uppercase tracking-wider">{integration.category}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}