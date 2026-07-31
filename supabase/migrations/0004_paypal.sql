-- Adds PayPal as a second checkout option, priced in USD.
--
-- PayPal doesn't support PEN at all, so every product needs a USD price.
-- Rather than a live FX rate, the store owner uses a simple manual formula
-- (configurable) applied to the Sol price, with the option to override it
-- per product.

create table if not exists store_settings (
  id boolean primary key default true,
  usd_formula_add numeric not null default 5,
  usd_formula_divide numeric not null default 3,
  constraint store_settings_singleton check (id)
);

insert into store_settings (id) values (true) on conflict (id) do nothing;

alter table products add column if not exists price_usd_mode text not null default 'calculated'
  check (price_usd_mode in ('calculated', 'manual'));
alter table products add column if not exists price_usd_manual_cents integer;
