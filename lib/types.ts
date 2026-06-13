export interface HealthResponse {
  ok: boolean;
}

export interface StatsResponse {
  activeSlots: number;
  totalEscrow: number;
  completedMM: number;
  totalUserTrades: number;
  ticketsOpened?: number;
  totalCustomers?: number;
  totalVolume?: number;
}

export interface LtcResponse {
  eur: number;
  usd: number;
  changePct?: number;
}

export type FeedItemType = "order" | "escrow" | "mm" | "slot" | "exchange" | "casino";

export interface FeedItem {
  type: FeedItemType;
  label: string;
  method?: string;
  amount?: string;
  ts: number;
}

export interface FeedResponse {
  items: FeedItem[];
}

export interface AdSlot {
  id: string;
  tier: string;
  name: string;
  description?: string;
}

export interface SlotsResponse {
  slots?: AdSlot[];
}

export type SlotTier = "first" | "second" | "third";
export type SlotDuration = "weekly" | "monthly" | "lifetime";

export interface SlotOrderRequest {
  tier: string;
  duration: string;
  discord: string;
}

export interface SlotOrderResponse {
  orderId: string;
  address: string;
  amountEur: number;
}

export interface SlotOrderStatusResponse {
  status: "pending" | "paid";
  orderId?: string;
  tier?: string;
  duration?: string;
  amountEur?: number;
  address?: string;
}

export interface CoinPrice {
  symbol: string;
  name: string;
  eur: number | null;
  changePct: number | null;
}

export interface Product {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  price: number;
  currency?: string;
  image?: string;
  stock?: number;
  url?: string;
}

export interface ProductsResponse {
  products: Product[];
  updatedAt?: number;
}
