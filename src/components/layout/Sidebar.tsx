import { useNavigate, useRouter } from "@tanstack/react-router";
import type { UserSession } from "~/utils/auth";

interface SidebarProps {
  user: UserSession;
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = {
  admin: [
    { label: "Dashboard", icon: "📊", href: "/admin" },
    { label: "Companies", icon: "🏢", href: "/admin/companies" },
    { label: "Users", icon: "👥", href: "/admin/users" },
    { label: "Settings", icon: "⚙️", href: "/admin/settings" },
  ],
  manager: [
    { label: "Overview", icon: "📊", href: "/dashboard" },
    { label: "My Team", icon: "👥", href: "/dashboard/team" },
    { label: "Call Reviews", icon: "🎧", href: "/dashboard/calls" },
    { label: "Compliance", icon: "🛡️", href: "/dashboard/compliance" },
    { label: "Coaching", icon: "🎯", href: "/dashboard/coaching" },
    { label: "Scorecards", icon: "📋", href: "/dashboard/scorecards" },
    { label: "Leaderboard", icon: "🏆", href: "/dashboard/leaderboard" },
    { label: "Learning", icon: "📚", href: "/dashboard/learning" },
    { label: "Analytics", icon: "📈", href: "/dashboard/analytics" },
    { label: "Settings", icon: "⚙️", href: "/dashboard/settings" },
  ],
  rep: [
    { label: "My Dashboard", icon: "📊", href: "/dashboard/rep" },
    { label: "My Calls", icon: "🎧", href: "/dashboard/rep/calls" },
    { label: "Coaching Plan", icon: "🎯", href: "/dashboard/rep/coaching" },
    { label: "Role Play", icon: "🎭", href: "/dashboard/rep/roleplay" },
    { label: "Leaderboard", icon: "🏆", href: "/dashboard/rep/leaderboard" },
    { label: "Learning", icon: "📚", href: "/dashboard/rep/learning" },
    { label: "Settings", icon: "⚙️", href: "/dashboard/settings" },
  ],
};

// For the mobile bottom nav, show only the first 5 most important items
function getMobileItems(role: string) {
  const items = navItems[role as keyof typeof navItems] || navItems.rep;
  return items.slice(0, 5);
}

export function Sidebar({ user, collapsed, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const router = useRouter();
  const items = navItems[user.role] || navItems.rep;
  const mobileItems = getMobileItems(user.role);

  const isActive = (href: string) => {
    const pathname = router.state.location.pathname;
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <>
      {/* Desktop Sidebar — hidden on mobile */}
      <aside
        className={`fixed left-0 top-0 z-40 hidden h-full bg-gray-900 text-white transition-all duration-300 md:block ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-gray-700 px-4">
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight">ElevateAI</span>
          )}
          <button
            onClick={onToggle}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            {collapsed ? "→" : "←"}
          </button>
        </div>

        {/* Desktop nav items */}
        <nav className="mt-4 space-y-1 px-2">
          {items.map((item) => (
            <button
              key={item.href}
              onClick={() => navigate({ to: item.href })}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-gray-800 hover:text-white ${
                isActive(item.href) ? "bg-gray-800 text-white" : "text-gray-300"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile Bottom Nav — hidden on desktop */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-gray-700 bg-gray-900 px-2 pb-safe pt-2 md:hidden">
        {mobileItems.map((item) => {
          const active = isActive(item.href);
          return (
            <button
              key={item.href}
              onClick={() => navigate({ to: item.href })}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] transition-colors min-w-0 flex-1 ${
                active
                  ? "text-purple-400"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <span className={`text-lg leading-none ${active ? "drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" : ""}`}>
                {item.icon}
              </span>
              <span className="truncate max-w-full">{item.label}</span>
              {active && <span className="mt-0.5 h-1 w-6 rounded-full bg-purple-500" />}
            </button>
          );
        })}
      </nav>
    </>
  );
}