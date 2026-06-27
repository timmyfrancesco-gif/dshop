import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenantOrders, tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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
  if (req.headers.get("x-platform-secret") !== process.env.PLATFORM_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
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
        payAddress: tenantOrders.ltcAddress,
        payPrivateKey: tenantOrders.payPrivateKey,
        payoutAddress: tenantOrders.payoutAddress,
        createdAt: tenantOrders.createdAt,
      })
      .from(tenantOrders)
      .innerJoin(tenants, eq(tenantOrders.tenantId, tenants.id))
      .where(eq(tenantOrders.status, "pending"));

    return NextResponse.json({
      platformLtcAddress: process.env.PLATFORM_LTC_ADDRESS ?? null,
      orders: rows,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
