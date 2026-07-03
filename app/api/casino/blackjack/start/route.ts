import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { casinoBlackjack, casinoBets } from "@/lib/db/schema";
import { getCasinoUser, debitBalance, creditBalance } from "@/lib/casino/auth";
import { newServerSeed, hashSeed } from "@/lib/casino/fair";
import { startGame, publicState } from "@/lib/casino/blackjack";
import { serverError } from "@/lib/http";
import { eq } from "drizzle-orm";

const MIN_BET = 10;
const MAX_BET = 50000;

export async function POST(req: Request) {
  try {
    const user = await getCasinoUser(req);
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const betCents = Math.floor(Number(body?.betCents));
    const clientSeed =
      typeof body?.clientSeed === "string" && body.clientSeed.length <= 128 ? body.clientSeed : "client";

    if (!Number.isFinite(betCents) || betCents < MIN_BET || betCents > MAX_BET) {
      return NextResponse.json({ error: "invalid bet" }, { status: 400 });
    }

    // Refuse to start if a game is already open (must finish it first).
    const existing = await db
      .select({ state: casinoBlackjack.state })
      .from(casinoBlackjack)
      .where(eq(casinoBlackjack.userId, user.id))
      .limit(1);
    if (existing.length > 0 && !(existing[0].state as { finished?: boolean }).finished) {
      return NextResponse.json({ error: "finish your current game first" }, { status: 409 });
    }

    const afterDebit = await debitBalance(user, betCents);
    if (afterDebit === null) {
      return NextResponse.json({ error: "insufficient balance" }, { status: 409 });
    }

    const serverSeed = newServerSeed();
    const serverSeedHash = hashSeed(serverSeed);
    const nonce = Date.now() % 1_000_000;
    const state = startGame(betCents, serverSeed, serverSeedHash, clientSeed, nonce);

    let balanceCents = afterDebit;
    // Immediate blackjack settles right away.
    if (state.finished && state.payoutCents > 0) {
      balanceCents = await creditBalance(user, state.payoutCents);
    }
    if (state.finished) {
      await recordBet(user.id, betCents, state.payoutCents, state, serverSeed, serverSeedHash, clientSeed, nonce);
    }

    const stateJson = state as unknown as Record<string, unknown>;
    await db
      .insert(casinoBlackjack)
      .values({ userId: user.id, state: stateJson, updatedAt: new Date() })
      .onConflictDoUpdate({ target: casinoBlackjack.userId, set: { state: stateJson, updatedAt: new Date() } });

    return NextResponse.json({ state: publicState(state), balanceCents });
  } catch (e) {
    return serverError("casino/blackjack/start", e);
  }
}

async function recordBet(
  userId: string,
  betCents: number,
  payoutCents: number,
  state: unknown,
  serverSeed: string,
  serverSeedHash: string,
  clientSeed: string,
  nonce: number
) {
  await db.insert(casinoBets).values({
    userId,
    game: "blackjack",
    betCents,
    payoutCents,
    outcome: { finished: true } as Record<string, unknown>,
    serverSeed,
    serverSeedHash,
    clientSeed,
    nonce,
  });
}
