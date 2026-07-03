import { NextResponse } from "next/server";
import { checkPlatformHeader } from "@/lib/platform/auth";
import { expireStaleOrders } from "@/lib/platform/expireStale";
import { serverError } from "@/lib/http";

/**
 * Sweeps abandoned pending orders and releases their reserved stock.
 * Runs on a daily Vercel Cron (Hobby-plan compatible) as a backstop; the
 * frequent sweeping happens opportunistically inside /api/platform/pending-orders,
 * which the bot polls every minute.
 *
 * Cron calls arrive as GET with `Authorization: Bearer $CRON_SECRET`;
 * manual/bot calls use POST with x-platform-secret.
 */
function authorized(req: Request): boolean {
  if (checkPlatformHeader(req)) return true;
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${cronSecret}`;
}

export async function GET(req: Request) {
  return sweep(req);
}

export async function POST(req: Request) {
  return sweep(req);
}

async function sweep(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const expired = await expireStaleOrders();
    return NextResponse.json({ ok: true, expired });
  } catch (e) {
    return serverError("platform/expire-orders", e);
  }
}
