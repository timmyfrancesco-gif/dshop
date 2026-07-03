"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { casino, eur, type WalletView } from "@/lib/casino/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { useCasinoBalance } from "@/lib/contexts/CasinoBalanceContext";

const CHAIN_COLORS: Record<string, string> = {
  btc: "#f7931a",
  ltc: "#345d9d",
  eth: "#627eea",
  doge: "#c2a633",
  dash: "#008ce7",
};

export default function DepositWallet({ wallets }: { wallets: WalletView[] | null }) {
  const { user } = useAuth();
  const { balanceCents, setBalance } = useCasinoBalance();
  const [selected, setSelected] = useState<string>("ltc");
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (wallets?.[0]) setSelected(wallets[0].chain);
  }, [wallets]);

  const current = wallets?.find((w) => w.chain === selected) ?? null;

  useEffect(() => {
    if (!current) return;
    QRCode.toDataURL(current.address, { width: 220, margin: 1 })
      .then(setQr)
      .catch(() => setQr(null));
  }, [current]);

  const check = useCallback(async () => {
    setChecking(true);
    setError(null);
    try {
      const r = await casino.checkDeposits();
      setBalance(r.balanceCents);
      if (r.credited.length > 0) {
        const total = r.credited.reduce((s, c) => s + c.eurCents, 0);
        setFlash(`Depositi accreditati: +${eur(total)}`);
        setTimeout(() => setFlash(null), 6000);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore");
    } finally {
      setChecking(false);
    }
  }, [setBalance]);

  // Poll for deposits while the page is open (fallback to the webhook push).
  const checkRef = useRef(check);
  checkRef.current = check;
  useEffect(() => {
    if (!user) return;
    const id = setInterval(() => checkRef.current(), 30000);
    return () => clearInterval(id);
  }, [user]);

  if (!user) {
    return (
      <div className="rounded-2xl border border-border bg-background-elevated/40 p-8 text-center">
        <p className="text-sm text-muted">Accedi per depositare.</p>
        <Link href="/login" className="mt-4 inline-block rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-background">Accedi</Link>
      </div>
    );
  }

  async function copy() {
    if (!current) return;
    try {
      await navigator.clipboard.writeText(current.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between rounded-2xl border border-border bg-background-elevated/40 px-5 py-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Saldo</p>
          <p className="text-lg font-bold text-foreground">{balanceCents === null ? "…" : eur(balanceCents)}</p>
        </div>
        <button
          type="button"
          onClick={check}
          disabled={checking}
          className="rounded-full border border-accent/40 bg-accent-soft px-4 py-2 text-xs font-bold text-accent transition-colors hover:bg-accent hover:text-background disabled:opacity-50"
        >
          {checking ? "Controllo…" : "Controlla depositi"}
        </button>
      </div>

      {flash && <p className="rounded-xl bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-300">{flash}</p>}

      {/* Chain selector */}
      <div className="flex flex-wrap gap-2">
        {(wallets ?? []).map((w) => (
          <button
            key={w.chain}
            type="button"
            onClick={() => setSelected(w.chain)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              selected === w.chain ? "border-accent bg-accent-soft text-accent" : "border-border bg-background/60 text-muted hover:border-accent/40"
            }`}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHAIN_COLORS[w.chain] ?? "#888" }} />
            {w.symbol}
          </button>
        ))}
        {!wallets && <p className="text-sm text-muted">Generazione indirizzi…</p>}
      </div>

      {current && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-background-elevated/40 p-6">
          {qr && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="Deposit QR" className="rounded-xl bg-white p-2" />
          )}
          <div className="w-full">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">
              Il tuo indirizzo {current.label}
            </p>
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2">
              <span className="flex-1 break-all font-mono text-xs text-foreground">{current.address}</span>
              <button type="button" onClick={copy} className="shrink-0 text-xs font-semibold text-accent hover:opacity-80">
                {copied ? "Copiato" : "Copia"}
              </button>
            </div>
          </div>
          <p className="text-center text-[11px] text-muted">
            Invia solo {current.symbol} a questo indirizzo. Il saldo si aggiorna in automatico dopo la
            conferma sulla blockchain (o premi &ldquo;Controlla depositi&rdquo;).
          </p>
        </div>
      )}

      {error && <p className="text-sm text-rose-400">{error}</p>}
    </div>
  );
}
