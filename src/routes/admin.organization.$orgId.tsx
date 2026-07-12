import { useEffect, useState } from "react";
import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/organization/$orgId")({
  component: AdminOrganizationDetail,
});

function AdminOrganizationDetail() {
  const { orgId } = useParams({ from: Route.id });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [usage, setUsage] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const session = await fetch("/api/session").then(r => r.json());
        if (!session.user) { navigate({ to: "/login" }); return; }
        const [orgRes, usersRes, usageRes] = await Promise.all([
          fetch(`/api/admin/companies/${orgId}`).then(r => r.json()),
          fetch(`/api/admin/companies/${orgId}/users`).then(r => r.json()),
          fetch(`/api/admin/companies/${orgId}/usage`).then(r => r.json()),
        ]);
        setOrg(orgRes.company || orgRes);
        setUsers(usersRes.users || []);
        setUsage(usageRes);
      } catch (e) {
        setError("Failed to load organization details");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [orgId]);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full" /></div>;
  if (error) return <div className="p-8 text-center text-red-400">{error}</div>;
  if (!org) return <div className="p-8 text-center text-gray-400">Organization not found</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate({ to: "/admin/organizations" })} className="text-sm text-purple-400 hover:text-purple-300 mb-2">&larr; Back to Organizations</button>
          <h1 className="text-3xl font-bold text-white">{org.name}</h1>
          <p className="text-gray-400 mt-1">{org.slug} &middot; {org.tier} plan</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${org.status === "active" ? "bg-green-500/20 text-green-400" : org.status === "suspended" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>
          {org.status || "active"}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4"><p className="text-sm text-gray-400">Users</p><p className="text-2xl font-bold text-white">{users.length}</p></div>
        <div className="glass-card rounded-xl p-4"><p className="text-sm text-gray-400">Calls This Month</p><p className="text-2xl font-bold text-white">{usage?.calls_analyzed || 0}</p></div>
        <div className="glass-card rounded-xl p-4"><p className="text-sm text-gray-400">Avg Score</p><p className="text-2xl font-bold text-white">{usage?.avg_score || "—"}</p></div>
        <div className="glass-card rounded-xl p-4"><p className="text-sm text-gray-400">Storage</p><p className="text-2xl font-bold text-white">{usage?.storage_mb || 0}MB</p></div>
      </div>

      {/* Users Table */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Team Members ({users.length})</h2>
        {users.length === 0 ? (
          <p className="text-gray-400 text-sm">No users in this organization</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-gray-400 border-b border-white/5">
                <th className="text-left py-2 px-3">Name</th><th className="text-left py-2 px-3">Email</th>
                <th className="text-left py-2 px-3">Role</th><th className="text-left py-2 px-3">Status</th>
                <th className="text-right py-2 px-3">Actions</th>
              </tr></thead>
              <tbody>{users.map((u: any) => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="py-2 px-3 text-white">{u.name}</td>
                  <td className="py-2 px-3 text-gray-300">{u.email}</td>
                  <td className="py-2 px-3"><span className="capitalize text-gray-300">{u.role}</span></td>
                  <td className="py-2 px-3"><span className={`text-xs ${u.status === "active" ? "text-green-400" : "text-red-400"}`}>{u.status || "active"}</span></td>
                  <td className="py-2 px-3 text-right">
                    <button className="text-xs text-purple-400 hover:text-purple-300 mr-2">Edit</button>
                    <button className="text-xs text-red-400 hover:text-red-300">Suspend</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
