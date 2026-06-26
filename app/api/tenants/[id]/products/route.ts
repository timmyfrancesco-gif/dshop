import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenantProducts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tenantId } = await params;

  try {
    const products = await db
      .select()
      .from(tenantProducts)
      .where(
        and(
          eq(tenantProducts.tenantId, tenantId),
          eq(tenantProducts.active, true)
        )
      )
      .orderBy(tenantProducts.sortOrder);

    return NextResponse.json({ products });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
