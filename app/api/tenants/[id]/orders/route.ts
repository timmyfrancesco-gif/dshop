import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenants, tenantProducts, tenantOrders } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { generateWallet, getLtcPriceEur } from "@/lib/crypto/wallet";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tenantId } = await params;

  try {
    const body = await req.json();
    const { productId, variantId, email } = body as {
      productId?: string;
      variantId?: string;
      email?: string;
    };

    if (!productId || !email || !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "productId and a valid email are required" },
        { status: 400 }
      );
    }

    // Tenant + its main wallet (sweep destination)
    const tenantRows = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);
    if (tenantRows.length === 0) {
      return NextResponse.json({ error: "shop not found" }, { status: 404 });
    }
    const tenant = tenantRows[0];
    if (!tenant.active) {
      return NextResponse.json({ error: "shop is not active" }, { status: 403 });
    }
    if (!tenant.ltcAddress) {
      return NextResponse.json(
        { error: "this shop has not finished wallet setup" },
        { status: 409 }
      );
    }

    // Product must belong to this tenant and be active
    const productRows = await db
      .select()
      .from(tenantProducts)
      .where(
        and(
          eq(tenantProducts.id, productId),
          eq(tenantProducts.tenantId, tenantId),
          eq(tenantProducts.active, true)
        )
      )
      .limit(1);
    if (productRows.length === 0) {
      return NextResponse.json({ error: "product not found" }, { status: 404 });
    }
    const product = productRows[0];

    // Resolve price (variant overrides product price)
    let amountEur = product.price;
    if (variantId) {
      const variant = product.variants?.find((v) => v.id === variantId);
      if (!variant) {
        return NextResponse.json({ error: "variant not found" }, { status: 404 });
      }
      amountEur = variant.price;
    }

    const ltcPrice = await getLtcPriceEur();
    if (!ltcPrice) {
      return NextResponse.json(
        { error: "price feed unavailable, try again shortly" },
        { status: 503 }
      );
    }
    const amountLtc = Number((amountEur / ltcPrice).toFixed(8));
    const feeEur = Number((amountEur * (tenant.feePct / 100)).toFixed(2));

    // Temporary wallet that receives this payment
    const payWallet = await generateWallet("ltc");
    if (!payWallet) {
      return NextResponse.json(
        { error: "could not create payment wallet, try again" },
        { status: 503 }
      );
    }

    const [order] = await db
      .insert(tenantOrders)
      .values({
        tenantId,
        productId,
        variantId: variantId ?? null,
        buyerEmail: email,
        amountEur,
        amountLtc,
        feePct: tenant.feePct,
        feeEur,
        ltcAddress: payWallet.address,
        payPrivateKey: payWallet.privateKey,
        payoutAddress: tenant.ltcAddress,
        status: "pending",
      })
      .returning();

    return NextResponse.json({
      orderId: order.id,
      address: order.ltcAddress,
      amountLtc: order.amountLtc,
      amountEur: order.amountEur,
      status: order.status,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
