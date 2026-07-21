/**
 * Crypto helpers shared by tenant registration (main wallets) and the
 * tenant checkout (per-order temporary wallets). Uses BlockCypher, the same
 * provider the Discord bot uses, so addresses/keys are compatible with the
 * bot's sweep logic.
 */

import { bcFetch, hasBlockCypherToken } from "./blockcypher";

export interface GeneratedWallet {
  address: string;
  privateKey: string;
  wif: string;
}

export interface GenerateWalletResult {
  wallet: GeneratedWallet | null;
  error?: string;
}

/**
 * Same as generateWallet, but reports WHY it failed (missing token, rate
 * limited, invalid token, etc.) instead of a silent null — needed so
 * checkout errors are actually diagnosable instead of a generic
 * "could not create payment wallet".
 */
export async function generateWalletVerbose(chain: "ltc" | "btc"): Promise<GenerateWalletResult> {
  if (!hasBlockCypherToken()) return { wallet: null, error: "BLOCKCYPHER_TOKEN is not configured on the server" };

  try {
    const res = await bcFetch(
      `https://api.blockcypher.com/v1/${chain}/main/addrs`,
      { method: "POST" }
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      let reason = `BlockCypher error ${res.status}`;
      if (res.status === 429) reason = "BlockCypher rate limit reached, try again shortly";
      else if (res.status === 401 || res.status === 403) reason = "BlockCypher token is invalid or unauthorized";
      console.error(`[generateWallet] ${chain} POST /addrs -> ${res.status}: ${body.slice(0, 300)}`);
      return { wallet: null, error: reason };
    }
    const data = await res.json();
    if (!data?.address) return { wallet: null, error: "BlockCypher response missing an address" };
    return {
      wallet: {
        address: data.address as string,
        privateKey: data.private as string,
        wif: data.wif as string,
      },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "network error";
    console.error(`[generateWallet] ${chain} request failed:`, msg);
    return { wallet: null, error: `Could not reach BlockCypher: ${msg}` };
  }
}

export async function generateWallet(chain: "ltc" | "btc"): Promise<GeneratedWallet | null> {
  return (await generateWalletVerbose(chain)).wallet;
}

/**
 * Shared LTC address used when per-order wallet generation fails (BlockCypher
 * down/rate-limited). Since it's reused across orders, on-chain activity
 * alone can't tell which order a payment belongs to — the buyer-submitted
 * txid (verified via getTxDetails) is what actually settles the order.
 */
export const FALLBACK_LTC_ADDRESS = "LfKPg2Vuuu6aTYuWCXNcQG2pCDMreee8VE";

export interface TxOutput {
  value: number; // satoshi
  addresses: string[];
}

export interface TxDetails {
  confirmations: number;
  outputs: TxOutput[];
}

/**
 * Looks up a specific transaction by hash — used to verify a buyer-submitted
 * txid against the fallback shared address, since total-received on that
 * address can't disambiguate between orders but a specific tx's outputs can.
 */
export async function getTxDetails(chain: "ltc" | "btc", txid: string): Promise<TxDetails | null> {
  if (!hasBlockCypherToken()) return null;
  try {
    const res = await bcFetch(
      `https://api.blockcypher.com/v1/${chain}/main/txs/${encodeURIComponent(txid)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const outputs = Array.isArray(data?.outputs)
      ? data.outputs.map((o: { value?: unknown; addresses?: unknown }) => ({
          value: Number(o?.value ?? 0),
          addresses: Array.isArray(o?.addresses) ? (o.addresses as string[]) : [],
        }))
      : [];
    const confirmations = Number(data?.confirmations ?? 0);
    return { confirmations: Number.isFinite(confirmations) ? confirmations : 0, outputs };
  } catch {
    return null;
  }
}

export interface LtcPrices {
  eur: number;
  usd: number;
}

// CoinGecko/Binance aren't BlockCypher — they don't share its rate limit —
// but a tiny cache still avoids hammering them if several pages request the
// price within the same second.
let ltcPricesCache: { value: LtcPrices; exp: number } | null = null;
const LTC_PRICES_CACHE_MS = 5000;

/**
 * Current LTC price in EUR and USD, always live (CoinGecko primary, Binance
 * spot as fallback). Used both to quote orders and to display an always-
 * fresh price on the checkout page — never derive it from a third-party
 * feed (e.g. the bot's own price endpoint) that might lag behind this.
 */
export async function getLtcPrices(): Promise<LtcPrices | null> {
  if (ltcPricesCache && ltcPricesCache.exp > Date.now()) return ltcPricesCache.value;

  // Primary: CoinGecko (both currencies in one call)
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=eur,usd",
      { cache: "no-store" }
    );
    if (res.ok) {
      const data = await res.json();
      const eur = data?.litecoin?.eur;
      const usd = data?.litecoin?.usd;
      if (typeof eur === "number" && eur > 0 && typeof usd === "number" && usd > 0) {
        const value = { eur, usd };
        ltcPricesCache = { value, exp: Date.now() + LTC_PRICES_CACHE_MS };
        return value;
      }
    }
  } catch {
    // fall through to backup
  }

  // Backup: Binance spot (EUR and USDT pairs)
  try {
    const [eurRes, usdRes] = await Promise.all([
      fetch("https://api.binance.com/api/v3/ticker/price?symbol=LTCEUR", { cache: "no-store" }),
      fetch("https://api.binance.com/api/v3/ticker/price?symbol=LTCUSDT", { cache: "no-store" }),
    ]);
    const eurData = eurRes.ok ? await eurRes.json() : null;
    const usdData = usdRes.ok ? await usdRes.json() : null;
    const eur = Number(eurData?.price);
    const usd = Number(usdData?.price);
    if (Number.isFinite(eur) && eur > 0 && Number.isFinite(usd) && usd > 0) {
      const value = { eur, usd };
      ltcPricesCache = { value, exp: Date.now() + LTC_PRICES_CACHE_MS };
      return value;
    }
  } catch {
    // give up
  }

  return null;
}

/** EUR-only convenience wrapper for callers that don't need the USD price. */
export async function getLtcPriceEur(): Promise<number | null> {
  return (await getLtcPrices())?.eur ?? null;
}

// Short-lived cache so a webhook firing and a client poll landing within a
// couple seconds of each other (or several open checkout tabs watching the
// same address) don't each burn a separate BlockCypher call — this is the
// single biggest source of avoidable rate-limit pressure under load.
const receivedCache = new Map<string, { value: { receivedLtc: number; confirmations: number; unconfirmedLtc: number }; exp: number }>();
const RECEIVED_CACHE_MS = 15000;

/**
 * Total amount (in LTC) ever received by an address, the highest
 * confirmation count seen, and the still-unconfirmed (mempool) amount.
 * Used by the settle endpoint as a defense-in-depth check that an order was
 * actually paid. Returns null if the lookup fails.
 */
export async function getAddressReceived(
  chain: "ltc" | "btc",
  address: string
): Promise<{ receivedLtc: number; confirmations: number; unconfirmedLtc: number } | null> {
  const cacheKey = `${chain}:${address}`;
  const cached = receivedCache.get(cacheKey);
  if (cached && cached.exp > Date.now()) return cached.value;

  if (!hasBlockCypherToken()) return null;
  try {
    const res = await bcFetch(
      `https://api.blockcypher.com/v1/${chain}/main/addrs/${address}`,
      { cache: "no-store" }
    );
    if (!res.ok) {
      if (res.status === 429) console.error("[getAddressReceived] BlockCypher rate limited (both tokens)");
      else console.error(`[getAddressReceived] BlockCypher returned ${res.status} for ${address}`);
      return null;
    }
    const data = await res.json();
    const litoshis = Number(data?.total_received ?? 0);
    if (!Number.isFinite(litoshis)) return null;
    const unconfirmedLitoshis = Number(data?.unconfirmed_balance ?? 0);
    // Highest confirmation count across recent txrefs
    let confirmations = 0;
    const refs = Array.isArray(data?.txrefs) ? data.txrefs : [];
    for (const r of refs) {
      const c = Number(r?.confirmations ?? 0);
      if (Number.isFinite(c) && c > confirmations) confirmations = c;
    }
    const value = {
      receivedLtc: litoshis / 1e8,
      confirmations,
      unconfirmedLtc: Number.isFinite(unconfirmedLitoshis) ? unconfirmedLitoshis / 1e8 : 0,
    };
    receivedCache.set(cacheKey, { value, exp: Date.now() + RECEIVED_CACHE_MS });
    if (receivedCache.size > 2000) receivedCache.clear();
    return value;
  } catch (e) {
    console.error(`[getAddressReceived] lookup threw for ${address}:`, e instanceof Error ? e.message : e);
    return null;
  }
}
