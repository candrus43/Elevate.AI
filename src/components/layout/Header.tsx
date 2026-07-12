import { useNavigate } from "@tanstack/react-router";

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
}

interface HeaderProps {
  user: UserSession;
}

export function Header({ user }: HeaderProps) {
  const navigate = useNavigate();

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

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6"
      style={{
        background: "rgba(10, 13, 26, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
      }}
    >
      {/* Mobile: page indicator. Desktop: search */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Mobile hamburger is part of bottom nav */}
        <div className="relative w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search..."
            className="w-36 sm:w-72 lg:w-80 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 pl-8 sm:pl-10 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          />
          <span className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-sm">🔍</span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notifications */}
        <button className="relative rounded-lg p-1.5 sm:p-2 text-gray-400 transition-colors hover:bg-white/5">
          <span className="text-sm sm:text-lg">🔔</span>
          <span className="absolute right-1 sm:right-1.5 top-1 sm:top-1.5 h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-red-500" />
        </button>

        {/* User menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Hide name/role on very small screens */}
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-white">{user.name}</p>
            <p className="text-xs text-gray-400 capitalize">{user.role} · {user.companyName}</p>
          </div>
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-xs sm:text-sm font-bold text-white shadow-lg shadow-purple-500/20">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <button
            onClick={handleLogout}
            className="hidden sm:block rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-red-400"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}