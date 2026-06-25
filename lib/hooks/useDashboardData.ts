"use client";

import { useEffect, useState } from "react";
import { getFeed, getLtcPrice, getStats, isApiConfigured } from "@/lib/api";
import type { FeedItem, LtcResponse, StatsResponse } from "@/lib/types";

const POLL_INTERVAL_MS = 30_000;

export interface DashboardData {
  stats: StatsResponse | null;
  ltc: LtcResponse | null;
  feed: FeedItem[];
  isLive: boolean;
  isConfigured: boolean;
}

export function useDashboardData(): DashboardData {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [ltc, setLtc] = useState<LtcResponse | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (!isApiConfigured()) return;

    let cancelled = false;

    async function load() {
      const [statsRes, ltcRes, feedRes] = await Promise.all([
        getStats(),
        getLtcPrice(),
        getFeed(15),
      ]);

      if (cancelled) return;

      setStats(statsRes);
      setLtc(ltcRes);
      if (feedRes?.items) setFeed(feedRes.items);
      setIsLive(Boolean(statsRes || ltcRes || feedRes));
    }

    load();
    let interval: ReturnType<typeof setInterval> | null = setInterval(load, POLL_INTERVAL_MS);
    function onVisibility() {
      if (document.hidden) {
        if (interval) { clearInterval(interval); interval = null; }
      } else if (!interval) {
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

  return { stats, ltc, feed, isLive, isConfigured: isApiConfigured() };
}
