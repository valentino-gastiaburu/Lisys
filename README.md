# Lisys

Marketplace de productos digitales (cursos, PDFs, plantillas) con catálogo público,
back-office de administración y checkout con Mercado Pago y PayPal. Next.js + Supabase,
pensado para correr gratis en Netlify y ser portable a AWS más adelante.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS v4), runtime Node.js estándar.
- **Supabase** (free tier): Postgres, Auth (solo admin), Storage (portadas y archivos digitales).
- **Mercado Pago** (Checkout Pro): checkout local en soles, tarjeta o Yape, ~4-6% de comisión
  (con IGV incluido), sin cuota mensual, sin revisión previa de cuenta/sitio.
- **PayPal** (Orders API v2): checkout en dólares para compradores fuera de Perú (PayPal no
  opera en soles). Ver "Cómo funciona el precio en USD" abajo.
- **Resend** (opcional): email con el link de descarga tras la compra.
- **Netlify** (free tier): hosting. Se eligió sobre Vercel porque el Hobby plan de Vercel
  prohíbe explícitamente uso comercial/e-commerce en sus términos de servicio.

> **Por qué Mercado Pago y no Lemon Squeezy/Stripe/Gumroad** (por si hace falta reconsiderar
> más adelante): Lemon Squeezy/Paddle son Merchant of Record y exigen un sitio **ya en
> producción** con páginas legales antes de aprobar la cuenta — no sirven para arrancar.
> Stripe no está disponible como cuenta nativa en Perú (solo Brasil/México en Latam) y para
> el resto exige armar una LLC en EEUU. Gumroad no tiene esas trabas pero cobra 10% y no deja
> crear productos por API (hay que cargarlos dos veces: en Gumroad y en el catálogo propio).
> Mercado Pago, para una cuenta peruana, se registra con DNI + cuenta bancaria sin RUC
> obligatorio, no pide revisión previa, tiene comisión más baja, y su API sí permite crear el
> checkout dinámicamente desde nuestro propio catálogo — por eso el proyecto volvió a este
> modelo (el mismo patrón que se había armado originalmente para Lemon Squeezy).

> **Nota sobre Next.js 16:** esta versión renombró `middleware.ts` a `proxy.ts` (mismo
> comportamiento, ver [proxy.ts](./proxy.ts)) e introdujo un modelo de caching opcional
> ("Cache Components") que **no** está activado en este proyecto — `next.config.ts` no
> tiene `cacheComponents: true`, así que el modelo de caching es el tradicional de Next 14/15.

## Cómo funciona el checkout

1. El comprador pone su email en la ficha de producto y toca "Comprar ahora"
   (`app/(shop)/producto/[slug]/page.tsx` → `POST /api/checkout`).
2. `lib/payments/mercadopago.ts` crea una **preference** vía la API de Mercado Pago con el
   precio del producto y `external_reference = product.id`, y redirige al `init_point`
   (el checkout hosteado de Mercado Pago).
3. Tras pagar, Mercado Pago redirige al comprador a `/orden/exito?payment_id=...`. Esa página
   consulta el pago directo contra la API (`GET /v1/payments/{id}`) y, si está `approved`,
   genera un link de descarga firmado (Supabase Storage, expira en 1h) al toque — no depende
   de esperar el webhook.
4. En paralelo, Mercado Pago llama a `POST /api/webhooks/mercadopago` (con firma HMAC
   verificable) — eso registra la venta en `/admin/ordenes` y dispara el email de respaldo con
   el link de descarga.

El botón de **PayPal** sigue un camino parecido pero no idéntico (`lib/payments/paypal.ts`,
`app/api/checkout/paypal/`, `app/api/webhooks/paypal/`):

1. `POST /api/checkout/paypal` crea una **Order** vía la API de PayPal (`intent: CAPTURE`) y
   redirige al link `approve`.
2. A diferencia de Mercado Pago, aprobar el pago **no mueve la plata todavía** — PayPal exige
   un segundo paso, `capture`. Para no depender de que el comprador vuelva a nuestra página
   (podría cerrar la pestaña), **la captura se hace únicamente desde el webhook**, al recibir
   el evento `CHECKOUT.ORDER.APPROVED`. Así el dinero se cobra igual aunque el navegador del
   comprador ya no esté abierto.
