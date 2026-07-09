# ElevateAI — Database Schema Documentation

> Last updated: 2026-07-07
> Schema owner: Full-Stack Engineer

## Overview

SQLite database (Turso-synced) powering the ElevateAI multi-tenant enterprise sales coaching platform. All queries go through the `team-db` CLI.

Total: **27 custom tables** (25 original + `certifications`, `analytics_events`) across 10 business domains.

---

## Entity-Relationship Summary

```
companies ──┬── teams ──┬── users
             │            │
             │            ├── calls ──┬── call_analyses
             │            │           ├── call_scores
             │            │           └── compliance_checks
             │            │
             │            ├── coaching_plans ──┬── coaching_plan_items
             │            ├── live_coaching_sessions
             │            ├── role_play_sessions
             │            ├── points_events
             │            ├── user_badges ──┬── badges
             │            ├── leaderboard_entries ──┬── leaderboards
             │            ├── user_course_progress ──┬── course_modules ──┬── courses
             │            ├── user_metrics
             │            ├── certifications
             │            └── analytics_events
             │
             ├── scorecards ──┬── scorecard_criteria
             ├── compliance_rules
             ├── integrations ──┬── sync_logs
             ├── courses
             ├── leaderboards
             ├── badges
             └── company_metrics
```

---

## Tables

### 1. Multi-Tenant Core

#### `companies`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| name | TEXT | NOT NULL | Company/org name |
| slug | TEXT | NOT NULL, UNIQUE | URL-friendly identifier |
| tier | TEXT | NOT NULL, CHECK IN ('core','pro','enterprise') | Subscription tier |
| settings | TEXT | DEFAULT '{}' | JSON blob for company settings |
| is_active | INTEGER | NOT NULL DEFAULT 1 | Soft-delete / suspension |
| created_at | TEXT | NOT NULL DEFAULT datetime('now') | ISO 8601 |
| updated_at | TEXT | NOT NULL DEFAULT datetime('now') | ISO 8601 |

#### `teams`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| company_id | TEXT | NOT NULL, FK → companies(id) ON DELETE CASCADE | Tenant |
| name | TEXT | NOT NULL | Team name |
| description | TEXT | DEFAULT '' | Team description |
| created_at | TEXT | NOT NULL DEFAULT datetime('now') | |
| updated_at | TEXT | NOT NULL DEFAULT datetime('now') | |
| UNIQUE(company_id, name) | | | No duplicate team names per company |

#### `users`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| company_id | TEXT | NOT NULL, FK → companies(id) ON DELETE CASCADE | Tenant |
| email | TEXT | NOT NULL | Login email |
| password_hash | TEXT | NOT NULL | bcrypt/argon2 hash |
| name | TEXT | NOT NULL | Display name |
| role | TEXT | NOT NULL, CHECK IN ('admin','manager','rep') | Platform role |
| team_id | TEXT | FK → teams(id) ON DELETE SET NULL | Team membership |
| avatar_url | TEXT | DEFAULT '' | Profile image |
| is_active | INTEGER | NOT NULL DEFAULT 1 | Account active flag |
| last_login_at | TEXT | | Last login timestamp (ISO 8601) |
| created_at | TEXT | NOT NULL DEFAULT datetime('now') | |
| updated_at | TEXT | NOT NULL DEFAULT datetime('now') | |
| UNIQUE(company_id, email) | | | One email per tenant |

#### `sessions`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| user_id | TEXT | NOT NULL, FK → users(id) ON DELETE CASCADE | User |
| token | TEXT | NOT NULL, UNIQUE | Session token (crypto random) |
| expires_at | TEXT | NOT NULL | Expiry timestamp |
| created_at | TEXT | NOT NULL DEFAULT datetime('now') | |

---

### 2. Call Recording & Analysis

