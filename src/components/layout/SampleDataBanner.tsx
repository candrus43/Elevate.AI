/**
 * SampleDataBanner — honesty labeling for the demo organization.
 *
 * Renders a clear, dismissible banner stating that the figures shown are
 * illustrative sample data, not live metrics. Detection is based on the
 * session user's companySlug / companyName (the demo company is
 * "ElevateAI Demo" / slug "elevateai-demo").
 *
 * Do NOT reuse the old "demo mode" copy — that referred to the removed
 * simulated-AI toggle. This banner is purely about data honesty.
 */
import { useState } from "react";
import type { UserSession } from "~/utils/auth";

const DEMO_SLUG = "elevateai-demo";

function isSampleCompany(user: UserSession): boolean {
  return (
    user.companySlug === DEMO_SLUG ||
    /demo/i.test(user.companyName || "")
  );
}

export function SampleDataBanner({ user }: { user: UserSession }) {
  const [dismissed, setDismissed] = useState(false);

  if (!isSampleCompany(user) || dismissed) return null;

  return (
    <div
      role="status"
      className="mb-4 flex items-start gap-3 rounded-xl border border-accent-500/30 bg-accent-500/10 px-4 py-3 text-sm text-accent-200"
    >
      <span aria-hidden className="mt-0.5 text-base leading-none">ℹ️</span>
      <p className="flex-1">
        <span className="font-semibold text-accent-100">Sample data</span>
        {" — "}illustrative demo figures, not live performance.
      </p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss sample data notice"
        className="rounded-md px-1.5 text-accent-300 transition-colors hover:bg-accent-500/20 hover:text-accent-100"
      >
        ✕
      </button>
    </div>
  );
}
