-- Use the wrangler d1 CLI to create a test database locally.
-- npx wrangler d1 create juoksut-products

-- Run the following command to apply the schema to your test database:
-- use --remote flag to run the command against the remote database
-- npx wrangler d1 execute --local juoksut-products --file ./d1/schema.sql
-- npx wrangler d1 execute --remote juoksut-products --file ./d1/schema.sql

-- Add a new column to the products table for prices
-- npx wrangler d1 execute --local juoksut-products --command="ALTER TABLE products ADD COLUMN price INTEGER NOT NULL DEFAULT 0;"
-- npx wrangler d1 execute --remote juoksut-products --command="ALTER TABLE products ADD COLUMN price INTEGER NOT NULL DEFAULT 0;"
-- ALTER TABLE products ADD COLUMN price INTEGER NOT NULL DEFAULT 0; -- Price in cents (e.g., 1999 for €19.99)


-- Dev reset: drop existing tables (safe locally)
DROP TABLE IF EXISTS stock;
DROP TABLE IF EXISTS products;

-- Create the products table
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    material TEXT DEFAULT '[]',    -- JSON array of materials
    sizing TEXT,
    size_chart TEXT DEFAULT '[]',  -- JSON array of size details (size, width, length)
    description TEXT,
    price INTEGER NOT NULL DEFAULT 0,
    stripe_product_id TEXT,        -- OPTIONAL: existing Stripe Product (prod_...)
    stripe_price_id TEXT           -- OPTIONAL: existing Stripe Price (price_...)
);
-- NOTE (migration for existing DB):
-- ALTER TABLE products ADD COLUMN stripe_product_id TEXT;
-- ALTER TABLE products ADD COLUMN stripe_price_id TEXT;


-- Create the stock table
CREATE TABLE stock (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_slug TEXT NOT NULL,
    size TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (product_slug) REFERENCES products(slug) ON DELETE CASCADE
);

-- Speeds the LEFT JOIN (productUtils) and the webhook UPDATE, and prevents
-- duplicate (product_slug, size) rows. (roadmap R15)
CREATE UNIQUE INDEX IF NOT EXISTS idx_stock_slug_size ON stock(product_slug, size);



-- INSTAGRAM

-- Create the instagram_token table (single row, id=1)
CREATE TABLE IF NOT EXISTS instagram_token (
    id INTEGER PRIMARY KEY,
    token TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Create the instagram_cache table (single row, id=1)
CREATE TABLE IF NOT EXISTS instagram_cache (
    id INTEGER PRIMARY KEY,
    videos TEXT NOT NULL,
    cached_at TEXT NOT NULL
);


-- WEBHOOK IDEMPOTENCY

-- Records Stripe event ids already handled by /api/stripe-webhook so retried/
-- duplicate checkout.session.completed deliveries don't decrement stock twice.
CREATE TABLE IF NOT EXISTS processed_events (
    id TEXT PRIMARY KEY,        -- Stripe event id (evt_...)
    type TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);




