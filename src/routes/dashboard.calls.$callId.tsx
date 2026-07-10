import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { getSession } from "~/utils/auth";
import type { UserSession } from "~/utils/auth";
import { getCallDetails } from "~/utils/db";

export const Route = createFileRoute("/dashboard/calls/$callId")({
  component: CallDetail,
});

function CallDetail() {
  const { callId } = Route.useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserSession | null>(null);
  const [call, setCall] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSession().then(async ({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      const data = await getCallDetails(callId);
      setCall(data);
      setLoading(false);
    });
  }, [callId, navigate]);

  if (loading) return <div className="flex items-center justify-center h-48"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" /></div>;
  if (!call) return <div className="p-6 text-center text-gray-500">Call not found</div>;

  const scoreColor = call.overall_score >= 85 ? "text-green-400" : call.overall_score >= 70 ? "text-yellow-400" : "text-red-400";
  const objections = call.objections_detected ? JSON.parse(call.objections_detected) : [];
  const topics = call.key_topics ? JSON.parse(call.key_topics) : [];
  const complianceIssues = call.compliance_issues ? JSON.parse(call.compliance_issues) : [];

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link to="/dashboard/calls" className="text-sm text-indigo-400 hover:text-indigo-300">
        ← Back to Calls
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Call Review</h1>
          <p className="text-sm text-gray-400">{call.rep_name || "Unknown Rep"} · {call.started_at ? new Date(call.started_at).toLocaleDateString() : "Unknown date"}</p>
        </div>
        <div className={`text-4xl font-bold ${scoreColor}`}>
          {call.overall_score ?? "-"}
          <span className="text-sm text-gray-500">/100</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Analysis */}
          <div className="rounded-xl border border-gray-700 bg-gray-900 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">AI Analysis</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-gray-400">Sentiment</p>
                <p className="text-lg font-medium text-white capitalize">{call.sentiment || "neutral"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Talk Ratio (Rep)</p>
                <p className="text-lg font-medium text-white">{call.talk_ratio_rep ? `${(call.talk_ratio_rep * 100).toFixed(0)}%` : "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Talk Ratio (Customer)</p>
                <p className="text-lg font-medium text-white">{call.talk_ratio_customer ? `${(call.talk_ratio_customer * 100).toFixed(0)}%` : "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Pace</p>
                <p className="text-lg font-medium text-white">{call.avg_pace_wpm ? `${call.avg_pace_wpm} wpm` : "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Filler Words</p>
                <p className="text-lg font-medium text-white">{call.filler_word_count ?? 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Duration</p>
                <p className="text-lg font-medium text-white">
                  {call.duration_seconds ? `${Math.floor(call.duration_seconds / 60)}:${String(call.duration_seconds % 60).padStart(2, "0")}` : "-"}
                </p>
              </div>
            </div>

            {call.summary && (
              <div className="mt-4">
                <p className="text-sm text-gray-400 mb-1">Summary</p>
                <p className="text-sm text-gray-300">{call.summary}</p>
              </div>
            )}
          </div>

          {/* Detected Objections */}
          {objections.length > 0 && (
            <div className="rounded-xl border border-gray-700 bg-gray-900 p-6">
              <h3 className="mb-3 text-lg font-semibold text-white">Detected Objections</h3>
              <div className="flex flex-wrap gap-2">
                {objections.map((o: string, i: number) => (
                  <span key={i} className="rounded-full bg-amber-900/30 px-3 py-1 text-sm text-amber-300 border border-amber-800">
                    {o}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Compliance */}
          {call.compliance && call.compliance.length > 0 && (
            <div className="rounded-xl border border-gray-700 bg-gray-900 p-6">
              <h3 className="mb-3 text-lg font-semibold text-white">Compliance Checks</h3>
              <div className="space-y-2">
                {call.compliance.map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-gray-800 p-3">
                    <div>
                      <p className="text-sm font-medium text-white">{c.rule_name}</p>
                      <p className="text-xs text-gray-400">{c.details}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      c.passed ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"
                    }`}>
                      {c.passed ? "Passed" : "Failed"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Topics */}
          {topics.length > 0 && (
            <div className="rounded-xl border border-gray-700 bg-gray-900 p-6">
              <h3 className="mb-3 text-lg font-semibold text-white">Key Topics</h3>
              <div className="flex flex-wrap gap-2">
                {topics.map((t: string, i: number) => (
                  <span key={i} className="rounded-full bg-indigo-900/30 px-3 py-1 text-sm text-indigo-300 border border-indigo-800">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Transcript */}
          {call.transcript && (
            <div className="rounded-xl border border-gray-700 bg-gray-900 p-6">
              <h3 className="mb-3 text-lg font-semibold text-white">Transcript</h3>
              <div className="max-h-96 overflow-y-auto rounded-lg bg-gray-800 p-4">
                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans">{call.transcript}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Scorecard sidebar */}
        <div className="space-y-6">
          {/* Scores */}
          {call.scores && call.scores.length > 0 && call.scores.map((s: any, i: number) => (
            <div key={i} className="rounded-xl border border-gray-700 bg-gray-900 p-6">
              <h3 className="mb-3 text-lg font-semibold text-white">{s.scorecard_name || "Scorecard"}</h3>
              <p className="text-sm text-gray-400 mb-3">Total Score: <span className="text-white font-bold">{s.total_score}</span></p>
              {s.notes && <p className="text-sm text-gray-400 mb-3">Notes: {s.notes}</p>}
            </div>
          ))}

          {/* Compliance issues flag */}
          {complianceIssues.length > 0 && (
            <div className="rounded-xl border border-red-800 bg-red-900/20 p-6">
              <h3 className="mb-2 text-lg font-semibold text-red-400">⚠ Compliance Flags</h3>
              {complianceIssues.map((ci: string, i: number) => (
                <p key={i} className="text-sm text-red-300">{ci}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}