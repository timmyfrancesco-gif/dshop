"use client";

import { useEffect, useRef, useState } from "react";
import { casino, eur } from "@/lib/casino/client";
import { useAuth } from "@/lib/hooks/useAuth";
import BalanceBar from "./BalanceBar";
import Link from "next/link";

type Side = "heads" | "tails";

export default function CoinFlip() {
  const { user } = useAuth();
  const [balanceCents, setBalanceCents] = useState<number | null>(null);
  const [testMode, setTestMode] = useState(true);
  const [faucetLoading, setFaucetLoading] = useState(false);

  const [bet, setBet] = useState("1.00");
  const [choice, setChoice] = useState<Side>("heads");
  const [flipping, setFlipping] = useState(false);
  const [face, setFace] = useState<Side>("heads");
  const [spin, setSpin] = useState(0);
  const [result, setResult] = useState<{ win: boolean; result: Side; payoutCents: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastFair, setLastFair] = useState<string | null>(null);

  const clientSeed = useRef(Math.random().toString(36).slice(2));

  useEffect(() => {
    if (!user) return;
    casino
      .getBalance()
      .then((b) => {
        setBalanceCents(b.balanceCents);
        setTestMode(b.testMode);
      })
      .catch(() => {});
  }, [user]);

  async function faucet() {
    setFaucetLoading(true);
    try {
      const r = await casino.faucet();
      setBalanceCents(r.balanceCents);
    } catch {
      /* capped or disabled */
    } finally {
      setFaucetLoading(false);
    }
  }

  async function flip() {
    setError(null);
    setResult(null);
    const betCents = Math.round(parseFloat(bet) * 100);
    if (!Number.isFinite(betCents) || betCents < 10) {
      setError("Puntata minima €0.10");
      return;
    }
    if (balanceCents !== null && betCents > balanceCents) {
      setError("Saldo insufficiente");
      return;
    }
    setFlipping(true);
    // Kick off the spin animation immediately for feedback.
    setSpin((s) => s + 1800 + Math.floor(Math.random() * 360));

    try {
      const r = await casino.coinflip(betCents, choice, clientSeed.current);
      // Land the coin on the real result after the spin.
      window.setTimeout(() => {
        setFace(r.result);
        // Align rotation so the shown face matches the result.
        setSpin((s) => {
          const base = Math.ceil(s / 360) * 360;
          return base + (r.result === "heads" ? 0 : 180);
        });
      }, 1500);
      window.setTimeout(() => {
        setBalanceCents(r.balanceCents);
        setResult({ win: r.win, result: r.result, payoutCents: r.payoutCents });
        setLastFair(`${r.fair.serverSeedHash.slice(0, 16)}… · nonce ${r.fair.nonce}`);
        setFlipping(false);
      }, 1900);
    } catch (e) {
      setSpin((s) => Math.ceil(s / 360) * 360);
      setError(e instanceof Error ? e.message : "Errore");
      setFlipping(false);
    }
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-border bg-background-elevated/40 p-8 text-center">
        <p className="text-sm text-muted">Accedi per giocare.</p>
        <Link
          href="/login"
          className="mt-4 inline-block rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-background"
        >
          Accedi
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <BalanceBar
        balanceCents={balanceCents}
        testMode={testMode}
        onFaucet={faucet}
        faucetLoading={faucetLoading}
      />

      {/* Coin stage */}
      <div className="relative flex h-72 items-center justify-center overflow-hidden rounded-2xl border border-border bg-background-elevated/30">
        <div className="coin-scene">
          <div
            className="coin"
            style={{ transform: `rotateY(${spin}deg)`, transition: flipping ? "transform 1.5s cubic-bezier(0.2,0.7,0.2,1)" : "none" }}
          >
            {/* Heads (blue sparkle) */}
            <div className="coin-face coin-heads">
              <svg viewBox="0 0 24 24" className="h-16 w-16 text-white" fill="currentColor">
                <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" />
              </svg>
            </div>
            {/* Tails (amber) */}
            <div className="coin-face coin-tails">
              <span className="text-4xl font-black text-white">1</span>
            </div>
          </div>
        </div>

        {result && (
          <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full px-5 py-2 text-sm font-bold ${result.win ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
            {result.win ? `Hai vinto ${eur(result.payoutCents)}!` : "Hai perso"} · uscì {result.result === "heads" ? "Testa" : "Croce"}
          </div>
        )}
      </div>

      {/* Choice buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setChoice("heads")}
          disabled={flipping}
          className={`flex items-center justify-between rounded-2xl px-5 py-4 text-base font-bold transition-all ${
            choice === "heads"
              ? "bg-[#3b82f6] text-white ring-2 ring-white/30"
              : "bg-[#3b82f6]/80 text-white/90 hover:bg-[#3b82f6]"
          }`}
        >
          Punta su Testa
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" /></svg>
        </button>
        <button
          type="button"
          onClick={() => setChoice("tails")}
          disabled={flipping}
          className={`flex items-center justify-between rounded-2xl px-5 py-4 text-base font-bold transition-all ${
            choice === "tails"
              ? "bg-[#f59e0b] text-white ring-2 ring-white/30"
              : "bg-[#f59e0b]/80 text-white/90 hover:bg-[#f59e0b]"
          }`}
        >
          Punta su Croce
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-black text-[#f59e0b]">1</span>
        </button>
      </div>

      {/* Bet input */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted">Importo della scommessa</span>
        </div>
        <div className="flex items-stretch overflow-hidden rounded-xl border border-border bg-background/60">
          <span className="flex items-center pl-4 text-accent">€</span>
          <input
            type="number"
            step="0.10"
            min="0.10"
            value={bet}
            onChange={(e) => setBet(e.target.value)}
            className="w-full bg-transparent px-3 py-3 text-sm text-foreground outline-none"
          />
          <button type="button" onClick={() => setBet((b) => (parseFloat(b) / 2 || 0).toFixed(2))} className="border-l border-border px-4 text-sm font-semibold text-muted hover:text-foreground">½</button>
          <button type="button" onClick={() => setBet((b) => (parseFloat(b) * 2 || 0).toFixed(2))} className="border-l border-border px-4 text-sm font-semibold text-muted hover:text-foreground">2x</button>
        </div>
      </div>

      {error && <p className="text-sm text-rose-400">{error}</p>}

      <button
        type="button"
        onClick={flip}
        disabled={flipping}
        className="rounded-full bg-accent py-4 text-base font-bold text-background shadow-[0_0_24px_-4px_var(--accent)] transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {flipping ? "Lancio…" : "Lancia la moneta"}
      </button>

      {lastFair && (
        <p className="text-center text-[11px] text-muted">Provably fair · hash {lastFair}</p>
      )}

      <style jsx>{`
        .coin-scene {
          perspective: 1000px;
          width: 140px;
          height: 140px;
        }
        .coin {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
        }
        .coin-face {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          backface-visibility: hidden;
          box-shadow: inset 0 0 0 8px rgba(255, 255, 255, 0.25), 0 12px 40px -8px rgba(0, 0, 0, 0.6);
        }
        .coin-heads {
          background: radial-gradient(circle at 50% 40%, #60a5fa, #2563eb);
        }
        .coin-tails {
          background: radial-gradient(circle at 50% 40%, #fbbf24, #f59e0b);
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}
