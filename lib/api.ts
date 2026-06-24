import type {
  ApiProduct,
  AuthResponse,
  AuthUser,
  FeedResponse,
  HealthResponse,
  LoginRequest,
  LtcResponse,
  ProductOrderRequest,
  ProductOrderResponse,
  ProductOrderStatusResponse,
  ProductsResponse,
  RegisterRequest,
  ReviewRequest,
  ReviewResponse,
  ReviewsResponse,
  SlotOrderRequest,
  SlotOrderResponse,
  SlotOrderStatusResponse,
  SlotsResponse,
  SmmOrderRequest,
  SmmOrderResponse,
  SmmOrderStatusResponse,
  SmmProductsResponse,
  StatsResponse,
  TransferResponse,
  WalletInfo,
} from "./types";

const API_BASE = (process.env.NEXT_PUBLIC_ASTRO_API_URL ?? "").replace(/\/+$/, "");
const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN ?? "";
const DEFAULT_TIMEOUT_MS = 10_000;

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
  if (!API_BASE) {
    console.warn("[API] API_BASE not configured");
    return null;
  }

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

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[API] ${init?.method ?? "GET"} ${path} → ${res.status}`, text.slice(0, 200));
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[API] ${init?.method ?? "GET"} ${path} failed:`, err instanceof Error ? err.message : err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function adminHeaders(): Record<string, string> {
  return ADMIN_TOKEN ? { Authorization: `Bearer ${ADMIN_TOKEN}` } : {};
}

function adminApiFetch<T>(
  path: string,
  init?: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T | null> {
  return apiFetch<T>(path, {
    ...init,
    headers: { ...adminHeaders(), ...init?.headers },
  }, timeoutMs);
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
  if (typeof window !== "undefined") return null;
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
  return adminApiFetch<ApiProduct>(`/api/products/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteProduct(id: string): Promise<boolean> {
  return adminApiFetch<{ ok: boolean }>(`/api/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
  }).then((res) => res !== null);
}

export function createProduct(
  data: Omit<ApiProduct, "id">
): Promise<ApiProduct | null> {
  return adminApiFetch<ApiProduct>("/api/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateProductStock(
  id: string,
  stock: number
): Promise<boolean> {
  return adminApiFetch<{ ok: boolean }>(
    `/api/products/${encodeURIComponent(id)}/stock`,
    {
      method: "PUT",
      body: JSON.stringify({ stock }),
    }
  ).then((res) => res !== null);
}

// ── SMM Products ────────────────────────────────────────────────────

export function getSmmProducts(): Promise<SmmProductsResponse | null> {
  return apiFetch<SmmProductsResponse>("/api/smm-products");
}

export function createSmmOrder(
  payload: SmmOrderRequest
): Promise<SmmOrderResponse | null> {
  return apiFetch<SmmOrderResponse>("/api/smm-order", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getSmmOrder(
  id: string
): Promise<SmmOrderStatusResponse | null> {
  return apiFetch<SmmOrderStatusResponse>(`/api/smm-order/${encodeURIComponent(id)}`);
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
  return adminApiFetch<WalletInfo>("/api/wallet/balance");
}

export function transferFunds(
  amount: number,
  toAddress: string
): Promise<TransferResponse | null> {
  return adminApiFetch<TransferResponse>("/api/wallet/transfer", {
    method: "POST",
    body: JSON.stringify({ amount, toAddress }),
  }, 30_000);
}

// ── Auth ─────────────────────────────────────────────────────────────

function authApiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T | null> {
  const token = typeof window !== "undefined" ? localStorage.getItem("hm_auth_token") : null;
  return apiFetch<T>(path, {
    ...init,
    headers: {
      ...init?.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

export async function registerUser(
  payload: RegisterRequest,
): Promise<{ data: AuthResponse | null; error?: string }> {
  if (!API_BASE) return { data: null, error: "API not configured" };
  try {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      cache: "no-store",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    if (!res.ok) return { data: null, error: body.error ?? "Registration failed" };
    return { data: body as AuthResponse };
  } catch {
    return { data: null, error: "Network error" };
  }
}

export async function loginUser(
  payload: LoginRequest,
): Promise<{ data: AuthResponse | null; error?: string }> {
  if (!API_BASE) return { data: null, error: "API not configured" };
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      cache: "no-store",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    if (!res.ok) return { data: null, error: body.error ?? "Login failed" };
    return { data: body as AuthResponse };
  } catch {
    return { data: null, error: "Network error" };
  }
}

export async function loginWithDiscord(
  code: string,
): Promise<{ data: AuthResponse | null; error?: string }> {
  if (!API_BASE) return { data: null, error: "API not configured" };
  try {
    const res = await fetch(`${API_BASE}/api/auth/discord/callback`, {
      method: "POST",
      cache: "no-store",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const body = await res.json();
    if (!res.ok) return { data: null, error: body.error ?? "Discord login failed" };
    return { data: body as AuthResponse };
  } catch {
    return { data: null, error: "Network error" };
  }
}

export function getMe(): Promise<AuthUser | null> {
  return authApiFetch<AuthUser>("/api/auth/me");
}
