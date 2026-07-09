# ElevateAI — Enterprise AI Sales Coaching Platform

Turn every sales call into a coaching opportunity. AI agents analyze calls, grade performance, detect objections, monitor compliance, and deliver personalized coaching plans — automatically.

## Tech Stack
- **Frontend**: TanStack Start (React + Vite + Tailwind CSS v4)
- **Backend**: TanStack Start server functions + API routes
- **Database**: SQLite via Turso (shared `team-db` CLI)
- **Auth**: Cookie-based sessions with Bun password hashing
- **Styling**: Tailwind CSS v4 with dark mode

## Getting Started

```bash
# Install dependencies
bun install

# Run the dev server
bun run dev

# Build and publish (port 3000)
bun run publish
```

## Project Structure

```
Elevate.AI/
├── src/
│   ├── components/
│   │   └── layout/
│   │       ├── DashboardShell.tsx  # Main app shell (sidebar + header)
│   │       ├── Header.tsx          # Top navigation bar
│   │       └── Sidebar.tsx         # Collapsible side navigation
│   ├── routes/
│   │   ├── __root.tsx              # Root layout (HTML shell, SEO)
│   │   ├── index.tsx               # Landing page
│   │   ├── login.tsx               # Login page
│   │   ├── register.tsx            # Registration page
│   │   ├── dashboard.tsx           # Dashboard layout (auth-protected)
│   │   ├── dashboard.index.tsx     # Manager dashboard
│   │   ├── dashboard.rep.tsx       # Rep dashboard
│   │   ├── admin.tsx               # Admin layout (auth-protected)
│   │   └── admin.index.tsx         # Admin dashboard
│   ├── styles/
│   │   └── app.css                 # Tailwind entrypoint
│   └── utils/
│       └── auth.ts                 # Auth server functions
├── docs/
│   └── DATABASE_SCHEMA.md          # Full database schema documentation
├── serve.ts                        # Production server (port 3000)
├── publish.sh                      # Build + publish script
└── vite.config.ts                  # Vite + Tailwind config
```

## Database

All database queries go through the `team-db` CLI. Schema documentation is in `docs/DATABASE_SCHEMA.md`.

```bash
team-db "SELECT * FROM users"
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | Sign in |
| `/register` | Create account |
| `/dashboard` | Manager Dashboard |
| `/dashboard/rep` | Rep Dashboard |
| `/admin` | Admin Dashboard |