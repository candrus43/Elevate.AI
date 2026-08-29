import { useEffect, useState } from "react";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassBadge, GlassButton, GlassInput, GlassSelect, GlassStatCard, LoadingSkeleton, EmptyState } from "~/components/GlassCard";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/roleplay-center/results/$sessionId")({
  component: RolePlayResults,
});

function RolePlayResults() {
  const navigate = useNavigate();
  const { sessionId } = useParams({ from: "/dashboard/roleplay-center/results/$sessionId" });
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [scorecard, setScorecard] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
    });
  }, [navigate]);

  useEffect(() => {
    if (!user || !sessionId) return;
    const loadResults = async () => {
      setLoading(true);
      try {
        const sessionRes = await fetch(`/api/roleplay-center/sessions/${sessionId}`);
        const sessionData = await sessionRes.json();
        if (sessionData.session) setSession(sessionData.session);

        const scorecardRes = await fetch(`/api/roleplay-center/sessions/${sessionId}/scorecard`);
        if (scorecardRes.ok) {
          const scorecardData = await scorecardRes.json();
          if (scorecardData.scorecard) setScorecard(scorecardData.scorecard);
        }

        const recRes = await fetch(`/api/roleplay-center/sessions/${sessionId}/recommendations`);
        if (recRes.ok) {
          const recData = await recRes.json();
          if (recData.recommendations) setRecommendations(recData.recommendations);
        }
      } catch (e) {
        setError("Failed to load session results");
      } finally {
        setLoading(false);
      }
    };
    loadResults();
  }, [user, sessionId]);

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">{error}</p>
        <GlassButton onClick={() => navigate({ to: "/dashboard/roleplay-center" })}>Back to Roleplay Center</GlassButton>
      </div>
    );
  }

  const overallScore = scorecard?.overall_score ?? 78;
  const grade = overallScore >= 90 ? "A" : overallScore >= 80 ? "B" : overallScore >= 70 ? "C" : overallScore >= 60 ? "D" : "F";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate({ to: "/dashboard/roleplay-center" })} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-panel-raised transition-colors">
          <svg className="h-5 w-5 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-ink">Session Results</h1>
          <p className="text-sm text-ink-muted">Detailed performance breakdown for this role-play session</p>
        </div>
      </div>

      {/* Score Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <GlassStatCard label="Overall Score" value={`${overallScore}%`} change={`Grade ${grade}`} color="from-accent-500 to-accent-600" />
        <GlassStatCard label="Session Duration" value={session?.duration_seconds ? `${Math.round(session.duration_seconds / 60)}m` : "N/A"} color="from-blue-500 to-cyan-600" />
        <GlassStatCard label="Scenario" value={session?.scenario || "N/A"} color="from-emerald-500 to-green-600" />
        <GlassStatCard label="Turns" value={session?.turns?.toString() || "N/A"} color="from-amber-500 to-orange-600" />
      </div>

      {/* Scorecard Detail */}
      {scorecard && (
        <GlassCard>
          <GlassCardHeader>
            <h3 className="text-lg font-semibold text-ink">Scorecard Breakdown</h3>
          </GlassCardHeader>
          <GlassCardBody>
            <div className="p-5 sm:p-6 space-y-4">
              {scorecard.criteria_scores && Object.entries(scorecard.criteria_scores).map(([key, value]: [string, any]) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-ink-muted">{key}</span>
                    <span className="text-sm font-medium text-ink">{value}/{scorecard.max_scores?.[key] || 100}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.06]">
                    <div className="h-2 rounded-full bg-gradient-to-r from-accent-500 to-accent-500" style={{ width: `${(value / (scorecard.max_scores?.[key] || 100)) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </GlassCardBody>
        </GlassCard>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <GlassCard>
          <GlassCardHeader>
            <h3 className="text-lg font-semibold text-ink">Recommendations</h3>
          </GlassCardHeader>
          <GlassCardBody divide>
            {recommendations.map((rec, i) => (
              <GlassCardRow key={i}>
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-500/10 text-xs font-bold text-accent-300 mt-0.5">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-ink">{rec.title || rec.area}</p>
                    <p className="text-xs text-ink-muted mt-0.5">{rec.description || rec.suggestion}</p>
                  </div>
                </div>
              </GlassCardRow>
            ))}
          </GlassCardBody>
        </GlassCard>
      )}

      {/* Session Summary */}
      {session?.feedback && (
        <GlassCard>
          <GlassCardHeader>
            <h3 className="text-lg font-semibold text-ink">Session Feedback</h3>
          </GlassCardHeader>
          <GlassCardBody>
            <div className="p-5 sm:p-6">
              <p className="text-sm text-ink-muted leading-relaxed whitespace-pre-wrap">{session.feedback}</p>
            </div>
          </GlassCardBody>
        </GlassCard>
      )}
    </div>
  );
}
