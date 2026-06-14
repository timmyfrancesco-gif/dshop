"use client";

import { useCallback, useEffect, useState } from "react";
import type { ShopItem } from "@/lib/types";

export interface CartLine {
  item: ShopItem;
  quantity: number;
}

const STORAGE_KEY = "heaven-market-cart";

export function useCart() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) setLines(JSON.parse(raw));
      } catch {
        // ignore corrupted storage
      }
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const addItem = useCallback((item: ShopItem, quantity = 1) => {
    setLines((prev) => {
      const existing = prev.find((line) => line.item.id === item.id);
      if (existing) {
        return prev.map((line) =>
          line.item.id === item.id
            ? { ...line, quantity: Math.min(line.quantity + quantity, item.stock || line.quantity + quantity) }
            : line
        );
      }
      return [...prev, { item, quantity }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setLines((prev) => prev.filter((line) => line.item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setLines((prev) =>
      prev
        .map((line) => (line.item.id === id ? { ...line, quantity } : line))
        .filter((line) => line.quantity > 0)
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const total = lines.reduce((sum, line) => sum + line.item.price * line.quantity, 0);
  const currency = lines[0]?.item.currency ?? "EUR";

  return { lines, addItem, removeItem, updateQuantity, clear, count, total, currency };
}
