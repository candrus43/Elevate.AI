/**
 * SQL tagged template literal — safe parameterized query builder for team-db.
 *
 * Usage:
 *   const rows = await db(sql`SELECT * FROM users WHERE email = ${email}`)
 *
 * Values are automatically escaped:
 *   Strings → 'escaped' (single quotes doubled)
 *   Numbers → unquoted, validated numeric
 *   Booleans → 1 / 0
 *   null/undefined → NULL
 *
 * For identifiers (table/column names that the app controls, not user input):
 *   sqlid`users` → "users"
 *
 * IMPORTANT: Never interpolate user-controlled values as identifiers.
 */

// ─── Escape a single value for SQL ─────────────────────────

export function esc(val: unknown): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "boolean") return val ? "1" : "0";
  if (typeof val === "number") {
    if (!Number.isFinite(val)) return "NULL";
    return String(val);
  }
  // Strings (and everything else) — escape single quotes
  const str = String(val);
  return "'" + str.replace(/'/g, "''") + "'";
}

// ─── Tagged template: sql`SELECT * FROM t WHERE col = ${val}` ──

export function sql(
  strings: TemplateStringsArray,
  ...values: unknown[]
): string {
  let result = "";
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) {
      result += esc(values[i]);
    }
  }
  return result;
}

// ─── Tagged template for identifiers (safe, app-controlled names) ──

export function sqlid(
  strings: TemplateStringsArray,
  ...values: unknown[]
): string {
  let result = "";
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) {
      // Double-quote and escape double-quotes
      result += '"' + String(values[i]).replace(/"/g, '""') + '"';
    }
  }
  return result;
}