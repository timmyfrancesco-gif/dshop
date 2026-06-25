"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type {
  FeedItem,
  LtcResponse,
  ProductsResponse,
  ReviewsResponse,
  ShopItem,
  SmmProductsResponse,
  StatsResponse,
} from "@/lib/types";

const POLL_INTERVAL_MS = 30_000;

interface HomepageContextValue {
  stats: StatsResponse | null;
  ltc: LtcResponse | null;
  feed: FeedItem[];
  products: ProductsResponse | null;
  shopItems: ShopItem[];
  reviews: ReviewsResponse | null;
  smmProducts: SmmProductsResponse | null;
  loaded: boolean;
}

const HomepageContext = createContext<HomepageContextValue | null>(null);

function mapProducts(res: ProductsResponse | null): ShopItem[] {
  if (!res?.products) return [];
  return res.products.map((p) => {
    const totalStock = p.variants?.length
      ? p.variants.reduce((s, v) => s + v.stock, 0)
      : p.stock;
    const minPrice = p.variants?.length
      ? Math.min(...p.variants.map((v) => v.price))
      : p.price;
    return {
      id: String(p.id),
      name: p.name,
      category: p.category || "Shop",
      price: minPrice,
      currency: p.currency,
      stock: totalStock,
      description: p.description,
      icon: "shop",
      image: p.images?.[0] || p.image,
      url: p.url,
      images: p.images,
      instructions: p.instructions,
      variants: p.variants,
      deliverableType: p.deliverableType,
    };
  });
}

export interface HomepageInitialData {
  stats: StatsResponse | null;
  products: ProductsResponse | null;
  feedItems: FeedItem[];
  ltc: LtcResponse | null;
  reviews: ReviewsResponse | null;
  smmProducts: SmmProductsResponse | null;
}

export function HomepageDataProvider({
  children,
  initialData,
}: {
  children: ReactNode;
  initialData?: HomepageInitialData;
}) {
  const [stats, setStats] = useState<StatsResponse | null>(initialData?.stats ?? null);
  const [ltc, setLtc] = useState<LtcResponse | null>(initialData?.ltc ?? null);
  const [feed, setFeed] = useState<FeedItem[]>(initialData?.feedItems ?? []);
  const [products, setProducts] = useState<ProductsResponse | null>(initialData?.products ?? null);
  const [shopItems, setShopItems] = useState<ShopItem[]>(mapProducts(initialData?.products ?? null));
  const [reviews, setReviews] = useState<ReviewsResponse | null>(initialData?.reviews ?? null);
  const [smmProducts, setSmmProducts] = useState<SmmProductsResponse | null>(initialData?.smmProducts ?? null);
  const [loaded, setLoaded] = useState(!!initialData);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/cache/homepage");
        if (!res.ok || cancelled) return;
        const json = await res.json();
        if (cancelled) return;
        setStats(json.stats ?? null);
        setLtc(json.ltc ?? null);
        setFeed(json.feed?.items ?? []);
        const prods = json.products ?? null;
        setProducts(prods);
        setShopItems(mapProducts(prods));
        setReviews(json.reviews ?? null);
        setSmmProducts(json.smmProducts ?? null);
        setLoaded(true);
      } catch {
        // ignore
      }
    }

    // If we have initial data, delay first poll; otherwise fetch immediately
    const firstDelay = initialData ? POLL_INTERVAL_MS : 0;
    const firstTimer = setTimeout(() => {
      if (cancelled) return;
      load();
    }, firstDelay);

    let interval: ReturnType<typeof setInterval> | null = null;
    const startInterval = setTimeout(() => {
      if (cancelled) return;
      interval = setInterval(load, POLL_INTERVAL_MS);
    }, firstDelay);

    function onVisibility() {
      if (document.hidden) {
        if (interval) { clearInterval(interval); interval = null; }
      } else if (!interval) {
        load();
        interval = setInterval(load, POLL_INTERVAL_MS);
      }
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      clearTimeout(firstTimer);
      clearTimeout(startInterval);
      if (interval) clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <HomepageContext value={{ stats, ltc, feed, products, shopItems, reviews, smmProducts, loaded }}>
      {children}
    </HomepageContext>
  );
}

export function useHomepageData() {
  const ctx = useContext(HomepageContext);
  if (!ctx) throw new Error("useHomepageData must be used within HomepageDataProvider");
  return ctx;
}
