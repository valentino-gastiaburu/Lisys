-- Makes the homepage hero (title, description, background image) editable
-- from the admin instead of hardcoded in the page.

alter table store_settings add column if not exists hero_title text
  not null default 'Cursos, plantillas y guías, listos para usar';
alter table store_settings add column if not exists hero_description text
  not null default 'Comprá con tarjeta y recibí el archivo al instante. Sin cuentas, sin vueltas.';
alter table store_settings add column if not exists hero_image_path text;
