import { NextRequest, NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/adminSession";
import { db } from "@/lib/db";
import { discordVerifications } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { addVerifiedUserToGuild, type AddToGuildResult } from "@/lib/verify/addToGuild";

// Kept deliberately small. Each user can involve a token refresh plus a call
// to the bot, and a request that gets killed by a function timeout mid-way
// can strand a just-rotated refresh token — so the batch is sized to finish
// well inside the limit rather than to be fast.
export const maxDuration = 60;

const BATCH_SIZE = 8;
// Small gap between users so a bulk re-add doesn't hit Discord's rate limits
// all at once. The caller does its own batching (see below) so a single
// request never runs long enough to be killed.
const DELAY_MS = 250;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Re-adds previously-verified Discord members to a target guild, one batch
 * at a time — call repeatedly with an increasing `offset` (the response
 * tells you the next one) until `done: true`. Batched rather than done in
 * one request because processing every verified user in a single call could
 * run long enough to hit the platform's function timeout; each batch instead
 * does a bounded amount of work.
 *
 * Every distinct Discord user is only ever counted once, using their most
 * recent verification record (and therefore their freshest stored OAuth
 * token) — regardless of which server they originally verified in.
 */
export async function POST(req: NextRequest) {
  if (!hasAdminSession(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let targetGuildId: string;
  let offset: number;
  try {
    const body = await req.json();
    targetGuildId = body?.guildId;
    offset = Number.isFinite(body?.offset) ? Math.max(0, Number(body.offset)) : 0;
    if (!targetGuildId || typeof targetGuildId !== "string") throw new Error();
  } catch {
    return NextResponse.json({ error: "guildId is required." }, { status: 400 });
  }

  // One row per distinct Discord user, their most recent verification.
  // selectDistinctOn keeps the typed camelCase result shape (accessToken,
  // tokenExpiresAt, ...) that addVerifiedUserToGuild expects — a raw SQL
  // query here would come back with snake_case columns instead and silently
  // pass `undefined` as every field.
  const allUsers = await db
    .selectDistinctOn([discordVerifications.discordUserId])
    .from(discordVerifications)
    .orderBy(discordVerifications.discordUserId, desc(discordVerifications.verifiedAt));

  const totalUsers = allUsers.length;
  const batch = allUsers.slice(offset, offset + BATCH_SIZE);

  const results: AddToGuildResult[] = [];
  for (let i = 0; i < batch.length; i++) {
    // Contained per user: an unexpected throw on one person must not abort
    // the batch, because the caller restarts from offset 0 and everyone
    // after them would simply never be processed.
    try {
      results.push(await addVerifiedUserToGuild(batch[i], targetGuildId));
    } catch (e) {
      console.error("[verify] bulk add threw for user", batch[i].discordUserId, e);
      results.push({
        discordUserId: batch[i].discordUserId,
        ok: false,
        error: e instanceof Error ? e.message : "Unexpected error.",
      });
    }
    if (i < batch.length - 1) await sleep(DELAY_MS);
  }

  const nextOffset = offset + batch.length;
  return NextResponse.json({
    results,
    processed: nextOffset,
    total: totalUsers,
    done: nextOffset >= totalUsers,
    nextOffset,
  });
}
