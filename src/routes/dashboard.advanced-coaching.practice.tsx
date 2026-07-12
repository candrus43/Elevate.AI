import { LoadingSkeleton } from '~/components/GlassCard';
import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/advanced-coaching/practice")({
  component: PracticeAssignments,
});

function PracticeAssignments() {
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

  const assignments = [
    {
      id: "a1", rep: "Emily Watson", title: "Objection Handling: Price Pushback", type: "roleplay", difficulty: "Intermediate",
      dueDate: "Jul 15", status: "pending", score: null, skills: ["Objection Handling", "ROI Articulation"],
    },
    {
      id: "a2", rep: "James Kim", title: "Discovery: Qualification Questions", type: "roleplay", difficulty: "Beginner",
      dueDate: "Jul 12", status: "in-progress", score: 72, skills: ["Discovery", "Questioning"],
    },
    {
      id: "a3", rep: "Lisa Rodriguez", title: "Closing: Trial Close Techniques", type: "scenario", difficulty: "Advanced",
      dueDate: "Jul 20", status: "pending", score: null, skills: ["Closing", "Commitment"],
    },
    {
      id: "a4", rep: "Mike Chen", title: "Competitive Analysis: Battlecards", type: "review", difficulty: "Advanced",
      dueDate: "Jul 10", status: "completed", score: 91, skills: ["Competitive", "Product Knowledge"],
    },
    {
      id: "a5", rep: "Sarah Park", title: "Compliance: Script Adherence Drill", type: "quiz", difficulty: "Beginner",
      dueDate: "Jul 14", status: "in-progress", score: 85, skills: ["Compliance", "Scripts"],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate({ to: "/dashboard/advanced-coaching" })} className="text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&larr;</button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Practice Assignments</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">AI-generated practice tasks tailored to skill gaps</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Pending", value: "3", icon: "📝", color: "text-amber-600" },
          { label: "In Progress", value: "2", icon: "🔄", color: "text-blue-600" },
          { label: "Completed This Week", value: "4", icon: "✅", color: "text-green-600" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <span className="text-xl">{s.icon}</span>
              <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {assignments.map((a) => (
          <div key={a.id} className="rounded-xl border border-gray-200 bg-white transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${
                    a.type === "roleplay" ? "bg-indigo-500" : a.type === "scenario" ? "bg-purple-500" : a.type === "review" ? "bg-emerald-500" : "bg-amber-500"
                  }`}>
                    {a.type === "roleplay" ? "🎭" : a.type === "scenario" ? "📋" : a.type === "review" ? "📖" : "✍️"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-white">{a.rep}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        a.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" :
                        a.status === "in-progress" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" :
                        "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      }`}>{a.status.replace("-", " ")}</span>
                    </div>
                    <p className="text-sm text-gray-900 dark:text-white">{a.title}</p>
                  </div>
                </div>
                <div className="text-right">
                  {a.score ? (
                    <span className={`text-lg font-bold ${a.score >= 80 ? "text-green-600" : a.score >= 70 ? "text-amber-600" : "text-red-600"}`}>{a.score}%</span>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                  <p className="text-xs text-gray-500">Due {a.dueDate}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                    a.difficulty === "Advanced" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" :
                    a.difficulty === "Intermediate" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" :
                    "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                  }`}>{a.difficulty}</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300 capitalize">{a.type}</span>
                  {a.skills.map((s, i) => (
                    <span key={i} className="text-xs text-gray-500 hidden sm:inline">{s}{i < a.skills.length - 1 ? "," : ""}</span>
                  ))}
                </div>
                {a.status !== "completed" && (
                  <button className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500">Start</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}