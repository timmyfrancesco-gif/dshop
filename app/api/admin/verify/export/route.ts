import { NextRequest, NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/adminSession";
import { db } from "@/lib/db";
import { discordVerifications } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { isEncryptionEnabled } from "@/lib/crypto/secrets";

/**
 * Backup of the verification grants — the only thing that makes a
 * previously-verified member re-addable to a new guild.
 *
 * Token columns are exported EXACTLY as stored, i.e. still encrypted when
 * WALLET_ENC_KEY is configured. They are deliberately not decrypted: a file
 * of live `guilds.join` grants in the clear would let anyone holding it add
 * those users to any server. The trade-off is that this backup is only
 * usable together with the same WALLET_ENC_KEY — store the key somewhere
 * separate, or the backup restores to nothing.
 */
export async function GET(req: NextRequest) {
  if (!hasAdminSession(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(discordVerifications)
    .orderBy(desc(discordVerifications.verifiedAt));

  const payload = {
    exportedAt: new Date().toISOString(),
    format: "discord_verifications/v1",
    // Whether the token fields below are ciphertext. If true, restoring this
    // file requires the same WALLET_ENC_KEY that was in use when it was made.
    encrypted: isEncryptionEnabled(),
    rowCount: rows.length,
    uniqueUsers: new Set(rows.map((r) => r.discordUserId)).size,
    rows,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="discord-verifications-${new Date()
        .toISOString()
        .slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
