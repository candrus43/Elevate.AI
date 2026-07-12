import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassStatCard, GlassBadge, GlassButton, LoadingSkeleton, EmptyState } from "~/components/GlassCard";

export const Route = createFileRoute("/dashboard/academy")({
  component: AcademyDashboard,
});

function AcademyDashboard() {
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

  const stats = [
    { label: "Courses In Progress", value: "4", color: "from-blue-500 to-cyan-600", icon: "📖" },
    { label: "Certifications Earned", value: "3", color: "from-emerald-500 to-green-600", icon: "🎓" },
    { label: "Quiz Avg Score", value: "82%", color: "from-violet-500 to-purple-600", icon: "📝" },
    { label: "Learning Hours", value: "24.5", color: "from-amber-500 to-orange-600", icon: "⏱️" },
  ];

  const inProgress = [
    { title: "Enterprise Sales Mastery", progress: 72, type: "Course", due: "2 weeks" },
    { title: "Objection Handling Deep Dive", progress: 45, type: "Path", due: "1 month" },
    { title: "Product Knowledge: ElevateAI v3", progress: 88, type: "Course", due: "3 days" },
  ];

  const recommended = [
    { title: "Advanced Negotiation Tactics", type: "Course", difficulty: "Advanced", duration: "4h" },
    { title: "C-Suite Communication", type: "Path", difficulty: "Intermediate", duration: "6h" },
    { title: "Cold Calling 2.0", type: "Quiz", difficulty: "Beginner", duration: "30m" },
  ];

  const quickLinks = [
    { label: "Training Library", href: "/dashboard/academy/library", icon: "📚" },
    { label: "Course Catalog", href: "/dashboard/academy/courses", icon: "📖" },
    { label: "Quiz Center", href: "/dashboard/academy/quizzes", icon: "📝" },
    { label: "Certifications", href: "/dashboard/academy/certifications", icon: "🎓" },
    { label: "Learning Paths", href: "/dashboard/academy/learning-paths", icon: "🗺️" },
    { label: "AI Knowledge", href: "/dashboard/academy/knowledge", icon: "🤖" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Coaching Academy</h1>
        <p className="text-sm text-gray-400 mt-1">Enterprise training platform — learn, practice, and certify</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s, i) => (
          <GlassStatCard key={i} label={s.label} value={s.value} color={s.color} icon={s.icon} />
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {quickLinks.map((link, i) => (
          <Link
            key={i}
            to={link.href}
            className="rounded-2xl p-3 sm:p-4 text-center transition-all duration-300 hover:border-purple-500/20 hover:translate-y-[-1px]"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(139,92,246,0.04) 50%, rgba(255,255,255,0.02) 100%)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            <span className="text-xl block mb-1">{link.icon}</span>
            <p className="text-[11px] font-medium text-gray-300">{link.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Continue Learning */}
        <GlassCard>
          <GlassCardHeader>
            <h3 className="text-sm font-semibold text-white">Continue Learning</h3>
          </GlassCardHeader>
          <GlassCardBody divide>
            {inProgress.length === 0 ? (
              <div className="px-5 sm:px-6 py-8">
                <p className="text-sm text-gray-400 text-center">No courses in progress. Start learning today!</p>
              </div>
            ) : (
              inProgress.map((item, i) => (
                <GlassCardRow key={i}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">{item.title}</span>
                      <GlassBadge color="purple">{item.type}</GlassBadge>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full" style={{ background: "rgba(255, 255, 255, 0.06)" }}>
                        <div className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500" style={{ width: `${item.progress}%` }} />
                      </div>
                      <span className="text-xs font-medium text-gray-300">{item.progress}%</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">Due in {item.due}</p>
                  </div>
                </GlassCardRow>
              ))
            )}
          </GlassCardBody>
        </GlassCard>

        {/* Recommended */}
        <GlassCard>
          <GlassCardHeader>
            <h3 className="text-sm font-semibold text-white">Recommended for You</h3>
          </GlassCardHeader>
          <GlassCardBody divide>
            {recommended.length === 0 ? (
              <div className="px-5 sm:px-6 py-8">
                <p className="text-sm text-gray-400 text-center">No recommendations yet. Check back soon!</p>
              </div>
            ) : (
              recommended.map((item, i) => (
                <GlassCardRow key={i}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <GlassBadge color={
                        item.difficulty === "Advanced" ? "red" :
                        item.difficulty === "Intermediate" ? "amber" : "green"
                      }>{item.difficulty}</GlassBadge>
                      <span className="text-[10px] text-gray-500">{item.duration}</span>
                      <span className="text-[10px] text-gray-500">{item.type}</span>
                    </div>
                  </div>
                  <GlassButton variant="primary" className="!px-3 !py-1.5 !text-xs">Start</GlassButton>
                </GlassCardRow>
              ))
            )}
          </GlassCardBody>
        </GlassCard>
      </div>
    </div>
  );
}