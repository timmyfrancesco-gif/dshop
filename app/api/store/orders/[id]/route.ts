import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { storeOrders } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getAddressReceived } from "@/lib/crypto/wallet";
import { markReservedSold, releaseReserved } from "@/lib/store/inventory";
import { serverError } from "@/lib/http";

const MIN_CONFIRMATIONS = Number(process.env.LTC_MIN_CONFIRMATIONS ?? "1");
const AMOUNT_TOLERANCE = 0.01; // 1% to absorb rounding/network fees
const ORDER_TTL_MS = 1000 * 60 * 15; // abandoned unpaid orders expire after 15 min

/**
 * Polled by the checkout page. Bot-independent: checks the temp address
 * on-chain itself (BlockCypher, same helper the tenant settle path uses)
 * and delivers the reserved item the moment payment is confirmed.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const [order] = await db.select().from(storeOrders).where(eq(storeOrders.id, id)).limit(1);
    if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });

    if (order.status !== "pending") {
      return NextResponse.json({
        status: order.status,
        deliveredItem: order.status === "paid" ? order.deliveredItem : undefined,
      });
    }

    // Abandoned checkout: release the reserved unit so it goes back on sale.
    if (Date.now() - order.createdAt.getTime() > ORDER_TTL_MS) {
      const expired = await db
        .update(storeOrders)
        .set({ status: "expired", updatedAt: new Date() })
        .where(and(eq(storeOrders.id, id), eq(storeOrders.status, "pending")))
        .returning({ id: storeOrders.id });
      if (expired.length > 0) await releaseReserved(id);
      return NextResponse.json({ status: "expired" });
    }

    if (!order.ltcAddress || !order.amountLtc) {
      return NextResponse.json({ status: "pending" });
    }

    const received = await getAddressReceived("ltc", order.ltcAddress);
    if (!received) return NextResponse.json({ status: "pending" });

    const required = order.amountLtc * (1 - AMOUNT_TOLERANCE);
    if (received.receivedLtc < required || received.confirmations < MIN_CONFIRMATIONS) {
      return NextResponse.json({
        status: "pending",
        confirmations: received.confirmations,
        requiredConfirmations: MIN_CONFIRMATIONS,
      });
    }

    // Payment verified — optimistic-concurrency settle so a second poll
    // arriving concurrently can't deliver the item twice.
    const settled = await db
      .update(storeOrders)
      .set({ status: "paid", confirmations: received.confirmations, updatedAt: new Date() })
      .where(and(eq(storeOrders.id, id), eq(storeOrders.status, "pending")))
      .returning({ id: storeOrders.id });

    if (settled.length === 0) {
      // Another concurrent request already settled it; re-read the result.
      const [fresh] = await db.select().from(storeOrders).where(eq(storeOrders.id, id)).limit(1);
      return NextResponse.json({ status: fresh?.status ?? "pending", deliveredItem: fresh?.deliveredItem });
    }

    const deliveredItem = await markReservedSold(id);
    await db.update(storeOrders).set({ deliveredItem }).where(eq(storeOrders.id, id));

    return NextResponse.json({ status: "paid", deliveredItem });
  } catch (e) {
    return serverError("store/orders/[id] GET", e);
  }
}
