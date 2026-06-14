"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import ServiceIcon from "@/components/ui/ServiceIcon";
import DeliveredNotice from "@/components/shop/DeliveredNotice";
import LtcPayment from "@/components/shop/LtcPayment";
import { createProductOrder, isApiConfigured } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type { ProductOrderResponse, ShopItem } from "@/lib/types";

interface ProductModalProps {
  product: ShopItem | null;
  onClose: () => void;
  onAddToCart: (item: ShopItem, quantity: number) => void;
}

export default function ProductModal({ product, onClose, onAddToCart }: ProductModalProps) {
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
          <ProductCheckout key={product.id} product={product} onClose={onClose} onAddToCart={onAddToCart} />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function ProductCheckout({
  product,
  onClose,
  onAddToCart,
}: {
  product: ShopItem;
  onClose: () => void;
  onAddToCart: (item: ShopItem, quantity: number) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [discord, setDiscord] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<ProductOrderResponse | null>(null);
  const [paid, setPaid] = useState(false);
  const [added, setAdded] = useState(false);

  const maxQuantity = product.stock > 0 ? product.stock : 1;

  async function handleBuyNow(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!discord.trim()) {
      setError("Please enter your Discord username.");
      return;
    }

    if (!isApiConfigured()) {
      setError("Checkout is temporarily unavailable. Please contact staff on Discord.");
      return;
    }

    setLoading(true);
    const res = await createProductOrder({
      productId: product.id,
      discord: discord.trim(),
    });
    setLoading(false);

    if (!res) {
      setError("Something went wrong creating your order. Please try again or contact staff.");
      return;
    }

    setOrder(res);
  }

  function handleAddToCart() {
    onAddToCart(product, quantity);
    setAdded(true);
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 12 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => e.stopPropagation()}
      className="glass-panel relative w-full max-w-lg overflow-hidden rounded-2xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/15 blur-3xl" />

      <button
        type="button"
        onClick={onClose}
        aria-label="Close dialog"
        className="absolute right-4 top-4 z-10 rounded-full border border-border bg-background/60 p-1.5 text-muted backdrop-blur transition-colors hover:text-foreground"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="relative h-48 w-full overflow-hidden border-b border-border bg-background-elevated sm:h-64">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-accent">
            <ServiceIcon name={product.icon} className="h-16 w-16" />
          </div>
        )}

        <span className="absolute left-4 top-4 rounded-full bg-gradient-to-r from-casino-from to-casino-to px-3 py-1 text-sm font-bold text-white shadow-lg">
          {formatCurrency(product.price, product.currency)}
        </span>

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

      <div className="p-6 sm:p-8">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          {product.category}
        </span>
        <h3 id="product-modal-title" className="mt-1 text-lg font-bold text-foreground">
          {product.name}
        </h3>
        <p className="mt-4 text-sm leading-relaxed text-muted">{product.description}</p>

        {!order ? (
          <form onSubmit={handleBuyNow} className="mt-6 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
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

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-foreground">Discord username</span>
              <input
                type="text"
                value={discord}
                onChange={(e) => setDiscord(e.target.value)}
                placeholder="yourname"
                disabled={product.stock === 0}
                className="rounded-lg border border-border bg-background/60 px-3 py-2 text-foreground outline-none transition-colors focus:border-accent disabled:opacity-50"
              />
            </label>

            {error ? <p className="text-sm text-rose-400">{error}</p> : null}

            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 rounded-full border border-accent/30 bg-accent-soft px-4 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-background disabled:opacity-50"
              >
                {added ? "Added to cart ✓" : "Add to Cart"}
              </button>
              <button
                type="submit"
                disabled={loading || product.stock === 0}
                className="flex-1 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {product.stock === 0 ? "Out of stock" : loading ? "Creating order…" : "Buy Now"}
              </button>
            </div>
          </form>
        ) : paid ? (
          <div className="mt-6">
            <DeliveredNotice />
          </div>
        ) : (
          <div className="mt-6">
            <LtcPayment order={order} onPaid={() => setPaid(true)} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
