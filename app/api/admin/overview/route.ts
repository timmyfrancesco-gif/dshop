import { NextRequest, NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/adminSession";
import { db } from "@/lib/db";
import { tenantOrders, tenantProducts, tenants } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";

/**
 * Real platform numbers for the admin dashboard, straight from the DB
 * (tenant_orders across all shops). Revenue counts only paid/delivered.
 */
export async function GET(req: NextRequest) {
  if (!hasAdminSession(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [totals] = await db
    .select({
      totalOrders: sql<number>`count(*)::int`,
      paidOrders: sql<number>`count(*) filter (where status in ('paid','delivered'))::int`,
      revenueEur: sql<number>`coalesce(sum(amount_eur) filter (where status in ('paid','delivered')), 0)::float`,
      totalCustomers: sql<number>`count(distinct buyer_email) filter (where status in ('paid','delivered'))::int`,
    })
    .from(tenantOrders);

  const orders = await db
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

  const customers = await db
    .select({
      email: tenantOrders.buyerEmail,
      orders: sql<number>`count(*)::int`,
      totalSpent: sql<number>`coalesce(sum(amount_eur) filter (where status in ('paid','delivered')), 0)::float`,
      lastOrder: sql<string>`max(created_at)`,
    })
    .from(tenantOrders)
    .groupBy(tenantOrders.buyerEmail)
    .orderBy(sql`coalesce(sum(amount_eur) filter (where status in ('paid','delivered')), 0) desc`)
    .limit(200);

  return NextResponse.json({
    ...totals,
    avgOrderEur: totals.paidOrders > 0 ? totals.revenueEur / totals.paidOrders : 0,
    orders,
    customers: customers.filter((c) => c.email),
  });
}
