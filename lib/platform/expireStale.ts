import { db } from "@/lib/db";
import { tenantOrders, tenantProducts } from "@/lib/db/schema";
import { and, eq, lt, sql } from "drizzle-orm";

type Variant = { id: string; title: string; price: number; stock: number; stockItems?: string[] };

// Matches the pending-orders TTL: after this the bot has stopped watching the
// temp wallet, so the order can never be paid and its reserved stock is safe
// to release.
const ORDER_TTL_MS = 1000 * 60 * 15;

/**
 * Marks abandoned `pending` tenant orders as `expired` and releases the unit
 * of stock reserved at checkout. Safe to call opportunistically (idempotent,
 * uses optimistic-concurrency so it can't double-release).
 */
export async function expireStaleOrders(): Promise<number> {
  const cutoff = new Date(Date.now() - ORDER_TTL_MS);
  const stale = await db
    .select({
      id: tenantOrders.id,
      productId: tenantOrders.productId,
      variantId: tenantOrders.variantId,
    })
    .from(tenantOrders)
    .where(and(eq(tenantOrders.status, "pending"), lt(tenantOrders.createdAt, cutoff)));

  let expired = 0;
  for (const order of stale) {
    const updated = await db
      .update(tenantOrders)
      .set({ status: "expired", updatedAt: new Date() })
      .where(and(eq(tenantOrders.id, order.id), eq(tenantOrders.status, "pending")))
      .returning({ id: tenantOrders.id });
    if (updated.length === 0) continue;
    await releaseStock(order.productId, order.variantId);
    expired++;
  }
  return expired;
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
