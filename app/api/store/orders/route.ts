import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { storeOrders, storeProducts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateWalletVerbose, getLtcPriceEur } from "@/lib/crypto/wallet";
import { encryptSecret } from "@/lib/crypto/secrets";
import { availableCount } from "@/lib/store/inventory";
import { serverError } from "@/lib/http";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function webhookSecret(): string {
  return process.env.STORE_WEBHOOK_SECRET || process.env.BOT_API_SECRET || process.env.PLATFORM_SECRET || "";
}

function baseUrl(): string {
  const d = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "";
  if (!d) return "";
  return d.startsWith("http") ? d : `https://${d}`;
}

async function registerOrderWebhook(address: string, orderId: string) {
  const token = process.env.BLOCKCYPHER_TOKEN;
  const base = baseUrl();
  const secret = webhookSecret();
  if (!token || !base || !secret) return;
  try {
    const cb = `${base}/api/store/orders/webhook?s=${encodeURIComponent(secret)}&order=${encodeURIComponent(orderId)}`;
    await fetch(`https://api.blockcypher.com/v1/ltc/main/hooks?token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "tx-confirmation", address, url: cb, confirmations: 1 }),
    });
  } catch {
    // best-effort — the client poll is the fallback
  }
}

/**
 * Creates a store order. Stock is intentionally NOT reserved here: any
 * number of buyers can pay concurrently for a low-stock product. Whichever
 * payments are CONFIRMED first atomically claim the real stock (see
 * lib/store/settle.ts) — anyone whose payment clears after stock is gone
 * gets automatically refunded on-chain. The displayed stock count only ever
 * reflects items actually delivered.
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

    // Entry gate only (not authoritative) — stops new checkouts once the
    // product is genuinely sold out. The real allocation happens at settle time.
    const stock = await availableCount(productId);
    if (stock <= 0) {
      return NextResponse.json({ error: "out of stock" }, { status: 409 });
    }

    const ltcPrice = await getLtcPriceEur();
    if (!ltcPrice) {
      return NextResponse.json({ error: "price feed unavailable, try again shortly" }, { status: 503 });
    }
    const amountLtc = Number((product.price / ltcPrice).toFixed(8));

    const { wallet, error: walletError } = await generateWalletVerbose("ltc");
    if (!wallet) {
      console.error("[store/orders] wallet generation failed:", walletError);
      return NextResponse.json(
        { error: walletError ? `Payment wallet error: ${walletError}` : "could not create payment wallet, try again" },
        { status: 503 }
      );
    }

    const [order] = await db
      .insert(storeOrders)
      .values({
        productId,
        buyerEmail: email,
        amountEur: product.price,
        amountLtc,
        ltcAddress: wallet.address,
        payPrivateKey: encryptSecret(wallet.privateKey),
        status: "pending",
      })
      .returning();

    // Real-time payment detection (best-effort; the client poll is the fallback).
    await registerOrderWebhook(wallet.address, order.id);

    return NextResponse.json({
      orderId: order.id,
      address: order.ltcAddress,
      amountLtc: order.amountLtc,
      amountEur: order.amountEur,
      status: order.status,
    });
  } catch (e) {
    return serverError("store/orders POST", e);
  }
}
