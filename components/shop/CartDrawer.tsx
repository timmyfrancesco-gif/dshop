"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import ServiceIcon from "@/components/ui/ServiceIcon";
import { formatCurrency } from "@/lib/format";
import type { CartLine } from "@/lib/hooks/useCart";

interface CartDrawerProps {
  open: boolean;
  lines: CartLine[];
  total: number;
  currency: string;
  onClose: () => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export default function CartDrawer({
  open,
  lines,
  total,
  currency,
  onClose,
  onUpdateQuantity,
  onRemove,
  onClear,
}: CartDrawerProps) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="glass-panel fixed right-0 top-0 z-[101] flex h-full w-full max-w-md flex-col border-l border-border p-6 sm:p-8"
              role="dialog"
              aria-modal="true"
              aria-label="Shopping cart"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">Your Cart</h3>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close cart"
                  className="rounded-full border border-border p-1.5 text-muted transition-colors hover:text-foreground"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {lines.length === 0 ? (
                <div className="mt-12 flex flex-1 flex-col items-center justify-center text-center text-muted">
                  <ServiceIcon name="shop" className="h-10 w-10 opacity-50" />
                  <p className="mt-4 text-sm">Your cart is empty.</p>
                </div>
              ) : (
                <>
                  <div className="mt-6 flex flex-1 flex-col gap-4 overflow-y-auto">
                    {lines.map((line) => (
                      <div
                        key={line.item.id}
                        className="flex items-center gap-3 rounded-xl border border-border bg-background/60 p-3"
                      >
                        {line.item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={line.item.image}
                            alt={line.item.name}
                            className="h-12 w-12 rounded-lg border border-border object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border text-accent">
                            <ServiceIcon name={line.item.icon} className="h-6 w-6" />
                          </div>
                        )}

                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground">{line.item.name}</p>
                          <p className="text-xs text-muted">
                            {formatCurrency(line.item.price, line.item.currency)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 rounded-full border border-border px-2 py-1">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(line.item.id, line.quantity - 1)}
                            className="text-sm font-bold text-muted transition-colors hover:text-foreground"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="w-5 text-center text-sm font-semibold text-foreground">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(line.item.id, line.quantity + 1)}
                            className="text-sm font-bold text-muted transition-colors hover:text-foreground"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemove(line.item.id)}
                          aria-label={`Remove ${line.item.name}`}
                          className="text-muted transition-colors hover:text-rose-400"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 border-t border-border pt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">Total</span>
                      <span className="text-xl font-bold text-foreground">
                        {formatCurrency(total, currency)}
                      </span>
                    </div>
                    <Link
                      href="/checkout"
                      onClick={onClose}
                      className="mt-4 block w-full rounded-full bg-accent px-4 py-2.5 text-center text-sm font-semibold text-background transition-opacity hover:opacity-90"
                    >
                      Checkout with LTC
                    </Link>
                    <button
                      type="button"
                      onClick={onClear}
                      className="mt-2 w-full rounded-full border border-border px-4 py-2 text-xs font-medium text-muted transition-colors hover:text-foreground"
                    >
                      Clear cart
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        ) : null}
    </AnimatePresence>
  );
}
