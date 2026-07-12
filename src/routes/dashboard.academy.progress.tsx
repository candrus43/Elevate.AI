import { useEffect, useState } from "react";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassBadge, GlassButton, GlassInput, GlassSelect, GlassStatCard, LoadingSkeleton, EmptyState } from "~/components/GlassCard";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/academy/progress")({
  component: MyProgress,
});

function MyProgress() {
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

  const overall = [
    { label: "Courses Completed", value: "3 / 6", color: "from-indigo-500 to-purple-600" },
    { label: "Quizzes Passed", value: "8 / 12", color: "from-emerald-500 to-green-600" },
    { label: "Certifications", value: "1 / 4", color: "from-amber-500 to-orange-600" },
    { label: "Learning Time", value: "24.5h", color: "from-cyan-500 to-blue-600" },
  ];

  const courses = [
    { title: "Enterprise Sales Mastery", progress: 72, status: "In Progress" },
    { title: "Product Knowledge: ElevateAI", progress: 100, status: "Completed" },
    { title: "Objection Handling Masterclass", progress: 45, status: "In Progress" },
    { title: "Active Listening for Sales", progress: 0, status: "Not Started" },
    { title: "Cold Calling 2.0", progress: 0, status: "Not Started" },
    { title: "Negotiation Tactics", progress: 30, status: "In Progress" },
  ];

  const quizScores = [92, 88, 70, 100, 83, 95, 78, 65];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/academy" className="text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&larr;</Link>
        <div><h1 className="text-2xl font-bold text-white">My Progress</h1><p className="text-sm text-gray-400">Track your learning journey</p></div>
      </div>

      {/* Overall Progress */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {overall.map((o, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <p className="text-sm text-gray-400">{o.label}</p>
            <p className={`bg-gradient-to-r ${o.color} bg-clip-text text-2xl font-bold text-transparent`}>{o.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Course Progress */}
        <div className="rounded-2xl glass-subtle transition-all duration-300">
          <div className="border-b border-gray-200 px-5 py-3 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-white">Course Progress</h3>
          </div>
          <div className="divide-y divide-white/5">
            {courses.map((c, i) => (
              <div key={i} className="px-5 py-3">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="text-sm font-medium text-white">{c.title}</span>
                    <span className={`ml-2 text-[10px] font-medium ${
                      c.status === "Completed" ? "text-green-600" : c.status === "In Progress" ? "text-amber-600" : "text-gray-400"
                    }`}>{c.status}</span>
                  </div>
                  <span className={`text-sm font-bold ${c.progress === 100 ? "text-green-600" : c.progress > 0 ? "text-amber-600" : "text-gray-400"}`}>{c.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.06]">
                  <div className={`h-1.5 rounded-full ${c.progress === 100 ? "bg-green-500" : "bg-indigo-500"}`} style={{ width: `${c.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quiz Score History */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="text-sm font-semibold text-white mb-4">Quiz Score History</h3>
          <div className="h-40">
            <svg viewBox="0 0 300 130" className="w-full h-full">
              {[0,1,2].map(i => <line key={i} x1="0" y1={30 + i*35} x2="300" y2={30 + i*35} stroke="#e5e7eb" strokeWidth="1" className="dark:stroke-gray-700" />)}
              <polyline fill="none" stroke="#818cf8" strokeWidth="2.5" points={quizScores.map((s, i) => `${20 + i*33},${130 - s}`).join(" ")} />
              <polygon fill="url(#quizGradient)" points={`20,130 ${quizScores.map((s, i) => `${20 + i*33},${130 - s}`).join(" ")} 20,130`} />
              <defs>
                <linearGradient id="quizGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[1,2,3,4,5,6,7,8].map((n, i) => (
                <text key={i} x={20 + i*33} y="122" fontSize="8" fill="#9ca3af" textAnchor="middle">Q{n}</text>
              ))}
            </svg>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
            <span>Avg: <strong className="text-white">{Math.round(quizScores.reduce((a,b) => a+b,0)/quizScores.length)}%</strong></span>
            <span>Best: <strong className="text-green-600">100%</strong></span>
            <span>Lowest: <strong className="text-red-600">65%</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}