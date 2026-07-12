import { LoadingSkeleton } from '~/components/GlassCard';
import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

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

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate({ to: "/dashboard/executive" })} className="text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&larr;</button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Scheduled Reports</h1>
          <p className="text-sm text-gray-500">Manage automated report delivery</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { name: "Weekly Performance Summary", schedule: "Every Monday 9am", format: "PDF", recipients: "3 managers", active: true },
          { name: "Monthly Executive Brief", schedule: "1st of month 8am", format: "PDF + CSV", recipients: "2 directors", active: true },
          { name: "Team Health Report", schedule: "Every Friday 5pm", format: "CSV", recipients: "5 team leads", active: false },
          { name: "Coaching ROI Analysis", schedule: "15th of month", format: "PDF", recipients: "1 VP Sales", active: true },
          { name: "Call Quality Trends", schedule: "Every 2 weeks", format: "PDF", recipients: "4 managers", active: false },
          { name: "Compliance Summary", schedule: "Daily 8am", format: "CSV", recipients: "1 compliance officer", active: true },
        ].map((report, i) => (
          <div key={i} className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-medium text-gray-900 dark:text-white">{report.name}</h3>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${report.active ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`}>{report.active ? "Active" : "Paused"}</span>
            </div>
            <div className="space-y-1.5 text-sm">
              <p className="text-gray-500">📅 {report.schedule}</p>
              <p className="text-gray-500">📄 {report.format}</p>
              <p className="text-gray-500">👥 {report.recipients}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}