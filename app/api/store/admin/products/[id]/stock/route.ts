import { NextRequest, NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/adminSession";
import { addStock, replaceStock } from "@/lib/store/inventory";
import { serverError } from "@/lib/http";

/**
 * Restock. Body: { items: string[], mode: "add" | "replace" }.
 * "add" appends new deliverables; "replace" swaps the available pool.
 * Stock is always the count of real item rows afterwards.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!hasAdminSession(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const b = await req.json().catch(() => ({}));
    const raw = b?.items;
    const items: string[] = Array.isArray(raw)
      ? raw.map((x) => String(x))
      : typeof raw === "string"
      ? raw.split("\n")
      : [];
    const mode = b?.mode === "replace" ? "replace" : "add";
    const stock = mode === "replace" ? await replaceStock(id, items) : await addStock(id, items);
    return NextResponse.json({ stock });
  } catch (e) {
    return serverError("store/admin/stock POST", e);
  }
}
