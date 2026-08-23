-- Camp-specific cancellation cutoff requested for the 2026 registration.
UPDATE products
SET description = REPLACE(
  description,
  '⚡️ Limited spots available — be fast when registration opens.',
  '⚡️ Limited spots available — be fast when registration opens.\n\nCancellations are not possible after 30.9.2026.'
)
WHERE slug = 'all-stars-camp-2026';
