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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PAYMENT_METHODS = [
  {
    id: "ltc",
    label: "Litecoin",
    sub: "via Litecoin Network",
    available: true,
    icon: (
      <svg viewBox="0 0 32 32" className="h-full w-full" aria-hidden>
        <circle cx="16" cy="16" r="16" fill="currentColor" />
        <path
          d="M12.5 7.5H15v9l-2.5.82.6 1.82 1.9-.62V24.5h9v-2h-7v-3.18l2.5-.82-.6-1.82-1.9.62V7.5z"
          fill="white"
        />
      </svg>
    ),
  },
  {
    id: "btc",
    label: "Bitcoin",
    sub: "Coming soon",
    available: false,
    icon: (
      <svg viewBox="0 0 32 32" className="h-full w-full" aria-hidden>
        <circle cx="16" cy="16" r="16" fill="currentColor" />
        <path
          d="M22 15.6c.4-.9.3-2-.8-2.7.4-.6.5-1.3.3-2-.4-1.4-1.9-2-3.7-2H10v14h8.2c2 0 4-.9 4.3-3.2.2-1.4-.4-2.5-1.3-3.1l.8-.3-.8-1-.2 1.3zM12.5 11h4c.8 0 1.5.4 1.5 1.3s-.7 1.3-1.5 1.3h-4V11zm4.5 8.5h-4.5v-3h4.5c1 0 1.7.5 1.7 1.5s-.8 1.5-1.7 1.5z"
          fill="white"
        />
      </svg>
    ),
  },
  {
    id: "card",
    label: "Card / PayPal",
    sub: "Coming soon",
    available: false,
    icon: (
      <svg viewBox="0 0 32 32" className="h-full w-full" aria-hidden>
        <circle cx="16" cy="16" r="16" fill="currentColor" />
        <path
          d="M22 10H10c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2zm0 10H10v-4h12v4zm0-7H10v-1h12v1z"
          fill="white"
        />
      </svg>
    ),
  },
];

export default function CheckoutPage() {
  return (
    <PageShell>
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg">
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
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const [order, setOrder] = useState<ProductOrderResponse | null>(null);
  const [finished, setFinished] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [deliveredItems, setDeliveredItems] = useState<(string | null | undefined)[]>([]);

  if (!loaded) {
    return <p className="mt-10 text-sm text-muted">Loading…</p>;
  }

  if (queue.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-border bg-background/60 p-8 text-center">
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

  if (cancelled) {
    return (
      <div className="mt-10 flex flex-col items-center gap-6 rounded-2xl border border-rose-500/30 bg-rose-500/5 p-10 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-rose-500/40 bg-rose-500/10">
          <svg viewBox="0 0 24 24" className="h-10 w-10 text-rose-500" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold text-rose-500">Ordine Cancellato</h2>
          <p className="text-sm text-muted">Il tuo ordine è stato cancellato dallo staff.</p>
        </div>
        <Link
          href="/#shop"
          className="rounded-full border border-rose-500/30 bg-rose-500/10 px-6 py-2.5 text-sm font-semibold text-rose-400 transition-colors hover:bg-rose-500 hover:text-white"
        >
          Torna allo Shop
        </Link>
      </div>
    );
  }

  const currentItem = queue[index];
  const isLast = index === queue.length - 1;
  const queueTotal = queue.reduce((sum, item) => sum + item.price, 0);

  async function startPayment(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !EMAIL_RE.test(email.trim())) {
      setError("Inserisci un indirizzo email valido.");
      return;
    }

    if (!isApiConfigured()) {
      setError("Checkout is temporarily unavailable. Please contact staff on Discord.");
      return;
    }

    setLoading(true);
    const res = await createProductOrder({
      productId: currentItem.id,
      discord: email.trim(),
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

  function handleCancelled() {
    setCancelled(true);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Checkout</h1>
        {!finished && (
          <p className="mt-1 text-xs text-muted uppercase tracking-widest">
            {order ? "Step 2 of 2 · Payment" : "Step 1 of 2 · Order Details"}
          </p>
        )}
        {!finished && (
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: order ? "100%" : "50%" }}
            />
          </div>
        )}
      </div>

      {/* Order summary */}
      <div className="rounded-2xl border border-border bg-background-elevated/40 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted">
            {finished ? "Riepilogo Ordine" : `${queue.length} item${queue.length > 1 ? "s" : ""}`}
          </span>
          <span className="font-bold text-foreground">
            {formatCurrency(queueTotal, currentItem.currency)}
          </span>
        </div>
        {queue.length > 1 && (
          <ul className="mt-3 flex flex-col gap-1 border-t border-border/60 pt-3">
            {queue.map((item, i) => (
              <li key={i} className="flex items-center justify-between text-xs text-muted">
                <span>{item.name}</span>
                <span>{formatCurrency(item.price, item.currency)}</span>
              </li>
            ))}
          </ul>
        )}
        {queue.length === 1 && (
          <p className="mt-1 text-sm text-foreground">{currentItem.name}</p>
        )}
      </div>

      {finished ? (
        <div className="flex flex-col gap-4">
          {deliveredItems.some((item) => item) ? (
            deliveredItems.map((item, i) =>
              item ? <DeliveredNotice key={i} deliveredItem={item} /> : null
            )
          ) : (
            <DeliveredNotice message="All items paid! Check your email — the bot will deliver everything automatically." />
          )}
          <Link
            href="/#shop"
            className="rounded-full border border-accent/30 bg-accent-soft px-5 py-2.5 text-center text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-background"
          >
            Back to Shop
          </Link>
        </div>
      ) : !order ? (
        <form onSubmit={startPayment} className="flex flex-col gap-5">
          {/* Contact section */}
          <div className="rounded-2xl border border-border bg-background-elevated/40 p-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">
              Contatto e Consegna
            </h2>
            <div className="mt-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Indirizzo email *"
                autoComplete="email"
                autoFocus
                className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm text-foreground placeholder-muted outline-none transition-colors focus:border-accent"
              />
            </div>
          </div>

          {/* Payment method section */}
          <div className="rounded-2xl border border-border bg-background-elevated/40 p-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">
              Metodo di Pagamento
            </h2>
            <div className="mt-3 flex flex-col gap-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  disabled={!method.available}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                    paymentMethod === method.id && method.available
                      ? "border-accent/60 bg-accent/10 text-accent"
                      : "border-border bg-background/60 text-foreground"
                  } ${!method.available ? "cursor-not-allowed opacity-40" : "hover:border-accent/40"}`}
                >
                  <span className={`h-9 w-9 shrink-0 overflow-hidden rounded-full ${method.available ? "text-accent" : "text-muted/40"}`}>
                    {method.icon}
                  </span>
                  <span className="text-left">
                    <span className="block font-medium">{method.label}</span>
                    <span className="block text-xs text-muted">{method.sub}</span>
                  </span>
                  {paymentMethod === method.id && method.available && (
                    <svg viewBox="0 0 24 24" className="ml-auto h-4 w-4 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {error ? <p className="text-sm text-rose-400">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-full bg-accent py-3 text-sm font-semibold text-background shadow-[0_0_24px_-4px_var(--accent)] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Creazione ordine…" : (
              <>
                Procedi al Pagamento
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="rounded-2xl border border-border bg-background-elevated/40 p-4">
          <LtcPayment order={order} onPaid={handlePaid} onCancelled={handleCancelled} />
        </div>
      )}
    </div>
  );
}
