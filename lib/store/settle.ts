import { db } from "@/lib/db";
import { storeOrders } from "@/lib/db/schema";
import { and, eq, lt } from "drizzle-orm";
import { getAddressReceived, getTxDetails, FALLBACK_LTC_ADDRESS } from "@/lib/crypto/wallet";
import { decryptSecret } from "@/lib/crypto/secrets";
import { getPayerAddress, sendFromTempWallet } from "@/lib/crypto/ltcSend";
import { consumeOne } from "./inventory";

// Required confirmations scale with order value: bigger payments wait for
// more blocks before the item is released, trading a bit of speed on small
// orders for safety against a double-spend on larger ones.
function requiredConfirmationsForAmount(amountEur: number): number {
  if (amountEur >= 100) return 3;
  if (amountEur >= 50) return 2;
  return 1;
}
const AMOUNT_TOLERANCE = 0.01; // 1%, absorbs rounding/network fee dust
const ORDER_TTL_MS = 1000 * 60 * 15; // unpaid orders expire after 15 min
// Flat, conservative miner fee reserved out of every refund. LTC network fees
// are typically far below this; the small remainder left at the temp address
// is an acceptable cost of never failing a refund broadcast for lack of fee.
const REFUND_FEE_SATOSHI = 50_000; // 0.0005 LTC
// Same conservative flat fee reserved out of every sweep.
const SWEEP_FEE_SATOSHI = 50_000; // 0.0005 LTC
// Where confirmed store-order payments are swept to once marked paid.
// Public receiving address, not a secret -- safe as a literal fallback.
const SWEEP_LTC_ADDRESS = process.env.STORE_SWEEP_LTC_ADDRESS || "LfKPg2Vuuu6aTYuWCXNcQG2pCDMreee8VE"

export interface SettleResult {
  status: string;
  deliveredItem?: string | null;
  confirmations?: number;
  requiredConfirmations?: number;
  refundTxHash?: string | null;
  error?: string;
}

/**
 * Best-effort sweep of a just-paid order's temp wallet to SWEEP_LTC_ADDRESS.
 * Never throws and never blocks/affects order status -- delivery to the
 * buyer already happened by the time this runs, so a sweep failure here
 * just means the funds sit at the temp address for a manual follow-up
 * rather than costing the customer anything. Logs the outcome either way.
 */
async function sweepPaidOrder(orderId: string, address: string, encryptedWif: string) {
  try {
    const received = await getAddressReceived("ltc", address);
    const receivedSatoshi = Math.round(((received?.receivedLtc ?? 0)) * 1e8);
    if (receivedSatoshi <= SWEEP_FEE_SATOSHI) {
      console.error(`[settle] sweep skipped for order ${orderId}: balance too small (${receivedSatoshi} sat)`);
      return;
    }
    const wif = decryptSecret(encryptedWif);
    if (!wif) {
      console.error(`[settle] sweep skipped for order ${orderId}: could not decrypt private key`);
      return;
    }
    const result = await sendFromTempWallet(
      "ltc",
      address,
      wif,
      SWEEP_LTC_ADDRESS,
      receivedSatoshi - SWEEP_FEE_SATOSHI,
      SWEEP_FEE_SATOSHI
    );
    if (result.ok) {
      console.log(`[settle] swept order ${orderId} -> ${SWEEP_LTC_ADDRESS} (tx ${result.txHash})`);
    } else {
      console.error(`[settle] sweep failed for order ${orderId}:`, result.error);
    }
  } catch (e) {
    console.error(`[settle] sweep threw for order ${orderId}:`, e instanceof Error ? e.message : e);
  }
}

/**
 * Advances a single pending order's state based on real on-chain activity.
 * Safe to call repeatedly and concurrently (webhook + client poll can race
 * freely) — every state transition is gated by an optimistic-concurrency
 * UPDATE, so only one caller ever performs the actual delivery or refund.
 */
