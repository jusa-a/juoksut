-- Run once against production D1 before deploying the webhook hardening.
-- A reusable Stripe Price must map to exactly one webshop product.
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_stripe_price_id
ON products(stripe_price_id)
WHERE stripe_price_id IS NOT NULL;
