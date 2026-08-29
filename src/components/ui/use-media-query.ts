import { useSyncExternalStore } from "react";

/**
 * Hydration-safe media-query hook.
 *
 * Uses `useSyncExternalStore` so the server snapshot (`false`) matches the
 * initial client snapshot during hydration — no React hydration mismatch —
 * then subscribes to `matchMedia` change events and re-renders when the query
 * result flips.
 *
 * Keep this dependency-free on purpose: it mirrors the rest of the primitive
 * library (no external hook packages).
 */

const MOBILE_QUERY = "(max-width: 767px)";

function subscribe(query: string, callback: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) {
    return () => {};
  }
  const mql = window.matchMedia(query);
  // Modern API (all evergreen + Safari 14+)
  mql.addEventListener?.("change", callback);
  return () => mql.removeEventListener?.("change", callback);
}

function getClientSnapshot(query: string) {
  return typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia(query).matches
    : false;
}

/** Server snapshot is always `false` — fixed, so hydration stays consistent. */
function getServerSnapshot() {
  return false;
}

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => subscribe(query, callback),
    () => getClientSnapshot(query),
    getServerSnapshot,
  );
}

/**
 * Convenience: `true` below 768px — matches the Tailwind `md:` breakpoint used
 * throughout the app (see `Sidebar` bottom nav, `DashboardShell` padding, etc.).
 */
export function useIsMobile(): boolean {
  return useMediaQuery(MOBILE_QUERY);
}
