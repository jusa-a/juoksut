-- Reuses the recurring camp's existing public image path while registration
-- details are still being prepared. Negative stock displays "Coming soon" and
-- prevents Checkout creation.
UPDATE products
SET
  title = 'ALL-STARS CAMP ''26',
  description = 'All details and registration coming soon.',
  price = 0,
  stripe_product_id = NULL,
  stripe_price_id = NULL,
  checkout_fields = '[{"key":"camp_shirt_size","label":"Camp shirt size","options":["XS","S","M","L","XL"]}]'
WHERE slug = 'all-stars-camp';

UPDATE stock
SET quantity = -1
WHERE product_slug = 'all-stars-camp' AND size = 'ONE-SIZE';
