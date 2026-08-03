-- Lets a buyer add several items (a whole course, loose modules/videos,
-- simple products) to a cart and pay for all of them in one checkout,
-- instead of re-entering name/email/payment method per item.
--
-- Both Mercado Pago and PayPal only give us a single reference id per
-- checkout (a preference's external_reference, a purchase_unit's custom_id)
-- — not a reliable per-item breakdown back from the webhook. So we snapshot
-- what's being bought into our own `carts` row before redirecting to the
-- provider, and pass that row's id as the reference. The webhook resolves
-- the cart, then creates one `orders` row per item exactly like today.

create table if not exists carts (
  id uuid primary key default gen_random_uuid(),
  buyer_email text not null,
  buyer_name text,
  items jsonb not null, -- [{product_id, title, price_cents, currency}]
  status text not null default 'pending' check (status in ('pending', 'paid', 'rejected')),
  provider text not null check (provider in ('mercadopago', 'paypal')),
  created_at timestamptz not null default now()
);

alter table orders add column if not exists cart_id uuid references carts(id);

-- Backs the "resend my purchases" rate limit on the passwordless
-- "mis compras" lookup page: one email per day, no accounts/passwords.
create table if not exists email_resend_log (
  email text primary key,
  last_sent_at timestamptz not null
);
