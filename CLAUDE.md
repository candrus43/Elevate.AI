# ElevateAI — Enterprise AI Sales Coaching Platform

## Project Conventions
- TypeScript strict mode
- TanStack Start (React + Vite + Tailwind v4)
- All API routes in `serve.ts` (monolithic server file)
- All frontend routes in `src/routes/`
- Utility functions in `src/utils/`
- Database: SQLite via Turso (`team-db` CLI)
- Dark mode only (always-dark)

## Architecture
- **Server**: Bun runtime on port 3000 (serve.ts)
- **Client**: TanStack Start SSR (React Router)
- **Database**: team-db CLI (Turso-synced SQLite)
- **Auth**: Cookie-based sessions with bcrypt password hashing

## Key Files
- `serve.ts` — Production server (824 lines, all API routes)
- `src/utils/sql.ts` — SQL tagged template literal (parameterized queries)
- `src/utils/auth.ts` — Auth type definitions
- `src/utils/db.ts` — Server-side data fetchers (createServerFn)
- `src/utils/roleplay-engine.ts` — AI role-play engine
- `src/utils/coaching-generator.ts` — AI coaching plan generator
- `src/utils/call-analysis.ts` — Call analysis pipeline
- `src/utils/seed.ts` — Demo data seeder
- `src/routes/` — All frontend routes

## Database Tables (37)
- `companies`, `users`, `teams`, `sessions`
- `calls`, `scorecards`, `scorecard_criteria`
- `coaching_plans`, `coaching_plan_items`
- `role_play_sessions`
- `live_coaching_sessions`
- `courses`, `course_modules`, `certifications`
- `user_badges`, `user_course_progress`
- `points_events`, `leaderboards`, `leaderboard_entries`
- `compliance_rules`, `compliance_checks`
- `integrations`, `invitations`
- `company_metrics`, `user_metrics`
- `analytics_events`
- `notification_preferences`, `inbox`
- `sync_logs`, `config`

## Phase 3 Priorities
1. Multi-Tenant Enterprise Platform
2. Live AI Coaching
3. Executive Analytics
4. Production Readiness
5. Integrations
6. AI Features

## Coding Standards
- All SQL queries must use the `sql` tagged template literal (never string interpolation)
- API handlers validate auth via session token cookie
- Error responses return JSON with `{ error: string }`
- Success responses return JSON
- Rate limiting on auth endpoints (5 req/min)
- Email validation on user input