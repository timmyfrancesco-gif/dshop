import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { footballBets } from "@/lib/db/schema";
import { getCasinoUser, debitBalance } from "@/lib/casino/auth";
import { getUpcomingFixtures, getFixtureOdds } from "@/lib/football/api";
import { serverError } from "@/lib/http";

const MIN_BET = 10;
const MAX_BET = 50000;
const SELECTIONS = ["home", "draw", "away"] as const;

export async function POST(req: Request) {
  try {
    const user = await getCasinoUser(req);
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const fixtureId = Number(body?.fixtureId);
    const selection = body?.selection;
    const stakeCents = Math.floor(Number(body?.stakeCents));

    if (!Number.isFinite(fixtureId) || !SELECTIONS.includes(selection)) {
      return NextResponse.json({ error: "invalid selection" }, { status: 400 });
    }
    if (!Number.isFinite(stakeCents) || stakeCents < MIN_BET || stakeCents > MAX_BET) {
      return NextResponse.json({ error: "invalid stake" }, { status: 400 });
    }

    // Match must be in the current upcoming list (not started) and have odds.
    const matches = await getUpcomingFixtures();
    const match = matches.find((m) => m.fixtureId === fixtureId);
    if (!match) {
      return NextResponse.json({ error: "match not available" }, { status: 409 });
    }
    if (match.status !== "NS") {
      return NextResponse.json({ error: "betting closed for this match" }, { status: 409 });
    }
    const market = await getFixtureOdds(fixtureId);
    if (!market) {
      return NextResponse.json({ error: "odds unavailable" }, { status: 409 });
    }
    const odds = market[selection as "home" | "draw" | "away"];
    if (!odds || odds <= 1) {
      return NextResponse.json({ error: "odds unavailable" }, { status: 409 });
    }

    const afterDebit = await debitBalance(user, stakeCents);
    if (afterDebit === null) {
      return NextResponse.json({ error: "insufficient balance" }, { status: 409 });
    }

    const [bet] = await db
      .insert(footballBets)
      .values({
        userId: user.id,
        fixtureId,
        league: match.league,
        home: match.home,
        away: match.away,
        kickoff: match.kickoff ? new Date(match.kickoff) : null,
        selection,
        odds,
        stakeCents,
        status: "pending",
      })
      .returning();

    return NextResponse.json({
      bet: {
        id: bet.id,
        home: bet.home,
        away: bet.away,
        selection: bet.selection,
        odds: bet.odds,
        stakeCents: bet.stakeCents,
        potentialCents: Math.floor(bet.stakeCents * bet.odds),
      },
      balanceCents: afterDebit,
    });
  } catch (e) {
    return serverError("casino/football/bet", e);
  }
}
