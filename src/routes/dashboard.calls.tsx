import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/calls")({
  component: CallList,
});

const DEMO_CALLS = [
  { id: "c1", lead_name: "Acme Corp", rep_name: "Mike Rodriguez", duration: 845, score: 92, sentiment: "positive", date: "2026-07-14", type: "outbound", topic: "Discovery Call", analysis: "Excellent discovery. Uncovered budget, timeline, and decision-making process. Strong rapport building." },
  { id: "c2", lead_name: "TechFlow Inc", rep_name: "Emily Watson", duration: 1230, score: 78, sentiment: "neutral", date: "2026-07-14", type: "inbound", topic: "Product Demo", analysis: "Good product knowledge but needs to handle price objections more directly. Customer seemed interested." },
  { id: "c3", lead_name: "DataVista Corp", rep_name: "Mike Rodriguez", duration: 567, score: 85, sentiment: "positive", date: "2026-07-13", type: "outbound", topic: "Follow-up", analysis: "Effective follow-up. Addressed previous concerns, moved conversation to next step. Good closing attempt." },
  { id: "c4", lead_name: "CloudScale Ltd", rep_name: "Lisa Park", duration: 934, score: 65, sentiment: "negative", date: "2026-07-13", type: "outbound", topic: "Cold Call", analysis: "Struggled with early objections. Customer pushed back on pricing and rep didn't recover well." },
  { id: "c5", lead_name: "NexGen Solutions", rep_name: "Emily Watson", duration: 1102, score: 88, sentiment: "positive", date: "2026-07-12", type: "inbound", topic: "Discovery Call", analysis: "Great qualification questions. Identified key pain points and positioned solution effectively." },
  { id: "c6", lead_name: "GreenPath Energy", rep_name: "James Wilson", duration: 678, score: 72, sentiment: "neutral", date: "2026-07-12", type: "outbound", topic: "Follow-up", analysis: "Decent follow-up but missed signals to close. Customer was more interested than rep realized." },
  { id: "c7", lead_name: "Meridian Health", rep_name: "Lisa Park", duration: 1456, score: 59, sentiment: "negative", date: "2026-07-11", type: "inbound", topic: "Compliance Check", analysis: "Rep was unprepared for compliance questions. Lost credibility. Needs training on healthcare regulations." },
  { id: "c8", lead_name: "Quantum Finance", rep_name: "Mike Rodriguez", duration: 789, score: 95, sentiment: "positive", date: "2026-07-11", type: "outbound", topic: "Closing", analysis: "Masterful closing call. Handled all objections, created urgency, and secured commitment. Exemplary." },
  { id: "c9", lead_name: "StellarSoft", rep_name: "Emily Watson", duration: 1023, score: 81, sentiment: "positive", date: "2026-07-10", type: "outbound", topic: "Discovery Call", analysis: "Solid discovery. Good questioning technique, established value. Could improve on handling competitor mentions." },
  { id: "c10", lead_name: "Atlas Logistics", rep_name: "James Wilson", duration: 445, score: 45, sentiment: "negative", date: "2026-07-10", type: "outbound", topic: "Cold Call", analysis: "Call ended too quickly. Rep failed to engage the prospect after initial rejection. Needs objection handling practice." },
];

