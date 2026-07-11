import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { UserSession } from "~/utils/auth";

export const Route = createFileRoute("/dashboard/compliance")({
  component: CompliancePage,
});

interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  script_required_phrases: string[];
  prohibited_phrases: string[];
  is_active: number;
  created_at: string;
}

interface ComplianceCheck {
  id: string;
  call_id: string;
  rule_id: string;
  rule_name: string;
  rep_name: string;
  call_date: string;
  passed: number;
  details: string;
  created_at: string;
}

type View = "rules" | "checks";

function CompliancePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<View>("rules");

  // Rules state
  const [rules, setRules] = useState<ComplianceRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<ComplianceRule | null>(null);
  const [ruleForm, setRuleForm] = useState({ name: "", description: "", requiredPhrases: "", prohibitedPhrases: "" });
  const [ruleSaving, setRuleSaving] = useState(false);
  const [ruleError, setRuleError] = useState("");
  const [ruleSuccess, setRuleSuccess] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Checks state
  const [checks, setChecks] = useState<ComplianceCheck[]>([]);
  const [checksLoading, setChecksLoading] = useState(false);

  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then(({ user }) => {
        if (!user) { navigate({ to: "/login" }); return; }
        setUser(user);
        loadRules();
        setLoading(false);
      })
      .catch(() => navigate({ to: "/login" }));
  }, [navigate]);

  const loadRules = async () => {
    setRulesLoading(true);
    try {
      const res = await fetch("/api/compliance/rules");
      const data = await res.json();
      if (data.rules) setRules(data.rules);
    } catch {}
    setRulesLoading(false);
  };

  const loadChecks = async () => {
    setChecksLoading(true);
    try {
      const res = await fetch("/api/compliance/checks");
      const data = await res.json();
      if (data.checks) setChecks(data.checks);
    } catch {}
    setChecksLoading(false);
  };

  const openCreateRule = () => {
    setEditingRule(null);
    setRuleForm({ name: "", description: "", requiredPhrases: "", prohibitedPhrases: "" });
    setRuleError("");
    setRuleSuccess("");
    setShowRuleModal(true);
  };

  const openEditRule = (rule: ComplianceRule) => {
    setEditingRule(rule);
    setRuleForm({
      name: rule.name,
      description: rule.description || "",
      requiredPhrases: (rule.script_required_phrases || []).join(", "),
      prohibitedPhrases: (rule.prohibited_phrases || []).join(", "),
    });
    setRuleError("");
    setRuleSuccess("");
    setShowRuleModal(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setRuleError("");
    setRuleSuccess("");
    setRuleSaving(true);
    try {
      const body = {
        name: ruleForm.name,
        description: ruleForm.description,
        script_required_phrases: ruleForm.requiredPhrases.split(",").map((s) => s.trim()).filter(Boolean),
        prohibited_phrases: ruleForm.prohibitedPhrases.split(",").map((s) => s.trim()).filter(Boolean),
      };
      const url = editingRule ? `/api/compliance/rules/${editingRule.id}` : "/api/compliance/rules";
      const method = editingRule ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) {
        setRuleSuccess(editingRule ? "Rule updated" : "Rule created");
        loadRules();
        setTimeout(() => { setShowRuleModal(false); setRuleSuccess(""); }, 1500);
      } else {
        setRuleError(data.error || "Failed to save rule");
      }
    } catch { setRuleError("Connection error"); }
    setRuleSaving(false);
  };

  const handleToggleActive = async (rule: ComplianceRule) => {
    setTogglingId(rule.id);
    try {
      await fetch(`/api/compliance/rules/${rule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !rule.is_active }),
      });
      loadRules();
    } catch {}
    setTogglingId(null);
  };

  const handleDeleteRule = async (ruleId: string) => {
    setDeletingId(ruleId);
    try {
      await fetch(`/api/compliance/rules/${ruleId}`, { method: "DELETE" });
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
    } catch {}
    setDeletingId(null);
  };

  const switchView = (view: View) => {
    setActiveView(view);
    if (view === "checks" && checks.length === 0) loadChecks();
  };

  const canManage = user?.role === "admin" || user?.role === "manager";

  if (loading) return <ComplianceSkeleton />;

  const totalChecks = checks.length;
  const passedChecks = checks.filter((c) => c.passed).length;
  const activeRules = rules.filter((r) => r.is_active).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Compliance</h1>
          <p className="text-sm text-gray-400">
            {activeRules} active rule{activeRules !== 1 ? "s" : ""} · {totalChecks} check{totalChecks !== 1 ? "s" : ""}
          </p>
        </div>
        {canManage && activeView === "rules" && (
          <button onClick={openCreateRule} className="btn-primary">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Rule
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{rules.length}</p>
          <p className="text-xs text-gray-400 mt-1">Total Rules</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{activeRules}</p>
          <p className="text-xs text-gray-400 mt-1">Active Rules</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) + "%" : "—"}</p>
          <p className="text-xs text-gray-400 mt-1">Pass Rate</p>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 border-b border-white/10 pb-1">
        <button onClick={() => switchView("rules")}
          className={`flex items-center gap-2 rounded-t-xl px-4 py-2.5 text-sm font-medium transition-all ${activeView === "rules" ? "bg-white/5 text-white border-b-2 border-purple-500" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
          <span>📋</span> Rules
        </button>
        <button onClick={() => switchView("checks")}
          className={`flex items-center gap-2 rounded-t-xl px-4 py-2.5 text-sm font-medium transition-all ${activeView === "checks" ? "bg-white/5 text-white border-b-2 border-purple-500" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
          <span>✅</span> Compliance Checks
        </button>
      </div>

      {/* Rules View */}
      {activeView === "rules" && (
        <>
          {rulesLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => (
              <div key={i} className="glass-card rounded-xl p-5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-white/5 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-36 rounded bg-white/5 animate-pulse" />
                  <div className="h-3 w-56 rounded bg-white/5 animate-pulse" />
                </div>
                <div className="h-6 w-16 rounded-full bg-white/5 animate-pulse" />
              </div>
            ))}</div>
          ) : rules.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <span className="text-4xl">🛡️</span>
              <h3 className="mt-4 text-lg font-medium text-white">No compliance rules</h3>
              <p className="mt-1 text-sm text-gray-400">Create rules to ensure your team follows compliance requirements.</p>
              {canManage && (
                <button onClick={openCreateRule} className="btn-primary mt-4">Create Your First Rule</button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule, i) => (
                <div key={rule.id} className="glass-card rounded-xl p-4 sm:p-5 animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">{rule.name}</h3>
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium border ${rule.is_active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}>
                          {rule.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      {rule.description && <p className="text-xs text-gray-400 mt-1">{rule.description}</p>}
                      <div className="flex flex-wrap gap-3 mt-2">
                        {rule.script_required_phrases?.length > 0 && (
                          <span className="text-[10px] text-gray-500">📝 {rule.script_required_phrases.length} required phrase{rule.script_required_phrases.length !== 1 ? "s" : ""}</span>
                        )}
                        {rule.prohibited_phrases?.length > 0 && (
                          <span className="text-[10px] text-gray-500">🚫 {rule.prohibited_phrases.length} prohibited phrase{rule.prohibited_phrases.length !== 1 ? "s" : ""}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {canManage && (
                        <>
                          <button onClick={() => handleToggleActive(rule)} disabled={togglingId === rule.id}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-all ${rule.is_active ? "border-amber-500/20 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"}`}>
                            {togglingId === rule.id ? "..." : rule.is_active ? "Deactivate" : "Activate"}
                          </button>
                          <button onClick={() => openEditRule(rule)}
                            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-white/10 transition-all">
                            Edit
                          </button>
                          <button onClick={() => handleDeleteRule(rule.id)} disabled={deletingId === rule.id}
                            className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-40">
                            {deletingId === rule.id ? "..." : "Delete"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Compliance Checks View */}
      {activeView === "checks" && (
        <>
          {checksLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => (
              <div key={i} className="glass-card rounded-xl p-5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-white/5 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-36 rounded bg-white/5 animate-pulse" />
                  <div className="h-3 w-56 rounded bg-white/5 animate-pulse" />
                </div>
              </div>
            ))}</div>
          ) : checks.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <span className="text-4xl">✅</span>
              <h3 className="mt-4 text-lg font-medium text-white">No compliance checks yet</h3>
              <p className="mt-1 text-sm text-gray-400">Checks will appear here once calls are analyzed against compliance rules.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {checks.map((check, i) => (
                <div key={check.id} className="glass-card rounded-xl p-4 sm:p-5 animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${check.passed ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                      {check.passed ? "✓" : "✗"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white">{check.rule_name}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${check.passed ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                          {check.passed ? "Passed" : "Failed"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {check.rep_name} · {check.call_date ? new Date(check.call_date).toLocaleDateString() : "—"}
                      </p>
                      {check.details && <p className="text-xs text-gray-500 mt-1">{check.details}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Create/Edit Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRuleModal(false)} />
          <div className="relative w-full max-w-lg animate-fade-up">
            <div className="glass-card rounded-2xl p-6 sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">{editingRule ? "Edit Rule" : "New Compliance Rule"}</h2>
                  <p className="mt-1 text-sm text-gray-400">Define what your team must say and avoid</p>
                </div>
                <button onClick={() => setShowRuleModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {ruleError && (
                <div className="mb-4 rounded-lg bg-red-900/20 p-3 text-sm text-red-400 ring-1 ring-red-500/20">{ruleError}</div>
              )}
              {ruleSuccess && (
                <div className="mb-4 rounded-lg bg-emerald-900/20 p-3 text-sm text-emerald-400 ring-1 ring-emerald-500/20 flex items-center gap-2">
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {ruleSuccess}
                </div>
              )}

              <form onSubmit={handleSaveRule} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Rule Name</label>
                  <input type="text" value={ruleForm.name} onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                    placeholder="e.g., Required Opening Script"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                  <textarea value={ruleForm.description} onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                    placeholder="Optional description of this compliance rule"
                    rows={2}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Required Phrases</label>
                  <input type="text" value={ruleForm.requiredPhrases} onChange={(e) => setRuleForm({ ...ruleForm, requiredPhrases: e.target.value })}
                    placeholder="thank you for your time, i appreciate your business"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30" />
                  <p className="mt-1 text-[10px] text-gray-500">Separate multiple phrases with commas</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Prohibited Phrases</label>
                  <input type="text" value={ruleForm.prohibitedPhrases} onChange={(e) => setRuleForm({ ...ruleForm, prohibitedPhrases: e.target.value })}
                    placeholder="guaranteed results, 100% success"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30" />
                  <p className="mt-1 text-[10px] text-gray-500">Separate multiple phrases with commas</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowRuleModal(false)}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all">
                    Cancel
                  </button>
                  <button type="submit" disabled={ruleSaving || !ruleForm.name}
                    className="btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed">
                    {ruleSaving ? "Saving..." : editingRule ? "Update Rule" : "Create Rule"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ComplianceSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 rounded-lg bg-white/5 animate-pulse" />
          <div className="h-4 w-36 rounded-lg bg-white/5 animate-pulse" />
        </div>
        <div className="h-10 w-28 rounded-xl bg-white/5 animate-pulse" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card rounded-xl p-4 space-y-2">
            <div className="h-6 w-12 rounded bg-white/5 animate-pulse mx-auto" />
            <div className="h-3 w-20 rounded bg-white/5 animate-pulse mx-auto" />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <div className="h-10 w-24 rounded-t-xl bg-white/5 animate-pulse" />
        <div className="h-10 w-36 rounded-t-xl bg-white/5 animate-pulse" />
      </div>
    </div>
  );
}