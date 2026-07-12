import { LoadingSkeleton } from '~/components/GlassCard';
import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/rep/live-coaching")({
  component: RepLiveCoaching,
});

function RepLiveCoaching() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [coachEnabled, setCoachEnabled] = useState(true);
  const [score, setScore] = useState(78);
  const [suggestions, setSuggestions] = useState([
    { id: "s1", text: "Try asking open-ended questions to uncover more needs", type: "tip", shown: false },
    { id: "s2", text: "Great use of social proof! Mention the case study", type: "praise", shown: true },
  ]);

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      setLoading(false);
    });
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <LoadingSkeleton className="h-8 w-8 rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Live Coaching</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Real-time AI coaching during calls</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm text-gray-600 dark:text-gray-400">AI Coach</span>
            <button
              onClick={() => setCoachEnabled(!coachEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${coachEnabled ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-600"}`}
              role="switch"
              aria-checked={coachEnabled}
              aria-label="Toggle AI coach"
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${coachEnabled ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </label>
          <button
            onClick={() => setIsActive(!isActive)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
              isActive
                ? "bg-red-600 text-white hover:bg-red-500"
                : "bg-green-600 text-white hover:bg-green-500"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${isActive ? "bg-white" : "bg-white animate-pulse"}`} />
            {isActive ? "End Session" : "Start Session"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main coaching area */}
        <div className="lg:col-span-2 space-y-4">
          {!isActive ? (
            <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center dark:border-gray-700 dark:bg-gray-900">
              <span className="text-5xl block mb-4">🎙️</span>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Ready for Your Next Call?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                Start a coaching session to get real-time AI suggestions, objection handling tips, and performance scoring during your calls.
              </p>
              <button
                onClick={() => setIsActive(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-green-500"
              >
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                Start Coaching Session
              </button>
            </div>
          ) : (
            <>
              {/* Live session status */}
              <div className="rounded-xl border border-green-200 bg-white p-5 dark:border-green-800 dark:bg-gray-900">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/50 dark:text-green-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                      Active
                    </span>
                    <span className="text-sm text-gray-500">12:34 elapsed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Score:</span>
                    <span className={`text-lg font-bold ${score >= 80 ? "text-green-600" : score >= 60 ? "text-amber-600" : "text-red-600"}`}>{score}%</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                  <div className={`h-2 rounded-full transition-all duration-1000 ${score >= 80 ? "bg-green-500" : score >= 60 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${score}%` }} />
                </div>
              </div>

              {/* AI Coach suggestions */}
              <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Coach</h3>
                  {coachEnabled && (
                    <span className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                      Listening
                    </span>
                  )}
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {suggestions.length === 0 ? (
                    <div className="px-6 py-8 text-center text-sm text-gray-500">
                      <span className="block text-2xl mb-2">🤖</span>
                      AI coach is listening for coaching opportunities
                      <div className="flex items-center justify-center gap-1 mt-3">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  ) : (
                    suggestions.map((s) => (
                      <div key={s.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5">{s.type === "praise" ? "👏" : "💡"}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.type === "praise" ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"}`}>
                                {s.type === "praise" ? "Praise" : "Suggestion"}
                              </span>
                              {s.shown && <span className="text-xs text-gray-400">Dismissed</span>}
                            </div>
                            <p className="text-sm text-gray-900 dark:text-white">{s.text}</p>
                          </div>
                          {!s.shown && (
                            <button className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 whitespace-nowrap">Got it</button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Coaching stats */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Your Coaching Stats</h3>
            <div className="space-y-4">
              {[
                { label: "Sessions This Week", value: "3", change: "+1", positive: true },
                { label: "Avg. Score", value: "76%", change: "+5%", positive: true },
                { label: "Suggestions Applied", value: "12", change: "+3", positive: true },
                { label: "Top Topic", value: "Objections", change: "", positive: true },
              ].map((stat, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{stat.label}</span>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{stat.value}</span>
                    {stat.change && (
                      <span className={`ml-1.5 text-xs ${stat.positive ? "text-green-600" : "text-red-600"}`}>
                        {stat.positive ? "↑" : "↓"} {stat.change}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Quick Tips</h3>
            <div className="space-y-3">
              <div className="rounded-lg bg-indigo-50 p-3 dark:bg-indigo-900/20">
                <p className="text-xs text-indigo-700 dark:text-indigo-300">💡 Speak clearly and at a moderate pace for better AI analysis</p>
              </div>
              <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                <p className="text-xs text-green-700 dark:text-green-300">👏 Acknowledge customer concerns before responding</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
                <p className="text-xs text-amber-700 dark:text-amber-300">🎯 Focus on benefits, not just features</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}