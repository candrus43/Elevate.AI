import { LoadingSkeleton } from '~/components/GlassCard';
import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/executive/team-health")({
  component: TeamHealth,
});

function TeamHealth() {
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

  const teams = [
    { name: "Enterprise Sales", score: 87, trend: "up", reps: 8, calls: 342, avgScore: 82, coaching: 95, revenue: "$1.2M" },
    { name: "SMB Sales", score: 72, trend: "up", reps: 6, calls: 891, avgScore: 68, coaching: 78, revenue: "$890K" },
    { name: "Customer Success", score: 91, trend: "up", reps: 4, calls: 156, avgScore: 88, coaching: 100, revenue: "$650K" },
    { name: "Inside Sales", score: 65, trend: "down", reps: 6, calls: 1458, avgScore: 61, coaching: 55, revenue: "$420K" },
  ];

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate({ to: "/dashboard/executive" })} className="text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&larr;</button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team Health</h1>
          <p className="text-sm text-gray-500">Detailed team performance metrics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {teams.map((team, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">{team.name}</h3>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${team.score >= 80 ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" : team.score >= 70 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"}`}>{team.score}%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 mb-4">
              <div className={`h-2 rounded-full transition-all duration-500 ${team.score >= 80 ? "bg-green-500" : team.score >= 70 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${team.score}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-gray-500">Reps</p><p className="font-medium text-gray-900 dark:text-white">{team.reps}</p></div>
              <div><p className="text-xs text-gray-500">Calls</p><p className="font-medium text-gray-900 dark:text-white">{team.calls}</p></div>
              <div><p className="text-xs text-gray-500">Avg Score</p><p className="font-medium text-gray-900 dark:text-white">{team.avgScore}%</p></div>
              <div><p className="text-xs text-gray-500">Coaching</p><p className="font-medium text-gray-900 dark:text-white">{team.coaching}%</p></div>
              <div className="col-span-2"><p className="text-xs text-gray-500">Revenue</p><p className="font-medium text-gray-900 dark:text-white">{team.revenue}</p></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}