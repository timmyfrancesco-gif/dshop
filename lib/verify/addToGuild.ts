import { db } from "@/lib/db";
import { discordVerifications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { decryptSecret, encryptSecret } from "@/lib/crypto/secrets";

export interface AddToGuildResult {
  discordUserId: string;
  ok: boolean;
  error?: string;
}

interface RefreshedTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

const DEFAULT_EXPIRES_IN = 7 * 24 * 60 * 60; // Discord's own access-token lifetime

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Exchanges a refresh token for a fresh pair.
 *
 * NOTE: this is destructive at Discord's end — the moment it returns, the
 * refresh token we sent is dead and only the returned one works. Everything
 * after this call is therefore inside a window where losing the response
 * means losing the user's grant permanently.
 *
 * The response shape is validated rather than trusted: a 200 that is missing
 * `refresh_token` would otherwise flow into encryptSecret(undefined), which
 * either throws or (with no WALLET_ENC_KEY) silently returns undefined.
 */
async function refreshAccessToken(refreshToken: string): Promise<RefreshedTokens | null> {
  try {
    const res = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!.trim(),
        client_secret: process.env.DISCORD_CLIENT_SECRET!.trim(),
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data?.access_token !== "string" || typeof data?.refresh_token !== "string") {
      console.error("[verify] refresh returned an unexpected shape", {
        hasAccess: typeof data?.access_token,
        hasRefresh: typeof data?.refresh_token,
      });
      return null;
    }
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: typeof data.expires_in === "number" ? data.expires_in : DEFAULT_EXPIRES_IN,
    };
  } catch {
    return null;
  }
}

/**
 * Stores a rotated token pair, retrying transient failures.
 *
 * This runs inside the loss window described above: the previous refresh
 * token is already void at Discord, so if the new one never lands in the
 * database that member can never be re-added again — they would have to
 * verify from scratch. Hence the retries, and hence the break-glass log on
 * total failure: writing a live grant to the logs is not something to do
 * lightly, but it is the only remaining way to recover the account, and the
 * alternative is losing it silently.
 */
async function persistRefreshedTokens(
  recordId: string,
  discordUserId: string,
  refreshed: RefreshedTokens
): Promise<boolean> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await db
        .update(discordVerifications)
        .set({
          accessToken: encryptSecret(refreshed.access_token),
          refreshToken: encryptSecret(refreshed.refresh_token),
          tokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
        })
        .where(eq(discordVerifications.id, recordId));
      return true;
    } catch (e) {
      if (attempt < 3) {
        await sleep(200 * attempt);
        continue;
      }
      console.error(
        "[verify] CRITICAL: rotated refresh token could not be stored. Discord has already " +
          "invalidated the previous one, so this grant is lost unless the value below is " +
          "restored into discord_verifications manually.",
        {
          recordId,
          discordUserId,
          recoveryRefreshToken: refreshed.refresh_token,
          cause: e instanceof Error ? e.message : String(e),
        }
      );
      return false;
    }
  }
  return false;
}

/**
 * Adds one previously-verified Discord user to `targetGuildId`, using their
 * stored OAuth token (refreshing it first if it's expired/near expiry).
 * Shared by the single-user admin action and the bulk "re-add everyone" tool.
 */
export async function addVerifiedUserToGuild(
  record: typeof discordVerifications.$inferSelect,
  targetGuildId: string
): Promise<AddToGuildResult> {
  const discordUserId = record.discordUserId;

  if (!record.accessToken && !record.refreshToken) {
    return { discordUserId, ok: false, error: "No OAuth token stored for this user." };
  }

  let accessToken = record.accessToken ? decryptSecret(record.accessToken) : null;

  // A missing expiry is treated as expired rather than as "still valid":
  // those rows would otherwise keep sending a long-dead access token forever
  // and never attempt the refresh that would actually recover them.
  const expired =
    !record.tokenExpiresAt || record.tokenExpiresAt.getTime() < Date.now() + 60_000;

  if (expired || !accessToken) {
    if (!record.refreshToken) {
      return {
        discordUserId,
        ok: false,
        error: "Token expired and no refresh token stored — user must re-verify.",
      };
    }
    const plainRefresh = decryptSecret(record.refreshToken);
    if (!plainRefresh) {
      // Ciphertext that won't open: WALLET_ENC_KEY doesn't match what wrote it.
      return {
        discordUserId,
        ok: false,
        error: "Stored token could not be decrypted — WALLET_ENC_KEY does not match.",
      };
    }
    const refreshed = await refreshAccessToken(plainRefresh);
    if (!refreshed) {
      return {
        discordUserId,
        ok: false,
        error: "Token expired and refresh failed — user must re-verify.",
      };
    }

    // Persist before using it. The old refresh token is already dead at this
    // point, so a failure here must be reported as a failure — proceeding to
    // add the member would return success while the grant is silently gone.
    const stored = await persistRefreshedTokens(record.id, discordUserId, refreshed);
    if (!stored) {
      return {
        discordUserId,
        ok: false,
        error: "Refreshed the token but could not save it — see server logs to recover this grant.",
      };
    }
    accessToken = refreshed.access_token;
  }

  try {
    const botRes = await fetch(`${process.env.BOT_API_URL}/api/verify-grant`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-verify-secret": process.env.BOT_API_SECRET!,
      },
      body: JSON.stringify({ userId: discordUserId, guildId: targetGuildId, accessToken }),
    });
    if (!botRes.ok) {
      const data = await botRes.json().catch(() => ({}));
      return { discordUserId, ok: false, error: (data as { error?: string }).error || `Bot returned ${botRes.status}.` };
    }
    return { discordUserId, ok: true };
  } catch {
    return { discordUserId, ok: false, error: "Could not reach the bot." };
  }
}
