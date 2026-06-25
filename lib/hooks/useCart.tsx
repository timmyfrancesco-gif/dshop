"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { ShopItem } from "@/lib/types";

export interface CartLine {
  item: ShopItem;
  quantity: number;
  variantId?: string;
  variantTitle?: string;
  variantPrice?: number;
}

const STORAGE_KEY = "heaven-market-cart";

function lineKey(line: { item: { id: string }; variantId?: string }): string {
  return line.variantId ? `${line.item.id}::${line.variantId}` : line.item.id;
}

interface CartContextValue {
  lines: CartLine[];
  addItem: (item: ShopItem, quantity?: number, variantId?: string, variantTitle?: string, variantPrice?: number) => void;
  removeItem: (id: string, variantId?: string) => void;
  updateQuantity: (id: string, quantity: number, variantId?: string) => void;
  clear: () => void;
  count: number;
  total: number;
  currency: string;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      // ignore corrupted storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const addItem = useCallback(
    (item: ShopItem, quantity = 1, variantId?: string, variantTitle?: string, variantPrice?: number) => {
      setLines((prev) => {
        const key = variantId ? `${item.id}::${variantId}` : item.id;
        const existing = prev.find((line) => lineKey(line) === key);
        if (existing) {
          return prev.map((line) =>
            lineKey(line) === key
              ? { ...line, quantity: Math.min(line.quantity + quantity, item.stock || line.quantity + quantity) }
              : line
          );
        }
        return [...prev, { item, quantity, variantId, variantTitle, variantPrice }];
      });
    },
    []
  );

  const removeItem = useCallback((id: string, variantId?: string) => {
    const key = variantId ? `${id}::${variantId}` : id;
    setLines((prev) => prev.filter((line) => lineKey(line) !== key));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number, variantId?: string) => {
    const key = variantId ? `${id}::${variantId}` : id;
    setLines((prev) =>
      prev
        .map((line) => (lineKey(line) === key ? { ...line, quantity } : line))
        .filter((line) => line.quantity > 0)
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const total = lines.reduce(
    (sum, line) => sum + (line.variantPrice ?? line.item.price) * line.quantity,
    0
  );
  const currency = lines[0]?.item.currency ?? "EUR";

  return (
    <CartContext value={{ lines, addItem, removeItem, updateQuantity, clear, count, total, currency }}>
      {children}
    </CartContext>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
