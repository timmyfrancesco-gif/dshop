import { NextRequest, NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/adminSession";
import { db } from "@/lib/db";
import { storeProducts } from "@/lib/db/schema";
import { listStockItems } from "@/lib/store/inventory";
import { eq } from "drizzle-orm";
import { serverError } from "@/lib/http";

const HTTPS = (v: string) => {
  try {
    const u = new URL(v);
    return u.protocol === "https:" && v.length <= 2048;
  } catch {
    return false;
  }
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!hasAdminSession(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const items = await listStockItems(id);
    return NextResponse.json({ items });
  } catch (e) {
    return serverError("store/admin/product GET", e);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!hasAdminSession(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const b = await req.json().catch(() => ({}));
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if ("name" in b) {
      const v = String(b.name ?? "").trim();
      if (!v || v.length > 200) return NextResponse.json({ error: "invalid name" }, { status: 400 });
      updates.name = v;
    }
    if ("price" in b) {
      const v = Number(b.price);
      if (!Number.isFinite(v) || v < 0) return NextResponse.json({ error: "invalid price" }, { status: 400 });
      updates.price = v;
    }
    if ("description" in b) updates.description = String(b.description ?? "").slice(0, 4000);
    if ("category" in b) updates.category = String(b.category ?? "Shop").slice(0, 80) || "Shop";
    if ("active" in b) updates.active = !!b.active;
    if ("sortOrder" in b && Number.isFinite(Number(b.sortOrder))) updates.sortOrder = Number(b.sortOrder);
    if ("image" in b) {
      const v = b.image ? String(b.image) : null;
      if (v && !HTTPS(v)) return NextResponse.json({ error: "image must be https" }, { status: 400 });
      updates.image = v;
    }

    const [p] = await db.update(storeProducts).set(updates).where(eq(storeProducts.id, id)).returning();
    if (!p) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ product: p });
  } catch (e) {
    return serverError("store/admin/product PUT", e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!hasAdminSession(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    await db.delete(storeProducts).where(eq(storeProducts.id, id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return serverError("store/admin/product DELETE", e);
  }
}