function formatDuration(seconds: number): string {
  if (!seconds) return "-";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function CallList() {
  const [search, setSearch] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [selectedCall, setSelectedCall] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [period, setPeriod] = useState("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const periods = [
    { value: "7d", label: "7 Days" },
    { value: "30d", label: "30 Days" },
    { value: "90d", label: "90 Days" },
    { value: "custom", label: "Custom" },
  ];

  const filteredCalls = DEMO_CALLS.filter((c) => {
    const matchesSearch =
      c.lead_name.toLowerCase().includes(search.toLowerCase()) ||
      c.rep_name.toLowerCase().includes(search.toLowerCase()) ||
      c.topic.toLowerCase().includes(search.toLowerCase());
    const matchesSentiment = sentimentFilter === "all" || c.sentiment === sentimentFilter;
    return matchesSearch && matchesSentiment;
  });

  const avgScore = Math.round(DEMO_CALLS.reduce((sum, c) => sum + c.score, 0) / DEMO_CALLS.length);
  const totalDuration = DEMO_CALLS.reduce((sum, c) => sum + c.duration, 0);
  const positiveCount = DEMO_CALLS.filter((c) => c.sentiment === "positive").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Call Reviews</h1>
          <p className="text-sm text-gray-400">{DEMO_CALLS.length} calls · Avg score {avgScore}%</p>
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
          <button onClick={() => setShowUpload(true)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload Call
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{avgScore}%</p>
          <p className="text-xs text-gray-500 mt-1">Average Score</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{positiveCount}</p>
          <p className="text-xs text-gray-500 mt-1">Positive Calls</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{Math.floor(totalDuration / 60)}m</p>
          <p className="text-xs text-gray-500 mt-1">Total Duration</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{DEMO_CALLS.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total Calls</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search by lead, rep, or topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pl-10 text-sm text-white placeholder-gray-500 backdrop-blur-sm focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
          />
        </div>
        <select
          value={sentimentFilter}
          onChange={(e) => setSentimentFilter(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-gray-300 backdrop-blur-sm focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
        >
          <option value="all">All Sentiment</option>
          <option value="positive">Positive</option>
          <option value="neutral">Neutral</option>
          <option value="negative">Negative</option>
        </select>
      </div>

      {/* Call List */}
      <div className="space-y-3">
        {filteredCalls.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <span className="text-4xl">📞</span>
            <h3 className="mt-4 text-lg font-medium text-white">No calls found</h3>
            <p className="mt-1 text-sm text-gray-400">Try adjusting your search or filter.</p>
          </div>
        ) : (
          filteredCalls.map((call, i) => (
            <div key={call.id}>
              <div
                className="glass-card rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 cursor-pointer hover:border-purple-500/20 transition-all animate-fade-up"
                style={{ animationDelay: `${i * 50}ms` }}
                onClick={() => setSelectedCall(selectedCall === call.id ? null : call.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-sm font-semibold text-white">
                    {call.lead_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{call.lead_name}</p>
                    <p className="text-xs text-gray-400">{call.rep_name} · {call.topic} · {formatDate(call.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  <span className="text-xs text-gray-500 w-12 text-right">{formatDuration(call.duration)}</span>
                  <span className={`text-sm font-bold w-10 text-right ${call.score >= 80 ? "text-emerald-400" : call.score >= 60 ? "text-amber-400" : "text-red-400"}`}>{call.score}%</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    call.sentiment === "positive" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                    call.sentiment === "neutral" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                    "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}>{call.sentiment}</span>
                  <svg className={`h-4 w-4 text-gray-500 transition-transform ${selectedCall === call.id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {selectedCall === call.id && (
                <div className="glass-card rounded-b-xl border-t-0 mt-0 p-5 animate-fade-in">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                    <div><p className="text-xs text-gray-500">Duration</p><p className="text-sm font-medium text-white">{formatDuration(call.duration)}</p></div>
                    <div><p className="text-xs text-gray-500">Score</p><p className={`text-sm font-bold ${call.score >= 80 ? "text-emerald-400" : call.score >= 60 ? "text-amber-400" : "text-red-400"}`}>{call.score}%</p></div>
                    <div><p className="text-xs text-gray-500">Type</p><p className="text-sm font-medium text-white capitalize">{call.type}</p></div>
                    <div><p className="text-xs text-gray-500">Date</p><p className="text-sm font-medium text-white">{formatDate(call.date)}</p></div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">AI Analysis</p>
                    <p className="text-sm text-gray-300 leading-relaxed">{call.analysis}</p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-gray-300 hover:bg-white/10 transition-all">View Transcript</button>
                    <button className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-gray-300 hover:bg-white/10 transition-all">Download Recording</button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Upload Modal (visual only) */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-lg rounded-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">Upload Call Recording</h3>
              <button onClick={() => setShowUpload(false)} className="text-2xl text-gray-400 hover:text-white transition-colors">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-xl border-2 border-dashed border-white/10 p-8 text-center">
                <span className="text-4xl block mb-2">🎤</span>
                <p className="text-sm text-gray-400">Drag & drop your call recording here</p>
                <p className="text-xs text-gray-500 mt-1">Supports MP3, WAV, M4A — up to 100MB</p>
                <button className="mt-4 rounded-xl bg-white/10 px-6 py-2 text-sm font-medium text-white hover:bg-white/20 transition-all">Browse Files</button>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-300">Direction:</label>
                <select className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300">
                  <option value="outbound">Outbound</option>
                  <option value="inbound">Inbound</option>
                </select>
              </div>
              <button className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-2.5 text-sm font-medium text-white shadow-lg shadow-purple-500/25 opacity-60 cursor-not-allowed" disabled>
                Upload & Analyze
              </button>
              <p className="text-xs text-center text-gray-500">Demo mode — upload is simulated</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}