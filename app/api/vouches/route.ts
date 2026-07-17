import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { vouches } from "@/lib/db/schema";
import { constantTimeEqual, hasAdminSession } from "@/lib/adminSession";
import { serverError } from "@/lib/http";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? process.env.NEXT_PUBLIC_ADMIN_TOKEN ?? "";

// Same bearer-token pattern as /api/transcripts and /api/tos.
function validateToken(req: NextRequest): boolean {
  if (hasAdminSession(req)) return true;
  const auth = req.headers.get("authorization");
  if (!auth || !ADMIN_TOKEN) return false;
  const token = auth.replace(/^Bearer\s+/i, "");
  return constantTimeEqual(token, ADMIN_TOKEN);
}

interface VouchBody {
  buyerId?: string;
  buyerName?: string;
  buyerAvatarUrl?: string;
  sellerId?: string;
  sellerName?: string | null;
  quantity?: number;
  product?: string;
  price?: number;
  priceFlaggedCorrected?: boolean;
  priceOriginalParsed?: number | null;
  method?: string;
  messageId?: string;
  channelId?: string;
  postedAt?: string;
}

export async function POST(req: NextRequest) {
  if (!validateToken(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: VouchBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const missing = (["buyerId", "sellerId", "quantity", "product", "price", "method", "messageId"] as const).filter(
    (k) => body[k] === undefined || body[k] === null || body[k] === ""
  );
  if (missing.length > 0) {
    return NextResponse.json({ error: `Missing required fields: ${missing.join(", ")}` }, { status: 400 });
  }
  if (typeof body.quantity !== "number" || typeof body.price !== "number") {
    return NextResponse.json({ error: "quantity and price must be numbers" }, { status: 400 });
  }

  try {
    const postedAt = body.postedAt ? new Date(body.postedAt) : null;

    await db
      .insert(vouches)
      .values({
        messageId: body.messageId!,
        buyerId: body.buyerId!,
        buyerName: body.buyerName ?? null,
        buyerAvatarUrl: body.buyerAvatarUrl ?? null,
        sellerId: body.sellerId!,
        sellerName: body.sellerName ?? null,
        quantity: body.quantity,
        product: body.product!,
        price: body.price,
        priceFlaggedCorrected: body.priceFlaggedCorrected ?? false,
        priceOriginalParsed: body.priceOriginalParsed ?? null,
        method: body.method!,
        channelId: body.channelId ?? null,
        postedAt: postedAt && !isNaN(postedAt.getTime()) ? postedAt : null,
      })
      .onConflictDoUpdate({
        target: vouches.messageId,
        set: {
          buyerId: body.buyerId!,
          buyerName: body.buyerName ?? null,
          buyerAvatarUrl: body.buyerAvatarUrl ?? null,
          sellerId: body.sellerId!,
          sellerName: body.sellerName ?? null,
          quantity: body.quantity,
          product: body.product!,
          price: body.price,
          priceFlaggedCorrected: body.priceFlaggedCorrected ?? false,
          priceOriginalParsed: body.priceOriginalParsed ?? null,
          method: body.method!,
          channelId: body.channelId ?? null,
          postedAt: postedAt && !isNaN(postedAt.getTime()) ? postedAt : null,
        },
      });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return serverError("vouches-post", e, "failed to save vouch");
  }
}

export async function GET(req: NextRequest) {
  try {
    const sellerId = req.nextUrl.searchParams.get("sellerId");
    const limitParam = Number(req.nextUrl.searchParams.get("limit"));
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 100;

    const rows = sellerId
      ? await db
          .select()
          .from(vouches)
          .where(eq(vouches.sellerId, sellerId))
          .orderBy(desc(vouches.postedAt))
          .limit(limit)
      : await db.select().from(vouches).orderBy(desc(vouches.postedAt)).limit(limit);

    return NextResponse.json({ vouches: rows });
  } catch (e) {
    return serverError("vouches-get", e, "failed to load vouches");
  }
}
