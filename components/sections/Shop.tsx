"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import SectionHeading from "@/components/ui/SectionHeading";
import ServiceIcon from "@/components/ui/ServiceIcon";
import CartDrawer from "@/components/shop/CartDrawer";
import { useCart } from "@/lib/hooks/useCart";
import { useProducts } from "@/lib/hooks/useProducts";
import { useLocale } from "@/lib/hooks/useLocale";

type SortOption = "default" | "price-asc" | "price-desc" | "name";

export default function Shop() {
  const { items, loaded, error } = useProducts();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState<SortOption>("default");
  const [cartOpen, setCartOpen] = useState(false);
  const { t, formatPrice } = useLocale();

  const cart = useCart();

  const SORT_OPTIONS: { id: SortOption; label: string }[] = [
    { id: "default", label: t("shop.sortFeatured") },
    { id: "price-asc", label: t("shop.sortPriceLow") },
    { id: "price-desc", label: t("shop.sortPriceHigh") },
    { id: "name", label: t("shop.sortName") },
  ];

  const categories = useMemo(() => {
    const unique = Array.from(new Set(items.map((item) => item.category)));
    return ["All", ...unique];
  }, [items]);

  const visibleItems = useMemo(() => {
    let result = items;

    if (category !== "All") {
      result = result.filter((item) => item.category === category);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
      );
    }

    const sorted = [...result];
    switch (sort) {
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return sorted;
  }, [items, category, search, sort]);

  return (
    <section id="shop" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            align="left"
            eyebrow={t("shop.eyebrow")}
            title={t("shop.title")}
            description={t("shop.description")}
          />

          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="relative flex shrink-0 items-center gap-2 self-start rounded-full border border-border bg-background/60 px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-accent hover:text-accent sm:self-auto"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3h2l.4 2M7 13h10l3-7H6.4M7 13L5.4 5M7 13l-1.5 3h11M9 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z"
              />
            </svg>
            {t("shop.cart")}
            {cart.count > 0 ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-background">
                {cart.count}
              </span>
            ) : null}
          </button>
        </div>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                  category === c
                    ? "border-accent bg-accent text-background"
                    : "border-border bg-background/60 text-muted hover:border-accent/50 hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <svg
                viewBox="0 0 24 24"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
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
                placeholder={t("shop.searchPlaceholder")}
                className="w-full rounded-full border border-border bg-background/60 py-2 pl-9 pr-4 text-sm text-foreground outline-none transition-colors focus:border-accent sm:w-56"
              />
            </div>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="rounded-full border border-border bg-background/60 px-4 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!loaded ? (
          <p className="mt-14 text-center text-sm text-muted">{t("shop.loadingProducts")}</p>
        ) : error ? (
          <p className="mt-14 text-center text-sm text-muted">
            {t("shop.errorProducts")}
          </p>
        ) : visibleItems.length === 0 ? (
          <p className="mt-14 text-center text-sm text-muted">
            {t("shop.noProducts")}
          </p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
                whileHover={{ y: -6 }}
                className="group glass-panel relative flex flex-col overflow-hidden rounded-2xl transition-colors hover:border-accent/50"
              >
                <div className="absolute -right-8 -top-8 z-10 h-24 w-24 rounded-full bg-accent/10 blur-2xl opacity-0 transition-opacity group-hover:opacity-100" />

                <Link
                  href={`/products/${item.id}`}
                  className="relative h-40 w-full overflow-hidden border-b border-border bg-background-elevated text-left"
                >
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-accent">
                      <ServiceIcon name={item.icon} className="h-12 w-12" />
                    </div>
                  )}

                  <span className="absolute left-3 top-3 rounded-full bg-gradient-to-r from-casino-from to-casino-to px-3 py-1 text-xs font-bold text-white shadow-lg">
                    {item.variants && item.variants.length > 1
                      ? (() => {
                          const prices = item.variants.map((v) => v.price);
                          const min = Math.min(...prices);
                          const max = Math.max(...prices);
                          return min === max ? formatPrice(min) : `${formatPrice(min)} – ${formatPrice(max)}`;
                        })()
                      : formatPrice(item.price)}
                  </span>

                  <span className="absolute bottom-3 left-3 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                    {t("shop.inStock")}
                  </span>
                </Link>

                <div className="flex flex-1 flex-col p-6">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                    {item.category}
                  </span>
                  <h3 className="mt-1 text-lg font-semibold text-foreground">{item.name}</h3>
                  <p className="mt-2 flex-1 text-sm text-muted">{item.description}</p>

                  <div className="mt-6 flex items-center gap-3">
                    <Link
                      href={`/products/${item.id}`}
                      className="flex-1 rounded-full border border-accent/30 bg-accent-soft px-4 py-2 text-center text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-background"
                    >
                      {t("shop.viewDetails")}
                    </Link>
                    <button
                      type="button"
                      onClick={() => cart.addItem(item, 1)}
                      aria-label={`${t("shop.addToCart")} ${item.name}`}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-accent hover:text-accent"
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l3-7H6.4M7 13L5.4 5M7 13l-1.5 3h11M9 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <CartDrawer
        open={cartOpen}
        lines={cart.lines}
        total={cart.total}
        currency={cart.currency}
        onClose={() => setCartOpen(false)}
        onUpdateQuantity={cart.updateQuantity}
        onRemove={cart.removeItem}
        onClear={cart.clear}
      />
    </section>
  );
}
