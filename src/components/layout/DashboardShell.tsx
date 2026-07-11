import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import type { UserSession } from "~/utils/auth";

interface DashboardShellProps {
  user: UserSession;
  children: ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar
        user={user}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      {/* Desktop: ml matches sidebar width. Mobile: no ml, padding for bottom nav */}
      <div
        className={`transition-all duration-300 md:ml-60 pb-16 md:pb-0 ${
          sidebarCollapsed ? "md:!ml-16" : ""
        }`}
      >
        <Header user={user} />
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}