import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Multi-company platform administration</p>
        </div>
      </div>

      {/* KPI Cards — 2-col mobile, 4-col desktop */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
        <AdminKpiCard icon="🏢" value="12" label="Active Companies" />
        <AdminKpiCard icon="👥" value="248" label="Total Users" />
        <AdminKpiCard icon="🎧" value="15.8K" label="Calls Analyzed" />
        <AdminKpiCard icon="📊" value="$48.2K" label="Monthly Revenue" />
      </div>

      {/* Companies — Card layout on mobile, table on desktop */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 dark:border-gray-700">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Companies</h3>
        </div>

        {/* Mobile: Card layout */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700 sm:hidden">
          {[
            { name: "Acme Corp", plan: "Enterprise", users: 45, calls: 3842, status: "Active" },
            { name: "TechStart Inc", plan: "Pro", users: 22, calls: 1847, status: "Active" },
            { name: "Global Solutions", plan: "Core", users: 8, calls: 542, status: "Active" },
            { name: "DataFlow Ltd", plan: "Pro", users: 15, calls: 1102, status: "Active" },
          ].map((company, i) => (
            <div key={i} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{company.name}</span>
                <PlanBadge plan={company.plan} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 dark:text-gray-400">
                <div><span className="font-medium text-gray-700 dark:text-gray-300">{company.users}</span> users</div>
                <div><span className="font-medium text-gray-700 dark:text-gray-300">{company.calls}</span> calls</div>
                <div><StatusBadge status={company.status} /></div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: Table layout */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 dark:border-gray-700">
                <th className="px-6 py-3 font-medium">Company</th>
                <th className="px-6 py-3 font-medium">Plan</th>
                <th className="px-6 py-3 font-medium">Users</th>
                <th className="px-6 py-3 font-medium">Calls</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {[
                { name: "Acme Corp", plan: "Enterprise", users: 45, calls: 3842, status: "Active" },
                { name: "TechStart Inc", plan: "Pro", users: 22, calls: 1847, status: "Active" },
                { name: "Global Solutions", plan: "Core", users: 8, calls: 542, status: "Active" },
                { name: "DataFlow Ltd", plan: "Pro", users: 15, calls: 1102, status: "Active" },
              ].map((company, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{company.name}</td>
                  <td className="px-6 py-4"><PlanBadge plan={company.plan} /></td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{company.users}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{company.calls}</td>
                  <td className="px-6 py-4"><StatusBadge status={company.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, string> = {
    Enterprise: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    Pro: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
    Core: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[plan] || "bg-gray-100 text-gray-700"}`}>
      {plan}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
      {status}
    </span>
  );
}

function AdminKpiCard({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-6 dark:border-gray-700 dark:bg-gray-900">
      <span className="text-lg sm:text-2xl">{icon}</span>
      <p className="mt-2 sm:mt-3 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}