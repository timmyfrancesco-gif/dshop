import type {
  ApiProduct,
  FeedResponse,
  HealthResponse,
  LtcResponse,
  ProductOrderRequest,
  ProductOrderResponse,
  ProductOrderStatusResponse,
  ProductsResponse,
  ReviewRequest,
  ReviewResponse,
  ReviewsResponse,
  SlotOrderRequest,
  SlotOrderResponse,
  SlotOrderStatusResponse,
  SlotsResponse,
  StatsResponse,
  TransferResponse,
  WalletInfo,
} from "./types";

const API_BASE = (process.env.NEXT_PUBLIC_ASTRO_API_URL ?? "").replace(/\/+$/, "");
const DEFAULT_TIMEOUT_MS = 5000;

function getInternalBase(): string {
  if (!API_BASE) return "";
  try {
    const url = new URL(API_BASE);
    url.port = "3001";
    return url.origin;
  } catch {
    return "";
  }
}

async function apiFetch<T>(
  path: string,
  init?: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<T | null> {
  if (!API_BASE) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });

    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export function isApiConfigured(): boolean {
  return Boolean(API_BASE);
}

export function getHealth(): Promise<HealthResponse | null> {
  return apiFetch<HealthResponse>("/api/health");
}

export async function getStats(): Promise<StatsResponse | null> {
  const [stats, internal] = await Promise.all([
    apiFetch<StatsResponse>("/api/stats"),
    fetchInternalStats(),
  ]);
  if (!stats) return null;
  if (internal?.activeTickets !== undefined) {
    stats.openTickets = internal.activeTickets;
  }
  return stats;
}

async function fetchInternalStats(): Promise<{ activeTickets?: number } | null> {
  const base = getInternalBase();
  if (!base) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
    const res = await fetch(`${base}/internal/stats`, {
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return (await res.json()) as { activeTickets?: number };
  } catch {
    return null;
  }
}

export function getLtcPrice(): Promise<LtcResponse | null> {
  return apiFetch<LtcResponse>("/api/ltc");
}

export function getFeed(limit = 15): Promise<FeedResponse | null> {
  return apiFetch<FeedResponse>(`/api/feed?limit=${limit}`);
}

export function getSlots(): Promise<SlotsResponse | null> {
  return apiFetch<SlotsResponse>("/api/slots");
}

export function createSlotOrder(
  payload: SlotOrderRequest
): Promise<SlotOrderResponse | null> {
  return apiFetch<SlotOrderResponse>("/api/slot-order", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getSlotOrder(
  id: string
): Promise<SlotOrderStatusResponse | null> {
  return apiFetch<SlotOrderStatusResponse>(`/api/slot-order/${encodeURIComponent(id)}`);
}

export function getProducts(): Promise<ProductsResponse | null> {
  return apiFetch<ProductsResponse>("/api/products");
}

export function createProductOrder(
  payload: ProductOrderRequest
): Promise<ProductOrderResponse | null> {
  return apiFetch<ProductOrderResponse>("/api/product-order", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getProductOrder(
  id: string
): Promise<ProductOrderStatusResponse | null> {
  return apiFetch<ProductOrderStatusResponse>(`/api/product-order/${encodeURIComponent(id)}`);
}

// ── Product CRUD (admin) ──────────────────────────────────────────────

export function updateProduct(
  id: string,
  data: Partial<ApiProduct>
): Promise<ApiProduct | null> {
  return apiFetch<ApiProduct>(`/api/products/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteProduct(id: string): Promise<boolean> {
  return apiFetch<{ ok: boolean }>(`/api/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
  }).then((res) => res !== null);
}

export function createProduct(
  data: Omit<ApiProduct, "id">
): Promise<ApiProduct | null> {
  return apiFetch<ApiProduct>("/api/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateProductStock(
  id: string,
  stock: number
): Promise<boolean> {
  return apiFetch<{ ok: boolean }>(
    `/api/products/${encodeURIComponent(id)}/stock`,
    {
      method: "PUT",
      body: JSON.stringify({ stock }),
    }
  ).then((res) => res !== null);
}

// ── Reviews ──────────────────────────────────────────────────────────

export async function submitReview(
  payload: ReviewRequest
): Promise<{ data: ReviewResponse | null; status: number }> {
  if (!API_BASE) return { data: null, status: 0 };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}/api/review`, {
      method: "POST",
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    clearTimeout(timeout);
    if (!res.ok) return { data: null, status: res.status };
    return { data: (await res.json()) as ReviewResponse, status: res.status };
  } catch {
    clearTimeout(timeout);
    return { data: null, status: 0 };
  }
}

export function getReviews(): Promise<ReviewsResponse | null> {
  return apiFetch<ReviewsResponse>("/api/reviews");
}

// ── Wallet ────────────────────────────────────────────────────────────

export function getWalletInfo(): Promise<WalletInfo | null> {
  return apiFetch<WalletInfo>("/api/wallet/balance");
}

export function transferFunds(
  amount: number,
  toAddress: string
): Promise<TransferResponse | null> {
  return apiFetch<TransferResponse>("/api/wallet/transfer", {
    method: "POST",
    body: JSON.stringify({ amount, toAddress }),
  });
}
