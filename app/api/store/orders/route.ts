import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { storeOrders, storeProducts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateWallet, getLtcPriceEur } from "@/lib/crypto/wallet";
import { encryptSecret } from "@/lib/crypto/secrets";
import { reserveOne, releaseReserved } from "@/lib/store/inventory";
import { serverError } from "@/lib/http";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Creates a platform store order: reserves one stock unit, generates a
 * one-off LTC payment address, and returns it for the buyer to pay.
 * Entirely bot-independent — payment is watched by GET /api/store/orders/[id].
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const productId = String(body?.productId ?? "");
    const email = String(body?.email ?? "").trim();

    if (!productId || !email || !EMAIL_RE.test(email) || email.length > 254) {
      return NextResponse.json({ error: "productId and a valid email are required" }, { status: 400 });
    }

    const [product] = await db
      .select()
      .from(storeProducts)
      .where(eq(storeProducts.id, productId))
      .limit(1);
    if (!product || !product.active) {
      return NextResponse.json({ error: "product not found" }, { status: 404 });
    }

    const ltcPrice = await getLtcPriceEur();
    if (!ltcPrice) {
      return NextResponse.json({ error: "price feed unavailable, try again shortly" }, { status: 503 });
    }
    const amountLtc = Number((product.price / ltcPrice).toFixed(8));

    // Create the order row first so reserveOne has an order id to tag the item with.
    const [order] = await db
      .insert(storeOrders)
      .values({ productId, buyerEmail: email, amountEur: product.price, amountLtc, status: "pending" })
      .returning();

    const reserved = await reserveOne(productId, order.id);
    if (!reserved) {
      await db.delete(storeOrders).where(eq(storeOrders.id, order.id));
      return NextResponse.json({ error: "out of stock" }, { status: 409 });
    }

    const wallet = await generateWallet("ltc");
    if (!wallet) {
      await releaseReserved(order.id);
      await db.delete(storeOrders).where(eq(storeOrders.id, order.id));
      return NextResponse.json({ error: "could not create payment wallet, try again" }, { status: 503 });
    }

    const [updated] = await db
      .update(storeOrders)
      .set({ ltcAddress: wallet.address, payPrivateKey: encryptSecret(wallet.privateKey) })
      .where(eq(storeOrders.id, order.id))
      .returning();

    return NextResponse.json({
      orderId: updated.id,
      address: updated.ltcAddress,
      amountLtc: updated.amountLtc,
      amountEur: updated.amountEur,
      status: updated.status,
    });
  } catch (e) {
    return serverError("store/orders POST", e);
  }
}