#### `calls`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| company_id | TEXT | NOT NULL, FK → companies(id) ON DELETE CASCADE | Tenant |
| user_id | TEXT | NOT NULL, FK → users(id) ON DELETE CASCADE | Rep who made the call |
| external_id | TEXT | DEFAULT '' | ID from dialer integration |
| direction | TEXT | NOT NULL, CHECK IN ('inbound','outbound') | Call direction |
| duration_seconds | INTEGER | DEFAULT 0 | Call length |
| started_at | TEXT | | When call started |
| ended_at | TEXT | | When call ended |
| status | TEXT | NOT NULL, CHECK IN ('processing','analyzed','failed') | Analysis status |
| recording_url | TEXT | DEFAULT '' | URL to audio recording |
| transcript | TEXT | DEFAULT '' | Full transcript text |
| created_at | TEXT | NOT NULL DEFAULT datetime('now') | |
| updated_at | TEXT | NOT NULL DEFAULT datetime('now') | |

#### `call_analyses`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| call_id | TEXT | NOT NULL, UNIQUE, FK → calls(id) ON DELETE CASCADE | 1:1 with calls |
| overall_score | REAL | DEFAULT 0.0 | 0–100 AI score |
| sentiment | TEXT | DEFAULT 'neutral' | Call sentiment analysis |
| talk_ratio_rep | REAL | DEFAULT 0.5 | % of time rep spoke |
| talk_ratio_customer | REAL | DEFAULT 0.5 | % of time customer spoke |
| avg_pace_wpm | REAL | DEFAULT 0.0 | Words per minute |
| filler_word_count | INTEGER | DEFAULT 0 | "um", "uh", "like" count |
| key_topics | TEXT | DEFAULT '[]' | JSON array of topics |
| summary | TEXT | DEFAULT '' | AI-generated summary |
| objections_detected | TEXT | DEFAULT '[]' | JSON array of objections |
| compliance_issues | TEXT | DEFAULT '[]' | JSON compliance flags |
| created_at | TEXT | NOT NULL DEFAULT datetime('now') | |

---

### 3. Scorecards & Grading

#### `scorecards`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| company_id | TEXT | NOT NULL, FK → companies(id) | Tenant |
| name | TEXT | NOT NULL | Scorecard name |
| description | TEXT | DEFAULT '' | |
| is_default | INTEGER | NOT NULL DEFAULT 0 | Default scorecard flag |
| created_at | TEXT | NOT NULL DEFAULT datetime('now') | |
| updated_at | TEXT | NOT NULL DEFAULT datetime('now') | |
| UNIQUE(company_id, name) | | | |

#### `scorecard_criteria`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| scorecard_id | TEXT | NOT NULL, FK → scorecards(id) ON DELETE CASCADE | Parent scorecard |
| name | TEXT | NOT NULL | Criterion name (e.g. "Greeting") |
| description | TEXT | DEFAULT '' | |
| max_score | REAL | NOT NULL DEFAULT 10.0 | Max points for this criterion |
| weight | REAL | NOT NULL DEFAULT 1.0 | Weighting factor |
| category | TEXT | DEFAULT '' | Grouping category |
| sort_order | INTEGER | DEFAULT 0 | Display order |
| created_at | TEXT | NOT NULL DEFAULT datetime('now') | |

#### `call_scores`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| call_id | TEXT | NOT NULL, FK → calls(id) ON DELETE CASCADE | Scored call |
| scorecard_id | TEXT | NOT NULL, FK → scorecards(id) ON DELETE CASCADE | Which scorecard |
| total_score | REAL | DEFAULT 0.0 | Computed total |
| criteria_scores | TEXT | DEFAULT '{}' | JSON: {criterion_id: score} |
| reviewer_id | TEXT | FK → users(id) ON DELETE SET NULL | Manager/AI reviewer |
| notes | TEXT | DEFAULT '' | Review notes |
| created_at | TEXT | NOT NULL DEFAULT datetime('now') | |
| UNIQUE(call_id, scorecard_id) | | | One score per call per scorecard |

---

### 4. Coaching

#### `coaching_plans`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| company_id | TEXT | NOT NULL, FK → companies(id) | Tenant |
| user_id | TEXT | NOT NULL, FK → users(id) ON DELETE CASCADE | Rep being coached |
| manager_id | TEXT | FK → users(id) ON DELETE SET NULL | Coach/manager |
| title | TEXT | NOT NULL | Plan title |
| description | TEXT | DEFAULT '' | |
| status | TEXT | NOT NULL, CHECK IN ('active','completed','cancelled') | Current state |
| due_date | TEXT | | Target completion |
| created_at | TEXT | NOT NULL DEFAULT datetime('now') | |
| completed_at | TEXT | | When completed |
| updated_at | TEXT | NOT NULL DEFAULT datetime('now') | |

