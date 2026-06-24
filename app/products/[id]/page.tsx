"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import ServiceIcon from "@/components/ui/ServiceIcon";
import { useCart } from "@/lib/hooks/useCart";
import { useLocale } from "@/lib/hooks/useLocale";
import { useProducts } from "@/lib/hooks/useProducts";

export default function ProductPage() {
  const { t, formatPrice } = useLocale();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { items, loaded, error } = useProducts();
  const cart = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [activeImage, setActiveImage] = useState(0);

  const product = items.find((item) => String(item.id) === params.id);

  if (!loaded) {
    return (
      <PageShell>
        <section className="px-4 py-24 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted">{t("product.loading")}</p>
        </section>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <section className="px-4 py-24 text-center sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-foreground">{t("product.errorTitle")}</h1>
          <p className="mt-2 text-sm text-muted">{t("product.errorSubtitle")}</p>
          <Link
            href="/#shop"
            className="mt-6 inline-block rounded-full border border-accent/30 bg-accent-soft px-5 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-background"
          >
            {t("product.backToShop")}
          </Link>
        </section>
      </PageShell>
    );
  }

  if (!product) {
    return (
      <PageShell>
        <section className="px-4 py-24 text-center sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-foreground">{t("product.notFoundTitle")}</h1>
          <p className="mt-2 text-sm text-muted">{t("product.notFoundSubtitle")}</p>
          <Link
            href="/#shop"
            className="mt-6 inline-block rounded-full border border-accent/30 bg-accent-soft px-5 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-background"
          >
            {t("product.backToShop")}
          </Link>
        </section>
      </PageShell>
    );
  }

  const hasVariants = product.variants && product.variants.length > 0;
  const variant = hasVariants ? product.variants![selectedVariant] : null;
  const currentPrice = variant ? variant.price : product.price;
  const currentStock = variant ? variant.stock : product.stock;
  const maxQuantity = currentStock > 0 ? currentStock : 1;
  const total = currentPrice * quantity;

  const allImages = product.images?.length ? product.images : product.image ? [product.image] : [];

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
        <div className="mx-auto max-w-5xl">
          <Link href="/#shop" className="inline-flex items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-foreground">
            &larr; {t("product.backToShop")}
          </Link>

          <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-2">
            {/* Image gallery */}
            <div className="space-y-3">
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-background-elevated/60">
                {allImages.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={allImages[activeImage]}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-accent/60">
                    <ServiceIcon name={product.icon} className="h-28 w-28" />
                  </div>
                )}
              </div>
              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImage(i)}
                      className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                        activeImage === i
                          ? "border-accent ring-1 ring-accent/30"
                          : "border-border hover:border-accent/50"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
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
                  {hasVariants && product.variants!.length > 1
                    ? (() => {
                        const prices = product.variants!.map((v) => v.price);
                        const min = Math.min(...prices);
                        const max = Math.max(...prices);
                        return min === max ? formatPrice(min) : `${formatPrice(min)} – ${formatPrice(max)}`;
                      })()
                    : formatPrice(currentPrice)}
                </span>
                <span
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    currentStock > 0
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                  }`}
                >
                  {currentStock > 0 ? `${currentStock} ${t("product.inStock")}` : t("product.outOfStock")}
                </span>
              </div>

              {/* Description - render HTML if present */}
              {product.description ? (
                <div className="mt-6">
                  {product.description.includes("<") ? (
                    <div
                      className="prose prose-sm prose-invert max-w-none text-muted"
                      dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                  ) : (
                    <p className="text-sm leading-relaxed text-muted">{product.description}</p>
                  )}
                </div>
              ) : null}

              {/* Variant selector */}
              {hasVariants && product.variants!.length > 1 && (
                <div className="mt-6">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                    {t("product.selectVariant") || "Select variant"}
                  </span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {product.variants!.map((v, i) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setSelectedVariant(i);
                          setQuantity(1);
                        }}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                          selectedVariant === i
                            ? "border-accent bg-accent text-background"
                            : "border-border bg-background/60 text-muted hover:border-accent/50 hover:text-foreground"
                        }`}
                      >
                        {v.title} — {formatPrice(v.price)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity + Total */}
              <div className="mt-8 rounded-2xl border border-border bg-background-elevated/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{t("product.quantity")}</span>
                  <div className="flex items-center gap-0 overflow-hidden rounded-full border border-border bg-background/60">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={currentStock === 0}
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
                      disabled={currentStock === 0}
                      className="px-4 py-2 text-base font-bold text-muted transition-colors hover:bg-background-elevated hover:text-foreground disabled:opacity-40"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="mt-4 border-t border-border/60 pt-4 flex items-center justify-between">
                  <span className="text-sm text-muted">{t("product.total")}</span>
                  <span className="text-xl font-bold text-foreground">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={currentStock === 0}
                  className="rounded-full border border-accent/40 bg-accent-soft py-3 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-background disabled:opacity-40"
                >
                  {added ? `${t("product.added")} ✓` : t("product.addToCart")}
                </button>
                <button
                  type="button"
                  onClick={handlePurchaseNow}
                  disabled={currentStock === 0}
                  className="rounded-full bg-accent py-3 text-sm font-semibold text-background shadow-[0_0_24px_-4px_var(--accent)] transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {currentStock === 0 ? t("product.outOfStock") : t("product.purchaseNow")}
                </button>
              </div>

              {/* Instructions */}
              {product.instructions && (
                <div className="mt-8 rounded-2xl border border-border bg-background-elevated/40 p-5">
                  <h3 className="text-sm font-semibold text-foreground">
                    {t("product.instructions") || "Instructions"}
                  </h3>
                  <div
                    className="prose prose-sm prose-invert mt-3 max-w-none text-muted"
                    dangerouslySetInnerHTML={{ __html: product.instructions }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
