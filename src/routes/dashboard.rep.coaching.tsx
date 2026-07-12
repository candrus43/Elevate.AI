import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { UserSession } from "~/utils/auth";
import { getUserCoachingPlan } from "~/utils/db";

export const Route = createFileRoute("/dashboard/rep/coaching")({
  component: RepCoachingPage,
});

function RepCoachingPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserSession | null>(null);
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then(async ({ user }) => {
        if (!user) {
          navigate({ to: "/login" });
          return;
        }
        setUser(user);
        try {
          const data = await getUserCoachingPlan(user.id);
          setPlan(data);
        } catch (e) {
          console.error("Failed to fetch coaching plan", e);
        }
        setLoading(false);
      })
      .catch(() => {
        navigate({ to: "/login" });
      });
  }, [navigate]);

  if (loading) return <RepCoachingSkeleton />;

  const completedItems = plan?.items?.filter((i: any) => i.status === "completed").length || 0;
  const totalItems = plan?.items?.length || 0;
  const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Coaching Plan</h1>
        <p className="text-sm text-gray-400">Your personalized development plan</p>
      </div>

      {!plan ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <span className="text-4xl">🎯</span>
          <h3 className="mt-4 text-lg font-medium text-white">No active coaching plan</h3>
          <p className="mt-1 text-sm text-gray-400">Your manager hasn't assigned a coaching plan yet.</p>
        </div>
      ) : (
        <>
          {/* Plan Header */}
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-start gap-4">
              <span className="text-3xl">📋</span>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-white">{plan.title}</h2>
                {plan.description && (
                  <p className="mt-1 text-sm text-gray-400">{plan.description}</p>
                )}
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                  {plan.due_date && <span>Due {new Date(plan.due_date).toLocaleDateString()}</span>}
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                    plan.status === "active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                    plan.status === "completed" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                    "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                  }`}>
                    {plan.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Progress</span>
                <span className="text-sm font-medium text-purple-400">{progress}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">{completedItems} of {totalItems} items completed</p>
            </div>
          </div>

          {/* Plan Items */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-base font-semibold text-white mb-4">Plan Items</h3>
            <div className="space-y-3">
              {plan.items.map((item: any, i: number) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-lg bg-white/5 p-3 transition-all hover:bg-white/10"
                >
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                    item.status === "completed"
                      ? "border-emerald-500 bg-emerald-500"
                      : "border-gray-600"
                  }`}>
                    {item.status === "completed" && (
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      item.status === "completed" ? "text-gray-500 line-through" : "text-white"
                    }`}>
                      {item.title}
                    </p>
                    {item.completed_at && (
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        Completed {new Date(item.completed_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {item.status !== "completed" && (
                    <button className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-300 hover:bg-purple-500/20 transition-all">
                      Mark Done
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function RepCoachingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-36 rounded-lg bg-white/5 animate-pulse" />
        <div className="h-4 w-52 rounded-lg bg-white/5 animate-pulse" />
      </div>
      <div className="glass-card rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 rounded bg-white/5 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-48 rounded bg-white/5 animate-pulse" />
            <div className="h-4 w-64 rounded bg-white/5 animate-pulse" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-white/5 animate-pulse" />
          <div className="h-3 rounded-full bg-white/5 animate-pulse" />
        </div>
      </div>
      <div className="glass-card rounded-xl p-5 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-6 w-6 rounded-full bg-white/5 animate-pulse" />
            <div className="flex-1 h-4 w-36 rounded bg-white/5 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}