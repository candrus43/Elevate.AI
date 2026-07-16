import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/scorecards")({
  component: ScorecardsPage,
});

// ── 3 existing generic scorecards ────────────────────────────
const DEMO_SCORECARDS = [
  {
    id: "sc1", name: "Standard Sales Scorecard", description: "Core sales evaluation criteria for discovery and demo calls", type: "discovery", maxScore: 100,
    criteria: [
      { name: "Opening & Rapport", maxScore: 15, weight: 1.0, description: "Professional greeting, establishes rapport, sets agenda" },
      { name: "Discovery Questions", maxScore: 20, weight: 1.2, description: "Quality of needs analysis, pain point identification" },
      { name: "Value Proposition", maxScore: 20, weight: 1.2, description: "Clear articulation of value, alignment with customer needs" },
      { name: "Objection Handling", maxScore: 15, weight: 1.0, description: "Effectiveness in addressing concerns and objections" },
      { name: "Closing Technique", maxScore: 15, weight: 1.0, description: "Ability to move conversation forward, secure next steps" },
      { name: "Communication", maxScore: 10, weight: 0.8, description: "Clarity, active listening, professional tone" },
      { name: "Compliance", maxScore: 5, weight: 0.5, description: "Adherence to scripts, disclosures, and regulations" },
    ],
  },
  {
    id: "sc2", name: "Cold Call Scorecard", description: "Specialized criteria for outbound cold calling performance", type: "cold-call", maxScore: 100,
    criteria: [
      { name: "Opening Hook", maxScore: 20, weight: 1.2, description: "First 15 seconds — grabs attention, states purpose clearly" },
      { name: "Value Statement", maxScore: 20, weight: 1.2, description: "Quick value articulation relevant to prospect's role" },
      { name: "Objection Handling", maxScore: 20, weight: 1.2, description: "Handles gatekeepers, price pushback, and 'not interested'" },
      { name: "Call Control", maxScore: 15, weight: 1.0, description: "Keeps conversation on track, avoids rambling" },
      { name: "Next Steps", maxScore: 15, weight: 1.0, description: "Clear call-to-action, sets expectation for follow-up" },
      { name: "Pacing & Tone", maxScore: 10, weight: 0.8, description: "Energy level, enthusiasm, conversational flow" },
    ],
  },
  {
    id: "sc3", name: "Discovery Scorecard", description: "In-depth evaluation for discovery and qualification calls", type: "discovery", maxScore: 100,
    criteria: [
      { name: "Needs Discovery", maxScore: 25, weight: 1.3, description: "Depth of questioning, uncovering pain points and goals" },
      { name: "Budget Qualification", maxScore: 15, weight: 1.0, description: "Identifies budget range, decision-making authority" },
      { name: "Timeline Assessment", maxScore: 10, weight: 0.8, description: "Understands purchase timeline and urgency" },
      { name: "Competitor Awareness", maxScore: 10, weight: 0.8, description: "Identifies competitive landscape and differentiators" },
      { name: "Solution Alignment", maxScore: 20, weight: 1.2, description: "Maps solution features to identified needs" },
      { name: "Stakeholder Mapping", maxScore: 10, weight: 0.8, description: "Identifies all decision-makers and influencers" },
      { name: "Next Steps", maxScore: 10, weight: 0.8, description: "Clear agreed-upon next steps and timeline" },
    ],
  },
];

