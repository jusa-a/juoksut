-- A server-enforced sale start prevents early checkout without a cron job.
ALTER TABLE products ADD COLUMN sales_start_at INTEGER;
