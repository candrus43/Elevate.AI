import { useEffect, useState } from "react";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassBadge, GlassButton, GlassInput, GlassSelect, GlassStatCard, LoadingSkeleton, EmptyState } from "~/components/GlassCard";
import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/academy/course/")({
  component: CourseDetail,
});

function CourseDetail() {
  const navigate = useNavigate();
  const params = useParams({ from: "/dashboard/academy/course/$courseId" });
  const courseId = params.courseId;
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

  const modules = [
    { id: "m1", title: "Introduction to Enterprise Sales", type: "Video", duration: "15 min", completed: true },
    { id: "m2", title: "Identifying Key Decision Makers", type: "Document", duration: "10 min", completed: true },
    { id: "m3", title: "Discovery Framework", type: "Video", duration: "25 min", completed: false },
    { id: "m4", title: "Building Value Propositions", type: "Playbook", duration: "20 min", completed: false },
    { id: "m5", title: "Handling Gatekeepers", type: "Script", duration: "12 min", completed: false },
    { id: "m6", title: "Closing Enterprise Deals", type: "Video", duration: "30 min", completed: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/academy/courses" className="text-2xl text-ink-muted hover:text-gray-600 dark:hover:text-ink-muted">&larr;</Link>
        <div className="flex-1"><h1 className="text-2xl font-bold text-ink">Enterprise Sales Mastery</h1><p className="text-sm text-ink-muted">Course Detail</p></div>
        <button className="rounded-xl text-white bg-gradient-to-r from-accent-600 to-accent-600 px-5 py-2.5 text-sm font-medium text-white hover:from-accent-500 hover:to-accent-500">Continue Learning</button>
      </div>

      {/* Course Header */}
      <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-accent-500/5 to-accent-500/5 p-6 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-900/50 dark:text-red-300">Advanced</span>
          <span className="rounded-full bg-accent-100 px-2 py-0.5 text-[10px] font-medium text-accent-700 dark:bg-accent-900/50 dark:text-accent-300">12 modules</span>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">8 hours</span>
        </div>
        <p className="text-sm text-ink-muted">Complete enterprise sales methodology covering discovery through close. Designed for experienced sales professionals.</p>
        <div className="flex items-center gap-6 mt-4 text-sm">
          <span className="flex items-center gap-1 text-ink-faint">👥 24 enrolled</span>
          <span className="flex items-center gap-1 text-ink-faint">📊 72% completion rate</span>
          <span className="flex items-center gap-1 text-ink-faint">⭐ 4.8 avg rating</span>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-ink-faint">Your Progress</span>
            <span className="font-medium text-ink-muted">2/6 modules · 33%</span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.06]">
            <div className="h-2 rounded-full bg-gradient-to-r from-accent-500 to-accent-500" style={{ width: "33%" }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Content Modules */}
        <div className="lg:col-span-2 rounded-2xl glass-subtle transition-all duration-300">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-ink">Course Modules</h3>
          </div>
          <div className="divide-y divide-edge">
            {modules.map((mod, i) => (
              <div key={mod.id} className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-white/[0.02]">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${mod.completed ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" : "bg-gray-100 text-ink-faint dark:bg-gray-800 dark:text-ink-muted"}`}>{i + 1}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink">{mod.title}</span>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600 dark:bg-gray-800 dark:text-ink-muted">{mod.type}</span>
                      <span className="text-xs text-ink-muted">{mod.duration}</span>
                    </div>
                  </div>
                </div>
                <span className={`text-sm ${mod.completed ? "text-green-500" : "text-ink-muted"}`}>{mod.completed ? "✓" : "○"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <h4 className="text-sm font-semibold text-ink mb-3">Related Quizzes</h4>
            <div className="space-y-2">
              <p className="text-sm text-ink-muted">Enterprise Sales Quiz #1</p>
              <p className="text-sm text-ink-muted">Enterprise Sales Quiz #2</p>
              <p className="text-sm text-ink-muted">Final Assessment</p>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <h4 className="text-sm font-semibold text-ink mb-3">Certification</h4>
            <p className="text-xs text-ink-faint mb-2">Complete all modules and pass the final assessment to earn:</p>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center dark:border-amber-800 dark:bg-amber-900/20">
              <span className="text-lg block mb-1">🎓</span>
              <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Enterprise Sales Certified</p>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <h4 className="text-sm font-semibold text-ink mb-3">Completion Stats</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-ink-faint">Enrolled</span><span className="font-medium text-ink">24</span></div>
              <div className="flex justify-between"><span className="text-ink-faint">Completed</span><span className="font-medium text-ink">16</span></div>
              <div className="flex justify-between"><span className="text-ink-faint">Avg Score</span><span className="font-medium text-green-600">82%</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}