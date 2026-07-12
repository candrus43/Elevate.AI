import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassBadge, GlassButton, LoadingSkeleton } from "~/components/GlassCard";

export const Route = createFileRoute("/dashboard/ai-assistant")({
  component: AIAssistant,
});

function AIAssistant() {
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

  const priorities = [
    { rep: "Emily Watson", action: "Review discovery call technique", score: 72, urgency: "high", time: "Today" },
    { rep: "James Kim", action: "Objection handling practice session", score: 65, urgency: "high", time: "Today" },
    { rep: "Lisa Rodriguez", action: "Closing technique coaching needed", score: 58, urgency: "critical", time: "ASAP" },
    { rep: "Mike Chen", action: "Prepare for weekly 1:1 meeting", score: 88, urgency: "medium", time: "Tomorrow" },
    { rep: "Sarah Park", action: "Review compliance score improvement", score: 82, urgency: "low", time: "This week" },
  ];

  const strengths = [
    { rep: "Emily Watson", strength: "Discovery Questions", score: 92 },
    { rep: "James Kim", strength: "Product Knowledge", score: 88 },
    { rep: "Lisa Rodriguez", strength: "Objection Handling", score: 54 },
    { rep: "Mike Chen", strength: "Closing", score: 91 },
  ];

  const riskAlerts = [
    { rep: "Lisa Rodriguez", risk: "Score declined 15% this month", severity: "high", daysSinceImprovement: 21 },
    { rep: "Alex Turner", risk: "No coaching sessions in 14 days", severity: "medium", daysSinceImprovement: 14 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Manager Assistant</h1>
          <p className="text-sm text-gray-400 mt-1">Daily coaching priorities, insights, and recommendations</p>
        </div>
        <div className="flex gap-2">
          <GlassButton variant="secondary" href="/dashboard/ai-assistant/briefing">Daily Briefing</GlassButton>
          <GlassButton variant="primary" href="/dashboard/ai-assistant/action-plans">Action Plans</GlassButton>
        </div>
      </div>

      {/* Today's Priorities */}
      <GlassCard>
        <GlassCardHeader>
          <h3 className="text-lg font-semibold text-white">Today's Coaching Priorities</h3>
          <GlassBadge color="purple">{priorities.length} items</GlassBadge>
        </GlassCardHeader>
        <GlassCardBody divide>
          {priorities.map((p, i) => (
            <GlassCardRow key={i}>
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-lg ${
                  p.urgency === "critical" ? "bg-red-500" : p.urgency === "high" ? "bg-amber-500" : p.urgency === "medium" ? "bg-blue-500" : "bg-gray-500"
                }`}>
                  {p.rep.split(" ").map((n: string) => n[0]).join("")}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <a href={`/dashboard/ai-assistant/rep/${p.rep.toLowerCase().replace(" ", "-")}`} className="font-medium text-white hover:text-purple-400 transition-colors">{p.rep}</a>
                    <GlassBadge color={p.urgency === "critical" ? "red" : p.urgency === "high" ? "amber" : p.urgency === "medium" ? "blue" : "default"}>{p.urgency}</GlassBadge>
                  </div>
                  <p className="text-sm text-gray-400 mt-0.5">{p.action}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <span className="text-sm font-medium text-white">{p.score}%</span>
                <span className="text-xs text-gray-500 w-16 text-right">{p.time}</span>
              </div>
            </GlassCardRow>
          ))}
        </GlassCardBody>
      </GlassCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Rep Strengths */}
        <GlassCard>
          <GlassCardHeader>
            <h3 className="text-lg font-semibold text-white">Rep Strengths & Weaknesses</h3>
          </GlassCardHeader>
          <GlassCardBody divide>
            {strengths.map((s, i) => (
              <GlassCardRow key={i}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{s.rep}</span>
                    <span className="text-xs text-gray-500">{s.strength}</span>
                  </div>
                  <span className={`text-sm font-bold ${s.score >= 80 ? "text-green-400" : s.score >= 60 ? "text-amber-400" : "text-red-400"}`}>{s.score}%</span>
                </div>
                <div className="h-1.5 rounded-full w-full mt-2" style={{ background: "rgba(255, 255, 255, 0.06)" }}>
                  <div className={`h-1.5 rounded-full ${s.score >= 80 ? "bg-gradient-to-r from-green-500 to-emerald-500" : s.score >= 60 ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-gradient-to-r from-red-500 to-rose-500"}`} style={{ width: `${s.score}%` }} />
                </div>
              </GlassCardRow>
            ))}
          </GlassCardBody>
        </GlassCard>

        {/* Risk Alerts */}
        <GlassCard>
          <GlassCardHeader>
            <h3 className="text-lg font-semibold text-white">Rep Risk Alerts</h3>
            <GlassBadge color="red">{riskAlerts.length} alerts</GlassBadge>
          </GlassCardHeader>
          <GlassCardBody divide>
            {riskAlerts.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-gray-500">No risk alerts at this time</div>
            ) : (
              riskAlerts.map((r, i) => (
                <GlassCardRow key={i}>
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 text-lg ${r.severity === "high" ? "text-red-400" : "text-amber-400"}`}>⚠️</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{r.rep}</span>
                        <GlassBadge color={r.severity === "high" ? "red" : "amber"}>{r.severity}</GlassBadge>
                      </div>
                      <p className="text-sm text-gray-400 mt-0.5">{r.risk}</p>
                      <p className="text-xs text-gray-500 mt-1">{r.daysSinceImprovement} days since last improvement</p>
                    </div>
                  </div>
                </GlassCardRow>
              ))
            )}
          </GlassCardBody>
        </GlassCard>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { href: "/dashboard/ai-assistant/briefing", icon: "📋", title: "Daily Briefing", desc: "AI-generated summary" },
          { href: "/dashboard/ai-assistant/action-plans", icon: "📝", title: "Action Plans", desc: "Coaching plans" },
          { href: "/dashboard/executive", icon: "📊", title: "Analytics", desc: "Team performance" },
          { href: "/dashboard/ai-assistant", icon: "🎯", title: "Recommendations", desc: "AI suggestions" },
        ].map((item, i) => (
          <a
            key={i}
            href={item.href}
            className="rounded-2xl p-4 transition-all duration-300 hover:border-purple-500/20 hover:translate-y-[-1px]"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(139,92,246,0.04) 50%, rgba(255,255,255,0.02) 100%)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            <span className="text-2xl block mb-2">{item.icon}</span>
            <p className="font-medium text-white">{item.title}</p>
            <p className="text-xs text-gray-500">{item.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}