import type {
  FeedResponse,
  HealthResponse,
  LtcResponse,
  ProductOrderRequest,
  ProductOrderResponse,
  ProductOrderStatusResponse,
  ProductsResponse,
  SlotOrderRequest,
  SlotOrderResponse,
  SlotOrderStatusResponse,
  SlotsResponse,
  StatsResponse,
} from "./types";

const API_BASE = (process.env.NEXT_PUBLIC_ASTRO_API_URL ?? "").replace(/\/+$/, "");
const DEFAULT_TIMEOUT_MS = 5000;

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

export function getStats(): Promise<StatsResponse | null> {
  return apiFetch<StatsResponse>("/api/stats");
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
