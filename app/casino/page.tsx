import Link from "next/link";
import type { Metadata } from "next";
import PageShell from "@/components/layout/PageShell";

export const metadata: Metadata = {
  title: "Casino — Dshop",
  robots: { index: false, follow: false },
};

const GAMES = [
  {
    href: "/casino/blackjack",
    title: "Blackjack",
    desc: "Beat the dealer. Pays 3:2, split and double.",
    gradient: "from-emerald-500/20 to-emerald-900/10",
    icon: (
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor"><path d="M6 3h9a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6a3 3 0 013-3zm4.5 4L8 13h5l-2.5-6z" /></svg>
    ),
  },
  {
    href: "/casino/coinflip",
    title: "Coinflip",
    desc: "Heads or tails. 50/50, almost double payout.",
    gradient: "from-[#3b82f6]/20 to-[#1e3a8a]/10",
    icon: (
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor"><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" /></svg>
    ),
  },
  {
    href: "/casino/football",
    title: "Football Betting",
    desc: "Real odds on football matches. 1X2.",
    gradient: "from-emerald-500/20 to-teal-900/10",
    icon: (
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 7l3 2.2-1.1 3.5h-3.8L9 9.2z" /></svg>
    ),
  },
];

export default function CasinoHub() {
  return (
    <PageShell>
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-foreground">Casino</h1>
            <p className="mt-1 text-sm text-muted">Provably fair games. Play responsibly.</p>
          </div>
          <Link
            href="/casino/wallet"
            className="mb-4 flex items-center justify-between rounded-2xl border border-accent/30 bg-accent-soft px-6 py-4 transition-colors hover:bg-accent/15"
          >
            <div>
              <p className="font-bold text-foreground">Deposit crypto</p>
              <p className="text-sm text-muted">Top up your balance with BTC, LTC, ETH and more.</p>
            </div>
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-accent" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" /></svg>
          </Link>
          <div className="grid gap-4 sm:grid-cols-2">
            {GAMES.map((g) => (
              <Link
                key={g.href}
                href={g.href}
                className={`group relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${g.gradient} p-6 transition-transform hover:-translate-y-1`}
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent">
                  {g.icon}
                </span>
                <h2 className="mt-4 text-xl font-bold text-foreground">{g.title}</h2>
                <p className="mt-1 text-sm text-muted">{g.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent">
                  Gioca
                  <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" /></svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
