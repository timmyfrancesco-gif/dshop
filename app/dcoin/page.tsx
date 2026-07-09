"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import Sparkline from "@/components/ui/Sparkline";
import DcnRecharge from "@/components/shop/DcnRecharge";
import { getDcnBalance } from "@/lib/api";
import { formatEur, formatRelativeTime } from "@/lib/format";
import { useAuth } from "@/lib/hooks/useAuth";
import { useDcnPrice } from "@/lib/hooks/useDcnPrice";
import { SITE } from "@/lib/config";
import type { DcnBalanceResponse } from "@/lib/types";

const RANGES = [
  { label: "1h", limit: 60 },
  { label: "4h", limit: 240 },
  { label: "24h", limit: 1440 },
];

export default function DcoinPage() {
  return (
    <PageShell>
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <DcoinContent />
        </div>
      </section>
    </PageShell>
  );
}

function DcoinContent() {
  const { user } = useAuth();
  const [rangeLimit, setRangeLimit] = useState(240);
  const { price, changePct, history, updatedAt, loading } = useDcnPrice(rangeLimit);
  const isUp = (changePct ?? 0) >= 0;

  const [balance, setBalance] = useState<DcnBalanceResponse | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceChecked, setBalanceChecked] = useState(false);

  useEffect(() => {
    if (!user?.discordId) return;
    let cancelled = false;
    setBalanceLoading(true);
    getDcnBalance(user.discordId).then((res) => {
      if (cancelled) return;
      setBalance(res);
      setBalanceLoading(false);
      setBalanceChecked(true);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.discordId]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">D-Coin · DCN</h1>
        <p className="mt-1 text-sm text-muted">
          Our internal platform currency, with a live price that updates every few seconds. Pay with
          D-Coin anywhere on the site for a 10% discount.
        </p>
      </div>

      {/* Price hero */}
      <div className="rounded-2xl border border-border bg-background-elevated/40 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Live price</p>
            <p className="mt-1 text-4xl font-bold text-foreground">
              {loading || price === null ? "…" : formatEur(price)}
            </p>
            <div className="mt-2 flex items-center gap-2">
              {changePct !== null && (
                <span className={`text-sm font-semibold ${isUp ? "text-emerald-400" : "text-rose-400"}`}>
                  {isUp ? "▲" : "▼"} {Math.abs(changePct).toFixed(2)}%
                </span>
              )}
              {updatedAt !== null && (
                <span className="text-xs text-muted">Updated {formatRelativeTime(updatedAt)}</span>
              )}
            </div>
          </div>

          <div className="flex gap-1.5">
            {RANGES.map((r) => (
              <button
                key={r.label}
                type="button"
                onClick={() => setRangeLimit(r.limit)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  rangeLimit === r.limit
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-border bg-background/60 text-muted hover:border-accent/40"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <Sparkline values={history.map((p) => p.price)} positive={isUp} width={1000} height={140} className="h-[140px] w-full" />
        </div>
      </div>

      {/* Balance */}
      <div className="rounded-2xl border border-border bg-background-elevated/40 p-6">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Your D-Coin balance</p>
        {!user?.discordId ? (
          <div className="mt-3 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">Sign in with Discord to see your balance.</p>
            <Link
              href="/login"
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              Sign in
            </Link>
          </div>
        ) : balanceLoading ? (
          <p className="mt-2 text-sm text-muted">Loading…</p>
        ) : balance ? (
          <div className="mt-2 flex flex-col gap-1">
            <p className="text-2xl font-bold text-foreground">
              {balance.balance.toFixed(4)} <span className="text-base font-semibold text-muted">DCN</span>
            </p>
            <p className="text-sm text-muted">≈ {formatEur(balance.balanceEur)}</p>
            <p className="mt-1 break-all font-mono text-xs text-muted">{balance.address}</p>
          </div>
        ) : balanceChecked ? (
          <p className="mt-2 text-sm text-muted">
            No D-Coin wallet found for your Discord account yet — it&apos;s created automatically the
            first time you recharge.
          </p>
        ) : null}
      </div>

      {/* Buy / recharge */}
      <DcnRecharge discordId={user?.discordId} />

      {/* How it works */}
      <div className="rounded-2xl border border-border bg-background-elevated/40 p-6">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">How it works</p>
        <ul className="mt-3 flex flex-col gap-2 text-sm text-muted">
          <li>
            <span className="text-foreground">Recharge:</span> pay in LTC right here — minimum €5,
            credited to your D-Coin balance automatically. Also works via{" "}
            <code className="rounded bg-background/60 px-1.5 py-0.5 text-xs">,dcnrecharge [amount]</code> on
            Discord.
          </li>
          <li>
            <span className="text-foreground">Spend:</span> pay with D-Coin at checkout for 10% off any
            order.
          </li>
          <li>
            <span className="text-foreground">Price:</span> set by the platform and recalculated every 5
            seconds.
          </li>
          <li>
            <span className="text-foreground">Completing a D-Coin purchase</span> is currently handled by
            staff in a Discord ticket, not automatically on the site.
          </li>
        </ul>
      </div>

      <a
        href={SITE.discordInvite}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full bg-accent py-3 text-center text-sm font-semibold text-background transition-opacity hover:opacity-90"
      >
        Open Discord
      </a>
    </div>
  );
}
