import { LoadingSkeleton } from '~/components/GlassCard';
import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { db } from "~/utils/db";
import { sql } from "~/utils/sql";

export const Route = createFileRoute("/admin/feature-flags")({
  component: AdminFeatureFlags,
});

interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  description: string;
  enabled: boolean;
  category: string;
  scope: "global" | "org";
  company_id: string | null;
  company_name?: string;
  created_at: string;
}

function AdminFeatureFlags() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [notification, setNotification] = useState<{ type: string; message: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterScope, setFilterScope] = useState("all");
  const [saving, setSaving] = useState(false);

  const [formName, setFormName] = useState("");
  const [formKey, setFormKey] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("general");
  const [formEnabled, setFormEnabled] = useState(false);
  const [formScope, setFormScope] = useState<"global" | "org">("global");
  const [formCompanyId, setFormCompanyId] = useState("");

  // Since there's no feature_flags table, we'll use the companies settings JSON as a proxy
  // and store flags in-memory with DB persistence via a simple JSON-backed approach
  // For a real implementation, we'd create a feature_flags table

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(async ({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      if (user.role !== "admin") { navigate({ to: "/dashboard" }); return; }
      setUser(user);
      await loadFlags();
      setLoading(false);
    });
  }, [navigate]);

  async function loadFlags() {
    try {
      // Load global flags from config table
      const configFlags = await db(sql`SELECT * FROM config WHERE key LIKE 'feature_flag_%' ORDER BY key`);
      const orgs = await db(sql`SELECT id, name FROM companies ORDER BY name`);

      const parsedFlags: FeatureFlag[] = configFlags.map((row: any) => ({
        id: row.key,
        name: row.key.replace("feature_flag_", "").replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
        key: row.key,
        description: row.value ? JSON.parse(row.value).description || "" : "",
        enabled: row.value ? JSON.parse(row.value).enabled : false,
        category: row.value ? JSON.parse(row.value).category || "general" : "general",
        scope: "global" as const,
        company_id: null,
        created_at: "",
      }));

      // Also check org-level settings for org-specific flags
      const orgFlags: FeatureFlag[] = [];
      for (const org of orgs) {
        try {
          const settings = await db(sql`SELECT settings FROM companies WHERE id = ${org.id}`);
          if (settings.length > 0 && settings[0].settings) {
            const s = JSON.parse(settings[0].settings);
            if (s.feature_flags) {
              for (const [key, val] of Object.entries(s.feature_flags)) {
                orgFlags.push({
                  id: `${org.id}_${key}`,
                  name: key.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
                  key,
                  description: typeof val === "object" ? (val as any).description || "" : "",
                  enabled: typeof val === "object" ? (val as any).enabled : !!val,
                  category: "org-specific",
                  scope: "org",
                  company_id: org.id,
                  company_name: org.name,
                  created_at: "",
                });
              }
            }
          }
        } catch {}
      }

      setFlags([...parsedFlags, ...orgFlags]);
      setOrganizations(orgs);
    } catch (e) { console.error("Failed to load flags", e); }
  }

  async function toggleFlag(flag: FeatureFlag) {
    try {
      if (flag.scope === "global") {
        const current = await db(sql`SELECT value FROM config WHERE key = ${flag.key}`);
        const val = current.length > 0 ? JSON.parse(current[0].value) : { enabled: false, description: "", category: "general" };
        val.enabled = !val.enabled;
        if (current.length > 0) {
          await db(sql`UPDATE config SET value = ${JSON.stringify(val)} WHERE key = ${flag.key}`);
        } else {
          await db(sql`INSERT INTO config (key, value) VALUES (${flag.key}, ${JSON.stringify(val)})`);
        }
      } else {
        // Org-level flag - store in company settings
        const org = await db(sql`SELECT settings FROM companies WHERE id = ${flag.company_id}`);
        if (org.length > 0) {
          const settings = JSON.parse(org[0].settings || "{}");
          if (!settings.feature_flags) settings.feature_flags = {};
          settings.feature_flags[flag.key] = { enabled: !flag.enabled, description: flag.description };
          await db(sql`UPDATE companies SET settings = ${JSON.stringify(settings)} WHERE id = ${flag.company_id}`);
        }
      }
      setNotification({ type: "success", message: `${flag.name} ${flag.enabled ? "disabled" : "enabled"}` });
      await loadFlags();
    } catch (e: any) { setNotification({ type: "error", message: e.message || "Failed" }); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const key = `feature_flag_${formKey}`;
      const val = JSON.stringify({ enabled: formEnabled, description: formDescription, category: formCategory });

      if (formScope === "global") {
        await db(sql`INSERT INTO config (key, value) VALUES (${key}, ${val})`);
      } else {
        // Org-level: store in company settings
        const org = await db(sql`SELECT settings FROM companies WHERE id = ${formCompanyId}`);
        if (org.length > 0) {
          const settings = JSON.parse(org[0].settings || "{}");
          if (!settings.feature_flags) settings.feature_flags = {};
          settings.feature_flags[formKey] = { enabled: formEnabled, description: formDescription };
          await db(sql`UPDATE companies SET settings = ${JSON.stringify(settings)} WHERE id = ${formCompanyId}`);
        }
      }
      setNotification({ type: "success", message: "Feature flag created" });
      setShowCreateModal(false);
      resetForm();
      await loadFlags();
    } catch (e: any) { setNotification({ type: "error", message: e.message || "Failed" }); }
    setSaving(false);
  }

  function resetForm() {
    setFormName(""); setFormKey(""); setFormDescription(""); setFormCategory("general");
    setFormEnabled(false); setFormScope("global"); setFormCompanyId("");
  }

  const categories = [...new Set(flags.map((f) => f.category))];

  const filtered = flags.filter((f) => {
    const mCat = filterCategory === "all" || f.category === filterCategory;
    const mScope = filterScope === "all" || f.scope === filterScope;
    return mCat && mScope;
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Feature Flags</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Toggle platform features globally or per-organization</p>
        </div>
        <button onClick={() => { resetForm(); setShowCreateModal(true); }} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500">
          <span>+</span> New Flag
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
          <option value="all">All Categories</option>
          {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <select value={filterScope} onChange={(e) => setFilterScope(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
          <option value="all">All Scopes</option>
          <option value="global">Global</option>
          <option value="org">Per-Organization</option>
        </select>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 dark:border-gray-700">
                <th className="px-6 py-3 font-medium">Flag</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Scope</th>
                <th className="px-6 py-3 font-medium">Organization</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">No feature flags found</td></tr>
              ) : filtered.map((flag) => (
                <tr key={flag.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 dark:text-white">{flag.name}</p>
                    {flag.description && <p className="text-xs text-gray-500">{flag.description}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300 capitalize">{flag.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${flag.scope === "global" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" : "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"}`}>
                      {flag.scope === "global" ? "Global" : "Org"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{flag.company_name || "\u2014"}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${flag.enabled ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${flag.enabled ? "bg-green-500" : "bg-gray-400"}`} />
                      {flag.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleFlag(flag)} className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${flag.enabled ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30" : "text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30"}`}>
                      {flag.enabled ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Flag Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Feature Flag</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-2xl text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Name *</label>
                  <input type="text" required value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="AI Coaching" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Key *</label>
                  <input type="text" required value={formKey} onChange={(e) => setFormKey(e.target.value.replace(/[^a-z0-9_]/g, "_"))} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="ai_coaching" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={2} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="Enable AI-powered coaching features" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                  <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                    <option value="general">General</option>
                    <option value="ai">AI</option>
                    <option value="analytics">Analytics</option>
                    <option value="integrations">Integrations</option>
                    <option value="security">Security</option>
                    <option value="beta">Beta</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Scope</label>
                  <select value={formScope} onChange={(e) => setFormScope(e.target.value as "global" | "org")} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                    <option value="global">Global</option>
                    <option value="org">Per-Organization</option>
                  </select>
                </div>
              </div>
              {formScope === "org" && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Organization *</label>
                  <select required value={formCompanyId} onChange={(e) => setFormCompanyId(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                    <option value="">Select organization...</option>
                    {organizations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}
                  </select>
                </div>
              )}
              <div className="flex items-center gap-3">
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" checked={formEnabled} onChange={(e) => setFormEnabled(e.target.checked)} className="peer sr-only" />
                  <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-indigo-600 peer-checked:after:translate-x-full dark:bg-gray-700" />
                </label>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable by default</span>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
                <button type="button" onClick={() => setShowCreateModal(false)} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">{saving ? "Saving..." : "Create Flag"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}