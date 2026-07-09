import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Multi-company platform administration</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <span className="text-2xl">🏢</span>
          <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">12</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Active Companies</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <span className="text-2xl">👥</span>
          <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">248</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <span className="text-2xl">🎧</span>
          <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">15,842</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Calls Analyzed</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <span className="text-2xl">📊</span>
          <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">$48.2K</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Revenue</p>
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
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      company.plan === "Enterprise" ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" :
                      company.plan === "Pro" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300" :
                      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    }`}>
                      {company.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{company.users}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{company.calls}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                      {company.status}
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