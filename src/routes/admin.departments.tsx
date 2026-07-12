import { LoadingSkeleton } from '~/components/GlassCard';
import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { db } from "~/utils/db";
import { sql } from "~/utils/sql";

export const Route = createFileRoute("/admin/departments")({
  component: AdminDepartments,
});

function AdminDepartments() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [notification, setNotification] = useState<{ type: string; message: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCompanyId, setFormCompanyId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(async ({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      if (user.role !== "admin") { navigate({ to: "/dashboard" }); return; }
      setUser(user);
      await loadData();
      setLoading(false);
    });
  }, [navigate]);

  async function loadData() {
    try {
      // Since there's no departments table, we'll use teams as departments
      const [teams, orgs] = await Promise.all([
        db(sql`
          SELECT t.id, t.name, t.description, t.company_id, t.created_at,
            c.name as company_name,
            (SELECT COUNT(*) FROM users WHERE team_id = t.id) as member_count
          FROM teams t
          JOIN companies c ON c.id = t.company_id
          ORDER BY c.name, t.name
        `),
        db(sql`SELECT id, name FROM companies ORDER BY name`),
      ]);
      setDepartments(teams);
      setOrganizations(orgs);
    } catch (e) { console.error("Failed to load data", e); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const id = crypto.randomUUID();
      await db(sql`INSERT INTO teams (id, company_id, name, description) VALUES (${id}, ${formCompanyId}, ${formName}, ${formDescription || ""})`);
      setNotification({ type: "success", message: "Department created" });
      setShowCreateModal(false);
      resetForm();
      await loadData();
    } catch (e: any) { setNotification({ type: "error", message: e.message || "Failed" }); }
    setSaving(false);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingDept) return;
    setSaving(true);
    try {
      await db(sql`UPDATE teams SET name = ${formName}, description = ${formDescription || ""}, updated_at = datetime('now') WHERE id = ${editingDept.id}`);
      setNotification({ type: "success", message: "Department updated" });
      setEditingDept(null);
      resetForm();
      await loadData();
    } catch (e: any) { setNotification({ type: "error", message: e.message || "Failed" }); }
    setSaving(false);
  }

  async function handleDelete(deptId: string) {
    if (!confirm("Are you sure you want to delete this department?")) return;
    try {
      await db(sql`DELETE FROM teams WHERE id = ${deptId}`);
      setNotification({ type: "success", message: "Department deleted" });
      await loadData();
    } catch (e: any) { setNotification({ type: "error", message: e.message || "Failed" }); }
  }

  function resetForm() { setFormName(""); setFormDescription(""); setFormCompanyId(""); }

  function openEdit(dept: any) {
    setEditingDept(dept);
    setFormName(dept.name);
    setFormDescription(dept.description || "");
    setFormCompanyId(dept.company_id);
  }

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Departments</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage teams and departments across organizations</p>
        </div>
        <button onClick={() => { resetForm(); setShowCreateModal(true); }} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500">
          <span>+</span> Create Department
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {departments.length === 0 ? (
          <div className="col-span-full rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
            No departments found. Create your first department!
          </div>
        ) : departments.map((dept) => (
          <div key={dept.id} className="rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{dept.name}</h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{dept.company_name}</p>
              </div>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                {dept.member_count || 0} members
              </span>
            </div>
            {dept.description && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{dept.description}</p>
            )}
            <div className="mt-4 flex items-center gap-2">
              <button onClick={() => openEdit(dept)} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30">Edit</button>
              <button onClick={() => handleDelete(dept.id)} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingDept) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{editingDept ? "Edit Department" : "Create Department"}</h3>
              <button onClick={() => { setShowCreateModal(false); setEditingDept(null); }} className="text-2xl text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <form onSubmit={editingDept ? handleUpdate : handleCreate} className="p-6 space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Name *</label>
                <input type="text" required value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="Sales Team" />
              </div>
              {!editingDept && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Organization *</label>
                  <select required value={formCompanyId} onChange={(e) => setFormCompanyId(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                    <option value="">Select organization...</option>
                    {organizations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={3} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="Department description..." />
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
                <button type="button" onClick={() => { setShowCreateModal(false); setEditingDept(null); }} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">{saving ? "Saving..." : editingDept ? "Update" : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}