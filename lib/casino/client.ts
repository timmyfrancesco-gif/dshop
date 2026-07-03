"use client";

/**
 * Client helpers for the casino API. Every call carries the main-site auth
 * token (the same one AuthContext stores) so the server can verify the user.
 */

const TOKEN_KEY = "hm_auth_token";

function token(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const t = token();
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Error ${res.status}`);
  return data as T;
}

export function eur(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

export const casino = {
  getBalance: () => call<{ balanceCents: number; testMode: boolean }>("/api/casino/balance"),
  faucet: () => call<{ balanceCents: number }>("/api/casino/faucet", { method: "POST" }),
  coinflip: (betCents: number, choice: "heads" | "tails", clientSeed: string) =>
    call<{
      result: "heads" | "tails";
      win: boolean;
      payoutCents: number;
      balanceCents: number;
      fair: { serverSeed: string; serverSeedHash: string; clientSeed: string; nonce: number };
    }>("/api/casino/coinflip", {
      method: "POST",
      body: JSON.stringify({ betCents, choice, clientSeed }),
    }),
  bjStart: (betCents: number, clientSeed: string) =>
    call<{ state: BlackjackView; balanceCents: number }>("/api/casino/blackjack/start", {
      method: "POST",
      body: JSON.stringify({ betCents, clientSeed }),
    }),
  bjAction: (action: "hit" | "stand" | "double" | "split") =>
    call<{ state: BlackjackView; balanceCents: number }>("/api/casino/blackjack/action", {
      method: "POST",
      body: JSON.stringify({ action }),
    }),
  bjState: () =>
    call<{ state: BlackjackView | null; balanceCents: number }>("/api/casino/blackjack/state"),
  wallets: () => call<{ wallets: WalletView[] }>("/api/casino/wallets"),
  checkDeposits: () =>
    call<{ credited: { chain: string; eurCents: number }[]; balanceCents: number }>(
      "/api/casino/deposits/check",
      { method: "POST" }
    ),
  footballMatches: () =>
    call<{ matches: FootballMatch[]; configured: boolean }>("/api/casino/football/matches"),
  footballBet: (fixtureId: number, selection: "home" | "draw" | "away", stakeCents: number) =>
    call<{ bet: FootballBetSlip; balanceCents: number }>("/api/casino/football/bet", {
      method: "POST",
      body: JSON.stringify({ fixtureId, selection, stakeCents }),
    }),
  footballMyBets: () => call<{ bets: FootballBet[] }>("/api/casino/football/mybets"),
  withdraw: (chain: string, toAddress: string, amountCents: number) =>
    call<{ withdrawal: Withdrawal; balanceCents: number }>("/api/casino/withdraw", {
      method: "POST",
      body: JSON.stringify({ chain, toAddress, amountCents }),
    }),
  withdrawals: () => call<{ withdrawals: Withdrawal[] }>("/api/casino/withdrawals"),
};

export interface Withdrawal {
  id: string;
  chain: string;
  toAddress: string;
  amountCents: number;
  amountCrypto: string;
  status: string;
}

export interface FootballMatch {
  fixtureId: number;
  league: string;
  home: string;
  away: string;
  kickoff: string;
  status: string;
  odds: { home: number; draw: number; away: number } | null;
}
export interface FootballBetSlip {
  id: string;
  home: string;
  away: string;
  selection: string;
  odds: number;
  stakeCents: number;
  potentialCents: number;
}
export interface FootballBet {
  id: string;
  home: string;
  away: string;
  selection: string;
  odds: number;
  stakeCents: number;
  status: string;
  payoutCents: number;
  kickoff: string | null;
}

export interface WalletView {
  chain: string;
  address: string;
  symbol: string;
  label: string;
}

export interface CardView {
  rank: string;
  suit: string;
}
export interface BlackjackView {
  dealer: CardView[];
  dealerValue: number;
  hands: {
    cards: CardView[];
    value: number;
    betCents: number;
    doubled: boolean;
    done: boolean;
    outcome?: "win" | "lose" | "push" | "blackjack";
  }[];
  active: number;
  finished: boolean;
  canSplit: boolean;
  canDouble: boolean;
  payoutCents: number;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  serverSeed?: string;
}
