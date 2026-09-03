/**
 * Single source of truth for "is this company's data illustrative sample data?"
 *
 * Three places used to answer this question independently and disagreed:
 *   - `handleLogin` / `handleSession` looked only at `companies.demo_mode`
 *   - the dashboard data endpoints looked at demo_mode OR slug OR name
 *   - `SampleDataBanner` looked at slug OR name
 *
 * The seeded demo company row carries `demo_mode = 0`, so the session endpoint
 * reported `isDemo: false` while the dashboard endpoints reported `true` for
 * the very same user — the header's demo badge stayed hidden over data that is
 * entirely seeded.
 *
 * `companies.demo_mode` is deliberately NOT consulted here:
 *   1. It is vestigial — integration mode is always "live" now
 *      (see `src/api/integration-mode.ts`, where every setter is a no-op).
 *   2. Its column default is 1 (`migrations.ts`), so every newly registered
 *      real customer would otherwise be labelled "Sample data".
 *
 * The honest signal is simply: is this the one seeded demo organisation?
 *
 * This module is intentionally dependency-free so both server code and React
 * components can import it.
 */

/** Slug of the single seeded demo organisation. */
export const DEMO_COMPANY_SLUG = "elevateai-demo";

export interface DemoCompanyInput {
  /** `companies.slug` */
  slug?: string | null;
  /** `companies.name` */
  name?: string | null;
}

/**
 * Returns true when the company's records are seeded sample data and the UI
 * must label them as such.
 *
 * Errs toward labelling: a company merely *named* "demo" is treated as sample
 * data, because an unnecessary honesty banner is far cheaper than presenting
 * seeded figures as real performance.
 */
export function isDemoCompany(company: DemoCompanyInput): boolean {
  if ((company.slug ?? "").toLowerCase() === DEMO_COMPANY_SLUG) return true;
  return /demo/i.test(company.name ?? "");
}
