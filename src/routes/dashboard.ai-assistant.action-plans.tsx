import { useEffect, useState } from "react";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassBadge, GlassButton, GlassInput, GlassSelect, GlassStatCard, LoadingSkeleton, EmptyState } from "~/components/GlassCard";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/ai-assistant/action-plans")({
  component: ActionPlans,
});

function ActionPlans() {
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

  const plans = [
    {
      id: "p1", rep: "Lisa Rodriguez", title: "Objection Handling Improvement Plan", status: "active", progress: 35,
      items: [
        { text: "Complete objection handling module", done: true },
        { text: "Practice with AI role-play (3 sessions)", done: true },
        { text: "Shadow top performer on 5 calls", done: false },
        { text: "Apply techniques on 10 live calls", done: false },
        { text: "Score 80%+ on objection handling assessment", done: false },
      ],
      dueDate: "Jul 25, 2026", priority: "high",
    },
    {
      id: "p2", rep: "James Kim", title: "Discovery Call Mastery", status: "active", progress: 60,
      items: [
        { text: "Review discovery call framework", done: true },
        { text: "Practice 5 discovery scenarios", done: true },
        { text: "Record and self-review 3 calls", done: false },
        { text: "Achieve 80%+ on discovery scorecard", done: false },
      ],
      dueDate: "Jul 18, 2026", priority: "medium",
    },
    {
      id: "p3", rep: "Emily Watson", title: "Advanced Closing Techniques", status: "planning", progress: 10,
      items: [
        { text: "Complete closing techniques workshop", done: false },
        { text: "Practice with AI role-play", done: false },
        { text: "Review 5 successful closes", done: false },
        { text: "Achieve 85%+ on closing scorecard", done: false },
      ],
      dueDate: "Aug 1, 2026", priority: "low",
    },
    {
      id: "p4", rep: "Mike Chen", title: "Compliance Certification", status: "completed", progress: 100,
      items: [
        { text: "Complete compliance training", done: true },
        { text: "Pass compliance assessment", done: true },
        { text: "Maintain 100% compliance for 30 days", done: true },
      ],
      dueDate: "Jul 5, 2026", priority: "completed",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate({ to: "/dashboard/ai-assistant" })} className="text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&larr;</button>
          <div>
            <h1 className="text-2xl font-bold text-white">Action Plans</h1>
            <p className="text-sm text-gray-400">AI-generated coaching plans for your team</p>
          </div>
        </div>
        <button className="rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:from-purple-500 hover:to-indigo-500">+ New Plan</button>
      </div>

      <div className="space-y-4">
        {plans.map((plan) => (
          <div key={plan.id} className="rounded-xl border border-gray-200 bg-white transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${plan.priority === "high" ? "bg-amber-500" : plan.priority === "medium" ? "bg-blue-500" : plan.priority === "low" ? "bg-gray-500" : "bg-green-500"}`}>
                    {plan.rep.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{plan.rep}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${plan.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" : plan.status === "planning" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>{plan.status}</span>
                    </div>
                    <p className="text-sm text-white mt-0.5">{plan.title}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{plan.progress}%</p>
                  <p className="text-xs text-gray-500">Due {plan.dueDate}</p>
                </div>
              </div>

              <div className="h-2 rounded-full bg-white/[0.06] mb-4">
                <div className={`h-2 rounded-full transition-all duration-500 ${plan.progress === 100 ? "bg-green-500" : "bg-indigo-500"}`} style={{ width: `${plan.progress}%` }} />
              </div>

              <div className="space-y-2">
                {plan.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${item.done ? "bg-green-500" : "border-2 border-gray-300 dark:border-gray-600"}`}>
                      {item.done && <span className="text-xs text-white">✓</span>}
                    </div>
                    <span className={`text-sm ${item.done ? "text-gray-400 line-through" : "text-gray-300"}`}>{item.text}</span>
                  </div>
                ))}
              </div>

              {plan.status !== "completed" && (
                <div className="mt-4 flex items-center gap-2">
                  <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Mark Complete</button>
                  <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Edit</button>
                  <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30">Archive</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}