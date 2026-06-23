"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import { createSmmOrder, getSmmOrder, getSmmProducts } from "@/lib/api";
import { formatEur } from "@/lib/format";
import { useLocale } from "@/lib/hooks/useLocale";
import { useQrCode } from "@/lib/hooks/useQrCode";
import type { SmmOrderResponse, SmmOrderStatusResponse, SmmProduct } from "@/lib/types";

export default function SmmCheckoutPage() {
  return (
    <PageShell>
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg">
          <Suspense fallback={<p className="mt-10 text-sm text-muted">Loading...</p>}>
            <SmmCheckoutContent />
          </Suspense>
        </div>
      </section>
    </PageShell>
  );
}

type Phase = "loading" | "confirm" | "paying" | "processing" | "completed" | "error";

function SmmCheckoutContent() {
  const { formatPrice } = useLocale();
  const params = useSearchParams();

  const productId = params.get("productId") ?? "";
  const quantity = Math.max(1, parseInt(params.get("quantity") ?? "0", 10));
  const link = params.get("link") ?? "";
  const discord = params.get("discord") ?? "";

  const [product, setProduct] = useState<SmmProduct | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [order, setOrder] = useState<SmmOrderResponse | null>(null);
  const [status, setStatus] = useState<SmmOrderStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalEur = product ? (quantity / 1000) * product.pricePerThousand : 0;

  useEffect(() => {
    if (!productId) { setPhase("error"); setError("Missing product ID."); return; }
    if (!link) { setPhase("error"); setError("Missing link."); return; }
    if (!discord) { setPhase("error"); setError("Missing Discord username."); return; }

    getSmmProducts().then((res) => {
      const p = res?.products?.find((x) => x.id === productId);
      if (!p) { setPhase("error"); setError("Product not found."); return; }
      setProduct(p);
      setPhase("confirm");
    });
  }, [productId, link, discord]);

  async function handleConfirm() {
    setPhase("loading");
    const res = await createSmmOrder({ smmProductId: productId, quantity, link, discord });
    if (!res) { setPhase("error"); setError("Failed to create order. Please try again."); return; }
    setOrder(res);
    setPhase("paying");
    startPolling(res.orderId);
  }

  function startPolling(orderId: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const s = await getSmmOrder(orderId);
      if (!s) return;
      setStatus(s);
      if (s.status === "processing" || s.status === "completed") {
        setPhase(s.status);
        if (pollRef.current) clearInterval(pollRef.current);
        if (s.status === "processing") {
          // Keep polling for completion
          pollRef.current = setInterval(async () => {
            const s2 = await getSmmOrder(orderId);
            if (!s2) return;
            setStatus(s2);
            if (s2.status === "completed" || s2.status === "cancelled") {
              setPhase(s2.status === "completed" ? "completed" : "error");
              if (s2.status === "cancelled") setError("Order was cancelled.");
              if (pollRef.current) clearInterval(pollRef.current);
            }
          }, 5000);
        }
      }
      if (s.status === "cancelled") {
        setPhase("error");
        setError("Order was cancelled.");
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 3000);
  }

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  if (phase === "loading") {
    return (
      <div className="mt-10 flex flex-col items-center gap-4">
        <svg className="h-8 w-8 animate-spin text-accent" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
          <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <p className="text-sm text-muted">Loading...</p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="mt-10 flex flex-col items-center gap-6 rounded-2xl border border-rose-500/30 bg-rose-500/5 p-10 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-rose-500/40 bg-rose-500/10">
          <svg viewBox="0 0 24 24" className="h-10 w-10 text-rose-500" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </div>
        <p className="text-sm text-muted">{error}</p>
        <Link href="/#smm" className="rounded-full border border-rose-500/30 bg-rose-500/10 px-6 py-2.5 text-sm font-semibold text-rose-400 hover:bg-rose-500 hover:text-white transition-colors">
          Back to SMM Shop
        </Link>
      </div>
    );
  }

  if (phase === "confirm" && product) {
    return (
      <div className="mt-10">
        <h1 className="text-2xl font-bold text-foreground">Confirm SMM Order</h1>
        <p className="mt-2 text-sm text-muted">Review your order details before proceeding to payment.</p>

        <div className="mt-8 rounded-2xl border border-border bg-background/60 p-6">
          <div className="flex items-center gap-3 border-b border-border pb-4 mb-4">
            <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-bold text-indigo-400">SMM</span>
            <h2 className="text-lg font-bold text-foreground">{product.name}</h2>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Service</span>
              <span className="font-medium text-foreground">{product.name}</span>
            </div>
            {product.category && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">Platform</span>
                <span className="font-medium text-foreground">{product.category}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted">Quantity</span>
              <span className="font-medium text-foreground">{quantity.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Link</span>
              <span className="max-w-[200px] truncate font-medium text-foreground">{link}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Price per 1K</span>
              <span className="font-medium text-foreground">{formatPrice(product.pricePerThousand)}</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between">
              <span className="text-sm font-bold text-foreground">Total</span>
              <span className="text-lg font-bold text-accent">{formatPrice(totalEur)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            className="mt-6 w-full rounded-full bg-accent px-4 py-3 text-sm font-bold text-background transition-all hover:shadow-[0_0_24px_-6px_var(--accent)] hover:brightness-110"
          >
            Pay with Litecoin &mdash; {formatPrice(totalEur)}
          </button>
        </div>
      </div>
    );
  }

  if ((phase === "paying" || phase === "processing" || phase === "completed") && order) {
    return (
      <div className="mt-10">
        <h1 className="text-2xl font-bold text-foreground">
          {phase === "paying" ? "Send Payment" : phase === "processing" ? "Processing Order" : "Order Complete"}
        </h1>

        {phase === "paying" && (
          <SmmPaymentView order={order} status={status} />
        )}

        {phase === "processing" && (
          <div className="mt-8 flex flex-col items-center gap-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-10 text-center">
            <svg className="h-12 w-12 animate-spin text-amber-400" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
              <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <h2 className="text-xl font-bold text-amber-400">Processing Your Order</h2>
            <p className="text-sm text-muted">Payment received! Your SMM order is being processed.</p>
            {status?.smmOrderId && (
              <p className="text-xs text-muted">SMM Order ID: #{status.smmOrderId}</p>
            )}
            {status?.smmStatus && (
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-400">
                {status.smmStatus}
              </span>
            )}
          </div>
        )}

        {phase === "completed" && (
          <div className="mt-8 flex flex-col items-center gap-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-10 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-emerald-500/40 bg-emerald-500/10">
              <svg viewBox="0 0 24 24" className="h-10 w-10 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-emerald-400">Order Completed!</h2>
            <p className="text-sm text-muted">Your SMM order has been fulfilled successfully.</p>
            <div className="space-y-1">
              <p className="text-xs text-muted">Service: {order.serviceName}</p>
              <p className="text-xs text-muted">Quantity: {order.quantity.toLocaleString()}</p>
              {status?.smmOrderId && <p className="text-xs text-muted">SMM Order ID: #{status.smmOrderId}</p>}
            </div>
            <Link href="/#smm" className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-6 py-2.5 text-sm font-semibold text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors">
              Back to SMM Shop
            </Link>
          </div>
        )}
      </div>
    );
  }

  return null;
}

function SmmPaymentView({ order, status }: { order: SmmOrderResponse; status: SmmOrderStatusResponse | null }) {
  const ltcUri = `litecoin:${order.address}?amount=${order.amountLtc}`;
  const qrSvg = useQrCode(ltcUri);
  const [copied, setCopied] = useState(false);

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(order.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  const isConfirming = status?.status === "confirming";

  return (
    <div className="mt-8 rounded-2xl border border-border bg-background/60 p-6">
      {isConfirming && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
          <svg className="h-5 w-5 animate-spin text-amber-400" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
            <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-400">Transaction detected!</p>
            <p className="text-xs text-muted">
              Confirmations: {status.confirmations ?? 0}/{status.requiredConfirmations ?? 1}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-muted">Send exactly:</p>
        <p className="text-2xl font-bold text-accent">{order.amountLtc} LTC</p>
        <p className="text-xs text-muted">({formatEur(order.amountEur)})</p>

        {qrSvg && (
          <div
            className="mt-2 rounded-xl bg-white p-3"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
        )}

        <div className="w-full rounded-xl border border-border bg-background-elevated p-3">
          <p className="mb-1 text-xs text-muted">LTC Address</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 break-all text-xs text-foreground">{order.address}</code>
            <button type="button" onClick={copyAddress} className="shrink-0 rounded-lg border border-border px-2 py-1 text-xs text-muted hover:text-accent transition-colors">
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        <div className="w-full space-y-2 rounded-xl border border-border bg-background-elevated p-3">
          <div className="flex justify-between text-xs">
            <span className="text-muted">Service</span>
            <span className="text-foreground">{order.serviceName}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted">Quantity</span>
            <span className="text-foreground">{order.quantity.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted">Link</span>
            <span className="max-w-[180px] truncate text-foreground">{order.link}</span>
          </div>
        </div>

        {!isConfirming && (
          <div className="flex items-center gap-2 text-xs text-muted">
            <svg className="h-4 w-4 animate-pulse text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            Waiting for payment...
          </div>
        )}
      </div>
    </div>
  );
}
