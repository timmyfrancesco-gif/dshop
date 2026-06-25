import type {
  FeedResponse,
  LtcResponse,
  ProductsResponse,
  ReviewsResponse,
  SmmProductsResponse,
  StatsResponse,
} from "./types";

const API_BASE = (process.env.NEXT_PUBLIC_ASTRO_API_URL ?? "").replace(/\/+$/, "");

async function serverFetch<T>(path: string): Promise<T | null> {
  if (!API_BASE) return null;
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export interface HomepageServerData {
  stats: StatsResponse | null;
  products: ProductsResponse | null;
  feed: FeedResponse | null;
  ltc: LtcResponse | null;
  reviews: ReviewsResponse | null;
  smmProducts: SmmProductsResponse | null;
}

export async function fetchHomepageData(): Promise<HomepageServerData> {
  const [stats, products, feed, ltc, reviews, smmProducts] = await Promise.all([
    serverFetch<StatsResponse>("/api/stats"),
    serverFetch<ProductsResponse>("/api/products"),
    serverFetch<FeedResponse>("/api/feed?limit=15"),
    serverFetch<LtcResponse>("/api/ltc"),
    serverFetch<ReviewsResponse>("/api/reviews"),
    serverFetch<SmmProductsResponse>("/api/smm-products"),
  ]);
  return { stats, products, feed, ltc, reviews, smmProducts };
}
