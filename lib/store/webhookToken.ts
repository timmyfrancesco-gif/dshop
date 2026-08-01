import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Secret backing the store payment webhook. Note the fallbacks: unless the
 * operator sets a dedicated STORE_WEBHOOK_SECRET this is the *same* value as
 * BOT_API_SECRET / PLATFORM_SECRET, which is what protects
 * /api/platform/pending-orders — an endpoint that hands back the DECRYPTED
 * private keys of every pending order. That is precisely why the raw secret
 * must never be put in a callback URL (see below).
 */
function webhookSecret(): string {
  return process.env.STORE_WEBHOOK_SECRET || process.env.BOT_API_SECRET || process.env.PLATFORM_SECRET || "";
}

/**
 * Per-order callback token.
 *
 * The callback URL is handed to BlockCypher, a third party, and thereafter
 * lives in their systems, their logs, and any proxy in between. Embedding the
 * raw shared secret there (the previous `?s=<secret>` scheme) meant a single
 * leaked URL exposed the credential that unlocks every tenant order's private
 * key. An HMAC of the order id is scoped instead: it authorises settling that
 * one order and nothing else, and the secret itself never leaves the server.
 *
 * Returns "" when no secret is configured, so callers fail closed.
 */
export function orderWebhookToken(orderId: string): string {
  const secret = webhookSecret();
  if (!secret) return "";
  return createHmac("sha256", secret).update(`store-order-webhook:${orderId}`).digest("hex");
}

/** Constant-time check of a callback token against the expected one. */
export function verifyOrderWebhookToken(orderId: string, provided: string): boolean {
  const expected = orderWebhookToken(orderId);
  if (!expected || !provided || provided.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  } catch {
    return false;
  }
}
