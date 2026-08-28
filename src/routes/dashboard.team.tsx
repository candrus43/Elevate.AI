import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { UserSession } from "~/utils/auth";
import { getCompanyUsers } from "~/utils/db";
import { InviteMemberModal } from "~/components/InviteMemberModal";

export const Route = createFileRoute("/dashboard/team")({
  component: TeamPage,
});

interface Invitation {
  id: string;
  email: string;
  role: string;
  team_id: string | null;
  status: string;
  created_at: string;
  expires_at: string;
  invited_by_name: string;
}

function TeamPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserSession | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadData = async (userId: string, companyId: string) => {
    try {
      const [membersData, invitesData] = await Promise.all([
        getCompanyUsers(companyId),
        fetch("/api/team/invites").then((r) => r.json()),
      ]);
      setMembers(membersData);
      if (invitesData.invites) {
        setInvitations(invitesData.invites);
      }
    } catch (e) {
      console.error("Failed to load team data", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then(({ user }) => {
        if (!user) {
          navigate({ to: "/login" });
          return;
        }
        setUser(user);
        loadData(user.id, user.companyId);
      })
      .catch(() => {
        navigate({ to: "/login" });
      });
  }, [navigate]);

  // Refresh invitations when modal closes
  useEffect(() => {
    if (!showInviteModal && user) {
      fetch("/api/team/invites")
        .then((r) => r.json())
        .then((data) => {
          if (data.invites) setInvitations(data.invites);
        })
        .catch(() => {});
    }
  }, [showInviteModal, user]);

  const handleCancelInvite = async (inviteId: string) => {
    setCancellingId(inviteId);
    try {
      await fetch(`/api/team/invite/${inviteId}`, { method: "DELETE" });
      setInvitations((prev) => prev.filter((inv) => inv.id !== inviteId));
    } catch (e) {
      console.error("Failed to cancel invite", e);
    }
    setCancellingId(null);
  };

  if (loading) return <TeamSkeleton />;

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roles = [...new Set(members.map((m) => m.role))];

  const canInvite = user?.role === "admin" || user?.role === "manager";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">My Team</h1>
          <p className="text-sm text-ink-muted">
            {members.length} team member{members.length !== 1 ? "s" : ""}
            {invitations.length > 0 && ` · ${invitations.length} pending invitation${invitations.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        {canInvite && (
          <button onClick={() => setShowInviteModal(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent-600 px-5 py-2.5 text-sm font-semibold text-white shadow-glow hover:bg-accent-500 active:bg-accent-700 active:scale-[0.98] transition-all">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Member
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-edge bg-panel-raised px-4 py-2.5 pl-10 text-sm text-ink placeholder-ink-faint backdrop-blur-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-focus/40"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl border border-edge bg-panel-raised px-4 py-2.5 text-sm text-ink-muted backdrop-blur-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-focus/40"
        >
          <option value="all">All Roles</option>
          {roles.map((role) => (
            <option key={role} value={role} className="bg-panel">
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-ink-muted uppercase tracking-wider">
            Pending Invitations
          </h3>
          <div className="space-y-2">
            {invitations.map((inv, i) => (
              <div
                key={inv.id}
                className="border border-edge bg-panel rounded-xl p-4 flex items-center gap-4 animate-fade-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{inv.email}</p>
                  <p className="text-xs text-ink-muted">
                    Invited by {inv.invited_by_name || "someone"} · {new Date(inv.created_at).toLocaleDateString()}
                    {inv.expires_at && ` · Expires ${new Date(inv.expires_at).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400 capitalize">
                    {inv.role}
                  </span>
                  {canInvite && (
                    <button
                      onClick={() => handleCancelInvite(inv.id)}
                      disabled={cancellingId === inv.id}
                      className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-40"
                    >
                      {cancellingId === inv.id ? "..." : "Cancel"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Members */}
      <div className="space-y-3">
        {filteredMembers.length === 0 ? (
          <div className="border border-edge bg-panel rounded-xl p-12 text-center">
            <span className="text-4xl">👥</span>
            <h3 className="mt-4 text-lg font-medium text-ink">No members found</h3>
            <p className="mt-1 text-sm text-ink-muted">
              {search || roleFilter !== "all"
                ? "Try adjusting your search or filter."
                : "Invite team members to get started."}
            </p>
          </div>
        ) : (
          filteredMembers.map((member, i) => (
            <div
              key={member.id}
              className="border border-edge bg-panel rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 animate-fade-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* Avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-600 text-sm font-semibold text-white">
                {member.name?.charAt(0).toUpperCase() || "?"}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink truncate">{member.name}</p>
                <p className="text-xs text-ink-muted truncate">{member.email}</p>
              </div>

              {/* Role & Status */}
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-edge bg-panel-raised px-3 py-1 text-xs font-medium text-ink-muted capitalize">
                  {member.role}
                </span>
                <span
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                    member.is_active
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-gray-500/10 text-ink-muted border border-gray-500/20"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      member.is_active ? "bg-emerald-400" : "bg-gray-500"
                    }`}
                  />
                  {member.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Team */}
              <span className="text-xs text-ink-faint sm:text-right sm:min-w-[100px]">
                {member.team_name || "—"}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Invite Modal */}
      {user && (
        <InviteMemberModal
          open={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          companyId={user.companyId}
        />
      )}

      {/* Recent Activity */}
      <div className="border border-edge bg-panel rounded-xl p-5">
        <h3 className="mb-4 text-base font-semibold text-ink">Recent Activity</h3>
        <div className="space-y-3">
          {[
            { name: "Sarah Chen", action: "Completed coaching plan", time: "2 hours ago" },
            { name: "Mike Johnson", action: "Scored 92 on sales call", time: "4 hours ago" },
            { name: "Emily Davis", action: "Joined the team", time: "1 day ago" },
          ].map((activity, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg bg-panel-raised p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent-500/40 to-accent-600/40 text-xs font-medium text-accent-300">
                  {activity.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">{activity.name}</p>
                  <p className="text-xs text-ink-muted">{activity.action}</p>
                </div>
              </div>
              <span className="text-xs text-ink-faint">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TeamSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-32 rounded-lg bg-panel-raised animate-pulse" />
          <div className="h-4 w-24 rounded-lg bg-panel-raised animate-pulse" />
        </div>
        <div className="h-10 w-36 rounded-xl bg-panel-raised animate-pulse" />
      </div>

      <div className="flex gap-3">
        <div className="h-10 flex-1 rounded-xl bg-panel-raised animate-pulse" />
        <div className="h-10 w-32 rounded-xl bg-panel-raised animate-pulse" />
      </div>

      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="border border-edge bg-panel rounded-xl p-5 flex items-center gap-4">
          <div className="h-10 w-10 shrink-0 rounded-full bg-panel-raised animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 rounded bg-panel-raised animate-pulse" />
            <div className="h-3 w-56 rounded bg-panel-raised animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-6 w-16 rounded-full bg-panel-raised animate-pulse" />
            <div className="h-6 w-16 rounded-full bg-panel-raised animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}