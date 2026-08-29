import { LoadingSkeleton } from '~/components/GlassCard';
import { useEffect, useState } from "react";
import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import type { UserSession } from "~/utils/auth";
import { ExecutiveShell } from "~/components/layout/ExecutiveShell";

export const Route = createFileRoute("/executive")({
  component: ExecutiveLayout,
});

function ExecutiveLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then(({ user }) => {
        if (!user) {
          navigate({ to: "/login" });
          return;
        }
        // Only allow executive or admin roles to access executive dashboard
        if (user.role !== "executive" && user.role !== "admin") {
          navigate({ to: "/dashboard" });
          return;
        }
        setUser(user);
        setLoading(false);
      })
      .catch(() => {
        navigate({ to: "/login" });
      });
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-950">
        <div className="text-center">
          <LoadingSkeleton className="mx-auto mb-4 h-8 w-8 rounded-full" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-surface-950">
      <ExecutiveShell user={user}>
        <Outlet />
      </ExecutiveShell>
    </div>
  );
}