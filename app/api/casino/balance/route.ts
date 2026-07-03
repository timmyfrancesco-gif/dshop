import { NextResponse } from "next/server";
import { getCasinoUser, getBalanceCents } from "@/lib/casino/auth";
import { serverError } from "@/lib/http";

export async function GET(req: Request) {
  try {
    const user = await getCasinoUser(req);
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const balanceCents = await getBalanceCents(user);
    return NextResponse.json({ balanceCents, testMode: process.env.CASINO_TEST_MODE !== "false" });
  } catch (e) {
    return serverError("casino/balance", e);
  }
}
