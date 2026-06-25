"use client";

import { useEffect, useRef, useState } from "react";
import { getLtcPrice, getProductOrder } from "@/lib/api";
import { formatEur, formatUsd } from "@/lib/format";
import { useLocale } from "@/lib/hooks/useLocale";
import { useQrCode } from "@/lib/hooks/useQrCode";
import type { ProductOrderResponse } from "@/lib/types";

const POLL_INTERVAL_MS = 1000;

interface LtcPaymentProps {
  order: ProductOrderResponse;
  cartTotal?: number;
  email?: string;
  onPaid: (deliveredItem?: string | null) => void;
  onCancelled: () => void;
}

type PaymentPhase = "waiting" | "confirming" | "done";

/* ─── Inline copy button (icon only, for order details rows) ─── */
function InlineCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }
  return (
    <button type="button" onClick={handleCopy} className="shrink-0 text-muted hover:text-accent transition-colors" title="Copy">
      {copied ? (
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
  );
}

/* ─── Full-width accent copy button ─── */
function AccentCopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="bg-accent/80 hover:bg-accent text-foreground rounded-xl py-3 px-4 w-full flex items-center justify-center gap-2 font-mono text-sm transition-colors"
    >
      <span className="truncate">{label}</span>
      {copied ? (
        <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-emerald-400" fill="currentColor" aria-hidden>
          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="currentColor" aria-hidden>
          <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12a1.5 1.5 0 01.439 1.061V14.5A1.5 1.5 0 0115.5 16H8.5A1.5 1.5 0 017 14.5V3.5z" />
          <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-1h-2.5A2.5 2.5 0 018 14V6H4.5z" />
        </svg>
      )}
    </button>
  );
}

/* ─── Circular progress ring SVG ─── */
function CircularProgress({ percentage }: { percentage: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-border" />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-accent transition-all duration-700"
        />
      </svg>
      <span className="absolute text-2xl font-bold text-foreground">{percentage}%</span>
    </div>
  );
}

