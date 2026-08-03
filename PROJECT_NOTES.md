# Notas de contexto para una IA futura

Este documento existe para que una sesión de IA nueva entienda rápido cómo
funciona Lisys por dentro, qué decisiones ya se tomaron (y por qué), y qué
errores ya se cometieron una vez para no repetirlos. Léelo antes de tocar
checkout, webhooks, o el admin. No repite lo que ya está en `AGENTS.md`
(sobre esta versión "no estándar" de Next.js).

## Qué es esto

Lisys: marketplace peruano de productos digitales (cursos, PDFs, plantillas).
Next.js 16 App Router + TypeScript + Tailwind v4 + Supabase (Postgres + Auth
+ Storage), deploy en Netlify (`@netlify/plugin-nextjs`). Pagos con Mercado
Pago (soles) y PayPal (dólares, cuenta **Live**, no sandbox).

Un solo admin (dueño de la tienda), sin roles ni multi-tenant. El resto de
usuarios (compradores) nunca se autentican — todo el flujo de compra y de
"mis compras" es sin cuentas ni contraseñas, a propósito (pedido explícito
del dueño).

## Modelo de datos — lo no obvio

- **`products` es un árbol auto-referenciado**, no hay tablas separadas para
  cursos/módulos/videos. `product_type: simple | course | module | video`,
  `parent_product_id` apunta al padre. Un módulo es un curso; un video es un
  módulo — comprar cualquiera de los tres es literalmente comprar "un
  producto", sin lógica especial en checkout. Esto fue una decisión
  explícita del dueño (rechazó una versión anterior con una abstracción
  `purchasables` separada): "las subsecciones se tratan como productos
  independientes, la lógica es solo visual".
- **`carts`**: una fila por intento de checkout, con un snapshot de
  `items: [{product_id, title, price_cents, currency}]` congelado en el
  momento del pago. Existe porque ni Mercado Pago ni PayPal devuelven un
  desglose confiable por ítem en el webhook — nuestra propia fila es la
  única fuente de verdad de "qué se compró exactamente". `external_reference`
  (MP) y `custom_id` (PayPal) siempre son el `cart.id`, nunca un
  `product_id` directo (eso cambió cuando se agregó el carrito multi-ítem).
- **`orders`**: sigue siendo una fila por producto comprado (no por carrito).
  Un carrito con 3 ítems pagados genera 3 filas en `orders`, todas con el
  mismo `cart_id` y el mismo `provider_order_id`.
- **Precios de módulos/video se calculan una vez**, al crearlos (dividir el
  precio del padre entre hermanos + markup configurable). No hay cascada
  automática si después cambia el precio del padre o se agregan más
  hermanos — es una simplificación v1 deliberada, no un bug. Si el precio de
  una pieza queda "mal" (p.ej. más caro que el curso completo), la solución
  es volver a guardar esa fila para que recalculed contra el estado actual.

## Checkout — cómo entender el flujo sin perderse

1. El carrito vive **solo en el navegador** (`localStorage`, solo IDs de
   producto — nunca precio ni título, así lo que se cobra siempre sale
   fresco del servidor).
2. Al pagar, el POST a `/api/checkout` o `/api/checkout/paypal` resuelve los
   productos reales, valida que sigan publicados y comprables
   (`isCartItemPurchasable` — ver más abajo), crea una fila `carts`, y recién
   ahí llama a Mercado Pago / PayPal.
3. El webhook de cada proveedor resuelve el `cart_id`, y crea una fila
   `orders` **por cada ítem** del snapshot — no vuelve a consultar precios.
4. Entrega: `lib/delivery.ts` → `getDeliverables(product)`. Si el producto
   tiene su propio link/archivo, entrega solo eso. Si no, junta
   recursivamente los links de sus hijos (curso → módulos → videos). Esto es
   un opt-in: por defecto, si el admin no puso un link propio al curso, se
   entregan todos los links de las partes.

### El bug más importante que ya se cometió (y se arregló) aquí

