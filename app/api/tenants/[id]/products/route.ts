import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenantProducts, tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifySession, readSessionCookie } from "@/lib/tenant/session";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tenantId } = await params;

  try {
    const tenantRows = await db
      .select({ ownerId: tenants.ownerId })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);
    if (tenantRows.length === 0) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    if (!verifySession(readSessionCookie(req), tenantId, tenantRows[0].ownerId)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const products = await db
      .select()
      .from(tenantProducts)
      .where(eq(tenantProducts.tenantId, tenantId))
      .orderBy(tenantProducts.sortOrder);

    return NextResponse.json({ products });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
