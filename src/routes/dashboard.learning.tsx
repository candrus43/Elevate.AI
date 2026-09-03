import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { EmptyState } from '~/components/EmptyState';
import type { UserSession } from "~/utils/auth";

export const Route = createFileRoute("/dashboard/learning")({
  component: LearningPage,
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

function LearningPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserSession | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeDifficulty, setActiveDifficulty] = useState("all");

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
  const difficulties = ["all", ...new Set(courses.map((c) => c.difficulty))];

  const filteredCourses = courses.filter((c) => {
    const matchesCategory = activeCategory === "all" || c.category === activeCategory;
    const matchesDifficulty = activeDifficulty === "all" || c.difficulty === activeDifficulty;
    return matchesCategory && matchesDifficulty;
  });

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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-ink">Learning Center</h1>
        <p className="text-sm text-ink-muted">Level up your skills with curated courses</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <p className="text-xs font-medium text-ink-faint mb-2 uppercase tracking-wide">Category</p>
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
        </div>
        <div>
          <p className="text-xs font-medium text-ink-faint mb-2 uppercase tracking-wide">Difficulty</p>
          <div className="flex flex-wrap gap-2">
            {difficulties.map((diff) => (
              <button
                key={diff}
                onClick={() => setActiveDifficulty(diff)}
                className={`rounded-xl px-3.5 py-2 text-xs font-medium transition-all ${
                  activeDifficulty === diff
                    ? "bg-accent-500/20 text-accent-300 border border-accent-500/30"
                    : "text-ink-muted border border-edge hover:text-ink hover:bg-panel-raised"
                }`}
              >
                {diff === "all" ? "All" : diff.charAt(0).toUpperCase() + diff.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <LearningSkeleton />
      ) : filteredCourses.length === 0 ? (
        <EmptyState
          icon="📚"
          title={courses.length > 0 ? "No courses found" : "No courses available"}
          description={courses.length > 0 ? "No courses match your current filters. Try adjusting your selection." : "Courses are being prepared. Check back soon for new learning content!"}
          secondaryAction={courses.length > 0 ? { label: "Clear filters", onClick: () => { setActiveCategory("all"); setActiveDifficulty("all"); } } : undefined}
        />
      ) : (
        /* Course Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((course, i) => (
            <div
              key={course.id}
              className="border border-edge bg-panel rounded-xl overflow-hidden animate-fade-up flex flex-col"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* Course Image Placeholder */}
              <div className="h-32 sm:h-40 bg-gradient-to-br from-accent-600/20 via-accent-600/20 to-accent-600/20 flex items-center justify-center border-b border-edge">
                <span className="text-4xl">{getCategoryIcon(course.category)}</span>
              </div>

              {/* Course Body */}
              <div className="p-4 flex flex-col flex-1">
                {/* Tags */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="rounded-full bg-panel-raised px-2.5 py-0.5 text-[10px] font-medium text-ink-muted border border-edge">
                    {course.category}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium border ${getDifficultyColor(course.difficulty)}`}>
                    {course.difficulty}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="text-sm font-semibold text-ink line-clamp-1">{course.title}</h3>
                <p className="mt-1 text-xs text-ink-muted line-clamp-2 flex-1">{course.description}</p>

                {/* Duration */}
                <div className="mt-3 flex items-center gap-1.5 text-xs text-ink-faint">
                  <span>⏱️</span>
                  <span>{course.duration_minutes} min</span>
                </div>

                {/* Progress Bar for Enrolled */}
                {course.is_enrolled ? (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-ink-faint">Progress</span>
                      <span className="text-[10px] font-medium text-accent-300">{course.enrolled_progress}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-panel-raised overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-accent-500 to-accent-500 transition-all duration-500"
                        style={{ width: `${course.enrolled_progress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <button className="mt-3 w-full rounded-lg border border-accent-500/30 bg-accent-500/10 px-3 py-2 text-xs font-medium text-accent-300 transition-all hover:bg-accent-500/20 hover:border-accent-500/50">
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

function LearningSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="border border-edge bg-panel rounded-xl overflow-hidden">
          <div className="h-32 sm:h-40 bg-panel-raised animate-pulse" />
          <div className="p-4 space-y-3">
            <div className="flex gap-2">
              <div className="h-4 w-16 rounded-full bg-panel-raised animate-pulse" />
              <div className="h-4 w-20 rounded-full bg-panel-raised animate-pulse" />
            </div>
            <div className="h-4 w-3/4 rounded bg-panel-raised animate-pulse" />
            <div className="h-3 w-full rounded bg-panel-raised animate-pulse" />
            <div className="h-3 w-1/2 rounded bg-panel-raised animate-pulse" />
            <div className="h-8 w-full rounded-lg bg-panel-raised animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}