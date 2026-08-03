-- Supports a few honest on-page conversion elements: a free preview video
-- per course, and an optional admin-set "before" price shown struck through
-- next to the current one (manual, no auto-expiring countdown).

alter table products add column if not exists is_preview boolean not null default false;
alter table products add column if not exists compare_at_price_cents integer;
