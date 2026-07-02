import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenants, tenantProducts, tenantOrders } from "@/lib/db/schema";
import { eq, and, gt, sql } from "drizzle-orm";
import { generateWallet, getLtcPriceEur } from "@/lib/crypto/wallet";
import { encryptSecret } from "@/lib/crypto/secrets";
import { serverError } from "@/lib/http";
import { randomBytes } from "crypto";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Variant = { id: string; title: string; price: number; stock: number; stockItems?: string[] };

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tenantId } = await params;

  try {
    const body = await req.json();
    const { productId, variantId, email, method } = body as {
      productId?: string;
      variantId?: string;
      email?: string;
      method?: string;
    };

    if (!productId || !email || !EMAIL_RE.test(email) || email.length > 254) {
      return NextResponse.json(
        { error: "productId and a valid email are required" },
        { status: 400 }
      );
    }

    const payMethod = method === "paypal" ? "paypal" : "ltc";

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
    if (payMethod === "ltc" && !tenant.ltcAddress) {
      return NextResponse.json(
        { error: "this shop has not finished wallet setup" },
        { status: 409 }
      );
    }
    if (payMethod === "paypal" && !tenant.paypalEmail) {
      return NextResponse.json(
        { error: "this shop does not accept PayPal" },
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
      const variant = (product.variants as Variant[] | null)?.find((v) => v.id === variantId);
      if (!variant) {
        return NextResponse.json({ error: "variant not found" }, { status: 404 });
      }
      amountEur = variant.price;
    }

    const feeEur = Number((amountEur * (tenant.feePct / 100)).toFixed(2));

    let amountLtc: number | null = null;
    if (payMethod === "ltc") {
      const ltcPrice = await getLtcPriceEur();
      if (!ltcPrice) {
        return NextResponse.json(
          { error: "price feed unavailable, try again shortly" },
          { status: 503 }
        );
      }
      amountLtc = Number((amountEur / ltcPrice).toFixed(8));
    }

    // Atomically reserve one unit of stock so finite digital goods can't oversell.
    const reserved = await reserveStock(tenantId, productId, variantId);
    if (!reserved) {
      return NextResponse.json({ error: "out of stock" }, { status: 409 });
    }

    // From here, if anything fails we must release the reserved unit.
    try {
      if (payMethod === "paypal") {
        // Unique code the buyer puts in the PayPal note; the bot matches the
        // incoming PayPal notification email on this code + amount.
        const paypalNote = `DS-${randomBytes(4).toString("hex").toUpperCase()}`;

        const [order] = await db
          .insert(tenantOrders)
          .values({
            tenantId,
            productId,
            variantId: variantId ?? null,
            buyerEmail: email,
            amountEur,
            amountLtc: null,
            feePct: tenant.feePct,
            feeEur,
            method: "paypal",
            paypalNote,
            ltcAddress: "",
            payoutAddress: null,
            status: "pending",
          })
          .returning();

        return NextResponse.json({
          orderId: order.id,
          method: "paypal",
          paypalEmail: tenant.paypalEmail,
          paypalNote: order.paypalNote,
          amountEur: order.amountEur,
          status: order.status,
        });
      }

      const payWallet = await generateWallet("ltc");
      if (!payWallet) {
        await releaseStock(tenantId, productId, variantId);
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
          method: "ltc",
          ltcAddress: payWallet.address,
          payPrivateKey: encryptSecret(payWallet.privateKey),
          payoutAddress: tenant.ltcAddress,
          status: "pending",
        })
        .returning();

      return NextResponse.json({
        orderId: order.id,
        method: "ltc",
        address: order.ltcAddress,
        amountLtc: order.amountLtc,
        amountEur: order.amountEur,
        status: order.status,
      });
    } catch (e) {
      await releaseStock(tenantId, productId, variantId);
      throw e;
    }
  } catch (e) {
    return serverError("tenants/orders POST", e);
  }
}

/** Atomically decrement one unit of stock. Returns false if none available. */
async function reserveStock(
  tenantId: string,
  productId: string,
  variantId?: string
): Promise<boolean> {
  if (!variantId) {
    const rows = await db
      .update(tenantProducts)
      .set({ stock: sql`${tenantProducts.stock} - 1`, updatedAt: new Date() })
      .where(
        and(
          eq(tenantProducts.id, productId),
          eq(tenantProducts.tenantId, tenantId),
          gt(tenantProducts.stock, 0)
        )
      )
      .returning({ id: tenantProducts.id });
    return rows.length > 0;
  }

  return db.transaction(async (tx) => {
    const [p] = await tx
      .select()
      .from(tenantProducts)
      .where(eq(tenantProducts.id, productId))
      .for("update")
      .limit(1);
    if (!p) return false;
    const variants = (p.variants as Variant[] | null) ?? [];
    const idx = variants.findIndex((v) => v.id === variantId);
    if (idx === -1 || variants[idx].stock <= 0) return false;
    variants[idx] = { ...variants[idx], stock: variants[idx].stock - 1 };
    await tx
      .update(tenantProducts)
      .set({ variants, updatedAt: new Date() })
      .where(eq(tenantProducts.id, productId));
    return true;
  });
}

/** Restore one unit of stock (reservation rollback or order expiry). */
async function releaseStock(
  tenantId: string,
  productId: string,
  variantId?: string
): Promise<void> {
  if (!variantId) {
    await db
      .update(tenantProducts)
      .set({ stock: sql`${tenantProducts.stock} + 1`, updatedAt: new Date() })
      .where(and(eq(tenantProducts.id, productId), eq(tenantProducts.tenantId, tenantId)));
    return;
  }
  await db.transaction(async (tx) => {
    const [p] = await tx
      .select()
      .from(tenantProducts)
      .where(eq(tenantProducts.id, productId))
      .for("update")
      .limit(1);
    if (!p) return;
    const variants = (p.variants as Variant[] | null) ?? [];
    const idx = variants.findIndex((v) => v.id === variantId);
    if (idx === -1) return;
    variants[idx] = { ...variants[idx], stock: variants[idx].stock + 1 };
    await tx
      .update(tenantProducts)
      .set({ variants, updatedAt: new Date() })
      .where(eq(tenantProducts.id, productId));
  });
}