export default function LtcPayment({ order, cartTotal, email, onPaid, onCancelled }: LtcPaymentProps) {
  const { t } = useLocale();
  const [ltcEur, setLtcEur] = useState<number | null>(null);
  const [ltcUsd, setLtcUsd] = useState<number | null>(null);
  const [phase, setPhase] = useState<PaymentPhase>("waiting");
  const [confirmations, setConfirmations] = useState(0);
  const [requiredConfirmations, setRequiredConfirmations] = useState(1);
  const [txHash, setTxHash] = useState<string | null>(null);
  const onPaidRef = useRef(onPaid);
  const onCancelledRef = useRef(onCancelled);
  onPaidRef.current = onPaid;
  onCancelledRef.current = onCancelled;
  const [createdAt] = useState(() => new Date().toLocaleString());

  useEffect(() => {
    getLtcPrice().then((res) => {
      if (res) {
        setLtcEur(res.eur);
        setLtcUsd(res.usd);
      }
    });
  }, [order]);

  const displayEur = order.amountEur > 0 ? order.amountEur : (cartTotal ?? order.amountEur);
  const approxLtc = ltcEur && displayEur > 0 ? (displayEur / ltcEur).toFixed(8) : null;
  const approxUsd = ltcUsd && ltcEur && displayEur > 0 ? (displayEur * (ltcUsd / ltcEur)) : null;
  const qrCode = useQrCode(
    approxLtc ? `litecoin:${order.address}?amount=${approxLtc}` : null,
  );

  useEffect(() => {
    let cancelled = false;
    const interval = setInterval(async () => {
      const statusRes = await getProductOrder(order.orderId);
      if (cancelled || !statusRes) return;

      if (statusRes.confirmations !== undefined) {
        setConfirmations(statusRes.confirmations);
      }
      if (statusRes.requiredConfirmations !== undefined) {
        setRequiredConfirmations(statusRes.requiredConfirmations);
      }

      if (statusRes.status === "confirming") {
        setPhase("confirming");
      } else if (statusRes.status === "paid") {
        setPhase("done");
        clearInterval(interval);
        onPaidRef.current(statusRes.deliveredItem);
      } else if (statusRes.status === "cancelled") {
        clearInterval(interval);
        onCancelledRef.current();
      }
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [order.orderId]);

  const confirmPct = requiredConfirmations > 0
    ? Math.min(100, Math.round((confirmations / requiredConfirmations) * 100))
    : 0;

  /* ─── Order details section (shared between states) ─── */
  const orderDetailsSection = (
    <>
      <div className="border-t border-border my-6" />
      <div className="flex flex-col gap-3">
        {/* Invoice ID */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">{t("ltcPayment.invoiceId")}</span>
          <span className="flex items-center gap-2 text-sm text-foreground font-mono">
            {order.orderId}
            <InlineCopyButton text={order.orderId} />
          </span>
        </div>
        {/* Email */}
        {email && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">{t("ltcPayment.emailAddress")}</span>
            <span className="text-sm text-foreground">{email}</span>
          </div>
        )}
        {/* Total Price EUR */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">{t("ltcPayment.totalPrice")}</span>
          <span className="text-sm text-foreground">{formatEur(displayEur)}</span>
        </div>
        {/* Total Price USD */}
        {approxUsd !== null && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">{t("ltcPayment.totalPriceUsd")}</span>
            <span className="text-sm text-foreground">{formatUsd(approxUsd)}</span>
          </div>
        )}
        {/* Total Amount LTC */}
        {approxLtc && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">{t("ltcPayment.totalAmountLtc")}</span>
            <span className="text-sm text-foreground font-mono">{approxLtc} LTC</span>
          </div>
        )}
        {/* Created At */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">{t("ltcPayment.createdAt")}</span>
          <span className="text-sm text-foreground">{createdAt}</span>
        </div>
      </div>
    </>
  );

  if (phase === "confirming") {
    return (
      <div className="flex flex-col items-center gap-5 text-left">
        {/* Circular progress */}
        <CircularProgress percentage={confirmPct} />

        <div className="text-center">
          <p className="text-lg font-bold text-foreground">{t("ltcPayment.confirmAndPay")}</p>
          <p className="text-sm text-muted">{t("ltcPayment.nextReceiveItems")}</p>
        </div>

        {/* Order details */}
        {orderDetailsSection}

        {/* Info banner */}
        <div className="border border-accent/30 bg-accent/5 rounded-xl p-4 w-full">
          <p className="text-sm text-accent">{t("ltcPayment.autoConfirmed")}</p>
        </div>

        {/* Transaction History */}
        <div className="w-full">
          <h3 className="text-accent font-semibold text-lg mb-3">{t("ltcPayment.transactionHistory")}</h3>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background/60 px-4 py-3">
            <span className="text-sm font-mono text-foreground">{approxLtc ?? "—"} LTC</span>
            {txHash && (
              <span className="text-sm font-mono text-muted truncate">{txHash.slice(0, 16)}…</span>
            )}
            {!txHash && (
              <span className="text-sm text-muted truncate">{order.orderId}</span>
            )}
            <svg className="ml-auto h-4 w-4 animate-spin text-accent shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
              <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  // phase === "waiting"
  return (
    <div className="flex flex-col gap-4 text-left">
      {/* Info banner */}
      <div className="border border-accent/30 bg-accent/5 rounded-xl p-4">
        <p className="text-sm text-accent">{t("ltcPayment.autoProcessed")}</p>
      </div>

      {/* Address section */}
      <h3 className="text-accent font-semibold text-lg">{t("ltcPayment.sendToAddress")}</h3>
      <p className="text-sm text-muted">{t("ltcPayment.scanQr")}</p>

      {/* QR Code */}
      <div className="flex justify-center">
        {qrCode ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrCode}
            alt="LTC payment address QR code"
            className="h-52 w-52 rounded-xl border border-border"
          />
        ) : (
          <div className="flex h-52 w-52 items-center justify-center rounded-xl border border-border text-xs text-muted">
            {t("ltcPayment.generatingQr")}
          </div>
        )}
      </div>

      <p className="text-sm text-muted">{t("ltcPayment.orCopyAddress")}</p>

      {/* Address copy button (accent filled) */}
      <AccentCopyButton text={order.address} label={order.address} />

      {/* Open Wallet button (bordered) */}
      {approxLtc && (
        <a
          href={`litecoin:${order.address}?amount=${approxLtc}`}
          className="border border-border rounded-xl py-3 px-4 w-full flex items-center justify-center gap-2 hover:border-accent text-foreground text-sm transition-colors"
        >
          {t("ltcPayment.openWallet")}
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
            <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
            <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" />
          </svg>
        </a>
      )}

      {/* Amount section */}
      <h3 className="text-accent font-semibold text-lg">{t("ltcPayment.sendExactAmount")}</h3>
      <p className="text-sm text-muted">{t("ltcPayment.copyItBelow")}</p>

      {/* Amount copy button (accent filled) */}
      {approxLtc && (
        <AccentCopyButton text={approxLtc} label={`${approxLtc} LTC`} />
      )}

      {/* Waiting indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted py-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
        {t("ltcPayment.waitingForPayment")}
      </div>

      {/* Order details */}
      {orderDetailsSection}
    </div>
  );
}
