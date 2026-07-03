/**
 * Casino crypto layer: per-user deposit addresses on the major chains via
 * BlockCypher (the same provider the tenant wallets use — the existing
 * BLOCKCYPHER_TOKEN covers all of these), plus EUR price conversion.
 */

export type Chain = "btc" | "ltc" | "eth" | "doge" | "dash";

interface ChainCfg {
  bc: string; // BlockCypher path segment
  coingecko: string; // CoinGecko id
  decimals: number; // atomic units per coin
  label: string;
  symbol: string;
}

export const CHAINS: Record<Chain, ChainCfg> = {
  btc: { bc: "btc/main", coingecko: "bitcoin", decimals: 8, label: "Bitcoin", symbol: "BTC" },
  ltc: { bc: "ltc/main", coingecko: "litecoin", decimals: 8, label: "Litecoin", symbol: "LTC" },
  eth: { bc: "eth/main", coingecko: "ethereum", decimals: 18, label: "Ethereum", symbol: "ETH" },
  doge: { bc: "doge/main", coingecko: "dogecoin", decimals: 8, label: "Dogecoin", symbol: "DOGE" },
  dash: { bc: "dash/main", coingecko: "dash", decimals: 8, label: "Dash", symbol: "DASH" },
};

export const CHAIN_LIST = Object.keys(CHAINS) as Chain[];

function token(): string {
  return process.env.BLOCKCYPHER_TOKEN ?? "";
}

export interface GeneratedAddress {
  address: string;
  privateKey: string;
}

/** Creates a fresh address on the given chain. Returns null on failure. */
export async function generateAddress(chain: Chain): Promise<GeneratedAddress | null> {
  const t = token();
  if (!t) return null;
  try {
    const res = await fetch(`https://api.blockcypher.com/v1/${CHAINS[chain].bc}/addrs?token=${t}`, {
      method: "POST",
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.address || !data?.private) return null;
    return { address: data.address as string, privateKey: data.private as string };
  } catch {
    return null;
  }
}

/**
 * Total amount ever received by an address, in atomic units (satoshi/wei),
 * as a BigInt string. Used to detect and credit new deposits idempotently.
 */
export async function getTotalReceivedAtomic(chain: Chain, address: string): Promise<bigint | null> {
  const t = token();
  if (!t) return null;
  try {
    const res = await fetch(
      `https://api.blockcypher.com/v1/${CHAINS[chain].bc}/addrs/${address}/balance?token=${t}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const received = data?.total_received;
    if (received === undefined || received === null) return null;
    return BigInt(received);
  } catch {
    return null;
  }
}

/** Registers a BlockCypher webhook so deposits to `address` push to our callback. */
export async function registerWebhook(chain: Chain, address: string, callbackUrl: string): Promise<void> {
  const t = token();
  if (!t) return;
  try {
    await fetch(`https://api.blockcypher.com/v1/${CHAINS[chain].bc}/hooks?token=${t}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "tx-confirmation", address, url: callbackUrl, confirmations: 1 }),
    });
  } catch {
    // non-fatal — the manual/scheduled check still credits deposits
  }
}

/** EUR prices for all chains in one CoinGecko call. */
export async function getPricesEur(): Promise<Record<Chain, number>> {
  const ids = CHAIN_LIST.map((c) => CHAINS[c].coingecko).join(",");
  const out = {} as Record<Chain, number>;
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur`,
      { cache: "no-store" }
    );
    if (res.ok) {
      const data = await res.json();
      for (const c of CHAIN_LIST) {
        const p = data?.[CHAINS[c].coingecko]?.eur;
        if (typeof p === "number") out[c] = p;
      }
    }
  } catch {
    // leave missing prices unset; callers skip crediting a chain with no price
  }
  return out;
}

/** Converts an atomic-unit amount to EUR cents using the chain's price. */
export function atomicToEurCents(chain: Chain, atomic: bigint, priceEur: number): number {
  const coins = Number(atomic) / 10 ** CHAINS[chain].decimals;
  return Math.floor(coins * priceEur * 100);
}

const ADDRESS_RE: Record<Chain, RegExp> = {
  btc: /^(bc1[a-z0-9]{20,90}|[13][a-km-zA-HJ-NP-Z1-9]{25,39})$/,
  ltc: /^(ltc1[a-z0-9]{20,90}|[LM3][a-km-zA-HJ-NP-Z1-9]{25,39})$/,
  eth: /^0x[a-fA-F0-9]{40}$/,
  doge: /^D[a-km-zA-HJ-NP-Z1-9]{25,34}$/,
  dash: /^X[a-km-zA-HJ-NP-Z1-9]{25,34}$/,
};

export function isValidAddress(chain: Chain, address: string): boolean {
  return ADDRESS_RE[chain]?.test(address) ?? false;
}

export function isChain(v: unknown): v is Chain {
  return typeof v === "string" && v in CHAINS;
}
