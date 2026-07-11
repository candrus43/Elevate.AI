import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { UserSession } from "~/utils/auth";

export const Route = createFileRoute("/dashboard/billing")({
  component: BillingPage,
});

interface Plan {
  name: string;
  price: string;
  stripeLink: string;
  features: string[];
}

interface BillingData {
  company: { id: string; name: string; slug: string; tier: string; teamSize: number; created_at: string };
  currentPlan: Plan;
  allPlans: Record<string, Plan>;
}

const planOrder = ["core", "pro", "enterprise"];

function BillingPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BillingData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then(({ user }) => {
        if (!user) { navigate({ to: "/login" }); return; }
        setUser(user);
        loadBilling();
        setLoading(false);
      })
      .catch(() => navigate({ to: "/login" }));
  }, [navigate]);

  const loadBilling = async () => {
    try {
      const res = await fetch("/api/billing/plan");
      const json = await res.json();
      if (json.company) setData(json);
      else setError(json.error || "Failed to load billing info");
    } catch { setError("Connection error"); }
  };

  // Mock payment history
  const paymentHistory = [
    { date: "2026-07-01", amount: "$199.00", plan: "Enterprise", status: "Paid", method: "Visa •••• 4242" },
    { date: "2026-06-01", amount: "$199.00", plan: "Enterprise", status: "Paid", method: "Visa •••• 4242" },
    { date: "2026-05-01", amount: "$199.00", plan: "Enterprise", status: "Paid", method: "Visa •••• 4242" },
    { date: "2026-04-15", amount: "$79.00", plan: "Pro", status: "Paid", method: "Visa •••• 4242" },
    { date: "2026-03-15", amount: "$79.00", plan: "Pro", status: "Paid", method: "Visa •••• 4242" },
    { date: "2026-02-15", amount: "$29.00", plan: "Core", status: "Paid", method: "Visa •••• 4242" },
  ];

  if (loading) return <BillingSkeleton />;

  if (error) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <span className="text-4xl">💳</span>
        <h3 className="mt-4 text-lg font-medium text-white">Error loading billing info</h3>
        <p className="mt-1 text-sm text-gray-400">{error}</p>
        <button onClick={loadBilling} className="btn-primary mt-4">Try Again</button>
      </div>
    );
  }

  if (!data) return null;

  const { company, currentPlan, allPlans } = data;
  const currentTier = company.tier;
  const tierIndex = planOrder.indexOf(currentTier);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Billing & Plan</h1>
        <p className="text-sm text-gray-400">Manage your subscription and billing information</p>
      </div>

      {/* Current Plan Card */}
      <div className="glass-card rounded-xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/30 to-indigo-600/30 border border-purple-500/20">
            <span className="text-2xl">💳</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">{currentPlan.name} Plan</h2>
              <span className="rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-0.5 text-xs font-medium">
                Active
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-1">{currentPlan.price} · {company.teamSize} team member{company.teamSize !== 1 ? "s" : ""}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white">{currentPlan.price}</p>
            <p className="text-xs text-gray-500">Next billing: Aug 1, 2026</p>
          </div>
        </div>
      </div>

      {/* Plan Comparison */}
      <div className="glass-card rounded-xl p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Compare Plans</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-3 pr-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Feature</th>
                {planOrder.map((key) => {
                  const plan = allPlans[key];
                  const isCurrent = key === currentTier;
                  return (
                    <th key={key} className={`py-3 px-4 text-center text-xs font-medium uppercase tracking-wider ${isCurrent ? "text-purple-300" : "text-gray-400"}`}>
                      <div className="flex flex-col items-center gap-1">
                        <span>{plan.name}</span>
                        <span className="text-[10px] font-normal">{plan.price}</span>
                        {isCurrent && <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">Current</span>}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {/* All features from all plans (deduplicated) */}
              {Array.from(new Set([...allPlans.core.features, ...allPlans.pro.features, ...allPlans.enterprise.features])).map((feature, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 pr-4 text-sm text-gray-300">{feature}</td>
                  {planOrder.map((key) => {
                    const plan = allPlans[key];
                    const has = plan.features.includes(feature);
                    return (
                      <td key={key} className="py-3 px-4 text-center">
                        {has ? (
                          <svg className="mx-auto h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upgrade/Downgrade Actions */}
      <div className="glass-card rounded-xl p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Change Plan</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {planOrder.map((key) => {
            const plan = allPlans[key];
            const isCurrent = key === currentTier;
            const isUpgrade = planOrder.indexOf(key) > tierIndex;
            const isDowngrade = planOrder.indexOf(key) < tierIndex;
            return (
              <div key={key} className={`rounded-xl border p-4 text-center ${isCurrent ? "border-purple-500/30 bg-purple-500/5" : "border-white/10 bg-white/5"}`}>
                <p className="text-lg font-bold text-white">{plan.name}</p>
                <p className="text-sm text-gray-400 mt-1">{plan.price}</p>
                {isCurrent ? (
                  <span className="btn-primary mt-3 inline-block px-4 py-2 text-xs cursor-default opacity-60">Current Plan</span>
                ) : (
                  <a href={plan.stripeLink} target="_blank" rel="noopener noreferrer"
                    className={`mt-3 inline-block rounded-xl px-4 py-2 text-xs font-medium transition-all ${
                      isUpgrade ? "bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30" : "bg-white/10 border border-white/10 text-gray-300 hover:bg-white/20"
                    }`}>
                    {isUpgrade ? "Upgrade →" : "Downgrade"}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment History */}
      <div className="glass-card rounded-xl p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Payment History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                <th className="py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Plan</th>
                <th className="py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Payment Method</th>
              </tr>
            </thead>
            <tbody>
              {paymentHistory.map((payment, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 text-sm text-gray-300">{new Date(payment.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                  <td className="py-3 text-sm font-medium text-white">{payment.amount}</td>
                  <td className="py-3 text-sm text-gray-300">{payment.plan}</td>
                  <td className="py-3">
                    <span className="rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-medium">{payment.status}</span>
                  </td>
                  <td className="py-3 text-right text-sm text-gray-400">{payment.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BillingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-32 rounded-lg bg-white/5 animate-pulse" />
        <div className="h-4 w-48 rounded-lg bg-white/5 animate-pulse" />
      </div>
      <div className="glass-card rounded-xl p-6 flex items-center gap-6">
        <div className="h-16 w-16 rounded-2xl bg-white/5 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-32 rounded bg-white/5 animate-pulse" />
          <div className="h-4 w-48 rounded bg-white/5 animate-pulse" />
        </div>
        <div className="h-8 w-24 rounded bg-white/5 animate-pulse" />
      </div>
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="h-5 w-32 rounded bg-white/5 animate-pulse" />
        <div className="h-40 w-full rounded bg-white/5 animate-pulse" />
      </div>
    </div>
  );
}