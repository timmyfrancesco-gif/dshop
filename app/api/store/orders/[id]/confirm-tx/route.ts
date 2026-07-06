import { NextResponse } from "next/server";
import { confirmFallbackPayment } from "@/lib/store/settle";
import { serverError } from "@/lib/http";

/**
 * Called by the checkout page when an order used the shared fallback address
 * (per-order wallet generation failed) and the buyer has sent payment — the
 * buyer-submitted txid is the only way to attribute a payment on a shared
 * address to this specific order.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json().catch(() => ({}));
    const txHash = typeof body?.txHash === "string" ? body.txHash : "";
    if (!txHash.trim()) {
      return NextResponse.json({ error: "txHash is required" }, { status: 400 });
    }
    const result = await confirmFallbackPayment(id, txHash);
    if (!result) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(result);
  } catch (e) {
    return serverError("store/orders/[id]/confirm-tx POST", e);
  }
}
