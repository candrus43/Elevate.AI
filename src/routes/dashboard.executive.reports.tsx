import { LoadingSkeleton } from '~/components/GlassCard';
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassStatCard, GlassBadge, GlassButton } from '~/components/GlassCard';
import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/executive/reports")({
  component: Reports,
});

function Reports() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      setLoading(false);
    });
  }, [navigate]);

  const reports = [
    { name: "Weekly Performance Summary", schedule: "Every Monday 9am", format: "PDF", recipients: "3 managers", active: true, gradient: "from-accent-500 to-accent-600" },
    { name: "Monthly Executive Brief", schedule: "1st of month 8am", format: "PDF + CSV", recipients: "2 directors", active: true, gradient: "from-emerald-500 to-green-600" },
    { name: "Team Health Report", schedule: "Every Friday 5pm", format: "CSV", recipients: "5 team leads", active: false, gradient: "from-amber-500 to-orange-600" },
    { name: "Coaching ROI Analysis", schedule: "15th of month", format: "PDF", recipients: "1 VP Sales", active: true, gradient: "from-rose-500 to-pink-600" },
    { name: "Call Quality Trends", schedule: "Every 2 weeks", format: "PDF", recipients: "4 managers", active: false, gradient: "from-cyan-500 to-blue-600" },
    { name: "Compliance Summary", schedule: "Daily 8am", format: "CSV", recipients: "1 compliance officer", active: true, gradient: "from-accent-500 to-accent-600" },
  ];

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard/executive" className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-panel-raised transition-colors">
            <svg className="h-5 w-5 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-ink">Scheduled Reports</h1>
            <p className="text-sm text-ink-muted">Manage automated report delivery</p>
          </div>
        </div>
        <GlassButton variant="primary">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Report
        </GlassButton>
      </div>

      {/* Summary Stats using GlassStatCard */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <GlassStatCard label="Total Reports" value="6" icon={<span>📋</span>} color="from-accent-500 to-accent-600" />
        <GlassStatCard label="Active" value="4" icon={<span>✅</span>} color="from-emerald-500 to-green-600" />
        <GlassStatCard label="Paused" value="2" icon={<span>⏸️</span>} color="from-amber-500 to-orange-600" />
        <GlassStatCard label="Recipients" value="16" icon={<span>👥</span>} color="from-blue-500 to-cyan-600" />
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report, i) => (
          <GlassCard key={i} padding="md" hover glow>
            {/* Gradient accent bar */}
            <div className={`h-1 w-12 rounded-full bg-gradient-to-r ${report.gradient} mb-4`} />

            <div className="flex items-start justify-between mb-3">
              <h3 className="font-medium text-ink group-hover:text-accent-300 transition-colors">{report.name}</h3>
              <GlassBadge color={report.active ? "green" : "default"}>
                {report.active ? "Active" : "Paused"}
              </GlassBadge>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-ink-muted">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{report.schedule}</span>
              </div>
              <div className="flex items-center gap-2 text-ink-muted">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>{report.format}</span>
              </div>
              <div className="flex items-center gap-2 text-ink-muted">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>{report.recipients}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2 justify-end">
                <button className="rounded-lg px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink hover:bg-panel-raised transition-all">
                  Edit
                </button>
                <button className="rounded-lg px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink hover:bg-panel-raised transition-all">
                  {report.active ? "Pause" : "Resume"}
                </button>
                <button className="rounded-lg px-3 py-1.5 text-xs font-medium text-accent-300 hover:text-accent-300 hover:bg-accent-500/10 transition-all">
                  Run Now
                </button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}