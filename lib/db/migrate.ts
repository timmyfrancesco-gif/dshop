import { Pool } from "pg";

export async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes("localhost")
      ? false
      : { rejectUnauthorized: false },
  });

  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL,
        username TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        avatar TEXT,
        discord_id TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users (email)
    `);

    await client.query(`
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
        btc_address TEXT,
        ltc_private_key TEXT,
        btc_private_key TEXT,
        fee_pct REAL NOT NULL DEFAULT 3,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS tenants_slug_idx ON tenants (slug)
    `);

    await client.query(`
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
      )
    `);

    await client.query(`
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
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tenant_feed (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        label TEXT NOT NULL,
        method TEXT,
        amount REAL,
        ts TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS discord_verifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        discord_user_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        username TEXT,
        global_name TEXT,
        avatar TEXT,
        access_token TEXT,
        refresh_token TEXT,
        token_expires_at TIMESTAMP,
        verified_at TIMESTAMP NOT NULL DEFAULT NOW(),
        ip TEXT
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS discord_verifications_user_idx ON discord_verifications (discord_user_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS discord_verifications_guild_idx ON discord_verifications (guild_id)
    `);

    // Add new columns if they don't exist (for existing installations)
    const alterStatements = [
      "ALTER TABLE tenants ADD COLUMN IF NOT EXISTS btc_address TEXT",
      "ALTER TABLE tenants ADD COLUMN IF NOT EXISTS ltc_private_key TEXT",
      "ALTER TABLE tenants ADD COLUMN IF NOT EXISTS btc_private_key TEXT",
      "ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_key",
      "ALTER TABLE tenant_orders ADD COLUMN IF NOT EXISTS pay_private_key TEXT",
      "ALTER TABLE tenant_orders ADD COLUMN IF NOT EXISTS payout_address TEXT",
    ];
    for (const stmt of alterStatements) {
      try { await client.query(stmt); } catch { /* column may already exist */ }
    }
  } finally {
    client.release();
    await pool.end();
  }
}
