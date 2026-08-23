-- Details are still being prepared. Negative stock displays "Coming soon" and
-- prevents Checkout creation. This is a distinct product from the 2025 camp.
INSERT INTO products (
  slug,
  title,
  description,
  price,
  stripe_product_id,
  stripe_price_id,
  checkout_fields
)
VALUES (
  'all-stars-camp-2026',
  'ALL-STARS CAMP ''26',
  'All details and registration coming soon.',
  0,
  NULL,
  NULL,
  '[{"key":"camp_shirt_size","label":"Camp shirt size","options":["XS","S","M","L","XL"]}]'
);

INSERT INTO stock (product_slug, size, quantity)
VALUES ('all-stars-camp-2026', 'ONE-SIZE', -1);
