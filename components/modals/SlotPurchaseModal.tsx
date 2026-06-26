"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createSlotOrder, getLtcPrice, getSlotOrder, isApiConfigured } from "@/lib/api";
import { formatEur } from "@/lib/format";
import { useQrCode } from "@/lib/hooks/useQrCode";
import { SLOT_DURATIONS, SLOT_TIERS } from "@/lib/config";
import type { SlotOrderResponse } from "@/lib/types";

const POLL_INTERVAL_MS = 10_000;

interface SlotPurchaseModalProps {
  open: boolean;
  onClose: () => void;
  tierId: string;
  durationId: string;
  priceEur: number;
}

export default function SlotPurchaseModal({
  open,
  onClose,
  tierId,
  durationId,
  priceEur,
}: SlotPurchaseModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [discord, setDiscord] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<SlotOrderResponse | null>(null);
  const [ltcEur, setLtcEur] = useState<number | null>(null);

  const tierName = SLOT_TIERS.find((t) => t.id === tierId)?.name ?? tierId;
  const durationName = SLOT_DURATIONS.find((d) => d.id === durationId)?.name ?? durationId;

  const qrValue = order ? `litecoin:${order.address}` : null;
  const qrCode = useQrCode(qrValue);

  // Fetch LTC price for the approximate amount display.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getLtcPrice().then((res) => {
      if (!cancelled && res) setLtcEur(res.eur);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Poll order status while on step 2.
  useEffect(() => {
    if (step !== 2 || !order) return;

    let cancelled = false;
    const interval = setInterval(async () => {
      const statusRes = await getSlotOrder(order.orderId);
      if (cancelled || !statusRes) return;
      if (statusRes.status === "paid") {
        setStep(3);
      }
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [step, order]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!discord.trim()) {
      setError("Please enter your Discord username.");
      return;
    }

    if (!isApiConfigured()) {
      setError("Ordering is temporarily unavailable. Please contact staff on Discord.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: apiError } = await createSlotOrder({
        tier: tierId,
        duration: durationId,
        discord: discord.trim(),
      });

      if (!data) {
        setError(apiError || "Something went wrong creating your order. Please try again or contact staff.");
        return;
      }

      setOrder(data);
      setStep(2);
    } catch {
      setError("Something went wrong creating your order. Please try again or contact staff.");
    } finally {
      setLoading(false);
    }
  }

  const approxLtc = order && ltcEur ? (order.amountEur / ltcEur).toFixed(6) : null;

  return (
    <AnimatePresence>
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
          className="glass-panel w-full max-w-md rounded-2xl p-6 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="slot-modal-title"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 id="slot-modal-title" className="text-lg font-bold text-foreground">
                {tierName} — {durationName}
              </h3>
              <p className="mt-1 text-sm text-muted">{formatEur(priceEur)}</p>
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

          {step === 1 ? (
            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
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
                {loading ? "Creating order…" : "Continue to payment"}
              </button>
            </form>
          ) : null}

          {step === 2 && order ? (
            <div className="mt-6 flex flex-col items-center gap-4 text-center">
              {qrCode ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrCode}
                  alt="LTC payment address QR code"
                  className="h-48 w-48 rounded-xl border border-border"
                />
              ) : (
                <div className="flex h-48 w-48 items-center justify-center rounded-xl border border-border text-xs text-muted">
                  Generating QR code…
                </div>
              )}

              <div className="w-full break-all rounded-lg border border-border bg-background/60 px-3 py-2 font-mono text-xs text-foreground">
                {order.address}
              </div>

              <div className="flex w-full items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2 text-sm">
                <span className="text-muted">Amount</span>
                <span className="font-semibold text-foreground">
                  {formatEur(order.amountEur)}
                  {approxLtc ? ` ≈ ${approxLtc} LTC` : ""}
                </span>
              </div>

              <p className="text-xs text-muted">
                Send the exact amount above to the LTC address. This page will
                update automatically once payment is received. Order ID:{" "}
                <span className="font-mono text-foreground">{order.orderId}</span>
              </p>
            </div>
          ) : null}

          {step === 3 && order ? (
            <div className="mt-6 flex flex-col items-center gap-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-foreground">Payment received!</h4>
              <p className="text-sm text-muted">
                Your slot order <span className="font-mono text-foreground">{order.orderId}</span>{" "}
                has been marked as paid. Please reach out to staff on Discord so we can
                activate your slot.
              </p>
            </div>
          ) : null}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
