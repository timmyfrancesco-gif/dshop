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
    feePct: real("fee_pct").default(5).notNull(),
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
  ltcAddress: text("ltc_address").notNull(),
  status: text("status").default("pending").notNull(),
  deliveredItem: text("delivered_item"),
  txHash: text("tx_hash"),
  confirmations: integer("confirmations").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
