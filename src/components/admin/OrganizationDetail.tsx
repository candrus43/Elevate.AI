import { useEffect, useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";

interface OrgDetailProps {
  orgId: string;
}

interface OrgData {
  id: string;
  name: string;
  slug: string;
  tier: string;
  is_active: number;
  settings: string;
  created_at: string;
  user_count: number;
  call_count: number;
  coaching_count: number;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: number;
  team_name: string | null;
  created_at: string;
  last_login_at: string | null;
}

export function OrganizationDetail({ orgId }: OrgDetailProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<OrgData | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [calls, setCalls] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "teams" | "activity" | "billing">("overview");
  const [notification, setNotification] = useState<{ type: string; message: string } | null>(null);

  useEffect(() => {
    loadData();
  }, [orgId]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}`);
      if (!res.ok) throw new Error("Failed to load organization data");
      const data = await res.json();
      setOrg(data.org);
      setUsers(data.users || []);
      setCalls(data.calls || []);
      setTeams(data.teams || []);
      setActivity(data.activity || []);
    } catch (e: any) {
      setError(e.message || "Failed to load data");
    }
    setLoading(false);
  }

  async function handleUserRoleChange(userId: string, newRole: string) {
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error("Failed");
      setNotification({ type: "success", message: "User role updated" });
      await loadData();
    } catch (e: any) { setNotification({ type: "error", message: e.message }); }
  }

  async function handleUserSuspend(userId: string, currentlyActive: boolean) {
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: currentlyActive ? 0 : 1 }),
      });
      if (!res.ok) throw new Error("Failed");
      setNotification({ type: "success", message: `User ${currentlyActive ? "suspended" : "activated"}` });
      await loadData();
    } catch (e: any) { setNotification({ type: "error", message: e.message }); }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-64 rounded-lg bg-gray-200 dark:bg-gray-700" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-xl bg-gray-200 dark:bg-gray-700" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <span className="text-4xl mb-4">⚠️</span>
        <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
        <button onClick={loadData} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">Retry</button>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <span className="text-4xl mb-4">🏢</span>
        <p className="text-gray-500 dark:text-gray-400">Organization not found</p>
        <a href="/admin/organizations" className="mt-4 text-sm text-indigo-600 hover:text-indigo-500">Back to organizations</a>
      </div>
    );
  }

  const settings = (() => { try { return JSON.parse(org.settings || "{}"); } catch { return {}; } })();

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "users", label: "Users", icon: "👥", count: users.length },
    { id: "teams", label: "Teams", icon: "👤", count: teams.length },
    { id: "activity", label: "Activity", icon: "📋" },
    { id: "billing", label: "Billing", icon: "💳" },
  ] as const;

  return (
    <div className="space-y-6">
      {notification && (
        <div className={`rounded-xl border px-4 py-3 text-sm flex items-center justify-between ${notification.type === "success" ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300" : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"}`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-2 text-lg leading-none hover:opacity-70">&times;</button>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <a href="/admin/organizations" className="text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-label="Back to organizations">&larr;</a>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{org.name}</h1>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${org.tier === "enterprise" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" : org.tier === "pro" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}>{org.tier}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${org.is_active ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"}`}>{org.is_active ? "Active" : "Suspended"}</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">slug: <code className="text-gray-700 dark:text-gray-300">{org.slug}</code> &middot; Created {org.created_at ? new Date(org.created_at + "Z").toLocaleDateString() : "-"}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800" role="tablist">
        {tabs.map((tab) => (
          <button key={tab.id} role="tab" aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"}`}>
            <span aria-hidden="true">{tab.icon}</span><span>{tab.label}</span>
            {tab.count !== undefined && <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">{tab.count}</span>}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: "👥", value: org.user_count || 0, label: "Total Users" },
              { icon: "🎧", value: org.call_count || 0, label: "Calls Analyzed" },
              { icon: "🎯", value: org.coaching_count || 0, label: "Coaching Plans" },
              { icon: "👤", value: teams.length, label: "Teams" },
            ].map((kpi, i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
                <span className="text-2xl" aria-hidden="true">{kpi.icon}</span>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{kpi.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{kpi.label}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700"><h3 className="text-lg font-semibold text-gray-900 dark:text-white">Company Settings</h3></div>
            <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">
              <div><p className="text-sm text-gray-500">Primary Color</p><div className="mt-1 flex items-center gap-2"><div className="h-5 w-5 rounded-full border" style={{ backgroundColor: settings.primary_color || "#6366f1" }} /><span className="text-sm text-gray-900 dark:text-white">{settings.primary_color || "#6366f1"}</span></div></div>
              <div><p className="text-sm text-gray-500">Logo URL</p><p className="mt-1 text-sm text-gray-900 dark:text-white break-all">{settings.logo_url || "\u2014"}</p></div>
              <div><p className="text-sm text-gray-500">Custom Domain</p><p className="mt-1 text-sm text-gray-900 dark:text-white">{settings.custom_domain || "\u2014"}</p></div>
              <div><p className="text-sm text-gray-500">Tier</p><p className="mt-1 text-sm font-medium text-gray-900 dark:text-white capitalize">{org.tier}</p></div>
              <div><p className="text-sm text-gray-500">Call Limit</p><p className="mt-1 text-sm text-gray-900 dark:text-white">{settings.call_limit || "Unlimited"}</p></div>
              <div><p className="text-sm text-gray-500">User Limit</p><p className="mt-1 text-sm text-gray-900 dark:text-white">{settings.user_limit || "Unlimited"}</p></div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700"><h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Calls</h3></div>
            {calls.length === 0 ? <div className="px-6 py-8 text-center text-sm text-gray-500">No calls yet</div> : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {calls.slice(0, 5).map((call: any) => (
                  <div key={call.id} className="flex items-center justify-between px-6 py-3">
                    <div><p className="text-sm font-medium text-gray-900 dark:text-white">{call.rep_name || "Unknown"}</p><p className="text-xs text-gray-500">{call.direction} &middot; {call.duration_seconds ? Math.round(call.duration_seconds / 60) + "m" : "\u2014"}</p></div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${(call.overall_score || 0) >= 80 ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" : (call.overall_score || 0) >= 60 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300" : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"}`}>{call.overall_score || "\u2014"}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700"><h3 className="text-lg font-semibold text-gray-900 dark:text-white">Users ({users.length})</h3></div>
          {users.length === 0 ? <div className="px-6 py-8 text-center text-sm text-gray-500">No users</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-gray-200 text-gray-500 dark:border-gray-700"><th className="px-6 py-3 font-medium">Name</th><th className="px-6 py-3 font-medium">Email</th><th className="px-6 py-3 font-medium">Role</th><th className="px-6 py-3 font-medium">Team</th><th className="px-6 py-3 font-medium">Status</th><th className="px-6 py-3 font-medium">Actions</th></tr></thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((u: any) => (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{u.name}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{u.email}</td>
                      <td className="px-6 py-4">
                        <select value={u.role} onChange={(e) => handleUserRoleChange(u.id, e.target.value)} className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300" aria-label={`Role for ${u.name}`}>
                          <option value="admin">Admin</option><option value="manager">Manager</option><option value="rep">Rep</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{u.team_name || "\u2014"}</td>
                      <td className="px-6 py-4"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.is_active ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"}`}>{u.is_active ? "Active" : "Suspended"}</span></td>
                      <td className="px-6 py-4">
                        <button onClick={() => handleUserSuspend(u.id, !!u.is_active)} className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${u.is_active ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30" : "text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30"}`} aria-label={u.is_active ? `Suspend ${u.name}` : `Activate ${u.name}`}>{u.is_active ? "Suspend" : "Activate"}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "teams" && (
        <div className="space-y-4">
          {teams.length === 0 ? <div className="rounded-xl border border-gray-200 bg-white px-6 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">No teams</div> : (
            teams.map((team: any) => (
              <div key={team.id} className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700"><h3 className="text-lg font-semibold text-gray-900 dark:text-white">{team.name}</h3>{team.description && <p className="text-sm text-gray-500">{team.description}</p>}</div>
                <div className="px-6 py-4"><p className="text-sm text-gray-500">Members: {users.filter((u: any) => u.team_id === team.id).length}</p></div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "activity" && (
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700"><h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Log</h3></div>
          {activity.length === 0 ? <div className="px-6 py-8 text-center text-sm text-gray-500">No activity</div> : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {activity.map((event: any, i: number) => (
                <div key={i} className="flex items-start gap-3 px-6 py-3">
                  <div className="mt-0.5" aria-hidden="true">{event.event_type === "login" ? "\uD83D\uDD11" : event.event_type === "coaching_started" ? "\uD83C\uDFAF" : event.event_type === "report_exported" ? "\uD83D\uDCC4" : "\uD83D\uDCCC"}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white"><span className="font-medium">{event.user_name || "System"}</span> &mdash; <span className="text-gray-500 dark:text-gray-400 capitalize">{event.event_type.replace(/_/g, " ")}</span></p>
                    <p className="text-xs text-gray-400">{event.created_at ? new Date(event.created_at + "Z").toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "billing" && (
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700"><h3 className="text-lg font-semibold text-gray-900 dark:text-white">Billing Information</h3></div>
          <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">
            <div><p className="text-sm text-gray-500">Current Plan</p><p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white capitalize">{org.tier}</p></div>
            <div><p className="text-sm text-gray-500">Monthly Price</p><p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">${org.tier === "enterprise" ? "199" : org.tier === "pro" ? "79" : "29"}/mo</p></div>
            <div><p className="text-sm text-gray-500">Users</p><p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{org.user_count || 0}</p></div>
            <div><p className="text-sm text-gray-500">Status</p><span className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-medium ${org.is_active ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"}`}>{org.is_active ? "Active" : "Suspended"}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}