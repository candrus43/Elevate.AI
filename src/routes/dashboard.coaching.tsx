import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import type { UserSession } from "~/utils/auth";
import { getCompanyUsers, db } from "~/utils/db";
import { sql } from "~/utils/sql";

export const Route = createFileRoute("/dashboard/coaching")({
  component: CoachingPage,
});

interface CoachingPlan {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: string;
  due_date: string;
  created_at: string;
  user_name: string;
  completed_items: number;
  total_items: number;
}

function CoachingPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserSession | null>(null);
  const [plans, setPlans] = useState<CoachingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [generating, setGenerating] = useState(false);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [genResult, setGenResult] = useState<string | null>(null);

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
          // Fetch coaching plans from the DB
          const members = await getCompanyUsers(user.companyId);
          const planPromises = members.map(async (m: any) => {
            const plans = await fetchCoachingPlans(m.id);
            return plans.map((p: any) => ({
              ...p,
              user_name: m.name,
            }));
          });
          const allPlans = (await Promise.all(planPromises)).flat();
          setPlans(allPlans);
        } catch (e) {
          console.error("Failed to fetch coaching data", e);
        }
        setLoading(false);
      })
      .catch(() => {
        navigate({ to: "/login" });
      });
  }, [navigate]);

  const generatePlan = async (userId: string, userName: string) => {
    setGenerating(true);
    setGeneratingFor(userName);
    setGenResult(null);
    try {
      const res = await fetch("/api/coaching/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();
      if (data.success) {
        setGenResult(`AI plan "${data.plan.title}" generated for ${userName} with ${data.plan.items.length} items!`);
        // Reload plans
        if (user) {
          const members = await getCompanyUsers(user.companyId);
          const planPromises = members.map(async (m: any) => {
            const plans = await fetchCoachingPlans(m.id);
            return plans.map((p: any) => ({ ...p, user_name: m.name }));
          });
          const allPlans = (await Promise.all(planPromises)).flat();
          setPlans(allPlans);
        }
      } else {
        setGenResult(`Error: ${data.error || "Failed to generate plan"}`);
      }
    } catch (e) {
      setGenResult("Error: Failed to connect to server");
    }
    setGenerating(false);
    setGeneratingFor(null);
    setTimeout(() => setGenResult(null), 5000);
  };

  const filteredPlans = statusFilter === "all"
    ? plans
    : plans.filter((p) => p.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Coaching Plans</h1>
          <p className="text-sm text-ink-muted">
            {plans.length} plan{plans.length !== 1 ? "s" : ""} across your team
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => generatePlan(user?.id || "", "myself")}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-accent-fg hover:text-accent-300 transition-all"
            title="Generate AI coaching plan from call analysis"
          >
            <svg className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {generating ? `Generating for ${generatingFor}...` : "Generate AI Plan"}
          </button>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent-600 px-5 py-2.5 text-sm font-semibold text-white shadow-glow hover:bg-accent-500 active:bg-accent-700 active:scale-[0.98] transition-all">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Plan
          </button>
        </div>
      </div>

      {/* Generation result toast */}
      {genResult && (
        <div className="border border-edge bg-panel rounded-xl p-4 flex items-center gap-3 animate-fade-up border border-accent-500/25">
          <span className="text-lg">{genResult.includes("Error") ? "⚠️" : "✅"}</span>
          <p className="text-sm text-ink-muted">{genResult}</p>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2">
        {["all", "active", "completed", "cancelled"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              statusFilter === status
                ? "bg-accent-500/15 text-accent-300 border border-accent-500/30"
                : "text-ink-muted border border-edge hover:text-ink hover:bg-panel-raised"
            }`}
          >
            {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading ? (
        <CoachingSkeleton />
      ) : filteredPlans.length === 0 ? (
        /* Empty State */
        <div className="border border-edge bg-panel rounded-xl p-12 text-center">
          <span className="text-4xl">🎯</span>
          <h3 className="mt-4 text-lg font-medium text-ink">No coaching plans found</h3>
          <p className="mt-1 text-sm text-ink-muted">
            {plans.length > 0
              ? "No plans match the selected filter."
              : "Create your first coaching plan to help your team improve."}
          </p>
        </div>
      ) : (
        /* Plans List */
        <div className="space-y-4">
          {filteredPlans.map((plan, i) => {
            const progress =
              plan.total_items > 0
                ? Math.round((plan.completed_items / plan.total_items) * 100)
                : 0;

            return (
              <div
                key={plan.id}
                className="border border-edge bg-panel rounded-xl p-5 animate-fade-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Plan Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-ink truncate">
                        {plan.title}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          plan.status === "active"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : plan.status === "completed"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            : "bg-gray-500/10 text-ink-muted border border-gray-500/20"
                        }`}
                      >
                        {plan.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-ink-muted line-clamp-1">
                      {plan.description || "No description"}
                    </p>
                    <p className="mt-1 text-xs text-ink-faint">
                      For {plan.user_name}
                      {plan.due_date && ` · Due ${new Date(plan.due_date).toLocaleDateString()}`}
                    </p>
                  </div>

                  {/* Progress */}
                  <div className="flex items-center gap-4 sm:min-w-[200px]">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-ink-muted">Progress</span>
                        <span className="text-xs font-medium text-accent-fg">{progress}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-panel-raised overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-accent-500 to-accent-600 transition-all duration-700"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-ink-faint whitespace-nowrap">
                      {plan.completed_items}/{plan.total_items}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

async function fetchCoachingPlans(userId: string): Promise<any[]> {
  try {
    return await db(sql`
      SELECT cp.id, cp.user_id, cp.title, cp.description, cp.status, cp.due_date, cp.created_at,
        (SELECT COUNT(*) FROM coaching_plan_items cpi WHERE cpi.coaching_plan_id = cp.id) as total_items,
        (SELECT COUNT(*) FROM coaching_plan_items cpi WHERE cpi.coaching_plan_id = cp.id AND cpi.status = 'completed') as completed_items
        FROM coaching_plans cp WHERE cp.user_id = ${userId}
    `);
  } catch {
    return [];
  }
}

function CoachingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border border-edge bg-panel rounded-xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-5 w-40 rounded bg-panel-raised animate-pulse" />
                <div className="h-5 w-16 rounded-full bg-panel-raised animate-pulse" />
              </div>
              <div className="h-4 w-64 rounded bg-panel-raised animate-pulse" />
              <div className="h-3 w-36 rounded bg-panel-raised animate-pulse" />
            </div>
            <div className="w-full sm:w-48 space-y-2">
              <div className="h-3 w-full rounded bg-panel-raised animate-pulse" />
              <div className="h-2 w-full rounded-full bg-panel-raised animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}