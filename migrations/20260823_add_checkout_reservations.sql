-- Reserve scarce event places while a Stripe Checkout Session is open. Apply
-- this before deploying the matching checkout/webhook code.
ALTER TABLE products ADD COLUMN reserve_stock INTEGER NOT NULL DEFAULT 0;

CREATE TABLE checkout_reservations (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  product_slug TEXT NOT NULL,
  size TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active, paid, released
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  completed_at INTEGER,
  released_at INTEGER,
  FOREIGN KEY (product_slug) REFERENCES products(slug) ON DELETE CASCADE
);

CREATE INDEX idx_checkout_reservations_active_expiry
ON checkout_reservations(status, expires_at);

CREATE INDEX idx_checkout_reservations_group
ON checkout_reservations(group_id, status);

-- The 2026 camp is the only current product that should reserve a limited
-- place. This remains non-purchasable until its stock is set above zero.
UPDATE products
SET reserve_stock = 1
WHERE slug = 'all-stars-camp-2026';
