import { LoadingSkeleton } from '~/components/GlassCard';
import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/ai-coach")({
  component: AICoach,
});

function AICoach() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Hello! I'm your AI coaching assistant. I can help you analyze team performance, identify coaching opportunities, and suggest improvements. What would you like to explore?" },
  ]);
  const [input, setInput] = useState("");

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      setLoading(false);
    });
  }, [navigate]);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;
    setMessages(prev => [...prev, { role: "user", text: input }]);
    setInput("");
    setIsThinking(true);
    // Simulate AI thinking
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: "ai",
        text: "Based on my analysis of your team's recent calls, I've identified several coaching opportunities. Your top performers excel at objection handling, while newer reps struggle with discovery questions. Would you like me to create a personalized coaching plan for your team?"
      }]);
      setIsThinking(false);
    }, 2000);
  };

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-ink">AI Coach</h1>
          <p className="text-sm text-ink-faint dark:text-ink-muted">Your AI-powered coaching assistant</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-100 px-3 py-1 text-xs font-medium text-accent-700 dark:bg-accent-900/50 dark:text-accent-300">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
            AI Ready
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Quick actions sidebar */}
        <div className="space-y-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-ink mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { icon: "📊", label: "Team Overview" },
                { icon: "🎯", label: "Coaching Plan" },
                { icon: "📈", label: "Performance Trends" },
                { icon: "🎧", label: "Call Analysis" },
                { icon: "📋", label: "Generate Report" },
              ].map((action, i) => (
                <button key={i} onClick={() => { setMessages(prev => [...prev, { role: "user", text: `Show me ${action.label}` }]); setIsThinking(true); setTimeout(() => { setIsThinking(false); setMessages(prev => [...prev, { role: "ai", text: `Here's your ${action.label} overview...` }]); }, 1500); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-ink-muted dark:hover:bg-gray-800">
                  <span>{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-ink mb-3">Confidence Score</h3>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent-600 dark:text-accent-400">94%</div>
              <p className="text-xs text-ink-faint mt-1">AI recommendation accuracy</p>
              <div className="mt-2 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
                <div className="h-1.5 rounded-full bg-gradient-to-r from-accent-500 to-accent-500" style={{ width: "94%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Chat area */}
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 flex flex-col h-[600px]">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-ink">Assistant</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-accent-600 text-ink" : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-ink"}`}>
                    {msg.role === "ai" && <div className="flex items-center gap-2 mb-1"><span className="text-sm">🤖</span><span className="text-xs font-medium text-accent-600 dark:text-accent-400">AI Coach</span></div>}
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-gray-100 dark:bg-gray-800">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">🤖</span>
                      <span className="text-xs font-medium text-accent-600 dark:text-accent-400">Thinking</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-accent-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 rounded-full bg-accent-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 rounded-full bg-accent-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask the AI coach anything..."
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-ink-faint focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-ink"
                />
                <button onClick={handleSend} disabled={isThinking || !input.trim()} className="rounded-xl bg-accent-600 px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-accent-500 disabled:opacity-50">
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}