import { useEffect, useState } from "react";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassBadge, GlassButton, GlassInput, GlassSelect, GlassStatCard, LoadingSkeleton, EmptyState } from "~/components/GlassCard";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/ai-assistant/briefing")({
  component: DailyBriefing,
});

function DailyBriefing() {
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

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate({ to: "/dashboard/ai-assistant" })} className="text-2xl text-ink-muted hover:text-gray-600 dark:hover:text-ink-muted">&larr;</button>
        <div>
          <h1 className="text-2xl font-bold text-ink">Daily Briefing</h1>
          <p className="text-sm text-ink-muted">{today}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-accent-500/5 to-accent-500/5 p-6 dark:border-gray-700 dark:from-accent-500/10 dark:to-accent-500/10">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 text-2xl text-white">🤖</div>
          <div>
            <h3 className="text-lg font-semibold text-ink">Good morning! Here's your team briefing</h3>
            <p className="text-sm text-ink-muted mt-2">
              Your team completed 24 calls yesterday with an average score of 74%. Taylor Brooks showed the most improvement (+8%).
              Riley Morgan needs attention — her score dropped 15% this week. I've prioritized coaching items below.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { label: "Calls Yesterday", value: "24", icon: "🎧", detail: "+3 vs Monday" },
          { label: "Avg Score", value: "74%", icon: "📊", detail: "+2% increase" },
          { label: "Coaching Sessions", value: "3", icon: "🎯", detail: "2 scheduled today" },
          { label: "Top Performer", value: "Jordan Lee", icon: "🏆", detail: "91% on calls" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <span className="text-xl">{s.icon}</span>
            <p className="mt-2 text-xl font-bold text-ink">{s.value}</p>
            <p className="text-xs text-ink-faint">{s.label}</p>
            <p className="text-xs text-green-600 mt-0.5">{s.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl glass-subtle transition-all duration-300">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700"><h3 className="text-lg font-semibold text-ink">Today's Schedule</h3></div>
          <div className="divide-y divide-edge">
            {[
              { time: "9:00 AM", title: "Team Standup", type: "meeting", with: "Full team" },
              { time: "10:30 AM", title: "Coaching Session: Taylor Brooks", type: "coaching", with: "Taylor Brooks" },
              { time: "1:00 PM", title: "1:1 with Drew Patel", type: "meeting", with: "Drew Patel" },
              { time: "3:00 PM", title: "Review Riley's calls", type: "review", with: "Self" },
              { time: "4:30 PM", title: "Prepare weekly report", type: "admin", with: "Self" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-3 transition-colors hover:bg-white/[0.02]">
                <span className="text-xs font-medium text-ink-faint w-16 shrink-0">{item.time}</span>
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${item.type === "coaching" ? "bg-green-100 text-green-700 dark:bg-green-900/50" : item.type === "meeting" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50" : "bg-gray-100 text-gray-600 dark:bg-gray-800"}`}>
                  {item.type === "coaching" ? "🎯" : item.type === "meeting" ? "👥" : "📋"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink">{item.title}</p>
                  <p className="text-xs text-ink-faint">{item.with}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl glass-subtle transition-all duration-300">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700"><h3 className="text-lg font-semibold text-ink">AI Recommendations</h3></div>
          <div className="divide-y divide-edge">
            {[
              { action: "Prioritize Riley Morgan coaching", reason: "Score dropped 15% this week", priority: "high" },
              { action: "Review Taylor Brooks's discovery calls", reason: "Shows strong improvement pattern", priority: "high" },
              { action: "Prepare team for new product launch", reason: "Training materials available", priority: "medium" },
              { action: "Schedule compliance refresher", reason: "2 reps flagged this week", priority: "medium" },
            ].map((r, i) => (
              <div key={i} className="px-6 py-4 transition-colors hover:bg-white/[0.02]">
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 text-lg ${r.priority === "high" ? "text-amber-500" : "text-blue-500"}`}>💡</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-ink">{r.action}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${r.priority === "high" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" : "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"}`}>{r.priority}</span>
                    </div>
                    <p className="text-sm text-ink-faint">{r.reason}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}