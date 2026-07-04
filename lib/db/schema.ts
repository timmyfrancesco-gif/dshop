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

// ── Casino: per-user balance (bot user id, amounts in EUR cents) ────
export const casinoBalances = pgTable("casino_balances", {
  userId: text("user_id").primaryKey(), // main-site (bot) user id
  username: text("username"),
  balanceCents: integer("balance_cents").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Casino: bet history / provably-fair audit trail ────────────────
export const casinoBets = pgTable("casino_bets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  game: text("game").notNull(), // "coinflip" | "blackjack"
  betCents: integer("bet_cents").notNull(),
  payoutCents: integer("payout_cents").default(0).notNull(),
  outcome: jsonb("outcome").$type<Record<string, unknown>>(),
  serverSeed: text("server_seed"),
  serverSeedHash: text("server_seed_hash"),
  clientSeed: text("client_seed"),
  nonce: integer("nonce"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Casino: active blackjack game state (one per user) ─────────────
export const casinoBlackjack = pgTable("casino_blackjack", {
  userId: text("user_id").primaryKey(),
  state: jsonb("state").$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Casino: withdrawal requests ────────────────────────────────────
export const casinoWithdrawals = pgTable("casino_withdrawals", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  chain: text("chain").notNull(),
  toAddress: text("to_address").notNull(),
  amountCents: integer("amount_cents").notNull(),
  amountCrypto: text("amount_crypto").notNull(), // coin amount at request time
  status: text("status").default("pending").notNull(), // pending | sent | failed
  txHash: text("tx_hash"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
});

// ── Casino: per-user crypto deposit addresses (persistent) ─────────
export const casinoWallets = pgTable(
  "casino_wallets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    chain: text("chain").notNull(), // btc | ltc | eth | doge | dash
    address: text("address").notNull(),
    privateKey: text("private_key"), // AES-256-GCM encrypted
    // Total atomic units (satoshi/wei) already credited, as a decimal string,
    // so re-checking the same address never double-credits a deposit.
    creditedAtomic: text("credited_atomic").default("0").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("casino_wallets_user_chain_idx").on(t.userId, t.chain)]
);

// ── Casino: football (soccer) bets ─────────────────────────────────
export const footballBets = pgTable("football_bets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  fixtureId: integer("fixture_id").notNull(),
  league: text("league"),
  home: text("home").notNull(),
  away: text("away").notNull(),
  kickoff: timestamp("kickoff"),
  selection: text("selection").notNull(), // "home" | "draw" | "away"
  odds: real("odds").notNull(), // decimal odds locked at bet time
  stakeCents: integer("stake_cents").notNull(),
  status: text("status").default("pending").notNull(), // pending | won | lost | void
  payoutCents: integer("payout_cents").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  settledAt: timestamp("settled_at"),
});

// ── Casino: football data cache (respects API-Football's 100/day limit) ──
export const footballCache = pgTable("football_cache", {
  key: text("key").primaryKey(),
  data: jsonb("data").$type<unknown>().notNull(),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
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

// ── Main site storefront config (single row) ───────────────────────
export const siteConfig = pgTable("site_config", {
  id: integer("id").primaryKey().default(1),
  config: jsonb("config")
    .$type<Record<string, unknown>>()
    .default({})
    .notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Discord verifications ───────────────────────────────────────────
export const discordVerifications = pgTable("discord_verifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  discordUserId: text("discord_user_id").notNull(),
  guildId: text("guild_id").notNull(),
  username: text("username"),
  globalName: text("global_name"),
  avatar: text("avatar"),
  accessToken: text("access_token"),   // AES-256-GCM encrypted
  refreshToken: text("refresh_token"), // AES-256-GCM encrypted
  tokenExpiresAt: timestamp("token_expires_at"),
  verifiedAt: timestamp("verified_at").defaultNow().notNull(),
  ip: text("ip"),
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
