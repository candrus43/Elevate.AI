import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/webhooks")({
  component: Webhooks,
});

function Webhooks() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      setLoading(false);
    });
  }, [navigate]);

  if (loading) return <div className="flex items-center justify-center h-48"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate({ to: "/dashboard/integrations" })} className="text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&larr;</button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Webhooks</h1>
          <p className="text-sm text-gray-500">Manage webhook endpoints for event-driven integrations</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Webhooks</h3>
          <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">+ Add Endpoint</button>
        </div>

        <div className="space-y-3">
          {[
            { url: "https://api.example.com/webhooks/elevateai", events: "call.analyzed, coaching.completed", status: "active", lastDelivery: "2 min ago" },
            { url: "https://hooks.slack.com/services/T...", events: "coaching.suggestion", status: "active", lastDelivery: "15 min ago" },
            { url: "https://api.acme.com/hooks/elevate", events: "user.created, user.updated", status: "disabled", lastDelivery: "2 days ago" },
          ].map((hook, i) => (
            <div key={i} className="flex items-start justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`h-2 w-2 rounded-full ${hook.status === "active" ? "bg-green-500" : "bg-gray-400"}`} />
                  <code className="text-sm text-gray-900 dark:text-white truncate block">{hook.url}</code>
                </div>
                <p className="text-xs text-gray-500 mt-1">Events: {hook.events}</p>
                <p className="text-xs text-gray-400 mt-0.5">Last delivery: {hook.lastDelivery}</p>
              </div>
              <button className={`rounded-lg px-3 py-1.5 text-xs font-medium ml-4 ${hook.status === "active" ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30" : "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30"}`}>
                {hook.status === "active" ? "Disable" : "Enable"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}