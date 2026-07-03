import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { casinoBlackjack } from "@/lib/db/schema";
import { getCasinoUser, getBalanceCents } from "@/lib/casino/auth";
import { publicState, type BlackjackState } from "@/lib/casino/blackjack";
import { serverError } from "@/lib/http";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const user = await getCasinoUser(req);
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const rows = await db
      .select({ state: casinoBlackjack.state })
      .from(casinoBlackjack)
      .where(eq(casinoBlackjack.userId, user.id))
      .limit(1);

    const balanceCents = await getBalanceCents(user);
    if (rows.length === 0 || (rows[0].state as { finished?: boolean }).finished) {
      return NextResponse.json({ state: null, balanceCents });
    }
    return NextResponse.json({
      state: publicState(rows[0].state as unknown as BlackjackState),
      balanceCents,
    });
  } catch (e) {
    return serverError("casino/blackjack/state", e);
  }
}
