import { useEffect, useState } from "react";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassBadge, GlassButton, GlassInput, GlassSelect, GlassStatCard, LoadingSkeleton, EmptyState } from "~/components/GlassCard";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/roleplay-center/results/")({
  component: RolePlayResults,
});

function RolePlayResults() {
  const navigate = useNavigate();
  const params = useParams({ from: "/dashboard/roleplay-center/results/$sessionId" });
  const sessionId = params.sessionId;
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

  const overallScore = 78;
  const grade = overallScore >= 90 ? "A" : overallScore >= 80 ? "B" : overallScore >= 70 ? "C" : overallScore >= 60 ? "D" : "F";

  const categories = [
    { name: "Discovery Questions", score: 82, max: 100 },
    { name: "Active Listening", score: 75, max: 100 },
    { name: "Objection Handling", score: 68, max: 100 },
    { name: "Product Knowledge", score: 85, max: 100 },
    { name: "Communication Clarity", score: 80, max: 100 },
    { name: "Rapport Building", score: 72, max: 100 },
    { name: "Needs Identification", score: 70, max: 100 },
    { name: "Value Proposition", score: 78, max: 100 },
    { name: "Closing Ability", score: 65, max: 100 },
    { name: "Compliance", score: 92, max: 100 },
    { name: "Talk/Listen Ratio", score: 60, max: 100 },
    { name: "Confidence", score: 76, max: 100 },
  ];

  const strengths = categories.filter(c => c.score >= 80).map(c => c.name);
  const weaknesses = categories.filter(c => c.score < 70).map(c => c.name);

  const recommendations = [
    { action: "Practice objection handling with AI roleplay", impact: "High", reason: "Scored lowest in this area (68%)" },
    { action: "Improve closing techniques", impact: "High", reason: "Closing ability needs development (65%)" },
    { action: "Work on active listening skills", impact: "Medium", reason: "Talk ratio was 60% — aim for 50/50" },
    { action: "Continue building on discovery questions", impact: "Medium", reason: "Strong base (82%) but can reach 90%+" },
  ];

  const timeline = [
    { time: "0:00 - 2:00", event: "Opening & Rapport Building", note: "Good introduction, asked about their role", score: 80 },
    { time: "2:00 - 5:00", event: "Needs Discovery", note: "Asked relevant questions but missed follow-up on budget", score: 72 },
    { time: "5:00 - 8:00", event: "Product Presentation", note: "Clear explanation, used good analogies", score: 85 },
    { time: "8:00 - 11:00", event: "Objection Handling", note: "Struggled with pricing objection — could improve", score: 62 },
    { time: "11:00 - 13:00", event: "Closing", note: "Missed opportunity to ask for commitment", score: 58 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate({ to: "/dashboard/roleplay-center" })} className="text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&larr;</button>
        <div><h1 className="text-2xl font-bold text-white">Session Results</h1><p className="text-sm text-gray-500">vs Sarah Chen · Discovery Call · 13 min</p></div>
      </div>

      {/* Score Hero */}
      <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 p-6 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Overall Score</p>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-bold text-white">{overallScore}%</span>
              <span className={`text-2xl font-bold mb-1 ${
                grade === "A" ? "text-green-600" : grade === "B" ? "text-blue-600" : grade === "C" ? "text-amber-600" : "text-red-600"
              }`}>Grade {grade}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate({ to: `/dashboard/roleplay-center/session/new-${sessionId}` })} className="rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:from-purple-500 hover:to-indigo-500">Practice Again</button>
            <button className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800">View Recommendations</button>
          </div>
        </div>
        <div className="mt-4 h-3 rounded-full bg-white/[0.06]">
          <div className={`h-3 rounded-full bg-gradient-to-r ${
            overallScore >= 80 ? "from-green-500 to-emerald-500" : overallScore >= 60 ? "from-amber-500 to-orange-500" : "from-red-500 to-rose-500"
          }`} style={{ width: `${overallScore}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Detailed Scorecard */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl glass-subtle transition-all duration-300">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-white">Detailed Scorecard</h3>
            </div>
            <div className="divide-y divide-white/5">
              {categories.map((cat, i) => (
                <div key={i} className="px-6 py-3 transition-colors hover:bg-white/[0.02]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">{cat.name}</span>
                    <span className={`text-sm font-bold ${cat.score >= 80 ? "text-green-600" : cat.score >= 70 ? "text-amber-600" : "text-red-600"}`}>{cat.score}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.06]">
                    <div className={`h-2 rounded-full transition-all duration-500 ${cat.score >= 80 ? "bg-green-500" : cat.score >= 70 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${cat.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-2xl glass-subtle transition-all duration-300">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-white">Session Timeline</h3>
            </div>
            <div className="divide-y divide-white/5">
              {timeline.map((t, i) => (
                <div key={i} className="px-6 py-3 transition-colors hover:bg-white/[0.02]">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 w-20">{t.time}</span>
                      <span className="text-sm font-medium text-white">{t.event}</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      t.score >= 80 ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" :
                      t.score >= 70 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" :
                      "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                    }`}>{t.score}%</span>
                  </div>
                  <p className="text-xs text-gray-500 ml-24">{t.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Strengths */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <h4 className="text-sm font-semibold text-white mb-3">✅ Strengths</h4>
            <div className="space-y-2">
              {strengths.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-sm text-gray-300">{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weaknesses */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <h4 className="text-sm font-semibold text-white mb-3">⚠️ Areas to Improve</h4>
            <div className="space-y-2">
              {weaknesses.map((w, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-amber-500">⚠</span>
                  <span className="text-sm text-gray-300">{w}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="rounded-2xl glass-subtle transition-all duration-300">
            <div className="border-b border-gray-200 px-5 py-3 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-white">🤖 AI Recommendations</h4>
            </div>
            <div className="divide-y divide-white/5">
              {recommendations.map((r, i) => (
                <div key={i} className="px-5 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">{r.action}</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${r.impact === "High" ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"}`}>{r.impact}</span>
                  </div>
                  <p className="text-xs text-gray-500">{r.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}