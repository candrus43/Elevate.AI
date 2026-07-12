import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { UserSession } from "~/utils/auth";

export const Route = createFileRoute("/dashboard/scorecards")({
  component: ScorecardsPage,
});

interface Criterion {
  id: string;
  name: string;
  max_score: number;
  weight: number;
  category: string;
  sort_order: number;
}

interface Scorecard {
  id: string;
  name: string;
  description: string;
  is_default: number;
  criteria_count: number;
  criteria: Criterion[];
}

function ScorecardsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserSession | null>(null);
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null); // scorecard id or "new"
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editCriteria, setEditCriteria] = useState<Criterion[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then(({ user }) => {
        if (!user) { navigate({ to: "/login" }); return; }
        setUser(user);
        loadScorecards();
      })
      .catch(() => navigate({ to: "/login" }));
  }, [navigate]);

  const loadScorecards = async () => {
    try {
      const res = await fetch("/api/scorecards");
      const data = await res.json();
      setScorecards(data.scorecards || []);
    } catch (e) {
      console.error("Failed to load scorecards", e);
    }
    setLoading(false);
  };

  const startCreate = () => {
    setEditing("new");
    setEditName("");
    setEditDesc("");
    setEditCriteria([]);
  };

  const startEdit = (sc: Scorecard) => {
    setEditing(sc.id);
    setEditName(sc.name);
    setEditDesc(sc.description || "");
    setEditCriteria(sc.criteria || []);
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditName("");
    setEditDesc("");
    setEditCriteria([]);
  };

  const saveScorecard = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      if (editing === "new") {
        const res = await fetch("/api/scorecards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: editName.trim(), description: editDesc.trim() }),
        });
        const data = await res.json();
        if (data.success) {
          // Save all criteria
          for (let i = 0; i < editCriteria.length; i++) {
            const c = editCriteria[i];
            await fetch(`/api/scorecards/${data.scorecard.id}/criteria`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: c.name, max_score: c.max_score, weight: c.weight, category: c.category, sort_order: i }),
            });
          }
        }
      } else {
        await fetch(`/api/scorecards/${editing}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: editName.trim(), description: editDesc.trim() }),
        });
        // Sync criteria: delete all and re-insert
        for (const c of editCriteria) {
          if (c.id.startsWith("new_")) {
            await fetch(`/api/scorecards/${editing}/criteria`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: c.name, max_score: c.max_score, weight: c.weight, category: c.category, sort_order: c.sort_order }),
            });
          } else {
            await fetch(`/api/scorecards/${editing}/criteria/${c.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: c.name, max_score: c.max_score, weight: c.weight, category: c.category, sort_order: c.sort_order }),
            });
          }
        }
      }
      await loadScorecards();
      cancelEdit();
    } catch (e) {
      console.error("Save error:", e);
    }
    setSaving(false);
  };

  const deleteScorecard = async (id: string) => {
    setDeleting(id);
    try {
      await fetch(`/api/scorecards/${id}`, { method: "DELETE" });
      await loadScorecards();
    } catch (e) {
      console.error("Delete error:", e);
    }
    setDeleting(null);
  };

  const addCriteria = () => {
    setEditCriteria([...editCriteria, { id: "new_" + Date.now(), name: "", max_score: 10, weight: 1.0, category: "", sort_order: editCriteria.length }]);
  };

  const updateCriteria = (index: number, field: keyof Criterion, value: any) => {
    const updated = [...editCriteria];
    (updated[index] as any)[field] = field === "max_score" || field === "weight" || field === "sort_order" ? Number(value) : value;
    setEditCriteria(updated);
  };

  const removeCriteria = (index: number) => {
    setEditCriteria(editCriteria.filter((_, i) => i !== index));
  };

  const totalWeight = editCriteria.reduce((s, c) => s + c.weight, 0);

  if (loading) return <ScorecardsSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Scorecards</h1>
          <p className="text-sm text-gray-400">{scorecards.length} scorecard{scorecards.length !== 1 ? "s" : ""}</p>
        </div>
        {!editing && (
          <button onClick={startCreate} className="btn-primary flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Scorecard
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {editing && (
        <div className="glass-card rounded-xl p-6 animate-fade-up space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              {editing === "new" ? "Create Scorecard" : "Edit Scorecard"}
            </h2>
            <button onClick={cancelEdit} className="text-sm text-gray-400 hover:text-white">Cancel</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Name *</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. Standard Sales Scorecard"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
              <input
                type="text"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Brief description of this scorecard"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
              />
            </div>
          </div>

          {/* Criteria Builder */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Scoring Criteria</h3>
              <button onClick={addCriteria} className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                <span>+</span> Add Criterion
              </button>
            </div>

            {editCriteria.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
                <p className="text-sm text-gray-500">No criteria yet. Click "Add Criterion" to create one.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {editCriteria.map((c, i) => (
                  <div key={c.id} className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-gray-500 mb-1">Name</label>
                        <input
                          type="text"
                          value={c.name}
                          onChange={(e) => updateCriteria(i, "name", e.target.value)}
                          placeholder="e.g. Greeting, Discovery..."
                          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-1">Max Score</label>
                        <input
                          type="number"
                          value={c.max_score}
                          onChange={(e) => updateCriteria(i, "max_score", e.target.value)}
                          min="1" max="100"
                          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-purple-500/50 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-1">Weight</label>
                        <input
                          type="number"
                          value={c.weight}
                          onChange={(e) => updateCriteria(i, "weight", e.target.value)}
                          step="0.1" min="0.1" max="10"
                          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-purple-500/50 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-end gap-1">
                        <div className="flex-1">
                          <label className="block text-[10px] text-gray-500 mb-1">Category</label>
                          <select
                            value={c.category}
                            onChange={(e) => updateCriteria(i, "category", e.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-purple-500/50 focus:outline-none"
                          >
                            <option value="">General</option>
                            <option value="Opening">Opening</option>
                            <option value="Discovery">Discovery</option>
                            <option value="Skills">Skills</option>
                            <option value="Messaging">Messaging</option>
                            <option value="Structure">Structure</option>
                            <option value="Compliance">Compliance</option>
                            <option value="Soft Skills">Soft Skills</option>
                          </select>
                        </div>
                        <button
                          onClick={() => removeCriteria(i)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Remove criterion"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
                  <span>{editCriteria.length} criteria</span>
                  <span>Total weight: <span className={totalWeight.toFixed(1) === "1.0" ? "text-emerald-400" : "text-amber-400"}>{totalWeight.toFixed(1)}</span></span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={cancelEdit} className="btn-ghost text-gray-400">Cancel</button>
            <button
              onClick={saveScorecard}
              disabled={!editName.trim() || saving}
              className="btn-primary disabled:opacity-40"
            >
              {saving ? "Saving..." : editing === "new" ? "Create Scorecard" : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* Scorecards List */}
      {scorecards.length === 0 && !editing ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <span className="text-4xl">📋</span>
          <h3 className="mt-4 text-lg font-medium text-white">No scorecards yet</h3>
          <p className="mt-1 text-sm text-gray-400">Create your first scorecard to start evaluating calls.</p>
          <button onClick={startCreate} className="btn-primary mt-4">Create Scorecard</button>
        </div>
      ) : (
        <div className="space-y-4">
          {scorecards.map((sc, i) => (
            <div key={sc.id} className="glass-card rounded-xl p-5 animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-white">{sc.name}</h3>
                    {sc.is_default ? (
                      <span className="rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 text-[10px] font-medium">Default</span>
                    ) : null}
                  </div>
                  {sc.description && (
                    <p className="mt-1 text-sm text-gray-400">{sc.description}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">{sc.criteria_count} criteria</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => startEdit(sc)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-purple-400 hover:bg-purple-500/10 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteScorecard(sc.id)}
                    disabled={deleting === sc.id}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                  >
                    {deleting === sc.id ? "..." : "Delete"}
                  </button>
                </div>
              </div>

              {/* Criteria Preview */}
              {sc.criteria && sc.criteria.length > 0 && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {sc.criteria.map((c) => (
                    <div key={c.id} className="rounded-lg bg-white/5 border border-white/5 px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-300">{c.name}</span>
                        <span className="text-[10px] text-gray-500">{c.max_score}pts</span>
                      </div>
                      {c.category && (
                        <span className="text-[10px] text-gray-600">{c.category}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScorecardsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-28 rounded-lg bg-white/5 animate-pulse" />
          <div className="h-4 w-20 rounded-lg bg-white/5 animate-pulse" />
        </div>
        <div className="h-9 w-32 rounded-xl bg-white/5 animate-pulse" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass-card rounded-xl p-5 space-y-3">
          <div className="h-5 w-40 rounded bg-white/5 animate-pulse" />
          <div className="h-3 w-24 rounded bg-white/5 animate-pulse" />
          <div className="flex gap-2">
            <div className="h-12 w-24 rounded-lg bg-white/5 animate-pulse" />
            <div className="h-12 w-24 rounded-lg bg-white/5 animate-pulse" />
            <div className="h-12 w-24 rounded-lg bg-white/5 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}