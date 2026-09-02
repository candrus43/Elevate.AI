import { useNavigate, useRouter } from "@tanstack/react-router";

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: "admin" | "manager" | "rep";
  companyId: string;
  companyName: string;
  companySlug: string;
  companyTier: string;
  avatarUrl: string;
  teamId: string | null;
  isDemo?: boolean;
}

interface HeaderProps {
  user: UserSession;
}

export function Header({ user }: HeaderProps) {
  const navigate = useNavigate();
  const router = useRouter();
  const pathname = router.state.location.pathname;

  const isAdminView = pathname.startsWith("/admin");

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/logout", { method: "POST" });
      const result = await res.json();
      if (result.success) {
        navigate({ to: "/login" });
      }
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  const switchToAdminView = () => navigate({ to: "/admin" });
  const switchToManagerView = () => navigate({ to: "/dashboard" });

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6"
      style={{
        background: "rgba(10, 13, 26, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
      }}
    >
      {/* Left: search */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="relative w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search..."
            className="w-32 sm:w-56 md:w-64 lg:w-80 rounded-lg px-3 sm:px-4 py-2 sm:py-2 pl-8 sm:pl-10 text-xs sm:text-sm text-ink placeholder-ink-faint focus:outline-none focus:ring-1 focus:ring-focus/40"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          />
          <span className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-ink-muted text-xs sm:text-sm">🔍</span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Admin View Switcher — only for admin users */}
        {user.role === "admin" && (
          <div className="hidden sm:flex items-center rounded-xl p-0.5"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <button
              onClick={switchToManagerView}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                !isAdminView
                  ? "bg-accent-500/15 text-accent-300 shadow-sm"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <span className="text-xs">📊</span>
              <span>Manager</span>
            </button>
            <button
              onClick={switchToAdminView}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                isAdminView
                  ? "bg-accent-500/15 text-accent-300 shadow-sm"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <span className="text-xs">👑</span>
              <span>Admin</span>
            </button>
          </div>
        )}

        {/* Notifications */}
        <button className="relative rounded-lg p-2.5 sm:p-2 text-ink-muted transition-colors hover:bg-panel-raised">
          <span className="text-sm sm:text-lg">🔔</span>
          <span className="absolute right-1.5 sm:right-1.5 top-1.5 sm:top-1.5 h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-red-500" />
        </button>

        {/* User menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Hide name/role on smaller screens */}
          <div className="hidden lg:block text-right">
            <p className="text-sm font-medium text-ink">{user.name}</p>
            <p className="text-xs text-ink-muted capitalize flex items-center gap-1.5">
              {user.role} · {user.companyName}
              {user.isDemo && (
                <span className="inline-flex items-center rounded-full border border-accent-500/30 bg-accent-500/10 px-2 py-px text-[10px] font-medium text-accent-300">
                  Sample data
                </span>
              )}
            </p>
          </div>
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-600 text-xs sm:text-sm font-bold text-ink shadow-lg shadow-accent-500/20">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg px-3 sm:px-3 py-2 sm:py-1.5 text-xs sm:text-sm text-ink-muted transition-colors hover:bg-panel-raised hover:text-red-400"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}