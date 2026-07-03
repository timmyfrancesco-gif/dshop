import { db } from "@/lib/db";
import { footballCache } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * API-Football (api-sports.io) client. Free plan = 100 requests/day, so:
 *  - the upcoming-fixtures list is ONE global call (all competitions, World
 *    Cup included) cached for 15 min;
 *  - odds are fetched per fixture, on demand, only when a user opens a match,
 *    and cached — so we never pay for odds on matches nobody bets on.
 */

const HOST = "https://v3.football.api-sports.io";

function key(): string {
  return process.env.API_FOOTBALL_KEY ?? "";
}

/** Optional comma-separated league-id allowlist; empty = show every league. */
function leagueFilter(): number[] {
  return (process.env.FOOTBALL_LEAGUES ?? "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
}

async function cached<T>(cacheKey: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const rows = await db.select().from(footballCache).where(eq(footballCache.key, cacheKey)).limit(1);
  if (rows.length > 0 && Date.now() - rows[0].fetchedAt.getTime() < ttlMs) {
    return rows[0].data as T;
  }
  const data = await fetcher();
  await db
    .insert(footballCache)
    .values({ key: cacheKey, data, fetchedAt: new Date() })
    .onConflictDoUpdate({ target: footballCache.key, set: { data, fetchedAt: new Date() } });
  return data;
}

async function apiGet(path: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${HOST}${path}`, {
    headers: { "x-apisports-key": key() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`api-football ${res.status}`);
  return res.json();
}

export interface Match {
  fixtureId: number;
  league: string;
  leagueId: number;
  home: string;
  away: string;
  kickoff: string;
  status: string;
}

/** Next upcoming fixtures across ALL competitions (World Cup included). */
export async function getUpcomingFixtures(): Promise<Match[]> {
  if (!key()) return [];
  const count = Number(process.env.FOOTBALL_MAX ?? "60");
  const data = await cached(`fixtures:next:${count}`, 15 * 60_000, () =>
    apiGet(`/fixtures?next=${count}`)
  );

  const allow = leagueFilter();
  const out: Match[] = [];
  for (const f of (data.response as unknown[]) ?? []) {
    const rec = f as {
      fixture?: { id?: number; date?: string; status?: { short?: string } };
      league?: { id?: number; name?: string; country?: string };
      teams?: { home?: { name?: string }; away?: { name?: string } };
    };
    const fid = rec.fixture?.id;
    const lid = rec.league?.id;
    if (!fid || !lid) continue;
    if (allow.length > 0 && !allow.includes(lid)) continue;
    const country = rec.league?.country ? `${rec.league.country} · ` : "";
    out.push({
      fixtureId: fid,
      league: `${country}${rec.league?.name ?? ""}`,
      leagueId: lid,
      home: rec.teams?.home?.name ?? "",
      away: rec.teams?.away?.name ?? "",
      kickoff: rec.fixture?.date ?? "",
      status: rec.fixture?.status?.short ?? "NS",
    });
  }
  return out;
}

export interface Odds1x2 {
  home: number;
  draw: number;
  away: number;
}

/** 1X2 (Match Winner) odds for a single fixture, fetched on demand + cached. */
export async function getFixtureOdds(fixtureId: number): Promise<Odds1x2 | null> {
  if (!key()) return null;
  try {
    const data = await cached(`odds:fx:${fixtureId}`, 20 * 60_000, () =>
      apiGet(`/odds?fixture=${fixtureId}&bet=1`)
    );
    const rec = (data.response as unknown[])?.[0] as {
      bookmakers?: { bets?: { id?: number; values?: { value?: string; odd?: string }[] }[] }[];
    };
    const bet = rec?.bookmakers?.[0]?.bets?.find((b) => b.id === 1);
    if (!bet?.values) return null;
    const get = (v: string) => Number(bet.values!.find((x) => x.value === v)?.odd);
    const home = get("Home");
    const draw = get("Draw");
    const away = get("Away");
    if (home && draw && away) return { home, draw, away };
    return null;
  } catch {
    return null;
  }
}

export interface FixtureResult {
  finished: boolean;
  winner: "home" | "draw" | "away" | null;
}

/** Final result for a fixture (used to settle bets). */
export async function getFixtureResult(fixtureId: number): Promise<FixtureResult | null> {
  if (!key()) return null;
  try {
    const data = await apiGet(`/fixtures?id=${fixtureId}`);
    const rec = (data.response as unknown[])?.[0] as {
      fixture?: { status?: { short?: string } };
      goals?: { home?: number; away?: number };
    };
    if (!rec) return null;
    const short = rec.fixture?.status?.short ?? "";
    const finished = ["FT", "AET", "PEN"].includes(short);
    if (!finished) return { finished: false, winner: null };
    const h = rec.goals?.home ?? 0;
    const a = rec.goals?.away ?? 0;
    return { finished: true, winner: h > a ? "home" : a > h ? "away" : "draw" };
  } catch {
    return null;
  }
}
