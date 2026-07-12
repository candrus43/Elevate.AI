import { useEffect, useState } from "react";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassBadge, GlassButton, GlassInput, GlassSelect, GlassStatCard, LoadingSkeleton, EmptyState } from "~/components/GlassCard";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/academy/quizzes")({
  component: QuizCenter,
});

function QuizCenter() {
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

  const quizzes = [
    { id: "quiz-1", title: "Enterprise Sales Fundamentals", questions: 15, passingScore: 80, bestScore: 92, attempts: 3, difficulty: "Medium" },
    { id: "quiz-2", title: "Product Knowledge: ElevateAI", questions: 20, passingScore: 75, bestScore: 88, attempts: 2, difficulty: "Medium" },
    { id: "quiz-3", title: "Objection Handling Scenarios", questions: 10, passingScore: 85, bestScore: 70, attempts: 4, difficulty: "Hard" },
    { id: "quiz-4", title: "Discovery Call Checklist", questions: 8, passingScore: 90, bestScore: 100, attempts: 1, difficulty: "Easy" },
    { id: "quiz-5", title: "Compliance & Best Practices", questions: 12, passingScore: 95, bestScore: 83, attempts: 2, difficulty: "Medium" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/academy" className="text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&larr;</Link>
        <div className="flex-1"><h1 className="text-2xl font-bold text-white">Quiz Center</h1><p className="text-sm text-gray-400">Test your knowledge</p></div>
        <button onClick={() => setShowCreate(true)} className="rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:from-purple-500 hover:to-indigo-500">+ Create Quiz</button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quizzes.map((quiz) => (
          <Link key={quiz.id} to={`/dashboard/academy/quiz/${quiz.id}`} className="rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-lg dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-start justify-between mb-2">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                quiz.difficulty === "Hard" ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" :
                quiz.difficulty === "Medium" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" :
                "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
              }`}>{quiz.difficulty}</span>
              <span className="text-xs text-gray-400">{quiz.questions} questions</span>
            </div>
            <h4 className="font-semibold text-white">{quiz.title}</h4>
            <div className="flex items-center gap-3 mt-2 text-xs">
              <span className="text-gray-500">Best: <span className="font-bold text-green-600">{quiz.bestScore}%</span></span>
              <span className="text-gray-500">Pass: <span className="font-medium text-gray-300">{quiz.passingScore}%</span></span>
              <span className="text-gray-500">{quiz.attempts} attempts</span>
            </div>
            <button className="mt-4 w-full rounded-lg text-white bg-gradient-to-r from-purple-600 to-indigo-600 py-2 text-xs font-medium text-white hover:from-purple-500 hover:to-indigo-500">Start Quiz</button>
          </Link>
        ))}
      </div>

      {/* Create Quiz Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold text-white">Create Quiz</h3><button onClick={() => setShowCreate(false)} className="text-2xl text-gray-400 hover:text-gray-600">&times;</button></div>
            <div className="space-y-4">
              <div><label className="mb-1.5 block text-sm font-medium text-gray-300">Title</label><input type="text" placeholder="Quiz title" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white" /></div>
              <div><label className="mb-1.5 block text-sm font-medium text-gray-300">Passing Score</label><input type="number" placeholder="80" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white" /></div>
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300">✨ Auto-generate from training content? Questions will be created automatically based on uploaded materials.</div>
              <button className="w-full rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 py-2.5 text-sm font-medium text-white hover:from-purple-500 hover:to-indigo-500">Create Quiz (Auto-Generate)</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}