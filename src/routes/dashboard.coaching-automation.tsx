import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassStatCard, GlassBadge, GlassButton, LoadingSkeleton, EmptyState } from "~/components/GlassCard";

export const Route = createFileRoute("/dashboard/coaching-automation")({
  component: CoachingAutomation,
});

function CoachingAutomation() {
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

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  const dailyBriefing = {
    date: "Jul 11, 2026",
    priorities: ["Review Alex's call recordings (3 pending)", "Follow up on Sarah's improvement plan", "Prepare for 1:1 with James"],
    summary: "Your team completed 12 coaching sessions this week (+20% vs last week). Enterprise Sales team leads with 92% coaching effectiveness. Watch for Maria's compliance scores — they dropped to 72%.",
  };

  const reminders = [
    { title: "1:1 with Sarah Chen", date: "Today, 2:00 PM", type: "Meeting" },
    { title: "Weekly Coaching Report Due", date: "Tomorrow, 5:00 PM", type: "Report" },
    { title: "Review Alex's Roleplay Session", date: "Jul 14, 2026", type: "Review" },
  ];

  const alerts = [
    { message: "Maria's objection handling score dropped to 58%", severity: "high" as const, time: "2h ago" },
    { message: "Enterprise Sales team completed all assigned courses", severity: "low" as const, time: "5h ago" },
    { message: "James hasn't completed a coaching session in 7 days", severity: "medium" as const, time: "1d ago" },
  ];

  const tasks = [
    { title: "Create coaching plan for new hire", assignee: "Self", priority: "High" as const, status: "To Do" as const },
    { title: "Review quarterly performance reports", assignee: "Self", priority: "Medium" as const, status: "In Progress" as const },
    { title: "Schedule team training session", assignee: "Alex", priority: "Low" as const, status: "Done" as const },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Coaching Automation</h1>
          <p className="text-sm text-gray-400 mt-1">Automate coaching workflows and stay on top of your team</p>
        </div>
        <div className="flex gap-2">
          <GlassButton variant="secondary" href="/dashboard/coaching-automation/briefings">Schedule Report</GlassButton>
          <GlassButton variant="primary" href="/dashboard/coaching-automation/reminders">+ Reminder</GlassButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Daily Briefing */}
        <GlassCard className="lg:col-span-2">
          <GlassCardHeader>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white">Daily Briefing</h3>
              <GlassBadge color="purple">{dailyBriefing.date}</GlassBadge>
            </div>
            <GlassButton variant="primary" className="!px-3 !py-1.5 !text-xs">View Full</GlassButton>
          </GlassCardHeader>
          <GlassCardBody>
            <div className="p-5 sm:p-6 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Today's Priorities</p>
                <ul className="space-y-1.5">
                  {dailyBriefing.priorities.map((p, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-300">{i + 1}</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl p-4" style={{ background: "rgba(139, 92, 246, 0.08)", border: "1px solid rgba(139, 92, 246, 0.15)" }}>
                <p className="text-xs font-medium text-purple-300 mb-0.5">AI-Generated Summary</p>
                <p className="text-sm text-purple-200/70">{dailyBriefing.summary}</p>
              </div>
            </div>
          </GlassCardBody>
        </GlassCard>

        {/* Quick Actions */}
        <div className="space-y-3">
          <Link to="/dashboard/coaching-automation/briefings" className="block rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:border-purple-500/20 hover:translate-y-[-1px]"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(139,92,246,0.04) 50%, rgba(255,255,255,0.02) 100%)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
            }}>
            <span className="text-lg block mb-1">📊</span>
            <p className="text-sm font-medium text-white">Weekly Report</p>
            <p className="text-xs text-gray-400 mt-0.5">Generate and schedule reports</p>
            <GlassBadge color="green" className="!mt-2">Auto-generating ✓</GlassBadge>
          </Link>
          <Link to="/dashboard/coaching-automation/briefings" className="block rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:border-purple-500/20 hover:translate-y-[-1px]"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(139,92,246,0.04) 50%, rgba(255,255,255,0.02) 100%)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
            }}>
            <span className="text-lg block mb-1">📅</span>
            <p className="text-sm font-medium text-white">Monthly Report</p>
            <p className="text-xs text-gray-400 mt-0.5">Due in 5 days</p>
            <GlassButton variant="primary" className="!mt-2 !px-3 !py-1 !text-xs">Generate Now</GlassButton>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Reminders */}
        <GlassCard>
          <GlassCardHeader>
            <h3 className="text-sm font-semibold text-white">Upcoming Reminders</h3>
            <Link to="/dashboard/coaching-automation/reminders" className="text-xs text-purple-400 hover:text-purple-300">View All</Link>
          </GlassCardHeader>
          <GlassCardBody divide>
            {reminders.map((r, i) => (
              <GlassCardRow key={i} hover={false}>
                <div>
                  <p className="text-sm font-medium text-white">{r.title}</p>
                  <p className="text-xs text-gray-500">{r.date}</p>
                  <GlassBadge>{r.type}</GlassBadge>
                </div>
              </GlassCardRow>
            ))}
          </GlassCardBody>
        </GlassCard>

        {/* Alerts */}
        <GlassCard>
          <GlassCardHeader>
            <h3 className="text-sm font-semibold text-white">Recent Alerts</h3>
            <Link to="/dashboard/coaching-automation/alerts" className="text-xs text-purple-400 hover:text-purple-300">View All</Link>
          </GlassCardHeader>
          <GlassCardBody divide>
            {alerts.map((a, i) => (
              <GlassCardRow key={i} hover={false}>
                <div className="flex items-start gap-2">
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                    a.severity === "high" ? "bg-red-500" : a.severity === "medium" ? "bg-amber-500" : "bg-green-500"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300">{a.message}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{a.time}</p>
                  </div>
                </div>
              </GlassCardRow>
            ))}
          </GlassCardBody>
        </GlassCard>

        {/* Tasks Overview */}
        <GlassCard>
          <GlassCardHeader>
            <h3 className="text-sm font-semibold text-white">Coaching Tasks</h3>
            <Link to="/dashboard/coaching-automation/tasks" className="text-xs text-purple-400 hover:text-purple-300">View All</Link>
          </GlassCardHeader>
          <GlassCardBody divide>
            {tasks.map((t, i) => (
              <GlassCardRow key={i} hover={false}>
                <div className="flex items-start justify-between gap-2 w-full">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">{t.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <GlassBadge color={t.priority === "High" ? "red" : t.priority === "Medium" ? "amber" : "green"}>{t.priority}</GlassBadge>
                      <span className="text-[10px] text-gray-500">{t.assignee}</span>
                    </div>
                  </div>
                  <GlassBadge color={t.status === "Done" ? "green" : t.status === "In Progress" ? "blue" : "default"}>{t.status}</GlassBadge>
                </div>
              </GlassCardRow>
            ))}
          </GlassCardBody>
        </GlassCard>
      </div>
    </div>
  );
}