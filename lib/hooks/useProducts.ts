"use client";

import { useCallback, useEffect, useState } from "react";
import type { ShopItem } from "@/lib/types";

interface ApiProduct {
  id: string | number;
  name: string;
  category?: string;
  price: number;
  currency?: string;
  stock: number;
  description?: string;
  image?: string;
  images?: string[];
  url?: string;
  instructions?: string;
  variants?: Array<{
    id: string;
    title: string;
    price: number;
    stock: number;
    stockItems?: string[];
  }>;
  deliverableType?: string;
}

interface ProductsApiResponse {
  products?: ApiProduct[];
}

export function useProducts() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const fetchProducts = useCallback(async () => {
    setError(false);
    try {
      const res = await fetch("/api/cache/homepage");
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      const productsData = data?.products as ProductsApiResponse | null;
      if (productsData?.products) {
        const totalStock = (p: ApiProduct) =>
          p.variants?.length ? p.variants.reduce((s: number, v) => s + v.stock, 0) : p.stock;
        const minPrice = (p: ApiProduct) =>
          p.variants?.length ? Math.min(...p.variants.map((v) => v.price)) : p.price;
        setItems(
          productsData.products.map((p) => ({
            id: String(p.id),
            name: p.name,
            category: p.category || "Shop",
            price: minPrice(p),
            currency: p.currency ?? "EUR",
            stock: totalStock(p),
            description: p.description ?? "",
            icon: "shop" as const,
            image: p.images?.[0] || p.image,
            url: p.url,
            images: p.images,
            instructions: p.instructions,
            variants: p.variants,
            deliverableType: p.deliverableType as string,
          })) as ShopItem[]
        );
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { items, loaded, error, refetch: fetchProducts };
}
