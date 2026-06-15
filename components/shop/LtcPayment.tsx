"use client";

import { useEffect, useState } from "react";
import { getLtcPrice, getProductOrder } from "@/lib/api";
import { formatEur } from "@/lib/format";
import { useQrCode } from "@/lib/hooks/useQrCode";
import type { ProductOrderResponse } from "@/lib/types";

const POLL_INTERVAL_MS = 5000;

interface LtcPaymentProps {
  order: ProductOrderResponse;
  onPaid: (deliveredItem?: string | null) => void;
}

export default function LtcPayment({ order, onPaid }: LtcPaymentProps) {
  const [ltcEur, setLtcEur] = useState<number | null>(null);
  const qrCode = useQrCode(`litecoin:${order.address}?amount=${order.amountEur}`);

  useEffect(() => {
    getLtcPrice().then((res) => {
      if (res) setLtcEur(res.eur);
    });
  }, [order]);

  useEffect(() => {
    let cancelled = false;
    const interval = setInterval(async () => {
      const statusRes = await getProductOrder(order.orderId);
      if (cancelled || !statusRes) return;
      if (statusRes.status === "paid") onPaid(statusRes.deliveredItem);
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [order, onPaid]);

  const approxLtc = ltcEur ? (order.amountEur / ltcEur).toFixed(6) : null;

  return (
    <div className="flex flex-col items-center gap-4 text-center">
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
        <span className="text-muted">Amount due</span>
        <span className="font-semibold text-foreground">
          {formatEur(order.amountEur)}
          {approxLtc ? ` ≈ ${approxLtc} LTC` : ""}
        </span>
      </div>

      <p className="text-xs text-muted">
        Send the exact amount above to the LTC address. This page will update automatically
        once payment is received. Order ID:{" "}
        <span className="font-mono text-foreground">{order.orderId}</span>
      </p>

      <div className="flex items-center gap-2 text-xs text-muted">
        <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
        Waiting for payment…
      </div>
    </div>
  );
}
