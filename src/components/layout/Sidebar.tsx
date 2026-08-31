import { useState } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { Drawer } from "~/components/ui/Drawer";
import type { UserSession } from "~/utils/auth";
import { BrandLogo } from "~/components/BrandLogo";

interface SidebarProps {
  user: UserSession;
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = {
  admin: [
    { label: "Dashboard", icon: "📊", href: "/admin" },
    { label: "Organizations", icon: "🏢", href: "/admin/organizations" },
    { label: "Departments", icon: "🏛️", href: "/admin/departments" },
    { label: "Feature Flags", icon: "🚩", href: "/admin/feature-flags" },
    { label: "SSO Settings", icon: "🔐", href: "/admin/sso" },
    { label: "Billing", icon: "💳", href: "/dashboard/billing" },
    { label: "Settings", icon: "⚙️", href: "/dashboard/settings" },
  ],
  executive: [
    { label: "Overview", icon: "📊", href: "/executive" },
    { label: "Team Health", icon: "❤️", href: "/executive/team-health" },
    { label: "Reports", icon: "📄", href: "/executive/reports" },
    { label: "Forecasting", icon: "🔮", href: "/executive/forecasting" },
    { label: "Coaching ROI", icon: "🎯", href: "/executive/coaching" },
    { label: "Departments", icon: "🏛️", href: "/executive/coaching/departments" },
    { label: "Settings", icon: "⚙️", href: "/dashboard/settings" },
  ],
  manager: [
    { label: "Overview", icon: "📊", href: "/dashboard" },
    { label: "My Team", icon: "👥", href: "/dashboard/team" },
    { label: "Call Reviews", icon: "🎧", href: "/dashboard/calls" },
    { label: "Scorecards", icon: "📋", href: "/dashboard/scorecards" },
    { label: "Coaching", icon: "🎯", href: "/dashboard/coaching" },
    { label: "Role Play Center", icon: "🎭", href: "/dashboard/roleplay-center" },
    { label: "Leaderboard", icon: "🏆", href: "/dashboard/leaderboard" },
    { label: "Learning", icon: "📚", href: "/dashboard/learning" },
    { label: "Analytics", icon: "📈", href: "/dashboard/analytics" },
    { label: "Integrations", icon: "🔌", href: "/dashboard/integrations" },
    { label: "Settings", icon: "⚙️", href: "/dashboard/settings" },
  ],
  rep: [
    { label: "My Dashboard", icon: "📊", href: "/dashboard/rep" },
    { label: "My Calls", icon: "🎧", href: "/dashboard/rep/calls" },
    { label: "Live Coaching", icon: "🎙️", href: "/dashboard/rep/live-coaching" },
    { label: "Coaching Plan", icon: "🎯", href: "/dashboard/rep/coaching" },
    { label: "Role Play", icon: "🎭", href: "/dashboard/rep/roleplay" },
    { label: "Leaderboard", icon: "🏆", href: "/dashboard/rep/leaderboard" },
    { label: "Learning", icon: "📚", href: "/dashboard/rep/learning" },
    { label: "AI Coach", icon: "🤖", href: "/dashboard/ai-coach" },
    { label: "Settings", icon: "⚙️", href: "/dashboard/settings" },
  ],
};

// For the mobile bottom nav, show the first 4 items; the 5th slot is "More".
function getMobileItems(role: string) {
  const items = navItems[role as keyof typeof navItems] || navItems.rep;
  return items.slice(0, 4);
}

export function Sidebar({ user, collapsed, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const router = useRouter();
  const pathname = router.state.location.pathname;
  const [moreOpen, setMoreOpen] = useState(false);

  // Determine which nav items to show based on role + current path
  // Admin users see admin items when on /admin/*, manager items when on /dashboard/*
  const items = user.role === "admin" && pathname.startsWith("/admin")
    ? navItems.admin
    : user.role === "admin"
    ? navItems.manager
    : navItems[user.role as keyof typeof navItems] || navItems.rep;

  // Mobile items follow same logic
  const mobileItems = getMobileItems(
    user.role === "admin" && pathname.startsWith("/admin") ? "admin" : user.role === "admin" ? "manager" : user.role
  );

  const isActive = (href: string) => {
    const pathname = router.state.location.pathname;
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <>
      {/* Desktop Sidebar — hidden on mobile */}
      <aside
        className={`fixed left-0 top-0 z-40 hidden h-full transition-all duration-300 md:block ${
          collapsed ? "w-16" : "w-60"
        }`}
        style={{
          background: "linear-gradient(180deg, rgba(15, 19, 34, 0.98) 0%, rgba(17,24,39, 0.95) 100%)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRight: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-edge px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <BrandLogo />
            </div>
          )}
          <button
            onClick={onToggle}
            className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-panel-raised hover:text-ink"
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
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${
                isActive(item.href)
                  ? "bg-gradient-to-r from-accent-500/10 to-accent-500/10 text-ink shadow-sm shadow-accent-500/10"
                  : "text-ink-muted hover:bg-panel-raised hover:text-ink"
              }`}
              style={isActive(item.href) ? { borderLeft: "2px solid rgba(51,143,255, 0.6)" } : {}}
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
          background: "linear-gradient(180deg, rgba(15, 19, 34, 0.98) 0%, rgba(17,24,39, 0.95) 100%)",
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
                  ? "text-accent-300"
                  : "text-ink-faint hover:text-ink-muted"
              }`}
            >
              <span className={`text-lg leading-none ${active ? "drop-shadow-[0_0_8px_rgba(51,143,255,0.5)]" : ""}`}>
                {item.icon}
              </span>
              <span className="truncate max-w-full">{item.label}</span>
              {active && <span className="mt-0.5 h-1 w-6 rounded-full bg-accent-500" />}
            </button>
          );
        })}

        {/* "More" slot — opens a drawer with the full nav */}
        <button
          onClick={() => setMoreOpen(true)}
          className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] transition-colors min-w-0 flex-1 ${
            moreOpen ? "text-accent-300" : "text-ink-faint hover:text-ink-muted"
          }`}
          aria-label="More navigation"
        >
          <span className="text-lg leading-none">☰</span>
          <span className="truncate max-w-full">More</span>
        </button>
      </nav>

      {/* Mobile "More" drawer — full nav list */}
      <Drawer
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        side="right"
        size="sm"
        className="w-[85vw] max-w-xs"
        title={user.role === "admin" && pathname.startsWith("/admin") ? "Admin" : user.role === "admin" ? "Manager" : "Menu"}
      >
        <nav className="space-y-1">
          {items.map((item) => {
            const active = isActive(item.href);
            return (
              <button
                key={item.href}
                onClick={() => {
                  setMoreOpen(false);
                  navigate({ to: item.href });
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors ${
                  active
                    ? "bg-accent-500/10 text-accent-300"
                    : "text-ink-muted hover:bg-panel-raised hover:text-ink"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </Drawer>
    </>
  );
}