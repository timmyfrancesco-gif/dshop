"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import type { TenantInfo } from "@/lib/tenant/context";
import { TenantProvider } from "@/lib/tenant/context";

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

function formatPrice(amount: number, currency = "EUR") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function TenantProductDetail({
  tenant,
  product,
}: {
  tenant: TenantInfo;
  product: ProductData;
}) {
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants?.[0]?.id ?? null
  );
  const [selectedImage, setSelectedImage] = useState(0);

  const accentColor = tenant.accentColor ?? "#6571FF";

  const allImages = product.images.length > 0 ? product.images : product.image ? [product.image] : [];

  const currentVariant = product.variants?.find(
    (v) => v.id === selectedVariant
  );
  const displayPrice = currentVariant
    ? formatPrice(currentVariant.price, product.currency)
    : formatPrice(product.price, product.currency);
  const displayStock = currentVariant ? currentVariant.stock : product.stock;

  return (
    <TenantProvider tenant={tenant}>
      <div
        className="min-h-screen bg-[#0a0a0a] text-white"
        style={{ "--accent": accentColor } as React.CSSProperties}
      >
        {/* Header */}
        <header className="border-b border-white/10 px-6 py-5">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <Link
              href={`/s/${tenant.slug}`}
              className="flex items-center gap-3 transition-opacity hover:opacity-80"
            >
              {tenant.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={tenant.logo}
                  alt={tenant.name}
                  className="h-8 w-8 rounded-full"
                />
              )}
              <h1 className="text-xl font-bold">{tenant.name}</h1>
            </Link>
            <Link
              href={`/s/${tenant.slug}`}
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium transition-colors hover:border-white/40"
            >
              ← Back to Shop
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-6 py-12">
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
                  <div className="aspect-square overflow-hidden rounded-2xl border border-white/10 bg-white/5">
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
                              ? "border-white/40 ring-1 ring-white/20"
                              : "border-white/10 opacity-60 hover:opacity-100"
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
                <div className="flex aspect-square items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-6xl text-white/20">
                  🛍️
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-widest text-white/40">
                {product.category}
              </span>
              <h2 className="mt-2 text-3xl font-extrabold">{product.name}</h2>

              <div className="mt-4 flex items-center gap-3">
                <span className="text-2xl font-bold">{displayPrice}</span>
                {product.comparePrice &&
                  product.comparePrice > product.price &&
                  !currentVariant && (
                    <span className="text-lg text-white/40 line-through">
                      {formatPrice(product.comparePrice, product.currency)}
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
                  {displayStock > 0
                    ? `${displayStock} In Stock`
                    : "Out of Stock"}
                </span>
              </div>

              {product.totalSold > 0 && (
                <p className="mt-2 text-sm text-white/50">
                  {product.totalSold} purchased
                </p>
              )}

              {/* Variants */}
              {product.variants && product.variants.length > 1 && (
                <div className="mt-6">
                  <label className="mb-2 block text-sm font-semibold text-white/60">
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
                            ? "border-white/40 bg-white text-black"
                            : "border-white/10 bg-white/5 text-white/60 hover:border-white/30"
                        }`}
                      >
                        {v.title} — {formatPrice(v.price, product.currency)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {product.description && (
                <div className="mt-6 text-sm leading-relaxed text-white/60">
                  {product.description}
                </div>
              )}

              {/* Buy button */}
              <button
                type="button"
                disabled={displayStock <= 0}
                className="mt-8 w-full rounded-xl py-3.5 text-sm font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40"
                style={{
                  background:
                    displayStock > 0
                      ? `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)`
                      : undefined,
                  backgroundColor: displayStock <= 0 ? "#333" : undefined,
                }}
              >
                {displayStock > 0 ? "Buy with LTC" : "Out of Stock"}
              </button>

              {product.instructions && (
                <p className="mt-4 text-xs text-white/40">
                  📋 {product.instructions}
                </p>
              )}
            </div>
          </motion.div>
        </main>

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
