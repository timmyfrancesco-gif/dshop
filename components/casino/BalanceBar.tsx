"use client";

import { eur } from "@/lib/casino/client";

export default function BalanceBar({
  balanceCents,
  testMode,
  onFaucet,
  faucetLoading,
}: {
  balanceCents: number | null;
  testMode: boolean;
  onFaucet: () => void;
  faucetLoading: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-background-elevated/40 px-5 py-3">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h4m-9 4h20a1 1 0 001-1V6a1 1 0 00-1-1H2a1 1 0 00-1 1v12a1 1 0 001 1z" />
          </svg>
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Saldo</p>
          <p className="text-lg font-bold text-foreground">
            {balanceCents === null ? "…" : eur(balanceCents)}
          </p>
        </div>
      </div>
      {testMode && (
        <button
          type="button"
          onClick={onFaucet}
          disabled={faucetLoading}
          className="rounded-full border border-accent/40 bg-accent-soft px-4 py-2 text-xs font-bold text-accent transition-colors hover:bg-accent hover:text-background disabled:opacity-50"
        >
          {faucetLoading ? "…" : "+ €100 test"}
        </button>
      )}
    </div>
  );
}