#### `coaching_plan_items`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| coaching_plan_id | TEXT | NOT NULL, FK → coaching_plans(id) ON DELETE CASCADE | Parent plan |
| title | TEXT | NOT NULL | Item title |
| description | TEXT | DEFAULT '' | |
| resource_url | TEXT | DEFAULT '' | Link to learning material |
| status | TEXT | NOT NULL, CHECK IN ('pending','completed') | |
| sort_order | INTEGER | DEFAULT 0 | |
| completed_at | TEXT | | |
| created_at | TEXT | NOT NULL DEFAULT datetime('now') | |

#### `live_coaching_sessions`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| company_id | TEXT | NOT NULL, FK → companies(id) | Tenant |
| user_id | TEXT | NOT NULL, FK → users(id) | Rep |
| coach_id | TEXT | FK → users(id) ON DELETE SET NULL | Coach |
| call_id | TEXT | FK → calls(id) ON DELETE SET NULL | Associated live call |
| notes | TEXT | DEFAULT '' | Session notes |
| started_at | TEXT | | |
| ended_at | TEXT | | |
| created_at | TEXT | NOT NULL DEFAULT datetime('now') | |

#### `role_play_sessions`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| company_id | TEXT | NOT NULL, FK → companies(id) | Tenant |
| user_id | TEXT | NOT NULL, FK → users(id) | Rep |
| scenario | TEXT | NOT NULL | Role-play scenario description |
| score | REAL | DEFAULT 0.0 | AI score |
| feedback | TEXT | DEFAULT '' | AI feedback |
| duration_seconds | INTEGER | DEFAULT 0 | |
| created_at | TEXT | NOT NULL DEFAULT datetime('now') | |

---

### 5. Gamification

#### `points_events`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| company_id | TEXT | NOT NULL, FK → companies(id) | Tenant |
| user_id | TEXT | NOT NULL, FK → users(id) | User |
| event_type | TEXT | NOT NULL | e.g. 'call_analyzed', 'coaching_completed' |
| points | INTEGER | NOT NULL DEFAULT 0 | Points awarded |
| description | TEXT | DEFAULT '' | Human-readable reason |
| created_at | TEXT | NOT NULL DEFAULT datetime('now') | |

#### `badges`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| company_id | TEXT | NOT NULL, FK → companies(id) | Tenant |
| name | TEXT | NOT NULL | Badge name |
| description | TEXT | DEFAULT '' | |
| icon_url | TEXT | DEFAULT '' | Badge image |
| criteria | TEXT | DEFAULT '{}' | JSON criteria for earning |
| created_at | TEXT | NOT NULL DEFAULT datetime('now') | |
| UNIQUE(company_id, name) | | | |

#### `user_badges`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| user_id | TEXT | NOT NULL, FK → users(id) ON DELETE CASCADE | User |
| badge_id | TEXT | NOT NULL, FK → badges(id) ON DELETE CASCADE | Badge |
| awarded_at | TEXT | NOT NULL DEFAULT datetime('now') | |
| UNIQUE(user_id, badge_id) | | | One award per badge per user |

#### `leaderboards`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| company_id | TEXT | NOT NULL, FK → companies(id) | Tenant |
| name | TEXT | NOT NULL | Leaderboard name |
| period | TEXT | NOT NULL, CHECK IN ('weekly','monthly','quarterly','all_time') | Reset cycle |
| is_active | INTEGER | NOT NULL DEFAULT 1 | |
| created_at | TEXT | NOT NULL DEFAULT datetime('now') | |
| UNIQUE(company_id, name) | | | |

