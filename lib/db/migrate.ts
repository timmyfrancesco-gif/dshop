import { sql } from "drizzle-orm";
import { db } from "./index";

export async function runMigrations() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL,
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      avatar TEXT,
      discord_id TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users (email);

    CREATE TABLE IF NOT EXISTS tenants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug TEXT NOT NULL,
      name TEXT NOT NULL,
      owner_id UUID NOT NULL REFERENCES users(id),
      description TEXT DEFAULT '',
      logo TEXT,
      theme TEXT NOT NULL DEFAULT 'hyper',
      accent_color TEXT DEFAULT '#6571FF',
      custom_domain TEXT,
      discord_invite TEXT,
      discord_bot_token TEXT,
      discord_guild_id TEXT,
      ltc_address TEXT,
      fee_pct REAL NOT NULL DEFAULT 5,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS tenants_slug_idx ON tenants (slug);

    CREATE TABLE IF NOT EXISTS tenant_products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      category TEXT DEFAULT 'Shop',
      price REAL NOT NULL,
      compare_price REAL,
      currency TEXT NOT NULL DEFAULT 'EUR',
      stock INTEGER NOT NULL DEFAULT 0,
      image TEXT,
      images JSONB DEFAULT '[]',
      deliverable_type TEXT DEFAULT 'serials',
      instructions TEXT,
      variants JSONB,
      total_sold INTEGER NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS tenant_orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES tenant_products(id),
      variant_id TEXT,
      buyer_discord TEXT,
      buyer_email TEXT,
      amount_eur REAL NOT NULL,
      amount_ltc REAL,
      fee_pct REAL NOT NULL,
      fee_eur REAL NOT NULL,
      ltc_address TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      delivered_item TEXT,
      tx_hash TEXT,
      confirmations INTEGER DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS tenant_feed (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      label TEXT NOT NULL,
      method TEXT,
      amount REAL,
      ts TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
}
