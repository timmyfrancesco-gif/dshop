"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import SectionHeading from "@/components/ui/SectionHeading";
import ServiceIcon from "@/components/ui/ServiceIcon";
import CartDrawer from "@/components/shop/CartDrawer";
import { useCart } from "@/lib/hooks/useCart";
import { useLocale } from "@/lib/hooks/useLocale";
import { useHomepageData } from "@/lib/contexts/HomepageDataContext";

type SortOption = "default" | "price-asc" | "price-desc" | "name";

export default function Shop() {
  const { shopItems: items, loaded, products: productsRes } = useHomepageData();
  const error = loaded && !productsRes;
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
    <section id="shop" className="section-glow relative px-4 py-28 sm:px-6 lg:px-8">
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
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleItems.map((item, i) => {
              const displayPrice = item.variants && item.variants.length > 1
                ? (() => {
                    const prices = item.variants.map((v) => v.price);
                    const min = Math.min(...prices);
                    const max = Math.max(...prices);
                    return min === max ? formatPrice(min) : `${formatPrice(min)} – ${formatPrice(max)}`;
                  })()
                : formatPrice(item.price);

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 40, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, delay: (i % 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-[color-mix(in_srgb,var(--background-elevated)_80%,transparent)] transition-all duration-300 hover:border-accent/30 hover:shadow-[0_8px_40px_-12px_var(--accent)]"
                >
                  <Link
                    href={`/products/${item.id}`}
                    className="relative aspect-[4/3] w-full overflow-hidden bg-background-elevated"
                  >
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/10 to-background-elevated text-accent">
                        <ServiceIcon name={item.icon} className="h-16 w-16" />
                      </div>
                    )}

                    {/* Hover overlay with View Details */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-[2px] transition-all duration-300 group-hover:opacity-100">
                      <span className="rounded-xl bg-gradient-to-r from-casino-from to-casino-to px-8 py-3 text-sm font-bold text-white shadow-xl transition-transform duration-300 group-hover:scale-100 scale-90">
                        {t("shop.viewDetails")}
                      </span>
                    </div>
                  </Link>

                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-extrabold text-foreground">
                          {displayPrice}
                        </span>
                        {item.comparePrice && item.comparePrice > item.price ? (
                          <span className="text-sm font-medium text-muted line-through">
                            {formatPrice(item.comparePrice)}
                          </span>
                        ) : null}
                      </div>
                      <span
                        className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white ${
                          item.stock > 0
                            ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                            : "bg-gradient-to-r from-rose-500 to-rose-400"
                        }`}
                      >
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l3-7H6.4M7 13L5.4 5M7 13l-1.5 3h11M9 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" />
                        </svg>
                        {item.stock > 0 ? `${item.stock} In Stock` : "Out of Stock"}
                      </span>
                    </div>
                    <h3 className="mt-2 text-base font-bold text-foreground">{item.name}</h3>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <CartDrawer
        open={cartOpen}
        lines={cart.lines}
        total={cart.total}
        onClose={() => setCartOpen(false)}
        onUpdateQuantity={cart.updateQuantity}
        onRemove={cart.removeItem}
        onClear={cart.clear}
      />
    </section>
  );
}
