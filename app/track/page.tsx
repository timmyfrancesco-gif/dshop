"use client";

import { useState } from "react";
import PageShell from "@/components/layout/PageShell";
import { getProductOrder } from "@/lib/api";
import { formatEur } from "@/lib/format";
import type { ProductOrderStatusResponse } from "@/lib/types";

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProductOrderStatusResponse | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!orderId.trim()) {
      setError("Please enter your order ID.");
      return;
    }

    setLoading(true);
    const res = await getProductOrder(orderId.trim());
    setLoading(false);

    if (!res) {
      setError("Order not found. Double-check the order ID and try again.");
      return;
    }

    setResult(res);
  }

  return (
    <PageShell>
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Track Order</h1>
          <p className="mt-2 text-sm text-muted">
            Enter your order ID to check its current status.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4 rounded-2xl border border-border bg-background/60 p-6">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-foreground">Order ID</span>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g. ord_1a2b3c"
                className="rounded-lg border border-border bg-background/60 px-3 py-2 font-mono text-foreground outline-none transition-colors focus:border-accent"
              />
            </label>

            {error ? <p className="text-sm text-rose-400">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Checking…" : "Track Order"}
            </button>
          </form>

          {result ? (
            <div className="mt-6 rounded-2xl border border-border bg-background/60 p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Status</span>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    result.status === "paid"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-accent/30 bg-accent-soft text-accent"
                  }`}
                >
                  {result.status === "paid" ? "Paid & Delivered" : "Awaiting Payment"}
                </span>
              </div>

              {result.orderId ? (
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted">Order ID</span>
                  <span className="font-mono text-foreground">{result.orderId}</span>
                </div>
              ) : null}

              {result.amountEur !== undefined ? (
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted">Amount</span>
                  <span className="font-semibold text-foreground">{formatEur(result.amountEur)}</span>
                </div>
              ) : null}

              {result.address ? (
                <div className="mt-3 flex flex-col gap-1 text-sm">
                  <span className="text-muted">LTC Address</span>
                  <span className="break-all rounded-lg border border-border bg-background/60 px-3 py-2 font-mono text-xs text-foreground">
                    {result.address}
                  </span>
                </div>
              ) : null}

              {result.status === "paid" ? (
                <p className="mt-4 text-sm text-muted">
                  Your order has been delivered. Check your Discord DMs if you haven&apos;t received it yet.
                </p>
              ) : (
                <p className="mt-4 text-sm text-muted">
                  Send the exact amount to the address above. This page won&apos;t update automatically — refresh to check again.
                </p>
              )}
            </div>
          ) : null}
        </div>
      </section>
    </PageShell>
  );
}
