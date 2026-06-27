import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenantOrders, tenantProducts } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Bot-facing endpoint. Called once the bot has confirmed payment, swept the
 * funds (fee to platform, remainder to the tenant) and delivered the product.
 *
 * Body: { status: "paid", txHash?, deliveredItem?, confirmations? }
 * Protected by PLATFORM_SECRET.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  if (req.headers.get("x-platform-secret") !== process.env.PLATFORM_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { orderId } = await params;

  try {
    const body = await req.json();
    const { status, txHash, deliveredItem, confirmations } = body as {
      status?: string;
      txHash?: string;
      deliveredItem?: string;
      confirmations?: number;
    };

    const allowed = ["paid", "delivered", "expired", "failed"];
    if (!status || !allowed.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of ${allowed.join(", ")}` },
        { status: 400 }
      );
    }

    const existing = await db
      .select({ id: tenantOrders.id, productId: tenantOrders.productId, prev: tenantOrders.status })
      .from(tenantOrders)
      .where(eq(tenantOrders.id, orderId))
      .limit(1);
    if (existing.length === 0) {
      return NextResponse.json({ error: "order not found" }, { status: 404 });
    }

    await db
      .update(tenantOrders)
      .set({
        status,
        txHash: txHash ?? undefined,
        deliveredItem: deliveredItem ?? undefined,
        confirmations: confirmations ?? undefined,
        updatedAt: new Date(),
      })
      .where(eq(tenantOrders.id, orderId));

    // Count the sale once, when it first becomes paid/delivered.
    const becomesPaid =
      (status === "paid" || status === "delivered") &&
      existing[0].prev !== "paid" &&
      existing[0].prev !== "delivered";
    if (becomesPaid) {
      await db
        .update(tenantProducts)
        .set({ totalSold: sql`${tenantProducts.totalSold} + 1` })
        .where(eq(tenantProducts.id, existing[0].productId));
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
