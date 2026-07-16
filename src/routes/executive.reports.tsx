import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassStatCard, GlassBadge, GlassButton } from '~/components/GlassCard';
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/executive/reports")({
  component: Reports,
});

const reports = [
  { id: "r1", name: "Weekly Performance Summary", report_type: "PDF", schedule: "weekly", recipients: ["3 managers"], is_active: true, last_sent_at: "2026-07-14T09:00:00Z", created_by_name: "System" },
  { id: "r2", name: "Monthly Executive Brief", report_type: "PDF + CSV", schedule: "monthly", recipients: ["2 directors"], is_active: true, last_sent_at: "2026-07-01T08:00:00Z", created_by_name: "System" },
  { id: "r3", name: "Compliance Summary", report_type: "CSV", schedule: "daily", recipients: ["1 compliance officer"], is_active: true, last_sent_at: "2026-07-15T08:00:00Z", created_by_name: "System" },
  { id: "r4", name: "Team Health Report", report_type: "CSV", schedule: "weekly", recipients: ["5 team leads"], is_active: false, last_sent_at: null, created_by_name: "System" },
  { id: "r5", name: "Coaching ROI Analysis", report_type: "PDF", schedule: "monthly", recipients: ["1 VP Sales"], is_active: true, last_sent_at: "2026-06-15T08:00:00Z", created_by_name: "System" },
];

const scheduleLabels: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
};

function Reports() {
  const [period, setPeriod] = useState("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const periods = [
    { value: "7d", label: "7 Days" },
    { value: "30d", label: "30 Days" },
    { value: "90d", label: "90 Days" },
    { value: "custom", label: "Custom" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to="/executive" className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/5 transition-colors">
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Scheduled Reports</h1>
          <p className="text-sm text-gray-400">Manage automated report delivery</p>
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
          <span className="text-xs text-gray-500">5 reports</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => {
          const scheduleLabel = scheduleLabels[report.schedule] || report.schedule;
          const isActive = report.is_active;
          return (
            <GlassCard key={report.id} padding="md" hover glow>
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-medium text-white">{report.name}</h3>
                <GlassBadge color={isActive ? "green" : "default"}>
                  {isActive ? "Active" : "Paused"}
                </GlassBadge>
              </div>
              <div className="space-y-1.5 text-sm">
                <p className="text-gray-500">📅 {scheduleLabel}</p>
                <p className="text-gray-500">📄 {report.report_type}</p>
                <p className="text-gray-500">👥 {report.recipients}</p>
                {report.last_sent_at && (
                  <p className="text-gray-500">🕐 Last sent: {new Date(report.last_sent_at).toLocaleDateString()}</p>
                )}
              </div>
              <div className="mt-3 text-xs text-gray-400">
                Created by {report.created_by_name}
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}