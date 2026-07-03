"use client";

import { useEffect, useState } from "react";
import { casino, eur, type WalletView, type Withdrawal } from "@/lib/casino/client";
import { useCasinoBalance } from "@/lib/contexts/CasinoBalanceContext";

export default function Withdraw({ wallets }: { wallets: WalletView[] | null }) {
  const { balanceCents, setBalance } = useCasinoBalance();
  const [chain, setChain] = useState("ltc");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [history, setHistory] = useState<Withdrawal[]>([]);

  useEffect(() => {
    if (wallets?.[0]) setChain(wallets[0].chain);
  }, [wallets]);

  useEffect(() => {
    casino.withdrawals().then((r) => setHistory(r.withdrawals)).catch(() => {});
  }, []);

  async function submit() {
    setError(null);
    const amountCents = Math.round(parseFloat(amount) * 100);
    if (!address.trim()) {
      setError("Inserisci un indirizzo di destinazione");
      return;
    }
    if (!Number.isFinite(amountCents) || amountCents < 100) {
      setError("Importo minimo €1.00");
      return;
    }
    if (balanceCents !== null && amountCents > balanceCents) {
      setError("Saldo insufficiente");
      return;
    }
    setBusy(true);
    try {
      const r = await casino.withdraw(chain, address.trim(), amountCents);
      setBalance(r.balanceCents);
      setFlash(`Richiesta registrata: ${r.withdrawal.amountCrypto} ${r.withdrawal.chain.toUpperCase()} → ${eur(r.withdrawal.amountCents)}`);
      setTimeout(() => setFlash(null), 8000);
      setAddress("");
      setAmount("");
      casino.withdrawals().then((res) => setHistory(res.withdrawals)).catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-border bg-background-elevated/40 px-5 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Saldo disponibile</p>
        <p className="text-lg font-bold text-foreground">{balanceCents === null ? "…" : eur(balanceCents)}</p>
      </div>

      {flash && <p className="rounded-xl bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-300">{flash}</p>}

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-background-elevated/40 p-5">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted">Crypto</label>
          <select
            value={chain}
            onChange={(e) => setChain(e.target.value)}
            className="w-full rounded-xl border border-border bg-background/60 px-3 py-3 text-sm text-foreground outline-none"
          >
            {(wallets ?? []).map((w) => (
              <option key={w.chain} value={w.chain}>{w.label} ({w.symbol})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted">Indirizzo di destinazione</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Indirizzo del wallet esterno"
            className="w-full rounded-xl border border-border bg-background/60 px-3 py-3 font-mono text-xs text-foreground outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted">Importo (EUR)</label>
          <div className="flex items-stretch overflow-hidden rounded-xl border border-border bg-background/60">
            <span className="flex items-center pl-4 text-accent">€</span>
            <input
              type="number"
              step="0.10"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-transparent px-3 py-3 text-sm text-foreground outline-none"
            />
            <button
              type="button"
              onClick={() => setAmount(((balanceCents ?? 0) / 100).toFixed(2))}
              className="border-l border-border px-4 text-sm font-semibold text-muted hover:text-foreground"
            >
              Max
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="rounded-full bg-accent py-3 text-sm font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "…" : "Richiedi prelievo"}
        </button>
        <p className="text-[11px] text-muted">
          I prelievi vengono registrati e processati manualmente durante la fase di test.
        </p>
      </div>

      {history.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-foreground">Storico prelievi</h3>
          <div className="flex flex-col gap-2">
            {history.map((w) => (
              <div key={w.id} className="flex items-center justify-between rounded-xl border border-border bg-background-elevated/30 px-4 py-2.5 text-sm">
                <div>
                  <p className="font-medium text-foreground">{eur(w.amountCents)} · {w.amountCrypto} {w.chain.toUpperCase()}</p>
                  <p className="break-all font-mono text-[11px] text-muted">{w.toAddress}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  w.status === "sent" ? "bg-emerald-500/15 text-emerald-400" :
                  w.status === "failed" ? "bg-rose-500/15 text-rose-400" :
                  "bg-amber-500/15 text-amber-400"
                }`}>
                  {w.status === "sent" ? "Inviato" : w.status === "failed" ? "Fallito" : "In attesa"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
