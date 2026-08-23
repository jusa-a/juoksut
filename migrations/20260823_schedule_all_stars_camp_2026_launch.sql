-- Sales open at 12:00 Europe/Helsinki on 24 August 2026 (09:00 UTC).
UPDATE products
SET
  price = 19900,
  sales_start_at = 1787562000
WHERE slug = 'all-stars-camp-2026';

UPDATE stock
SET quantity = 50
WHERE product_slug = 'all-stars-camp-2026' AND size = 'ONE-SIZE';
