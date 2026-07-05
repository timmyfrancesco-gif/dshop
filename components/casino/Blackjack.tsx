"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { casino, eur, type BlackjackView } from "@/lib/casino/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { useCasinoBalance } from "@/lib/contexts/CasinoBalanceContext";
import PlayingCard from "./PlayingCard";
import BetInput from "./BetInput";

export default function Blackjack() {
  const { user } = useAuth();
  const { balanceCents, setBalance } = useCasinoBalance();

  const [bet, setBet] = useState("1.00");
  const [game, setGame] = useState<BlackjackView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientSeed = useRef(Math.random().toString(36).slice(2));

  useEffect(() => {
    if (!user) return;
    casino
      .bjState()
      .then((s) => {
        if (s.state) setGame(s.state);
      })
      .catch(() => {});
  }, [user]);

  async function start() {
    setError(null);
    const betCents = Math.round(parseFloat(bet) * 100);
    if (!Number.isFinite(betCents) || betCents < 10) {
      setError("Minimum bet €0.10");
      return;
    }
    if (balanceCents !== null && betCents > balanceCents) {
      setError("Insufficient balance");
      return;
    }
    setBusy(true);
    try {
      const r = await casino.bjStart(betCents, clientSeed.current);
      setGame(r.state);
      setBalance(r.balanceCents);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function act(action: "hit" | "stand" | "double" | "split") {
    setBusy(true);
    setError(null);
    try {
      const r = await casino.bjAction(action);
      setGame(r.state);
      setBalance(r.balanceCents);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  function newRound() {
    setGame(null);
    setError(null);
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-border bg-background-elevated/40 p-8 text-center">
        <p className="text-sm text-muted">Sign in to play.</p>
        <Link href="/login" className="mt-4 inline-block rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-background">
          Sign in
        </Link>
      </div>
    );
  }

  const inHand = game && !game.finished;

  return (
    <div className="flex flex-col gap-5">
      {/* Table */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-[radial-gradient(circle_at_50%_0%,#12324a,#0a1622)] p-5">
        <div className="mb-4 flex flex-col items-center gap-1">
          <span className="rounded-sm bg-black/30 px-3 py-0.5 text-[10px] font-bold tracking-widest text-zinc-400">BLACKJACK PAYS 3 TO 2</span>
          <span className="rounded-sm bg-black/30 px-3 py-0.5 text-[10px] font-bold tracking-widest text-zinc-500">INSURANCE PAYS 2 TO 1</span>
        </div>

        {/* Dealer */}
        <div className="mb-6 flex flex-col items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
            Dealer {game ? `· ${game.dealerValue}` : ""}
          </span>
          <div className="flex gap-2">
            {game ? (
              game.dealer.map((c, i) => (
                <PlayingCard key={i} rank={c.rank} suit={c.suit} index={i} hidden={c.rank === "?"} />
              ))
            ) : (
              <EmptyCards />
            )}
          </div>
        </div>

        {/* Player hands */}
        <div className="flex flex-wrap items-start justify-center gap-6">
          {game ? (
            game.hands.map((h, hi) => (
              <div key={hi} className="flex flex-col items-center gap-2">
                <div className="flex gap-2">
                  {h.cards.map((c, i) => (
                    <PlayingCard key={i} rank={c.rank} suit={c.suit} index={i} />
                  ))}
                </div>
                <span className={`text-[11px] font-semibold uppercase tracking-widest ${game.active === hi && !game.finished ? "text-accent" : "text-zinc-400"}`}>
                  {h.value}
                  {h.outcome && (
                    <span className={`ml-2 ${h.outcome === "lose" ? "text-rose-400" : h.outcome === "push" ? "text-zinc-400" : "text-emerald-400"}`}>
                      {h.outcome === "blackjack" ? "BLACKJACK" : h.outcome === "win" ? "WON" : h.outcome === "push" ? "PUSH" : "LOST"}
                    </span>
                  )}
                </span>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-2"><EmptyCards /></div>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">You</span>
            </div>
          )}
        </div>

        {game?.finished && (
          <div className="mt-5 text-center">
            <p className={`text-lg font-bold ${game.payoutCents > 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {game.payoutCents > 0 ? `You win ${eur(game.payoutCents)}` : "No win"}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      {inHand ? (
        <div className="grid grid-cols-2 gap-3">
          <ActionBtn label="Hit" onClick={() => act("hit")} disabled={busy} color="#22c55e" />
          <ActionBtn label="Stand" onClick={() => act("stand")} disabled={busy} color="#ef4444" />
          <ActionBtn label="Split" onClick={() => act("split")} disabled={busy || !game!.canSplit} color="#3b82f6" />
          <ActionBtn label="Double" onClick={() => act("double")} disabled={busy || !game!.canDouble} color="#f59e0b" />
        </div>
      ) : (
        <>
          <BetInput bet={bet} setBet={setBet} disabled={busy} />
          <button
            type="button"
            onClick={game?.finished ? newRound : start}
            disabled={busy}
            className="rounded-full bg-accent py-4 text-base font-bold text-background shadow-[0_0_24px_-4px_var(--accent)] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "…" : game?.finished ? "New hand" : "Bet"}
          </button>
        </>
      )}

      {error && <p className="text-sm text-rose-400">{error}</p>}
      {game && (
        <p className="text-center text-[11px] text-muted">
          Provably fair · hash {game.serverSeedHash.slice(0, 16)}…{game.serverSeed ? " · seed revealed" : ""}
        </p>
      )}
    </div>
  );
}

function ActionBtn({ label, onClick, disabled, color }: { label: string; onClick: () => void; disabled: boolean; color: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-between rounded-2xl border border-border bg-background-elevated/60 px-5 py-4 text-base font-semibold text-foreground transition-all hover:border-accent/40 disabled:opacity-40"
    >
      {label}
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
    </button>
  );
}

function EmptyCards() {
  return (
    <>
      <div className="h-[92px] w-[64px] rounded-lg border border-dashed border-white/10" />
      <div className="h-[92px] w-[64px] rounded-lg border border-dashed border-white/10" />
    </>
  );
}
