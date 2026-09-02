import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { UserSession } from "~/utils/auth";

export const Route = createFileRoute("/dashboard/rep/learning")({
  component: RepLearningPage,
});

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  duration_minutes: number;
  image_url: string;
  enrolled_progress: number;
  is_enrolled: boolean;
}

function RepLearningPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserSession | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then(async ({ user }) => {
        if (!user) {
          navigate({ to: "/login" });
          return;
        }
        setUser(user);
        await fetchCourses(user.id);
        setLoading(false);
      })
      .catch(() => {
        navigate({ to: "/login" });
      });
  }, [navigate]);

  const fetchCourses = async (userId: string) => {
    try {
      const res = await fetch("/api/dashboard/learning");
      const data = await res.json();
      setCourses(data.courses || []);
    } catch (e) {
      console.error("Failed to fetch courses", e);
      setCourses([]);
    }
  };

  const categories = ["all", ...new Set(courses.map((c) => c.category))];
  const filteredCourses = activeCategory === "all"
    ? courses
    : courses.filter((c) => c.category === activeCategory);

  const getDifficultyColor = (diff: string) => {
    switch (diff?.toLowerCase()) {
      case "beginner": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "intermediate": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "advanced": return "bg-red-500/10 text-red-400 border-red-500/20";
      default: return "bg-gray-500/10 text-ink-muted border-gray-500/20";
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat?.toLowerCase()) {
      case "sales": return "📞";
      case "communication": return "💬";
      case "product": return "📦";
      case "compliance": return "🛡️";
      case "leadership": return "🌟";
      default: return "📚";
    }
  };

  if (loading) return <RepLearningSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Learning Center</h1>
        <p className="text-sm text-ink-muted">Build your skills with curated courses</p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-xl px-3.5 py-2 text-xs font-medium transition-all ${
              activeCategory === cat
                ? "bg-accent-500/20 text-accent-300 border border-accent-500/30"
                : "text-ink-muted border border-edge hover:text-ink hover:bg-panel-raised"
            }`}
          >
            {cat === "all" ? "All" : `${getCategoryIcon(cat)} ${cat}`}
          </button>
        ))}
      </div>

      {/* Enrolled Courses Section */}
      {courses.filter((c) => c.is_enrolled).length > 0 && (
        <>
          <h2 className="text-base font-semibold text-ink mt-2">My Courses</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.filter((c) => c.is_enrolled).map((course, i) => (
              <div key={course.id} className="border border-edge bg-panel rounded-xl overflow-hidden animate-fade-up flex flex-col" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="h-28 bg-gradient-to-br from-accent-600/20 via-accent-600/20 to-accent-600/20 flex items-center justify-center border-b border-edge">
                  <span className="text-3xl">{getCategoryIcon(course.category)}</span>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium border ${getDifficultyColor(course.difficulty)}`}>
                      {course.difficulty}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-ink line-clamp-1">{course.title}</h3>
                  <p className="mt-1 text-xs text-ink-muted line-clamp-2 flex-1">{course.description}</p>
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] text-ink-faint">
                    <span>⏱️ {course.duration_minutes} min</span>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-ink-faint">Progress</span>
                      <span className="text-[10px] font-medium text-accent-300">{course.enrolled_progress}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-panel-raised overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-accent-500 to-accent-500 transition-all duration-500" style={{ width: `${course.enrolled_progress}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* All Courses */}
      <h2 className="text-base font-semibold text-ink mt-2">
        {courses.filter((c) => c.is_enrolled).length > 0 ? "Browse Courses" : "Available Courses"}
      </h2>

      {filteredCourses.length === 0 ? (
        <div className="border border-edge bg-panel rounded-xl p-12 text-center">
          <span className="text-4xl">📚</span>
          <h3 className="mt-4 text-lg font-medium text-ink">No courses found</h3>
          <p className="mt-1 text-sm text-ink-muted">
            {courses.length > 0 ? "No courses match your filter." : "Courses are being added. Check back later!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((course, i) => (
            <div key={course.id} className="border border-edge bg-panel rounded-xl overflow-hidden animate-fade-up flex flex-col" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="h-28 bg-gradient-to-br from-accent-600/20 via-accent-600/20 to-accent-600/20 flex items-center justify-center border-b border-edge">
                <span className="text-3xl">{getCategoryIcon(course.category)}</span>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <span className="rounded-full bg-panel-raised px-2.5 py-0.5 text-[10px] font-medium text-ink-muted border border-edge">{course.category}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium border ${getDifficultyColor(course.difficulty)}`}>
                    {course.difficulty}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-ink line-clamp-1">{course.title}</h3>
                <p className="mt-1 text-xs text-ink-muted line-clamp-2 flex-1">{course.description}</p>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-ink-faint">
                  <span>⏱️ {course.duration_minutes} min</span>
                </div>
                {course.is_enrolled ? (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-ink-faint">Progress</span>
                      <span className="text-[10px] font-medium text-accent-300">{course.enrolled_progress}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-panel-raised overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-accent-500 to-accent-500 transition-all duration-500" style={{ width: `${course.enrolled_progress}%` }} />
                    </div>
                  </div>
                ) : (
                  <button className="mt-2 w-full rounded-lg border border-accent-500/30 bg-accent-500/10 px-3 py-2 text-xs font-medium text-accent-300 transition-all hover:bg-accent-500/20 hover:border-accent-500/50">
                    Enroll Now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RepLearningSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-32 rounded-lg bg-panel-raised animate-pulse" />
        <div className="h-4 w-44 rounded-lg bg-panel-raised animate-pulse" />
      </div>
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-20 rounded-xl bg-panel-raised animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-edge bg-panel rounded-xl overflow-hidden">
            <div className="h-28 bg-panel-raised animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="h-4 w-20 rounded-full bg-panel-raised animate-pulse" />
              <div className="h-4 w-32 rounded bg-panel-raised animate-pulse" />
              <div className="h-3 w-full rounded bg-panel-raised animate-pulse" />
              <div className="h-8 w-full rounded-lg bg-panel-raised animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}