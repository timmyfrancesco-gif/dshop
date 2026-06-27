/**
 * Crypto helpers shared by tenant registration (main wallets) and the
 * tenant checkout (per-order temporary wallets). Uses BlockCypher, the same
 * provider the Discord bot uses, so addresses/keys are compatible with the
 * bot's sweep logic.
 */

export interface GeneratedWallet {
  address: string;
  privateKey: string;
  wif: string;
}

export async function generateWallet(
  chain: "ltc" | "btc"
): Promise<GeneratedWallet | null> {
  const token = process.env.BLOCKCYPHER_TOKEN;
  if (!token) return null;

  try {
    const res = await fetch(
      `https://api.blockcypher.com/v1/${chain}/main/addrs?token=${token}`,
      { method: "POST" }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.address) return null;
    return {
      address: data.address as string,
      privateKey: data.private as string,
      wif: data.wif as string,
    };
  } catch {
    return null;
  }
}

/**
 * Current LTC price in EUR. Returns null if the price feed is unavailable so
 * callers can fail the order rather than quote a wrong amount.
 */
export async function getLtcPriceEur(): Promise<number | null> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=eur",
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const price = data?.litecoin?.eur;
    return typeof price === "number" && price > 0 ? price : null;
  } catch {
    return null;
  }
}
