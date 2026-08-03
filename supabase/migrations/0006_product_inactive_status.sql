-- Products are never deleted from the backoffice anymore — only their
-- status changes. This adds "inactive" (discontinued, hidden, but its
-- order history stays intact) alongside the existing "draft"/"published".

alter table products drop constraint if exists products_status_check;
alter table products add constraint products_status_check
  check (status in ('draft', 'published', 'inactive'));
