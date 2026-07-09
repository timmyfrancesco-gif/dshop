"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createDcnRecharge, getDcnRechargeStatus } from "@/lib/api";
import { formatEur } from "@/lib/format";
import { useQrCode } from "@/lib/hooks/useQrCode";
import type { DcnRechargeResponse } from "@/lib/types";

const POLL_INTERVAL_MS = 12000;
const MIN_EUR = 5;

/* Inline copy button */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="shrink-0 text-xs font-semibold text-accent transition-opacity hover:opacity-80"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function DcnRecharge({ discordId }: { discordId?: string }) {
  const [amount, setAmount] = useState("10");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recharge, setRecharge] = useState<DcnRechargeResponse | null>(null);
  const [status, setStatus] = useState<"pending" | "crediting" | "paid" | "expired">("pending");
  const [result, setResult] = useState<{ creditedDcn?: number; balance?: number }>({});

  const qrCode = useQrCode(recharge ? `litecoin:${recharge.address}?amount=${recharge.amountLtc}` : null);

  const statusRef = useRef(status);
  statusRef.current = status;

  useEffect(() => {
    if (!recharge) return;
    if (status === "paid" || status === "expired") return;
    let cancelled = false;
    const interval = setInterval(async () => {
      const res = await getDcnRechargeStatus(recharge.rechargeId);
      if (cancelled || !res) return;
      setStatus(res.status);
      if (res.status === "paid") {
        setResult({ creditedDcn: res.creditedDcn, balance: res.balance });
        clearInterval(interval);
      } else if (res.status === "expired") {
        clearInterval(interval);
      }
    }, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [recharge, status]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const amountEur = Number(amount);
    if (!Number.isFinite(amountEur) || amountEur < MIN_EUR) {
      setError(`Minimum recharge is ${formatEur(MIN_EUR)}.`);
      return;
    }
    if (!discordId) return;
    setLoading(true);
    const res = await createDcnRecharge(discordId, amountEur);
    setLoading(false);
    if (!res) {
      setError("Could not start the recharge. Try again shortly.");
      return;
    }
    setRecharge(res);
    setStatus("pending");
  }

  function reset() {
    setRecharge(null);
    setStatus("pending");
    setResult({});
    setError(null);
  }

  if (!discordId) {
    return (
      <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-accent">Buy D-Coin</p>
        <p className="mt-2 text-sm text-muted">Sign in with Discord to recharge your D-Coin balance.</p>
        <Link
          href="/login"
          className="mt-3 inline-block rounded-full bg-accent px-5 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (status === "paid") {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-400">Recharge complete</p>
        <p className="mt-2 text-2xl font-bold text-foreground">
          +{result.creditedDcn?.toFixed(4) ?? "…"} DCN
        </p>
        {result.balance !== undefined && (
          <p className="mt-1 text-sm text-muted">New balance: {result.balance.toFixed(4)} DCN</p>
        )}
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-full border border-border px-5 py-2 text-sm font-semibold text-foreground transition-colors hover:border-accent"
        >
          Recharge again
        </button>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-rose-400">Recharge expired</p>
        <p className="mt-2 text-sm text-muted">No payment was received in time. You can start a new one.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          Try again
        </button>
      </div>
    );
  }

  if (recharge) {
    return (
      <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-accent">
          {status === "crediting" ? "Confirming payment…" : "Send payment"}
        </p>

        <div className="mt-4 flex justify-center">
          {qrCode ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrCode} alt="Payment address QR code" className="h-48 w-48 rounded-xl border border-border" />
          ) : (
            <div className="flex h-48 w-48 items-center justify-center rounded-xl border border-border text-xs text-muted">
              Generating QR…
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2">
          <span className="flex-1 break-all font-mono text-xs text-foreground">{recharge.address}</span>
          <CopyButton text={recharge.address} />
        </div>

        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-muted">Amount</span>
          <span className="flex items-center gap-2 font-mono text-foreground">
            {recharge.amountLtc} LTC
            <CopyButton text={String(recharge.amountLtc)} />
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between text-sm">
          <span className="text-muted">≈</span>
          <span className="text-foreground">{formatEur(recharge.amountEur)}</span>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted">
          <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
          {status === "crediting" ? "Payment seen — crediting your balance…" : "Waiting for payment…"}
        </div>

        <button
          type="button"
          onClick={reset}
          className="mt-4 w-full rounded-full border border-border py-2 text-xs font-semibold text-muted transition-colors hover:border-accent hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-accent/30 bg-accent/5 p-6">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-accent">Buy D-Coin</p>
      <p className="mt-2 text-sm text-muted">Recharge your balance by paying in LTC — minimum {formatEur(MIN_EUR)}.</p>

      <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2">
        <span className="text-sm text-muted">€</span>
        <input
          type="number"
          min={MIN_EUR}
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full bg-transparent text-sm text-foreground outline-none"
        />
      </div>

      {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-3 w-full rounded-full bg-accent py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Generating address…" : "Get payment address"}
      </button>
    </form>
  );
}