export async function settleStoreOrder(orderId: string): Promise<SettleResult | null> {
  const [order] = await db.select().from(storeOrders).where(eq(storeOrders.id, orderId)).limit(1);
  if (!order) return null;

  // Retry a refund that didn't finish (network hiccup mid-broadcast, etc).
  if (order.status === "oversold_refunding" || order.status === "refund_failed") {
    return retryRefund(order);
  }

  if (order.status !== "pending") {
    return {
      status: order.status,
      deliveredItem: order.status === "paid" ? order.deliveredItem : undefined,
      refundTxHash: order.status === "refunded" ? order.refundTxHash : undefined,
    };
  }

  if (Date.now() - order.createdAt.getTime() > ORDER_TTL_MS) {
    await db
      .update(storeOrders)
      .set({ status: "expired", updatedAt: new Date() })
      .where(and(eq(storeOrders.id, orderId), eq(storeOrders.status, "pending")));
    return { status: "expired" };
  }

  if (!order.ltcAddress || !order.amountLtc) return { status: "pending" };

  // Shared fallback address: on-chain activity alone can't tell which order
  // a payment belongs to. Just signal once something new shows up so the
  // client can ask the buyer for the txid — confirmFallbackPayment does the
  // actual settlement.
  if (order.ltcAddress === FALLBACK_LTC_ADDRESS) {
    return checkFallbackPending(order);
  }

  const received = await getAddressReceived("ltc", order.ltcAddress);
  if (!received) {
    console.error(`[settle] getAddressReceived returned null for order ${orderId} (address lookup failed)`);
    return { status: "pending" };
  }

  const requiredConfirmations = requiredConfirmationsForAmount(order.amountEur);
  const required = order.amountLtc * (1 - AMOUNT_TOLERANCE);
  const confirmedEnough = received.receivedLtc >= required && received.confirmations >= requiredConfirmations;
  if (!confirmedEnough) {
    // Still needs to settle -- but if we can already see the payment on-chain
    // (mempool or under-confirmed), tell the client so it can show "detected,
    // waiting for confirmation" instead of the plain "waiting for payment"
    // screen, rather than looking like nothing happened until full settlement.
    const detected = received.receivedLtc + received.unconfirmedLtc >= required;
    return {
      status: detected ? "confirming" : "pending",
      confirmations: received.confirmations,
      requiredConfirmations,
    };
  }

  // Payment fully confirmed. Exclusively claim this
  // order before touching stock — stops a concurrent webhook+poll pair from
  // both consuming a stock item for the same single payment.
  const claimed = await db
    .update(storeOrders)
    .set({ status: "settling", confirmations: received.confirmations, updatedAt: new Date() })
    .where(and(eq(storeOrders.id, orderId), eq(storeOrders.status, "pending")))
    .returning({ id: storeOrders.id });

  if (claimed.length === 0) {
    // Another call already won the race to settle this order.
    const [fresh] = await db.select().from(storeOrders).where(eq(storeOrders.id, orderId)).limit(1);
    return { status: fresh?.status ?? "pending", deliveredItem: fresh?.deliveredItem };
  }

  // The actual allocation authority: whichever confirmed payment gets here
  // first for the last unit of stock wins it. Later ones fall through to refund.
  const deliveredItem = await consumeOne(order.productId, order.id);
  if (deliveredItem) {
    await db
      .update(storeOrders)
      .set({ status: "paid", deliveredItem, updatedAt: new Date() })
      .where(eq(storeOrders.id, orderId));
    // Awaited (not fire-and-forget) -- a serverless function can be frozen
    // right after the response is sent, so un-awaited work isn't reliable
    // here. Delivery/status are already committed above either way.
    if (order.payPrivateKey) {
      await sweepPaidOrder(orderId, order.ltcAddress!, order.payPrivateKey);
    }
    return { status: "paid", deliveredItem };
  }

  // Oversold: this payment cleared after the stock was already fully claimed
  // by earlier payers. Refund it automatically to whoever sent it.
  await db
    .update(storeOrders)
    .set({ status: "oversold_refunding", updatedAt: new Date() })
    .where(eq(storeOrders.id, orderId));
  const [fresh] = await db.select().from(storeOrders).where(eq(storeOrders.id, orderId)).limit(1);
  return retryRefund(fresh);
}

