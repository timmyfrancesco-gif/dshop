"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import PageShell from "@/components/layout/PageShell";
import { SiteConfigProvider, type SiteConfig } from "@/lib/contexts/SiteConfigContext";
import { HomepageDataProvider } from "@/lib/contexts/HomepageDataContext";
import { useTheme } from "@/lib/contexts/ThemeContext";
import { useCart } from "@/lib/hooks/useCart";

interface TenantInfo {
  id: string;
  slug: string;
  name: string;
  logo: string | null;
  theme: string;
  discordInvite: string;
  hasWallet: boolean;
  paypalEmail: string | null;
}

interface OrderState {
  orderId: string;
  method: "ltc" | "paypal";
  address?: string;
  amountLtc?: number;
  paypalEmail?: string;
  paypalNote?: string;
  amountEur: number;
  status: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ThemeApplier({ theme }: { theme: string }) {
  const { setTheme, theme: currentTheme } = useTheme();
  useEffect(() => {
    const original = currentTheme;
    setTheme(theme === "heaven" ? "heaven" : "hyper", false);
    return () => setTheme(original, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export default function TenantCheckout({ tenant }: { tenant: TenantInfo }) {
  const siteConfig: SiteConfig = {
    name: tenant.name,
    tagline: "",
    discordInvite: tenant.discordInvite,
    shopUrl: "",
    isTenant: true,
    tenantSlug: tenant.slug,
    tenantLogo: tenant.logo,
  };

  return (
    <SiteConfigProvider config={siteConfig}>
      <ThemeApplier theme={tenant.theme} />
      <HomepageDataProvider staticData>
        <PageShell>
          <section className="px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-lg">
              <CheckoutBody tenant={tenant} />
            </div>
          </section>
        </PageShell>
      </HomepageDataProvider>
    </SiteConfigProvider>
  );
}

function CheckoutBody({ tenant }: { tenant: TenantInfo }) {
  const cart = useCart();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderState | null>(null);
  const [method, setMethod] = useState<"ltc" | "paypal">(
    tenant.hasWallet ? "ltc" : "paypal"
  );

  const hasPaypal = !!tenant.paypalEmail;

  const total = useMemo(
    () =>
      cart.lines.reduce(
        (sum, l) => sum + (l.variantPrice ?? l.item.price) * l.quantity,
        0
      ),
    [cart.lines]
  );

  // The current implementation settles one product per order (the bot delivers
  // a single item per temp wallet). Use the first cart line.
  const firstLine = cart.lines[0];

  async function startPayment(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter a valid email for delivery.");
      return;
    }
    if (!firstLine) return;
    if (method === "ltc" && !tenant.hasWallet) {
      setError("This shop hasn't finished its wallet setup yet.");
      return;
    }
    if (method === "paypal" && !hasPaypal) {
      setError("This shop does not accept PayPal.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: firstLine.item.id,
          variantId: firstLine.variantId,
          email: email.trim(),
          method,
        }),
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
    return (
      <PaymentScreen
        tenant={tenant}
        order={order}
        email={email}
        onPaid={() => cart.clear()}
      />
    );
  }

  if (cart.lines.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-background/60 p-8 text-center">
        <p className="text-sm text-muted">Your cart is empty.</p>
        <Link
          href={`/s/${tenant.slug}`}
          className="mt-4 inline-block rounded-full border border-accent/30 bg-accent-soft px-5 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-background"
        >
          Back to shop
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-foreground">Checkout</h1>

      <div className="rounded-2xl border border-border bg-background-elevated/40 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">
          Order summary
        </h2>
        <div className="mt-3 flex flex-col gap-2">
          {cart.lines.map((l) => (
            <div
              key={`${l.item.id}-${l.variantId ?? ""}`}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-foreground">
                {l.item.name}
                {l.variantTitle ? ` — ${l.variantTitle}` : ""} × {l.quantity}
              </span>
              <span className="text-muted">
                €{((l.variantPrice ?? l.item.price) * l.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <span className="text-sm text-muted">Total</span>
          <span className="text-lg font-bold text-foreground">
            €{total.toFixed(2)}
          </span>
        </div>
        {cart.lines.length > 1 && (
          <p className="mt-2 text-xs text-amber-400">
            Only the first item is processed per payment. Buy the rest in a
            separate order.
          </p>
        )}
      </div>

      <form onSubmit={startPayment} className="flex flex-col gap-4">
        {(tenant.hasWallet && hasPaypal) && (
          <div className="rounded-2xl border border-border bg-background-elevated/40 p-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">
              Payment method
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMethod("ltc")}
                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                  method === "ltc"
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-border bg-background/60 text-muted hover:border-accent/40"
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                  <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-1.5 5h2.2l-1.1 4.2 1.6-.6-.4 1.6-1.6.6-.6 2.2H14l-.4 1.5H8.5l.9-3.2-1.4.5.4-1.6 1.4-.5L11 7z" />
                </svg>
                Litecoin
              </button>
              <button
                type="button"
                onClick={() => setMethod("paypal")}
                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                  method === "paypal"
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-border bg-background/60 text-muted hover:border-accent/40"
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                  <path d="M7.1 21.4h2.9l.7-4.3h2.4c3.9 0 6.5-1.9 7.2-5.6.3-1.6.1-2.9-.7-3.8-.3-.4-.8-.7-1.3-1 .5-2.5-.1-3.7-1-4.7C16.3 1 14.7.5 12.7.5H6.4c-.5 0-.9.3-1 .8L2.7 19.1c-.1.4.2.8.6.8h3.3l.5-3.4v.1l-.1 4.8h.1z" />
                </svg>
                PayPal
              </button>
            </div>
            {method === "paypal" && (
              <p className="mt-2 text-xs text-muted">
                Friends &amp; Family payment — instructions on the next step.
              </p>
            )}
          </div>
        )}

        <div className="rounded-2xl border border-border bg-background-elevated/40 p-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">
            Delivery email
          </h2>
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
          {loading
            ? "Creating order…"
            : method === "paypal"
            ? "Pay with PayPal"
            : "Pay with Litecoin"}
        </button>
        <Link
          href={`/s/${tenant.slug}`}
          className="text-center text-sm text-muted transition-colors hover:text-accent"
        >
          Back to shop
        </Link>
      </form>
    </div>
  );
}

function PaymentScreen({
  tenant,
  order,
  email,
  onPaid,
}: {
  tenant: TenantInfo;
  order: OrderState;
  email: string;
  onPaid: () => void;
}) {
  const [status, setStatus] = useState(order.status);
  const [delivered, setDelivered] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const paidFired = useRef(false);

  const isPaid = status === "paid" || status === "delivered";
  const isPaypal = order.method === "paypal";

  useEffect(() => {
    if (isPaypal || !order.address) return;
    QRCode.toDataURL(`litecoin:${order.address}?amount=${order.amountLtc}`, {
      width: 220,
      margin: 1,
    })
      .then(setQr)
      .catch(() => setQr(null));
  }, [order.address, order.amountLtc, isPaypal]);

  useEffect(() => {
    if (isPaid) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(
          `/api/tenants/${tenant.id}/orders/${order.orderId}`,
          { cache: "no-store" }
        );
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        setStatus(data.status);
        if (data.deliveredItem) setDelivered(data.deliveredItem);
      } catch {
        // ignore transient errors
      }
    };
    const interval = setInterval(poll, 8000);
    poll();
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [tenant.id, order.orderId, isPaid]);

  useEffect(() => {
    if (isPaid && !paidFired.current) {
      paidFired.current = true;
      onPaid();
    }
  }, [isPaid, onPaid]);

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  }

  if (isPaid) {
    return (
      <div className="flex flex-col items-center gap-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
          <svg viewBox="0 0 24 24" className="h-8 w-8 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-foreground">Payment received!</h2>
        <p className="text-sm text-muted">
          A confirmation was sent to <strong>{email}</strong>.
        </p>
        {delivered && (
          <div className="w-full rounded-xl border border-border bg-background/60 p-4 text-left">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">
              Your item
            </p>
            <p className="break-all font-mono text-sm text-foreground">
              {delivered}
            </p>
          </div>
        )}
        <Link
          href={`/s/${tenant.slug}`}
          className="rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-muted transition-colors hover:text-foreground"
        >
          Back to shop
        </Link>
      </div>
    );
  }

  if (isPaypal) {
    return (
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">PayPal payment</h1>
          <p className="mt-1 text-sm text-muted">
            Follow the steps below exactly. The page updates automatically once
            the payment is confirmed.
          </p>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-background-elevated/40 p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">
              Amount
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              €{order.amountEur.toFixed(2)}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">
              Send to (PayPal email)
            </p>
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2">
              <span className="flex-1 break-all font-mono text-sm text-foreground">
                {order.paypalEmail}
              </span>
              <button
                type="button"
                onClick={() => copyText(order.paypalEmail ?? "")}
                className="shrink-0 text-xs font-semibold text-accent transition-opacity hover:opacity-80"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">
              Payment note (required)
            </p>
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-accent/40 bg-accent-soft px-3 py-2">
              <span className="flex-1 font-mono text-lg font-bold tracking-wider text-accent">
                {order.paypalNote}
              </span>
              <button
                type="button"
                onClick={() => copyText(order.paypalNote ?? "")}
                className="shrink-0 text-xs font-semibold text-accent transition-opacity hover:opacity-80"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
              Important
            </p>
            <ul className="mt-2 flex list-disc flex-col gap-1 pl-4 text-xs text-muted">
              <li>Send as <strong className="text-foreground">Friends &amp; Family</strong> — NOT Goods &amp; Services.</li>
              <li>Put the code <strong className="text-foreground">{order.paypalNote}</strong> in the payment note.</li>
              <li>Send exactly <strong className="text-foreground">€{order.amountEur.toFixed(2)}</strong>.</li>
              <li>Payments without the code or with a wrong amount can&apos;t be matched automatically.</li>
            </ul>
          </div>

          <a
            href={`https://www.paypal.com/myaccount/transfer/homepage/pay`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-accent py-3 text-center text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            Open PayPal
          </a>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-muted">
          <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
          Waiting for payment confirmation…
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Send payment</h1>
        <p className="mt-1 text-sm text-muted">
          Send exactly the amount below. The page updates automatically once the
          payment is detected.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-background-elevated/40 p-6">
        {qr && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt="Payment QR" className="rounded-xl bg-white p-2" />
        )}
        <div className="w-full">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            Amount (LTC)
          </p>
          <p className="mt-1 font-mono text-xl font-bold text-foreground">
            {order.amountLtc} <span className="text-sm text-muted">LTC</span>
          </p>
          <p className="text-xs text-muted">≈ €{order.amountEur.toFixed(2)}</p>
        </div>
        <div className="w-full">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            Litecoin address
          </p>
          <div className="mt-1 flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2">
            <span className="flex-1 break-all font-mono text-xs text-foreground">
              {order.address}
            </span>
            <button
              type="button"
              onClick={() => copyText(order.address ?? "")}
              className="shrink-0 text-xs font-semibold text-accent transition-opacity hover:opacity-80"
            >
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
