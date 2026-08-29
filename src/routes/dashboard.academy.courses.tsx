import { useEffect, useState } from "react";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassBadge, GlassButton, GlassInput, GlassSelect, GlassStatCard, LoadingSkeleton, EmptyState } from "~/components/GlassCard";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/academy/courses")({
  component: CourseCatalog,
});

function CourseCatalog() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      setLoading(false);
    });
  }, [navigate]);

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  const courses = [
    { id: "course-1", title: "Enterprise Sales Mastery", description: "Complete enterprise sales methodology covering discovery through close", modules: 12, duration: "8h", difficulty: "Advanced", enrolled: 24, progress: 72, color: "from-accent-500 to-accent-600" },
    { id: "course-2", title: "Product Knowledge: ElevateAI v3", description: "Deep dive into ElevateAI platform features, integrations, and use cases", modules: 8, duration: "4h", difficulty: "Beginner", enrolled: 42, progress: 88, color: "from-emerald-500 to-green-600" },
    { id: "course-3", title: "Objection Handling Masterclass", description: "Master techniques for handling the top 10 sales objections", modules: 10, duration: "6h", difficulty: "Intermediate", enrolled: 18, progress: 0, color: "from-amber-500 to-orange-600" },
    { id: "course-4", title: "Active Listening for Sales", description: "Develop active listening skills to uncover customer needs", modules: 6, duration: "3h", difficulty: "Beginner", enrolled: 36, progress: 0, color: "from-cyan-500 to-blue-600" },
    { id: "course-5", title: "Negotiation Tactics", description: "Advanced negotiation frameworks for complex enterprise deals", modules: 8, duration: "5h", difficulty: "Advanced", enrolled: 12, progress: 0, color: "from-rose-500 to-pink-600" },
    { id: "course-6", title: "Cold Calling 2.0", description: "Modern cold calling techniques that actually work in 2026", modules: 6, duration: "3h", difficulty: "Intermediate", enrolled: 30, progress: 0, color: "from-accent-500 to-accent-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/academy" className="text-2xl text-ink-muted hover:text-gray-600 dark:hover:text-ink-muted">&larr;</Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-ink">Course Catalog</h1>
          <p className="text-sm text-ink-muted">Browse and enroll in training courses</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="rounded-xl text-white bg-gradient-to-r from-accent-600 to-accent-600 px-4 py-2.5 text-sm font-medium text-white hover:from-accent-500 hover:to-accent-500">+ Create Course</button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Link key={course.id} to={`/dashboard/academy/course/${course.id}`} className="group rounded-xl border border-gray-200 bg-white transition-all hover:shadow-lg dark:border-gray-700 dark:bg-gray-900">
            <div className={`h-2 rounded-t-xl bg-gradient-to-r ${course.color}`} />
            <div className="p-5">
              <div className="flex items-start justify-between mb-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  course.difficulty === "Advanced" ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" :
                  course.difficulty === "Intermediate" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" :
                  "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                }`}>{course.difficulty}</span>
                <span className="text-xs text-ink-muted">{course.duration}</span>
              </div>
              <h4 className="font-semibold text-ink group-hover:text-accent-600 dark:group-hover:text-accent-400">{course.title}</h4>
              <p className="text-xs text-ink-faint mt-1">{course.description}</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-ink-muted">
                <span>{course.modules} modules</span>
                <span>{course.enrolled} enrolled</span>
              </div>
              {course.progress > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-ink-faint">Progress</span>
                    <span className="font-medium text-ink-muted">{course.progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.06]">
                    <div className="h-1.5 rounded-full bg-gradient-to-r from-accent-500 to-accent-500" style={{ width: `${course.progress}%` }} />
                  </div>
                </div>
              )}
              <button className="mt-4 w-full rounded-lg text-white bg-gradient-to-r from-accent-600 to-accent-600 py-2 text-xs font-medium text-white hover:from-accent-500 hover:to-accent-500">{course.progress > 0 ? "Continue" : "Enroll"}</button>
            </div>
          </Link>
        ))}
      </div>

      {/* Create Course Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-ink">Create Course</h3>
              <button onClick={() => setShowCreate(false)} className="text-2xl text-ink-muted hover:text-gray-600">&times;</button>
            </div>
            <div className="space-y-4">
              <div><label className="mb-1.5 block text-sm font-medium text-ink-muted">Title</label><input type="text" placeholder="Course title" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-ink-faint focus:border-accent-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-ink" /></div>
              <div><label className="mb-1.5 block text-sm font-medium text-ink-muted">Description</label><textarea rows={3} placeholder="Course description..." className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-ink-faint focus:border-accent-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-ink" /></div>
              <div><label className="mb-1.5 block text-sm font-medium text-ink-muted">Difficulty</label>
                <select className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-accent-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-ink">
                  <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                </select>
              </div>
              <div><label className="mb-1.5 block text-sm font-medium text-ink-muted">Content Modules</label>
                <div className="max-h-32 overflow-y-auto space-y-2 rounded-lg border border-gray-200 p-2 dark:border-gray-700">
                  {["ElevateAI Product Demo", "Cold Calling Script", "Objection: Price Too High", "Discovery Best Practices"].map((item, i) => (
                    <label key={i} className="flex items-center gap-2 text-sm text-ink-muted"><input type="checkbox" className="rounded border-gray-300" /> {item}</label>
                  ))}
                </div>
              </div>
              <button className="w-full rounded-xl text-white bg-gradient-to-r from-accent-600 to-accent-600 py-2.5 text-sm font-medium text-white hover:from-accent-500 hover:to-accent-500">Create Course</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}