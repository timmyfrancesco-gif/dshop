import { NextRequest, NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/adminSession";
import { db } from "@/lib/db";
import { discordVerifications } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { decryptSecret, isEncryptionEnabled } from "@/lib/crypto/secrets";

/**
 * "Can I still re-add these people?" readiness check.
 *
 * Intended to be run BEFORE an irreversible action (deleting the Discord
 * server, migrating the database, rotating WALLET_ENC_KEY), because the
 * stored OAuth grants are the only thing that makes previously-verified
 * members re-addable to a new guild.
 *
 * Deliberately does NOT call Discord: it only inspects what is stored. That
 * makes it free of rate limits and, more importantly, side-effect free —
 * refreshing a token rotates it at Discord, so a "check" that refreshed
 * would itself risk invalidating the very grants it is meant to audit.
 *
 * Never returns token material, only whether each token is usable.
 */
export async function GET(req: NextRequest) {
  if (!hasAdminSession(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Most recent verification per distinct Discord user — that row holds their
  // freshest grant, and is exactly the row the re-add tools use.
  const users = await db
    .selectDistinctOn([discordVerifications.discordUserId])
    .from(discordVerifications)
    .orderBy(discordVerifications.discordUserId, desc(discordVerifications.verifiedAt));

  const now = Date.now();
  let refreshable = 0;       // has a working refresh token -> re-addable indefinitely
  let accessOnlyValid = 0;   // no refresh token, but access token still in date
  let accessOnlyExpired = 0; // no refresh token and the access token has lapsed
  let undecryptable = 0;     // ciphertext present but the key can't open it
  let noToken = 0;           // nothing was ever stored

  for (const u of users) {
    const hasCiphertext = Boolean(u.accessToken || u.refreshToken);
    if (!hasCiphertext) {
      noToken++;
      continue;
    }

    const refresh = u.refreshToken ? decryptSecret(u.refreshToken) : null;
    const access = u.accessToken ? decryptSecret(u.accessToken) : null;

    // Stored something, but nothing came back out: the value was encrypted
    // with a different WALLET_ENC_KEY than the one currently configured.
    if (!refresh && !access) {
      undecryptable++;
      continue;
    }

    if (refresh) {
      refreshable++;
      continue;
    }

    const expiresAt = u.tokenExpiresAt ? u.tokenExpiresAt.getTime() : 0;
    if (expiresAt > now) accessOnlyValid++;
    else accessOnlyExpired++;
  }

  const recoverable = refreshable + accessOnlyValid;
  const atRisk = accessOnlyExpired + undecryptable + noToken;

  const timestamps = users
    .map((u) => u.verifiedAt?.getTime())
    .filter((t): t is number => typeof t === "number");

  return NextResponse.json({
    // If false, tokens are being stored as plaintext (the legacy fallback in
    // lib/crypto/secrets.ts). Recoverable, but they are readable by anyone
    // with database access.
    encryptionEnabled: isEncryptionEnabled(),
    uniqueUsers: users.length,
    recoverable,
    atRisk,
    breakdown: {
      refreshable,
      accessOnlyValid,
      accessOnlyExpired,
      undecryptable,
      noToken,
    },
    oldestVerification: timestamps.length ? new Date(Math.min(...timestamps)).toISOString() : null,
    newestVerification: timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : null,
  });
}
