import { LoadingSkeleton } from '~/components/GlassCard';
import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/executive/forecasting")({
  component: Forecasting,
});

function Forecasting() {
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Forecasting</h1>
          <p className="text-sm text-gray-500">Revenue projections and trend analysis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500">Current Month</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">$124,500</p>
          <span className="text-xs text-green-600">↑ 12.3% vs last month</span>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500">Next Quarter</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">$412,000</p>
          <span className="text-xs text-green-600">↑ 8.7% projected</span>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500">Annual Run Rate</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">$1.49M</p>
          <span className="text-xs text-green-600">↑ 15.2% YoY</span>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Projections</h3>
        <div className="space-y-3">
          {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month, i) => (
            <div key={i} className="flex items-center gap-4">
              <span className="w-10 text-sm text-gray-500">{month}</span>
              <div className="flex-1 h-5 rounded-full bg-gray-200 dark:bg-gray-700">
                <div className="h-5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${70 + i * 5}%` }} />
              </div>
              <span className="w-20 text-right text-sm font-medium text-gray-900 dark:text-white">${(80 + i * 12)}K</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}