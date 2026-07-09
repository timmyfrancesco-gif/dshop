"use client";

import { useDcnPrice } from "@/lib/hooks/useDcnPrice";
import { formatEur } from "@/lib/format";
import Sparkline from "@/components/ui/Sparkline";

/**
 * Live D-Coin (DCN) price card — a bot-managed internal currency pegged to
 * LTC/EUR with a platform margin (70% up / 130% down moves), recalculated
 * bot-side every 5s. Purely informational; balances/purchases are handled
 * elsewhere (checkout D-Coin panel, Discord commands).
 */
export default function DcnWidget() {
  const { price, changePct, history, loading } = useDcnPrice();
  const isUp = (changePct ?? 0) >= 0;

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-background-elevated/40 p-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">D-Coin · DCN</p>
        <p className="mt-1 text-2xl font-bold text-foreground">
          {loading || price === null ? "…" : formatEur(price)}
        </p>
        {changePct !== null && (
          <span className={`text-xs font-semibold ${isUp ? "text-emerald-400" : "text-rose-400"}`}>
            {isUp ? "▲" : "▼"} {Math.abs(changePct).toFixed(2)}%
          </span>
        )}
      </div>
      <Sparkline values={history.map((p) => p.price)} positive={isUp} width={140} height={44} />
    </div>
  );
}
