"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import DeliveredNotice from "@/components/shop/DeliveredNotice";
import LtcPayment from "@/components/shop/LtcPayment";
import { createProductOrder, isApiConfigured } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { useCart } from "@/lib/hooks/useCart";
import { useProducts } from "@/lib/hooks/useProducts";
import type { ProductOrderResponse, ShopItem } from "@/lib/types";

const PAYMENT_METHODS = [
  { id: "ltc", label: "Litecoin (LTC)", available: true },
  { id: "btc", label: "Bitcoin (BTC)", available: false },
  { id: "card", label: "Card / PayPal", available: false },
];

export default function CheckoutPage() {
  return (
    <PageShell>
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Checkout</h1>
          <p className="mt-2 text-sm text-muted">
            Pay with Litecoin and receive your items automatically once payment is confirmed.
          </p>

          <Suspense fallback={<p className="mt-10 text-sm text-muted">Loading…</p>}>
            <CheckoutContent />
          </Suspense>
        </div>
      </section>
    </PageShell>
  );
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");
  const qty = Math.max(1, Number(searchParams.get("qty") ?? "1") || 1);

  const { items, loaded } = useProducts();
  const cart = useCart();

  const buyNowProduct = productId ? items.find((item) => String(item.id) === productId) : null;

  const queue = useMemo(() => {
    if (buyNowProduct) {
      return Array.from({ length: qty }, () => buyNowProduct);
    }
    const result: ShopItem[] = [];
    for (const line of cart.lines) {
      for (let i = 0; i < line.quantity; i++) result.push(line.item);
    }
    return result;
  }, [buyNowProduct, qty, cart.lines]);

  const [paymentMethod, setPaymentMethod] = useState("ltc");
  const [discord, setDiscord] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const [order, setOrder] = useState<ProductOrderResponse | null>(null);
  const [finished, setFinished] = useState(false);
  const [deliveredItems, setDeliveredItems] = useState<(string | null | undefined)[]>([]);

  if (!loaded) {
    return <p className="mt-10 text-sm text-muted">Loading…</p>;
  }

  if (queue.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-border bg-background/60 p-6 text-center">
        <p className="text-sm text-muted">Your cart is empty.</p>
        <Link
          href="/#shop"
          className="mt-4 inline-block rounded-full border border-accent/30 bg-accent-soft px-5 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-background"
        >
          Back to Shop
        </Link>
      </div>
    );
  }

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

  function handlePaid(deliveredItem?: string | null) {
    setDeliveredItems((prev) => [...prev, deliveredItem]);
    if (isLast) {
      setFinished(true);
      if (!buyNowProduct) cart.clear();
      return;
    }
    setIndex((i) => i + 1);
    setOrder(null);
  }

  return (
    <div className="mt-10 flex flex-col gap-6">
      <div className="rounded-2xl border border-border bg-background/60 p-6">
        <h2 className="text-sm font-semibold text-foreground">Order Summary</h2>
        {!finished ? (
          <p className="mt-2 text-sm text-muted">
            Item {index + 1} of {queue.length} — {currentItem.name}
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted">All {queue.length} item(s) paid.</p>
        )}
        {!finished ? (
          <div className="mt-3 flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2 text-sm">
            <span className="text-muted">Price</span>
            <span className="font-semibold text-foreground">
              {formatCurrency(currentItem.price, currentItem.currency)}
            </span>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-border bg-background/60 p-6">
        <h2 className="text-sm font-semibold text-foreground">Payment Method</h2>
        <div className="mt-3 flex flex-col gap-2">
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method.id}
              type="button"
              disabled={!method.available || !!order}
              onClick={() => setPaymentMethod(method.id)}
              className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors ${
                paymentMethod === method.id
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-border bg-background/60 text-muted"
              } ${!method.available ? "opacity-50" : "hover:border-accent/50"}`}
            >
              <span className="font-medium">{method.label}</span>
              {!method.available ? <span className="text-xs">Coming soon</span> : null}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-background/60 p-6">
        {finished ? (
          deliveredItems.some((item) => item) ? (
            <div className="flex flex-col gap-4">
              {deliveredItems.map((item, i) =>
                item ? <DeliveredNotice key={i} deliveredItem={item} /> : null
              )}
            </div>
          ) : (
            <DeliveredNotice message="All items paid! Check your Discord DMs — the bot will deliver everything automatically." />
          )
        ) : !order ? (
          <form onSubmit={startPayment} className="flex flex-col gap-4">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-foreground">Discord username</span>
              <input
                type="text"
                value={discord}
                onChange={(e) => setDiscord(e.target.value)}
                placeholder="yourname"
                className="rounded-lg border border-border bg-background/60 px-3 py-2 text-foreground outline-none transition-colors focus:border-accent"
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
          <LtcPayment order={order} onPaid={handlePaid} />
        )}
      </div>

      {finished ? (
        <Link
          href="/#shop"
          className="rounded-full border border-accent/30 bg-accent-soft px-5 py-2.5 text-center text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-background"
        >
          Back to Shop
        </Link>
      ) : null}
    </div>
  );
}
