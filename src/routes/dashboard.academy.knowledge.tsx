import { useEffect, useState, useRef } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/academy/knowledge")({
  component: AIKnowledgeAssistant,
});

function AIKnowledgeAssistant() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Hi! I'm your AI Knowledge Assistant. I can answer questions about any training material in the academy. Ask me anything!" }
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      setLoading(false);
    });
  }, [navigate]);

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [messages, isThinking]);

  const handleSend = () => {
    if (!input.trim() || isThinking) return;
    setMessages(prev => [...prev, { role: "user", text: input }]);
    setInput("");
    setIsThinking(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "ai", text: "Great question! Based on the training materials I've analyzed, here's what I can tell you... The Enterprise Sales Playbook covers this in detail in Chapter 3, and there's a relevant video demonstration in the Product Knowledge section." }]);
      setIsThinking(false);
    }, 2000);
  };

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  const suggestions = ["What's the best cold calling script?", "How do I handle pricing objections?", "Explain the discovery framework", "What's in the ElevateAI demo?"];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/academy" className="text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&larr;</Link>
        <div><h1 className="text-2xl font-bold text-white">AI Knowledge Assistant</h1><p className="text-sm text-gray-400">Ask anything about your training materials</p></div>
      </div>

      <div className="rounded-2xl glass-subtle transition-all duration-300 flex flex-col h-[500px]">
        {/* Messages */}
        <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${msg.role === "user" ? "text-white bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-sm" : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white rounded-bl-sm"}`}>
                {msg.role === "ai" && <p className="text-[10px] font-medium text-indigo-500 dark:text-indigo-400 mb-0.5">🤖 Knowledge AI</p>}
                <p className="text-sm">{msg.text}</p>
                {msg.role === "ai" && i > 0 && <p className="text-[10px] text-gray-400 mt-1">Source: Enterprise Sales Playbook · Product Knowledge v3</p>}
              </div>
            </div>
          ))}
          {isThinking && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-gray-100 px-4 py-3 dark:bg-gray-800">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-indigo-500 dark:text-indigo-400">🤖</span>
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Suggestions */}
        <div className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => { setInput(s); }} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700">{s}</button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
          <div className="flex gap-2">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} placeholder="Ask about training materials..." className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
            <button onClick={handleSend} disabled={!input.trim() || isThinking} className="rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50">Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}