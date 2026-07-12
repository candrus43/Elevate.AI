import { LoadingSkeleton } from '~/components/GlassCard';
import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/ai-performance")({
  component: AIPerformance,
});

function AIPerformance() {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Performance Reviews</h1>
        <p className="text-sm text-gray-500">AI-generated performance reviews and insights</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Reviews Generated", value: "12", change: "+3 this month" },
          { label: "Avg. Performance", value: "76%", change: "+4% vs last quarter" },
          { label: "Improvement Rate", value: "82%", change: "+12% coaching impact" },
        ].map((stat, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-xs text-green-600 mt-1">{stat.change}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Reviews</h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {[
            { name: "Emily Watson", role: "SDR", period: "Q2 2026", score: 85, trend: "up", summary: "Strong improvement in discovery calls. Continue working on closing techniques." },
            { name: "James Kim", role: "AE", period: "Q2 2026", score: 72, trend: "up", summary: "Good objection handling. Needs to improve qualification questions." },
            { name: "Lisa Rodriguez", role: "SDR", period: "Q2 2026", score: 61, trend: "down", summary: "Struggling with talk-to-listen ratio. Recommend additional coaching." },
            { name: "Mike Chen", role: "Manager", period: "Q2 2026", score: 91, trend: "up", summary: "Excellent coaching skills. Team shows 15% improvement." },
          ].map((review, i) => (
            <div key={i} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{review.name}</p>
                  <p className="text-xs text-gray-500">{review.role} · {review.period}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${review.score >= 80 ? "text-green-600" : review.score >= 70 ? "text-amber-600" : "text-red-600"}`}>{review.score}%</span>
                  <span className={`text-xs ${review.trend === "up" ? "text-green-600" : "text-red-600"}`}>{review.trend === "up" ? "↑" : "↓"}</span>
                </div>
              </div>
              <p className="text-sm text-gray-500">{review.summary}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">AI Generated</span>
                <span className="text-xs text-gray-400">92% confidence</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}