async function checkFallbackPending(order: typeof storeOrders.$inferSelect): Promise<SettleResult> {
  if (!order.amountLtc) return { status: "pending" };
  const received = await getAddressReceived("ltc", FALLBACK_LTC_ADDRESS);
  if (!received) return { status: "pending" };
  const current = received.receivedLtc + received.unconfirmedLtc;
  const baseline = order.fallbackBaselineLtc ?? 0;
  const required = order.amountLtc * (1 - AMOUNT_TOLERANCE);
  if (current - baseline >= required) {
    return { status: "awaiting_txid" };
  }
  return { status: "pending" };
}

/**
 * Settles a fallback-address order once the buyer submits the txid of their
 * payment. Unlike the per-order-wallet path, this is the only way such an
 * order can move past "awaiting_txid" — the shared address's balance alone
 * can never disambiguate which order a given payment belongs to.
 */
export async function confirmFallbackPayment(orderId: string, txHash: string): Promise<SettleResult | null> {
  const [order] = await db.select().from(storeOrders).where(eq(storeOrders.id, orderId)).limit(1);
  if (!order) return null;
  if (order.ltcAddress !== FALLBACK_LTC_ADDRESS) {
    return { status: order.status, error: "This order doesn't use the fallback address" };
  }
  if (order.status !== "pending") {
    return {
      status: order.status,
      deliveredItem: order.status === "paid" ? order.deliveredItem : undefined,
    };
  }
  if (Date.now() - order.createdAt.getTime() > ORDER_TTL_MS) {
    await db
      .update(storeOrders)
      .set({ status: "expired", updatedAt: new Date() })
      .where(and(eq(storeOrders.id, orderId), eq(storeOrders.status, "pending")));
    return { status: "expired" };
  }

  const trimmedHash = txHash.trim();
  if (!trimmedHash) return { status: "pending", error: "Enter a transaction ID" };

  // A given txid can only ever settle one order — stops the same payment
  // being submitted for multiple orders sharing the fallback address.
  const [dupe] = await db
    .select({ id: storeOrders.id })
    .from(storeOrders)
    .where(and(eq(storeOrders.txHash, trimmedHash), eq(storeOrders.status, "paid")))
    .limit(1);
  if (dupe) return { status: "pending", error: "This transaction ID was already used for a different order" };

  const tx = await getTxDetails("ltc", trimmedHash);
  if (!tx) return { status: "pending", error: "Transaction not found — double-check the ID and try again" };

  const paidSatoshi = tx.outputs
    .filter((o) => o.addresses.includes(FALLBACK_LTC_ADDRESS))
    .reduce((sum, o) => sum + o.value, 0);
  const paidLtc = paidSatoshi / 1e8;

  const requiredConfirmations = requiredConfirmationsForAmount(order.amountEur);
  const requiredLtc = (order.amountLtc ?? 0) * (1 - AMOUNT_TOLERANCE);

  if (paidLtc < requiredLtc) {
    return { status: "pending", error: "That transaction doesn't pay the required amount to our address" };
  }
  if (tx.confirmations < requiredConfirmations) {
    return {
      status: "pending",
      confirmations: tx.confirmations,
      requiredConfirmations,
      error: "Waiting for the transaction to confirm",
    };
  }

  // Exclusively claim this order before touching stock, same as the
  // per-order-wallet path.
  const claimed = await db
    .update(storeOrders)
    .set({ status: "settling", confirmations: tx.confirmations, txHash: trimmedHash, updatedAt: new Date() })
    .where(and(eq(storeOrders.id, orderId), eq(storeOrders.status, "pending")))
    .returning({ id: storeOrders.id });

  if (claimed.length === 0) {
    const [fresh] = await db.select().from(storeOrders).where(eq(storeOrders.id, orderId)).limit(1);
    return { status: fresh?.status ?? "pending", deliveredItem: fresh?.deliveredItem };
  }

  const deliveredItem = await consumeOne(order.productId, order.id);
  if (deliveredItem) {
    await db
      .update(storeOrders)
      .set({ status: "paid", deliveredItem, updatedAt: new Date() })
      .where(eq(storeOrders.id, orderId));
    return { status: "paid", deliveredItem };
  }

  // Oversold — the fallback address is the owner's own wallet, not one we
  // generated, so there's no private key to auto-refund with. Flag it for
  // manual refund instead.
  await db
    .update(storeOrders)
    .set({ status: "oversold_manual_refund", updatedAt: new Date() })
    .where(eq(storeOrders.id, orderId));
  return { status: "oversold_manual_refund" };
}

