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
      const totalStock = (p: typeof res.products[0]) =>
        p.variants?.length ? p.variants.reduce((s, v) => s + v.stock, 0) : p.stock;
      const minPrice = (p: typeof res.products[0]) =>
        p.variants?.length ? Math.min(...p.variants.map((v) => v.price)) : p.price;
      setItems(
        res.products
          .filter((p) => totalStock(p) > 0)
          .map((p) => ({
            id: String(p.id),
            name: p.name,
            category: p.category || "Shop",
            price: minPrice(p),
            currency: p.currency,
            stock: totalStock(p),
            description: p.description,
            icon: "shop",
            image: p.images?.[0] || p.image,
            url: p.url,
            images: p.images,
            instructions: p.instructions,
            variants: p.variants,
            deliverableType: p.deliverableType,
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
