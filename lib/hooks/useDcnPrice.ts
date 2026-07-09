"use client";

import { useEffect, useRef, useState } from "react";
import { getDcnHistory, getDcnPrice } from "@/lib/api";
import type { DcnHistoryPoint } from "@/lib/types";

const PRICE_POLL_MS = 7000; // bot recalculates every 5s
const HISTORY_POLL_MS = 60_000; // history is sampled once/minute bot-side

export interface DcnPriceState {
  price: number | null;
  ltcPrice: number | null;
  updatedAt: number | null;
  history: DcnHistoryPoint[];
  /** % change from the oldest point currently loaded to the live price. */
  changePct: number | null;
  loading: boolean;
}

export function useDcnPrice(historyLimit = 200): DcnPriceState {
  const [price, setPrice] = useState<number | null>(null);
  const [ltcPrice, setLtcPrice] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [history, setHistory] = useState<DcnHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const loadedOnce = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPrice() {
      const res = await getDcnPrice();
      if (cancelled || !res) return;
      setPrice(res.price);
      setLtcPrice(res.ltcPrice);
      setUpdatedAt(res.updatedAt);
      loadedOnce.current = true;
      setLoading(false);
    }

    async function loadHistory() {
      const res = await getDcnHistory(historyLimit);
      if (cancelled || !res) return;
      setHistory(res.points);
    }

    loadPrice();
    loadHistory();
    const priceId = setInterval(loadPrice, PRICE_POLL_MS);
    const historyId = setInterval(loadHistory, HISTORY_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(priceId);
      clearInterval(historyId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyLimit]);

  const first = history[0]?.price;
  const changePct = price !== null && first ? ((price - first) / first) * 100 : null;

  return { price, ltcPrice, updatedAt, history, changePct, loading };
}
