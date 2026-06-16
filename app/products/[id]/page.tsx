"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import ServiceIcon from "@/components/ui/ServiceIcon";
import { formatCurrency } from "@/lib/format";
import { useCart } from "@/lib/hooks/useCart";
import { useProducts } from "@/lib/hooks/useProducts";

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { items, loaded, error } = useProducts();
  const cart = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const product = items.find((item) => String(item.id) === params.id);

  if (!loaded) {
    return (
      <PageShell>
        <section className="px-4 py-24 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted">Loading product…</p>
        </section>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <section className="px-4 py-24 text-center sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-foreground">Unable to load product</h1>
          <p className="mt-2 text-sm text-muted">Please try again later.</p>
          <Link
            href="/#shop"
            className="mt-6 inline-block rounded-full border border-accent/30 bg-accent-soft px-5 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-background"
          >
            Back to Shop
          </Link>
        </section>
      </PageShell>
    );
  }

  if (!product) {
    return (
      <PageShell>
        <section className="px-4 py-24 text-center sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-foreground">Product not found</h1>
          <p className="mt-2 text-sm text-muted">This product may be out of stock or no longer available.</p>
          <Link
            href="/#shop"
            className="mt-6 inline-block rounded-full border border-accent/30 bg-accent-soft px-5 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-background"
          >
            Back to Shop
          </Link>
        </section>
      </PageShell>
    );
  }

  const maxQuantity = product.stock > 0 ? product.stock : 1;
  const total = product.price * quantity;

  function handleAddToCart() {
    cart.addItem(product!, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handlePurchaseNow() {
    router.push(`/checkout?productId=${encodeURIComponent(product!.id)}&qty=${quantity}`);
  }

  return (
    <PageShell>
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Link href="/#shop" className="inline-flex items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-foreground">
            ← Back to Shop
          </Link>

          <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-2">
            {/* Image */}
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-background-elevated/60">
              {product.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-accent/60">
                  <ServiceIcon name={product.icon} className="h-28 w-28" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-col">
              {product.category ? (
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  {product.category}
                </span>
              ) : null}
              <h1 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">{product.name}</h1>

              {/* Price + Stock */}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-accent px-4 py-1.5 text-sm font-bold text-background shadow-[0_0_20px_-4px_var(--accent)]">
                  {formatCurrency(product.price, product.currency)}
                </span>
                <span
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    product.stock > 0
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                  }`}
                >
                  {product.stock > 0 ? `${product.stock} In Stock` : "Out of Stock"}
                </span>
              </div>

              {product.description ? (
                <p className="mt-6 text-sm leading-relaxed text-muted">{product.description}</p>
              ) : null}

              {/* Quantity + Total */}
              <div className="mt-8 rounded-2xl border border-border bg-background-elevated/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Quantity</span>
                  <div className="flex items-center gap-0 overflow-hidden rounded-full border border-border bg-background/60">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={product.stock === 0}
                      className="px-4 py-2 text-base font-bold text-muted transition-colors hover:bg-background-elevated hover:text-foreground disabled:opacity-40"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="w-10 border-x border-border py-2 text-center text-sm font-semibold text-foreground">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                      disabled={product.stock === 0}
                      className="px-4 py-2 text-base font-bold text-muted transition-colors hover:bg-background-elevated hover:text-foreground disabled:opacity-40"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="mt-4 border-t border-border/60 pt-4 flex items-center justify-between">
                  <span className="text-sm text-muted">Total</span>
                  <span className="text-xl font-bold text-foreground">
                    {formatCurrency(total, product.currency)}
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="rounded-full border border-accent/40 bg-accent-soft py-3 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-background disabled:opacity-40"
                >
                  {added ? "Added ✓" : "Add to Cart"}
                </button>
                <button
                  type="button"
                  onClick={handlePurchaseNow}
                  disabled={product.stock === 0}
                  className="rounded-full bg-accent py-3 text-sm font-semibold text-background shadow-[0_0_24px_-4px_var(--accent)] transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {product.stock === 0 ? "Out of Stock" : "Purchase Now"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
