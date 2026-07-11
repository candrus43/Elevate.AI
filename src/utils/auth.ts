// ─── Types ─────────────────────────────────────────────────
// Auth is handled via API routes in serve.ts (POST /api/login, GET /api/session, etc.)
// This file only exports shared type definitions used by UI components.

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: "admin" | "manager" | "rep";
  companyId: string;
  companyName: string;
  companySlug: string;
  companyTier: string;
  avatarUrl: string;
  teamId: string | null;
}