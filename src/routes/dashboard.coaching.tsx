import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/coaching")({
  component: CoachingPage,
});

const DEMO_PLANS = [
  {
    id: "p1", name: "Objection Handling Mastery", status: "active", created_at: "2026-07-01", due_date: "2026-07-20",
    assignee: "Mike Rodriguez", assigneeAvatar: "MR", completed: 5, total: 8,
    description: "Master the art of handling common sales objections including price pushback, competitor comparisons, and timing concerns.",
    modules: [
      { name: "Price Objection Framework", completed: true, score: 88 },
      { name: "Competitor Differentiation", completed: true, score: 82 },
      { name: "Timing & Urgency", completed: true, score: 75 },
      { name: "Value Justification", completed: true, score: 91 },
      { name: "Stakeholder Objections", completed: true, score: 79 },
      { name: "Multi-Objection Handling", completed: false, score: null },
      { name: "Role Play: Skeptical Susan", completed: false, score: null },
      { name: "Final Assessment", completed: false, score: null },
    ],
  },
  {
    id: "p2", name: "Closing Techniques", status: "active", created_at: "2026-07-05", due_date: "2026-07-25",
    assignee: "Emily Watson", assigneeAvatar: "EW", completed: 3, total: 6,
    description: "Learn and practice advanced closing techniques including assumptive close, urgency close, and summary close.",
    modules: [
      { name: "Assumptive Close", completed: true, score: 85 },
      { name: "Urgency Close", completed: true, score: 78 },
      { name: "Summary Close", completed: true, score: 92 },
      { name: "Alternative Choice Close", completed: false, score: null },
      { name: "Role Play: Decision-Maker Diana", completed: false, score: null },
      { name: "Final Assessment", completed: false, score: null },
    ],
  },
  {
    id: "p3", name: "Discovery Call Excellence", status: "active", created_at: "2026-07-08", due_date: "2026-08-05",
    assignee: "Lisa Park", assigneeAvatar: "LP", completed: 2, total: 7,
    description: "Develop expertise in discovery call techniques — needs analysis, qualification, and stakeholder mapping.",
    modules: [
      { name: "Needs Analysis Framework", completed: true, score: 81 },
      { name: "BANT Qualification", completed: true, score: 74 },
      { name: "Pain Point Discovery", completed: false, score: null },
      { name: "Stakeholder Mapping", completed: false, score: null },
      { name: "Budget & Timeline", completed: false, score: null },
      { name: "Role Play: Friendly Fiona", completed: false, score: null },
      { name: "Final Assessment", completed: false, score: null },
    ],
  },
  {
    id: "p4", name: "Prospecting Fundamentals", status: "completed", created_at: "2026-06-15", due_date: "2026-07-10",
    assignee: "James Wilson", assigneeAvatar: "JW", completed: 5, total: 5,
    description: "Build foundational prospecting skills including lead research, cold calling, and follow-up strategies.",
    modules: [
      { name: "Lead Research Techniques", completed: true, score: 76 },
      { name: "Cold Call Scripting", completed: true, score: 82 },
      { name: "Gatekeeper Navigation", completed: true, score: 70 },
      { name: "Follow-up Strategy", completed: true, score: 85 },
      { name: "Role Play: Time-Pressed Tom", completed: true, score: 79 },
    ],
  },
];

function CoachingPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [period, setPeriod] = useState("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const periods = [
    { value: "7d", label: "7 Days" },
    { value: "30d", label: "30 Days" },
    { value: "90d", label: "90 Days" },
    { value: "custom", label: "Custom" },
  ];

  const selected = DEMO_PLANS.find((p) => p.id === selectedId);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Coaching Plans</h1>
          <p className="text-sm text-gray-400">{DEMO_PLANS.filter((p) => p.status === "active").length} active · {DEMO_PLANS.filter((p) => p.status === "completed").length} completed</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
                  period === p.value
                    ? "bg-purple-500/20 text-purple-300"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {period === "custom" && (
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5">
              <span className="text-xs text-gray-400">From</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-32 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none"
              />
              <span className="text-xs text-gray-400">To</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-32 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none"
              />
            </div>
          )}
          <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Plan
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{DEMO_PLANS.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total Plans</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{DEMO_PLANS.filter(p => p.status === "active").length}</p>
          <p className="text-xs text-gray-500 mt-1">Active</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-400">{DEMO_PLANS.filter(p => p.status === "completed").length}</p>
          <p className="text-xs text-gray-500 mt-1">Completed</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{DEMO_PLANS.reduce((s, p) => s + p.completed, 0)}/{DEMO_PLANS.reduce((s, p) => s + p.total, 0)}</p>
          <p className="text-xs text-gray-500 mt-1">Modules Done</p>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {DEMO_PLANS.map((plan, i) => {
          const progress = Math.round((plan.completed / plan.total) * 100);
          return (
            <div
              key={plan.id}
              className={`glass-card rounded-xl p-5 cursor-pointer transition-all hover:border-purple-500/20 animate-fade-up ${selectedId === plan.id ? "ring-2 ring-purple-500" : ""}`}
              style={{ animationDelay: `${i * 100}ms` }}
              onClick={() => setSelectedId(selectedId === plan.id ? null : plan.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-sm font-bold text-white">
                    {plan.assigneeAvatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{plan.name}</p>
                    <p className="text-xs text-gray-400">Assigned to {plan.assignee}</p>
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  plan.status === "active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                }`}>{plan.status === "active" ? "Active" : "Completed"}</span>
              </div>
              <p className="text-xs text-gray-400 mb-3">{plan.description}</p>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 h-2 rounded-full bg-white/10">
                  <div className={`h-2 rounded-full ${progress >= 100 ? "bg-emerald-500" : "bg-gradient-to-r from-purple-500 to-indigo-500"}`} style={{ width: `${progress}%` }} />
                </div>
                <span className="text-xs text-gray-500 shrink-0">{plan.completed}/{plan.total}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Due {new Date(plan.due_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                <span>{progress}% complete</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Plan Detail */}
      {selected && (
        <div className="glass-card rounded-xl animate-fade-in">
          <div className="border-b border-white/10 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">{selected.name}</h3>
                <p className="text-sm text-gray-400">Assigned to {selected.assignee} · Due {new Date(selected.due_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                selected.status === "active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
              }`}>{selected.status}</span>
            </div>
            <p className="text-sm text-gray-400 mt-2">{selected.description}</p>
          </div>
          <div className="p-6 space-y-3">
            {selected.modules.map((mod, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    mod.completed ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-gray-500"
                  }`}>{mod.completed ? "✓" : i + 1}</span>
                  <span className={`text-sm ${mod.completed ? "text-white" : "text-gray-400"}`}>{mod.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  {mod.score !== null && (
                    <span className={`text-sm font-bold ${mod.score >= 80 ? "text-emerald-400" : mod.score >= 60 ? "text-amber-400" : "text-red-400"}`}>{mod.score}%</span>
                  )}
                  <span className={`text-xs ${mod.completed ? "text-emerald-400" : "text-gray-500"}`}>{mod.completed ? "Completed" : "Pending"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Plan Modal (visual only) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-lg rounded-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">Create Coaching Plan</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-2xl text-gray-400 hover:text-white transition-colors">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Plan Name</label>
                <input type="text" placeholder="e.g., Negotiation Skills" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Team Member</label>
                <select className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-gray-300 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30">
                  <option value="">Select a team member...</option>
                  <option value="mike">Mike Rodriguez</option>
                  <option value="emily">Emily Watson</option>
                  <option value="lisa">Lisa Park</option>
                  <option value="james">James Wilson</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Due Date</label>
                <input type="date" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30" />
              </div>
              <button className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-2.5 text-sm font-medium text-white shadow-lg shadow-purple-500/25 opacity-60 cursor-not-allowed" disabled>
                Create Plan
              </button>
              <p className="text-xs text-center text-gray-500">Demo mode — plans are not saved</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}