"use client";

import { useEffect, useState } from "react";
import type {
  FeedItem,
  LtcResponse,
  ProductsResponse,
  ReviewsResponse,
  SmmProductsResponse,
  StatsResponse,
} from "@/lib/types";

const POLL_INTERVAL_MS = 30_000;

export interface HomepageData {
  stats: StatsResponse | null;
  products: ProductsResponse | null;
  feed: FeedItem[];
  ltc: LtcResponse | null;
  reviews: ReviewsResponse | null;
  smmProducts: SmmProductsResponse | null;
  loaded: boolean;
}

const EMPTY: HomepageData = {
  stats: null,
  products: null,
  feed: [],
  ltc: null,
  reviews: null,
  smmProducts: null,
  loaded: false,
};

export function useHomepageData(): HomepageData {
  const [data, setData] = useState<HomepageData>(EMPTY);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/cache/homepage");
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        setData({
          stats: json.stats ?? null,
          products: json.products ?? null,
          feed: json.feed?.items ?? [],
          ltc: json.ltc ?? null,
          reviews: json.reviews ?? null,
          smmProducts: json.smmProducts ?? null,
          loaded: true,
        });
      } catch {
        // ignore
      }
    }

    load();
    let interval: ReturnType<typeof setInterval> | null = setInterval(load, POLL_INTERVAL_MS);

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
      if (interval) clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return data;
}
