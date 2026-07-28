-- Switches the payment provider from Lemon Squeezy to Gumroad.
--
-- Gumroad has no API to create products, so each catalog item now links out
-- to a product page created by hand in the Gumroad dashboard (`checkout_url`)
-- instead of us hosting the checkout and the deliverable file ourselves.
-- Gumroad stores the file and emails the buyer directly, so `file_path` (our
-- own Supabase Storage deliverable) is no longer used.

alter table products add column if not exists checkout_url text;
alter table products drop column if exists file_path;

-- The product-files Storage bucket created in 0001_init.sql is no longer
-- used by the app. Safe to delete manually from the Supabase dashboard
-- (Storage → product-files) — left in place here since dropping a bucket
-- with objects in it needs to go through the dashboard/API anyway.
