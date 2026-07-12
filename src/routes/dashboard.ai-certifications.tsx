import { LoadingSkeleton } from '~/components/GlassCard';
import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/ai-certifications")({
  component: AICertifications,
});

function AICertifications() {
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Certifications</h1>
        <p className="text-sm text-gray-500">Earn certifications to validate your sales skills</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { name: "Discovery Master", desc: "Master the art of discovery calls", difficulty: "Intermediate", progress: 80, icon: "🔍", color: "from-blue-500 to-cyan-500" },
          { name: "Objection Handler", desc: "Handle objections like a pro", difficulty: "Advanced", progress: 45, icon: "🛡️", color: "from-purple-500 to-pink-500" },
          { name: "Closing Expert", desc: "Close deals with confidence", difficulty: "Advanced", progress: 20, icon: "🎯", color: "from-amber-500 to-orange-500" },
          { name: "Product Demo Pro", desc: "Deliver compelling demos", difficulty: "Intermediate", progress: 0, icon: "📱", color: "from-green-500 to-emerald-500" },
          { name: "Compliance Champion", desc: "Master compliance requirements", difficulty: "Beginner", progress: 100, icon: "✅", color: "from-teal-500 to-green-500" },
          { name: "Coaching Certified", desc: "Learn to coach other reps", difficulty: "Expert", progress: 10, icon: "👨‍🏫", color: "from-red-500 to-rose-500" },
        ].map((cert, i) => (
          <div key={i} className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-lg dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-start justify-between mb-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${cert.color} text-xl text-white`}>
                {cert.icon}
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                cert.difficulty === "Beginner" ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" :
                cert.difficulty === "Intermediate" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" :
                cert.difficulty === "Advanced" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" :
                "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
              }`}>{cert.difficulty}</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{cert.name}</h3>
            <p className="text-sm text-gray-500 mb-4">{cert.desc}</p>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-gray-500">Progress</span>
              <span className={`font-medium ${cert.progress === 100 ? "text-green-600" : "text-gray-900 dark:text-white"}`}>
                {cert.progress === 100 ? "Completed ✓" : `${cert.progress}%`}
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
              <div className={`h-2 rounded-full bg-gradient-to-r ${cert.color} transition-all duration-500`} style={{ width: `${cert.progress}%` }} />
            </div>
            {cert.progress < 100 && (
              <button className="mt-4 w-full rounded-xl bg-indigo-600 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500">Continue</button>
            )}
            {cert.progress === 100 && (
              <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-green-50 py-2 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                <span>🎉</span>
                <span>Certified</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}