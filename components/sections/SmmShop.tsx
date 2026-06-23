"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import SectionHeading from "@/components/ui/SectionHeading";
import { getSmmProducts } from "@/lib/api";
import { useLocale } from "@/lib/hooks/useLocale";
import type { SmmProduct } from "@/lib/types";

export default function SmmShop() {
  const [products, setProducts] = useState<SmmProduct[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [category, setCategory] = useState("All");
  const { formatPrice } = useLocale();

  useEffect(() => {
    getSmmProducts().then((res) => {
      if (res?.products) setProducts(res.products.filter((p) => p.active));
      setLoaded(true);
    });
  }, []);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
    return ["All", ...unique];
  }, [products]);

  const visible = useMemo(() => {
    if (category === "All") return products;
    return products.filter((p) => p.category === category);
  }, [products, category]);

  if (loaded && products.length === 0) return null;

  return (
    <section id="smm" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          align="left"
          eyebrow="SMM Services"
          title="Social Media Marketing"
          description="Boost your social media presence with our premium SMM services."
        />

        {!loaded ? (
          <p className="mt-14 text-center text-sm text-muted">Loading SMM products...</p>
        ) : (
          <>
            {categories.length > 2 && (
              <div className="mt-10 flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c as string)}
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
            )}

            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((product, i) => (
                <SmmProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function SmmProductCard({ product, index }: { product: SmmProduct; index: number }) {
  const { formatPrice } = useLocale();
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(product.minQuantity);
  const [link, setLink] = useState("");
  const [discord, setDiscord] = useState("");

  const totalEur = (quantity / 1000) * product.pricePerThousand;

  function handleQuantityChange(val: string) {
    const n = parseInt(val, 10);
    if (!isNaN(n)) {
      setQuantity(Math.max(product.minQuantity, Math.min(product.maxQuantity, n)));
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, delay: (index % 3) * 0.08 }}
        whileHover={{ y: -6 }}
        className="group glass-panel relative flex flex-col overflow-hidden rounded-2xl transition-colors hover:border-accent/50"
      >
        <div className="absolute -right-8 -top-8 z-10 h-24 w-24 rounded-full bg-accent/10 blur-2xl opacity-0 transition-opacity group-hover:opacity-100" />

        <div className="relative h-40 w-full overflow-hidden border-b border-border bg-background-elevated">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/10 to-background-elevated">
              <svg viewBox="0 0 24 24" className="h-12 w-12 text-accent/60" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
              </svg>
            </div>
          )}

          <span className="absolute left-3 top-3 rounded-full bg-indigo-500/90 px-3 py-1 text-xs font-bold text-white shadow-lg">
            SMM
          </span>

          <span className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-casino-from to-casino-to px-3 py-1 text-xs font-bold text-white shadow-lg">
            {formatPrice(product.pricePerThousand)} / 1K
          </span>
        </div>

        <div className="flex flex-1 flex-col p-6">
          {product.category && (
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              {product.category}
            </span>
          )}
          <h3 className="mt-1 text-lg font-semibold text-foreground">{product.name}</h3>
          <p className="mt-2 flex-1 text-sm text-muted line-clamp-2">{product.instructions}</p>

          <div className="mt-4 text-xs text-muted">
            Min: {product.minQuantity.toLocaleString()} &middot; Max: {product.maxQuantity.toLocaleString()}
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-4 w-full rounded-full border border-accent/30 bg-accent-soft px-4 py-2 text-center text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-background"
          >
            Order Now
          </button>
        </div>
      </motion.div>

      {/* Order modal */}
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground">{product.name}</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-muted hover:text-foreground">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {product.instructions && (
              <div className="mb-4 rounded-xl border border-accent/20 bg-accent/5 p-3">
                <p className="text-xs text-accent">{product.instructions}</p>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">
                  Quantity ({product.minQuantity.toLocaleString()} - {product.maxQuantity.toLocaleString()})
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  min={product.minQuantity}
                  max={product.maxQuantity}
                  step={100}
                  className="w-full rounded-xl border border-border bg-background-elevated px-4 py-2.5 text-sm text-foreground outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">Link (profile or post URL)</label>
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://instagram.com/username"
                  className="w-full rounded-xl border border-border bg-background-elevated px-4 py-2.5 text-sm text-foreground outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">Discord username</label>
                <input
                  type="text"
                  value={discord}
                  onChange={(e) => setDiscord(e.target.value)}
                  placeholder="user#1234"
                  className="w-full rounded-xl border border-border bg-background-elevated px-4 py-2.5 text-sm text-foreground outline-none focus:border-accent"
                />
              </div>

              <div className="rounded-xl border border-border bg-background-elevated p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Price per 1K</span>
                  <span className="font-semibold text-foreground">{formatPrice(product.pricePerThousand)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted">Quantity</span>
                  <span className="font-semibold text-foreground">{quantity.toLocaleString()}</span>
                </div>
                <div className="mt-3 border-t border-border pt-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">Total</span>
                  <span className="text-lg font-bold text-accent">{formatPrice(totalEur)}</span>
                </div>
              </div>

              <Link
                href={`/checkout/smm?productId=${product.id}&quantity=${quantity}&link=${encodeURIComponent(link)}&discord=${encodeURIComponent(discord)}`}
                onClick={() => {
                  if (!link.trim() || !discord.trim()) return;
                }}
                className={`w-full rounded-full bg-accent px-4 py-3 text-center text-sm font-bold text-background transition-all hover:shadow-[0_0_24px_-6px_var(--accent)] hover:brightness-110 ${
                  !link.trim() || !discord.trim() ? "pointer-events-none opacity-50" : ""
                }`}
              >
                Proceed to Payment &mdash; {formatPrice(totalEur)}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
