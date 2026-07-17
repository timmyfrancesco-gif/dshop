import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  real,
  jsonb,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// ── Tenants (shop owners) ───────────────────────────────────────────
export const tenants = pgTable(
  "tenants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id),
    description: text("description").default(""),
    logo: text("logo"),
    theme: text("theme").default("hyper").notNull(),
    accentColor: text("accent_color").default("#6571FF"),
    customDomain: text("custom_domain"),
    discordInvite: text("discord_invite"),
    discordBotToken: text("discord_bot_token"),
    discordGuildId: text("discord_guild_id"),
    ltcAddress: text("ltc_address"),
    btcAddress: text("btc_address"),
    ltcPrivateKey: text("ltc_private_key"),
    btcPrivateKey: text("btc_private_key"),
    paypalEmail: text("paypal_email"),
    feePct: real("fee_pct").default(3).notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("tenants_slug_idx").on(t.slug)]
);

// ── Platform users ──────────────────────────────────────────────────
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    username: text("username").notNull(),
    passwordHash: text("password_hash").notNull(),
    avatar: text("avatar"),
    discordId: text("discord_id"),
    role: text("role").default("user").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)]
);

// ── Tenant products ─────────────────────────────────────────────────
export const tenantProducts = pgTable("tenant_products", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").default(""),
  category: text("category").default("Shop"),
  price: real("price").notNull(),
  comparePrice: real("compare_price"),
  currency: text("currency").default("EUR").notNull(),
  stock: integer("stock").default(0).notNull(),
  image: text("image"),
  images: jsonb("images").$type<string[]>().default([]),
  deliverableType: text("deliverable_type").default("serials"),
  instructions: text("instructions"),
  variants: jsonb("variants").$type<
    Array<{
      id: string;
      title: string;
      price: number;
      stock: number;
      stockItems?: string[];
    }>
  >(),
  totalSold: integer("total_sold").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Tenant orders ───────────────────────────────────────────────────
export const tenantOrders = pgTable("tenant_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => tenantProducts.id),
  variantId: text("variant_id"),
  buyerDiscord: text("buyer_discord"),
  buyerEmail: text("buyer_email"),
  amountEur: real("amount_eur").notNull(),
  amountLtc: real("amount_ltc"),
  feePct: real("fee_pct").notNull(),
  feeEur: real("fee_eur").notNull(),
  // Payment method: "ltc" (temp wallet) or "paypal" (Friends & Family).
  method: text("method").default("ltc").notNull(),
  // PayPal F&F: unique code the buyer must put in the payment note so the
  // bot can match the incoming PayPal notification email to this order.
  paypalNote: text("paypal_note"),
  // Temporary wallet that receives the buyer's payment. The bot later sweeps
  // it: feePct% to the platform wallet, the rest to the tenant main wallet.
  // Empty string for PayPal orders.
  ltcAddress: text("ltc_address").notNull(),
  payPrivateKey: text("pay_private_key"),
  // Tenant main wallet captured at order time (sweep destination).
  payoutAddress: text("payout_address"),
  status: text("status").default("pending").notNull(),
  deliveredItem: text("delivered_item"),
  txHash: text("tx_hash"),
  confirmations: integer("confirmations").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Store: platform-owned products (reliable, Postgres — not the bot) ──
export const storeProducts = pgTable("store_products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description").default("").notNull(),
  price: real("price").notNull(),
  currency: text("currency").default("EUR").notNull(),
  image: text("image"),
  category: text("category").default("Shop").notNull(),
  active: boolean("active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  totalSold: integer("total_sold").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Store: one row per deliverable item — stock == count of available rows ──
// This is the whole point of the rebuild: stock can never desync from a
// separate counter, and it can only drop on a real, atomic sale.
export const storeStockItems = pgTable(
  "store_stock_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => storeProducts.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    status: text("status").default("available").notNull(), // available | sold
    orderId: text("order_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    soldAt: timestamp("sold_at"),
  },
  (t) => [uniqueIndex("store_stock_product_status_idx").on(t.productId, t.status, t.id)]
);

// ── Store: orders for platform-owned products (bot-independent) ────
// Stock is never reserved at order creation — any number of buyers can pay
// for a low-stock product concurrently. Whichever payments are CONFIRMED
// first atomically claim a real stock item (see consumeOne); anyone whose
// payment clears after the stock is gone gets auto-refunded on-chain.
export const storeOrders = pgTable("store_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => storeProducts.id),
  buyerEmail: text("buyer_email").notNull(),
  amountEur: real("amount_eur").notNull(),
  amountLtc: real("amount_ltc"),
  ltcAddress: text("ltc_address"),
  payPrivateKey: text("pay_private_key"), // AES-256-GCM encrypted, null for fallback-address orders
  // pending | paid | expired | oversold_refunding | refunded | refund_failed
  // | oversold_manual_refund (fallback-address orders — no key to auto-refund)
  status: text("status").default("pending").notNull(),
  deliveredItem: text("delivered_item"),
  txHash: text("tx_hash"),
  confirmations: integer("confirmations").default(0),
  // Snapshot of the shared fallback address's total+unconfirmed received LTC
  // at order creation time, used to detect new activity before asking the
  // buyer to confirm which payment (via txid) was theirs. Null for orders
  // with their own generated wallet.
  fallbackBaselineLtc: real("fallback_baseline_ltc"),
  // Populated only when the order is oversold and must be refunded.
  refundAddress: text("refund_address"),
  refundTxHash: text("refund_tx_hash"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Main site storefront config (single row) ───────────────────────
export const siteConfig = pgTable("site_config", {
  id: integer("id").primaryKey().default(1),
  config: jsonb("config")
    .$type<Record<string, unknown>>()
    .default({})
    .notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Vouches (parsed from +rep messages in the Discord vouch channel) ─
export const vouches = pgTable(
  "vouches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    messageId: text("message_id").notNull(), // dedup key, unique index below
    buyerId: text("buyer_id").notNull(),
    buyerName: text("buyer_name"),
    buyerAvatarUrl: text("buyer_avatar_url"),
    sellerId: text("seller_id").notNull(),
    sellerName: text("seller_name"),
    quantity: integer("quantity").notNull(),
    product: text("product").notNull(),
    price: real("price").notNull(),
    priceFlaggedCorrected: boolean("price_flagged_corrected").default(false).notNull(),
    priceOriginalParsed: real("price_original_parsed"),
    method: text("method").notNull(),
    channelId: text("channel_id"),
    postedAt: timestamp("posted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("vouches_message_id_idx").on(t.messageId)]
);

// ── Discord verifications ───────────────────────────────────────────
export const discordVerifications = pgTable("discord_verifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  discordUserId: text("discord_user_id").notNull(),
  guildId: text("guild_id").notNull(),
  username: text("username"),
  globalName: text("global_name"),
  avatar: text("avatar"),
  // Requires the "email" OAuth scope — lets the bot's ,info command match
  // this Discord account to platform orders (buyerEmail) when linked.
  email: text("email"),
  accessToken: text("access_token"),   // AES-256-GCM encrypted
  refreshToken: text("refresh_token"), // AES-256-GCM encrypted
  tokenExpiresAt: timestamp("token_expires_at"),
  verifiedAt: timestamp("verified_at").defaultNow().notNull(),
  ip: text("ip"),
});

// ── Site login/access logs (main site auth, not tenant dashboards) ──
export const loginLogs = pgTable("login_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id"),
  email: text("email"),
  username: text("username"),
  method: text("method"), // "password" | "discord"
  url: text("url"), // exact page URL where the login completed
  referrer: text("referrer"),
  ip: text("ip"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Activity feed per tenant ────────────────────────────────────────
export const tenantFeed = pgTable("tenant_feed", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  label: text("label").notNull(),
  method: text("method"),
  amount: real("amount"),
  ts: timestamp("ts").defaultNow().notNull(),
});
