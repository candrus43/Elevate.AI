import { useEffect, useState, useRef } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { UserSession } from "~/utils/auth";

export const Route = createFileRoute("/dashboard/rep/roleplay")({
  component: RepRoleplayPage,
});

interface Scenario {
  id: number;
  title: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  description: string;
}

interface ChatMessage {
  role: "user" | "ai";
  text: string;
  score?: number;
  feedback?: string;
}

interface SessionState {
  sessionId: string;
  scenario: { title: string; persona: string };
  stage: number;
  turn: number;
}

function RepRoleplayPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [activeScenario, setActiveScenario] = useState<number | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [session, setSession] = useState<SessionState | null>(null);
  const [sessionResult, setSessionResult] = useState<{
    score: number;
    feedback: string;
    durationSeconds: number;
    totalTurns: number;
  } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then(({ user }) => {
        if (!user) {
          navigate({ to: "/login" });
          return;
        }
        setUser(user);
        // Load scenarios
        fetch("/api/roleplay/scenarios")
          .then((r) => r.json())
          .then((data) => setScenarios(data.scenarios || []))
          .catch(() => setScenarios(defaultScenarios));
        setLoading(false);
      })
      .catch(() => {
        navigate({ to: "/login" });
      });
  }, [navigate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const startScenario = async (id: number) => {
    setActiveScenario(id);
    setSessionResult(null);
    setChat([]);
    setSending(true);

    try {
      const res = await fetch("/api/roleplay/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: id }),
      });
      const data = await res.json();
      if (data.error) {
        setChat([{ role: "ai", text: `Error: ${data.error}. Please try again.` }]);
        setSending(false);
        return;
      }

      setSession({
        sessionId: data.sessionId,
        scenario: data.scenario,
        stage: data.stage,
        turn: data.turn,
      });
      setChat([
        {
          role: "ai",
          text: `🎭 **Scenario: ${data.scenario.title}**\n🤝 **Persona: ${data.scenario.persona}**\n\n${data.firstMessage}`,
        },
      ]);
    } catch {
      setChat([{ role: "ai", text: "Failed to start session. Please try again." }]);
    }
    setSending(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || !session || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);

    // Add user message immediately
    setChat((prev) => [...prev, { role: "user", text }]);

    try {
      const res = await fetch("/api/roleplay/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.sessionId, message: text }),
      });
      const data = await res.json();

      if (data.error) {
        setChat((prev) => [...prev, { role: "ai", text: `⚠️ ${data.error}` }]);
        setSending(false);
        return;
      }

      // Add AI response
      const aiMsg: ChatMessage = {
        role: "ai",
        text: data.message,
        score: data.score,
        feedback: data.feedback,
      };
      setChat((prev) => [...prev, aiMsg]);

      // Update session state
      setSession((prev) =>
        prev ? { ...prev, stage: data.stage, turn: data.turn } : prev
      );

      // If session is complete, show results
      if (data.isComplete) {
        setSessionResult({
          score: data.overallScore,
          feedback: data.summaryFeedback,
          durationSeconds: 0,
          totalTurns: data.turn,
        });

        // Save session to DB
        fetch("/api/roleplay/end", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: session.sessionId }),
        }).catch(() => {});
      }
    } catch {
      setChat((prev) => [
        ...prev,
        { role: "ai", text: "⚠️ Connection error. Please try again." },
      ]);
    }
    setSending(false);
  };

  const endScenario = async () => {
    if (session) {
      try {
        const res = await fetch("/api/roleplay/end", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: session.sessionId }),
        });
        const data = await res.json();
        setSessionResult({
          score: data.score,
          feedback: data.feedback,
          durationSeconds: data.durationSeconds,
          totalTurns: data.totalTurns,
        });
      } catch {
        // Calculate rough score from chat
        const scores = chat.filter((m) => m.score !== undefined).map((m) => m.score!);
        const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        setSessionResult({
          score: avgScore,
          feedback: "Session ended. Review your scores per message above.",
          durationSeconds: 0,
          totalTurns: chat.filter((m) => m.role === "user").length,
        });
      }
    }
    setActiveScenario(null);
    setSession(null);
    setChat([]);
    setSessionResult(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) return <RepRoleplaySkeleton />;

  // Show session results
  if (sessionResult && !activeScenario) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Role Play</h1>
          <p className="text-sm text-ink-muted">Practice your sales skills with AI-powered scenarios</p>
        </div>

        <div className="border border-edge bg-panel rounded-xl p-8 text-center animate-fade-up">
          <span className="text-5xl">🎯</span>
          <h2 className="mt-4 text-xl font-bold text-ink">Session Complete!</h2>

          <div className="mt-6 flex justify-center">
            <div className="relative h-28 w-28">
              <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke="url(#scoreGradient)" strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - sessionResult.score / 100)}`}
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-ink">{sessionResult.score}</span>
              </div>
            </div>
          </div>

          <p className="mt-2 text-sm text-ink-muted">out of 100</p>

          {sessionResult.totalTurns > 0 && (
            <p className="mt-3 text-xs text-ink-faint">
              {sessionResult.totalTurns} turns · {sessionResult.durationSeconds > 0 ? `${Math.round(sessionResult.durationSeconds / 60)} min ${sessionResult.durationSeconds % 60} sec` : ""}
            </p>
          )}

          <div className="mt-6 max-w-lg mx-auto">
            <div className="rounded-xl bg-panel-raised border border-edge p-4 text-left">
              <p className="text-xs font-semibold text-accent-300 mb-2 uppercase tracking-wider">Feedback</p>
              <p className="text-sm text-ink-muted whitespace-pre-line">{sessionResult.feedback}</p>
            </div>
          </div>

          <div className="mt-8 flex gap-3 justify-center">
            <button onClick={() => setSessionResult(null)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent-600 px-5 py-2.5 text-sm font-semibold text-white shadow-glow hover:bg-accent-500 active:bg-accent-700 active:scale-[0.98] transition-all">
              Practice Again
            </button>
            <button onClick={() => window.location.reload()} className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-ink-muted hover:bg-panel-raised hover:text-ink transition-all text-ink-muted">
              Choose Different Scenario
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Role Play</h1>
        <p className="text-sm text-ink-muted">Practice your sales skills with AI-powered scenarios</p>
      </div>

      {activeScenario === null ? (
        /* Scenario Selection */
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(scenarios.length > 0 ? scenarios : defaultScenarios).map((scenario, i) => (
              <button
                key={scenario.id}
                onClick={() => startScenario(scenario.id)}
                disabled={sending}
                className="border border-edge bg-panel rounded-xl p-5 text-left animate-fade-up hover:border-accent-500/30 group disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">
                    {scenario.id === 1 ? "📞" : scenario.id === 2 ? "💪" : scenario.id === 3 ? "🤝" : scenario.id === 4 ? "🔍" : "💰"}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                    scenario.difficulty === "Beginner" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                    scenario.difficulty === "Intermediate" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                    "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}>
                    {scenario.difficulty}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-ink group-hover:text-accent-300 transition-colors">{scenario.title}</h3>
                <p className="mt-1 text-xs text-ink-muted line-clamp-2">{scenario.description}</p>
                <div className="mt-3 text-xs text-accent-300 opacity-0 group-hover:opacity-100 transition-opacity">
                  Start scenario →
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        /* Active Scenario Chat */
        <div className="border border-edge bg-panel rounded-xl overflow-hidden flex flex-col" style={{ minHeight: "500px" }}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-edge px-5 py-3">
            <div>
              <h2 className="text-sm font-semibold text-ink">
                {session?.scenario?.title || "Role Play"}
              </h2>
              <p className="text-[10px] text-ink-faint">
                AI Roleplay Session · Stage {session ? session.stage + 1 : 1} · Turn {session ? session.turn + 1 : 1}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {sending && (
                <span className="flex items-center gap-1.5 text-[10px] text-accent-300">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-400 animate-pulse" />
                  AI thinking...
                </span>
              )}
              <button onClick={endScenario} className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-ink-muted hover:bg-panel-raised hover:text-ink transition-all text-xs text-red-400 hover:text-red-300">
                End Session
              </button>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ maxHeight: "380px" }}>
            {chat.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-xl px-4 py-2.5 ${
                  msg.role === "user"
                    ? "bg-accent-500/20 text-accent-100 border border-accent-500/25"
                    : "bg-panel-raised text-ink-muted border border-edge"
                }`}>
                  <p className="text-xs font-medium mb-1 opacity-60">
                    {msg.role === "user" ? "You" : "AI Coach"}
                    {msg.score !== undefined && (
                      <span className={`ml-2 ${msg.score >= 70 ? "text-emerald-400" : msg.score >= 50 ? "text-amber-400" : "text-red-400"}`}>
                        · Score: {msg.score}
                      </span>
                    )}
                  </p>
                  <p className="text-sm whitespace-pre-line">{msg.text}</p>
                  {msg.feedback && (
                    <div className="mt-2 pt-2 border-t border-edge">
                      <p className="text-[10px] text-ink-faint whitespace-pre-line">{msg.feedback}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-edge p-4">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Type your response..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending || !!sessionResult}
                className="flex-1 rounded-xl border border-edge bg-panel-raised px-4 py-2.5 text-sm text-ink placeholder-ink-faint backdrop-blur-sm focus:border-accent-500/50 focus:outline-none focus:ring-1 focus:ring-focus/40 disabled:opacity-40"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || sending || !!sessionResult}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent-600 px-5 py-2.5 text-sm font-semibold text-white shadow-glow hover:bg-accent-500 active:bg-accent-700 active:scale-[0.98] transition-all px-4 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sending ? "..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const defaultScenarios: Scenario[] = [
  { id: 1, title: "Cold Call Opening", difficulty: "Beginner", description: "Practice a cold call introduction and value pitch to a new prospect." },
  { id: 2, title: "Handling Objections", difficulty: "Intermediate", description: "Respond to common objections like pricing, timing, and competition." },
  { id: 3, title: "Closing the Deal", difficulty: "Advanced", description: "Practice closing techniques including assumptive close and urgency-based close." },
  { id: 4, title: "Discovery Call", difficulty: "Intermediate", description: "Ask the right questions to uncover prospect needs and pain points." },
  { id: 5, title: "Price Negotiation", difficulty: "Advanced", description: "Navigate price objections and offer value-based counterarguments." },
];

function RepRoleplaySkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-28 rounded-lg bg-panel-raised animate-pulse" />
        <div className="h-4 w-56 rounded-lg bg-panel-raised animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-edge bg-panel rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-panel-raised animate-pulse" />
              <div className="h-4 w-20 rounded-full bg-panel-raised animate-pulse" />
            </div>
            <div className="h-4 w-32 rounded bg-panel-raised animate-pulse" />
            <div className="h-3 w-full rounded bg-panel-raised animate-pulse" />
            <div className="h-3 w-3/4 rounded bg-panel-raised animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}