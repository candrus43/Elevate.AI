import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/live-coaching")({
  component: LiveCoaching,
});

interface Session {
  id: string;
  rep_name: string;
  rep_avatar: string;
  status: "active" | "paused" | "completed";
  duration: number;
  score: number;
  suggestions: number;
  started_at: string;
  topics: string[];
}

function LiveCoaching() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"sessions" | "monitor">("sessions");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(async ({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      await loadSessions();
      setLoading(false);
    });
  }, [navigate]);

  async function loadSessions() {
    try {
      const res = await fetch("/api/live-coaching/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch {}
  }

  const mockSessions: Session[] = [
    { id: "1", rep_name: "Emily Watson", rep_avatar: "EW", status: "active", duration: 342, score: 78, suggestions: 3, started_at: new Date().toISOString(), topics: ["Objection Handling", "Pricing"] },
    { id: "2", rep_name: "James Kim", rep_avatar: "JK", status: "active", duration: 187, score: 85, suggestions: 1, started_at: new Date(Date.now() - 600000).toISOString(), topics: ["Discovery"] },
    { id: "3", rep_name: "Lisa Rodriguez", rep_avatar: "LR", status: "paused", duration: 523, score: 62, suggestions: 5, started_at: new Date(Date.now() - 1800000).toISOString(), topics: ["Closing", "Objections"] },
    { id: "4", rep_name: "Mike Chen", rep_avatar: "MC", status: "completed", duration: 845, score: 91, suggestions: 2, started_at: new Date(Date.now() - 3600000).toISOString(), topics: ["Discovery", "Demo"] },
  ];

  const displaySessions = sessions.length > 0 ? sessions : mockSessions;

  const activeSessions = displaySessions.filter(s => s.status === "active");

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-gray-200 dark:bg-gray-700" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => <div key={i} className="h-48 rounded-xl bg-gray-200 dark:bg-gray-700" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Live Coaching</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Monitor and coach reps in real-time</p>
        </div>
        <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800">
          <button onClick={() => setView("sessions")} className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${view === "sessions" ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}>
            Sessions
          </button>
          <button onClick={() => setView("monitor")} className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${view === "monitor" ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}>
            Monitor {activeSessions.length > 0 && <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-[10px] font-bold text-white">{activeSessions.length}</span>}
          </button>
        </div>
      </div>

      {view === "sessions" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displaySessions.map((session) => (
            <div
              key={session.id}
              className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-lg hover:border-indigo-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-indigo-600 cursor-pointer"
              onClick={() => navigate({ to: `/dashboard/live-coaching/${session.id}` })}
              tabIndex={0}
              role="button"
              aria-label={`View coaching session for ${session.rep_name}`}
              onKeyDown={(e) => e.key === "Enter" && navigate({ to: `/dashboard/live-coaching/${session.id}` })}
            >
              <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 blur-2xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white">
                      {session.rep_avatar}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{session.rep_name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`inline-flex h-2 w-2 rounded-full ${session.status === "active" ? "bg-green-500 animate-pulse" : session.status === "paused" ? "bg-yellow-500" : "bg-gray-400"}`} />
                        <span className="text-xs text-gray-500 capitalize">{session.status}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    session.score >= 80 ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" :
                    session.score >= 60 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300" :
                    "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                  }`}>
                    {session.score}%
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {session.topics.map((topic, i) => (
                    <span key={i} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">{topic}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{Math.floor(session.duration / 60)}m {session.duration % 60}s</span>
                  <span>{session.suggestions} suggestions</span>
                </div>
                {session.status === "active" && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    Join Live
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "monitor" && (
        <div className="space-y-6">
          {activeSessions.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center dark:border-gray-700 dark:bg-gray-900">
              <span className="text-4xl block mb-4">🎙️</span>
              <p className="text-gray-500 dark:text-gray-400">No active coaching sessions right now</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Sessions will appear here when reps start them</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {activeSessions.map((session) => (
                <div key={session.id} className="rounded-xl border border-green-200 bg-white p-5 dark:border-green-800 dark:bg-gray-900 relative overflow-hidden">
                  <div className="absolute right-0 top-0 h-32 w-32 translate-x-10 -translate-y-10 rounded-full bg-green-500/5 blur-3xl" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-sm font-bold text-white">
                            {session.rep_avatar}
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500 dark:border-gray-900" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{session.rep_name}</p>
                          <p className="text-xs text-gray-500">Live for {Math.floor(session.duration / 60)}m</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">LIVE</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {session.topics.map((topic, i) => (
                        <span key={i} className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/50 dark:text-green-300">{topic}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1">
                          {[1,2,3].map(i => <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-gray-300 dark:border-gray-800" />)}
                        </div>
                        <span className="text-xs text-gray-500">+{session.suggestions} watching</span>
                      </div>
                      <button
                        onClick={() => navigate({ to: `/dashboard/live-coaching/${session.id}` })}
                        className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-500"
                      >
                        Join Session
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}