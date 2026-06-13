"use client";

import { useEffect, useState } from "react";
import { getProducts } from "@/lib/api";
import type { Product } from "@/lib/types";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getProducts().then((res) => {
      if (cancelled) return;
      setProducts(res?.products ?? []);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { products, loading };
}
