import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { casinoWithdrawals } from "@/lib/db/schema";
import { getCasinoUser } from "@/lib/casino/auth";
import { desc, eq } from "drizzle-orm";
import { serverError } from "@/lib/http";

export async function GET(req: Request) {
  try {
    const user = await getCasinoUser(req);
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const withdrawals = await db
      .select()
      .from(casinoWithdrawals)
      .where(eq(casinoWithdrawals.userId, user.id))
      .orderBy(desc(casinoWithdrawals.createdAt))
      .limit(30);
    return NextResponse.json({ withdrawals });
  } catch (e) {
    return serverError("casino/withdrawals", e);
  }
}
