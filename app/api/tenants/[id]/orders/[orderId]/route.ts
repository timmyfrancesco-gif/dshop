import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenantOrders } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// Public order-status endpoint used by the buyer's checkout to poll for
// payment. Returns only non-sensitive fields (never the private key).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; orderId: string }> }
) {
  const { id: tenantId, orderId } = await params;

  try {
    const rows = await db
      .select({
        id: tenantOrders.id,
        status: tenantOrders.status,
        address: tenantOrders.ltcAddress,
        amountLtc: tenantOrders.amountLtc,
        amountEur: tenantOrders.amountEur,
        deliveredItem: tenantOrders.deliveredItem,
        txHash: tenantOrders.txHash,
        confirmations: tenantOrders.confirmations,
      })
      .from(tenantOrders)
      .where(
        and(eq(tenantOrders.id, orderId), eq(tenantOrders.tenantId, tenantId))
      )
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json({ error: "order not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
