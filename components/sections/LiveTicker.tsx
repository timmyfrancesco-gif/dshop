"use client";

import { useTickerPrices } from "@/lib/hooks/useTickerPrices";
import { formatEur } from "@/lib/format";
import type { CoinPrice } from "@/lib/types";

function TickerItem({ coin }: { coin: CoinPrice }) {
  const isUp = (coin.changePct ?? 0) >= 0;

  return (
    <div className="flex shrink-0 items-center gap-3 px-6 py-3">
      <span className="text-sm font-bold tracking-wide text-foreground">
        {coin.symbol}
      </span>
      <span className="text-sm text-muted">{coin.name}</span>
      <span className="text-sm font-semibold text-foreground">
        {coin.eur !== null ? formatEur(coin.eur) : "—"}
      </span>
      {coin.changePct !== null ? (
        <span
          className={`text-xs font-semibold ${
            isUp ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {isUp ? "▲" : "▼"} {Math.abs(coin.changePct).toFixed(2)}%
        </span>
      ) : (
        <span className="text-xs font-semibold text-muted">—</span>
      )}
    </div>
  );
}

export default function LiveTicker() {
  const { prices } = useTickerPrices();
  const loop = [...prices, ...prices];

  return (
    <div className="relative w-full overflow-hidden border-y border-border/60 bg-background-elevated/40 py-1">
      <div className="absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />
      <div className="flex w-max animate-marquee divide-x divide-border/60">
        {loop.map((coin, i) => (
          <TickerItem key={`${coin.symbol}-${i}`} coin={coin} />
        ))}
      </div>
    </div>
  );
}
