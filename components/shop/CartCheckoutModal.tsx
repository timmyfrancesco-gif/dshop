"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import DeliveredNotice from "@/components/shop/DeliveredNotice";
import LtcPayment from "@/components/shop/LtcPayment";
import { createProductOrder, isApiConfigured } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type { CartLine } from "@/lib/hooks/useCart";
import type { ProductOrderResponse, ShopItem } from "@/lib/types";

interface CartCheckoutModalProps {
  open: boolean;
  lines: CartLine[];
  onClose: () => void;
  onDone: () => void;
}

export default function CartCheckoutModal({ open, lines, onClose, onDone }: CartCheckoutModalProps) {
  const queue = useMemo(() => {
    const items: ShopItem[] = [];
    for (const line of lines) {
      for (let i = 0; i < line.quantity; i++) items.push(line.item);
    }
    return items;
  }, [lines]);

  const [discord, setDiscord] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const [order, setOrder] = useState<ProductOrderResponse | null>(null);
  const [finished, setFinished] = useState(false);

  const currentItem = queue[index];
  const isLast = index === queue.length - 1;

  async function startPayment(e: React.FormEvent) {
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
      productId: currentItem.id,
      discord: discord.trim(),
    });
    setLoading(false);

    if (!res) {
      setError("Something went wrong creating your order. Please try again or contact staff.");
      return;
    }

    setOrder(res);
  }

  function handlePaid() {
    if (isLast) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setOrder(null);
  }

  function handleClose() {
    if (finished) {
      onDone();
      return;
    }
    onClose();
  }

  if (!queue.length) return null;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-panel w-full max-w-md rounded-2xl p-6 sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-checkout-title"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 id="cart-checkout-title" className="text-lg font-bold text-foreground">
                  Cart Checkout
                </h3>
                {!finished ? (
                  <p className="mt-1 text-sm text-muted">
                    Item {index + 1} of {queue.length} — {currentItem.name}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close dialog"
                className="rounded-full border border-border p-1.5 text-muted transition-colors hover:text-foreground"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {finished ? (
              <div className="mt-6 flex flex-col items-center gap-4">
                <DeliveredNotice message="All items paid! Check your Discord DMs — the bot will deliver everything automatically." />
                <button
                  type="button"
                  onClick={onDone}
                  className="w-full rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
                >
                  Done
                </button>
              </div>
            ) : !order ? (
              <form onSubmit={startPayment} className="mt-6 flex flex-col gap-4">
                <div className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2 text-sm">
                  <span className="text-muted">Price</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(currentItem.price, currentItem.currency)}
                  </span>
                </div>

                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium text-foreground">Discord username</span>
                  <input
                    type="text"
                    value={discord}
                    onChange={(e) => setDiscord(e.target.value)}
                    placeholder="yourname"
                    className="rounded-lg border border-border bg-background/60 px-3 py-2 text-foreground outline-none transition-colors focus:border-accent"
                    autoFocus
                  />
                </label>

                {error ? <p className="text-sm text-rose-400">{error}</p> : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? "Creating order…" : "Pay with LTC"}
                </button>
              </form>
            ) : (
              <div className="mt-6">
                <LtcPayment order={order} onPaid={handlePaid} />
              </div>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