Los webhooks marcaban un carrito como "ya resuelto" con
`cart.status !== "pending"`. Esto rompe un caso real: en Mercado Pago, si a
alguien le rechazan la primera tarjeta y reintenta con otra **dentro del
mismo checkout**, eso genera un *segundo* `payment.id` para el *mismo*
`external_reference` (mismo carrito). Si el primer intento ya había marcado
el carrito "rejected", el segundo webhook (el que sí se cobró) se ignoraba
por completo — plata cobrada, cero registro, cero entrega, cero email.

**La regla correcta**: la idempotencia de un webhook se controla por
`provider_order_id` (ese pago/captura específico), nunca por el estado
general del carrito. `hasOrdersForProviderOrderId()` en `lib/db/orders.ts`
es el chequeo correcto. `cart.status` solo debe poder subir de rechazado a
pagado, nunca bajar de pagado a rechazado (ver el `if (cart.status ===
"pending")` antes de degradarlo en ambos webhooks).

Si en el futuro se toca `app/api/webhooks/*`, releer esto primero.

### `isCartItemPurchasable` — por qué revisa ancestros

Despublicar/desactivar un **curso** no cambia el `status` de sus módulos o
videos (no hay cascada). Sin este chequeo, un módulo/video podía seguir
comprándose directo aunque su curso ya estuviera dado de baja. La función en
`lib/db/products.ts` sube por el árbol y valida que *todos* los ancestros
sigan `published`, además del toggle `allow_module_purchase`/
`allow_video_purchase` del curso.

### Emails — siempre en minúscula

`buyer_email` se normaliza a minúscula en **todo punto de escritura**
(checkout, webhooks) y de lectura (`mis-compras`, reenvío). Si se agrega un
nuevo lugar que guarda o busca por email, hacer lo mismo — si no, alguien
que compró como `Juan@Gmail.com` no se va a encontrar buscando
`juan@gmail.com`.

## Seguridad — qué se probó y qué falta

Auditoría de seguridad hecha en esta sesión (probado en vivo contra el
proyecto real de Supabase, no solo leído):

- **RLS**: probado insertando filas reales vía service role y leyéndolas con
  la anon key pública — `orders`, `carts`, `email_resend_log`,
  `store_settings` son invisibles/inescribibles con la anon key. `products`
  correctamente filtra a `status = 'published'` para la anon key (los
  borradores no se filtran). `categories` es público a propósito. Si se
  agrega una tabla nueva, **replicar este patrón** (`enable row level
  security`, sin policies = deny-all por defecto, agregar solo el `select`
  público que haga falta) y probarlo de la misma forma antes de confiar en
  que está protegida.
- **Storage**: el bucket `product-files` es privado de verdad — probado que
  ni con la anon key ni sin token se puede bajar un archivo directo, solo
  vía URL firmada (`getSignedDownloadUrl`, 1 hora de validez).
- **CSP y headers de seguridad**: agregados en `next.config.ts`
  (`headers()`), **solo en producción** (`NODE_ENV === "production"` — en
  dev rompería HMR/Turbopack). Probado con `npm run build && npm start` que
  las cabeceras salen bien y el sitio sigue funcionando. `script-src`/
  `style-src` incluyen `'unsafe-inline'` a propósito: Next App Router inyecta
  su propio script de hidratación inline sin nonce configurado, y
  `storage-usage.tsx` usa un `style` inline para la barra de progreso — sin
  esto el sitio quedaría roto (sin interactividad) en producción. El resto
  de la CSP es estricto (`object-src 'none'`, `frame-ancestors 'none'`,
  `form-action 'self'`, etc.).
- **Uploads**: los nombres de archivo que sube el admin (portadas, archivos
  de producto) ahora se sanitizan (`sanitizeFileName` en `lib/slugify.ts`)
  antes de usarse como parte de la ruta en Supabase Storage — antes un
  nombre de archivo con `../` podía escribir fuera de la carpeta del
  producto.
