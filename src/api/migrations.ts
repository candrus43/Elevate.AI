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

  // ── 10. Integration mode column (demo/live toggle) ──────────────────────────
  try {
    await db(sql`ALTER TABLE integrations ADD COLUMN mode TEXT NOT NULL DEFAULT 'demo'`);
    console.log("Integrations: Added mode column (demo/live toggle)");
  } catch {
    console.log("Integrations: mode column already exists");
  }

  // ── 11. Company demo_mode column (master toggle) ───────────────────────────
  try {
    await db(sql`ALTER TABLE companies ADD COLUMN demo_mode INTEGER NOT NULL DEFAULT 1`);
    console.log("Companies: Added demo_mode column (default ON)");
  } catch {
    console.log("Companies: demo_mode column already exists");
  }

  // ── 12. User demo_mode and onboarding columns ──────────────────────────────
  try {
    await db(sql`ALTER TABLE users ADD COLUMN demo_mode INTEGER NOT NULL DEFAULT 1`);
    console.log("Users: Added demo_mode column (default ON)");
  } catch {
    console.log("Users: demo_mode column already exists");
  }
  try {
    await db(sql`ALTER TABLE users ADD COLUMN onboarding_completed INTEGER NOT NULL DEFAULT 0`);
    console.log("Users: Added onboarding_completed column (default false)");
  } catch {
    console.log("Users: onboarding_completed column already exists");
  }

  // ── 13. OpenAI configuration table ─────────────────────────────────────────
  await db(sql`
    CREATE TABLE IF NOT EXISTS openai_config (
      id TEXT PRIMARY KEY,
      company_id TEXT UNIQUE NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      api_key TEXT NOT NULL DEFAULT '',
      model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
      max_tokens INTEGER NOT NULL DEFAULT 4096,
      organization_id TEXT NOT NULL DEFAULT '',
      base_url TEXT NOT NULL DEFAULT 'https://api.openai.com/v1',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  console.log("OpenAI: Created openai_config table");

  // Add base_url column if upgrading from older schema
  try {
    await db(sql`ALTER TABLE openai_config ADD COLUMN base_url TEXT NOT NULL DEFAULT 'https://api.openai.com/v1'`);
    console.log("OpenAI: Added base_url column");
  } catch {
    console.log("OpenAI: base_url column already exists");
  }

  // ── 14. Observe.ai configuration table ──────────────────────────────────────
  await db(sql`
    CREATE TABLE IF NOT EXISTS observeai_config (
      id TEXT PRIMARY KEY,
      company_id TEXT UNIQUE NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      api_key TEXT NOT NULL DEFAULT '',
      instance_url TEXT NOT NULL DEFAULT 'https://api.observe.ai/v1',
      webhook_secret TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  console.log("Observe.ai: Created observeai_config table");

  // ── 15. Onboarding steps table ───────────────────────────────────────────
  await db(sql`
    CREATE TABLE IF NOT EXISTS onboarding_steps (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      step_key TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      data TEXT DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(company_id, step_key)
    )
  `);
  console.log("Onboarding: Created onboarding_steps table");

  // ── 16. Add agent_filter column to observeai_config ──────────────────────
  try {
    const observeColumns = await db(sql`PRAGMA table_info(observeai_config)`);
    if (!observeColumns.some((c: any) => c.name === "agent_filter")) {
      await db(sql`ALTER TABLE observeai_config ADD COLUMN agent_filter TEXT DEFAULT ''`);
      console.log("Observe.ai: Added agent_filter column");
    } else {
      console.log("Observe.ai: agent_filter column already exists");
    }
  } catch {
    console.log("Observe.ai: Could not check/add agent_filter column");
  }

  // ── 17. KPI Engine ─────────────────────────────────────────────────────────
  // kpi_definitions — configurable KPI definitions per company
  await db(sql`
    CREATE TABLE IF NOT EXISTS kpi_definitions (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      category TEXT NOT NULL DEFAULT 'SALES_PERFORMANCE',
      data_source TEXT NOT NULL DEFAULT 'AI_CALL_ANALYSIS',
      formula TEXT DEFAULT '',
      target REAL,
      min_acceptable REAL,
      weight REAL DEFAULT 1.0,
      display_format TEXT DEFAULT 'number',
      department_id TEXT,
      team_id TEXT,
      role TEXT DEFAULT '',
      campaign_id TEXT,
      product_id TEXT,
      effective_date TEXT,
      expiration_date TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      is_visible_executive INTEGER NOT NULL DEFAULT 1,
      is_visible_manager INTEGER NOT NULL DEFAULT 1,
      is_visible_agent INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // kpi_profiles — named collections of KPIs
  await db(sql`
    CREATE TABLE IF NOT EXISTS kpi_profiles (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // kpi_profile_items — join table between profiles and definitions
  await db(sql`
    CREATE TABLE IF NOT EXISTS kpi_profile_items (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL REFERENCES kpi_profiles(id) ON DELETE CASCADE,
      kpi_definition_id TEXT NOT NULL REFERENCES kpi_definitions(id) ON DELETE CASCADE,
      weight_override REAL,
      target_override REAL,
      sort_order INTEGER DEFAULT 0,
      UNIQUE(profile_id, kpi_definition_id)
    )
  `);

  // kpi_measurements — materialized KPI snapshots (never assumed)
  await db(sql`
    CREATE TABLE IF NOT EXISTS kpi_measurements (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      kpi_definition_id TEXT NOT NULL REFERENCES kpi_definitions(id) ON DELETE CASCADE,
      entity_type TEXT NOT NULL DEFAULT 'user',
      entity_id TEXT NOT NULL,
      period_start TEXT NOT NULL,
      period_end TEXT NOT NULL,
      value REAL NOT NULL,
      source TEXT DEFAULT 'system',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  await db(sql`
    CREATE INDEX IF NOT EXISTS idx_kpi_measurements_lookup
    ON kpi_measurements(company_id, kpi_definition_id, entity_type, entity_id, period_start)
  `);
  console.log("KPI Engine: Created kpi_definitions, kpi_profiles, kpi_profile_items, kpi_measurements tables");

  console.log("Migrations complete.");
}