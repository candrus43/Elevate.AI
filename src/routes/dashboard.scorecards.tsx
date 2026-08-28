import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { UserSession } from "~/utils/auth";

import { Badge, Button, Card, Input } from "~/components/ui";

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
          <h1 className="text-2xl font-bold text-ink">Scorecards</h1>
          <p className="text-sm text-ink-muted">{scorecards.length} scorecard{scorecards.length !== 1 ? "s" : ""}</p>
        </div>
        {!editing && (
          <Button onClick={startCreate} leftIcon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }>
            New Scorecard
          </Button>
        )}
      </div>

      {/* Create/Edit Form */}
      {editing && (
        <Card className="animate-fade-up space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">
              {editing === "new" ? "Create Scorecard" : "Edit Scorecard"}
            </h2>
            <Button variant="ghost" size="sm" onClick={cancelEdit}>Cancel</Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Name *</label>
              <Input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. Standard Sales Scorecard"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Description</label>
              <Input
                type="text"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Brief description of this scorecard"
              />
            </div>
          </div>

          {/* Criteria Builder */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-ink">Scoring Criteria</h3>
              <button onClick={addCriteria} className="text-xs text-accent-fg hover:text-accent-400 flex items-center gap-1">
                <span>+</span> Add Criterion
              </button>
            </div>

            {editCriteria.length === 0 ? (
              <div className="rounded-xl border border-dashed border-edge p-6 text-center">
                <p className="text-sm text-ink-faint">No criteria yet. Click "Add Criterion" to create one.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {editCriteria.map((c, i) => (
                  <div key={c.id} className="rounded-xl bg-panel-raised border border-edge p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-ink-faint mb-1">Name</label>
                        <Input
                          type="text"
                          value={c.name}
                          onChange={(e) => updateCriteria(i, "name", e.target.value)}
                          placeholder="e.g. Greeting, Discovery..."
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-ink-faint mb-1">Max Score</label>
                        <Input
                          type="number"
                          value={c.max_score}
                          onChange={(e) => updateCriteria(i, "max_score", e.target.value)}
                          min="1" max="100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-ink-faint mb-1">Weight</label>
                        <Input
                          type="number"
                          value={c.weight}
                          onChange={(e) => updateCriteria(i, "weight", e.target.value)}
                          step="0.1" min="0.1" max="10"
                        />
                      </div>
                      <div className="flex items-end gap-1">
                        <div className="flex-1">
                          <label className="block text-[10px] text-ink-faint mb-1">Category</label>
                          <select
                            value={c.category}
                            onChange={(e) => updateCriteria(i, "category", e.target.value)}
                            className="w-full h-10 rounded-lg border border-edge bg-panel px-3 text-sm text-ink focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-focus/40"
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

                <div className="flex items-center justify-between text-xs text-ink-faint pt-2">
                  <span>{editCriteria.length} criteria</span>
                  <span>Total weight: <span className={totalWeight.toFixed(1) === "1.0" ? "text-emerald-400" : "text-amber-400"}>{totalWeight.toFixed(1)}</span></span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={cancelEdit}>Cancel</Button>
            <Button
              onClick={saveScorecard}
              disabled={!editName.trim() || saving}
              loading={saving}
            >
              {editing === "new" ? "Create Scorecard" : "Save Changes"}
            </Button>
          </div>
        </Card>
      )}

      {/* Scorecards List */}
      {scorecards.length === 0 && !editing ? (
        <Card className="p-12 text-center">
          <span className="text-4xl">📋</span>
          <h3 className="mt-4 text-lg font-medium text-ink">No scorecards yet</h3>
          <p className="mt-1 text-sm text-ink-muted">Create your first scorecard to start evaluating calls.</p>
          <Button onClick={startCreate} className="mt-4">Create Scorecard</Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {scorecards.map((sc, i) => (
            <Card key={sc.id} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-ink">{sc.name}</h3>
                    {sc.is_default ? (
                      <Badge tone="accent">Default</Badge>
                    ) : null}
                  </div>
                  {sc.description && (
                    <p className="mt-1 text-sm text-ink-muted">{sc.description}</p>
                  )}
                  <p className="mt-1 text-xs text-ink-faint">{sc.criteria_count} criteria</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(sc)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteScorecard(sc.id)}
                    disabled={deleting === sc.id}
                    className="text-red-400 hover:text-red-300"
                  >
                    {deleting === sc.id ? "..." : "Delete"}
                  </Button>
                </div>
              </div>

              {/* Criteria Preview */}
              {sc.criteria && sc.criteria.length > 0 && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {sc.criteria.map((c) => (
                    <div key={c.id} className="rounded-lg bg-panel-raised border border-edge px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-ink-muted">{c.name}</span>
                        <span className="text-[10px] text-ink-faint">{c.max_score}pts</span>
                      </div>
                      {c.category && (
                        <span className="text-[10px] text-ink-faint">{c.category}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
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
          <div className="h-7 w-28 rounded-lg bg-panel-raised animate-pulse" />
          <div className="h-4 w-20 rounded-lg bg-panel-raised animate-pulse" />
        </div>
        <div className="h-9 w-32 rounded-xl bg-panel-raised animate-pulse" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-edge bg-panel p-5 space-y-3">
          <div className="h-5 w-40 rounded bg-panel-raised animate-pulse" />
          <div className="h-3 w-24 rounded bg-panel-raised animate-pulse" />
          <div className="flex gap-2">
            <div className="h-12 w-24 rounded-lg bg-panel-raised animate-pulse" />
            <div className="h-12 w-24 rounded-lg bg-panel-raised animate-pulse" />
            <div className="h-12 w-24 rounded-lg bg-panel-raised animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
