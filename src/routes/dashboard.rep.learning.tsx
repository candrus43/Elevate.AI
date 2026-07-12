import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { UserSession } from "~/utils/auth";
import { db } from "~/utils/db";
import { sql } from "~/utils/sql";

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
      const data = await db(sql`
        SELECT
          c.id, c.title, c.description, c.category, c.difficulty,
          c.duration_minutes, c.image_url,
          CASE WHEN ec.id IS NOT NULL THEN 1 ELSE 0 END as is_enrolled,
          COALESCE(ec.progress, 0) as enrolled_progress
        FROM courses c
        LEFT JOIN enrolled_courses ec ON ec.course_id = c.id AND ec.user_id = ${userId}
        ORDER BY c.created_at DESC
        LIMIT 20
      `);
      setCourses(data);
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
      default: return "bg-gray-500/10 text-gray-400 border-gray-500/20";
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
        <h1 className="text-2xl font-bold text-white">Learning Center</h1>
        <p className="text-sm text-gray-400">Build your skills with curated courses</p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-xl px-3.5 py-2 text-xs font-medium transition-all ${
              activeCategory === cat
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                : "text-gray-400 border border-white/5 hover:text-white hover:bg-white/5"
            }`}
          >
            {cat === "all" ? "All" : `${getCategoryIcon(cat)} ${cat}`}
          </button>
        ))}
      </div>

      {/* Enrolled Courses Section */}
      {courses.filter((c) => c.is_enrolled).length > 0 && (
        <>
          <h2 className="text-base font-semibold text-white mt-2">My Courses</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.filter((c) => c.is_enrolled).map((course, i) => (
              <div key={course.id} className="glass-card rounded-xl overflow-hidden animate-fade-up flex flex-col" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="h-28 bg-gradient-to-br from-purple-600/20 via-violet-600/20 to-indigo-600/20 flex items-center justify-center border-b border-white/5">
                  <span className="text-3xl">{getCategoryIcon(course.category)}</span>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium border ${getDifficultyColor(course.difficulty)}`}>
                      {course.difficulty}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white line-clamp-1">{course.title}</h3>
                  <p className="mt-1 text-xs text-gray-400 line-clamp-2 flex-1">{course.description}</p>
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] text-gray-500">
                    <span>⏱️ {course.duration_minutes} min</span>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-gray-500">Progress</span>
                      <span className="text-[10px] font-medium text-purple-300">{course.enrolled_progress}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500" style={{ width: `${course.enrolled_progress}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* All Courses */}
      <h2 className="text-base font-semibold text-white mt-2">
        {courses.filter((c) => c.is_enrolled).length > 0 ? "Browse Courses" : "Available Courses"}
      </h2>

      {filteredCourses.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <span className="text-4xl">📚</span>
          <h3 className="mt-4 text-lg font-medium text-white">No courses found</h3>
          <p className="mt-1 text-sm text-gray-400">
            {courses.length > 0 ? "No courses match your filter." : "Courses are being added. Check back later!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((course, i) => (
            <div key={course.id} className="glass-card rounded-xl overflow-hidden animate-fade-up flex flex-col" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="h-28 bg-gradient-to-br from-purple-600/20 via-violet-600/20 to-indigo-600/20 flex items-center justify-center border-b border-white/5">
                <span className="text-3xl">{getCategoryIcon(course.category)}</span>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-medium text-gray-400 border border-white/10">{course.category}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium border ${getDifficultyColor(course.difficulty)}`}>
                    {course.difficulty}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white line-clamp-1">{course.title}</h3>
                <p className="mt-1 text-xs text-gray-400 line-clamp-2 flex-1">{course.description}</p>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-gray-500">
                  <span>⏱️ {course.duration_minutes} min</span>
                </div>
                {course.is_enrolled ? (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-gray-500">Progress</span>
                      <span className="text-[10px] font-medium text-purple-300">{course.enrolled_progress}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500" style={{ width: `${course.enrolled_progress}%` }} />
                    </div>
                  </div>
                ) : (
                  <button className="mt-2 w-full rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-xs font-medium text-purple-300 transition-all hover:bg-purple-500/20 hover:border-purple-500/50">
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
        <div className="h-7 w-32 rounded-lg bg-white/5 animate-pulse" />
        <div className="h-4 w-44 rounded-lg bg-white/5 animate-pulse" />
      </div>
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-20 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card rounded-xl overflow-hidden">
            <div className="h-28 bg-white/5 animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="h-4 w-20 rounded-full bg-white/5 animate-pulse" />
              <div className="h-4 w-32 rounded bg-white/5 animate-pulse" />
              <div className="h-3 w-full rounded bg-white/5 animate-pulse" />
              <div className="h-8 w-full rounded-lg bg-white/5 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}