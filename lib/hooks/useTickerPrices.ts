"use client";

import { useEffect, useState } from "react";
import { getLtcPrice } from "@/lib/api";
import { TICKER_COINS } from "@/lib/config";
import type { CoinPrice } from "@/lib/types";

const COINGECKO_URL = `https://api.coingecko.com/api/v3/simple/price?ids=${TICKER_COINS.map(
  (c) => c.id
).join(",")}&vs_currencies=eur&include_24hr_change=true`;

const FETCH_TIMEOUT_MS = 5000;
const POLL_INTERVAL_MS = 60_000;

type CoinGeckoResponse = Record<string, { eur?: number; eur_24h_change?: number }>;

function emptyPrices(): CoinPrice[] {
  return TICKER_COINS.map((coin) => ({
    symbol: coin.symbol,
    name: coin.name,
    eur: null,
    changePct: null,
  }));
}

async function fetchCoinGecko(): Promise<CoinGeckoResponse | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(COINGECKO_URL, { signal: controller.signal });
    if (!res.ok) return null;
    return (await res.json()) as CoinGeckoResponse;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export function useTickerPrices() {
  const [prices, setPrices] = useState<CoinPrice[]>(emptyPrices());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [gecko, ltc] = await Promise.all([fetchCoinGecko(), getLtcPrice()]);

      if (cancelled) return;

      const next = TICKER_COINS.map((coin) => {
        if (coin.id === "litecoin" && ltc) {
          return {
            symbol: coin.symbol,
            name: coin.name,
            eur: ltc.eur,
            changePct: ltc.changePct ?? null,
          };
        }

        const data = gecko?.[coin.id];
        return {
          symbol: coin.symbol,
          name: coin.name,
          eur: data?.eur ?? null,
          changePct: data?.eur_24h_change ?? null,
        };
      });

      setPrices(next);
      setLoading(false);
    }

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { prices, loading };
}
