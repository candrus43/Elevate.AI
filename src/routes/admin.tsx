import { LoadingSkeleton } from '~/components/GlassCard';
import { useEffect, useState } from "react";
import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import type { UserSession } from "~/components/layout/Header";
import { DashboardShell } from "~/components/layout/DashboardShell";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then(({ user }) => {
        if (!user) { navigate({ to: "/login" }); return; }
        if (user.role !== "admin") { navigate({ to: "/dashboard" }); return; }
        setUser(user);
        setLoading(false);
      })
      .catch(() => {
        navigate({ to: "/login" });
      });
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <LoadingSkeleton className="h-8 w-8 rounded-full" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <DashboardShell user={user}>
      <Outlet />
    </DashboardShell>
  );
}