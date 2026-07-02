import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenantOrders, tenantProducts } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { checkPlatformHeader } from "@/lib/platform/auth";
import { getAddressReceived } from "@/lib/crypto/wallet";
import { serverError } from "@/lib/http";

type Variant = { id: string; title: string; price: number; stock: number; stockItems?: string[] };

// Allowed previous states for each target status.
const VALID_PREV: Record<string, string[]> = {
  paid: ["pending"],
  delivered: ["pending", "paid"],
  expired: ["pending"],
  failed: ["pending", "paid"],
};

const MIN_CONFIRMATIONS = Number(process.env.LTC_MIN_CONFIRMATIONS ?? "1");
const AMOUNT_TOLERANCE = 0.01; // 1% to absorb rounding / network fees

/**
 * Bot-facing endpoint. Called once the bot has confirmed payment, swept the
 * funds (fee to platform, remainder to the tenant) and delivered the product.
 *
 * Body: { status: "paid"|"delivered"|"expired"|"failed", txHash?, deliveredItem?, confirmations? }
 * Protected by the platform/bot secret.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  if (!checkPlatformHeader(req)) {
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

    if (!status || !VALID_PREV[status]) {
      return NextResponse.json(
        { error: `status must be one of ${Object.keys(VALID_PREV).join(", ")}` },
        { status: 400 }
      );
    }

    const existing = await db
      .select({
        productId: tenantOrders.productId,
        variantId: tenantOrders.variantId,
        prev: tenantOrders.status,
        payAddress: tenantOrders.ltcAddress,
        amountLtc: tenantOrders.amountLtc,
        method: tenantOrders.method,
      })
      .from(tenantOrders)
      .where(eq(tenantOrders.id, orderId))
      .limit(1);
    if (existing.length === 0) {
      return NextResponse.json({ error: "order not found" }, { status: 404 });
    }
    const order = existing[0];

    if (!VALID_PREV[status].includes(order.prev)) {
      return NextResponse.json(
        { error: `illegal transition ${order.prev} -> ${status}` },
        { status: 409 }
      );
    }

    // Defense in depth: independently confirm the temp wallet actually received
    // the expected amount before marking the order paid/delivered. Skipped only
    // if BlockCypher is unavailable (then we trust the bot's sweep).
    // PayPal orders have no on-chain trail — the bot verified the PayPal
    // notification email, so we trust its verdict there.
    if ((status === "paid" || status === "delivered") && order.method !== "paypal") {
      const received = await getAddressReceived("ltc", order.payAddress);
      if (received) {
        const required = (order.amountLtc ?? 0) * (1 - AMOUNT_TOLERANCE);
        if (
          !order.amountLtc ||
          received.receivedLtc < required ||
          received.confirmations < MIN_CONFIRMATIONS
        ) {
          return NextResponse.json(
            {
              error: "payment not verified on-chain",
              receivedLtc: received.receivedLtc,
              requiredLtc: order.amountLtc,
              confirmations: received.confirmations,
            },
            { status: 409 }
          );
        }
      }
    }

    // Optimistic-concurrency update: only applies if status is still `prev`,
    // so concurrent settle calls can't double-apply.
    const updated = await db
      .update(tenantOrders)
      .set({
        status,
        txHash: txHash ?? undefined,
        deliveredItem: deliveredItem ?? undefined,
        confirmations: confirmations ?? undefined,
        updatedAt: new Date(),
      })
      .where(and(eq(tenantOrders.id, orderId), eq(tenantOrders.status, order.prev)))
      .returning({ id: tenantOrders.id });

    if (updated.length === 0) {
      return NextResponse.json(
        { error: "order state changed concurrently" },
        { status: 409 }
      );
    }

    // Count the sale exactly once, on first entry into a sold state from pending.
    if ((status === "paid" || status === "delivered") && order.prev === "pending") {
      await db
        .update(tenantProducts)
        .set({ totalSold: sql`${tenantProducts.totalSold} + 1` })
        .where(eq(tenantProducts.id, order.productId));
    }

    // Release the reserved stock unit if the order won't complete.
    if ((status === "expired" || status === "failed") && order.prev === "pending") {
      await releaseStock(order.productId, order.variantId);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return serverError("platform/settle", e);
  }
}

async function releaseStock(productId: string, variantId: string | null): Promise<void> {
  if (!variantId) {
    await db
      .update(tenantProducts)
      .set({ stock: sql`${tenantProducts.stock} + 1`, updatedAt: new Date() })
      .where(eq(tenantProducts.id, productId));
    return;
  }
  await db.transaction(async (tx) => {
    const [p] = await tx
      .select()
      .from(tenantProducts)
      .where(eq(tenantProducts.id, productId))
      .for("update")
      .limit(1);
    if (!p) return;
    const variants = (p.variants as Variant[] | null) ?? [];
    const idx = variants.findIndex((v) => v.id === variantId);
    if (idx === -1) return;
    variants[idx] = { ...variants[idx], stock: variants[idx].stock + 1 };
    await tx
      .update(tenantProducts)
      .set({ variants, updatedAt: new Date() })
      .where(eq(tenantProducts.id, productId));
  });
}
