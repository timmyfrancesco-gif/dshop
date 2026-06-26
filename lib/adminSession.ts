// Server-only helper for the admin dashboard session cookie.
// The cookie value is a SHA-256 of the server-side admin secret, so it can be
// verified statelessly without ever exposing the secret to the browser.
import { createHash, timingSafeEqual } from "node:crypto";

const ADMIN_SECRET =
  process.env.ADMIN_TOKEN ?? process.env.NEXT_PUBLIC_ADMIN_TOKEN ?? "";

export const ADMIN_COOKIE = "hm_admin";
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 12; // 12 hours

/** The expected cookie value for a valid admin session ("" if unconfigured). */
export function adminSessionValue(): string {
  if (!ADMIN_SECRET) return "";
  return createHash("sha256").update(`hm-admin-session:${ADMIN_SECRET}`).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

/** True when the request carries a valid admin session cookie. */
export function hasAdminSession(req: Request): boolean {
  const expected = adminSessionValue();
  if (!expected) return false;
  const cookie = req.headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)hm_admin=([^;]+)/);
  if (!match) return false;
  return safeEqual(decodeURIComponent(match[1]), expected);
}

/** Constant-time string comparison for password/token checks. */
export function constantTimeEqual(a: string, b: string): boolean {
  return safeEqual(a, b);
}
