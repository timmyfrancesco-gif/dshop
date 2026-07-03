import { NextResponse } from "next/server";
import { getCasinoUser, creditBalance, getBalanceCents } from "@/lib/casino/auth";
import { serverError } from "@/lib/http";

// Test-only faucet: credits play money so the games can be tested before the
// real crypto wallets (Phase 2) are wired up. Disabled when CASINO_TEST_MODE
// is "false". Capped so a single account can't balloon the play balance.
const FAUCET_CENTS = 10000; // €100
const MAX_TEST_BALANCE = 100000; // €1000

export async function POST(req: Request) {
  try {
    if (process.env.CASINO_TEST_MODE === "false") {
      return NextResponse.json({ error: "faucet disabled" }, { status: 403 });
    }
    const user = await getCasinoUser(req);
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const current = await getBalanceCents(user);
    if (current >= MAX_TEST_BALANCE) {
      return NextResponse.json({ error: "test balance cap reached", balanceCents: current }, { status: 409 });
    }
    const balanceCents = await creditBalance(user, FAUCET_CENTS);
    return NextResponse.json({ balanceCents });
  } catch (e) {
    return serverError("casino/faucet", e);
  }
}