#### `leaderboard_entries`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| leaderboard_id | TEXT | NOT NULL, FK → leaderboards(id) ON DELETE CASCADE | |
| user_id | TEXT | NOT NULL, FK → users(id) ON DELETE CASCADE | |
| score | REAL | NOT NULL DEFAULT 0.0 | |
| rank | INTEGER | DEFAULT 0 | Computed rank |
| period_start | TEXT | NOT NULL | ISO 8601 period start |
| period_end | TEXT | NOT NULL | ISO 8601 period end |
| created_at | TEXT | NOT NULL DEFAULT datetime('now') | |
| UNIQUE(leaderboard_id, user_id, period_start) | | | One entry per user per period |

---

### 6. Certifications

#### `certifications`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| user_id | TEXT | NOT NULL, FK → users(id) ON DELETE CASCADE | |
| name | TEXT | NOT NULL | Certification name |
| description | TEXT | DEFAULT '' | |
| issued_at | TEXT | NOT NULL DEFAULT datetime('now') | Date issued |
| expires_at | TEXT | | Expiration date |
| badge_url | TEXT | DEFAULT '' | Badge image URL |
| created_at | TEXT | NOT NULL DEFAULT datetime('now') | |

---

### 6. Learning Center

#### `courses`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| company_id | TEXT | NOT NULL, FK → companies(id) | Tenant |
| title | TEXT | NOT NULL | |
| description | TEXT | DEFAULT '' | |
| category | TEXT | DEFAULT '' | e.g. 'Objection Handling' |
| difficulty | TEXT | CHECK IN ('beginner','intermediate','advanced') | |
| duration_minutes | INTEGER | DEFAULT 0 | |
| is_required | INTEGER | NOT NULL DEFAULT 0 | Mandatory training flag |
| created_at | TEXT | NOT NULL DEFAULT datetime('now') | |
| updated_at | TEXT | NOT NULL DEFAULT datetime('now') | |
| UNIQUE(company_id, title) | | | |

#### `course_modules`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| course_id | TEXT | NOT NULL, FK → courses(id) ON DELETE CASCADE | |
| title | TEXT | NOT NULL | Module title |
| content_type | TEXT | NOT NULL, CHECK IN ('video','article','quiz') | Content format |
| content_url | TEXT | DEFAULT '' | Link to content |
| order_index | INTEGER | DEFAULT 0 | Sequence position |
| duration_minutes | INTEGER | DEFAULT 0 | |
| created_at | TEXT | NOT NULL DEFAULT datetime('now') | |

#### `user_course_progress`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| user_id | TEXT | NOT NULL, FK → users(id) ON DELETE CASCADE | |
| course_module_id | TEXT | NOT NULL, FK → course_modules(id) ON DELETE CASCADE | |
| status | TEXT | NOT NULL, CHECK IN ('not_started','in_progress','completed') | |
| score | REAL | DEFAULT 0.0 | Quiz score if applicable |
| completed_at | TEXT | | |
| created_at | TEXT | NOT NULL DEFAULT datetime('now') | |
| updated_at | TEXT | NOT NULL DEFAULT datetime('now') | |
| UNIQUE(user_id, course_module_id) | | | |

---

### 7. Compliance Monitoring

#### `compliance_rules`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| company_id | TEXT | NOT NULL, FK → companies(id) | Tenant |
| name | TEXT | NOT NULL | Rule name |
| description | TEXT | DEFAULT '' | |
| script_required_phrases | TEXT | DEFAULT '[]' | JSON array of required phrases |
| prohibited_phrases | TEXT | DEFAULT '[]' | JSON array of banned phrases |
| is_active | INTEGER | NOT NULL DEFAULT 1 | |
| created_at | TEXT | NOT NULL DEFAULT datetime('now') | |
| updated_at | TEXT | NOT NULL DEFAULT datetime('now') | |
| UNIQUE(company_id, name) | | | |

#### `compliance_checks`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| call_id | TEXT | NOT NULL, FK → calls(id) ON DELETE CASCADE | |
| rule_id | TEXT | NOT NULL, FK → compliance_rules(id) ON DELETE CASCADE | |
| passed | INTEGER | NOT NULL DEFAULT 0 | Boolean 0/1 |
| details | TEXT | DEFAULT '' | Explanation |
| created_at | TEXT | NOT NULL DEFAULT datetime('now') | |
| UNIQUE(call_id, rule_id) | | | One check per rule per call |

---

### 8. Integrations

