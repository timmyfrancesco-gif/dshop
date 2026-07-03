import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { casinoBets } from "@/lib/db/schema";
import { getCasinoUser, debitBalance, creditBalance } from "@/lib/casino/auth";
import { newServerSeed, hashSeed, fairFloat } from "@/lib/casino/fair";
import { serverError } from "@/lib/http";

const MIN_BET = 10; // €0.10
const MAX_BET = 50000; // €500
const PAYOUT_MULT = 1.98; // 2% house edge on an even-money game

export async function POST(req: Request) {
  try {
    const user = await getCasinoUser(req);
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const betCents = Math.floor(Number(body?.betCents));
    const choice = body?.choice === "tails" ? "tails" : "heads";
    const clientSeed =
      typeof body?.clientSeed === "string" && body.clientSeed.length <= 128
        ? body.clientSeed
        : "client";

    if (!Number.isFinite(betCents) || betCents < MIN_BET || betCents > MAX_BET) {
      return NextResponse.json({ error: "invalid bet" }, { status: 400 });
    }

    // Debit first (atomic, rejects if insufficient) so the outcome can't be
    // decided before the funds are actually reserved.
    const afterDebit = await debitBalance(user, betCents);
    if (afterDebit === null) {
      return NextResponse.json({ error: "insufficient balance" }, { status: 409 });
    }

    const serverSeed = newServerSeed();
    const serverSeedHash = hashSeed(serverSeed);
    const nonce = Date.now() % 1_000_000;
    const roll = fairFloat(serverSeed, clientSeed, nonce);
    const result = roll < 0.5 ? "heads" : "tails";
    const win = result === choice;

    const payoutCents = win ? Math.floor(betCents * PAYOUT_MULT) : 0;
    let balanceCents = afterDebit;
    if (payoutCents > 0) balanceCents = await creditBalance(user, payoutCents);

    await db.insert(casinoBets).values({
      userId: user.id,
      game: "coinflip",
      betCents,
      payoutCents,
      outcome: { choice, result, win, roll },
      serverSeed,
      serverSeedHash,
      clientSeed,
      nonce,
    });

    return NextResponse.json({
      result,
      win,
      payoutCents,
      balanceCents,
      fair: { serverSeed, serverSeedHash, clientSeed, nonce },
    });
  } catch (e) {
    return serverError("casino/coinflip", e);
  }
}
