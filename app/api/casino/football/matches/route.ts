import { NextResponse } from "next/server";
import { getCasinoUser } from "@/lib/casino/auth";
import { getUpcomingFixtures } from "@/lib/football/api";
import { serverError } from "@/lib/http";

export async function GET(req: Request) {
  try {
    const user = await getCasinoUser(req);
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const matches = await getUpcomingFixtures();
    return NextResponse.json({ matches, configured: !!process.env.API_FOOTBALL_KEY });
  } catch (e) {
    return serverError("casino/football/matches", e);
  }
}
