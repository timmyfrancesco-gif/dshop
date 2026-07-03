import { createHash, createHmac, randomBytes } from "crypto";

/**
 * Provably-fair primitives.
 *
 * A round commits to a random `serverSeed` by publishing its SHA-256 hash
 * BEFORE the outcome. The outcome is derived deterministically from
 * HMAC-SHA256(serverSeed, `${clientSeed}:${nonce}`), so once the serverSeed
 * is revealed anyone can recompute the result and confirm it wasn't altered.
 */

export function newServerSeed(): string {
  return randomBytes(32).toString("hex");
}

export function hashSeed(serverSeed: string): string {
  return createHash("sha256").update(serverSeed).digest("hex");
}

/** Deterministic keystream of bytes from the seed triple. */
function* byteStream(serverSeed: string, clientSeed: string, nonce: number): Generator<number> {
  let round = 0;
  while (true) {
    const digest = createHmac("sha256", serverSeed)
      .update(`${clientSeed}:${nonce}:${round}`)
      .digest();
    for (const b of digest) yield b;
    round++;
  }
}

/** A float in [0,1) from the seed triple (uses the first 4 bytes). */
export function fairFloat(serverSeed: string, clientSeed: string, nonce: number): number {
  const gen = byteStream(serverSeed, clientSeed, nonce);
  let result = 0;
  let divisor = 1;
  for (let i = 0; i < 4; i++) {
    divisor *= 256;
    result = result * 256 + gen.next().value;
  }
  return result / divisor;
}

/**
 * Fisher-Yates shuffle driven entirely by the seed triple, so the deck order
 * is reproducible from the revealed serverSeed.
 */
export function fairShuffle<T>(items: T[], serverSeed: string, clientSeed: string, nonce: number): T[] {
  const arr = items.slice();
  const gen = byteStream(serverSeed, clientSeed, nonce);
  for (let i = arr.length - 1; i > 0; i--) {
    // Rejection sampling over whole bytes to avoid modulo bias.
    const max = i + 1;
    const limit = Math.floor(256 / max) * max;
    let b: number;
    do {
      b = gen.next().value;
    } while (b >= limit);
    const j = b % max;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
