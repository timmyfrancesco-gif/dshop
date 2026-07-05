import { NextRequest, NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/adminSession";
import { db } from "@/lib/db";
import { tenantOrders, tenantProducts, tenants, storeOrders, storeProducts } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";

/**
 * Real platform numbers for the admin dashboard, straight from the DB —
 * tenant shop orders (tenant_orders) UNIONed with main-site store orders
 * (store_orders), so Invoices/Customers reflect every sale on the platform.
 * Revenue counts only paid/delivered.
 */
export async function GET(req: NextRequest) {
  if (!hasAdminSession(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [tenantTotals] = await db
    .select({
      totalOrders: sql<number>`count(*)::int`,
      paidOrders: sql<number>`count(*) filter (where status in ('paid','delivered'))::int`,
      revenueEur: sql<number>`coalesce(sum(amount_eur) filter (where status in ('paid','delivered')), 0)::float`,
    })
    .from(tenantOrders);

  const [storeTotals] = await db
    .select({
      totalOrders: sql<number>`count(*)::int`,
      paidOrders: sql<number>`count(*) filter (where status = 'paid')::int`,
      revenueEur: sql<number>`coalesce(sum(amount_eur) filter (where status = 'paid'), 0)::float`,
    })
    .from(storeOrders);

  const tenantOrderRows = await db
    .select({
      id: tenantOrders.id,
      product: tenantProducts.name,
      tenantSlug: tenants.slug,
      amountEur: tenantOrders.amountEur,
      status: tenantOrders.status,
      method: tenantOrders.method,
      buyerEmail: tenantOrders.buyerEmail,
      createdAt: tenantOrders.createdAt,
    })
    .from(tenantOrders)
    .innerJoin(tenantProducts, eq(tenantOrders.productId, tenantProducts.id))
    .innerJoin(tenants, eq(tenantOrders.tenantId, tenants.id))
    .orderBy(desc(tenantOrders.createdAt))
    .limit(200);

  const storeOrderRows = await db
    .select({
      id: storeOrders.id,
      product: storeProducts.name,
      amountEur: storeOrders.amountEur,
      status: storeOrders.status,
      buyerEmail: storeOrders.buyerEmail,
      createdAt: storeOrders.createdAt,
    })
    .from(storeOrders)
    .innerJoin(storeProducts, eq(storeOrders.productId, storeProducts.id))
    .orderBy(desc(storeOrders.createdAt))
    .limit(200);

  const orders = [
    ...tenantOrderRows.map((o) => ({ ...o, tenantSlug: o.tenantSlug, method: o.method ?? "ltc" })),
    ...storeOrderRows.map((o) => ({ ...o, tenantSlug: "Main site", method: "ltc" })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const totalOrders = tenantTotals.totalOrders + storeTotals.totalOrders;
  const paidOrders = tenantTotals.paidOrders + storeTotals.paidOrders;
  const revenueEur = tenantTotals.revenueEur + storeTotals.revenueEur;

  // Customers: aggregate paid/delivered spend per email across both sources.
  const spendByEmail = new Map<string, { orders: number; totalSpent: number; lastOrder: Date }>();
  for (const o of [...tenantOrderRows, ...storeOrderRows]) {
    if (!o.buyerEmail) continue;
    const paid = o.status === "paid" || o.status === "delivered";
    const cur = spendByEmail.get(o.buyerEmail) ?? { orders: 0, totalSpent: 0, lastOrder: o.createdAt };
    cur.orders += 1;
    if (paid) cur.totalSpent += o.amountEur;
    if (o.createdAt > cur.lastOrder) cur.lastOrder = o.createdAt;
    spendByEmail.set(o.buyerEmail, cur);
  }
  const customers = [...spendByEmail.entries()]
    .map(([email, v]) => ({ email, orders: v.orders, totalSpent: v.totalSpent, lastOrder: v.lastOrder.toISOString() }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 200);

  return NextResponse.json({
    totalOrders,
    paidOrders,
    revenueEur,
    totalCustomers: customers.length,
    avgOrderEur: paidOrders > 0 ? revenueEur / paidOrders : 0,
    orders: orders.slice(0, 200),
    customers,
  });
}
