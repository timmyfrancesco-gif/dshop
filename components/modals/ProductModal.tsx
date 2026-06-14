"use client";

import { AnimatePresence, motion } from "framer-motion";
import ServiceIcon from "@/components/ui/ServiceIcon";
import { formatCurrency } from "@/lib/format";
import { SITE } from "@/lib/config";
import type { ShopItem } from "@/lib/types";

interface ProductModalProps {
  product: ShopItem | null;
  onClose: () => void;
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
  return (
    <AnimatePresence>
      {product ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-panel relative w-full max-w-lg overflow-hidden rounded-2xl p-6 sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
          >
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/15 blur-3xl" />

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-14 w-14 shrink-0 rounded-xl border border-border object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border bg-background/60 text-accent">
                    <ServiceIcon name={product.icon} className="h-7 w-7" />
                  </div>
                )}
                <div>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                    {product.category}
                  </span>
                  <h3 id="product-modal-title" className="mt-1 text-lg font-bold text-foreground">
                    {product.name}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="rounded-full border border-border p-1.5 text-muted transition-colors hover:text-foreground"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="mt-6 text-sm leading-relaxed text-muted">{product.description}</p>

            <div className="mt-6 flex items-center justify-between rounded-lg border border-border bg-background/60 px-4 py-3">
              <div>
                <span className="text-xs text-muted">Price</span>
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(product.price, product.currency)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted">Stock</span>
                <p
                  className={`text-sm font-semibold ${
                    product.stock > 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {product.stock > 0 ? `${product.stock} available` : "Out of stock"}
                </p>
              </div>
            </div>

            <a
              href={product.url ?? SITE.shopUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={product.stock === 0}
              className={`mt-6 flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition-opacity ${
                product.stock > 0
                  ? "bg-accent text-background hover:opacity-90"
                  : "pointer-events-none bg-border text-muted"
              }`}
            >
              {product.stock > 0 ? "Buy on Discord" : "Out of stock"}
            </a>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
