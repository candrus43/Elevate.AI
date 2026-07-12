import { useEffect, useState } from "react";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassBadge, GlassButton, GlassInput, GlassSelect, GlassStatCard, LoadingSkeleton, EmptyState } from "~/components/GlassCard";
import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/academy/quiz/")({
  component: QuizInterface,
});

function QuizInterface() {
  const navigate = useNavigate();
  const params = useParams({ from: "/dashboard/academy/quiz/$quizId" });
  const quizId = params.quizId;
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      setLoading(false);
    });
  }, [navigate]);

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  const questions = [
    { q: "What is the first step in an enterprise sales discovery call?", options: ["Present your product", "Ask about their budget", "Research and understand the prospect's business", "Send a proposal"], correct: 2 },
    { q: "Which qualification framework is most commonly used in B2B sales?", options: ["AIDA", "BANT", "SWOT", "PESTLE"], correct: 1 },
    { q: "What is the best response when a prospect says 'your price is too high'?", options: ["Immediately offer a discount", "Acknowledge and ask what they're comparing it to", "Tell them it's worth it", "Lower the price without discussion"], correct: 1 },
    { q: "What does active listening involve?", options: ["Waiting for your turn to speak", "Paraphrasing and asking clarifying questions", "Taking detailed notes only", "Nodding while the prospect talks"], correct: 1 },
    { q: "Which channel is most effective for B2B cold outreach?", options: ["Phone calls only", "Emails only", "Multi-channel (phone + email + social)", "Social media only"], correct: 2 },
    { q: "What is the purpose of a discovery call?", options: ["Close the deal", "Qualify the lead and uncover needs", "Present pricing", "Schedule a demo"], correct: 1 },
    { q: "How should you handle a prospect who says 'not interested'?", options: ["Thank them and hang up", "Ask what changed or what they're focused on", "Call them back repeatedly", "Send more emails"], correct: 1 },
    { q: "What is the ideal talk-to-listen ratio in a sales conversation?", options: ["80% talk, 20% listen", "50% talk, 50% listen", "20% talk, 80% listen", "60% talk, 40% listen"], correct: 2 },
    { q: "Which is NOT a common buyer persona in enterprise sales?", options: ["Economic Buyer", "Technical Evaluator", "Social Media Manager", "Champion"], correct: 2 },
    { q: "What should you do after handling an objection?", options: ["Move to the next objection", "Confirm the objection is resolved", "End the call", "Talk about your product"], correct: 1 },
  ];

  const totalQuestions = questions.length;

  const handleAnswer = (optionIndex: number) => {
    if (submitted) return;
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    let correct = 0;
    questions.forEach((q, i) => { if (answers[i] === q.correct) correct++; });
    setScore(Math.round((correct / totalQuestions) * 100));
    setSubmitted(true);
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) setCurrentQuestion(currentQuestion + 1);
  };

  const handlePrev = () => {
    if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1);
  };

  if (submitted) {
    const passed = score >= 80;
    return (
      <div className="space-y-6">
        <Link to="/dashboard/academy/quizzes" className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-500">&larr; Back to Quizzes</Link>
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900">
          <span className={`text-5xl block mb-4 ${passed ? "text-green-500" : "text-red-500"}`}>{passed ? "🎉" : "😔"}</span>
          <h2 className="text-2xl font-bold text-white mb-2">{passed ? "Congratulations!" : "Keep Practicing!"}</h2>
          <p className="text-gray-500 mb-4">You scored <span className={`text-3xl font-bold ${passed ? "text-green-600" : "text-red-600"}`}>{score}%</span></p>
          <p className="text-sm text-gray-500 mb-6">{passed ? "You passed the quiz!" : "You need 80% to pass. Try again!"}</p>
          <div className="h-3 rounded-full bg-white/[0.06] max-w-xs mx-auto mb-8">
            <div className={`h-3 rounded-full ${passed ? "bg-green-500" : "bg-red-500"}`} style={{ width: `${score}%` }} />
          </div>
          <div className="flex items-center justify-center gap-3">
            <Link to={`/dashboard/academy/quiz/${quizId}`} className="rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:from-purple-500 hover:to-indigo-500">Try Again</Link>
            <Link to="/dashboard/academy/quizzes" className="rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">More Quizzes</Link>
          </div>
        </div>
        {/* Answer Review */}
        <div className="rounded-2xl glass-subtle transition-all duration-300">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700"><h3 className="text-lg font-semibold text-white">Answer Review</h3></div>
          <div className="divide-y divide-white/5">
            {questions.map((q, i) => {
              const isCorrect = answers[i] === q.correct;
              return (
                <div key={i} className="px-6 py-3">
                  <div className="flex items-start gap-2">
                    <span className={`mt-0.5 text-sm ${isCorrect ? "text-green-500" : "text-red-500"}`}>{isCorrect ? "✓" : "✗"}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{i + 1}. {q.q}</p>
                      <p className="text-xs text-green-600 mt-1">Correct: {q.options[q.correct]}</p>
                      {!isCorrect && <p className="text-xs text-red-500">Your answer: {q.options[answers[i]] || "Not answered"}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const isAnswered = answers[currentQuestion] !== undefined;
  const progress = Math.round(((currentQuestion) / totalQuestions) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/academy/quizzes" className="text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&larr;</Link>
        <div className="flex-1"><h1 className="text-2xl font-bold text-white">Enterprise Sales Fundamentals</h1><p className="text-sm text-gray-400">Answer each question carefully</p></div>
      </div>

      {/* Progress */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">Question {currentQuestion + 1} of {totalQuestions}</span>
          <span className="text-sm font-medium text-gray-300">{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/[0.06]">
          <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300" style={{ width: `${progress + (isAnswered ? 100 / totalQuestions : 0)}%` }} />
        </div>
      </div>

      {/* Question */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <p className="text-lg font-medium text-white mb-6">{questions[currentQuestion].q}</p>
        <div className="space-y-3">
          {questions[currentQuestion].options.map((opt, i) => (
            <button key={i} onClick={() => handleAnswer(i)} className={`w-full rounded-xl border p-4 text-left text-sm transition-all ${answers[currentQuestion] === i ? "border-indigo-300 bg-indigo-50 dark:border-indigo-600 dark:bg-indigo-900/20" : "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"}`}>
              <span className="font-medium text-white">{String.fromCharCode(65 + i)}. {opt}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={handlePrev} disabled={currentQuestion === 0} className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">&larr; Previous</button>
        {currentQuestion === totalQuestions - 1 ? (
          <button onClick={handleSubmit} className="rounded-xl bg-green-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-500">Submit Quiz</button>
        ) : (
          <button onClick={handleNext} disabled={!isAnswered} className="rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50">Next &rarr;</button>
        )}
      </div>
    </div>
  );
}