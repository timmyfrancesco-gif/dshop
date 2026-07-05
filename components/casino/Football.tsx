"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { casino, eur, type FootballMatch, type FootballBet } from "@/lib/casino/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { useCasinoBalance } from "@/lib/contexts/CasinoBalanceContext";

type Sel = "home" | "draw" | "away";
type Odds = { home: number; draw: number; away: number };

export default function Football() {
  const { user } = useAuth();
  const { setBalance } = useCasinoBalance();
  const [matches, setMatches] = useState<FootballMatch[] | null>(null);
  const [configured, setConfigured] = useState(true);
  const [bets, setBets] = useState<FootballBet[]>([]);
  const [query, setQuery] = useState("");

  // Per-fixture odds loaded on demand.
  const [odds, setOdds] = useState<Record<number, Odds | null>>({});
  const [loadingOdds, setLoadingOdds] = useState<number | null>(null);
  const [openFixture, setOpenFixture] = useState<number | null>(null);

  const [slip, setSlip] = useState<{ match: FootballMatch; sel: Sel; odd: number } | null>(null);
  const [stake, setStake] = useState("1.00");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    casino
      .footballMatches()
      .then((r) => {
        setMatches(r.matches);
        setConfigured(r.configured);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error"));
    casino.footballMyBets().then((r) => setBets(r.bets)).catch(() => {});
  }, [user]);

  async function toggleMatch(m: FootballMatch) {
    setError(null);
    if (openFixture === m.fixtureId) {
      setOpenFixture(null);
      return;
    }
    setOpenFixture(m.fixtureId);
    if (odds[m.fixtureId] === undefined) {
      setLoadingOdds(m.fixtureId);
      try {
        const r = await casino.footballOdds(m.fixtureId);
        setOdds((o) => ({ ...o, [m.fixtureId]: r.odds }));
      } catch {
        setOdds((o) => ({ ...o, [m.fixtureId]: null }));
      } finally {
        setLoadingOdds(null);
      }
    }
  }

  async function placeBet() {
    if (!slip) return;
    setError(null);
    const stakeCents = Math.round(parseFloat(stake) * 100);
    if (!Number.isFinite(stakeCents) || stakeCents < 10) {
      setError("Minimum bet €0.10");
      return;
    }
    setBusy(true);
    try {
      const r = await casino.footballBet(slip.match.fixtureId, slip.sel, stakeCents);
      setBalance(r.balanceCents);
      setFlash(`Bet placed · potential win ${eur(r.bet.potentialCents)}`);
      setTimeout(() => setFlash(null), 6000);
      setSlip(null);
      casino.footballMyBets().then((res) => setBets(res.bets)).catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  // Group matches by competition for an "all competitions" view.
  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = (matches ?? []).filter(
      (m) => !q || m.home.toLowerCase().includes(q) || m.away.toLowerCase().includes(q) || m.league.toLowerCase().includes(q)
    );
    const map = new Map<string, FootballMatch[]>();
    for (const m of filtered) {
      const arr = map.get(m.league) ?? [];
      arr.push(m);
      map.set(m.league, arr);
    }
    return [...map.entries()];
  }, [matches, query]);

  if (!user) {
    return (
      <div className="rounded-2xl border border-border bg-background-elevated/40 p-8 text-center">
        <p className="text-sm text-muted">Sign in to bet.</p>
        <Link href="/login" className="mt-4 inline-block rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-background">Sign in</Link>
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-sm text-muted">
        Football betting is not configured yet (missing the API-Football key).
      </div>
    );
  }

  const selLabel = (m: FootballMatch, s: Sel) => (s === "home" ? m.home : s === "away" ? m.away : "Draw");

  return (
    <div className="flex flex-col gap-5">
      {flash && <p className="rounded-xl bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-300">{flash}</p>}
      {error && <p className="text-sm text-rose-400">{error}</p>}

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search team or competition…"
        className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted"
      />

      {matches === null ? (
        <p className="text-sm text-muted">Loading matches…</p>
      ) : grouped.length === 0 ? (
        <p className="text-sm text-muted">No matches found.</p>
      ) : (
        grouped.map(([league, ms]) => (
          <div key={league} className="flex flex-col gap-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted">{league}</h3>
            {ms.map((m) => {
              const o = odds[m.fixtureId];
              const isOpen = openFixture === m.fixtureId;
              return (
                <div key={m.fixtureId} className="rounded-2xl border border-border bg-background-elevated/40 p-4">
                  <button type="button" onClick={() => toggleMatch(m)} className="w-full text-left">
                    <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
                      <span>{m.kickoff ? new Date(m.kickoff).toLocaleString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}</span>
                      <span>{isOpen ? "▲" : "▼"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-foreground">{m.home}</span>
                      <span className="px-2 text-xs text-muted">vs</span>
                      <span className="text-sm font-bold text-foreground">{m.away}</span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="mt-3">
                      {loadingOdds === m.fixtureId ? (
                        <p className="text-center text-xs text-muted">Loading odds…</p>
                      ) : o ? (
                        <div className="grid grid-cols-3 gap-2">
                          {(["home", "draw", "away"] as Sel[]).map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => { setSlip({ match: m, sel: s, odd: o[s] }); setError(null); }}
                              className={`flex flex-col items-center rounded-xl border px-2 py-2 transition-colors ${
                                slip?.match.fixtureId === m.fixtureId && slip.sel === s
                                  ? "border-accent bg-accent-soft"
                                  : "border-border bg-background/60 hover:border-accent/40"
                              }`}
                            >
                              <span className="text-[10px] uppercase tracking-wide text-muted">{s === "home" ? "1" : s === "draw" ? "X" : "2"}</span>
                              <span className="text-sm font-bold text-foreground">{o[s].toFixed(2)}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-xs text-muted">Odds unavailable for this match</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))
      )}

      {/* Bet slip */}
      {slip && (
        <div className="sticky bottom-4 rounded-2xl border border-accent/40 bg-background p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-foreground">{selLabel(slip.match, slip.sel)}</p>
              <p className="text-xs text-muted">{slip.match.home} vs {slip.match.away} · quota {slip.odd.toFixed(2)}</p>
            </div>
            <button type="button" onClick={() => setSlip(null)} className="text-muted hover:text-foreground">✕</button>
          </div>
          <div className="flex items-stretch overflow-hidden rounded-xl border border-border bg-background/60">
            <span className="flex items-center pl-4 text-accent">€</span>
            <input
              type="number"
              step="0.10"
              min="0.10"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              className="w-full bg-transparent px-3 py-3 text-sm text-foreground outline-none"
            />
            <div className="flex items-center px-3 text-xs text-muted">
              win {eur(Math.floor((parseFloat(stake) || 0) * 100 * slip.odd))}
            </div>
          </div>
          <button
            type="button"
            onClick={placeBet}
            disabled={busy}
            className="mt-3 w-full rounded-full bg-accent py-3 text-sm font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "…" : "Place bet"}
          </button>
        </div>
      )}

      {/* My bets */}
      {bets.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-foreground">Your bets</h3>
          <div className="flex flex-col gap-2">
            {bets.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-xl border border-border bg-background-elevated/30 px-4 py-2.5 text-sm">
                <div>
                  <p className="font-medium text-foreground">{b.home} vs {b.away}</p>
                  <p className="text-xs text-muted">{b.selection === "home" ? "1" : b.selection === "draw" ? "X" : "2"} @ {b.odds.toFixed(2)} · {eur(b.stakeCents)}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  b.status === "won" ? "bg-emerald-500/15 text-emerald-400" :
                  b.status === "lost" ? "bg-rose-500/15 text-rose-400" :
                  "bg-amber-500/15 text-amber-400"
                }`}>
                  {b.status === "won" ? `Won ++${eur(b.payoutCents)}` : b.status === "lost" ? "Lost" : "In progress"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
