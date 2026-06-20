"use client";

import { useEffect, useState } from "react";
import { getLtcPrice, getProductOrder } from "@/lib/api";
import { formatEur } from "@/lib/format";
import { useLocale } from "@/lib/hooks/useLocale";
import { useQrCode } from "@/lib/hooks/useQrCode";
import type { ProductOrderResponse } from "@/lib/types";

const POLL_INTERVAL_MS = 1000;

interface LtcPaymentProps {
  order: ProductOrderResponse;
  cartTotal?: number;
  onPaid: (deliveredItem?: string | null) => void;
  onCancelled: () => void;
}

type PaymentPhase = "waiting" | "confirming" | "done";

export default function LtcPayment({ order, cartTotal, onPaid, onCancelled }: LtcPaymentProps) {
  const { t } = useLocale();
  const [ltcEur, setLtcEur] = useState<number | null>(null);
  const [phase, setPhase] = useState<PaymentPhase>("waiting");
  const [confirmations, setConfirmations] = useState(0);
  const [requiredConfirmations, setRequiredConfirmations] = useState(1);

  useEffect(() => {
    getLtcPrice().then((res) => {
      if (res) setLtcEur(res.eur);
    });
  }, [order]);

  const displayEur = order.amountEur > 0 ? order.amountEur : (cartTotal ?? order.amountEur);
  const approxLtc = ltcEur && displayEur > 0 ? (displayEur / ltcEur).toFixed(8) : null;
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
        onPaid(statusRes.deliveredItem);
      } else if (statusRes.status === "cancelled") {
        clearInterval(interval);
        onCancelled();
      }
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [order, onPaid, onCancelled]);

  const confirmPct = requiredConfirmations > 0
    ? Math.min(100, Math.round((confirmations / requiredConfirmations) * 100))
    : 0;

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      {phase === "waiting" && (
        <>
          {qrCode ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrCode}
              alt="LTC payment address QR code"
              className="h-48 w-48 rounded-xl border border-border"
            />
          ) : (
            <div className="flex h-48 w-48 items-center justify-center rounded-xl border border-border text-xs text-muted">
              {t("ltcPayment.generatingQr")}
            </div>
          )}

          <div className="w-full break-all rounded-lg border border-border bg-background/60 px-3 py-2 font-mono text-xs text-foreground">
            {order.address}
          </div>
        </>
      )}

      {phase === "confirming" && (
        <div className="flex w-full flex-col items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
            <svg viewBox="0 0 24 24" className="h-7 w-7 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83" />
            </svg>
          </div>
          <p className="text-lg font-bold text-emerald-400">{t("ltcPayment.paymentDetected")}</p>
          <p className="text-sm text-muted">{t("ltcPayment.waitingConfirmations")}</p>

          <div className="mt-2 w-full">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>Confirmations</span>
              <span className="font-mono font-semibold text-emerald-400">
                {confirmations} / {requiredConfirmations}
              </span>
            </div>
            <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${confirmPct}%` }}
              />
            </div>
          </div>

          <p className="mt-1 text-xs text-muted">
            This usually takes 2–5 minutes. The page updates every second.
          </p>
        </div>
      )}

      <div className="flex w-full items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2 text-sm">
        <span className="text-muted">{t("ltcPayment.amountDue")}</span>
        <span className="font-semibold text-foreground">
          {formatEur(displayEur)}
          {approxLtc ? ` ≈ ${approxLtc} LTC` : ""}
        </span>
      </div>

      {phase === "waiting" && (
        <>
          <p className="text-xs text-muted">
            {t("ltcPayment.sendExactAmount")} {t("ltcPayment.orderId")}:{" "}
            <span className="font-mono text-foreground">{order.orderId}</span>
          </p>

          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
            {t("ltcPayment.waitingForPayment")}
          </div>
        </>
      )}

      {phase === "confirming" && (
        <div className="flex items-center gap-2 text-xs text-emerald-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          {t("ltcPayment.confirmingTransaction")}
        </div>
      )}
    </div>
  );
}
