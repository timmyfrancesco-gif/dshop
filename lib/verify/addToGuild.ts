import { db } from "@/lib/db";
import { discordVerifications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { decryptSecret, encryptSecret } from "@/lib/crypto/secrets";

export interface AddToGuildResult {
  discordUserId: string;
  ok: boolean;
  error?: string;
}

async function refreshAccessToken(
  refreshToken: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number } | null> {
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
    return await res.json();
  } catch {
    return null;
  }
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

  if (!record.accessToken) {
    return { discordUserId, ok: false, error: "No OAuth token stored for this user." };
  }

  let accessToken = decryptSecret(record.accessToken);

  const expired = record.tokenExpiresAt && record.tokenExpiresAt.getTime() < Date.now() + 60_000;
  if (expired) {
    if (!record.refreshToken) {
      return { discordUserId, ok: false, error: "Token expired and no refresh token stored — user must re-verify." };
    }
    const plainRefresh = decryptSecret(record.refreshToken) ?? "";
    const refreshed = await refreshAccessToken(plainRefresh);
    if (!refreshed) {
      return { discordUserId, ok: false, error: "Token expired and refresh failed — user must re-verify." };
    }
    accessToken = refreshed.access_token;
    await db
      .update(discordVerifications)
      .set({
        accessToken: encryptSecret(refreshed.access_token),
        refreshToken: encryptSecret(refreshed.refresh_token),
        tokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
      })
      .where(eq(discordVerifications.id, record.id));
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
