"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string | null;
  stock: number;
}
interface OrderState {
  orderId: string;
  address: string;
  amountLtc: number;
  amountEur: number;
  status: string;
}

export default function StoreCheckout({ product }: { product: Product }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderState | null>(null);

  async function startPayment(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter a valid email for delivery.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/store/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create the order.");
        return;
      }
      setOrder(data as OrderState);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (order) {
    return <PaymentScreen product={product} order={order} email={email} />;
  }

  return (
    <div className="flex flex-col gap-5">
      <Link href="/store" className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-accent">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        Store
      </Link>

      <div className="overflow-hidden rounded-2xl border border-border bg-background-elevated/40">
        <div className="flex aspect-video items-center justify-center bg-background/60">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-5xl">📦</span>
          )}
        </div>
        <div className="p-5">
          <h1 className="text-xl font-bold text-foreground">{product.name}</h1>
          {product.description && <p className="mt-1 text-sm text-muted">{product.description}</p>}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-2xl font-bold text-accent">€{product.price.toFixed(2)}</span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${product.stock > 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"}`}>
              {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
            </span>
          </div>
        </div>
      </div>

      {product.stock > 0 ? (
        <form onSubmit={startPayment} className="flex flex-col gap-4">
          <div className="rounded-2xl border border-border bg-background-elevated/40 p-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">Delivery email</h2>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
              className="mt-3 w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm text-foreground placeholder-muted outline-none transition-colors focus:border-accent"
            />
          </div>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-accent py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Creating order…" : "Pay with Litecoin"}
          </button>
        </form>
      ) : (
        <p className="text-center text-sm text-muted">This product is currently out of stock.</p>
      )}
    </div>
  );
}

function PaymentScreen({ product, order, email }: { product: Product; order: OrderState; email: string }) {
  const [status, setStatus] = useState(order.status);
  const [delivered, setDelivered] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(`litecoin:${order.address}?amount=${order.amountLtc}`, { width: 220, margin: 1 })
      .then(setQr)
      .catch(() => setQr(null));
  }, [order.address, order.amountLtc]);

  const doneRef = useRef(false);
  useEffect(() => {
    if (doneRef.current) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/store/orders/${order.orderId}`, { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        setStatus(data.status);
        if (data.deliveredItem) setDelivered(data.deliveredItem);
        if (data.status === "paid" || data.status === "expired") doneRef.current = true;
      } catch {
        // ignore transient errors
      }
    };
    const interval = setInterval(poll, 6000);
    poll();
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [order.orderId]);

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(order.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  if (status === "paid") {
    return (
      <div className="flex flex-col items-center gap-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
          <svg viewBox="0 0 24 24" className="h-8 w-8 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-foreground">Payment received!</h2>
        <p className="text-sm text-muted">A confirmation was sent to <strong>{email}</strong>.</p>
        {delivered && (
          <div className="w-full rounded-xl border border-border bg-background/60 p-4 text-left">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">Your item</p>
            <p className="break-all font-mono text-sm text-foreground">{delivered}</p>
          </div>
        )}
        <Link href="/store" className="rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-muted transition-colors hover:text-foreground">
          Back to store
        </Link>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-background-elevated/40 p-8 text-center">
        <h2 className="text-xl font-bold text-foreground">Order expired</h2>
        <p className="text-sm text-muted">This order was not paid in time and has been cancelled.</p>
        <Link href={`/store/${product.id}`} className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-background">
          Try again
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Send payment</h1>
        <p className="mt-1 text-sm text-muted">Send exactly the amount below. This page updates automatically once the payment is detected.</p>
      </div>
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-background-elevated/40 p-6">
        {qr && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt="Payment QR" className="rounded-xl bg-white p-2" />
        )}
        <div className="w-full">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">Amount (LTC)</p>
          <p className="mt-1 font-mono text-xl font-bold text-foreground">
            {order.amountLtc} <span className="text-sm text-muted">LTC</span>
          </p>
          <p className="text-xs text-muted">≈ €{order.amountEur.toFixed(2)}</p>
        </div>
        <div className="w-full">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">Litecoin address</p>
          <div className="mt-1 flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2">
            <span className="flex-1 break-all font-mono text-xs text-foreground">{order.address}</span>
            <button type="button" onClick={copyAddress} className="shrink-0 text-xs font-semibold text-accent transition-opacity hover:opacity-80">
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 text-sm text-muted">
        <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
        Waiting for payment…
      </div>
    </div>
  );
}
