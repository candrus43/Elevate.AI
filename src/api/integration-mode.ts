/**
 * Integration Mode — Demo/Live toggle for all integrations.
 * 
 * Architecture:
 * 1. Master toggle on the Company (demo_mode column in companies table)
 * 2. User-level toggle (demo_mode + onboarding_completed in users table)
 * 3. Per-integration override (mode column in integrations table)
 * 
 * Resolution order:
 *   company.demo_mode ON → everything in demo (overrides all)
 *   user.demo_mode ON → user sees demo (even if company is live)
 *   user.onboarding_completed = false → user stays in demo
 *   integration.mode = 'demo' → that integration uses demo
 * 
 * Default: everything starts in demo mode
 */

import { sql } from "~/utils/sql";
import { db } from "./middleware";

export type IntegrationMode = "demo" | "live";

export interface ModeResolution {
  mode: IntegrationMode;
  reason: string;
}

/**
 * Resolve the effective mode for a user in a company for a specific integration.
 * Checks: company master toggle → user onboarding → user mode → integration override
 */
export async function resolveMode(companyId: string, userId: string, provider: string): Promise<ModeResolution> {
  // 1. Check company-level demo mode
  const company = await db(sql`SELECT demo_mode FROM companies WHERE id = ${companyId} LIMIT 1`);
  if (company.length > 0 && company[0].demo_mode === 1) {
    return { mode: "demo", reason: "Company demo mode is ON" };
  }

  // 2. Check user-level demo mode and onboarding
  const user = await db(sql`SELECT demo_mode, onboarding_completed FROM users WHERE id = ${userId} AND company_id = ${companyId} LIMIT 1`);
  if (user.length > 0) {
    if (user[0].onboarding_completed === 0) {
      return { mode: "demo", reason: "User has not completed onboarding" };
    }
    if (user[0].demo_mode === 1) {
      return { mode: "demo", reason: "User demo mode is ON" };
    }
  }

  // 3. Check per-integration override
  const integration = await db(sql`
    SELECT mode FROM integrations
    WHERE company_id = ${companyId} AND provider = ${provider} AND is_active = 1
    LIMIT 1
  `);
  if (integration.length > 0 && integration[0].mode === "demo") {
    return { mode: "demo", reason: `Integration ${provider} is in demo mode` };
  }

  return { mode: "live", reason: "All checks passed — live mode allowed" };
}

/**
 * Get the effective mode for a user. Convenience wrapper.
 */
export async function getEffectiveMode(companyId: string, userId: string, provider: string): Promise<IntegrationMode> {
  const resolved = await resolveMode(companyId, userId, provider);
  return resolved.mode;
}

/**
 * Set per-integration demo/live mode override.
 */
export async function setIntegrationMode(integrationId: string, companyId: string, mode: IntegrationMode): Promise<void> {
  await db(sql`
    UPDATE integrations SET mode = ${mode}, updated_at = datetime('now')
    WHERE id = ${integrationId} AND company_id = ${companyId}
  `);
}

/**
 * Set company-level demo mode (master toggle).
 */
export async function setCompanyDemoMode(companyId: string, demoMode: boolean): Promise<void> {
  await db(sql`
    UPDATE companies SET demo_mode = ${demoMode ? 1 : 0} WHERE id = ${companyId}
  `);
}

/**
 * Get company-level demo mode.
 */
export async function getCompanyDemoMode(companyId: string): Promise<boolean> {
  const result = await db(sql`SELECT demo_mode FROM companies WHERE id = ${companyId} LIMIT 1`);
  return result.length > 0 ? result[0].demo_mode === 1 : true;
}

/**
 * Set user-level demo mode.
 */
export async function setUserDemoMode(userId: string, companyId: string, demoMode: boolean): Promise<void> {
  await db(sql`
    UPDATE users SET demo_mode = ${demoMode ? 1 : 0} WHERE id = ${userId} AND company_id = ${companyId}
  `);
}

/**
 * Mark user onboarding as completed, enabling live mode access.
 */
export async function completeUserOnboarding(userId: string, companyId: string): Promise<void> {
  await db(sql`
    UPDATE users SET onboarding_completed = 1, demo_mode = 0 WHERE id = ${userId} AND company_id = ${companyId}
  `);
}

/**
 * Check if a user can access live data.
 */
export async function canAccessLiveData(userId: string, companyId: string): Promise<{ allowed: boolean; reason: string }> {
  // Check company
  const company = await db(sql`SELECT demo_mode FROM companies WHERE id = ${companyId} LIMIT 1`);
  if (company.length > 0 && company[0].demo_mode === 1) {
    return { allowed: false, reason: "Company is in demo mode" };
  }

  // Check user
  const user = await db(sql`SELECT demo_mode, onboarding_completed FROM users WHERE id = ${userId} AND company_id = ${companyId} LIMIT 1`);
  if (user.length > 0) {
    if (user[0].onboarding_completed === 0) {
      return { allowed: false, reason: "Onboarding not completed" };
    }
    if (user[0].demo_mode === 1) {
      return { allowed: false, reason: "User is in demo mode" };
    }
  }

  return { allowed: true, reason: "Live data access granted" };
}

/**
 * Check if a mode is "live".
 */
export function isLive(mode: IntegrationMode): boolean {
  return mode === "live";
}