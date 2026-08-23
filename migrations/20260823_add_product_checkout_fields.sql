-- Run this once against the production D1 database *before* deploying the
-- accompanying application change. It adds per-product registration fields
-- that become required Stripe Checkout dropdowns.
ALTER TABLE products ADD COLUMN checkout_fields TEXT NOT NULL DEFAULT '[]';

-- Example for ALL-STARS CAMP 2026 after its product row has been created:
-- UPDATE products
-- SET checkout_fields = '[{"key":"camp_shirt_size","label":"Camp shirt size","options":["XS","S","M","L","XL"]}]'
-- WHERE slug = 'all-stars-camp-2026';
