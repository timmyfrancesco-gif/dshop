import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenantOrders, tenants } from "@/lib/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { checkPlatformHeader } from "@/lib/platform/auth";
import { decryptSecret } from "@/lib/crypto/secrets";
import { expireStaleOrders } from "@/lib/platform/expireStale";
import { serverError } from "@/lib/http";

// Orders older than this with no payment are considered expired and dropped
// from the watch list (the price quote is stale by then).
const ORDER_TTL_MS = 1000 * 60 * 30; // 30 minutes

/**
 * Bot-facing endpoint. Returns all pending tenant orders together with the
 * temporary wallet private key and the destination wallets so the bot can:
 *   1. watch `address` for the incoming payment of `amountLtc`
 *   2. on payment, sweep: feePct% to PLATFORM_LTC_ADDRESS, rest to payoutAddress
 *   3. deliver the product and call POST /api/platform/orders/[orderId]/settle
 *
 * Protected by PLATFORM_SECRET — never expose this publicly.
 */
export async function GET(req: Request) {
  if (!checkPlatformHeader(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    // Opportunistic sweep: the bot polls this endpoint frequently, so this is
    // where abandoned orders actually get expired and their stock released
    // (the daily Vercel Cron is only a backstop on the Hobby plan).
    try {
      await expireStaleOrders();
    } catch {
      // never let cleanup failure block the pending-orders response
    }

    const cutoff = new Date(Date.now() - ORDER_TTL_MS);
    const rows = await db
      .select({
        orderId: tenantOrders.id,
        tenantId: tenantOrders.tenantId,
        tenantSlug: tenants.slug,
        productId: tenantOrders.productId,
        variantId: tenantOrders.variantId,
        buyerEmail: tenantOrders.buyerEmail,
        amountEur: tenantOrders.amountEur,
        amountLtc: tenantOrders.amountLtc,
        feePct: tenantOrders.feePct,
        feeEur: tenantOrders.feeEur,
        method: tenantOrders.method,
        paypalNote: tenantOrders.paypalNote,
        tenantPaypalEmail: tenants.paypalEmail,
        payAddress: tenantOrders.ltcAddress,
        payPrivateKey: tenantOrders.payPrivateKey,
        payoutAddress: tenantOrders.payoutAddress,
        createdAt: tenantOrders.createdAt,
      })
      .from(tenantOrders)
      .innerJoin(tenants, eq(tenantOrders.tenantId, tenants.id))
      .where(
        and(
          eq(tenantOrders.status, "pending"),
          gte(tenantOrders.createdAt, cutoff)
        )
      );

    // Decrypt the temp-wallet keys only here, for the trusted bot caller.
    const orders = rows.map((r) => ({
      ...r,
      payPrivateKey: decryptSecret(r.payPrivateKey),
    }));

    return NextResponse.json({
      platformLtcAddress: process.env.PLATFORM_LTC_ADDRESS ?? null,
      orders,
    });
  } catch (e) {
    return serverError("platform/pending-orders", e);
  }
}
