-- Tracks failed/rejected payment attempts (not just successful sales), plus
-- which provider and payment method was used, so the admin can see why a
-- checkout failed instead of only seeing successful orders.

alter table orders add column if not exists provider text not null default 'mercadopago'
  check (provider in ('mercadopago', 'paypal'));
alter table orders add column if not exists payment_method text;
alter table orders add column if not exists status_detail text;

alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check
  check (status in ('pending', 'paid', 'refunded', 'rejected'));
