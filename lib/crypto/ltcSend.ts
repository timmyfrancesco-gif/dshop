import { signHashes } from "./ltcSign";
import { bcFetch, hasBlockCypherToken } from "./blockcypher";

/**
 * Constructs, signs and broadcasts an outgoing LTC transaction via
 * BlockCypher's "New Transaction" flow. BlockCypher builds the unsigned
 * skeleton; we sign every `tosign` hash locally with the temp wallet's
 * private key (never sent to BlockCypher) and push the signed tx back.
 * Used only for automatic refunds of oversold orders.
 */

const HOST = "https://api.blockcypher.com/v1";

export interface RefundResult {
  ok: boolean;
  txHash?: string;
  error?: string;
}

/**
 * Finds the address that funded `address`'s first incoming payment, so a
 * refund can be sent back to the actual sender. Returns null if it can't be
 * determined (e.g. a coinbase-like input with no address, or lookup failure).
 */
export async function getPayerAddress(chain: "ltc" | "btc", address: string): Promise<string | null> {
  if (!hasBlockCypherToken()) return null;
  try {
    const addrRes = await bcFetch(`${HOST}/${chain}/main/addrs/${address}`, { cache: "no-store" });
    if (!addrRes.ok) return null;
    const addrData = await addrRes.json();
    const refs = Array.isArray(addrData?.txrefs) ? addrData.txrefs : [];
    // tx_input_n === -1 marks a ref where this address was an OUTPUT (i.e. it received funds).
    const incoming = refs.find((r: { tx_input_n?: number; tx_hash?: string }) => r.tx_input_n === -1 && r.tx_hash);
    if (!incoming?.tx_hash) return null;

    const txRes = await bcFetch(`${HOST}/${chain}/main/txs/${incoming.tx_hash}`, { cache: "no-store" });
    if (!txRes.ok) return null;
    const txData = await txRes.json();
    const firstInput = txData?.inputs?.[0];
    const senderAddress = firstInput?.addresses?.[0];
    return typeof senderAddress === "string" ? senderAddress : null;
  } catch {
    return null;
  }
}

/**
 * Sends `valueSatoshi` from `fromAddress` (whose WIF we hold) to `toAddress`,
 * with an explicit, conservative fee so the output amount is deterministic.
 * Never sends more than the address's own confirmed balance can cover —
 * callers must pass a value already net of the fee.
 */
export async function sendFromTempWallet(
  chain: "ltc" | "btc",
  fromAddress: string,
  wif: string,
  toAddress: string,
  valueSatoshi: number,
  feeSatoshi: number
): Promise<RefundResult> {
  if (!hasBlockCypherToken()) return { ok: false, error: "BLOCKCYPHER_TOKEN not configured" };
  if (!Number.isFinite(valueSatoshi) || valueSatoshi <= 0) {
    return { ok: false, error: "invalid refund amount" };
  }

  try {
    const newTxRes = await bcFetch(`${HOST}/${chain}/main/txs/new`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inputs: [{ addresses: [fromAddress] }],
        outputs: [{ addresses: [toAddress], value: Math.round(valueSatoshi) }],
        fees: Math.round(feeSatoshi),
      }),
    });
    const skeleton = await newTxRes.json().catch(() => null);
    if (!newTxRes.ok || !skeleton?.tosign) {
      return { ok: false, error: skeleton?.error || `txs/new failed (${newTxRes.status})` };
    }

    const { signatures, pubkeys } = signHashes(wif, skeleton.tosign as string[]);

    const sendRes = await bcFetch(`${HOST}/${chain}/main/txs/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...skeleton, signatures, pubkeys }),
    });
    const sent = await sendRes.json().catch(() => null);
    if (!sendRes.ok) {
      return { ok: false, error: sent?.error || `txs/send failed (${sendRes.status})` };
    }
    const txHash = sent?.tx?.hash;
    return { ok: true, txHash: typeof txHash === "string" ? txHash : undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network error" };
  }
}
