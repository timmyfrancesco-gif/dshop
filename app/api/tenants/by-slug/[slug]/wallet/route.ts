import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const secret = req.headers.get("x-platform-secret");
  if (secret !== process.env.PLATFORM_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  const rows = await db
    .select({
      id: tenants.id,
      slug: tenants.slug,
      name: tenants.name,
      ltcAddress: tenants.ltcAddress,
      btcAddress: tenants.btcAddress,
      feePct: tenants.feePct,
    })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: "tenant not found" }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}
