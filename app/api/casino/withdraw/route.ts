import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { casinoWithdrawals } from "@/lib/db/schema";
import { getCasinoUser, debitBalance } from "@/lib/casino/auth";
import { CHAINS, isChain, isValidAddress, getPricesEur, type Chain } from "@/lib/casino/crypto";
import { serverError } from "@/lib/http";

const MIN_CENTS = 100; // €1 minimum withdrawal

export async function POST(req: Request) {
  try {
    const user = await getCasinoUser(req);
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const chain = body?.chain;
    const toAddress = String(body?.toAddress ?? "").trim();
    const amountCents = Math.floor(Number(body?.amountCents));

    if (!isChain(chain)) return NextResponse.json({ error: "invalid chain" }, { status: 400 });
    if (!isValidAddress(chain, toAddress)) {
      return NextResponse.json({ error: `invalid ${CHAINS[chain].symbol} address` }, { status: 400 });
    }
    if (!Number.isFinite(amountCents) || amountCents < MIN_CENTS) {
      return NextResponse.json({ error: "minimum amount €1.00" }, { status: 400 });
    }

    const prices = await getPricesEur();
    const price = prices[chain as Chain];
    if (!price) {
      return NextResponse.json({ error: "price unavailable, try again" }, { status: 503 });
    }
    const amountCrypto = (amountCents / 100 / price).toFixed(CHAINS[chain as Chain].decimals === 18 ? 18 : 8);

    // Debit first (atomic — rejects if the balance can't cover it).
    const afterDebit = await debitBalance(user, amountCents);
    if (afterDebit === null) {
      return NextResponse.json({ error: "insufficient balance" }, { status: 409 });
    }

    // Record the request. On-chain broadcast is a separate processing step
    // (kept manual during the test phase so no real funds move by accident).
    const [w] = await db
      .insert(casinoWithdrawals)
      .values({
        userId: user.id,
        chain,
        toAddress,
        amountCents,
        amountCrypto,
        status: "pending",
      })
      .returning();

    return NextResponse.json({
      withdrawal: {
        id: w.id,
        chain: w.chain,
        toAddress: w.toAddress,
        amountCents: w.amountCents,
        amountCrypto: w.amountCrypto,
        status: w.status,
      },
      balanceCents: afterDebit,
    });
  } catch (e) {
    return serverError("casino/withdraw", e);
  }
}
