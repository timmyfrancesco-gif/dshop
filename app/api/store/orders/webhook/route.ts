import { NextResponse } from "next/server";
import { settleStoreOrder } from "@/lib/store/settle";
import { serverError } from "@/lib/http";

function webhookSecret(): string {
  return process.env.STORE_WEBHOOK_SECRET || process.env.BOT_API_SECRET || process.env.PLATFORM_SECRET || "";
}

/**
 * BlockCypher pushes here the instant an order's payment address reaches
 * the required confirmation count — settles far faster than waiting for the
 * client's next poll. We don't trust the payload amounts; settleStoreOrder
 * re-checks the address on-chain itself before doing anything.
 */
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("s") ?? "";
    const orderId = searchParams.get("order") ?? "";
    const expected = webhookSecret();
    if (!expected || secret !== expected || !orderId) {
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
