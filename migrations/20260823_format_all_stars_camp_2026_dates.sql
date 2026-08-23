-- Keep the public camp copy consistent with the published Finnish date format.
UPDATE products
SET description = REPLACE(description, '16.–18. October 2026', '16.–18.10.2026')
WHERE slug = 'all-stars-camp-2026';
