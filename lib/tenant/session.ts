import { createHmac, timingSafeEqual } from "crypto";

/**
 * Tenant dashboard session tokens.
 *
 * A token is an HMAC over `${tenantId}:${ownerId}` keyed with PLATFORM_SECRET.
 * The secret is REQUIRED — if it is missing we throw rather than fall back to
 * a guessable constant, so sessions can never be forged when the platform is
 * misconfigured.
 */

function getSecret(): string {
  const secret = process.env.PLATFORM_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("PLATFORM_SECRET is not configured");
  }
  return secret;
}

export function signSession(tenantId: string, ownerId: string): string {
  return createHmac("sha256", getSecret())
    .update(`${tenantId}:${ownerId}`)
    .digest("hex");
}

export function verifySession(
  token: string | undefined | null,
  tenantId: string,
  ownerId: string
): boolean {
  if (!token) return false;
  let expected: string;
  try {
    expected = signSession(tenantId, ownerId);
  } catch {
    return false;
  }
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function readSessionCookie(req: Request): string | undefined {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/tenant_session=([^;]+)/);
  return match?.[1];
}
