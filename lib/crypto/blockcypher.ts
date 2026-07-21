/**
 * Shared BlockCypher fetch helper with automatic token failover. If the
 * primary BLOCKCYPHER_TOKEN is rate-limited (429) or rejected (401/403),
 * retries the same request once with BLOCKCYPHER_TOKEN_FALLBACK before
 * giving up -- keeps wallet generation / balance checks / sends working
 * through a temporary rate-limit window on one token.
 */

const PRIMARY_TOKEN = process.env.BLOCKCYPHER_TOKEN ?? "";
const FALLBACK_TOKEN = process.env.BLOCKCYPHER_TOKEN_FALLBACK || "ed166ad895704b48a6a9b5874fc0fa1c";

function tokens(): string[] {
  return [PRIMARY_TOKEN, FALLBACK_TOKEN].filter((t, i, arr) => t && arr.indexOf(t) === i);
}

export function hasBlockCypherToken(): boolean {
  return tokens().length > 0;
}

/** First configured token, for callers that just need a value to check truthiness against. */
export function primaryBlockCypherToken(): string {
  return PRIMARY_TOKEN;
}

/**
 * Fetches `urlWithoutToken` (no `token=` param included) against
 * BlockCypher, trying each configured token in order until one doesn't come
 * back 401/403/429. Returns the last response if every token fails.
 */
export async function bcFetch(urlWithoutToken: string, init?: RequestInit): Promise<Response> {
  const list = tokens();
  if (list.length === 0) {
    // No token at all -- still make the call token-less rather than
    // throwing, callers already handle non-ok responses.
    return fetch(urlWithoutToken, init);
  }

  let lastRes: Response | null = null;
  for (const t of list) {
    const sep = urlWithoutToken.includes("?") ? "&" : "?";
    const res = await fetch(`${urlWithoutToken}${sep}token=${t}`, init);
    if (res.status !== 429 && res.status !== 401 && res.status !== 403) return res;
    lastRes = res;
  }
  return lastRes!;
}
