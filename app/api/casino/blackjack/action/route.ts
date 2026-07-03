import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { casinoBlackjack, casinoBets } from "@/lib/db/schema";
import { getCasinoUser, debitBalance, creditBalance, getBalanceCents } from "@/lib/casino/auth";
import {
  hit,
  stand,
  double,
  split,
  publicState,
  type BlackjackState,
} from "@/lib/casino/blackjack";
import { serverError } from "@/lib/http";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const user = await getCasinoUser(req);
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const action = body?.action as string;
    if (!["hit", "stand", "double", "split"].includes(action)) {
      return NextResponse.json({ error: "invalid action" }, { status: 400 });
    }

    const rows = await db
      .select({ state: casinoBlackjack.state })
      .from(casinoBlackjack)
      .where(eq(casinoBlackjack.userId, user.id))
      .limit(1);
    if (rows.length === 0) {
      return NextResponse.json({ error: "no active game" }, { status: 404 });
    }
    const state = rows[0].state as unknown as BlackjackState;
    if (state.finished) {
      return NextResponse.json({ error: "game already finished" }, { status: 409 });
    }

    // double / split require an extra bet — debit it before applying.
    if (action === "double") {
      const hand = state.hands[state.active];
      const debited = await debitBalance(user, hand.betCents);
      if (debited === null) {
        return NextResponse.json({ error: "insufficient balance to double" }, { status: 409 });
      }
      double(state);
    } else if (action === "split") {
      const hand = state.hands[state.active];
      const debited = await debitBalance(user, hand.betCents);
      if (debited === null) {
        return NextResponse.json({ error: "insufficient balance to split" }, { status: 409 });
      }
      split(state);
    } else if (action === "hit") {
      hit(state);
    } else {
      stand(state);
    }

    let balanceCents = await getBalanceCents(user);
    if (state.finished && state.payoutCents > 0) {
      balanceCents = await creditBalance(user, state.payoutCents);
    }

    if (state.finished) {
      const totalBet = state.hands.reduce((s, h) => s + h.betCents, 0);
      await db.insert(casinoBets).values({
        userId: user.id,
        game: "blackjack",
        betCents: totalBet,
        payoutCents: state.payoutCents,
        outcome: { outcomes: state.hands.map((h) => h.outcome) },
        serverSeed: state.serverSeed,
        serverSeedHash: state.serverSeedHash,
        clientSeed: state.clientSeed,
        nonce: state.nonce,
      });
    }

    await db
      .update(casinoBlackjack)
      .set({ state: state as unknown as Record<string, unknown>, updatedAt: new Date() })
      .where(eq(casinoBlackjack.userId, user.id));

    return NextResponse.json({ state: publicState(state), balanceCents });
  } catch (e) {
    return serverError("casino/blackjack/action", e);
  }
}
