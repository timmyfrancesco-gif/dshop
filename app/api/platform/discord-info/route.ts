import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { discordVerifications, tenantOrders, storeOrders } from "@/lib/db/schema";
import { desc, eq, or, sql } from "drizzle-orm";
import { checkPlatformHeader } from "@/lib/platform/auth";
import { serverError } from "@/lib/http";

/**
 * Bot-facing: given a Discord user id, returns everything the site knows
 * about them — verification history + (if they verified with the "email"
 * scope) their platform order stats, so the bot's ,info command can show
 * "linked to the website" info like order count / total spent.
 */
export async function GET(req: Request) {
  if (!checkPlatformHeader(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const discordUserId = searchParams.get("discordUserId");
    if (!discordUserId) {
      return NextResponse.json({ error: "discordUserId is required" }, { status: 400 });
    }

    const verifications = await db
      .select()
      .from(discordVerifications)
      .where(eq(discordVerifications.discordUserId, discordUserId))
      .orderBy(desc(discordVerifications.verifiedAt));

    if (verifications.length === 0) {
      return NextResponse.json({ verified: false, linked: false });
    }

    const guilds = [...new Set(verifications.map((v) => v.guildId))];
    const latest = verifications[0];
    // Prefer the most recent record that actually captured an email (older
    // verifications, or ones granted before the email scope was added,
    // won't have one).
    const email = verifications.find((v) => v.email)?.email ?? null;

    const base = {
      verified: true,
      discordUserId,
      username: latest.username,
      globalName: latest.globalName,
      guilds,
      linked: !!email,
    };

    if (!email) {
      return NextResponse.json(base);
    }

    const [tenantStats] = await db
      .select({
        orders: sql<number>`count(*)::int`,
        totalSpentEur: sql<number>`coalesce(sum(amount_eur) filter (where status in ('paid','delivered')), 0)::float`,
      })
      .from(tenantOrders)
      .where(eq(tenantOrders.buyerEmail, email));

    const [storeStats] = await db
      .select({
        orders: sql<number>`count(*)::int`,
        totalSpentEur: sql<number>`coalesce(sum(amount_eur) filter (where status = 'paid'), 0)::float`,
      })
      .from(storeOrders)
      .where(eq(storeOrders.buyerEmail, email));

    const recentOrders = await db
      .select({
        id: storeOrders.id,
        amountEur: storeOrders.amountEur,
        status: storeOrders.status,
        createdAt: storeOrders.createdAt,
      })
      .from(storeOrders)
      .where(or(eq(storeOrders.buyerEmail, email)))
      .orderBy(desc(storeOrders.createdAt))
      .limit(5);

    return NextResponse.json({
      ...base,
      email,
      orders: {
        count: tenantStats.orders + storeStats.orders,
        totalSpentEur: Number((tenantStats.totalSpentEur + storeStats.totalSpentEur).toFixed(2)),
      },
      recentOrders,
    });
  } catch (e) {
    return serverError("platform/discord-info", e);
  }
}
