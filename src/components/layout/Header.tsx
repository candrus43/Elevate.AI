import { useNavigate } from "@tanstack/react-router";
import type { UserSession } from "~/utils/auth";
import { logout } from "~/utils/auth";

interface HeaderProps {
  user: UserSession;
}

export function Header({ user }: HeaderProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      navigate({ to: "/login" });
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between border-b border-gray-200 bg-white/90 backdrop-blur-sm px-4 sm:px-6 dark:border-gray-700 dark:bg-gray-950/90">
      {/* Mobile: page indicator. Desktop: search */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Mobile hamburger is part of bottom nav */}
        <div className="relative w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search..."
            className="w-36 sm:w-72 lg:w-80 rounded-lg border border-gray-300 bg-gray-50 px-3 sm:px-4 py-1.5 sm:py-2 pl-8 sm:pl-10 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
          />
          <span className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-sm">🔍</span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notifications */}
        <button className="relative rounded-lg p-1.5 sm:p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
          <span className="text-sm sm:text-lg">🔔</span>
          <span className="absolute right-1 sm:right-1.5 top-1 sm:top-1.5 h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-red-500" />
        </button>

        {/* User menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Hide name/role on very small screens */}
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role} · {user.companyName}</p>
          </div>
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-indigo-100 text-xs sm:text-sm font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <button
            onClick={handleLogout}
            className="hidden sm:block rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-gray-500 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-800"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}