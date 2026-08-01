import { NextResponse } from "next/server";
import { settleStoreOrder } from "@/lib/store/settle";
import { verifyOrderWebhookToken } from "@/lib/store/webhookToken";
import { serverError } from "@/lib/http";

/**
 * BlockCypher pushes here the instant an order's payment address reaches
 * the required confirmation count — settles far faster than waiting for the
 * client's next poll. We don't trust the payload amounts; settleStoreOrder
 * re-checks the address on-chain itself before doing anything.
 *
 * Authenticated with a per-order HMAC token rather than the shared secret:
 * this URL is stored by a third party, and the shared secret also unlocks
 * /api/platform/pending-orders (which returns decrypted private keys).
 */
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("s") ?? "";
    const orderId = searchParams.get("order") ?? "";
    if (!orderId || !verifyOrderWebhookToken(orderId, token)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    await settleStoreOrder(orderId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return serverError("store/orders/webhook", e);
  }
}

// BlockCypher pings the URL with GET when creating a hook to validate it.
export async function GET() {
  return NextResponse.json({ ok: true });
}
