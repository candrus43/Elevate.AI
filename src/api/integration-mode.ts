/**
 * Integration Mode — Simplified to always return "live".
 * All demo/live toggle functionality has been removed.
 * Everything defaults to live mode.
 */

export type IntegrationMode = "live";

export interface ModeResolution {
  mode: IntegrationMode;
  reason: string;
}

/**
 * Always returns "live" mode. Demo/live toggling has been removed.
 */
export async function resolveMode(_companyId: string, _userId: string, _provider: string): Promise<ModeResolution> {
  return { mode: "live", reason: "Live mode is always active" };
}

/**
 * Always returns "live".
 */
export async function getEffectiveMode(_companyId: string, _userId: string, _provider: string): Promise<IntegrationMode> {
  return "live";
}

/**
 * No-op — integration mode is always live.
 */
export async function setIntegrationMode(_integrationId: string, _companyId: string, _mode: IntegrationMode): Promise<void> {
  // No-op: always live
}

/**
 * No-op — company demo mode has been removed.
 */
export async function setCompanyDemoMode(_companyId: string, _demoMode: boolean): Promise<void> {
  // No-op: always live
}

/**
 * Always returns false (not in demo mode).
 */
export async function getCompanyDemoMode(_companyId: string): Promise<boolean> {
  return false;
}

/**
 * No-op — user demo mode has been removed.
 */
export async function setUserDemoMode(_userId: string, _companyId: string, _demoMode: boolean): Promise<void> {
  // No-op: always live
}

/**
 * No-op — onboarding has been completed by default.
 */
export async function completeUserOnboarding(_userId: string, _companyId: string): Promise<void> {
  // No-op: onboarding auto-completed
}

/**
 * Always allows live data access.
 */
export async function canAccessLiveData(_userId: string, _companyId: string): Promise<{ allowed: boolean; reason: string }> {
  return { allowed: true, reason: "Live mode is always active" };
}

/**
 * Always returns true (always live).
 */
export function isLive(_mode: IntegrationMode): boolean {
  return true;
}
