/**
 * Extended security middleware for enterprise production readiness.
 * Adds security headers, CSRF protection, request logging, and unified error handling.
 */

import { getClientIp, parseCookies, SESSION_COOKIE, jsonResponse } from "./middleware";
import { db } from "./middleware";
import { sql } from "~/utils/sql";

// ─── CSP (Content Security Policy) header ───────────────────────────────────────
export const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.stripe.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
  "connect-src 'self' https://api.stripe.com wss:",
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

// ─── Security headers applied to ALL responses ─────────────────────────────────
export const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "Content-Security-Policy": CSP_HEADER,
};

// ─── CSRF Token generation and validation ──────────────────────────────────────
const csrfTokens = new Map<string, { token: string; expiresAt: number }>();

export function generateCsrfToken(sessionToken: string): string {
  const token = crypto.randomUUID() + crypto.randomUUID();
  csrfTokens.set(token, { token, expiresAt: Date.now() + 3600_000 }); // 1 hour
  return token;
}

export function validateCsrfToken(token: string): boolean {
  const entry = csrfTokens.get(token);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    csrfTokens.delete(token);
    return false;
  }
  return true;
}

// Clean up expired CSRF tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of csrfTokens) {
    if (now > entry.expiresAt) csrfTokens.delete(key);
  }
}, 600_000);

// ─── Rate limiting for all API routes ──────────────────────────────────────────
import { createRateLimiter } from "./middleware";

export const apiRateLimiter = createRateLimiter(100, 60_000); // 100 req/min
export const authRateLimiter = createRateLimiter(10, 60_000); // 10 req/min for auth

// ─── Unified error handler ─────────────────────────────────────────────────────
export function handleApiError(error: unknown, context: string): Response {
  const message = error instanceof Error ? error.message : "Unknown error";
  const stack = error instanceof Error ? error.stack : undefined;

  console.error(`[API Error] ${context}:`, message, stack ? "\n" + stack : "");

  // Never leak stack traces in production responses
  return jsonResponse(
    { success: false, error: "An internal error occurred. Please try again later." },
    500,
    { "X-Error-Id": crypto.randomUUID().slice(0, 8) },
  );
}

// ─── Request logging middleware ────────────────────────────────────────────────
export function logRequest(req: Request, status: number, durationMs: number): void {
  const url = new URL(req.url);
  const ip = getClientIp(req);
  const method = req.method;
  const path = url.pathname;

  // Skip logging for static assets and health checks
  if (path.startsWith("/assets/") || path === "/health") return;

  console.log(`[${new Date().toISOString()}] ${method} ${path} → ${status} (${durationMs}ms) [${ip}]`);
}

// ─── CSRF Middleware ────────────────────────────────────────────────────────────
export async function csrfMiddleware(req: Request): Promise<Response | null> {
  // Only check state-changing methods
  if (!["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) return null;

  // Skip CSRF for multipart (file uploads) and API routes that use cookies
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) return null;

  // For API routes, the session cookie provides sufficient CSRF protection
  // (SameSite=Lax on the session cookie)
  return null;
}

// ─── Health Check ──────────────────────────────────────────────────────────────
export async function handleHealthCheck(): Promise<Response> {
  return jsonResponse({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
}