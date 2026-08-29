import { useEffect, useState, useRef } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { LoadingSkeleton } from "~/components/GlassCard";

export const Route = createFileRoute("/dashboard/roleplay-center/session/$sessionId")({
  component: RolePlaySession,
});

function RolePlaySession() {
  const navigate = useNavigate();
  const { sessionId } = useParams({ from: "/dashboard/roleplay-center/session/$sessionId" });
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<{ role: "rep" | "ai"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(72);
  const [talkRatio, setTalkRatio] = useState({ rep: 45, ai: 55 });
  const [feedback, setFeedback] = useState<{ type: string; text: string }[]>([]);
  const [personalityName, setPersonalityName] = useState("Customer");
  const [scenarioType, setScenarioType] = useState("Discovery Call");
  const [sessionStatus, setSessionStatus] = useState<string>("in_progress");
  const chatRef = useRef<HTMLDivElement>(null);
  const initializingRef = useRef(false);

  // Check auth
  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
    });
  }, [navigate]);

  // Initialize or load session
  useEffect(() => {
    if (!user || initializingRef.current) return;
    initializingRef.current = true;

    const init = async () => {
      setLoading(true);
      try {
        if (sessionId.startsWith("new-")) {
          // Start a new session via API
          const personalityId = sessionId.replace("new-", "");
          const res = await fetch("/api/roleplay-center/sessions/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              personality_id: personalityId || undefined,
              scenario_type: "discovery",
              difficulty: "medium",
            }),
          });
          const data = await res.json();
          if (data.success && data.session) {
            // Redirect to the real session, replacing the URL in history
            navigate({ to: `/dashboard/roleplay-center/session/${data.session.id}`, replace: true });
            return;
          }
          // Fallback: show a basic greeting
          setMessages([{ role: "ai", text: "Hi there! Let's practice a sales conversation. Start by introducing yourself and what you're calling about." }]);
        } else {
          // Load existing session from API
          const res = await fetch(`/api/roleplay-center/sessions/${sessionId}`);
          const data = await res.json();
          if (data.session) {
            setPersonalityName(data.session.personality_name || "Customer");
            setScenarioType(data.session.scenario_type_name || "Discovery Call");
            setSessionStatus(data.session.status || "in_progress");
            // Convert turns to messages
            const msgs = (data.turns || []).map((t: any) => ({
              role: t.speaker === "user" ? "rep" : "ai",
              text: t.content,
            }));
            setMessages(msgs.length > 0 ? msgs : [{ role: "ai", text: "Session loaded. Continue the conversation!" }]);
          } else {
            setMessages([{ role: "ai", text: "Session not found. Please go back and start a new roleplay." }]);
          }
        }
      } catch (e) {
        console.error("Session init error:", e);
        setMessages([{ role: "ai", text: "Hi there! Let's practice. Start the conversation!" }]);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user, sessionId, navigate]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending || sessionId.startsWith("new-")) return;
    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "rep", text: userMessage }]);
    setSending(true);

    try {
      const res = await fetch(`/api/roleplay-center/sessions/${sessionId}/turn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });
      const data = await res.json();
      if (data.success && data.aiResponse) {
        setMessages(prev => [...prev, { role: "ai", text: data.aiResponse.content }]);
        // Update score if confidence score is returned
        if (data.aiResponse.confidenceScore) {
          setScore(prev => Math.min(100, Math.max(30, data.aiResponse.confidenceScore)));
        }
        // Add feedback if returned
        if (data.aiResponse.feedback) {
          setFeedback(prev => [...prev, { type: "tip", text: data.aiResponse.feedback }]);
        }
      } else {
        // Fallback AI response
        const fallbacks = [
          "That's interesting. Can you tell me more about how that works?",
          "I see. What kind of results have you seen with other clients?",
          "Good point. How does your solution compare to alternatives?",
          "I appreciate you sharing that. What would the next steps look like?",
        ];
        const fallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        setMessages(prev => [...prev, { role: "ai", text: fallback }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "ai", text: "Interesting. Let's continue the conversation." }]);
    } finally {
      setSending(false);
    }
  };

  const handleEndSession = async () => {
    try {
      await fetch(`/api/roleplay-center/sessions/${sessionId}/end`, { method: "POST" });
    } catch {}
    navigate({ to: `/dashboard/roleplay-center/results/${sessionId}` });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <LoadingSkeleton className="h-8 w-8 rounded-full mx-auto mb-2" />
          <p className="text-sm text-ink-faint">Starting roleplay session...</p>
        </div>
      </div>
    );
  }

  const isLive = sessionStatus === "in_progress";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate({ to: "/dashboard/roleplay-center" })} className="text-2xl text-ink-muted hover:text-gray-600 dark:hover:text-ink-muted">&larr;</button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-ink">Roleplay Session</h1>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              isLive
                ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-ink-muted"
            }`}>
              {isLive && <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block mr-1 animate-pulse" />}
              {isLive ? "In Progress" : "Completed"}
            </span>
          </div>
          <p className="text-sm text-ink-faint">vs {personalityName} · {scenarioType}</p>
        </div>
        {isLive && (
          <button onClick={handleEndSession} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-ink-muted dark:hover:bg-gray-800">
            End Session
          </button>
        )}
        {!isLive && (
          <a href={`/dashboard/roleplay-center/results/${sessionId}`} className="rounded-xl text-white bg-gradient-to-r from-accent-600 to-accent-600 px-4 py-2.5 text-sm font-medium text-white hover:from-accent-500 hover:to-accent-500">
            View Results
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Chat Area */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl glass-subtle transition-all duration-300 flex flex-col h-[500px]">
            {/* Personality Header */}
            <div className="border-b border-gray-200 px-6 py-3 dark:border-gray-700 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-500 text-xs font-bold text-white">
                {personalityName.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-medium text-ink">{personalityName}</p>
                <p className="text-xs text-ink-faint">{scenarioType}</p>
              </div>
            </div>

            {/* Messages */}
            <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-ink-faint">No messages yet. Start the conversation!</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "rep" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    msg.role === "rep"
                      ? "bg-gradient-to-r from-accent-600 to-accent-600 text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-ink rounded-bl-sm"
                  }`}>
                    {msg.role === "ai" && <p className="text-[10px] font-medium text-pink-500 dark:text-pink-400 mb-0.5">{personalityName}</p>}
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="max-w-[75%] rounded-2xl px-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-bl-sm">
                    <p className="text-[10px] font-medium text-pink-500 dark:text-pink-400 mb-0.5">{personalityName}</p>
                    <div className="flex gap-1 items-center py-1">
                      <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            {isLive && (
              <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Type your response..."
                    disabled={sending}
                    className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-ink-faint focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-ink"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    className="rounded-xl text-white bg-gradient-to-r from-accent-600 to-accent-600 px-4 py-2.5 text-sm font-medium transition-colors hover:from-accent-500 hover:to-accent-500 disabled:opacity-50"
                  >
                    {sending ? "..." : "Send"}
                  </button>
                </div>
              </div>
            )}
            {!isLive && (
              <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700 text-center">
                <p className="text-sm text-ink-faint">This session has ended.</p>
              </div>
            )}
          </div>
        </div>

        {/* Feedback Sidebar */}
        <div className="space-y-4">
          {/* Score */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-ink">Live Score</span>
              <span className={`text-lg font-bold ${score >= 80 ? "text-green-600" : score >= 60 ? "text-amber-600" : "text-red-600"}`}>{score}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.06]">
              <div className={`h-2 rounded-full transition-all duration-700 ${score >= 80 ? "bg-green-500" : score >= 60 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${score}%` }} />
            </div>
          </div>

          {/* Talk Ratio */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <h4 className="text-sm font-medium text-ink mb-2">Talk Ratio</h4>
            <div className="flex h-6 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="bg-accent-500 text-[10px] text-ink flex items-center justify-center font-medium transition-all duration-500" style={{ width: `${talkRatio.rep}%` }}>You {talkRatio.rep}%</div>
              <div className="bg-pink-400 text-[10px] text-ink flex items-center justify-center font-medium transition-all duration-500" style={{ width: `${talkRatio.ai}%` }}>AI {talkRatio.ai}%</div>
            </div>
          </div>

          {/* Feedback */}
          <div className="rounded-2xl glass-subtle transition-all duration-300">
            <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              <h4 className="text-sm font-medium text-ink">Real-time Feedback</h4>
            </div>
            <div className="divide-y divide-edge max-h-48 overflow-y-auto">
              {feedback.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-ink-faint">Feedback will appear as you practice</div>
              ) : (
                feedback.map((f, i) => (
                  <div key={i} className="px-4 py-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                        f.type === "praise" ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" : "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                      }`}>{f.type === "praise" ? "👏 Praise" : "💡 Tip"}</span>
                    </div>
                    <p className="text-xs text-ink-muted">{f.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Tips */}
          <div className="rounded-xl bg-accent-50 p-4 dark:bg-accent-900/20">
            <p className="text-xs font-medium text-accent-700 dark:text-accent-300 mb-1">🎯 Remember</p>
            <p className="text-xs text-accent-600 dark:text-accent-400">Use open-ended questions to uncover needs. Listen more than you talk!</p>
          </div>
        </div>
      </div>
    </div>
  );
}