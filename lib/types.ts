export interface HealthResponse {
  ok: boolean;
}

export interface StatsResponse {
  activeSlots: number;
  totalEscrow: number;
  completedMM: number;
  totalUserTrades: number;
  openTickets?: number;
  totalCustomers?: number;
  totalVolumeEur?: number;
}

export interface LtcResponse {
  eur: number;
  usd: number;
  changePct: number;
}

export type FeedItemType = "order" | "escrow" | "mm" | "slot" | "exchange";

export interface FeedItem {
  type: FeedItemType;
  label: string;
  method?: string;
  amount?: number;
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

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  icon: string;
}

export interface ShopItem {
  id: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  stock: number;
  description: string;
  icon: string;
  image?: string;
  url?: string;
}

export interface ApiProduct {
  id: string;
  name: string;
  price: number;
  currency: string;
  stock: number;
  image?: string;
  description: string;
  url?: string;
}

export interface ProductsResponse {
  products?: ApiProduct[];
}

export interface ProductOrderRequest {
  productId: string;
  email: string;
}

export interface ProductOrderResponse {
  orderId: string;
  address: string;
  amountEur: number;
  productName?: string;
}

export interface ProductOrderStatusResponse {
  status: "pending" | "paid" | "cancelled";
  orderId?: string;
  productId?: string;
  amountEur?: number;
  address?: string;
  deliveredItem?: string | null;
}

export interface CoinPrice {
  symbol: string;
  name: string;
  eur: number | null;
  changePct: number | null;
}
