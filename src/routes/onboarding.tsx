import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

interface OnboardingStatus {
  completed: boolean;
  currentStep: string;
  steps: Record<string, boolean>;
  stepDetails: { key: string; label: string; completed: boolean }[];
}

const STEPS = [
  { key: "company_profile", label: "Company Profile", icon: "🏢" },
  { key: "create_teams", label: "Create Teams", icon: "👥" },
  { key: "invite_members", label: "Invite Members", icon: "📨" },
  { key: "connect_phone", label: "Connect Phone", icon: "📞" },
  { key: "setup_scorecards", label: "Setup Scorecards", icon: "📊" },
];

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  return res.json();
}

function OnboardingPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Company Profile
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [teamSize, setTeamSize] = useState("10-25");

  // Step 2: Create Teams
  const [teams, setTeams] = useState([
    { name: "SDR", preset: true },
    { name: "Account Executives", preset: true },
    { name: "Customer Success", preset: true },
  ]);
  const [customTeam, setCustomTeam] = useState("");

  // Step 3: Invite Members
  const [invites, setInvites] = useState<{ email: string; role: string }[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("rep");

  // Step 4: Connect Phone
  const [phoneProvider, setPhoneProvider] = useState("");

  // Step 5: Scorecards
  const [scorecardChoice, setScorecardChoice] = useState("templates");

  // Load onboarding status
  useEffect(() => {
    api("/api/onboarding/status").then((data) => {
      if (data.completed) {
        navigate({ to: "/dashboard" });
        return;
      }
      setStatus(data);
      const stepIndex = STEPS.findIndex((s) => s.key === data.currentStep);
      setCurrentStep(stepIndex >= 0 ? stepIndex : 0);
      setLoading(false);
    });
  }, []);

  async function completeStep(step: string, data?: Record<string, any>) {
    setSaving(true);
    setError("");
    const result = await api(`/api/onboarding/step/${step}`, {
      method: "POST",
      body: JSON.stringify({ data: data || {} }),
    });
    setSaving(false);
    if (result.success) {
      if (result.allStepsCompleted) {
        navigate({ to: "/dashboard" });
      } else {
        const nextIdx = currentStep + 1;
        if (nextIdx < STEPS.length) {
          setCurrentStep(nextIdx);
        }
      }
    } else {
      setError(result.error || "Failed to save step");
    }
  }

  async function skipStep(step: string) {
    setSaving(true);
    const result = await api(`/api/onboarding/skip/${step}`, {
      method: "POST",
    });
    setSaving(false);
    if (result.success) {
      if (result.allStepsCompleted) {
        navigate({ to: "/dashboard" });
      } else {
        const nextIdx = currentStep + 1;
        if (nextIdx < STEPS.length) {
          setCurrentStep(nextIdx);
        }
      }
    }
  }

  async function handleCreateTeams() {
    // Create teams via API
    for (const team of teams) {
      if (team.name) {
        await api("/api/team/invite", {
          method: "POST",
          body: JSON.stringify({ name: team.name }),
        }).catch(() => {}); // Best effort
      }
    }
    if (customTeam) {
      await api("/api/team/invite", {
        method: "POST",
        body: JSON.stringify({ name: customTeam }),
      }).catch(() => {});
    }
    await completeStep("create_teams", { teams: [...teams.map((t) => t.name), customTeam].filter(Boolean) });
  }

  async function handleInviteMembers() {
    for (const invite of invites) {
      await api("/api/team/invite", {
        method: "POST",
        body: JSON.stringify({ email: invite.email, role: invite.role }),
      }).catch(() => {});
    }
    await completeStep("invite_members", { invites });
  }

  async function handleConnectPhone() {
    await completeStep("connect_phone", { provider: phoneProvider });
  }

  async function handleSetupScorecards() {
    await completeStep("setup_scorecards", { choice: scorecardChoice });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-ink text-xl">Loading onboarding...</div>
      </div>
    );
  }

  const step = STEPS[currentStep];

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* Header */}
      <header className="border-b border-edge px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <span className="text-2xl">🚀</span>
          <span className="text-ink font-bold text-lg">ElevateAI</span>
          <span className="text-ink-muted text-sm ml-auto">Step {currentStep + 1} of {STEPS.length}</span>
        </div>
      </header>

      {/* Progress bar */}
      <div className="border-b border-edge px-6 py-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-1">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full h-1 rounded-full transition-all ${
                    i < currentStep
                      ? "bg-emerald-500"
                      : i === currentStep
                        ? "bg-accent-500"
                        : "bg-panel-raised"
                  }`}
                />
                <span className={`text-xs ${i <= currentStep ? "text-ink-muted" : "text-ink-faint"}`}>
                  {s.icon} {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-lg w-full">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {step.key === "company_profile" && (
            <div className="border border-edge bg-panel p-8 rounded-2xl">
              <h2 className="text-2xl font-bold text-ink mb-2">Welcome to ElevateAI! 🎉</h2>
              <p className="text-ink-muted mb-6">Let's get your team set up in 5 minutes.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-ink-muted text-sm mb-1">Company Name</label>
                  <input
                    className="w-full bg-panel-raised border border-edge rounded-lg px-4 py-2.5 text-ink focus:outline-none focus:border-accent-500"
                    placeholder="Your Company"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-ink-muted text-sm mb-1">Industry</label>
                  <select
                    className="w-full bg-panel-raised border border-edge rounded-lg px-4 py-2.5 text-ink focus:outline-none focus:border-accent-500"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  >
                    <option value="">Select industry...</option>
                    <option value="saas">SaaS / Technology</option>
                    <option value="insurance">Insurance</option>
                    <option value="mortgage">Mortgage / Lending</option>
                    <option value="finance">Financial Services</option>
                    <option value="solar">Solar / Energy</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-ink-muted text-sm mb-1">Team Size</label>
                  <select
                    className="w-full bg-panel-raised border border-edge rounded-lg px-4 py-2.5 text-ink focus:outline-none focus:border-accent-500"
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                  >
                    <option value="1-5">1-5 people</option>
                    <option value="5-10">5-10 people</option>
                    <option value="10-25">10-25 people</option>
                    <option value="25-50">25-50 people</option>
                    <option value="50+">50+ people</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => completeStep("company_profile", { companyName, industry, teamSize })}
                  disabled={saving || !companyName}
                  className="flex-1 bg-accent-600 hover:bg-accent-500 disabled:opacity-50 text-ink py-2.5 rounded-lg font-medium transition"
                >
                  {saving ? "Saving..." : "Continue"}
                </button>
              </div>
            </div>
          )}

          {step.key === "create_teams" && (
            <div className="border border-edge bg-panel p-8 rounded-2xl">
              <h2 className="text-2xl font-bold text-ink mb-2">Create Your Sales Teams</h2>
              <p className="text-ink-muted mb-6">We've preset some common teams. Customize as needed.</p>

              <div className="space-y-3">
                {teams.map((team, i) => (
                  <div key={i} className="flex items-center gap-3 bg-panel-raised rounded-lg px-4 py-3">
                    <input
                      className="flex-1 bg-transparent text-ink focus:outline-none"
                      value={team.name}
                      onChange={(e) => {
                        const newTeams = [...teams];
                        newTeams[i].name = e.target.value;
                        setTeams(newTeams);
                      }}
                    />
                    {team.preset && <span className="text-xs text-ink-faint">Preset</span>}
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    className="flex-1 bg-panel-raised border border-edge rounded-lg px-4 py-2.5 text-ink focus:outline-none focus:border-accent-500"
                    placeholder="Custom team name..."
                    value={customTeam}
                    onChange={(e) => setCustomTeam(e.target.value)}
                  />
                  <button
                    onClick={() => {
                      if (customTeam) {
                        setTeams([...teams, { name: customTeam, preset: false }]);
                        setCustomTeam("");
                      }
                    }}
                    className="bg-panel-raised hover:bg-graphite-850 text-ink px-3 rounded-lg transition"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={handleCreateTeams}
                  disabled={saving}
                  className="flex-1 bg-accent-600 hover:bg-accent-500 text-ink py-2.5 rounded-lg font-medium transition"
                >
                  {saving ? "Saving..." : "Continue"}
                </button>
                <button
                  onClick={() => skipStep("create_teams")}
                  className="px-4 py-2.5 text-ink-faint hover:text-ink transition"
                >
                  Skip
                </button>
              </div>
            </div>
          )}

          {step.key === "invite_members" && (
            <div className="border border-edge bg-panel p-8 rounded-2xl">
              <h2 className="text-2xl font-bold text-ink mb-2">Invite Your Team</h2>
              <p className="text-ink-muted mb-6">Add your managers and sales reps.</p>

              <div className="space-y-3">
                {invites.map((inv, i) => (
                  <div key={i} className="flex items-center gap-2 bg-panel-raised rounded-lg px-4 py-2">
                    <span className="flex-1 text-ink">{inv.email}</span>
                    <span className="text-xs text-ink-faint uppercase">{inv.role}</span>
                    <button
                      onClick={() => setInvites(invites.filter((_, j) => j !== i))}
                      className="text-red-400 hover:text-red-300"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    className="flex-1 bg-panel-raised border border-edge rounded-lg px-4 py-2.5 text-ink focus:outline-none focus:border-accent-500"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <select
                    className="bg-panel-raised border border-edge rounded-lg px-3 text-ink focus:outline-none"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                  >
                    <option value="rep">Rep</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    onClick={() => {
                      if (inviteEmail) {
                        setInvites([...invites, { email: inviteEmail, role: inviteRole }]);
                        setInviteEmail("");
                      }
                    }}
                    className="bg-accent-600 hover:bg-accent-500 text-ink px-3 rounded-lg transition"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={handleInviteMembers}
                  disabled={saving}
                  className="flex-1 bg-accent-600 hover:bg-accent-500 text-ink py-2.5 rounded-lg font-medium transition"
                >
                  {saving ? "Saving..." : "Continue"}
                </button>
                <button
                  onClick={() => skipStep("invite_members")}
                  className="px-4 py-2.5 text-ink-faint hover:text-ink transition"
                >
                  Skip
                </button>
              </div>
            </div>
          )}

          {step.key === "connect_phone" && (
            <div className="border border-edge bg-panel p-8 rounded-2xl">
              <h2 className="text-2xl font-bold text-ink mb-2">Connect Your Phone System</h2>
              <p className="text-ink-muted mb-6">ElevateAI integrates with your existing phone system.</p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "hodu", name: "HoduCC", icon: "📞" },
                  { id: "five9", name: "Five9", icon: "☎️" },
                  { id: "ringcentral", name: "RingCentral", icon: "📱" },
                  { id: "aircall", name: "Aircall", icon: "📲" },
                  { id: "twilio", name: "Twilio", icon: "🔧" },
                  { id: "other", name: "Other", icon: "🔌" },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPhoneProvider(p.id)}
                    className={`p-4 rounded-xl border text-left transition ${
                      phoneProvider === p.id
                        ? "border-accent-500 bg-accent-500/15"
                        : "border-edge bg-panel-raised hover:bg-panel-raised"
                    }`}
                  >
                    <div className="text-2xl mb-1">{p.icon}</div>
                    <div className="text-ink font-medium">{p.name}</div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={handleConnectPhone}
                  disabled={saving}
                  className="flex-1 bg-accent-600 hover:bg-accent-500 text-ink py-2.5 rounded-lg font-medium transition"
                >
                  {saving ? "Saving..." : "Continue"}
                </button>
                <button
                  onClick={() => skipStep("connect_phone")}
                  className="px-4 py-2.5 text-ink-faint hover:text-ink transition"
                >
                  Skip
                </button>
              </div>
            </div>
          )}

          {step.key === "setup_scorecards" && (
            <div className="border border-edge bg-panel p-8 rounded-2xl">
              <h2 className="text-2xl font-bold text-ink mb-2">Set Up Scorecards</h2>
              <p className="text-ink-muted mb-6">Choose how to start evaluating your calls.</p>

              <div className="space-y-3">
                {[
                  { id: "templates", name: "Use Templates", desc: "Cold Call Fundamentals, Discovery, Compliance" },
                  { id: "custom", name: "Create Custom", desc: "Build your own scorecard from scratch" },
                  { id: "later", name: "Do This Later", desc: "Start with default scorecards" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setScorecardChoice(opt.id)}
                    className={`w-full p-4 rounded-xl border text-left transition ${
                      scorecardChoice === opt.id
                        ? "border-accent-500 bg-accent-500/15"
                        : "border-edge bg-panel-raised hover:bg-panel-raised"
                    }`}
                  >
                    <div className="text-ink font-medium">{opt.name}</div>
                    <div className="text-ink-faint text-sm">{opt.desc}</div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={handleSetupScorecards}
                  disabled={saving}
                  className="flex-1 bg-accent-600 hover:bg-accent-500 text-ink py-2.5 rounded-lg font-medium transition"
                >
                  {saving ? "Saving..." : "Finish"}
                </button>
                <button
                  onClick={() => skipStep("setup_scorecards")}
                  className="px-4 py-2.5 text-ink-faint hover:text-ink transition"
                >
                  Skip
                </button>
              </div>
            </div>
          )}

          <div className="text-center mt-4">
            <button
              onClick={() => navigate({ to: "/dashboard" })}
              className="text-ink-faint hover:text-ink-faint text-sm transition"
            >
              Go to Dashboard anyway
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}