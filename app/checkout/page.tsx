"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import LtcPayment from "@/components/shop/LtcPayment";
import { createProductOrder, isApiConfigured, submitReview } from "@/lib/api";
import { useCart } from "@/lib/hooks/useCart";
import { useLocale } from "@/lib/hooks/useLocale";
import { useProducts } from "@/lib/hooks/useProducts";
import type { ProductOrderResponse, ShopItem } from "@/lib/types";

interface QueueItem {
  item: ShopItem;
  variantId?: string;
  variantTitle?: string;
  variantPrice?: number;
}

interface FinishedData {
  productId: string;
  productName: string;
  productIcon?: string;
  productImage?: string;
  deliveredItems: (string | null | undefined)[];
  email: string;
  totalEur: number;
  orderId?: string;
  queueLength: number;
  ts: number;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ORDER_STORAGE_KEY = "checkout_order_v1";
const FINISHED_STORAGE_KEY = "checkout_finished_v1";

const PAYMENT_METHODS_ICONS = {
  ltc: (
    <svg viewBox="0 0 32 32" className="h-full w-full" aria-hidden>
      <circle cx="16" cy="16" r="16" fill="currentColor" />
      <path
        d="M12.5 7.5H15v9l-2.5.82.6 1.82 1.9-.62V24.5h9v-2h-7v-3.18l2.5-.82-.6-1.82-1.9.62V7.5z"
        fill="white"
      />
    </svg>
  ),
  btc: (
    <svg viewBox="0 0 32 32" className="h-full w-full" aria-hidden>
      <circle cx="16" cy="16" r="16" fill="currentColor" />
      <path
        d="M22 15.6c.4-.9.3-2-.8-2.7.4-.6.5-1.3.3-2-.4-1.4-1.9-2-3.7-2H10v14h8.2c2 0 4-.9 4.3-3.2.2-1.4-.4-2.5-1.3-3.1l.8-.3-.8-1-.2 1.3zM12.5 11h4c.8 0 1.5.4 1.5 1.3s-.7 1.3-1.5 1.3h-4V11zm4.5 8.5h-4.5v-3h4.5c1 0 1.7.5 1.7 1.5s-.8 1.5-1.7 1.5z"
        fill="white"
      />
    </svg>
  ),
  card: (
    <svg viewBox="0 0 32 32" className="h-full w-full" aria-hidden>
      <circle cx="16" cy="16" r="16" fill="currentColor" />
      <path
        d="M22 10H10c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2zm0 10H10v-4h12v4zm0-7H10v-1h12v1z"
        fill="white"
      />
    </svg>
  ),
};

export default function CheckoutPage() {
  return (
    <PageShell>
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg">
          <Suspense fallback={<p className="mt-10 text-sm text-muted"><LoadingFallback /></p>}>
            <CheckoutContent />
          </Suspense>
        </div>
      </section>
    </PageShell>
  );
}

function LoadingFallback() {
  const { t } = useLocale();
  return <>{t("checkout.loading")}</>;
}

function CheckoutContent() {
  const { t, formatPrice } = useLocale();
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");
  const variantId = searchParams.get("variantId");
  const qty = Math.max(1, Number(searchParams.get("qty") ?? "1") || 1);

  const { items, loaded, refetch: refetchProducts } = useProducts();
  const cart = useCart();

  const paymentMethods = useMemo(() => [
    { id: "ltc", label: t("checkout.litecoin"), sub: t("checkout.viaLtcNetwork"), available: true, icon: PAYMENT_METHODS_ICONS.ltc },
    { id: "btc", label: t("checkout.bitcoin"), sub: t("checkout.comingSoon"), available: false, icon: PAYMENT_METHODS_ICONS.btc },
    { id: "card", label: t("checkout.cardPaypal"), sub: t("checkout.comingSoon"), available: false, icon: PAYMENT_METHODS_ICONS.card },
  ], [t]);

  const buyNowProduct = productId ? items.find((item) => String(item.id) === productId) : null;
  const buyNowVariant = buyNowProduct && variantId
    ? buyNowProduct.variants?.find((v) => v.id === variantId) ?? null
    : null;

  const queue = useMemo((): QueueItem[] => {
    if (buyNowProduct) {
      return Array.from({ length: qty }, () => ({
        item: buyNowProduct,
        variantId: buyNowVariant?.id,
        variantTitle: buyNowVariant?.title,
        variantPrice: buyNowVariant?.price,
      }));
    }
    const result: QueueItem[] = [];
    for (const line of cart.lines) {
      for (let i = 0; i < line.quantity; i++) {
        result.push({
          item: line.item,
          variantId: line.variantId,
          variantTitle: line.variantTitle,
          variantPrice: line.variantPrice,
        });
      }
    }
    return result;
  }, [buyNowProduct, buyNowVariant, qty, cart.lines]);

  const [paymentMethod, setPaymentMethod] = useState("ltc");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const [order, setOrder] = useState<ProductOrderResponse | null>(null);
  const [finished, setFinished] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [deliveredItems, setDeliveredItems] = useState<(string | null | undefined)[]>([]);
  const [restoredFinished, setRestoredFinished] = useState<FinishedData | null>(null);

  // Restore order or finished state from sessionStorage on mount
  useEffect(() => {
    if (!loaded) return;
    try {
      // Check if there's a completed order (works even without productId in URL)
      const finishedRaw = sessionStorage.getItem(FINISHED_STORAGE_KEY);
      if (finishedRaw) {
        const finishedData = JSON.parse(finishedRaw) as FinishedData;
        if (Date.now() - finishedData.ts < 3_600_000) {
          if (!productId || finishedData.productId === productId) {
            setDeliveredItems(finishedData.deliveredItems);
            setEmail(finishedData.email);
            setRestoredFinished(finishedData);
            setFinished(true);
            return;
          }
        } else {
          sessionStorage.removeItem(FINISHED_STORAGE_KEY);
        }
      }
      // Check for in-progress order (requires productId)
      if (!productId) return;
      const raw = sessionStorage.getItem(ORDER_STORAGE_KEY);
      if (!raw) return;
      const stored = JSON.parse(raw) as { order: ProductOrderResponse; productId: string; email: string; ts: number };
      if (stored.productId === productId && Date.now() - stored.ts < 3_600_000) {
        setEmail(stored.email);
        setOrder(stored.order);
      } else {
        sessionStorage.removeItem(ORDER_STORAGE_KEY);
      }
    } catch {
      sessionStorage.removeItem(ORDER_STORAGE_KEY);
      sessionStorage.removeItem(FINISHED_STORAGE_KEY);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  if (!loaded) {
    return <p className="mt-10 text-sm text-muted">{t("checkout.loading")}</p>;
  }

  if (queue.length === 0 && !finished) {
    return (
      <div className="mt-10 rounded-2xl border border-border bg-background/60 p-8 text-center">
        <p className="text-sm text-muted">{t("checkout.emptyCart")}</p>
        <Link
          href="/#shop"
          className="mt-4 inline-block rounded-full border border-accent/30 bg-accent-soft px-5 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-background"
        >
          {t("checkout.backToShop")}
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
          <h2 className="text-2xl font-bold text-rose-500">{t("checkout.orderCancelled")}</h2>
          <p className="text-sm text-muted">{t("checkout.cancelledSubtitle")}</p>
        </div>
        <Link
          href="/#shop"
          className="rounded-full border border-rose-500/30 bg-rose-500/10 px-6 py-2.5 text-sm font-semibold text-rose-400 transition-colors hover:bg-rose-500 hover:text-white"
        >
          {t("checkout.backToShop")}
        </Link>
      </div>
    );
  }

  const currentEntry = queue[index] as QueueItem | undefined;
  const currentItem = currentEntry?.item;
  const isLast = index === queue.length - 1;
  const queueTotal = useMemo(() => {
    if (buyNowProduct) {
      const unitPrice = buyNowVariant?.price ?? buyNowProduct.price;
      return unitPrice * qty;
    }
    return cart.lines.reduce((sum, line) => {
      const price = line.variantPrice ?? line.item.price;
      return sum + price * line.quantity;
    }, 0);
  }, [buyNowProduct, buyNowVariant, qty, cart.lines]);

  const displayName = currentItem?.name ?? restoredFinished?.productName ?? "";
  const displayIcon = currentItem?.icon ?? restoredFinished?.productIcon;
  const displayImage = currentItem?.image ?? restoredFinished?.productImage;
  const displayTotal = queueTotal > 0 ? queueTotal : (restoredFinished?.totalEur ?? 0);
  const displayQueueLen = queue.length > 0 ? queue.length : (restoredFinished?.queueLength ?? 1);
  const displayOrderId = order?.orderId ?? restoredFinished?.orderId;
  const displayEmail = email || restoredFinished?.email || "";

  async function startPayment(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !EMAIL_RE.test(email.trim())) {
      setError(t("checkout.invalidEmail"));
      return;
    }

    if (!isApiConfigured()) {
      setError(t("checkout.unavailable"));
      return;
    }

    if (!currentItem || !currentEntry) return;
    setLoading(true);
    const res = await createProductOrder({
      productId: currentItem.id,
      discord: email.trim(),
      ...(currentEntry.variantId ? { variantId: currentEntry.variantId } : {}),
    });
    setLoading(false);

    if (!res) {
      setError(t("checkout.orderError"));
      return;
    }

    setOrder(res);
    try {
      sessionStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify({
        order: res,
        productId: currentItem.id,
        email: email.trim(),
        ts: Date.now(),
      }));
    } catch {}
  }

  function handlePaid(deliveredItem?: string | null) {
    sessionStorage.removeItem(ORDER_STORAGE_KEY);
    const newDelivered = [...deliveredItems, deliveredItem];
    setDeliveredItems(newDelivered);
    refetchProducts();
    if (isLast) {
      setFinished(true);
      if (!buyNowProduct) cart.clear();
      try {
        const finData: FinishedData = {
          productId: currentItem?.id ?? "",
          productName: currentItem?.name ?? "",
          productIcon: currentItem?.icon,
          productImage: currentItem?.image,
          deliveredItems: newDelivered,
          email: email.trim(),
          totalEur: queueTotal,
          orderId: order?.orderId,
          queueLength: queue.length,
          ts: Date.now(),
        };
        sessionStorage.setItem(FINISHED_STORAGE_KEY, JSON.stringify(finData));
      } catch {}
      return;
    }
    setIndex((i) => i + 1);
    setOrder(null);
  }

  function handleCancelled() {
    sessionStorage.removeItem(ORDER_STORAGE_KEY);
    setCancelled(true);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("checkout.title")}</h1>
        <p className="mt-1 text-xs text-muted uppercase tracking-widest">
          {finished
            ? t("checkout.step3")
            : order
              ? t("checkout.step2")
              : t("checkout.step1")}
        </p>
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-border">
          <div
            className={`h-full rounded-full transition-all duration-500 ${finished ? "bg-emerald-500" : "bg-accent"}`}
            style={{ width: finished ? "100%" : order ? "66%" : "33%" }}
          />
        </div>
      </div>

      {/* Order summary — improved with product image, name, subtitle, qty, price */}
      <div className="rounded-2xl border border-border bg-background-elevated/40 p-4">
        <div className="flex items-center gap-3">
          {/* Product image or icon fallback */}
          {displayImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayImage}
              alt={displayName}
              className="h-12 w-12 rounded-lg border border-border object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-accent/10 text-lg">
              {displayIcon || "📦"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
            <p className="text-xs text-muted">{currentEntry?.variantTitle ?? "Default"}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-muted">{displayQueueLen}x</p>
            <p className="text-sm font-bold text-foreground">{formatPrice(displayTotal)}</p>
          </div>
        </div>
      </div>

      {finished ? (
        <SuccessScreen
          productName={displayName}
          deliveredItems={deliveredItems}
          orderId={displayOrderId}
          email={displayEmail}
          totalEur={displayTotal}
        />
      ) : !order && currentItem ? (
        <form onSubmit={startPayment} className="flex flex-col gap-5">
          {/* Contact section */}
          <div className="rounded-2xl border border-border bg-background-elevated/40 p-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">
              {t("checkout.contactDelivery")}
            </h2>
            <div className="mt-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("checkout.emailPlaceholder")}
                autoComplete="email"
                autoFocus
                className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm text-foreground placeholder-muted outline-none transition-colors focus:border-accent"
              />
            </div>
          </div>

          {/* Payment method section */}
          <div className="rounded-2xl border border-border bg-background-elevated/40 p-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">
              {t("checkout.paymentMethod")}
            </h2>
            <div className="mt-3 flex flex-col gap-2">
              {paymentMethods.map((method) => (
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
            {loading ? t("checkout.creatingOrder") : (
              <>
                {t("checkout.proceedToPayment")}
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </form>
      ) : order ? (
        <div className="rounded-2xl border border-border bg-background-elevated/40 p-4">
          <LtcPayment order={order} cartTotal={queueTotal} email={email} onPaid={handlePaid} onCancelled={handleCancelled} />
        </div>
      ) : null}

      {/* Back to Shop link at the very bottom */}
      <div className="text-center pt-2">
        <Link
          href="/#shop"
          onClick={() => { try { if (finished) sessionStorage.removeItem(FINISHED_STORAGE_KEY); } catch {} }}
          className="text-sm text-muted hover:text-accent transition-colors"
        >
          {t("checkout.backToShop")}
        </Link>
      </div>
    </div>
  );
}

function SuccessScreen({
  productName,
  deliveredItems,
  orderId,
  email,
  totalEur,
}: {
  productName: string;
  deliveredItems: (string | null | undefined)[];
  orderId?: string;
  email?: string;
  totalEur?: number;
}) {
  const { t, formatPrice } = useLocale();
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const hasItems = deliveredItems.some((item) => item);
  const validItems = deliveredItems.filter((item): item is string => !!item);
  const [expanded, setExpanded] = useState(true);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    try {
      const stored = sessionStorage.getItem(`review_submitted_${orderId}`);
      if (stored) setReviewSubmitted(true);
    } catch {}
  }, [orderId]);

  async function handleSubmitReview() {
    if (!orderId || rating === 0) return;
    setReviewLoading(true);
    setReviewError(null);
    const { data, status } = await submitReview({ orderId, rating, comment: reviewText.trim() || undefined });
    setReviewLoading(false);
    if (data?.success || status === 409) {
      setReviewSubmitted(true);
      try { sessionStorage.setItem(`review_submitted_${orderId}`, "1"); } catch {}
    } else {
      setReviewError(t("checkout.reviewError"));
    }
  }

  async function handleCopySingle(text: string, idx: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch {}
  }

  async function handleCopyAll() {
    if (validItems.length === 0) return;
    try {
      await navigator.clipboard.writeText(validItems.join("\n"));
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {}
  }

  function handleDownload() {
    if (validItems.length === 0) return;
    const content = validItems.join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `order-${orderId ?? "items"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Success banner */}
      <div className="border border-accent/30 bg-accent/5 rounded-xl p-4">
        <p className="text-sm text-accent">
          Your order has been completed <strong>successfully</strong>!
        </p>
      </div>

      {/* Delivered Items section */}
      <div>
        <h3 className="text-accent font-semibold text-lg mb-3">{t("checkout.deliveredItems")}</h3>

        {/* Product card */}
        <div className="rounded-xl border border-border bg-background-elevated/40 overflow-hidden">
          {/* Product header row */}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-background/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">{productName}</p>
                <p className="text-xs text-muted">Default</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 rounded-full px-2.5 py-0.5 text-xs">
                {t("checkout.delivered")}
              </span>
              <svg
                viewBox="0 0 24 24"
                className={`h-4 w-4 text-muted transition-transform ${expanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </button>

          {/* Expanded deliverables */}
          {expanded && hasItems && (
            <div className="border-t border-border px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-2">
                {t("checkout.deliverables")}
              </p>
              <div className="flex flex-col gap-2">
                {validItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2"
                  >
                    <span className="flex-1 break-all font-mono text-xs text-foreground">
                      {item}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopySingle(item, i)}
                      className="shrink-0 text-muted hover:text-accent transition-colors"
                      title="Copy"
                    >
                      {copiedIdx === i ? (
                        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-emerald-400" fill="currentColor" aria-hidden>
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
                          <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12a1.5 1.5 0 01.439 1.061V14.5A1.5 1.5 0 0115.5 16H8.5A1.5 1.5 0 017 14.5V3.5z" />
                          <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-1h-2.5A2.5 2.5 0 018 14V6H4.5z" />
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {/* Download + Copy All buttons */}
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm text-foreground hover:border-accent transition-colors"
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                    <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                    <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                  </svg>
                  {t("checkout.downloadAll")}
                </button>
                <button
                  type="button"
                  onClick={handleCopyAll}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-accent/80 hover:bg-accent py-2.5 text-sm text-foreground transition-colors"
                >
                  {copiedAll ? (
                    <svg viewBox="0 0 20 20" className="h-4 w-4 text-emerald-400" fill="currentColor" aria-hidden>
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                      <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12a1.5 1.5 0 01.439 1.061V14.5A1.5 1.5 0 0115.5 16H8.5A1.5 1.5 0 017 14.5V3.5z" />
                      <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-1h-2.5A2.5 2.5 0 018 14V6H4.5z" />
                    </svg>
                  )}
                  {copiedAll ? t("checkout.copied") : t("checkout.copyAll")}
                </button>
              </div>
            </div>
          )}

          {/* No items fallback */}
          {expanded && !hasItems && (
            <div className="border-t border-border px-4 py-3">
              <p className="text-sm text-muted">
                {t("checkout.paymentConfirmed")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Order details */}
      {(orderId || email || totalEur) && (
        <div className="flex flex-col gap-3">
          {orderId && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">{t("ltcPayment.invoiceId")}</span>
              <span className="text-sm text-foreground font-mono">{orderId}</span>
            </div>
          )}
          {email && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">{t("ltcPayment.emailAddress")}</span>
              <span className="text-sm text-foreground">{email}</span>
            </div>
          )}
          {totalEur !== undefined && totalEur > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">{t("ltcPayment.totalPrice")}</span>
              <span className="text-sm text-foreground">{formatPrice(totalEur)}</span>
            </div>
          )}
        </div>
      )}

      {/* Leave Feedback */}
      <div className="rounded-2xl border border-border bg-background-elevated/40 p-4">
        <h3 className="text-accent font-semibold text-lg mb-3">{t("checkout.leaveFeedback")}</h3>
        {reviewSubmitted ? (
          <div className="flex items-center gap-2 text-emerald-400 text-sm">
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
            </svg>
            {t("checkout.reviewSubmitted")}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Star rating */}
            <div>
              <p className="text-xs text-muted mb-2">{t("checkout.tapToRate")}</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className={`h-8 w-8 transition-colors ${
                        star <= (hoverRating || rating)
                          ? "text-yellow-400"
                          : "text-border"
                      }`}
                      fill="currentColor"
                      aria-hidden
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
            {/* Review text */}
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder={t("checkout.ratingPlaceholder")}
              rows={3}
              className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm text-foreground placeholder-muted outline-none transition-colors focus:border-accent resize-none"
            />
            {reviewError && <p className="text-sm text-rose-400">{reviewError}</p>}
            {/* Submit */}
            <button
              type="button"
              onClick={handleSubmitReview}
              disabled={rating === 0 || reviewLoading}
              className="flex items-center justify-center gap-2 rounded-xl bg-accent/80 hover:bg-accent py-3 text-sm font-semibold text-foreground transition-colors disabled:opacity-50"
            >
              {reviewLoading ? t("checkout.submittingReview") : t("checkout.submitReview")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
