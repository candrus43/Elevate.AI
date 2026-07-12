/**
 * Database migrations for the Multi-Tenant Enterprise Platform.
 * Idempotent — safe to run multiple times. Uses IF NOT EXISTS and column checks.
 */

import { sql } from "~/utils/sql";
import { db } from "./middleware";

export async function runMigrations(): Promise<void> {
  console.log("Running database migrations...");

  // ── 1. Departments table (organizational units within a company) ──────────
  await db(sql`
    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      head_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      parent_department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(company_id, name)
    )
  `);

  // ── 2. Sub-teams table (child teams under departments) ───────────────────
  await db(sql`
    CREATE TABLE IF NOT EXISTS sub_teams (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      lead_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(company_id, name)
    )
  `);

  // ── 3. Feature flags (per-company feature toggles) ───────────────────────
  await db(sql`
    CREATE TABLE IF NOT EXISTS feature_flags (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      feature_key TEXT NOT NULL,
      is_enabled INTEGER NOT NULL DEFAULT 0,
      config TEXT DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(company_id, feature_key)
    )
  `);

  // ── 4. Audit log (compliance-grade event tracking) ──────────────────────
  await db(sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT,
      details TEXT DEFAULT '{}',
      ip_address TEXT DEFAULT '',
      user_agent TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  // Index for fast audit log queries
  await db(sql`
    CREATE INDEX IF NOT EXISTS idx_audit_logs_company_created
    ON audit_logs(company_id, created_at DESC)
  `);
  await db(sql`
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user
    ON audit_logs(user_id, created_at DESC)
  `);

  // ── 5. Usage metrics (granular per-tenant usage tracking) ────────────────
  await db(sql`
    CREATE TABLE IF NOT EXISTS usage_metrics (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      metric_key TEXT NOT NULL,
      metric_value REAL NOT NULL DEFAULT 0,
      recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(company_id, metric_key, recorded_at)
    )
  `);

  // ── 6. Scheduled reports configuration ──────────────────────────────────
  await db(sql`
    CREATE TABLE IF NOT EXISTS scheduled_reports (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      report_type TEXT NOT NULL,
      schedule TEXT NOT NULL DEFAULT 'weekly',
      recipients TEXT DEFAULT '[]',
      config TEXT DEFAULT '{}',
      is_active INTEGER NOT NULL DEFAULT 1,
      last_sent_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // ── 7. Add departments support to existing tables ───────────────────────
  // Check if department_id column exists in teams table
  const teamColumns = await db(sql`PRAGMA table_info(teams)`);
  const hasDeptId = teamColumns.some((c: any) => c.name === "department_id");
  if (!hasDeptId) {
    await db(sql`ALTER TABLE teams ADD COLUMN department_id TEXT REFERENCES departments(id) ON DELETE SET NULL`);
    await db(sql`ALTER TABLE teams ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1`);
  }

  // Check if department_id / sub_team_id columns exist in users table
  const userColumns = await db(sql`PRAGMA table_info(users)`);
  const hasUserDept = userColumns.some((c: any) => c.name === "department_id");
  if (!hasUserDept) {
    await db(sql`ALTER TABLE users ADD COLUMN department_id TEXT REFERENCES departments(id) ON DELETE SET NULL`);
    await db(sql`ALTER TABLE users ADD COLUMN sub_team_id TEXT REFERENCES sub_teams(id) ON DELETE SET NULL`);
  }

  // ── 8. Add white_label config to companies table ────────────────────────
  const companyColumns = await db(sql`PRAGMA table_info(companies)`);
  if (!companyColumns.some((c: any) => c.name === "white_label")) {
    await db(sql`ALTER TABLE companies ADD COLUMN white_label TEXT DEFAULT '{}'`);
  }
  if (!companyColumns.some((c: any) => c.name === "max_users")) {
    await db(sql`ALTER TABLE companies ADD COLUMN max_users INTEGER DEFAULT 10`);
  }
  if (!companyColumns.some((c: any) => c.name === "features")) {
    await db(sql`ALTER TABLE companies ADD COLUMN features TEXT DEFAULT '{}'`);
  }

  // ── 9. SSO/SAML configuration table ─────────────────────────────────────────
  const ssoExists = await db(sql`SELECT name FROM sqlite_master WHERE type='table' AND name='sso_config'`);
  if (ssoExists.length === 0) {
    await db(sql`
      CREATE TABLE sso_config (
        id TEXT PRIMARY KEY,
        company_id TEXT UNIQUE NOT NULL,
        entity_id TEXT NOT NULL DEFAULT '',
        acs_url TEXT NOT NULL DEFAULT '',
        audience_url TEXT NOT NULL DEFAULT '',
        idp_entity_id TEXT NOT NULL DEFAULT '',
        idp_sso_url TEXT NOT NULL DEFAULT '',
        idp_slo_url TEXT NOT NULL DEFAULT '',
        idp_certificate TEXT NOT NULL DEFAULT '',
        idp_metadata TEXT NOT NULL DEFAULT '',
        attribute_mapping TEXT NOT NULL DEFAULT '{}',
        enabled INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (company_id) REFERENCES companies(id)
      )
    `);
    console.log("SSO: Created sso_config table");
  }

  console.log("Migrations complete.");
}