#### `integrations`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| company_id | TEXT | NOT NULL, FK → companies(id) | Tenant |
| provider | TEXT | NOT NULL | e.g. salesforce, hubspot, five9, twilio |
| credentials | TEXT | DEFAULT '{}' | Encrypted credentials JSON |
| config | TEXT | DEFAULT '{}' | Integration config JSON |
| is_active | INTEGER | NOT NULL DEFAULT 1 | |
| last_sync_at | TEXT | | Last successful sync |
| created_at | TEXT | NOT NULL DEFAULT datetime('now') | |
| updated_at | TEXT | NOT NULL DEFAULT datetime('now') | |
| UNIQUE(company_id, provider) | | | One integration per provider per company |

#### `sync_logs`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| integration_id | TEXT | NOT NULL, FK → integrations(id) ON DELETE CASCADE | |
| status | TEXT | NOT NULL, CHECK IN ('success','failed','partial') | |
| records_synced | INTEGER | DEFAULT 0 | |
| error_message | TEXT | DEFAULT '' | |
| synced_at | TEXT | NOT NULL DEFAULT datetime('now') | |

---

### 9. Analytics & Metrics

#### `analytics_events`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| company_id | TEXT | NOT NULL, FK → companies(id) ON DELETE CASCADE | Tenant |
| user_id | TEXT | FK → users(id) ON DELETE SET NULL | User (nullable for system events) |
| event_type | TEXT | NOT NULL | e.g. 'login', 'call_analyzed', 'coaching_completed' |
| properties | TEXT | DEFAULT '{}' | JSON blob with event-specific data |
| created_at | TEXT | NOT NULL DEFAULT datetime('now') | |

#### `user_metrics`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| user_id | TEXT | NOT NULL, FK → users(id) ON DELETE CASCADE | |
| company_id | TEXT | NOT NULL, FK → companies(id) ON DELETE CASCADE | |
| period | TEXT | NOT NULL | e.g. 'weekly', 'monthly' |
| calls_analyzed | INTEGER | DEFAULT 0 | |
| avg_score | REAL | DEFAULT 0.0 | Average call score |
| coaching_completed | INTEGER | DEFAULT 0 | Plans completed |
| conversion_rate | REAL | DEFAULT 0.0 | |
| period_start | TEXT | NOT NULL | ISO 8601 |
| period_end | TEXT | NOT NULL | ISO 8601 |
| created_at | TEXT | NOT NULL DEFAULT datetime('now') | |
| UNIQUE(user_id, period, period_start) | | | |

#### `company_metrics`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| company_id | TEXT | NOT NULL, FK → companies(id) ON DELETE CASCADE | |
| period | TEXT | NOT NULL | |
| active_users | INTEGER | DEFAULT 0 | |
| calls_analyzed | INTEGER | DEFAULT 0 | |
| avg_team_score | REAL | DEFAULT 0.0 | |
| coaching_completion_rate | REAL | DEFAULT 0.0 | |
| period_start | TEXT | NOT NULL | |
| period_end | TEXT | NOT NULL | |
| created_at | TEXT | NOT NULL DEFAULT datetime('now') | |
| UNIQUE(company_id, period, period_start) | | | |

---

## Indexing Strategy

Primary keys (TEXT UUID) are auto-indexed. For query performance, consider creating indexes on:

- `calls(company_id, user_id, started_at)` — rep call history
- `calls(status, created_at)` — pending analysis queue
- `call_analyses(overall_score)` — score-range queries
- `coaching_plans(user_id, status)` — active coaching plans
- `points_events(user_id, created_at)` — gamification totals
- `sessions(token)` — auth lookups (already UNIQUE)

Add indexes via `team-db "CREATE INDEX IF NOT EXISTS idx_... ON table(col1, col2)"`.

---

## Usage Notes

- All IDs are UUID v4 strings (TEXT).
- Timestamps are ISO 8601 TEXT strings, using `datetime('now')` for defaults.
- JSON columns store stringified JSON (use `json_extract()` for queries).
- Foreign keys use ON DELETE CASCADE or SET NULL as appropriate.
- All queries go through `team-db "<SQL>"` — never use sqlite3 directly.
- The `team-db` CLI syncs automatically (pull → execute → push).