"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";
import ServiceIcon from "@/components/ui/ServiceIcon";
import ProductModal from "@/components/modals/ProductModal";
import { getProducts } from "@/lib/api";
import { PRODUCTS } from "@/lib/config";
import { formatCurrency } from "@/lib/format";
import type { ShopItem } from "@/lib/types";

const FALLBACK_ITEMS: ShopItem[] = PRODUCTS.map((p) => ({
  ...p,
  currency: "EUR",
}));

export default function Shop() {
  const [items, setItems] = useState<ShopItem[]>(FALLBACK_ITEMS);
  const [selected, setSelected] = useState<ShopItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    getProducts().then((res) => {
      if (cancelled || !res?.products?.length) return;
      setItems(
        res.products.map((p) => ({
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
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="shop" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Digital Shop"
          title="Browse what's in stock"
          description="Secure digital goods delivered straight through the bot. Pick an item to view details and stock before purchasing on Discord."
        />

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
              whileHover={{ y: -6 }}
              className="group glass-panel relative flex flex-col overflow-hidden rounded-2xl p-6 transition-colors hover:border-accent/50"
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/10 blur-2xl opacity-0 transition-opacity group-hover:opacity-100" />

              <div className="flex items-start justify-between">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-12 w-12 rounded-xl border border-border object-cover transition-transform group-hover:scale-110"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background/60 text-accent transition-transform group-hover:scale-110">
                    <ServiceIcon name={item.icon} className="h-6 w-6" />
                  </div>
                )}
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    item.stock > 0
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                  }`}
                >
                  {item.stock > 0 ? `${item.stock} in stock` : "Out of stock"}
                </span>
              </div>

              <span className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                {item.category}
              </span>
              <h3 className="mt-1 text-lg font-semibold text-foreground">{item.name}</h3>
              <p className="mt-2 text-sm text-muted">{item.description}</p>

              <div className="mt-6 flex items-center justify-between">
                <span className="text-xl font-bold text-foreground">
                  {formatCurrency(item.price, item.currency)}
                </span>
                <button
                  type="button"
                  onClick={() => setSelected(item)}
                  className="rounded-full border border-accent/30 bg-accent-soft px-4 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-background"
                >
                  View Details
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <ProductModal product={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
