import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassStatCard, GlassBadge, GlassButton, GlassInput, LoadingSkeleton, EmptyState } from "~/components/GlassCard";

export const Route = createFileRoute("/dashboard/slack-notifications")({
  component: SlackNotifications,
});

function SlackNotifications() {
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

  const [notifications, setNotifications] = useState([
    { id: "n1", event: "Call Completed", channel: "#coaching-alerts", frequency: "Immediate", enabled: true, description: "When a call analysis completes with score" },
    { id: "n2", event: "Low Score Alert", channel: "#coaching-alerts", frequency: "Immediate", enabled: true, description: "When a rep scores below 60% on a call" },
    { id: "n3", event: "Coaching Opportunity", channel: "#coaching-alerts", frequency: "Daily digest", enabled: true, description: "AI-identified coaching opportunities" },
    { id: "n4", event: "Weekly Summary", channel: "#team-reports", frequency: "Weekly (Mon 9am)", enabled: true, description: "Team performance summary for the week" },
    { id: "n5", event: "Compliance Breach", channel: "#compliance", frequency: "Immediate", enabled: true, description: "When a compliance rule is violated" },
    { id: "n6", event: "New Rep Onboarded", channel: "#team-admin", frequency: "Immediate", enabled: false, description: "When a new rep completes onboarding" },
    { id: "n7", event: "Monthly Executive Report", channel: "#executive", frequency: "Monthly (1st)", enabled: false, description: "Monthly executive summary with KPIs" },
    { id: "n8", event: "Achievement Unlocked", channel: "#celebrations", frequency: "Immediate", enabled: true, description: "When a rep reaches a milestone or certification" },
  ]);

  const toggleNotification = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, enabled: !n.enabled } : n));
  };

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Slack Notifications</h1>
          <p className="text-sm text-gray-400 mt-1">Configure which events send notifications to Slack</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl px-4 py-2.5"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-purple-500 to-indigo-600 text-xs font-bold text-white">SL</div>
            <span className="text-sm font-medium text-gray-300">Connected to Slack</span>
            <span className="h-2 w-2 rounded-full bg-green-500" />
          </div>
        </div>
      </div>

      <GlassCard>
        <GlassCardHeader>
          <h3 className="text-lg font-semibold text-white">Notification Preferences</h3>
        </GlassCardHeader>
        <GlassCardBody divide>
          {notifications.map((n) => (
            <GlassCardRow key={n.id}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-white">{n.event}</p>
                  <GlassBadge>{n.channel}</GlassBadge>
                </div>
                <p className="text-sm text-gray-400 mt-0.5">{n.description}</p>
                <p className="text-xs text-gray-500 mt-0.5">{n.frequency}</p>
              </div>
              <button
                onClick={() => toggleNotification(n.id)}
                className={`relative ml-4 inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${n.enabled ? "bg-purple-600" : "bg-white/10"}`}
                role="switch"
                aria-checked={n.enabled}
                aria-label={`Toggle ${n.event}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${n.enabled ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </GlassCardRow>
          ))}
        </GlassCardBody>
      </GlassCard>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <GlassCard>
          <div className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "rgba(139, 92, 246, 0.1)" }}>
                <span className="text-lg">📢</span>
              </div>
              <div>
                <p className="font-medium text-white">Configure Channels</p>
                <p className="text-xs text-gray-500">Manage Slack channels</p>
              </div>
            </div>
            <div className="space-y-2">
              {["#coaching-alerts", "#team-reports", "#compliance", "#celebrations", "#executive", "#team-admin"].map((ch, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl px-3 py-2" style={{ background: "rgba(255, 255, 255, 0.03)" }}>
                  <span className="text-sm text-gray-300">{ch}</span>
                  <span className="text-xs text-green-400">✓</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "rgba(139, 92, 246, 0.1)" }}>
                <span className="text-lg">📊</span>
              </div>
              <div>
                <p className="font-medium text-white">Digest Schedule</p>
                <p className="text-xs text-gray-500">Configure frequency</p>
              </div>
            </div>
            <div className="space-y-2">
              <GlassButton variant="secondary" className="!w-full">Daily: 9:00 AM</GlassButton>
              <GlassButton variant="secondary" className="!w-full">Weekly: Monday 9:00 AM</GlassButton>
              <GlassButton variant="secondary" className="!w-full">Monthly: 1st day</GlassButton>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "rgba(139, 92, 246, 0.1)" }}>
                <span className="text-lg">🔔</span>
              </div>
              <div>
                <p className="font-medium text-white">Test Notification</p>
                <p className="text-xs text-gray-500">Send a test to Slack</p>
              </div>
            </div>
            <GlassButton variant="primary" className="!w-full">Send Test</GlassButton>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}