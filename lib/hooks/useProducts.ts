"use client";

import { useCallback, useEffect, useState } from "react";
import { getProducts } from "@/lib/api";
import type { ShopItem } from "@/lib/types";

export function useProducts() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const fetchProducts = useCallback(async () => {
    const res = await getProducts();
    if (res?.products) {
      setItems(
        res.products
          .filter((p) => p.stock > 0)
          .map((p) => ({
            id: String(p.id),
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
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { items, loaded, error, refetch: fetchProducts };
}
