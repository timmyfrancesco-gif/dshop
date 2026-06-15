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
  const { items, loaded } = useProducts();
  const cart = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const product = items.find((item) => item.id === params.id);

  if (!loaded) {
    return (
      <PageShell>
        <section className="px-4 py-24 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted">Loading product…</p>
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
  }

  function handlePurchaseNow() {
    router.push(`/checkout?productId=${encodeURIComponent(product!.id)}&qty=${quantity}`);
  }

  return (
    <PageShell>
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Link href="/#shop" className="text-sm font-medium text-muted transition-colors hover:text-foreground">
            ← Back to Shop
          </Link>

          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="relative h-72 w-full overflow-hidden rounded-2xl border border-border bg-background-elevated sm:h-96">
              {product.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-accent">
                  <ServiceIcon name={product.icon} className="h-20 w-20" />
                </div>
              )}

              <span
                className={`absolute bottom-4 left-4 rounded-full border px-3 py-1 text-xs font-semibold ${
                  product.stock > 0
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                }`}
              >
                {product.stock > 0 ? "In Stock" : "Out of Stock"}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                {product.category}
              </span>
              <h1 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">{product.name}</h1>
              <p className="mt-2 text-2xl font-bold text-gradient-accent">
                {formatCurrency(product.price, product.currency)}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted">{product.description}</p>

              <div className="mt-8 flex items-center justify-between gap-4 rounded-xl border border-border bg-background/60 p-4">
                <span className="text-sm font-medium text-foreground">Quantity</span>
                <div className="flex items-center gap-3 rounded-full border border-border bg-background/60 px-3 py-1.5">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={product.stock === 0}
                    className="text-lg font-bold text-muted transition-colors hover:text-foreground disabled:opacity-50"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-semibold text-foreground">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                    disabled={product.stock === 0}
                    className="text-lg font-bold text-muted transition-colors hover:text-foreground disabled:opacity-50"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-background/60 p-4 text-sm">
                <span className="text-muted">Total</span>
                <span className="text-xl font-bold text-foreground">
                  {formatCurrency(total, product.currency)}
                </span>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 rounded-full border border-accent/30 bg-accent-soft px-4 py-3 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-background disabled:opacity-50"
                >
                  {added ? "Added to cart ✓" : "Add to Cart"}
                </button>
                <button
                  type="button"
                  onClick={handlePurchaseNow}
                  disabled={product.stock === 0}
                  className="flex-1 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {product.stock === 0 ? "Out of stock" : "Purchase Now"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
