import { useNavigate } from "@tanstack/react-router";
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
    { label: "Call Reviews", icon: "🎧", href: "/dashboard/reviews" },
    { label: "Coaching", icon: "🎯", href: "/dashboard/coaching" },
    { label: "Leaderboard", icon: "🏆", href: "/dashboard/leaderboard" },
    { label: "Learning", icon: "📚", href: "/dashboard/learning" },
    { label: "Analytics", icon: "📈", href: "/dashboard/analytics" },
  ],
  rep: [
    { label: "My Dashboard", icon: "📊", href: "/dashboard/rep" },
    { label: "My Calls", icon: "🎧", href: "/dashboard/rep/calls" },
    { label: "Coaching Plan", icon: "🎯", href: "/dashboard/rep/coaching" },
    { label: "Role Play", icon: "🎭", href: "/dashboard/rep/roleplay" },
    { label: "Leaderboard", icon: "🏆", href: "/dashboard/rep/leaderboard" },
    { label: "Learning", icon: "📚", href: "/dashboard/rep/learning" },
  ],
};

export function Sidebar({ user, collapsed, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const items = navItems[user.role] || navItems.rep;

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-full bg-gray-900 text-white transition-all duration-300 ${
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

      {/* Nav items */}
      <nav className="mt-4 space-y-1 px-2">
        {items.map((item) => (
          <button
            key={item.href}
            onClick={() => navigate({ to: item.href })}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
          >
            <span className="text-lg">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
}