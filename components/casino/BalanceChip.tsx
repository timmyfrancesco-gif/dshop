"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useCasinoBalance } from "@/lib/contexts/CasinoBalanceContext";
import { useAuth } from "@/lib/hooks/useAuth";
import { eur } from "@/lib/casino/client";

/**
 * Global balance pill shown in the header when logged in (like the balance
 * widget on shuffle.com). Fetched once via CasinoBalanceProvider; games update
 * it locally, so it stays live without polling.
 */
export default function BalanceChip({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const { balanceCents, testMode, faucet } = useCasinoBalance();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!user) return null;

  async function topUp() {
    setLoading(true);
    await faucet();
    setLoading(false);
  }

  return (
    <div ref={ref} className={`relative ${compact ? "w-full" : ""}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 rounded-full border border-border bg-background-elevated/60 px-3 py-1.5 text-sm font-semibold text-foreground transition-colors hover:border-accent ${compact ? "w-full justify-center" : ""}`}
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/20 text-accent">
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor"><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" /></svg>
        </span>
        {balanceCents === null ? "…" : eur(balanceCents)}
        <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 text-muted transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
      </button>

      {open && (
        <div className={`absolute z-50 mt-2 w-56 rounded-xl border border-border bg-background shadow-xl ${compact ? "left-1/2 -translate-x-1/2" : "right-0"}`}>
          <div className="border-b border-border px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Casino balance</p>
            <p className="text-xl font-bold text-foreground">{balanceCents === null ? "…" : eur(balanceCents)}</p>
          </div>
          <div className="flex flex-col p-1.5">
            <Link
              href="/casino/wallet"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-accent transition-colors hover:bg-background-elevated"
            >
              Deposit
            </Link>
            {testMode && (
              <button
                type="button"
                onClick={topUp}
                disabled={loading}
                className="rounded-lg px-3 py-2 text-left text-sm text-muted transition-colors hover:bg-background-elevated disabled:opacity-50"
              >
                {loading ? "…" : "+ €100 (test)"}
              </button>
            )}
            <Link
              href="/casino"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-background-elevated"
            >
              Go to Casino
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
