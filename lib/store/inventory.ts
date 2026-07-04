import { db } from "@/lib/db";
import { storeProducts, storeStockItems } from "@/lib/db/schema";
import { and, eq, sql, asc } from "drizzle-orm";

/**
 * Platform-owned inventory. Stock is derived from real deliverable rows in
 * `store_stock_items` (status = 'available'), never a standalone counter — so
 * it cannot desync and can only drop on an actual atomic sale.
 */

export interface ProductWithStock {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image: string | null;
  category: string;
  active: boolean;
  sortOrder: number;
  totalSold: number;
  stock: number;
}

/** Products with live stock counts (available items) in one query. */
export async function listProducts(activeOnly = false): Promise<ProductWithStock[]> {
  const rows = await db
    .select({
      id: storeProducts.id,
      name: storeProducts.name,
      description: storeProducts.description,
      price: storeProducts.price,
      currency: storeProducts.currency,
      image: storeProducts.image,
      category: storeProducts.category,
      active: storeProducts.active,
      sortOrder: storeProducts.sortOrder,
      totalSold: storeProducts.totalSold,
      stock: sql<number>`count(${storeStockItems.id}) filter (where ${storeStockItems.status} = 'available')::int`,
    })
    .from(storeProducts)
    .leftJoin(storeStockItems, eq(storeStockItems.productId, storeProducts.id))
    .groupBy(storeProducts.id)
    .orderBy(asc(storeProducts.sortOrder), asc(storeProducts.createdAt));

  return activeOnly ? rows.filter((r) => r.active) : rows;
}

/** The raw deliverable items of a product (admin view). */
export async function listStockItems(productId: string) {
  return db
    .select()
    .from(storeStockItems)
    .where(eq(storeStockItems.productId, productId))
    .orderBy(asc(storeStockItems.createdAt));
}

/** Appends deliverable items. Returns the new available count. */
export async function addStock(productId: string, items: string[]): Promise<number> {
  const clean = items.map((i) => i.trim()).filter(Boolean);
  if (clean.length > 0) {
    await db.insert(storeStockItems).values(clean.map((content) => ({ productId, content })));
  }
  return availableCount(productId);
}

/** Replaces ALL available items with a new set (sold items are untouched). */
export async function replaceStock(productId: string, items: string[]): Promise<number> {
  const clean = items.map((i) => i.trim()).filter(Boolean);
  await db.transaction(async (tx) => {
    await tx
      .delete(storeStockItems)
      .where(and(eq(storeStockItems.productId, productId), eq(storeStockItems.status, "available")));
    if (clean.length > 0) {
      await tx.insert(storeStockItems).values(clean.map((content) => ({ productId, content })));
    }
  });
  return availableCount(productId);
}

export async function availableCount(productId: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(storeStockItems)
    .where(and(eq(storeStockItems.productId, productId), eq(storeStockItems.status, "available")));
  return row?.n ?? 0;
}

/**
 * Atomically claims one available item and marks it sold. Returns the
 * delivered content, or null if out of stock. Concurrency-safe via
 * FOR UPDATE SKIP LOCKED, so two buyers can never get the same item.
 */
export async function consumeOne(productId: string, orderId: string): Promise<string | null> {
  const rows = await db.execute(sql`
    UPDATE store_stock_items
    SET status = 'sold', order_id = ${orderId}, sold_at = NOW()
    WHERE id = (
      SELECT id FROM store_stock_items
      WHERE product_id = ${productId} AND status = 'available'
      ORDER BY created_at
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING content
  `);
  const list = (rows as unknown as { rows?: { content: string }[] }).rows ?? (rows as unknown as { content: string }[]);
  const content = Array.isArray(list) ? list[0]?.content : undefined;
  if (content) {
    await db
      .update(storeProducts)
      .set({ totalSold: sql`${storeProducts.totalSold} + 1` })
      .where(eq(storeProducts.id, productId));
  }
  return content ?? null;
}
