"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import SafeHtml from "@/components/ui/SafeHtml";
import ServiceIcon from "@/components/ui/ServiceIcon";
import { useCart } from "@/lib/hooks/useCart";
import { useLocale } from "@/lib/hooks/useLocale";
import { useProducts } from "@/lib/hooks/useProducts";

function useViewerCount() {
  const [count] = useState(() => Math.floor(Math.random() * 3) + 1);
  return count;
}

function usePurchaseCount(productId: string) {
  const count = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < productId.length; i++) {
      hash = ((hash << 5) - hash) + productId.charCodeAt(i);
      hash |= 0;
    }
    return 50 + Math.abs(hash % 200);
  }, [productId]);
  return count;
}

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
  const viewers = useViewerCount();
  const purchases = usePurchaseCount(params.id ?? "");

  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      const firstInStock = product.variants.findIndex((v) => v.stock > 0);
      if (firstInStock >= 0) setSelectedVariant(firstInStock);
    }
  }, [product]);

  if (!loaded) {
    return (
      <PageShell>
        <section className="px-4 py-24 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted">{t("product.loading")}</p>
        </section>
      </PageShell>
    );
  }

  if (error || !product) {
    return (
      <PageShell>
        <section className="px-4 py-24 text-center sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-foreground">
            {error ? t("product.errorTitle") : t("product.notFoundTitle")}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {error ? t("product.errorSubtitle") : t("product.notFoundSubtitle")}
          </p>
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
    if (variant) {
      cart.addItem(product!, quantity, variant.id, variant.title, variant.price);
    } else {
      cart.addItem(product!, quantity);
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handlePurchaseNow() {
    const p = new URLSearchParams({
      productId: product!.id,
      qty: String(quantity),
    });
    if (variant) {
      p.set("variantId", variant.id);
    }
    router.push(`/checkout?${p.toString()}`);
  }

  return (
    <PageShell>
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Link href="/#shop" className="inline-flex items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-foreground">
            &larr; {t("product.backToShop")}
          </Link>

          <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-2">
            {/* Image gallery */}
            <div className="space-y-3">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-background-elevated/60">
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

              {/* Description below image */}
              {product.description ? (
                <div className="rounded-2xl border border-border bg-background-elevated/40 p-5">
                  {product.description.includes("<") ? (
                    <SafeHtml
                      html={product.description}
                      className="prose prose-sm prose-invert max-w-none text-muted"
                    />
                  ) : (
                    <p className="text-sm leading-relaxed text-muted">{product.description}</p>
                  )}
                </div>
              ) : null}
            </div>

            {/* Details */}
            <div className="flex flex-col">
              <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">{product.name}</h1>

              {/* Social proof */}
              <div className="mt-3 flex flex-col gap-1.5">
                <p className="flex items-center gap-2 text-sm text-muted">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-accent" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="3" />
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                  </svg>
                  <span><strong className="text-foreground">{viewers}</strong> {viewers === 1 ? "person is viewing" : "people are viewing"}</span>
                </p>
                <p className="flex items-center gap-2 text-sm text-muted">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-casino-from" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <span><strong className="text-foreground">{purchases}</strong> people have purchased.</span>
                </p>
              </div>

              {/* Price + Stock */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-casino-from to-accent px-4 py-2.5 shadow-[0_14px_30px_rgba(168,85,247,0.3),inset_0_1px_0_rgba(255,255,255,0.35)]">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-background" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span className="text-lg font-extrabold text-background">
                    {formatPrice(currentPrice)}
                  </span>
                </span>
                {product.comparePrice && product.comparePrice > currentPrice ? (
                  <span className="text-sm font-semibold text-muted line-through">
                    {formatPrice(product.comparePrice)}
                  </span>
                ) : null}
                <span
                  className={`rounded-full border border-white/10 px-4 py-2 text-xs font-extrabold shadow-lg ${
                    currentStock > 0
                      ? "bg-gradient-to-r from-emerald-400 to-emerald-500 text-emerald-950"
                      : "bg-gradient-to-r from-rose-400 to-rose-500 text-rose-950"
                  }`}
                >
                  {currentStock > 0 ? `${currentStock} In Stock` : "Out of Stock"}
                </span>
              </div>

              {/* Variant selector */}
              {hasVariants && product.variants!.length > 1 && (
                <div className="mt-6 rounded-2xl border border-border bg-background-elevated/40 overflow-hidden">
                  <div className="border-b border-border/60 px-4 py-3">
                    <span className="text-sm font-semibold text-foreground">Variant</span>
                  </div>
                  <div className="divide-y divide-border/40">
                    {product.variants!.map((v, i) => {
                      const isSelected = selectedVariant === i;
                      const isOutOfStock = v.stock === 0;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            setSelectedVariant(i);
                            setQuantity(1);
                          }}
                          className={`flex w-full items-center justify-between px-4 py-3.5 text-left transition-all ${
                            isSelected
                              ? "bg-accent/5 border-l-2 border-l-accent"
                              : "hover:bg-background-elevated/60 border-l-2 border-l-transparent"
                          }`}
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className={`text-sm font-semibold ${isSelected ? "text-foreground" : "text-muted"}`}>
                              {v.title}
                            </span>
                            {isOutOfStock && (
                              <span className="text-xs text-rose-400">Out of Stock</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${isSelected ? "text-accent" : "text-foreground"}`}>
                              {formatPrice(v.price)}
                            </span>
                            {isSelected && (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-background">
                                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3}>
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mt-6 rounded-2xl border border-border bg-background-elevated/40 p-4">
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
              </div>

              {/* Buttons */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={currentStock === 0}
                  className="flex items-center justify-center gap-2 rounded-full bg-accent py-3.5 text-sm font-bold text-background shadow-[0_0_24px_-4px_var(--accent)] transition-all hover:shadow-[0_0_36px_-4px_var(--accent)] hover:brightness-110 disabled:opacity-40"
                >
                  {added ? `${t("product.added")} ✓` : t("product.addToCart")}
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l3-7H6.4M7 13L5.4 5M7 13l-1.5 3h11M9 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handlePurchaseNow}
                  disabled={currentStock === 0}
                  className="flex items-center justify-center gap-2 rounded-full border border-border bg-background-elevated/60 py-3.5 text-sm font-bold text-foreground transition-all hover:border-accent hover:text-accent disabled:opacity-40"
                >
                  {currentStock === 0 ? t("product.outOfStock") : "Buy Now"}
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>

              {/* Instructions */}
              {product.instructions && (
                <div className="mt-6 rounded-2xl border border-border bg-background-elevated/40 p-5">
                  <h3 className="text-sm font-semibold text-foreground">
                    {t("product.instructions") || "Instructions"}
                  </h3>
                  <SafeHtml
                    html={product.instructions}
                    className="prose prose-sm prose-invert mt-3 max-w-none text-muted"
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
