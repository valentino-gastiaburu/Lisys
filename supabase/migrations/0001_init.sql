-- Digital products marketplace: core schema, RLS, and storage buckets.
-- Run this once against your Supabase project (SQL Editor, or `supabase db push`).

create extension if not exists pgcrypto;

-- ── Tables ──────────────────────────────────────────────────────────────

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete set null,
  title text not null,
  slug text not null unique,
  description text,
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'USD',
  cover_image_path text,
  file_path text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_id_idx on products(category_id);
create index if not exists products_status_idx on products(status);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete restrict,
  buyer_email text not null,
  amount_cents integer not null,
  currency text not null,
  provider_order_id text unique not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'refunded')),
  created_at timestamptz not null default now()
);

create index if not exists orders_product_id_idx on orders(product_id);

-- ── Row Level Security ──────────────────────────────────────────────────
-- The app talks to Postgres with the Supabase service role key (server-only),
-- which bypasses RLS entirely. These policies are the fallback if the anon
-- key is ever used directly (e.g. client-side reads) — public visitors may
-- only read categories and published products; orders are never public.

alter table categories enable row level security;
alter table products enable row level security;
alter table orders enable row level security;

drop policy if exists "public read categories" on categories;
create policy "public read categories"
  on categories for select
  using (true);

drop policy if exists "public read published products" on products;
create policy "public read published products"
  on products for select
  using (status = 'published');

-- No policies on `orders` — anon/authenticated roles get zero access by default.

-- ── Storage buckets ─────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('product-covers', 'product-covers', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('product-files', 'product-files', false)
on conflict (id) do nothing;

drop policy if exists "public read product covers" on storage.objects;
create policy "public read product covers"
  on storage.objects for select
  using (bucket_id = 'product-covers');

-- No policies on the `product-files` bucket: only the service role (used by
-- lib/storage/files.ts to mint short-lived signed URLs after payment) can
-- read from it.