3. `/orden/exito` (cuando vuelve con `?provider=paypal&token=...`) simplemente espera unos
   segundos a que la orden aparezca en nuestra base — no intenta capturar nada por su cuenta.
4. La verificación de firma del webhook no se calcula a mano: se delega al endpoint propio de
   PayPal (`/v1/notifications/verify-webhook-signature`), que es más simple y confiable que
   reimplementar la verificación por certificado.

## Cómo funciona el precio en USD

PayPal no soporta soles como moneda. Cada producto tiene un precio en USD que se calcula así,
por defecto:

```
USD = redondear_arriba( (precio_en_soles + A) / B )
```

`A` y `B` se configuran en `/admin/configuracion` (por defecto A=5, B=3). Cualquier producto
puede además tener un **precio manual en USD** que ignora la fórmula — se activa al editar el
producto (`price_usd_mode: "manual"`). Ver `lib/pricing.ts`.

## Setup local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear el proyecto en Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com) (free tier).
2. En **SQL Editor**, corré en orden los 4 archivos de
   [`supabase/migrations/`](./supabase/migrations/): `0001_init.sql`, `0002_gumroad.sql`,
   `0003_mercadopago.sql`, `0004_paypal.sql`. (Si tu proyecto es nuevo, igual corré los cuatro
   en orden — son idempotentes.) Esto deja las tablas `categories`, `products`, `orders`,
   `store_settings`, las políticas RLS, y los buckets de Storage `product-covers` (público) y
   `product-files` (privado).
3. En **Authentication → Users**, creá manualmente el único usuario admin (email + contraseña).
   Ese email es el que vas a poner en `ADMIN_EMAIL`.
4. En **Project Settings → API**, copiá `Project URL`, `Publishable key` (o `anon public`) y
   `Secret key` (o `service_role`).

### 3. Configurar Mercado Pago

1. Creá una cuenta en [mercadopago.com.pe](https://www.mercadopago.com.pe) (DNI + cuenta
   bancaria peruana).
