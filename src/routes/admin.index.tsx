import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";


import { db } from "~/utils/db";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserSession | null>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [stats, setStats] = useState({ companies: 0, users: 0, calls: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(async ({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      if (user.role !== "admin") { navigate({ to: "/dashboard" }); return; }
      setUser(user);
      try {
        const [companiesData, companyCount, userCount, callCount] = await Promise.all([
          db("SELECT c.id, c.name, c.slug, c.tier, c.is_active, c.created_at, (SELECT COUNT(*) FROM users WHERE company_id = c.id) as user_count FROM companies c ORDER BY c.created_at DESC"),
          db("SELECT COUNT(*) as cnt FROM companies"),
          db("SELECT COUNT(*) as cnt FROM users"),
          db("SELECT COUNT(*) as cnt FROM calls"),
        ]);
        setCompanies(companiesData);
        setStats({
          companies: companyCount[0]?.cnt || 0,
          users: userCount[0]?.cnt || 0,
          calls: callCount[0]?.cnt || 0,
        });
      } catch (e) {
        console.error("Failed to load admin data", e);
      }
      setLoading(false);
    });
  }, [navigate]);

  if (loading) return <div className="flex items-center justify-center h-48"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Multi-company platform administration</p>
        </div>
      </div>

      {/* KPI Cards from live data */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <span className="text-2xl">🏢</span>
          <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{stats.companies}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Active Companies</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <span className="text-2xl">👥</span>
          <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{stats.users}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <span className="text-2xl">🎧</span>
          <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{stats.calls}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Calls Analyzed</p>
        </div>
      </div>

      {/* Companies table */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Companies</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 dark:border-gray-700">
                <th className="px-6 py-3 font-medium">Company</th>
                <th className="px-6 py-3 font-medium">Plan</th>
                <th className="px-6 py-3 font-medium">Users</th>
                <th className="px-6 py-3 font-medium">Created</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {companies.map((company, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{company.name}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                      company.tier === "enterprise" ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" :
                      company.tier === "pro" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300" :
                      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    }`}>
                      {company.tier}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{company.user_count || 0}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                    {company.created_at ? new Date(company.created_at).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      company.is_active ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
                      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    }`}>
                      {company.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}