import { useState, useEffect } from "react";
import { BrandLogo } from "~/components/BrandLogo";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Button } from "~/components/ui";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

const gridStyle: React.CSSProperties = {
  backgroundImage:
    "radial-gradient(circle at 1px 1px, var(--color-edge) 1px, transparent 0)",
  backgroundSize: "40px 40px",
};

async function apiRegister(name: string, email: string, password: string, companyName: string) {
  const res = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, companyName }),
  });
  return res.json();
}

async function apiGetSession() {
  const res = await fetch("/api/session");
  return res.json();
}

function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiGetSession().then(({ user }) => {
      if (user) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await apiRegister(name, email, password, companyName);
      if (result.success && result.user) {
        navigate({ to: "/dashboard" });
      } else {
        setError(result.error || "Registration failed");
      }
    } catch (err) {
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
            <p className="mt-2 text-sm text-ink-muted">Create your company account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400 ring-1 ring-red-500/25">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-ink-muted">Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-edge bg-panel-raised px-4 py-2.5 text-sm text-ink placeholder-ink-faint focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-focus/40"
                placeholder="Your Company Inc."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-muted">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-edge bg-panel-raised px-4 py-2.5 text-sm text-ink placeholder-ink-faint focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-focus/40"
                placeholder="John Doe"
                required
              />
            </div>

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
                placeholder="At least 6 characters"
                required
                minLength={6}
              />
            </div>

            <Button type="submit" fullWidth disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-faint">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-accent-fg hover:text-accent-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}