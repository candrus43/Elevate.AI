import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  MetricCard,
  ResponsiveTable,
  Spinner,
} from "~/components/ui";

import type { UserSession } from "~/utils/auth";

export const Route = createFileRoute("/dashboard/")({
  component: ManagerDashboard,
});

function ManagerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserSession | null>(null);
  const [calls, setCalls] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(async ({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      try {
        const res = await fetch("/api/dashboard/overview");
        const data = await res.json();
        setCalls(data.calls || []);
        setMetrics(data.companyMetrics);
        setActivity(data.activity || []);
        setTeam((data.members || []).filter((u: any) => u.role === "rep"));
      } catch (e) {
        console.error("Failed to fetch dashboard data", e);
      }
      setLoading(false);
    });
  }, [navigate]);

  if (loading) return <div className="flex items-center justify-center h-48"><Spinner className="h-8 w-8 animate-spin text-accent-fg" /></div>;

  const avgScore = calls.length > 0 ? (calls.reduce((s, c) => s + (c.overall_score || 0), 0) / calls.length).toFixed(1) : "0";
  const analyzedCalls = calls.filter(c => c.status === "analyzed").length;
  const completionRate = metrics?.coaching_completion_rate ? `${(metrics.coaching_completion_rate * 100).toFixed(0)}%` : "-";

  // ── "Needs attention" signals derived from live data (no fabricated metrics) ──
  const attentionItems: Array<{ icon: string; title: string; detail: string; action: string; href: string }> = [];

  // Low-scoring reps (coaching opportunity)
  const repScoreMap = new Map<string, { sum: number; count: number }>();
  calls.forEach((c) => {
    if (c.rep_name && typeof c.overall_score === "number") {
      const cur = repScoreMap.get(c.rep_name) || { sum: 0, count: 0 };
      cur.sum += c.overall_score;
      cur.count += 1;
      repScoreMap.set(c.rep_name, cur);
    }
  });
  const lowScorers = [...repScoreMap.entries()]
    .map(([name, v]) => ({ name, avg: v.sum / v.count }))
    .filter((r) => r.avg < 70)
    .sort((a, b) => a.avg - b.avg);
  lowScorers.slice(0, 2).forEach((r) => {
    attentionItems.push({
      icon: "🎯",
      title: `${r.name} needs coaching`,
      detail: `Average call score ${r.avg.toFixed(0)} — below the 70 baseline.`,
      action: "Review coaching",
      href: "/dashboard/coaching",
    });
  });

  // Negative-sentiment calls (call quality risk)
  const negativeCalls = calls.filter((c) => c.sentiment === "negative");
  if (negativeCalls.length > 0) {
    attentionItems.push({
      icon: "⚠️",
      title: `${negativeCalls.length} call${negativeCalls.length === 1 ? "" : "s"} flagged negative`,
      detail: "Recent calls show negative customer sentiment worth a closer look.",
      action: "Open call reviews",
      href: "/dashboard/calls",
    });
  }

  // Coaching completion below target (follow-up)
  if (metrics?.coaching_completion_rate != null && metrics.coaching_completion_rate < 0.7) {
    attentionItems.push({
      icon: "📚",
      title: "Coaching follow-up needed",
      detail: `Coaching completion is at ${Math.round(metrics.coaching_completion_rate * 100)}%.`,
      action: "View coaching",
      href: "/dashboard/coaching",
    });
  }

  const firstName = (user?.name || "").split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Manager Dashboard</h1>
          <p className="text-sm text-ink-muted">Welcome back, {user?.name}</p>
        </div>
        <Button onClick={() => navigate({ to: "/dashboard/calls" })} size="sm">+ New Review</Button>
      </div>

      {/* Executive daily brief — stacked attention cards (mobile-first) */}
      <Card padding="none" className="overflow-hidden">
        <div className="border-b border-edge bg-gradient-to-r from-accent-500/10 to-transparent px-5 py-4">
          <p className="text-sm font-medium text-accent-300">{greeting}, {firstName} 👋</p>
          <h2 className="mt-0.5 text-lg font-semibold text-ink">
            {attentionItems.length > 0
              ? `${attentionItems.length} thing${attentionItems.length === 1 ? "" : "s"} need${attentionItems.length === 1 ? "s" : ""} your attention today`
              : "You're all caught up today"}
          </h2>
        </div>
        <CardBody className="space-y-3">
          {attentionItems.length === 0 ? (
            <p className="text-sm text-ink-muted">
              No low scores, negative sentiment, or overdue coaching detected. Keep up the momentum.
            </p>
          ) : (
            attentionItems.map((item, i) => (
              <Link
                key={i}
                to={item.href}
                className="flex items-start gap-3 rounded-xl border border-edge bg-panel-raised p-4 transition-all hover:border-accent-500/30 hover:bg-graphite-850"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-500/10 text-lg">
                  {item.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{item.title}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">{item.detail}</p>
                </div>
                <span className="shrink-0 self-center text-sm font-medium text-accent-fg">
                  {item.action} →
                </span>
              </Link>
            ))
          )}
        </CardBody>
      </Card>

      {/* KPI Cards from live data */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Team Avg Score" value={avgScore} hint="across all calls" />
        <MetricCard label="Calls Analyzed" value={String(analyzedCalls)} hint="total" />
        <MetricCard label="Coaching Completion" value={completionRate} hint="rate" />
        <MetricCard label="Active Reps" value={String(team.length)} hint="team members" />
      </div>

      {/* Activity + Recent Calls */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card padding="none">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            {activity.length === 0 && <p className="text-sm text-ink-faint">No recent activity</p>}
            {activity.map((item, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-panel-raised px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-ink">{item.user_name || "System"}</p>
                  <p className="text-xs text-ink-faint">{item.event_type?.replace(/_/g, " ")} · {item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}</p>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card padding="none">
          <CardHeader>
            <CardTitle>Recent Calls</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            {calls.slice(0, 5).map((call, i) => (
              <Link key={i} to="/dashboard/calls/$callId" params={{ callId: call.id }} className="flex items-center justify-between rounded-lg bg-panel-raised px-3 py-2.5 transition-colors hover:bg-graphite-850">
                <div>
                  <p className="text-sm font-medium text-ink">{call.rep_name || "Unknown"}</p>
                  <p className="text-xs text-ink-faint">{call.started_at ? new Date(call.started_at).toLocaleDateString() : ""} · {call.duration_seconds ? `${Math.floor(call.duration_seconds / 60)}m` : ""}</p>
                </div>
                <Badge tone={call.overall_score >= 85 ? "positive" : call.overall_score >= 70 ? "warning" : "negative"}>
                  {call.overall_score ?? "-"}
                </Badge>
              </Link>
            ))}
          </CardBody>
        </Card>
      </div>

      {/* Team Members — responsive: real table on desktop, stacked cards on mobile */}
      <Card padding="none" className="overflow-hidden">
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <div className="px-5 py-4">
          <ResponsiveTable
            data={team}
            getKey={(member: any) => member.id ?? member.name}
            columns={[
              {
                key: "name",
                header: "Name",
                primary: true,
                render: (member: any) => (
                  <div className="flex items-center gap-3">
                    <Avatar name={member.name} size="sm" />
                    <span className="font-medium text-ink">{member.name}</span>
                  </div>
                ),
              },
              {
                key: "role",
                header: "Role",
                render: (member: any) => (
                  <span className="capitalize text-ink-muted">{member.role}</span>
                ),
              },
              {
                key: "team",
                header: "Team",
                render: (member: any) => (
                  <span className="text-ink-muted">{member.team_name || "-"}</span>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (member: any) => (
                  <Badge tone={member.is_active ? "positive" : "neutral"} dot>
                    {member.is_active ? "Active" : "Inactive"}
                  </Badge>
                ),
              },
            ]}
          />
        </div>
      </Card>
    </div>
  );
}
