import { useState, type ReactNode } from "react";
import { ExecSidebar } from "./ExecSidebar";
import { Header } from "./Header";
import { SampleDataBanner } from "./SampleDataBanner";
import type { UserSession } from "~/utils/auth";

interface ExecutiveShellProps {
  user: UserSession;
  children: ReactNode;
}

export function ExecutiveShell({ user, children }: ExecutiveShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen" style={{
      background: "linear-gradient(135deg, #0b0d1a 0%, #120f24 30%, #0f1729 60%, #0a0d1a 100%)",
    }}>
      {/* Subtle ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-accent-600/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent-600/5 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 h-64 w-64 rounded-full bg-accent-600/10 blur-3xl" />
      </div>
      <ExecSidebar
        user={user}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      {/* Desktop: ml matches sidebar width. Mobile: no ml, padding for bottom nav */}
      <div
        className={`relative z-10 transition-all duration-300 md:ml-60 pb-16 md:pb-0 ${
          sidebarCollapsed ? "md:!ml-16" : ""
        }`}
      >
        <Header user={user} />
        <main className="p-4 sm:p-6">
          <SampleDataBanner user={user} />
          {children}
        </main>
      </div>
    </div>
  );
}