-- Courses: a module or a video is just another row in `products`, linked to
-- its parent via `parent_product_id` (course -> modules -> videos). This
-- means checkout/webhooks/orders need no changes at all — a module/video
-- purchase is a normal purchase of that product's id and price. The only
-- new runtime behavior is delivery: a product with children hands over
-- every descendant leaf's link instead of a single file/link.

alter table products add column if not exists parent_product_id uuid
  references products(id) on delete cascade;
alter table products add column if not exists product_type text not null default 'simple'
  check (product_type in ('simple', 'course', 'module', 'video'));
alter table products add column if not exists position integer not null default 0;
alter table products add column if not exists price_mode text not null default 'calculated'
  check (price_mode in ('calculated', 'manual'));
alter table products add column if not exists delivery_type text not null default 'file'
  check (delivery_type in ('file', 'link'));
alter table products add column if not exists external_link text;
alter table products add column if not exists allow_module_purchase boolean not null default false;
alter table products add column if not exists allow_video_purchase boolean not null default false;

-- Course/module rows are pure containers (no file of their own), and
-- link-delivery products don't use this column either.
alter table products alter column file_path drop not null;

create index if not exists products_parent_product_id_idx on products(parent_product_id);

-- Shared markup for the "divide by sibling count, then add a markup"
-- formula, applied at every level (course -> module price, module -> video
-- price) so buying a piece always costs more than buying its parent whole.
alter table store_settings add column if not exists child_item_markup_cents integer not null default 200;
