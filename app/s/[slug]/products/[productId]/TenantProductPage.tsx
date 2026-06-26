"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import SafeHtml from "@/components/ui/SafeHtml";
import { SiteConfigProvider, type SiteConfig } from "@/lib/contexts/SiteConfigContext";
import { useTheme } from "@/lib/contexts/ThemeContext";
import { useLocale } from "@/lib/hooks/useLocale";
import { useCart } from "@/lib/hooks/useCart";

interface TenantConfig {
  id: string;
  slug: string;
  name: string;
  description: string;
  logo: string | null;
  theme: string;
  accentColor: string | null;
  discordInvite: string;
  ltcAddress: string | null;
}

interface ProductData {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  comparePrice?: number | null;
  currency: string;
  stock: number;
  image?: string | null;
  images: string[];
  instructions?: string | null;
  variants?: Array<{
    id: string;
    title: string;
    price: number;
    stock: number;
  }> | null;
  deliverableType?: string | null;
  totalSold: number;
}

function ThemeApplier({ theme }: { theme: string }) {
  const { setTheme } = useTheme();
  useEffect(() => {
    setTheme(theme === "heaven" ? "heaven" : "hyper");
  }, [theme, setTheme]);
  return null;
}

export default function TenantProductPage({
  tenant,
  product,
}: {
  tenant: TenantConfig;
  product: ProductData;
}) {
  const { formatPrice } = useLocale();
  const cart = useCart();
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants?.[0]?.id ?? null
  );
  const [selectedImage, setSelectedImage] = useState(0);

  const siteConfig: SiteConfig = {
    name: tenant.name,
    tagline: tenant.description,
    discordInvite: tenant.discordInvite,
    shopUrl: "",
    isTenant: true,
    tenantSlug: tenant.slug,
    tenantLogo: tenant.logo,
  };

  const allImages =
    product.images.length > 0
      ? product.images
      : product.image
        ? [product.image]
        : [];

  const currentVariant = product.variants?.find(
    (v) => v.id === selectedVariant
  );
  const displayPrice = currentVariant
    ? formatPrice(currentVariant.price)
    : formatPrice(product.price);
  const displayStock = currentVariant ? currentVariant.stock : product.stock;

  function handleAddToCart() {
    const shopItem = {
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      currency: product.currency,
      stock: product.stock,
      description: product.description,
      icon: "shop",
      image: product.image ?? undefined,
      images: product.images,
      variants: product.variants ?? undefined,
      deliverableType: product.deliverableType as import("@/lib/types").DeliverableType | undefined,
      totalSold: product.totalSold,
    };
    cart.addItem(
      shopItem,
      1,
      currentVariant?.id,
      currentVariant?.title,
      currentVariant?.price
    );
  }

  return (
    <SiteConfigProvider config={siteConfig}>
      <ThemeApplier theme={tenant.theme} />
      <PageShell>
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-8 flex items-center gap-2 text-sm text-muted">
            <Link
              href={`/s/${tenant.slug}`}
              className="transition-colors hover:text-foreground"
            >
              {tenant.name}
            </Link>
            <span>/</span>
            <span className="text-foreground">{product.name}</span>
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid gap-10 md:grid-cols-2"
          >
            {/* Images */}
            <div>
              {allImages.length > 0 ? (
                <>
                  <div className="aspect-square overflow-hidden rounded-2xl border border-border/60 bg-background-elevated">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={allImages[selectedImage]}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  {allImages.length > 1 && (
                    <div className="mt-3 flex gap-2 overflow-x-auto">
                      {allImages.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedImage(idx)}
                          className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border transition-all ${
                            idx === selectedImage
                              ? "border-accent ring-1 ring-accent/30"
                              : "border-border/60 opacity-60 hover:opacity-100"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex aspect-square items-center justify-center rounded-2xl border border-border/60 bg-background-elevated">
                  <div className="text-6xl text-muted/30">
                    <svg viewBox="0 0 24 24" className="h-24 w-24" fill="none" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l3-7H6.4M7 13L5.4 5M7 13l-1.5 3h11M9 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-widest text-accent">
                {product.category}
              </span>
              <h1 className="mt-2 text-3xl font-extrabold text-foreground sm:text-4xl">
                {product.name}
              </h1>

              <div className="mt-4 flex items-center gap-3">
                <span className="text-2xl font-bold text-foreground">
                  {displayPrice}
                </span>
                {product.comparePrice &&
                  product.comparePrice > product.price &&
                  !currentVariant && (
                    <span className="text-lg text-muted line-through">
                      {formatPrice(product.comparePrice)}
                    </span>
                  )}
              </div>

              <div className="mt-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white ${
                    displayStock > 0
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                      : "bg-gradient-to-r from-rose-500 to-rose-400"
                  }`}
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l3-7H6.4M7 13L5.4 5M7 13l-1.5 3h11M9 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" />
                  </svg>
                  {displayStock > 0
                    ? `${displayStock} In Stock`
                    : "Out of Stock"}
                </span>
              </div>

              {product.totalSold > 0 && (
                <p className="mt-2 text-sm text-muted">
                  {product.totalSold} purchased
                </p>
              )}

              {/* Variants */}
              {product.variants && product.variants.length > 1 && (
                <div className="mt-6">
                  <label className="mb-2 block text-sm font-semibold text-muted">
                    Select variant
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariant(v.id)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                          selectedVariant === v.id
                            ? "border-accent bg-accent text-background"
                            : "border-border bg-background-elevated/60 text-muted hover:border-accent/50"
                        }`}
                      >
                        {v.title} — {formatPrice(v.price)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {product.description && (
                <div className="mt-6 text-sm leading-relaxed text-muted">
                  <SafeHtml html={product.description} />
                </div>
              )}

              {/* Buy button */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={displayStock <= 0}
                className="mt-8 w-full rounded-xl bg-accent py-3.5 text-sm font-bold text-background shadow-[0_0_24px_-6px_var(--accent)] transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              >
                {displayStock > 0 ? "Add to Cart" : "Out of Stock"}
              </button>

              {product.instructions && (
                <div className="mt-4 rounded-xl border border-border/60 bg-background-elevated/40 p-4 text-xs text-muted">
                  <SafeHtml html={product.instructions} />
                </div>
              )}
            </div>
          </motion.div>
        </section>
      </PageShell>
    </SiteConfigProvider>
  );
}
