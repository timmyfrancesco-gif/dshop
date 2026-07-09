"use client";

import { useEffect, useState } from "react";
import { getDcnBalance } from "@/lib/api";
import { formatEur } from "@/lib/format";
import { useDcnPrice } from "@/lib/hooks/useDcnPrice";
import { SITE } from "@/lib/config";
import type { DcnBalanceResponse } from "@/lib/types";

const DCN_DISCOUNT = 0.1;

/**
 * D-Coin doesn't have a site-side order/charge API yet (the bot only
 * supports debiting a purchase manually via ,dcnpay from staff in a
 * ticket) — so this isn't a real-time-tracked payment method like LTC/
 * PayPal. It shows the discounted total and the buyer's live balance, then
 * hands off to Discord to complete with staff.
 */
export default function DcnPayment({
  totalEur,
  discordId,
  onBack,
}: {
  totalEur: number;
  discordId?: string;
  onBack: () => void;
}) {
  const { price, loading: priceLoading } = useDcnPrice(1);
  const [balance, setBalance] = useState<DcnBalanceResponse | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);

  useEffect(() => {
    if (!discordId) {
      setBalanceLoading(false);
      return;
    }
    let cancelled = false;
    getDcnBalance(discordId).then((res) => {
      if (!cancelled) {
        setBalance(res);
        setBalanceLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [discordId]);

  const discountedTotal = totalEur * (1 - DCN_DISCOUNT);
  const requiredDcn = price ? discountedTotal / price : null;
  const hasEnough = balance !== null && requiredDcn !== null ? balance.balance >= requiredDcn : null;

  if (!discordId) {
    return (
      <div className="flex flex-col gap-4 text-left">
        <h2 className="text-lg font-bold text-foreground">Pay with D-Coin</h2>
        <p className="text-sm text-muted">
          Sign in with Discord on this site to see your D-Coin balance and pay with a 10% discount.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-border py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-accent"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 text-left">
      <div>
        <h2 className="text-lg font-bold text-foreground">Pay with D-Coin</h2>
        <p className="mt-1 text-sm text-muted">
          10% off applied. D-Coin purchases are completed by staff on Discord — this isn&apos;t automatic yet.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-background/60 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Total (10% off)</p>
          <p className="mt-1 text-lg font-bold text-foreground">{formatEur(discountedTotal)}</p>
          <p className="text-xs text-muted line-through">{formatEur(totalEur)}</p>
        </div>
        <div className="rounded-xl border border-border bg-background/60 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">DCN required</p>
          <p className="mt-1 text-lg font-bold text-foreground">
            {priceLoading || requiredDcn === null ? "…" : requiredDcn.toFixed(4)}
          </p>
          <p className="text-xs text-muted">{price !== null ? `@ ${formatEur(price)}/DCN` : ""}</p>
        </div>
      </div>

      <div className="rounded-xl border border-accent/30 bg-accent/5 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-accent">Your D-Coin balance</p>
        {balanceLoading ? (
          <p className="mt-1 text-sm text-muted">Loading…</p>
        ) : balance ? (
          <p className="mt-1 text-sm text-foreground">
            {balance.balance.toFixed(4)} DCN <span className="text-muted">({formatEur(balance.balanceEur)})</span>
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted">No D-Coin wallet found for your Discord account.</p>
        )}
        {hasEnough === false && (
          <p className="mt-2 text-xs text-amber-400">
            Not enough D-Coin — top up with <code className="rounded bg-background/60 px-1">,dcnrecharge [amount]</code> on
            Discord (min €5, paid in LTC, credited automatically).
          </p>
        )}
      </div>

      <div className="rounded-xl border border-border bg-background/60 p-4 text-sm text-muted">
        <p className="font-semibold text-foreground">To complete this purchase:</p>
        <ol className="mt-2 flex list-decimal flex-col gap-1 pl-4">
          <li>Open a ticket on our Discord server.</li>
          <li>Tell staff what you want to buy and that you&apos;re paying with D-Coin.</li>
          <li>Staff confirms the discounted amount and debits your balance.</li>
        </ol>
      </div>

      <a
        href={SITE.discordInvite}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full bg-accent py-3 text-center text-sm font-semibold text-background transition-opacity hover:opacity-90"
      >
        Open Discord
      </a>

      <button
        type="button"
        onClick={onBack}
        className="rounded-full border border-border py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-accent"
      >
        Choose a different payment method
      </button>
    </div>
  );
}
