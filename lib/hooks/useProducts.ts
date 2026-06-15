"use client";

import { useEffect, useState } from "react";
import { getProducts } from "@/lib/api";
import type { ShopItem } from "@/lib/types";

export function useProducts() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getProducts().then((res) => {
      if (cancelled) return;
      if (res?.products) {
        setItems(
          res.products
            .filter((p) => p.stock > 0)
            .map((p) => ({
              id: p.id,
              name: p.name,
              category: "Shop",
              price: p.price,
              currency: p.currency,
              stock: p.stock,
              description: p.description,
              icon: "shop",
              image: p.image,
              url: p.url,
            }))
        );
      } else {
        setError(true);
      }
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { items, loaded, error };
}
