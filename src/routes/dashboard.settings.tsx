import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { UserSession } from "~/utils/auth";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

type Tab = "company" | "profile" | "notifications";

function SettingsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("company");

  // Company settings state
  const [company, setCompany] = useState<any>(null);
  const [companyName, setCompanyName] = useState("");
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyError, setCompanyError] = useState("");
  const [companySuccess, setCompanySuccess] = useState("");

  // Profile state
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Notifications state
  const [notifCallAnalyzed, setNotifCallAnalyzed] = useState(true);
  const [notifCoaching, setNotifCoaching] = useState(true);
  const [notifLeaderboard, setNotifLeaderboard] = useState(true);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState("");
  const [notifSuccess, setNotifSuccess] = useState("");

  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then(({ user }) => {
        if (!user) { navigate({ to: "/login" }); return; }
        setUser(user);
        setProfileName(user.name);
        setProfileEmail(user.email);
        loadCompany(user);
        loadNotifications();
        setLoading(false);
      })
      .catch(() => navigate({ to: "/login" }));
  }, [navigate]);

  const loadCompany = async (u: UserSession) => {
    try {
      const res = await fetch("/api/settings/company");
      const data = await res.json();
      if (data.company) {
        setCompany(data.company);
        setCompanyName(data.company.name);
      }
    } catch {}
  };

  const loadNotifications = async () => {
    try {
      const res = await fetch("/api/settings/notifications");
      const data = await res.json();
      if (data.preferences) {
        setNotifCallAnalyzed(!!data.preferences.call_analyzed);
        setNotifCoaching(!!data.preferences.coaching_assigned);
        setNotifLeaderboard(!!data.preferences.leaderboard_changes);
      }
    } catch {}
  };

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompanyError("");
    setCompanySuccess("");
    setCompanyLoading(true);
    try {
      const res = await fetch("/api/settings/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: companyName }),
      });
      const data = await res.json();
      if (data.success) {
        setCompanySuccess("Company settings updated");
        setCompany((prev: any) => ({ ...prev, name: companyName }));
        setTimeout(() => setCompanySuccess(""), 3000);
      } else {
        setCompanyError(data.error || "Failed to update");
      }
    } catch { setCompanyError("Connection error"); }
    setCompanyLoading(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    setProfileLoading(true);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileName, email: profileEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setProfileSuccess("Profile updated");
        setTimeout(() => setProfileSuccess(""), 3000);
      } else {
        setProfileError(data.error || "Failed to update");
      }
    } catch { setProfileError("Connection error"); }
    setProfileLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setPasswordSuccess("Password changed");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccess(""), 3000);
      } else {
        setPasswordError(data.error || "Failed to change password");
      }
    } catch { setPasswordError("Connection error"); }
    setPasswordLoading(false);
  };

  const handleUpdateNotifications = async () => {
    setNotifError("");
    setNotifSuccess("");
    setNotifLoading(true);
    try {
      const res = await fetch("/api/settings/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          call_analyzed: notifCallAnalyzed,
          coaching_assigned: notifCoaching,
          leaderboard_changes: notifLeaderboard,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNotifSuccess("Notification preferences saved");
        setTimeout(() => setNotifSuccess(""), 3000);
      } else {
        setNotifError(data.error || "Failed to save");
      }
    } catch { setNotifError("Connection error"); }
    setNotifLoading(false);
  };

  if (loading) return <SettingsSkeleton />;

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "company", label: "Company", icon: "🏢" },
    { key: "profile", label: "Profile", icon: "👤" },
    { key: "notifications", label: "Notifications", icon: "🔔" },
  ];

  const stripeLinks: Record<string, string> = {
    core: "https://buy.stripe.com/8x2fZh4pL2Tp1sY3kw1wY02",
    pro: "https://buy.stripe.com/28E00jbSd79F1sYaMY1wY01",
    enterprise: "https://buy.stripe.com/dRmd9Rf4p65B2x23kw1wY00",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-400">Manage your account and company preferences</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-white/10 pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 rounded-t-xl px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-white/5 text-white border-b-2 border-purple-500"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Company Settings Tab */}
      {activeTab === "company" && (
        <div className="space-y-6">
          <div className="glass-card rounded-xl p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Company Information</h2>
            <form onSubmit={handleUpdateCompany} className="space-y-4">
              {companyError && (
                <div className="rounded-lg bg-red-900/20 p-3 text-sm text-red-400 ring-1 ring-red-500/20">{companyError}</div>
              )}
              {companySuccess && (
                <div className="rounded-lg bg-emerald-900/20 p-3 text-sm text-emerald-400 ring-1 ring-emerald-500/20 flex items-center gap-2">
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {companySuccess}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Company Name</label>
                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Slug</label>
                  <input type="text" value={company?.slug || ""} disabled
                    className="w-full rounded-xl border border-white/5 bg-white/5 px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Plan</label>
                  <div className="flex items-center gap-3">
                    <input type="text" value={`${company?.tier?.charAt(0).toUpperCase()}${company?.tier?.slice(1) || "Core"}`} disabled
                      className="flex-1 rounded-xl border border-white/5 bg-white/5 px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed" />
                    <a href={stripeLinks[company?.tier] || stripeLinks.core} target="_blank" rel="noopener noreferrer"
                      className="rounded-xl bg-purple-500/10 border border-purple-500/30 px-4 py-2.5 text-xs font-medium text-purple-300 hover:bg-purple-500/20 transition-all whitespace-nowrap">
                      {company?.tier === "enterprise" ? "Manage" : "Upgrade →"}
                    </a>
                  </div>
                </div>
              </div>
              {user?.role === "admin" && (
                <button type="submit" disabled={companyLoading || !companyName}
                  className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
                  {companyLoading ? "Saving..." : "Save Changes"}
                </button>
              )}
            </form>
          </div>

          <div className="glass-card rounded-xl p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Usage & Team</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl bg-white/5 p-4 text-center">
                <p className="text-2xl font-bold text-white">{company?.teamSize || 0}</p>
                <p className="text-xs text-gray-400 mt-1">Team Members</p>
              </div>
              <div className="rounded-xl bg-white/5 p-4 text-center">
                <p className="text-2xl font-bold text-white capitalize">{company?.tier || "core"}</p>
                <p className="text-xs text-gray-400 mt-1">Current Plan</p>
              </div>
              <div className="rounded-xl bg-white/5 p-4 text-center">
                <p className="text-2xl font-bold text-white">
                  {company?.created_at ? new Date(company.created_at).toLocaleDateString() : "—"}
                </p>
                <p className="text-xs text-gray-400 mt-1">Account Created</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          {/* Profile Info */}
          <div className="glass-card rounded-xl p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Profile Information</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {profileError && (
                <div className="rounded-lg bg-red-900/20 p-3 text-sm text-red-400 ring-1 ring-red-500/20">{profileError}</div>
              )}
              {profileSuccess && (
                <div className="rounded-lg bg-emerald-900/20 p-3 text-sm text-emerald-400 ring-1 ring-emerald-500/20 flex items-center gap-2">
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {profileSuccess}
                </div>
              )}
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-xl font-bold text-white">
                  {profileName?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{profileName || "User"}</p>
                  <p className="text-xs text-gray-400 capitalize">{user?.role || "member"}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                  <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                  <input type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30" />
                </div>
              </div>
              <button type="submit" disabled={profileLoading}
                className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
                {profileLoading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="glass-card rounded-xl p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Change Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              {passwordError && (
                <div className="rounded-lg bg-red-900/20 p-3 text-sm text-red-400 ring-1 ring-red-500/20">{passwordError}</div>
              )}
              {passwordSuccess && (
                <div className="rounded-lg bg-emerald-900/20 p-3 text-sm text-emerald-400 ring-1 ring-emerald-500/20 flex items-center gap-2">
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {passwordSuccess}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Current Password</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30" />
              </div>
              <button type="submit" disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
                {passwordLoading ? "Changing..." : "Change Password"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <div className="glass-card rounded-xl p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Notification Preferences</h2>
          {notifError && (
            <div className="mb-4 rounded-lg bg-red-900/20 p-3 text-sm text-red-400 ring-1 ring-red-500/20">{notifError}</div>
          )}
          {notifSuccess && (
            <div className="mb-4 rounded-lg bg-emerald-900/20 p-3 text-sm text-emerald-400 ring-1 ring-emerald-500/20 flex items-center gap-2">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {notifSuccess}
            </div>
          )}
          <div className="space-y-4">
            <ToggleOption
              label="Call Analyzed"
              description="When your call analysis is complete"
              enabled={notifCallAnalyzed}
              onChange={setNotifCallAnalyzed}
            />
            <ToggleOption
              label="Coaching Assigned"
              description="When a new coaching plan is assigned"
              enabled={notifCoaching}
              onChange={setNotifCoaching}
            />
            <ToggleOption
              label="Leaderboard Changes"
              description="When your leaderboard position changes"
              enabled={notifLeaderboard}
              onChange={setNotifLeaderboard}
            />
          </div>
          <button onClick={handleUpdateNotifications} disabled={notifLoading}
            className="btn-primary mt-6 disabled:opacity-40 disabled:cursor-not-allowed">
            {notifLoading ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      )}
    </div>
  );
}

function ToggleOption({ label, description, enabled, onChange }: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-all ${
          enabled ? "bg-purple-500" : "bg-white/10"
        }`}
      >
        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-all shadow ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`} />
      </button>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-24 rounded-lg bg-white/5 animate-pulse" />
        <div className="h-4 w-56 rounded-lg bg-white/5 animate-pulse" />
      </div>
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-28 rounded-t-xl bg-white/5 animate-pulse" />
        ))}
      </div>
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="h-5 w-36 rounded bg-white/5 animate-pulse" />
        <div className="h-10 w-full rounded-xl bg-white/5 animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-10 rounded-xl bg-white/5 animate-pulse" />
          <div className="h-10 rounded-xl bg-white/5 animate-pulse" />
        </div>
        <div className="h-10 w-32 rounded-xl bg-white/5 animate-pulse" />
      </div>
    </div>
  );
}