async function retryRefund(order: typeof storeOrders.$inferSelect): Promise<SettleResult> {
  if (!order.ltcAddress || !order.payPrivateKey) {
    return { status: "refund_failed" };
  }

  // Idempotency: if the temp address balance is already gone, either this
  // refund already succeeded (crashed before we recorded it) or funds were
  // never really there — either way, don't broadcast a second time.
  const current = await getAddressReceived("ltc", order.ltcAddress);
  const receivedSatoshi = Math.round((current?.receivedLtc ?? 0) * 1e8);
  const alreadySwept = receivedSatoshi > 0 && receivedSatoshi <= REFUND_FEE_SATOSHI;
  if (alreadySwept) {
    await db
      .update(storeOrders)
      .set({ status: "refunded", updatedAt: new Date() })
      .where(eq(storeOrders.id, order.id));
    return { status: "refunded" };
  }

  const refundAddress = order.refundAddress ?? (await getPayerAddress("ltc", order.ltcAddress));
  if (!refundAddress) {
    await db
      .update(storeOrders)
      .set({ status: "refund_failed", updatedAt: new Date() })
      .where(eq(storeOrders.id, order.id));
    return { status: "refund_failed" };
  }
  if (!order.refundAddress) {
    await db.update(storeOrders).set({ refundAddress }).where(eq(storeOrders.id, order.id));
  }

  const wif = decryptSecret(order.payPrivateKey);
  if (!wif) {
    return { status: "refund_failed" };
  }

  const outputSatoshi = receivedSatoshi - REFUND_FEE_SATOSHI;
  if (outputSatoshi <= 0) {
    await db
      .update(storeOrders)
      .set({ status: "refund_failed", updatedAt: new Date() })
      .where(eq(storeOrders.id, order.id));
    return { status: "refund_failed" };
  }

  const result = await sendFromTempWallet(
    "ltc",
    order.ltcAddress,
    wif,
    refundAddress,
    outputSatoshi,
    REFUND_FEE_SATOSHI
  );

  if (result.ok) {
    await db
      .update(storeOrders)
      .set({ status: "refunded", refundTxHash: result.txHash ?? null, updatedAt: new Date() })
      .where(eq(storeOrders.id, order.id));
    return { status: "refunded", refundTxHash: result.txHash };
  }

  // Leave status as oversold_refunding/refund_failed so the next poll retries.
  await db
    .update(storeOrders)
    .set({ status: "refund_failed", updatedAt: new Date() })
    .where(eq(storeOrders.id, order.id));
  return { status: "refund_failed" };
}

/** Opportunistic sweep: expires abandoned pending store orders (no refund needed — nothing was ever reserved). */
export async function expireStalestoreOrders(): Promise<number> {
  const cutoff = new Date(Date.now() - ORDER_TTL_MS);
  const expired = await db
    .update(storeOrders)
    .set({ status: "expired", updatedAt: new Date() })
    .where(and(eq(storeOrders.status, "pending"), lt(storeOrders.createdAt, cutoff)))
    .returning({ id: storeOrders.id });
  return expired.length;
}