2. Andá a [mercadopago.com.pe/developers](https://www.mercadopago.com.pe/developers/panel) →
   **Tus integraciones → Crear aplicación**.
3. Dentro de la aplicación, copiá las **credenciales de producción** → `Access Token`
   (`MERCADOPAGO_ACCESS_TOKEN`).
4. **Webhooks** (dentro de la misma aplicación) → configurá la URL
   `https://tu-dominio/api/webhooks/mercadopago`, evento `payment` → copiá la **clave
   secreta** (`MERCADOPAGO_WEBHOOK_SECRET`).
5. Mercado Pago exige URLs HTTPS reales para el checkout y el webhook — **no funciona contra
   `localhost`**. Para probar en desarrollo necesitás un túnel público, por ejemplo:
   ```bash
   npx ngrok http 3000
   ```
   y usar esa URL de ngrok como `NEXT_PUBLIC_SITE_URL` mientras probás.

### 4. Configurar PayPal

1. Creá una cuenta en [developer.paypal.com](https://developer.paypal.com/dashboard/applications).
2. **Apps & Credentials** → dejalo en modo **Sandbox** para probar primero → **Create App**.
3. Copiá el **Client ID** (`PAYPAL_CLIENT_ID`) y el **Secret** (`PAYPAL_CLIENT_SECRET`).
4. Dentro de la app → **Webhooks** → **Add Webhook** → URL
   `https://tu-dominio/api/webhooks/paypal` → evento `Checkout order approved`. Copiá el
   **Webhook ID** que te muestra (`PAYPAL_WEBHOOK_ID` — no hay "secreto" que copiar, la
   verificación se hace contra la propia API de PayPal).
5. Dejá `PAYPAL_ENV=sandbox` mientras probás. Para cobrar de verdad, repetí los pasos 2-4 en
   modo **Live** y cambiá a `PAYPAL_ENV=live`.

### 5. Variables de entorno

```bash
cp .env.local.example .env.local
```

Completá `.env.local` con los valores de Supabase, Mercado Pago y PayPal.

### 6. Correr en desarrollo

```bash
npm run dev
```

- Catálogo público: [http://localhost:3000](http://localhost:3000)
- Admin: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

Recordá que el botón "Comprar" solo funciona de punta a punta si `NEXT_PUBLIC_SITE_URL`
apunta a una URL pública (ver punto 5 de arriba).

## Deploy en Netlify

1. Conectá el repo en [app.netlify.com](https://app.netlify.com) — detecta Next.js
   automáticamente (usa `@netlify/plugin-nextjs`, ver [`netlify.toml`](./netlify.toml)).
2. Cargá las mismas variables de `.env.local` en **Site settings → Environment variables**.
   Cambiá `NEXT_PUBLIC_SITE_URL` a tu dominio real de Netlify (o dominio propio).
3. Actualizá las URLs de webhook en los paneles de Mercado Pago y PayPal a la URL de producción.
4. Probá una compra completa con una [tarjeta de prueba de Mercado Pago](https://www.mercadopago.com.pe/developers/es/docs/checkout-pro/additional-content/your-integrations/test/cards)
   y con una cuenta de [sandbox de PayPal](https://developer.paypal.com/dashboard/accounts)
   antes de operar con dinero real.

## Arquitectura y portabilidad a AWS

La app está separada en capas para que migrar de Supabase/Netlify a AWS más adelante sea
cambiar implementaciones puntuales, no reescribir la aplicación:

| Capa | Hoy | Migración a AWS |
| --- | --- | --- |
| `lib/supabase/admin.ts` — cliente de datos | Supabase (Postgres + service role key) | Reemplazar por un `pg.Pool` contra RDS/Aurora Postgres. `lib/db/*` no cambia de firma. |
| `lib/db/*` — acceso a datos | Consume `lib/supabase/admin.ts` | Único lugar que necesita tocarse al cambiar de motor de datos. |
| `lib/storage/files.ts` | Supabase Storage (compatible con S3) | Cambiar el cliente por el SDK de S3 real; incluso podés migrar el bucket directamente porque el protocolo es compatible. |
| `lib/supabase/server.ts`, `lib/auth/admin.ts` | Supabase Auth (un único admin) | Reemplazable por Cognito o un JWT propio sin tocar las rutas — `requireAdmin()` es la única interfaz que el resto de la app usa. |
| Runtime de la app | Netlify (Next.js sobre Node.js estándar, no edge) | `next build` con `output: "standalone"` corre igual en ECS/Fargate/Amplify con un Dockerfile mínimo. No se usó ninguna API específica de Netlify o Vercel. |
| Pagos | Mercado Pago + PayPal (checkout dinámico por API + webhook) | Sin dependencia de infraestructura — son servicios externos. Cambiar o agregar un proveedor implica tocar solo `lib/payments/*.ts` y sus rutas en `app/api/`. |

En resumen: todas las rutas (`app/**`) y Server Actions (`lib/actions/**`) llaman a
`lib/db`, `lib/storage`, `lib/auth`, nunca directamente al SDK de Supabase. Ese es el punto
de corte para el día que se migre a AWS.

## Estructura del proyecto

```
app/
  (shop)/                       Storefront público: home, categoría, producto, éxito de compra
  admin/(protected)/            Back-office: productos, categorías, órdenes, configuración
  admin/login/                  Login del admin
  api/checkout/                 Crea la preference de Mercado Pago y redirige al checkout
  api/checkout/paypal/          Crea la Order de PayPal y redirige a aprobar el pago
  api/webhooks/mercadopago/     Verifica la firma, confirma el pago y registra la orden
  api/webhooks/paypal/          Verifica la firma, captura el pago y registra la orden
lib/
  db/                          Acceso a datos (categorías, productos, órdenes, configuración)
  storage/                     Subida de portadas y archivos + signed URLs de descarga
  payments/                    Integración con las APIs de Mercado Pago y PayPal
  pricing.ts                   Cálculo del precio en USD a partir del precio en soles
  email/                       Envío del email de descarga (Resend)
  supabase/                    Clientes de Supabase (server, browser, admin/service-role)
  actions/                     Server Actions usadas por los formularios del admin
  auth/                        Verificación de sesión de admin
supabase/migrations/           Esquema SQL, RLS, buckets de Storage
proxy.ts                       Protege /admin (reemplazo de middleware.ts en Next.js 16)
```
