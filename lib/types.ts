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
  totalOrders?: number;
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
  images?: string[];
  instructions?: string;
  variants?: ProductVariant[];
  deliverableType?: DeliverableType;
}

export interface ProductVariant {
  id: string;
  title: string;
  price: number;
  stock: number;
  stockItems?: string;
}

export type DeliverableType = "serials" | "service" | "dynamic" | "files" | "smm-panels";

export interface ApiProduct {
  id: string;
  name: string;
  price: number;
  currency: string;
  stock: number;
  image?: string;
  description: string;
  url?: string;
  urlPath?: string;
  category?: string;
  images?: string[];
  instructions?: string;
  deliverableType?: DeliverableType;
  smmServiceId?: number;
  smmMinQty?: number;
  smmMaxQty?: number;
  variants?: ProductVariant[];
}

export interface ProductsResponse {
  products?: ApiProduct[];
}

export interface ProductOrderRequest {
  productId: string;
  discord: string;
  variantId?: string;
}

export interface ProductOrderResponse {
  orderId: string;
  address: string;
  amountEur: number;
  productName?: string;
}

export interface ProductOrderStatusResponse {
  status: "pending" | "confirming" | "paid" | "cancelled";
  orderId?: string;
  productId?: string;
  amountEur?: number;
  address?: string;
  deliveredItem?: string | null;
  confirmations?: number;
  requiredConfirmations?: number;
}

export interface WalletInfo {
  balance: number;
  address: string;
}

export interface TransferRequest {
  amount: number;
  toAddress: string;
}

export interface TransferResponse {
  txId: string;
}

export interface CoinPrice {
  symbol: string;
  name: string;
  eur: number | null;
  changePct: number | null;
}

// ── Auth ─────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  discordId?: string;
  role: "user" | "admin";
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// ── Reviews ──────────────────────────────────────────────────────────

export interface ReviewRequest {
  orderId: string;
  rating: number;
  comment?: string;
}

export interface Review {
  orderId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface ReviewResponse {
  success: boolean;
  review: Review;
}

export interface ReviewsResponse {
  reviews: Review[];
}

// ── SMM Products ────────────────────────────────────────────────────

export interface SmmProduct {
  id: string;
  name: string;
  serviceId: number;
  pricePerThousand: number;
  instructions: string;
  category?: string;
  image?: string;
  minQuantity: number;
  maxQuantity: number;
  active: boolean;
  createdAt: string;
}

export interface SmmProductsResponse {
  products: SmmProduct[];
}

export interface SmmOrderRequest {
  smmProductId: string;
  quantity: number;
  link: string;
  discord: string;
}

export interface SmmOrderResponse {
  orderId: string;
  address: string;
  amountEur: number;
  amountLtc: number;
  quantity: number;
  link: string;
  serviceName: string;
}

export interface SmmOrderStatusResponse {
  status: "pending" | "confirming" | "processing" | "completed" | "cancelled";
  address?: string;
  amountEur?: number;
  confirmations?: number;
  requiredConfirmations?: number;
  txHash?: string;
  smmOrderId?: number;
  smmStatus?: string;
}
