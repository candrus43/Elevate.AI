import { useNavigate, useRouter } from "@tanstack/react-router";
import type { UserSession } from "~/utils/auth";

interface ExecSidebarProps {
  user: UserSession;
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { label: "Overview", icon: "📊", href: "/executive" },
  { label: "Team Health", icon: "❤️", href: "/executive/team-health" },
  { label: "Reports", icon: "📄", href: "/executive/reports" },
  { label: "Forecasting", icon: "🔮", href: "/executive/forecasting" },
  { label: "Coaching ROI", icon: "🎯", href: "/executive/coaching" },
  { label: "Departments", icon: "🏛️", href: "/executive/coaching/departments" },
  { label: "AI Insights", icon: "🤖", href: "/dashboard/ai-assistant" },
  { label: "Integrations", icon: "🔌", href: "/executive/integrations" },
  { label: "Hodu Phone", icon: "📞", href: "/executive/integrations/hodu" },
  { label: "Settings", icon: "⚙️", href: "/dashboard/settings" },
];

function getMobileItems() {
  return navItems.slice(0, 5);
}

export function ExecSidebar({ user, collapsed, onToggle }: ExecSidebarProps) {
  const navigate = useNavigate();
  const router = useRouter();
  const pathname = router.state.location.pathname;

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  const mobileItems = getMobileItems();

  return (
    <>
      {/* Desktop Sidebar — hidden on mobile */}
      <aside
        className={`fixed left-0 top-0 z-40 hidden h-full transition-all duration-300 md:block ${
          collapsed ? "w-16" : "w-60"
        }`}
        style={{
          background: "linear-gradient(180deg, rgba(15, 19, 34, 0.98) 0%, rgba(20, 15, 35, 0.95) 100%)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRight: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-white/5 px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600">
                <svg className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 2L11.5 7L17 7L12.5 10.5L14.5 16L10 12.5L5.5 16L7.5 10.5L3 7L8.5 7L10 2Z" />
                </svg>
              </div>
              <span className="text-lg font-bold text-white">ElevateAI</span>
            </div>
          )}
          <button
            onClick={onToggle}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            {collapsed ? "→" : "←"}
          </button>
        </div>

        {/* Desktop nav items */}
        <nav className="mt-1 space-y-1 px-2">
          {/* Section header */}
          {!collapsed && (
            <div className="px-3 py-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                Executive
              </span>
            </div>
          )}
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => navigate({ to: item.href })}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${
                isActive(item.href)
                  ? "bg-gradient-to-r from-purple-500/10 to-indigo-500/10 text-white shadow-sm shadow-purple-500/5"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
              style={isActive(item.href) ? { borderLeft: "2px solid rgba(139, 92, 246, 0.6)" } : {}}
            >
              <span className="text-lg">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile Bottom Nav — hidden on desktop */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 pb-safe pt-2 md:hidden"
        style={{
          background: "linear-gradient(180deg, rgba(15, 19, 34, 0.98) 0%, rgba(20, 15, 35, 0.95) 100%)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderTop: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
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