import { NextResponse } from "next/server";
import { getCasinoUser } from "@/lib/casino/auth";
import { getFixtureOdds } from "@/lib/football/api";
import { serverError } from "@/lib/http";

export async function GET(req: Request) {
  try {
    const user = await getCasinoUser(req);
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const fixtureId = Number(searchParams.get("fixture"));
    if (!Number.isFinite(fixtureId)) {
      return NextResponse.json({ error: "invalid fixture" }, { status: 400 });
    }
    const odds = await getFixtureOdds(fixtureId);
    return NextResponse.json({ odds });
  } catch (e) {
    return serverError("casino/football/odds", e);
  }
}
