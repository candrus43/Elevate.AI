import { useEffect, useState } from "react";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassBadge, GlassButton, GlassInput, GlassSelect, GlassStatCard, LoadingSkeleton, EmptyState } from "~/components/GlassCard";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/academy/learning-paths")({
  component: LearningPaths,
});

function LearningPaths() {
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

  const paths = [
    { id: "path-1", title: "Sales Foundations", steps: 6, description: "Build your core sales skills from the ground up", enrolled: 38, progress: 72, color: "from-accent-500 to-accent-600" },
    { id: "path-2", title: "Objection Handling Pro", steps: 4, description: "Master the art of handling any objection", enrolled: 24, progress: 45, color: "from-amber-500 to-orange-600" },
    { id: "path-3", title: "Enterprise Sales Mastery", steps: 8, description: "Complete enterprise sales journey from discovery to close", enrolled: 18, progress: 30, color: "from-emerald-500 to-green-600" },
    { id: "path-4", title: "Product Certification Prep", steps: 5, description: "Prepare for ElevateAI product certification", enrolled: 42, progress: 0, color: "from-cyan-500 to-blue-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/academy" className="text-2xl text-ink-muted hover:text-gray-600 dark:hover:text-ink-muted">&larr;</Link>
        <div><h1 className="text-2xl font-bold text-ink">Learning Paths</h1><p className="text-sm text-ink-muted">Structured learning journeys to master key skills</p></div>
      </div>

      <div className="space-y-4">
        {paths.map((path) => (
          <div key={path.id} className="rounded-xl border border-gray-200 bg-white transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
            <div className={`h-1.5 rounded-t-xl bg-gradient-to-r ${path.color}`} />
            <div className="p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-lg font-semibold text-ink">{path.title}</h4>
                  <p className="text-sm text-ink-faint">{path.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-muted">{path.steps} steps</span>
                  <span className="text-xs text-ink-muted">👥 {path.enrolled}</span>
                </div>
              </div>

              {/* Progress Bar */}
              {path.progress > 0 ? (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-ink-faint">Progress</span>
                    <span className="font-medium text-ink-muted">{path.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.06]">
                    <div className={`h-2 rounded-full bg-gradient-to-r ${path.color}`} style={{ width: `${path.progress}%` }} />
                  </div>
                </div>
              ) : null}

              {/* Steps */}
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: path.steps }).map((_, i) => (
                  <div key={i} className={`h-2 flex-1 rounded-full ${i < Math.floor(path.steps * path.progress / 100) ? path.color.replace("from-", "bg-").split(" ")[0] : "bg-white/[0.06]"}`} />
                ))}
              </div>

              <button className={`w-full rounded-lg py-2 text-xs font-medium text-white ${path.progress > 0 ? "text-white bg-gradient-to-r from-accent-600 to-accent-600 hover:from-accent-500 hover:to-accent-500" : "text-white bg-gradient-to-r from-accent-600 to-accent-600 hover:from-accent-500 hover:to-accent-500"}`}>
                {path.progress > 0 ? "Continue" : "Enroll"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}