// ── 3 new agent-specific KPI scorecards ─────────────────────
const AGENT_SCORECARDS = [
  {
    id: "agent-mr", name: "Mike Rodriguez", initials: "MR", type: "agent",
    gradient: "from-blue-500 to-cyan-600",
    kpis: { ATP: 1, Fulls: 2, Partials: 1, SPR: 4.0, Inbounds: 85, Manuals: 57, H2S: "12%", WH2S: "5%" },
    description: "Individual KPI scorecard — SPR = total sales (ATP+Fulls+Partials)",
  },
  {
    id: "agent-ew", name: "Emily Watson", initials: "EW", type: "agent",
    gradient: "from-rose-500 to-pink-600",
    kpis: { ATP: 1, Fulls: 3, Partials: 2, SPR: 6.0, Inbounds: 92, Manuals: 63, H2S: "15%", WH2S: "7%" },
    description: "Individual KPI scorecard — SPR = total sales (ATP+Fulls+Partials)",
  },
  {
    id: "agent-lp", name: "Lisa Park", initials: "LP", type: "agent",
    gradient: "from-emerald-500 to-green-600",
    kpis: { ATP: 0, Fulls: 1, Partials: 3, SPR: 4.0, Inbounds: 78, Manuals: 45, H2S: "8%", WH2S: "3%" },
    description: "Individual KPI scorecard — SPR = total sales (ATP+Fulls+Partials)",
  },
];

const ALL_SCORECARDS = [...DEMO_SCORECARDS, ...AGENT_SCORECARDS];

function ScorecardsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingCriteria, setEditingCriteria] = useState<string | null>(null);
  const [period, setPeriod] = useState("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const periods = [
    { value: "7d", label: "7 Days" },
    { value: "30d", label: "30 Days" },
    { value: "90d", label: "90 Days" },
    { value: "custom", label: "Custom" },
  ];

  const selected = ALL_SCORECARDS.find((s) => s.id === selectedId);

  const isGeneric = (sc: any) => "criteria" in sc;
  const isAgent = (sc: any) => "kpis" in sc;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Scorecards</h1>
          <p className="text-sm text-gray-400">{ALL_SCORECARDS.length} scorecards configured · 3 generic + 3 agent</p>
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
          <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-purple-500/25 opacity-60 cursor-not-allowed">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Scorecard
          </button>
        </div>
      </div>

      {/* Scorecard Grid — 3 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {ALL_SCORECARDS.map((sc, i) => (
          <div
            key={sc.id}
            className={`glass-card rounded-xl p-5 cursor-pointer transition-all hover:border-purple-500/20 animate-fade-up ${selectedId === sc.id ? "ring-2 ring-purple-500" : ""}`}
            style={{ animationDelay: `${i * 100}ms` }}
            onClick={() => setSelectedId(selectedId === sc.id ? null : sc.id)}
          >
            {/* Avatar + Name */}
            <div className="flex items-center gap-3 mb-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${isAgent(sc) ? sc.gradient : "from-purple-500 to-indigo-600"} text-sm font-bold text-white shadow-lg`}>
                {isAgent(sc) ? sc.initials : sc.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{sc.name}</p>
                <p className="text-xs text-gray-500 capitalize">{isAgent(sc) ? "Agent KPI" : sc.type.replace("-", " ")}</p>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-400 mb-3">{sc.description}</p>

            {/* Footer stats */}
            <div className="flex items-center justify-between text-xs">
              {isGeneric(sc) && (
                <>
                  <span className="text-gray-500">{sc.criteria.length} criteria</span>
                  <span className="text-gray-500">{sc.maxScore} max score</span>
                </>
              )}
              {isAgent(sc) && (
                <>
                  <span className="text-gray-500">{Object.keys(sc.kpis).length} KPIs</span>
                  <span className="text-gray-500">SPR {sc.kpis.SPR}</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Scorecard Detail */}
      {selected && isGeneric(selected) && (
        <div className="glass-card rounded-xl animate-fade-in">
          <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">{selected.name}</h3>
              <p className="text-sm text-gray-400">{selected.description}</p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-gray-300 capitalize">{selected.type.replace("-", " ")}</span>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-12 gap-3 text-xs font-medium text-gray-500 uppercase tracking-wider px-4">
              <div className="col-span-5">Criteria</div>
              <div className="col-span-2 text-center">Max Score</div>
              <div className="col-span-2 text-center">Weight</div>
              <div className="col-span-3 text-center">Weighted</div>
            </div>
            {selected.criteria.map((c: any, i: number) => (
              <div key={c.name} className="group">
                <div className="grid grid-cols-12 gap-3 items-center rounded-xl bg-white/[0.03] px-4 py-3 hover:bg-white/[0.06] transition-all cursor-pointer" onClick={() => setEditingCriteria(editingCriteria === c.name ? null : c.name)}>
                  <div className="col-span-5">
                    <p className="text-sm font-medium text-white">{c.name}</p>
                    {editingCriteria === c.name && <p className="text-xs text-gray-400 mt-0.5">{c.description}</p>}
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-sm font-semibold text-white">{c.maxScore}</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-sm text-gray-300">{c.weight}x</span>
                  </div>
                  <div className="col-span-3 text-center">
                    <span className="text-sm font-semibold text-purple-400">{Math.round(c.maxScore * c.weight)}</span>
                  </div>
                </div>
              </div>
            ))}
            <div className="grid grid-cols-12 gap-3 items-center px-4 pt-3 border-t border-white/10">
              <div className="col-span-5">
                <p className="text-sm font-bold text-white">Total</p>
              </div>
              <div className="col-span-2 text-center">
                <span className="text-sm font-bold text-white">{selected.criteria.reduce((s: number, c: any) => s + c.maxScore, 0)}</span>
              </div>
              <div className="col-span-2 text-center">
                <span className="text-sm text-gray-300">—</span>
              </div>
              <div className="col-span-3 text-center">
                <span className="text-sm font-bold text-purple-400">{selected.criteria.reduce((s: number, c: any) => s + Math.round(c.maxScore * c.weight), 0)}</span>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 px-6 py-4 flex gap-2">
            <button className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-gray-300 hover:bg-white/10 transition-all">Edit Scorecard</button>
            <button className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-all">Delete</button>
          </div>
        </div>
      )}

      {/* Selected Agent KPI Detail */}
      {selected && isAgent(selected) && (
        <div className="glass-card rounded-xl animate-fade-in">
          <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${selected.gradient} text-sm font-bold text-white shadow-lg`}>
                {selected.initials}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{selected.name}</h3>
                <p className="text-sm text-gray-400">Agent KPI Scorecard</p>
              </div>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-gray-300">Agent</span>
          </div>

          {/* KPI Values Table */}
          <div className="p-6">
            <div className="grid grid-cols-2 gap-3 text-xs font-medium text-gray-500 uppercase tracking-wider px-4 mb-2">
              <div className="col-span-1">KPI</div>
              <div className="col-span-1 text-right">Value</div>
            </div>
            <div className="space-y-1">
              {Object.entries(selected.kpis).map(([kpi, value], i) => {
                const isHighlight = kpi === "SPR";
                return (
                  <div key={kpi} className="grid grid-cols-2 gap-3 items-center rounded-xl bg-white/[0.03] px-4 py-2.5 hover:bg-white/[0.06] transition-all">
                    <div className="col-span-1">
                      <p className={`text-sm ${isHighlight ? "font-bold text-purple-300" : "font-medium text-gray-300"}`}>{kpi}</p>
                    </div>
                    <div className="col-span-1 text-right">
                      <span className={`text-sm font-semibold ${isHighlight ? "text-purple-400" : "text-white"}`}>{value}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SPR explanation */}
            <div className="mt-4 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-xs text-gray-500">SPR = Total Sales (ATP + Fulls + Partials)</p>
              <div className="flex gap-4 mt-1 text-xs text-gray-400">
                <span>ATP: {selected.kpis.ATP}</span>
                <span>Fulls: {selected.kpis.Fulls}</span>
                <span>Partials: {selected.kpis.Partials}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 px-6 py-4 flex gap-2">
            <button className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-gray-300 hover:bg-white/10 transition-all">View History</button>
            <button className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-gray-300 hover:bg-white/10 transition-all">Export</button>
          </div>
        </div>
      )}
    </div>
  );
}