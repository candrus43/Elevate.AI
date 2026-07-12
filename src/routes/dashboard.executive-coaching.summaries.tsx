import { useEffect, useState } from "react";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassBadge, GlassButton, GlassInput, GlassSelect, GlassStatCard, LoadingSkeleton, EmptyState } from "~/components/GlassCard";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/executive-coaching/summaries")({
  component: ExecutiveSummaries,
});

function ExecutiveSummaries() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("last-30");

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      setLoading(false);
    });
  }, [navigate]);

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/executive-coaching" className="text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&larr;</Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Executive Summaries</h1>
          <p className="text-sm text-gray-400">AI-generated coaching effectiveness briefs</p>
        </div>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500/50">
          <option value="last-7">Last 7 days</option>
          <option value="last-30">Last 30 days</option>
          <option value="last-90">Last 90 days</option>
          <option value="quarter">This Quarter</option>
        </select>
      </div>

      {/* Summary Narrative */}
      <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-indigo-500/[0.04] to-purple-500/[0.04] p-6 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-sm dark:bg-indigo-900/50">🤖</span>
          <h3 className="text-lg font-semibold text-white">AI-Generated Summary</h3>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">Generated Jul 11, 2026</span>
        </div>
        <div className="prose prose-sm max-w-none text-gray-300 space-y-3">
          <p><strong>Overall Assessment:</strong> The organization's coaching effectiveness has improved significantly over the last 30 days, with the composite score rising from 76% to 84%. This represents a solid acceleration compared to prior periods.</p>
          <p><strong>Key Drivers:</strong> The primary contributors to this improvement are the Enterprise Sales team (+18% improvement), the recently launched Objection Handling Workshop (+22.5% skill boost), and increased coaching session frequency (+32% month-over-month).</p>
          <p><strong>Areas of Concern:</strong> The Account Executives team continues to lag at 62% effectiveness, with particular weakness in Objection Handling (58%) and Closing (60%). The Inside Sales team also shows below-average Manager Effectiveness (72%).</p>
          <p><strong>ROI Analysis:</strong> The coaching program is delivering a 312% ROI with a cost per improvement point of $3.40. The Objection Handling Workshop remains the highest-ROI program at 510%, while Compliance training needs restructuring to improve its 195% ROI.</p>
        </div>
      </div>

      {/* Key Highlights */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[
          { label: "Top Performer", value: "Enterprise Sales", change: "+18%", icon: "🏆", color: "text-emerald-600" },
          { label: "Most Improved Skill", value: "Objection Handling", change: "+22.5%", icon: "📈", color: "text-blue-600" },
          { label: "Highest ROI Program", value: "Objection Workshop", change: "510%", icon: "💰", color: "text-amber-600" },
        ].map((item, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg">{item.icon}</span>
              <span className={`text-sm font-bold ${item.color}`}>{item.change}</span>
            </div>
            <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
            <p className="text-lg font-semibold text-white">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="text-lg font-semibold text-white mb-4">Key Insights &amp; Trends</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { title: "Coaching Frequency Up", desc: "Average coaching sessions per rep increased from 2.1 to 3.4/month", impact: "positive" },
            { title: "Skill Transfer Improving", desc: "85% of reps show measurable improvement within 14 days of coaching", impact: "positive" },
            { title: "Manager Variability", desc: "Top managers achieve 40% more improvement than bottom quartile", impact: "neutral" },
            { title: "Compliance Plateau", desc: "Compliance scores have stalled at 88% for 3 consecutive months", impact: "negative" },
          ].map((insight, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <span className={`mt-0.5 text-lg ${
                insight.impact === "positive" ? "text-green-500" : insight.impact === "negative" ? "text-red-500" : "text-amber-500"
              }`}>{insight.impact === "positive" ? "✓" : insight.impact === "negative" ? "⚠" : "ℹ"}</span>
              <div>
                <p className="text-sm font-medium text-white">{insight.title}</p>
                <p className="text-xs text-gray-500">{insight.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="rounded-2xl glass-subtle transition-all duration-300">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-white">🤖 AI Recommendations</h3>
        </div>
        <div className="divide-y divide-white/5">
          {[
            { priority: "High", action: "Assign Account Executives team to Objection Handling Workshop", reason: "Lowest scoring team (58%) in this critical skill", impact: "Could improve team score by 15-20%" },
            { priority: "High", action: "Increase coaching frequency for Inside Sales to 4 sessions/month", reason: "Current 22 sessions vs department avg of 36", impact: "Projected 12% improvement within 30 days" },
            { priority: "Medium", action: "Review and refresh Compliance training content", reason: "Plateaued at 88% for 3 months", impact: "Could reduce compliance risk by 40%" },
          ].map((rec, i) => (
            <div key={i} className="px-6 py-4 transition-colors hover:bg-white/[0.02]">
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                  rec.priority === "High" ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                }`}>{rec.priority}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{rec.action}</p>
                  <p className="text-xs text-gray-500">{rec.reason}</p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">Expected impact: {rec.impact}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end gap-3">
        <button className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800">Export as PDF</button>
        <button className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800">Save Summary</button>
        <button className="rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:from-purple-500 hover:to-indigo-500">Share Report</button>
      </div>
    </div>
  );
}