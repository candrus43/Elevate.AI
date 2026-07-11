import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

import { getCompanyCalls } from "~/utils/db";
import type { UserSession } from "~/components/layout/Header";

export const Route = createFileRoute("/dashboard/calls")({
  component: CallList,
});

function CallList() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserSession | null>(null);
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(async ({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      const data = await getCompanyCalls(user.companyId);
      setCalls(data);
      setLoading(false);
    });
  }, [navigate]);

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
    </div>
  );

  const filtered = search
    ? calls.filter((c) =>
        (c.rep_name || "").toLowerCase().includes(search.toLowerCase())
      )
    : calls;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Call Reviews</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{calls.length} total calls analyzed</p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search by rep name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 rounded-lg border border-gray-300 bg-white px-4 py-2 pl-10 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 dark:border-gray-700">
                <th className="px-6 py-3 font-medium">Rep</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Duration</th>
                <th className="px-6 py-3 font-medium">Score</th>
                <th className="px-6 py-3 font-medium">Sentiment</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filtered.map((call) => (
                <tr key={call.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {call.rep_name || "Unknown"}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                    {call.started_at ? new Date(call.started_at).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                    {call.duration_seconds ? `${Math.floor(call.duration_seconds / 60)}:${String(call.duration_seconds % 60).padStart(2, "0")}` : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${
                      call.overall_score >= 85 ? "text-green-600 dark:text-green-400" :
                      call.overall_score >= 70 ? "text-yellow-600 dark:text-yellow-400" :
                      "text-red-600 dark:text-red-400"
                    }`}>
                      {call.overall_score ?? "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      call.sentiment === "positive" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
                      call.sentiment === "negative" ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" :
                      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    }`}>
                      {call.sentiment || "neutral"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      call.status === "analyzed" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
                      call.status === "processing" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" :
                      "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                    }`}>
                      {call.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to="/dashboard/calls/$callId"
                      params={{ callId: call.id }}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                    >
                      View →
                    </Link>
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