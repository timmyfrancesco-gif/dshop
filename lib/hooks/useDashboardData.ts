"use client";

import { useEffect, useState } from "react";
import { getFeed, getLtcPrice, getStats, isApiConfigured } from "@/lib/api";
import type { FeedItem, LtcResponse, StatsResponse } from "@/lib/types";

const POLL_INTERVAL_MS = 30_000;
const OFFLINE_AFTER_FAILURES = 2;

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
    let consecutiveFailures = 0;

    async function load() {
      const [statsRes, ltcRes, feedRes] = await Promise.all([
        getStats(),
        getLtcPrice(),
        getFeed(15),
      ]);

      if (cancelled) return;

      // Keep showing the last good values on a transient failure instead of
      // flashing back to "—" / Offline for a single missed poll.
      if (statsRes) setStats(statsRes);
      if (ltcRes) setLtc(ltcRes);
      if (feedRes?.items) setFeed(feedRes.items);

      if (statsRes || ltcRes || feedRes) {
        consecutiveFailures = 0;
        setIsLive(true);
      } else {
        consecutiveFailures += 1;
        if (consecutiveFailures >= OFFLINE_AFTER_FAILURES) setIsLive(false);
      }
    }

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { stats, ltc, feed, isLive, isConfigured: isApiConfigured() };
}
