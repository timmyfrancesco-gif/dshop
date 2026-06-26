import { NextResponse } from "next/server";

const API_BASE = (process.env.NEXT_PUBLIC_ASTRO_API_URL ?? "").replace(/\/+$/, "");
const CACHE_TTL_MS = 30_000;

interface CachedData {
  stats: unknown;
  products: unknown;
  feed: unknown;
  ltc: unknown;
  reviews: unknown;
  smmProducts: unknown;
  ts: number;
}

let cache: CachedData | null = null;

async function safeFetch(path: string): Promise<unknown> {
  if (!API_BASE) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

async function fetchAll(): Promise<CachedData> {
  const [stats, products, feed, ltc, reviews, smmProducts] = await Promise.all([
    safeFetch("/api/stats"),
    safeFetch("/api/products"),
    safeFetch("/api/feed?limit=15"),
    safeFetch("/api/ltc"),
    safeFetch("/api/reviews"),
    safeFetch("/api/smm-products"),
  ]);
  return { stats, products, feed, ltc, reviews, smmProducts, ts: Date.now() };
}

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_TTL_MS) {
    return NextResponse.json(cache, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  }

  const fresh = await fetchAll();
  // If every upstream fetch failed, keep serving the previous good cache
  // instead of caching an all-null payload for the full TTL.
  const allNull =
    fresh.stats === null &&
    fresh.products === null &&
    fresh.feed === null &&
    fresh.ltc === null &&
    fresh.reviews === null &&
    fresh.smmProducts === null;

  if (allNull && cache) {
    return NextResponse.json(cache, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  }

  cache = fresh;

  return NextResponse.json(cache, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
  });
}
