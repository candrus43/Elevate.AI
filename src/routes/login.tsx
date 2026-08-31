import { useState, useEffect } from "react";
import { BrandLogo } from "~/components/BrandLogo";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Button } from "~/components/ui";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

const gridStyle: React.CSSProperties = {
  backgroundImage:
    "radial-gradient(circle at 1px 1px, var(--color-edge) 1px, transparent 0)",
  backgroundSize: "40px 40px",
};

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then(({ user }) => {
        if (user) {
          setLoggedInUser(user);
        }
      })
      .catch(() => {});
  }, []);

  const handleSwitchAccount = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/logout", { method: "POST" });
      setLoggedInUser(null);
    } catch {}
    setLoggingOut(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await res.json();
      if (result.success && result.user) {
        const target = result.user.role === "admin" ? "/admin" : result.user.role === "executive" ? "/executive" : result.user.role === "manager" ? "/dashboard" : "/dashboard/rep";
        navigate({ to: target });
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Connection error. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas text-ink px-4">
      <div className="absolute inset-0 opacity-50" style={gridStyle} />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[400px] w-[400px] sm:h-[500px] sm:w-[500px] -translate-x-1/2 rounded-full bg-accent-600/20 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-edge bg-panel p-8">
          <div className="mb-8 text-center">
            <Link to="/" className="inline-flex items-center gap-2">
              <BrandLogo markClassName="h-9 w-9" wordmarkClassName="text-xl font-bold tracking-tight text-ink" />
            </Link>
            <p className="mt-2 text-sm text-ink-muted">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {loggedInUser && (
              <div className="rounded-lg bg-accent-500/10 p-3 text-sm text-accent-300 ring-1 ring-accent-500/25">
                <div className="flex items-center justify-between">
                  <span>Logged in as <strong>{loggedInUser.name}</strong> ({loggedInUser.role})</span>
                  <button
                    type="button"
                    onClick={handleSwitchAccount}
                    disabled={loggingOut}
                    className="text-xs font-medium text-accent-fg hover:text-accent-300 underline"
                  >
                    {loggingOut ? "Signing out..." : "Switch account"}
                  </button>
                </div>
              </div>
            )}
            {error && (
              <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400 ring-1 ring-red-500/25">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-ink-muted">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-edge bg-panel-raised px-4 py-2.5 text-sm text-ink placeholder-ink-faint focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-focus/40"
                placeholder="you@company.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-muted">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-edge bg-panel-raised px-4 py-2.5 text-sm text-ink placeholder-ink-faint focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-focus/40"
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" fullWidth disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-edge" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-panel px-2 text-ink-faint">or</span>
            </div>
          </div>

          <a
            href="/api/auth/saml/login"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-edge bg-panel-raised px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-graphite-850"
          >
            <svg className="h-5 w-5 text-ink-muted" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 3a1 1 0 100-2 1 1 0 000 2zm-2 4v3a1 1 0 102 0v-3h-2z" />
            </svg>
            Sign in with SSO
          </a>

          <p className="mt-6 text-center text-sm text-ink-faint">
            Don't have an account?{" "}
            <Link to="/register" className="font-medium text-accent-fg hover:text-accent-300">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}