-- Switches the payment provider from Gumroad to Mercado Pago Checkout Pro.
--
-- Unlike Gumroad, Mercado Pago's API lets us create a checkout ("preference")
-- dynamically from our own catalog data, so there's no more need for an
-- admin-pasted external checkout link. We're back to hosting and delivering
-- the digital file ourselves (Supabase Storage + signed URL + email), like
-- the original Lemon Squeezy design.

alter table products add column if not exists file_path text;
alter table products drop column if exists checkout_url;

-- Backfill note: any product created while Gumroad was active has no
-- file_path. Re-upload its file from /admin/productos before publishing it
-- again — the storefront/checkout will fail for products without one.
