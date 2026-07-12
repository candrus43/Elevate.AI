import { useEffect, useState, useRef } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/roleplay-center/session/")({
  component: RolePlaySession,
});

function RolePlaySession() {
  const navigate = useNavigate();
  const params = useParams({ from: "/dashboard/roleplay-center/session/$sessionId" });
  const sessionId = params.sessionId;
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<{ role: "rep" | "ai"; text: string }[]>([
    { role: "ai", text: "Hi there! Thanks for reaching out. We've been evaluating some solutions to streamline our sales process. Can you tell me more about how ElevateAI works?" },
    { role: "rep", text: "Absolutely! ElevateAI is an AI-powered sales coaching platform that helps teams improve their performance through real-time feedback and analysis." },
    { role: "ai", text: "That sounds interesting. What kind of ROI have your customers typically seen? We need to justify any investment to our board." },
  ]);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(72);
  const [talkRatio, setTalkRatio] = useState({ rep: 45, ai: 55 });
  const [feedback, setFeedback] = useState<{ type: string; text: string }[]>([
    { type: "tip", text: "Ask about their specific pain points before pitching features" },
    { type: "praise", text: "Good opening! You established rapport well." },
    { type: "tip", text: "They mentioned ROI - try sharing a specific customer case study" },
  ]);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      setLoading(false);
    });
  }, [navigate]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: "rep", text: input }]);
    setInput("");
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "ai", text: "That's a great question. Could you walk me through how your platform handles data security and compliance? That's a key concern for us." }]);
      setScore(prev => Math.min(prev + 2, 100));
      setTalkRatio(prev => ({ rep: prev.rep + 1, ai: prev.ai - 1 }));
    }, 1500);
  };

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  const personalityName = sessionId.includes("p1") ? "Sarah Chen" : sessionId.includes("p2") ? "Mark Johnson" : "Customer";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate({ to: "/dashboard/roleplay-center" })} className="text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&larr;</button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Roleplay Session</h1>
            <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/50 dark:text-green-300">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block mr-1 animate-pulse" />
              In Progress
            </span>
          </div>
          <p className="text-sm text-gray-500">vs {personalityName} · Discovery Call</p>
        </div>
        <a href={`/dashboard/roleplay-center/results/${sessionId}`} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800">End Session</a>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Chat Area */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl glass-subtle transition-all duration-300 flex flex-col h-[500px]">
            {/* Personality Header */}
            <div className="border-b border-gray-200 px-6 py-3 dark:border-gray-700 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-500 text-xs font-bold text-white">SC</div>
              <div>
                <p className="text-sm font-medium text-white">{personalityName}</p>
                <p className="text-xs text-gray-500">Procurement Director · SaaS</p>
              </div>
            </div>

            {/* Messages */}
            <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "rep" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    msg.role === "rep"
                      ? "text-white bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white rounded-bl-sm"
                  }`}>
                    {msg.role === "ai" && <p className="text-[10px] font-medium text-pink-500 dark:text-pink-400 mb-0.5">{personalityName}</p>}
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text" value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type your response..."
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                <button onClick={handleSend} disabled={!input.trim()} className="rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50">Send</button>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Sidebar */}
        <div className="space-y-4">
          {/* Score */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">Live Score</span>
              <span className={`text-lg font-bold ${score >= 80 ? "text-green-600" : score >= 60 ? "text-amber-600" : "text-red-600"}`}>{score}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.06]">
              <div className={`h-2 rounded-full transition-all duration-700 ${score >= 80 ? "bg-green-500" : score >= 60 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${score}%` }} />
            </div>
          </div>

          {/* Talk Ratio */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <h4 className="text-sm font-medium text-white mb-2">Talk Ratio</h4>
            <div className="flex h-6 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="bg-indigo-500 text-[10px] text-white flex items-center justify-center font-medium transition-all duration-500" style={{ width: `${talkRatio.rep}%` }}>You {talkRatio.rep}%</div>
              <div className="bg-pink-400 text-[10px] text-white flex items-center justify-center font-medium transition-all duration-500" style={{ width: `${talkRatio.ai}%` }}>AI {talkRatio.ai}%</div>
            </div>
          </div>

          {/* Feedback */}
          <div className="rounded-2xl glass-subtle transition-all duration-300">
            <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              <h4 className="text-sm font-medium text-white">Real-time Feedback</h4>
            </div>
            <div className="divide-y divide-white/5">
              {feedback.map((f, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      f.type === "praise" ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" : "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                    }`}>{f.type === "praise" ? "👏 Praise" : "💡 Tip"}</span>
                  </div>
                  <p className="text-xs text-gray-400">{f.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Tips */}
          <div className="rounded-xl bg-indigo-50 p-4 dark:bg-indigo-900/20">
            <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-1">🎯 Remember</p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400">Use open-ended questions to uncover needs. Listen more than you talk!</p>
          </div>
        </div>
      </div>
    </div>
  );
}