import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassStatCard, GlassBadge, GlassButton, LoadingSkeleton } from "~/components/GlassCard";

export const Route = createFileRoute("/dashboard/crm-sync")({
  component: CRMSync,
});

function CRMSync() {
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

  const syncStats = [
    { label: "Total Records Synced", value: "12,847", change: "+342 today", icon: "📊" },
    { label: "Active Syncs", value: "3", change: "Running", icon: "🔄" },
    { label: "Failed Records", value: "23", change: "0.18% rate", icon: "⚠️" },
    { label: "Last Sync", value: "2 min ago", change: "Auto", icon: "⏱️" },
  ];

  const integrations = [
    { name: "Salesforce", icon: "SF", color: "bg-blue-500", status: "connected", lastSync: "2 min ago", records: 5432, fields: 24, direction: "bi-directional", syncInterval: "5 min" },
    { name: "HubSpot", icon: "HS", color: "bg-orange-500", status: "connected", lastSync: "5 min ago", records: 3891, fields: 18, direction: "bi-directional", syncInterval: "10 min" },
    { name: "Microsoft Dynamics", icon: "MD", color: "bg-blue-700", status: "disconnected", lastSync: "2 days ago", records: 3524, fields: 0, direction: "one-way", syncInterval: "—" },
  ];

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">CRM Deep Sync</h1>
          <p className="text-sm text-ink-muted mt-1">Bi-directional field-level sync with your CRM</p>
        </div>
        <GlassButton variant="primary">+ Add Integration</GlassButton>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {syncStats.map((stat, i) => (
          <GlassStatCard key={i} label={stat.label} value={stat.value} change={stat.change} icon={stat.icon} />
        ))}
      </div>

      <div className="space-y-4">
        {integrations.map((int, i) => (
          <GlassCard key={i} hover={true}>
            <div className="p-5 sm:p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${int.color} text-lg font-bold text-ink shadow-lg`}>
                    {int.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink">{int.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex h-2 w-2 rounded-full ${int.status === "connected" ? "bg-green-500" : "bg-gray-500"}`} />
                      <span className="text-xs text-ink-faint capitalize">{int.status}</span>
                      <span className="text-xs text-ink-faint">· Last sync: {int.lastSync}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {int.status === "connected" ? (
                    <GlassBadge color="green">✓ Connected</GlassBadge>
                  ) : (
                    <GlassButton variant="primary" className="!px-3 !py-1.5 !text-xs">Reconnect</GlassButton>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-4">
                <div>
                  <p className="text-xs text-ink-faint">Records</p>
                  <p className="text-sm font-medium text-ink">{int.records.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-faint">Fields Mapped</p>
                  <p className="text-sm font-medium text-ink">{int.fields}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-faint">Direction</p>
                  <p className="text-sm font-medium text-ink capitalize">{int.direction}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-faint">Sync Interval</p>
                  <p className="text-sm font-medium text-ink">{int.syncInterval}</p>
                </div>
              </div>

              {int.status === "connected" && (
                <div className="pt-4" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <GlassButton variant="secondary" className="!px-3 !py-1.5 !text-xs">Sync Now</GlassButton>
                      <GlassButton variant="secondary" className="!px-3 !py-1.5 !text-xs">Field Mapping</GlassButton>
                      <GlassButton variant="secondary" className="!px-3 !py-1.5 !text-xs">View Logs</GlassButton>
                    </div>
                    <GlassButton variant="ghost" className="!text-xs !text-red-400 hover:!text-red-300">Disconnect</GlassButton>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Field Mapping Table */}
      <GlassCard>
        <GlassCardHeader>
          <h3 className="text-lg font-semibold text-ink">Field Mapping Preview</h3>
        </GlassCardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
                <th className="px-6 py-3 font-medium text-ink-muted">ElevateAI Field</th>
                <th className="px-6 py-3 font-medium text-ink-muted">Salesforce Field</th>
                <th className="px-6 py-3 font-medium text-ink-muted">Direction</th>
                <th className="px-6 py-3 font-medium text-ink-muted">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge">
              {[
                { from: "Call Score", to: "Call_Score__c", dir: "Bi-directional", status: "active" },
                { from: "Coaching Notes", to: "Coaching_Notes__c", dir: "ElevateAI → CRM", status: "active" },
                { from: "Compliance Status", to: "Compliance_Status__c", dir: "Bi-directional", status: "active" },
                { from: "Last Call Date", to: "Last_Call_Date__c", dir: "ElevateAI → CRM", status: "active" },
                { from: "Skill Score", to: "Skill_Score__c", dir: "ElevateAI → CRM", status: "mapping_needed" },
              ].map((field, i) => (
                <tr key={i} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-6 py-3 font-medium text-ink">{field.from}</td>
                  <td className="px-6 py-3 text-ink-muted"><code className="text-accent-300/70">{field.to}</code></td>
                  <td className="px-6 py-3 text-ink-muted">{field.dir}</td>
                  <td className="px-6 py-3">
                    <GlassBadge color={field.status === "active" ? "green" : "amber"}>
                      {field.status === "active" ? "✓ Active" : "⚠ Needs Mapping"}
                    </GlassBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}