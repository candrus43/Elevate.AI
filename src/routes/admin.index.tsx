import { LoadingSkeleton } from '~/components/GlassCard';
import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { db } from "~/utils/db";
import { sql } from "~/utils/sql";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    companies: 0,
    users: 0,
    calls: 0,
    activeUsers: 0,
    mrr: 0,
    trialCompanies: 0,
    growth: { companies: 0, users: 0, calls: 0 },
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(async ({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      if (user.role !== "admin") { navigate({ to: "/dashboard" }); return; }
      setUser(user);
      try {
        const [companiesData, companyCount, userCount, callCount, activeUsers, trialCount, activity] = await Promise.all([
          db(sql`
            SELECT c.id, c.name, c.slug, c.tier, c.is_active, c.created_at,
              (SELECT COUNT(*) FROM users WHERE company_id = c.id) as user_count,
              (SELECT COUNT(*) FROM calls WHERE company_id = c.id) as call_count
            FROM companies c
            ORDER BY c.created_at DESC
            LIMIT 5
          `),
          db(sql`SELECT COUNT(*) as cnt FROM companies`),
          db(sql`SELECT COUNT(*) as cnt FROM users`),
          db(sql`SELECT COUNT(*) as cnt FROM calls`),
          db(sql`SELECT COUNT(*) as cnt FROM users WHERE is_active = 1`),
          db(sql`SELECT COUNT(*) as cnt FROM companies WHERE tier = 'core'`),
          db(sql`
            SELECT ae.event_type, ae.properties, ae.created_at,
              u.name as user_name, c.name as company_name
            FROM analytics_events ae
            LEFT JOIN users u ON u.id = ae.user_id
            LEFT JOIN companies c ON c.id = ae.company_id
            ORDER BY ae.created_at DESC
            LIMIT 10
          `),
        ]);

        // Calculate MRR (simplified: tier-based pricing)
        const tiers = await db(sql`
          SELECT tier, COUNT(*) as cnt FROM companies WHERE is_active = 1 GROUP BY tier
        `);
        const tierPrices: Record<string, number> = { core: 29, pro: 79, enterprise: 199 };
        const mrr = tiers.reduce((sum: number, t: any) => sum + (tierPrices[t.tier] || 0) * t.cnt, 0);

        // Calculate growth (compare to last month approximation)
        const lastMonthCompanies = await db(sql`
          SELECT COUNT(*) as cnt FROM companies WHERE created_at < datetime('now', '-30 days')
        `);
        const lastMonthUsers = await db(sql`
          SELECT COUNT(*) as cnt FROM users WHERE created_at < datetime('now', '-30 days')
        `);
        const lastMonthCalls = await db(sql`
          SELECT COUNT(*) as cnt FROM calls WHERE created_at < datetime('now', '-30 days')
        `);

        const prevCompanies = lastMonthCompanies[0]?.cnt || 0;
        const prevUsers = lastMonthUsers[0]?.cnt || 0;
        const prevCalls = lastMonthCalls[0]?.cnt || 0;

        setStats({
          companies: companyCount[0]?.cnt || 0,
          users: userCount[0]?.cnt || 0,
          calls: callCount[0]?.cnt || 0,
          activeUsers: activeUsers[0]?.cnt || 0,
          mrr,
          trialCompanies: trialCount[0]?.cnt || 0,
          growth: {
            companies: prevCompanies > 0 ? Math.round(((companyCount[0]?.cnt || 0) - prevCompanies) / prevCompanies * 100) : 0,
            users: prevUsers > 0 ? Math.round(((userCount[0]?.cnt || 0) - prevUsers) / prevUsers * 100) : 0,
            calls: prevCalls > 0 ? Math.round(((callCount[0]?.cnt || 0) - prevCalls) / prevCalls * 100) : 0,
          },
        });
        setCompanies(companiesData);
        setRecentActivity(activity);
      } catch (e) {
        console.error("Failed to load admin data", e);
      }
      setLoading(false);
    });
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <LoadingSkeleton className="h-8 w-8 rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Multi-company platform administration</p>
        </div>
        <div className="flex gap-3">
          <a
            href="/admin/organizations"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Manage Organizations
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 transition-all hover:shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <div className="absolute right-0 top-0 h-20 w-20 translate-x-6 -translate-y-6 rounded-full bg-indigo-500/10 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏢</span>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/50 dark:text-green-300">
                +{stats.growth.companies}%
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">{stats.companies}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Active Companies</p>
          </div>
        </div>
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 transition-all hover:shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <div className="absolute right-0 top-0 h-20 w-20 translate-x-6 -translate-y-6 rounded-full bg-purple-500/10 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="text-2xl">👥</span>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/50 dark:text-green-300">
                +{stats.growth.users}%
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">{stats.users}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{stats.activeUsers} active</p>
          </div>
        </div>
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 transition-all hover:shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <div className="absolute right-0 top-0 h-20 w-20 translate-x-6 -translate-y-6 rounded-full bg-blue-500/10 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎧</span>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/50 dark:text-green-300">
                +{stats.growth.calls}%
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">{stats.calls}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Calls Analyzed</p>
          </div>
        </div>
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 transition-all hover:shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <div className="absolute right-0 top-0 h-20 w-20 translate-x-6 -translate-y-6 rounded-full bg-amber-500/10 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💰</span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                MRR
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">${stats.mrr.toLocaleString()}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Recurring Revenue</p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{stats.trialCompanies} on Core plan</p>
          </div>
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <a
          href="/admin/organizations"
          className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-indigo-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-indigo-600"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-lg dark:bg-indigo-900/50">
              🏢
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Organizations</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage all companies</p>
            </div>
          </div>
        </a>
        <a
          href="/admin/departments"
          className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-purple-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-purple-600"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-lg dark:bg-purple-900/50">
              🏛️
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Departments</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Organize teams</p>
            </div>
          </div>
        </a>
        <a
          href="/admin/feature-flags"
          className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-amber-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-amber-600"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-lg dark:bg-amber-900/50">
              🚩
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Feature Flags</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Toggle platform features</p>
            </div>
          </div>
        </a>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Companies */}
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Organizations</h3>
            <a
              href="/admin/organizations"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              View all
            </a>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {companies.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                No organizations yet
              </div>
            ) : (
              companies.map((company: any) => (
                <a
                  key={company.id}
                  href={`/admin/organizations/${company.id}`}
                  className="flex items-center justify-between px-6 py-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{company.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{company.slug}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                      company.tier === "enterprise"
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
                        : company.tier === "pro"
                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    }`}>
                      {company.tier}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      company.is_active
                        ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                    }`}>
                      {company.is_active ? "Active" : "Suspended"}
                    </span>
                  </div>
                </a>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentActivity.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                No recent activity
              </div>
            ) : (
              recentActivity.map((event: any, i: number) => (
                <div key={i} className="flex items-start gap-3 px-6 py-3">
                  <div className="mt-0.5">
                    {event.event_type === "login" ? (
                      <span className="text-sm">🔑</span>
                    ) : event.event_type === "coaching_started" ? (
                      <span className="text-sm">🎯</span>
                    ) : event.event_type === "report_exported" ? (
                      <span className="text-sm">📄</span>
                    ) : event.event_type === "call_analyzed" ? (
                      <span className="text-sm">🎧</span>
                    ) : (
                      <span className="text-sm">📌</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">{event.user_name || "System"}</span>
                      {" "}—{" "}
                      <span className="text-gray-500 dark:text-gray-400">
                        {event.event_type.replace(/_/g, " ")}
                      </span>
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {event.company_name}
                      {" · "}
                      {event.created_at ? new Date(event.created_at + "Z").toLocaleDateString("en-US", {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                      }) : ""}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}