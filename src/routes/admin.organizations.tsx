import { LoadingSkeleton } from '~/components/GlassCard';
import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { db } from "~/utils/db";
import { sql } from "~/utils/sql";

export const Route = createFileRoute("/admin/organizations")({
  component: AdminOrganizations,
});

function AdminOrganizations() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editOrg, setEditOrg] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formTier, setFormTier] = useState("core");
  const [formActive, setFormActive] = useState(true);
  const [formColor, setFormColor] = useState("#6366f1");
  const [formLogoUrl, setFormLogoUrl] = useState("");
  const [formCustomDomain, setFormCustomDomain] = useState("");
  const [formCallLimit, setFormCallLimit] = useState("1000");
  const [formUserLimit, setFormUserLimit] = useState("10");
  const [formStorageLimit, setFormStorageLimit] = useState("5");

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(async ({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      if (user.role !== "admin") { navigate({ to: "/dashboard" }); return; }
      setUser(user);
      await loadOrganizations();
      setLoading(false);
    });
  }, [navigate]);

  async function loadOrganizations() {
    try {
      const data = await db(sql`
        SELECT c.id, c.name, c.slug, c.tier, c.is_active, c.settings, c.created_at, c.updated_at,
          (SELECT COUNT(*) FROM users WHERE company_id = c.id) as user_count,
          (SELECT COUNT(*) FROM calls WHERE company_id = c.id) as call_count
        FROM companies c ORDER BY c.created_at DESC
      `);
      setOrganizations(data);
    } catch (e) { console.error("Failed to load orgs", e); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const id = crypto.randomUUID();
      const settings = JSON.stringify({
        primary_color: formColor, logo_url: formLogoUrl, custom_domain: formCustomDomain,
        call_limit: parseInt(formCallLimit) || 1000, user_limit: parseInt(formUserLimit) || 10,
        storage_limit: parseInt(formStorageLimit) || 5,
      });
      await db(sql`INSERT INTO companies (id, name, slug, tier, is_active, settings) VALUES (${id}, ${formName}, ${formSlug}, ${formTier}, ${formActive ? 1 : 0}, ${settings})`);
      setNotification({ type: "success", message: "Organization created successfully" });
      setShowCreateModal(false);
      resetForm();
      await loadOrganizations();
    } catch (e: any) { setNotification({ type: "error", message: e.message || "Failed" }); }
    setSaving(false);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editOrg) return;
    setSaving(true);
    try {
      const settings = JSON.stringify({
        primary_color: formColor, logo_url: formLogoUrl, custom_domain: formCustomDomain,
        call_limit: parseInt(formCallLimit) || 1000, user_limit: parseInt(formUserLimit) || 10,
        storage_limit: parseInt(formStorageLimit) || 5,
      });
      await db(sql`UPDATE companies SET name = ${formName}, slug = ${formSlug}, tier = ${formTier}, is_active = ${formActive ? 1 : 0}, settings = ${settings}, updated_at = datetime('now') WHERE id = ${editOrg.id}`);
      setNotification({ type: "success", message: "Organization updated" });
      setEditOrg(null);
      resetForm();
      await loadOrganizations();
    } catch (e: any) { setNotification({ type: "error", message: e.message || "Failed" }); }
    setSaving(false);
  }

  async function toggleStatus(org: any) {
    try {
      await db(sql`UPDATE companies SET is_active = ${org.is_active ? 0 : 1}, updated_at = datetime('now') WHERE id = ${org.id}`);
      setNotification({ type: "success", message: `${org.name} ${org.is_active ? "suspended" : "activated"}` });
      await loadOrganizations();
    } catch (e: any) { setNotification({ type: "error", message: e.message || "Failed" }); }
  }

  function openEdit(org: any) {
    setEditOrg(org);
    setFormName(org.name);
    setFormSlug(org.slug);
    setFormTier(org.tier);
    setFormActive(!!org.is_active);
    try {
      const s = JSON.parse(org.settings || "{}");
      setFormColor(s.primary_color || "#6366f1");
      setFormLogoUrl(s.logo_url || "");
      setFormCustomDomain(s.custom_domain || "");
      setFormCallLimit(String(s.call_limit || 1000));
      setFormUserLimit(String(s.user_limit || 10));
      setFormStorageLimit(String(s.storage_limit || 5));
    } catch { resetForm(); }
  }

  function resetForm() {
    setFormName(""); setFormSlug(""); setFormTier("core"); setFormActive(true);
    setFormColor("#6366f1"); setFormLogoUrl(""); setFormCustomDomain("");
    setFormCallLimit("1000"); setFormUserLimit("10"); setFormStorageLimit("5");
  }

  const filtered = organizations.filter((org) => {
    const mSearch = org.name.toLowerCase().includes(search.toLowerCase()) || org.slug.toLowerCase().includes(search.toLowerCase());
    const mTier = tierFilter === "all" || org.tier === tierFilter;
    const mStatus = statusFilter === "all" || (statusFilter === "active" && org.is_active) || (statusFilter === "suspended" && !org.is_active);
    return mSearch && mTier && mStatus;
  });

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  return (
    <div className="space-y-6">
      {notification && (
        <div className={`rounded-xl border px-4 py-3 text-sm flex items-center justify-between ${notification.type === "success" ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300" : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"}`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-2 text-lg leading-none hover:opacity-70">&times;</button>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Organizations</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage all companies on the platform</p>
        </div>
        <button onClick={() => { resetForm(); setShowCreateModal(true); }} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500">
          <span>+</span> Create Organization
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500" />
        </div>
        <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
          <option value="all">All Plans</option>
          <option value="core">Core</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 dark:border-gray-700">
                <th className="px-6 py-3 font-medium">Organization</th>
                <th className="px-6 py-3 font-medium">Plan</th>
                <th className="px-6 py-3 font-medium">Users</th>
                <th className="px-6 py-3 font-medium">Calls</th>
                <th className="px-6 py-3 font-medium">Created</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">No organizations found</td></tr>
              ) : filtered.map((org) => (
                <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4">
                    <a href={`/admin/organizations/${org.id}`} className="font-medium text-gray-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400">{org.name}</a>
                    <p className="text-xs text-gray-500">{org.slug}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${org.tier === "enterprise" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" : org.tier === "pro" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}>{org.tier}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{org.user_count || 0}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{org.call_count || 0}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{org.created_at ? new Date(org.created_at + "Z").toLocaleDateString() : "-"}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${org.is_active ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"}`}>{org.is_active ? "Active" : "Suspended"}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <a href={`/admin/organizations/${org.id}`} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30">View</a>
                      <button onClick={() => openEdit(org)} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">Edit</button>
                      <button onClick={() => toggleStatus(org)} className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${org.is_active ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30" : "text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30"}`}>{org.is_active ? "Suspend" : "Activate"}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editOrg) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{editOrg ? "Edit Organization" : "Create Organization"}</h3>
              <button onClick={() => { setShowCreateModal(false); setEditOrg(null); }} className="text-2xl text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <form onSubmit={editOrg ? handleUpdate : handleCreate} className="p-6 space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Name *</label>
                  <input type="text" required value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="Acme Corp" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Slug *</label>
                  <input type="text" required value={formSlug} onChange={(e) => setFormSlug(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="acme-corp" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Plan</label>
                  <select value={formTier} onChange={(e) => setFormTier(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                    <option value="core">Core ($29/mo)</option>
                    <option value="pro">Pro ($79/mo)</option>
                    <option value="enterprise">Enterprise ($199/mo)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                  <select value={formActive ? "active" : "suspended"} onChange={(e) => setFormActive(e.target.value === "active")} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
              <div>
                <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">White Labeling</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Primary Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={formColor} onChange={(e) => setFormColor(e.target.value)} className="h-9 w-9 cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700" />
                      <input type="text" value={formColor} onChange={(e) => setFormColor(e.target.value)} className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Logo URL</label>
                    <input type="url" value={formLogoUrl} onChange={(e) => setFormLogoUrl(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="https://logo.png" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Custom Domain</label>
                    <input type="text" value={formCustomDomain} onChange={(e) => setFormCustomDomain(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="acme.elevateai.com" />
                  </div>
                </div>
              </div>
              <div>
                <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Usage Limits</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Call Limit</label>
                    <input type="number" value={formCallLimit} onChange={(e) => setFormCallLimit(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white" min="0" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">User Limit</label>
                    <input type="number" value={formUserLimit} onChange={(e) => setFormUserLimit(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white" min="0" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Storage (GB)</label>
                    <input type="number" value={formStorageLimit} onChange={(e) => setFormStorageLimit(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white" min="0" />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
                <button type="button" onClick={() => { setShowCreateModal(false); setEditOrg(null); }} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">{saving ? "Saving..." : editOrg ? "Update" : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}