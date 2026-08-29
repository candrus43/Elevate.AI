import { LoadingSkeleton } from '~/components/GlassCard';
import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/advanced-coaching/development")({
  component: DevelopmentPlans,
});

function DevelopmentPlans() {
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

  const devPlans = [
    {
      id: "d1", rep: "Taylor Brooks", role: "SDR", plan: "From SDR to AE Ready", duration: "3 months", progress: 45,
      stages: [
        { name: "Discovery Mastery", progress: 90, status: "completed" },
        { name: "Objection Handling", progress: 60, status: "active" },
        { name: "Demo Skills", progress: 20, status: "upcoming" },
        { name: "Closing Techniques", progress: 0, status: "upcoming" },
      ],
      nextMilestone: "Complete objection handling module by Jul 20",
      mentor: "Mike Chen",
    },
    {
      id: "d2", rep: "James Kim", role: "AE", plan: "Enterprise Sales Excellence", duration: "6 months", progress: 30,
      stages: [
        { name: "Executive Communication", progress: 70, status: "completed" },
        { name: "Complex Deal Management", progress: 40, status: "active" },
        { name: "C-Suite Relationship Building", progress: 10, status: "upcoming" },
        { name: "Strategic Account Planning", progress: 0, status: "upcoming" },
      ],
      nextMilestone: "Complete complex deal case study by Jul 25",
      mentor: "Sarah Connor",
    },
    {
      id: "d3", rep: "Casey Nguyen", role: "SDR", plan: "Foundation Building", duration: "2 months", progress: 25,
      stages: [
        { name: "Product Knowledge", progress: 80, status: "completed" },
        { name: "Call Framework", progress: 40, status: "active" },
        { name: "Lead Qualification", progress: 10, status: "upcoming" },
        { name: "Pipeline Management", progress: 0, status: "upcoming" },
      ],
      nextMilestone: "Complete call framework practice by Jul 18",
      mentor: "Taylor Brooks",
    },
    {
      id: "d4", rep: "Mike Chen", role: "AE", plan: "Coaching Certification", duration: "4 months", progress: 65,
      stages: [
        { name: "Coaching Fundamentals", progress: 100, status: "completed" },
        { name: "Feedback Techniques", progress: 85, status: "completed" },
        { name: "Observation & Assessment", progress: 50, status: "active" },
        { name: "Certification Exam Prep", progress: 20, status: "upcoming" },
      ],
      nextMilestone: "Complete 5 observed coaching sessions by Aug 1",
      mentor: "Sarah Connor",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate({ to: "/dashboard/advanced-coaching" })} className="text-2xl text-ink-muted hover:text-gray-600 dark:hover:text-ink-muted">&larr;</button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-ink">Individual Development Plans</h1>
          <p className="text-sm text-ink-faint dark:text-ink-muted">Personalized growth roadmaps for each team member</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { label: "Active Plans", value: "4", icon: "📋", change: "100% of team" },
          { label: "Avg. Progress", value: "41%", icon: "📊", change: "+8% this month" },
          { label: "Completed Stages", value: "6", icon: "✅", change: "This quarter" },
          { label: "Mentor Sessions", value: "14", icon: "👥", change: "This month" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xl">{s.icon}</span>
              <span className="text-xs text-green-600 font-medium">{s.change}</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-ink">{s.value}</p>
            <p className="text-xs text-ink-faint">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {devPlans.map((plan) => (
          <div key={plan.id} className="rounded-xl border border-gray-200 bg-white transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-600 text-lg font-bold text-white">
                    {plan.rep.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 dark:text-ink">{plan.rep}</p>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-ink-muted">{plan.role}</span>
                    </div>
                    <p className="text-sm text-gray-900 dark:text-ink">{plan.plan}</p>
                    <p className="text-xs text-ink-faint">{plan.duration} · Mentor: {plan.mentor}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900 dark:text-ink">{plan.progress}%</p>
                  <p className="text-xs text-ink-faint">Complete</p>
                </div>
              </div>

              <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 mb-4">
                <div className="h-2 rounded-full bg-gradient-to-r from-accent-500 to-accent-500" style={{ width: `${plan.progress}%` }} />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 mb-4">
                {plan.stages.map((stage, i) => (
                  <div key={i} className={`rounded-lg border p-3 ${
                    stage.status === "completed" ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20" :
                    stage.status === "active" ? "border-accent-200 bg-accent-50 dark:border-accent-800 dark:bg-accent-900/20" :
                    "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${
                        stage.status === "completed" ? "text-green-700 dark:text-green-300" :
                        stage.status === "active" ? "text-accent-700 dark:text-accent-300" :
                        "text-ink-faint"
                      }`}>{stage.status}</span>
                      <span className="text-xs font-medium text-gray-900 dark:text-ink">{stage.progress}%</span>
                    </div>
                    <p className={`text-sm font-medium ${
                      stage.status === "completed" ? "text-green-800 dark:text-green-200" :
                      stage.status === "active" ? "text-accent-800 dark:text-accent-200" :
                      "text-gray-600 dark:text-ink-muted"
                    }`}>{stage.name}</p>
                    <div className="mt-1.5 h-1 rounded-full bg-gray-200 dark:bg-gray-700">
                      <div className={`h-1 rounded-full ${
                        stage.status === "completed" ? "bg-green-500" :
                        stage.status === "active" ? "bg-accent-500" :
                        "bg-gray-400"
                      }`} style={{ width: `${stage.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-600 dark:text-amber-400">🎯 {plan.nextMilestone}</span>
                </div>
                <div className="flex gap-2">
                  <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-ink-muted dark:hover:bg-gray-800">View Plan</button>
                  <button className="rounded-lg bg-accent-600 px-3 py-1.5 text-xs font-medium text-ink hover:bg-accent-500">Schedule Check-in</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}