-- The PayPal return URL only carries PayPal's own order id (`token`), not
-- our cart id — stash it on the cart row right after creating the PayPal
-- order so the success page can look the cart up directly (one row, no
-- ambiguity even when a cart has several items and the webhook later
-- creates several `orders` rows sharing that same provider order id).

alter table carts add column if not exists provider_order_id text;
