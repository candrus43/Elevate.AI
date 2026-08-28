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
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "~/components/ui";

import { getCompanyCalls, getCompanyMetrics, getRecentActivity, getCompanyUsers } from "~/utils/db";

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
        const [callsData, metricsData, activityData, teamData] = await Promise.all([
          getCompanyCalls(user.companyId),
          getCompanyMetrics(user.companyId),
          getRecentActivity(user.companyId, 8),
          getCompanyUsers(user.companyId),
        ]);
        setCalls(callsData);
        setMetrics(metricsData);
        setActivity(activityData);
        setTeam(teamData.filter((u: any) => u.role === "rep"));
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Manager Dashboard</h1>
          <p className="text-sm text-ink-muted">Welcome back, {user?.name}</p>
        </div>
        <Button onClick={() => navigate({ to: "/dashboard/calls" })} size="sm">+ New Review</Button>
      </div>

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

      {/* Team Members */}
      <Card padding="none" className="overflow-hidden">
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Role</TableHeaderCell>
              <TableHeaderCell>Team</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {team.map((member, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar name={member.name} size="sm" />
                    <span className="font-medium text-ink">{member.name}</span>
                  </div>
                </TableCell>
                <TableCell className="capitalize text-ink-muted">{member.role}</TableCell>
                <TableCell className="text-ink-muted">{member.team_name || "-"}</TableCell>
                <TableCell>
                  <Badge tone={member.is_active ? "positive" : "neutral"} dot>{member.is_active ? "Active" : "Inactive"}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
