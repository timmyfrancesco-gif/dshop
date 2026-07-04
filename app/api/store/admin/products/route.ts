import { NextRequest, NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/adminSession";
import { db } from "@/lib/db";
import { storeProducts } from "@/lib/db/schema";
import { listProducts } from "@/lib/store/inventory";
import { serverError } from "@/lib/http";

const HTTPS = (v: string) => {
  try {
    const u = new URL(v);
    return u.protocol === "https:" && v.length <= 2048;
  } catch {
    return false;
  }
};

export async function GET(req: NextRequest) {
  if (!hasAdminSession(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ products: await listProducts() });
  } catch (e) {
    return serverError("store/admin/products GET", e);
  }
}

export async function POST(req: NextRequest) {
  if (!hasAdminSession(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await req.json().catch(() => ({}));
    const name = String(b?.name ?? "").trim();
    const price = Number(b?.price);
    if (!name || name.length > 200) return NextResponse.json({ error: "invalid name" }, { status: 400 });
    if (!Number.isFinite(price) || price < 0) return NextResponse.json({ error: "invalid price" }, { status: 400 });
    const image = typeof b?.image === "string" && b.image ? b.image : null;
    if (image && !HTTPS(image)) return NextResponse.json({ error: "image must be https" }, { status: 400 });

    const [p] = await db
      .insert(storeProducts)
      .values({
        name,
        price,
        description: String(b?.description ?? "").slice(0, 4000),
        category: String(b?.category ?? "Shop").slice(0, 80) || "Shop",
        image,
        active: b?.active !== false,
        sortOrder: Number.isFinite(Number(b?.sortOrder)) ? Number(b.sortOrder) : 0,
      })
      .returning();
    return NextResponse.json({ product: p });
  } catch (e) {
    return serverError("store/admin/products POST", e);
  }
}
