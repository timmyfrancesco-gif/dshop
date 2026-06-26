"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import type { TenantInfo } from "@/lib/tenant/context";
import { TenantProvider } from "@/lib/tenant/context";

interface TenantProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  comparePrice?: number | null;
  currency: string;
  stock: number;
  image?: string | null;
  images?: string[];
  variants?: Array<{
    id: string;
    title: string;
    price: number;
    stock: number;
  }> | null;
  deliverableType?: string | null;
  totalSold: number;
}

function formatPrice(amount: number, currency = "EUR") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function TenantStorefront({
  tenant,
  products,
}: {
  tenant: TenantInfo;
  products: TenantProduct[];
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const accentColor = tenant.accentColor ?? "#6571FF";

  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map((p) => p.category)));
    return ["All", ...unique];
  }, [products]);

  const visible = useMemo(() => {
    let result = products;
    if (category !== "All") {
      result = result.filter((p) => p.category === category);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [products, category, search]);

  const bestSellerId = useMemo(() => {
    if (products.length === 0) return null;
    const withSold = products.filter((p) => p.totalSold > 0);
    if (withSold.length === 0) return null;
    const top = withSold.reduce((best, p) =>
      p.totalSold > best.totalSold ? p : best
    );
    return top.id;
  }, [products]);

  return (
    <TenantProvider tenant={tenant}>
      <div
        className="min-h-screen bg-[#0a0a0a] text-white"
        style={{ "--accent": accentColor } as React.CSSProperties}
      >
        {/* Header */}
        <header className="border-b border-white/10 px-6 py-5">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-3">
              {tenant.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={tenant.logo}
                  alt={tenant.name}
                  className="h-8 w-8 rounded-full"
                />
              )}
              <h1 className="text-xl font-bold">{tenant.name}</h1>
            </div>
            {tenant.discordInvite && (
              <a
                href={tenant.discordInvite}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium transition-colors hover:border-white/40"
              >
                Discord
              </a>
            )}
          </div>
        </header>

        {/* Hero */}
        <section className="px-6 py-16 text-center">
          <h2 className="text-4xl font-extrabold sm:text-5xl">
            {tenant.name}
          </h2>
          {tenant.description && (
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/60">
              {tenant.description}
            </p>
          )}
        </section>

        {/* Filters */}
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                    category === c
                      ? "border-white/40 bg-white text-black"
                      : "border-white/10 bg-white/5 text-white/60 hover:border-white/30 hover:text-white"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="relative">
              <svg
                viewBox="0 0 24 24"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="M21 21l-3.5-3.5" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus:border-white/30 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="mx-auto max-w-7xl px-6 pb-20 pt-10">
          {visible.length === 0 ? (
            <p className="text-center text-sm text-white/40">
              No products found.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visible.map((item, i) => {
                const isBestSeller = item.id === bestSellerId;
                const displayPrice =
                  item.variants && item.variants.length > 1
                    ? (() => {
                        const prices = item.variants.map((v) => v.price);
                        const min = Math.min(...prices);
                        const max = Math.max(...prices);
                        return min === max
                          ? formatPrice(min, item.currency)
                          : `${formatPrice(min, item.currency)} – ${formatPrice(max, item.currency)}`;
                      })()
                    : formatPrice(item.price, item.currency);

                const card = (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 40, scale: 0.95 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{
                      duration: 0.6,
                      delay: (i % 4) * 0.08,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className={`group relative flex flex-col overflow-hidden bg-white/5 transition-all duration-300 hover:shadow-[0_8px_40px_-12px_var(--accent)] ${
                      isBestSeller
                        ? "rounded-[calc(1rem-1px)] border-0"
                        : "rounded-2xl border border-white/10 hover:border-white/20"
                    }`}
                  >
                    <Link
                      href={`/s/${tenant.slug}/products/${item.id}`}
                      className="relative aspect-[4/3] w-full overflow-hidden bg-white/5"
                    >
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-4xl text-white/20">
                          🛍️
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-[2px] transition-all duration-300 group-hover:opacity-100">
                        <span className="rounded-xl bg-white px-8 py-3 text-sm font-bold text-black shadow-xl transition-transform duration-300 scale-90 group-hover:scale-100">
                          View Details
                        </span>
                      </div>
                    </Link>

                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-lg font-extrabold">
                          {displayPrice}
                        </span>
                        <span
                          className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white ${
                            item.stock > 0
                              ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                              : "bg-gradient-to-r from-rose-500 to-rose-400"
                          }`}
                        >
                          {item.stock > 0
                            ? `${item.stock} In Stock`
                            : "Out of Stock"}
                        </span>
                      </div>
                      <h3 className="mt-2 text-base font-bold">{item.name}</h3>
                    </div>

                    {isBestSeller && (
                      <div
                        className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg"
                        style={{ background: accentColor }}
                      >
                        <svg
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="h-3 w-3"
                        >
                          <path d="M10 1.5l3 5.5h6l-4.5 4 1.5 6-5-3.5-5 3.5 1.5-6L3 7h6l1-5.5z" />
                        </svg>
                        Best Seller
                      </div>
                    )}
                  </motion.div>
                );

                if (isBestSeller) {
                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl p-[1px] shadow-[0_0_40px_-10px_var(--accent)] transition-shadow duration-300 hover:shadow-[0_0_60px_-10px_var(--accent)]"
                      style={{
                        background: `linear-gradient(135deg, ${accentColor}, ${accentColor}80, ${accentColor}40)`,
                      }}
                    >
                      {card}
                    </div>
                  );
                }
                return card;
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 px-6 py-8 text-center text-sm text-white/40">
          <p>
            {tenant.name} — Powered by{" "}
            <span className="font-semibold text-white/60">Heaven Market</span>
          </p>
        </footer>
      </div>
    </TenantProvider>
  );
}
