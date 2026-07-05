"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, useAnimationControls } from "framer-motion";
import { casino, eur } from "@/lib/casino/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { useCasinoBalance } from "@/lib/contexts/CasinoBalanceContext";
import BetInput from "./BetInput";

type Side = "heads" | "tails";

export default function CoinFlip() {
  const { user } = useAuth();
  const { balanceCents, setBalance } = useCasinoBalance();

  const [bet, setBet] = useState("1.00");
  const [choice, setChoice] = useState<Side>("heads");
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<{ win: boolean; result: Side; payoutCents: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fairHash, setFairHash] = useState<string | null>(null);

  const controls = useAnimationControls();
  const clientSeed = useRef(Math.random().toString(36).slice(2));

  async function flip() {
    setError(null);
    setResult(null);
    const betCents = Math.round(parseFloat(bet) * 100);
    if (!Number.isFinite(betCents) || betCents < 10) {
      setError("Minimum bet €0.10");
      return;
    }
    if (balanceCents !== null && betCents > balanceCents) {
      setError("Insufficient balance");
      return;
    }

    setFlipping(true);
    // Continuous spin while we wait for the server result.
    controls.start({
      rotateY: [0, 360 * 6],
      transition: { duration: 1.2, ease: "linear", repeat: Infinity },
    });

    try {
      const r = await casino.coinflip(betCents, choice, clientSeed.current);
      // Settle: land on the true face with a smooth decelerating spin.
      const landing = 360 * 8 + (r.result === "heads" ? 0 : 180);
      await controls.start({
        rotateY: landing,
        transition: { duration: 1.1, ease: [0.15, 0.75, 0.2, 1] },
      });
      controls.set({ rotateY: r.result === "heads" ? 0 : 180 });
      setBalance(r.balanceCents);
      setResult({ win: r.win, result: r.result, payoutCents: r.payoutCents });
      setFairHash(`${r.fair.serverSeedHash.slice(0, 16)}… · nonce ${r.fair.nonce}`);
    } catch (e) {
      controls.stop();
      controls.set({ rotateY: 0 });
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setFlipping(false);
    }
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-border bg-background-elevated/40 p-8 text-center">
        <p className="text-sm text-muted">Sign in to play.</p>
        <Link href="/login" className="mt-4 inline-block rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-background">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Coin stage */}
      <div className="relative flex h-72 items-center justify-center overflow-hidden rounded-2xl border border-border bg-[radial-gradient(circle_at_50%_35%,#111a2e,#0a0f1a)]">
        {/* soft glow */}
        <div className="pointer-events-none absolute h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
        <div style={{ perspective: 1000 }}>
          <motion.div
            animate={controls}
            style={{ transformStyle: "preserve-3d", width: 150, height: 150, position: "relative" }}
          >
            <CoinFace side="heads" />
            <CoinFace side="tails" />
          </motion.div>
        </div>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full px-5 py-2 text-sm font-bold ${result.win ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}
          >
            {result.win ? `You won ${eur(result.payoutCents)}!` : "You lost"} · {result.result === "heads" ? "Heads" : "Tails"}
          </motion.div>
        )}
      </div>

      {/* Choice */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setChoice("heads")}
          disabled={flipping}
          className={`flex items-center justify-between rounded-2xl px-5 py-4 text-base font-bold text-white transition-all ${choice === "heads" ? "bg-[#3b82f6] ring-2 ring-white/40" : "bg-[#3b82f6]/70 hover:bg-[#3b82f6]"}`}
        >
          Bet on Heads
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" /></svg>
        </button>
        <button
          type="button"
          onClick={() => setChoice("tails")}
          disabled={flipping}
          className={`flex items-center justify-between rounded-2xl px-5 py-4 text-base font-bold text-white transition-all ${choice === "tails" ? "bg-[#f59e0b] ring-2 ring-white/40" : "bg-[#f59e0b]/70 hover:bg-[#f59e0b]"}`}
        >
          Bet on Tails
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-black text-[#f59e0b]">1</span>
        </button>
      </div>

      <BetInput bet={bet} setBet={setBet} disabled={flipping} />

      {error && <p className="text-sm text-rose-400">{error}</p>}

      <button
        type="button"
        onClick={flip}
        disabled={flipping}
        className="rounded-full bg-accent py-4 text-base font-bold text-background shadow-[0_0_24px_-4px_var(--accent)] transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {flipping ? "Flipping…" : "Flip the coin"}
      </button>

      {fairHash && <p className="text-center text-[11px] text-muted">Provably fair · hash {fairHash}</p>}
    </div>
  );
}

function CoinFace({ side }: { side: Side }) {
  const heads = side === "heads";
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "50%",
        backfaceVisibility: "hidden",
        transform: heads ? undefined : "rotateY(180deg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: heads
          ? "radial-gradient(circle at 50% 38%, #60a5fa, #2563eb)"
          : "radial-gradient(circle at 50% 38%, #fbbf24, #f59e0b)",
        boxShadow: "inset 0 0 0 9px rgba(255,255,255,0.22), 0 16px 44px -10px rgba(0,0,0,0.7)",
      }}
    >
      {heads ? (
        <svg viewBox="0 0 24 24" className="h-16 w-16 text-white" fill="currentColor"><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" /></svg>
      ) : (
        <span className="text-5xl font-black text-white">1</span>
      )}
    </div>
  );
}

