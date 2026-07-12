import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/ai-onboarding")({
  component: AIOnboarding,
});

function AIOnboarding() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      setLoading(false);
    });
  }, [navigate]);

  if (loading) return <div className="flex items-center justify-center h-48"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" /></div>;

  const steps = [
    { num: 1, title: "Connect Your Tools", desc: "Link your CRM and dialer to ElevateAI", icon: "🔌", status: step >= 1 ? "completed" : "pending" },
    { num: 2, title: "Set Up Scorecards", desc: "Define what great looks like for your team", icon: "📋", status: step >= 2 ? "completed" : "pending" },
    { num: 3, title: "Configure Compliance", desc: "Set up compliance rules and alerts", icon: "🛡️", status: step >= 3 ? "completed" : "pending" },
    { num: 4, title: "Invite Your Team", desc: "Add reps and managers to the platform", icon: "👥", status: step >= 4 ? "completed" : "pending" },
    { num: 5, title: "First Call Analysis", desc: "Record and analyze your first call", icon: "🎧", status: step >= 5 ? "completed" : "pending" },
    { num: 6, title: "AI Coaching Setup", desc: "Enable live coaching and AI suggestions", icon: "🤖", status: step >= 6 ? "completed" : "pending" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-2xl text-white">🚀</div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI-Guided Onboarding</h1>
          <p className="text-sm text-gray-500">Let AI guide you through setting up ElevateAI</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Setup Progress</h2>
            <div className="space-y-0">
              {steps.map((s, i) => (
                <div key={i} className="relative flex items-start gap-4 pb-6 last:pb-0">
                  {i < steps.length - 1 && <div className="absolute left-5 top-10 h-full w-0.5 bg-gray-200 dark:bg-gray-700" />}
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    s.status === "completed" ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                  }`}>
                    {s.status === "completed" ? "✓" : s.num}
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 dark:text-white">{s.title}</h3>
                      {s.status === "completed" ? (
                        <span className="text-xs text-green-600">Complete</span>
                      ) : (
                        <button onClick={() => setStep(s.num)} className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500">Start</button>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">AI Insights</h3>
            <div className="space-y-3">
              <div className="rounded-lg bg-indigo-50 p-3 dark:bg-indigo-900/20">
                <div className="flex items-center gap-1 text-xs text-indigo-700 dark:text-indigo-300 mb-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  AI Tip
                </div>
                <p className="text-xs text-indigo-600 dark:text-indigo-400">Based on your industry, we recommend starting with compliance rules first.</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
                <p className="text-xs text-amber-700 dark:text-amber-300">💡 Complete step 1 to unlock personalized recommendations</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Estimated Time</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">~15 min</p>
            <p className="text-xs text-gray-500 mt-1">Complete all steps to go live</p>
          </div>
        </div>
      </div>
    </div>
  );
}