- **Reenvío de "mis compras"**: el límite de 1/día por email ahora es
  atómico (función Postgres `try_claim_resend`, migración
  `0011_atomic_resend_claim.sql`) — antes era leer-decidir-escribir desde la
  app, lo que permitía que pedidos simultáneos mandaran varios emails antes
  de que se registrara el primero.
- **Cookie `country`** (usada para mostrar/ocultar soles según el país del
  visitante): ahora `httpOnly` — antes se podía leer/editar desde la consola
  del navegador. No es grave (solo afecta qué se *muestra*, el precio
  cobrado siempre se recalcula server-side), pero no había razón para no
  protegerla.
- **`requireAdmin()`** se llama en capas: `proxy.ts` (edge, antes de
  renderizar `/admin/*`), el layout de `/admin/(protected)`, y cada Server
  Action de admin por separado — esto es intencional (Next.js documenta que
  las Server Actions son alcanzables por POST directo aunque su página esté
  fuera del matcher del proxy). Si se agrega una Server Action nueva de
  admin, **siempre** debe empezar con `await requireAdmin();`.

### Lo que se dejó sin resolver (a propósito, por alcance/costo)

- **No hay rate limiting distribuido en `/api/checkout*`**. Alguien podría
  spamear la creación de carritos/preferencias. Implementarlo bien (Upstash
  Redis u otro store distribuido, porque Netlify Functions no comparten
  memoria entre invocaciones) es una dependencia nueva que no se agregó sin
  que el dueño la pida explícitamente. Si se vuelve un problema real, ese es
  el camino.
- **Fuerza bruta en `/admin/login`**: se apoya en las protecciones propias
  de Supabase Auth (rate limiting a nivel de plataforma), no hay nada
  adicional en la app. Con un solo admin, el email de login no es secreto
  de todas formas.
- **Cookies de sesión de Supabase** (`sb-*`) no son `httpOnly` — es el
  comportamiento estándar de `@supabase/ssr` (el cliente browser necesita
  leerlas para refrescar el token), no algo mal configurado por esta app.

## Cosas de negocio que no son bugs (para no "arreglarlas" sin querer)

- **Módulos/videos no aparecen en el catálogo ni en el home** —
  intencional, filtrado por `parent_product_id is null` en
  `getPublishedProducts`.
- **El precio en dólares es siempre calculado, nunca cobrado a través de
  detección de IP** — el país del visitante (`lib/geo.ts`,
  `request.geo.country` vía el runtime de Netlify) solo decide si se
  *muestra* el precio en soles al lado del de dólares. El monto real
  cobrado sale siempre de `products.price_cents`/`price_usd_*` en el
  servidor, en el momento del checkout.
- **Un link/archivo propio en un curso o módulo es opcional y sobreescribe
  la entrega agregada de sus partes** — si el admin no pone nada, se
  entrega automáticamente todo lo de abajo.
- **El carrito flotante no navega a ninguna página** — agregar un ítem
  nunca redirige; el popup con el checkout (nombre/email/métodos de pago)
  se abre solo al hacer clic en el botón flotante o en "Carrito" del header.
- **Los textos del sitio deben ser en español neutro (tú), no voseo
  argentino** — corrección explícita y repetida del dueño.
- **El verde (emerald) está reservado para precio y el botón principal de
  compra** — cualquier otro uso de acento de color (categorías
  seleccionadas, badges informativos) debería usar otro color a propósito,
  no emerald, para no diluir su significado.

## Estado del deploy

Nada de lo construido en esta sesión larga (cursos, carrito, geo-pricing,
rediseño visual, todos los fixes de seguridad) estaba pusheado a Netlify al
momento de escribir esto — todo vive en el working tree local. Antes de
pushear: recordar el presupuesto de deploys de Netlify (300 créditos
gratis, 15 por deploy, ya se consumió más de la mitad — batchear cambios,
confirmar con el dueño antes de cada deploy).

Migraciones pendientes de correr en Supabase si no se corrieron ya:
`0011_atomic_resend_claim.sql` (la última de esta sesión).
