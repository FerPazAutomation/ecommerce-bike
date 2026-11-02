# Plan — 002 Estado "Sin stock" en el catálogo y revalidación de stock en el checkout

Spec: ./spec.md (aprobada)
Rama: sim/catalogo-sin-stock (descartable, sale de `main`)
Skills: ebike-feature-workflow + ebike-catalog-cart (el diálogo no es un formulario: `ebike-forms` no aplica, salvo sus reglas de accesibilidad de alertas)

## Cambios por archivo

### Backend

| Archivo | Cambio | RF |
|---------|--------|----|
| `backend/app/services/stock.py` (nuevo) | Función pura `has_enough_stock(stock: int, quantity: int) -> bool` (`stock >= quantity` y `stock > 0`). Única fuente de la regla para carrito y checkout. Constante `CHECKOUT_STOCK_DETAIL = "Not enough stock for some cart items"`. | RF11, RF12 |
| `backend/app/schemas/cart.py` | `CartItemOut` suma `has_enough_stock: bool`. | RF12 |
| `backend/app/api/routers/cart.py` | `_cart_item_out` completa `has_enough_stock` con el helper (afecta `GET /cart`, `POST` y `PATCH /cart/items`). Las validaciones 400 `"Not enough stock"` no cambian. | RF12 |
| `backend/app/api/routers/orders.py` | En `create_checkout`, después de `"Cart is empty"` y **antes** de calcular el total y crear la `Order`: si alguna línea con producto activo no cumple `has_enough_stock`, se lanza `HTTPException(409, CHECKOUT_STOCK_DETAIL)`. No se crea orden ni se llama a Stripe. El orden de chequeos queda: Stripe 503 → carrito vacío 400 → stock 409 → "No valid items" 400 → orden. | RF11 |
| `backend/scripts/seed.py` | Constante `OUT_OF_STOCK_DEMO_SLUG = "casco-linea-08"` y función `ensure_out_of_stock_demo_product(db) -> bool`: busca el producto por slug y le pone `stock = 0` en cada corrida; si no existe, avisa por consola y no falla. `run()` la llama después de `ensure_cascos_category_and_products` con un `db.flush()` previo (la sesión tiene `autoflush=False`). | RF9, RF10 |
| `backend/tests/unit/test_stock.py` (nuevo) | Casos de `has_enough_stock`: stock = cantidad, stock > cantidad, stock < cantidad, stock 0, stock negativo. | RF11, RF12 |
| `backend/tests/integration/test_cart_and_checkout.py` | Tests nuevos (Stripe con `patch`, como el existente): 409 con detail exacto cuando el stock baja después de agregar al carrito, sin orden nueva, `Session.create` sin llamar y carrito igual; 200 con cantidad igual al stock; `has_enough_stock` `true`/`false` en `GET /cart`. | RF11, RF12 |
| `backend/tests/integration/test_seed.py` (nuevo) | Con `db_session`: casco `casco-linea-08` con stock 11 y otro producto con stock 5 → `ensure_out_of_stock_demo_product` dos veces → el casco queda en 0, el otro conserva 5 y la cantidad de productos no cambia. Slug inexistente → devuelve `False` sin error. | RF9, RF10 |

### Frontend

| Archivo | Cambio | RF |
|---------|--------|----|
| `frontend/src/lib/stock.ts` (nuevo) | Lógica pura: `isOutOfStock(stock)` (`stock <= 0`), `cartLineStockLabel(line)` (`null` / `"Sin stock"` / `"Stock insuficiente: quedan N"`, a partir de `has_enough_stock` y `product.stock`), `cartHasStockIssues(cart)`, `isCheckoutStockError(error)` (compara el mensaje con `CHECKOUT_STOCK_DETAIL`). Constantes de texto `OUT_OF_STOCK_LABEL`, `STOCK_WARNING_TEXT`, `CHECKOUT_STOCK_DETAIL`. | RF1–RF3, RF13–RF15 |
| `frontend/src/lib/stock.test.ts` (nuevo) | Vitest de todas las funciones de `stock.ts`, incluidos stock 1, 0 y negativo. | RF1–RF3, RF13–RF15 |
| `frontend/src/types.ts` | `CartItem` suma `has_enough_stock: boolean`. | RF12 |
| `frontend/src/components/StockBadge.tsx` (nuevo) | Etiqueta reutilizable: texto visible (ej. "Sin stock") con clase `badge badge--stock`. Se usa en las tarjetas, el detalle y el carrito. | RF1, RF2, RF5, RF13 |
| `frontend/src/index.css` | Modificador `.badge--stock`: borde y texto con contraste, que no dependa solo del color. Reutilizar las clases `landing-gate-dialog*` para el diálogo (ajustar solo lo mínimo si hace falta para `<dialog>`). | RF5, RF15 |
| `frontend/src/pages/ProductsPage.tsx` | Tarjeta de la grilla y tarjeta de la vista previa: `StockBadge` si `isOutOfStock(p.stock)`. El `div` de la vista previa pasa a `role="region"` con `aria-label="Cascos destacados"`. Orden y links sin cambios. | RF1–RF5, RF8 |
| `frontend/src/pages/ProductDetailPage.tsx` | Usa `isOutOfStock`. Sin sesión y sin stock: muestra "Sin stock" y no muestra "Inicia sesión para añadir al carrito". Con sesión: botón deshabilitado como hoy. | RF6, RF7 |
| `frontend/src/pages/CartPage.tsx` | En cada línea, `StockBadge` con `cartLineStockLabel(line)` cuando no es `null`. | RF13 |
| `frontend/src/pages/CheckoutPage.tsx` | Si `cartHasStockIssues(cart)`: alerta `role="alert"` con `STOCK_WARNING_TEXT` y link "Ir al carrito", y "Pagar con Stripe" deshabilitado. En `pay.onError`, si `isCheckoutStockError`: abre el diálogo e invalida `["cart"]`. Otros errores siguen como hoy (alerta con el mensaje de la API). | RF14, RF15 |
| `frontend/src/components/StockDialog.tsx` (nuevo) | `<dialog>` nativo abierto con `showModal()`, `aria-labelledby` al título "Sin stock suficiente", texto `STOCK_WARNING_TEXT`, link "Ir al carrito" (foco inicial) y botón "Cerrar". Escape lo cierra (comportamiento nativo). | RF15 |
| `frontend/src/components/Layout.tsx` | "Todas las bicicletas" → "Todos los productos" en el menú "Tienda" y en el menú lateral. | RF16 |

## Decisiones

| Decisión | Alternativa descartada | Por qué |
|----------|------------------------|---------|
| Rechazo del checkout con **409** `{"detail": "Not enough stock for some cart items"}` | 400 `"Not enough stock"` (el mismo del carrito) | 409 indica un conflicto entre el carrito y el inventario actual, y se distingue de los 400 que ya existen en el checkout (`"Cart is empty"`, `"No valid items in cart"`). Un detail propio evita confundirlo con el error de `POST`/`PATCH /cart/items`. |
| Regla en el backend (`has_enough_stock`) expuesta por línea en `CartItemOut` | El front compara `product.stock` con `quantity` / endpoint nuevo `GET /orders/checkout/validate` | La regla vive en un solo lugar (backend), la usan el carrito y el checkout, y el front solo la refleja. Sin endpoint nuevo ni request extra: `GET /cart` ya se pide en el carrito y en el checkout. Agregar un campo es compatible con los specs actuales (ver "Impacto en e2e"). |
| Aviso previo con `GET /cart` fresco al entrar al checkout (React Query vuelve a pedirlo al montar, `staleTime` por defecto 0) | Validar solo al pagar | Fernando pidió avisar antes. No hace falta lógica nueva de red: alcanza con leer `has_enough_stock`. |
| Orden de chequeos: Stripe 503 → vacío 400 → stock 409 | Validar stock antes que Stripe | No cambia ninguna respuesta existente (carrito vacío sin Stripe sigue dando 503). Consecuencia: el 409 solo se observa con `STRIPE_SECRET_KEY` configurada (en pytest se simula con `patch.dict`, como el test existente). |
| Al entrar: alerta inline + botón deshabilitado. Al pagar con 409: **diálogo modal** | Modal también al entrar / solo alerta inline | Abrir un modal apenas carga la página es invasivo; la alerta inline alcanza. El modal ("pop up" que pidió Fernando) queda para la sorpresa: el stock cambió entre entrar y pagar. |
| `<dialog>` nativo con `showModal()` | `div role="dialog"` como el de la home | El nativo da foco atrapado, Escape y fondo inerte sin código extra; Playwright lo encuentra con `getByRole("dialog", { name: "Sin stock suficiente" })`. Se reutilizan las clases visuales del diálogo de la home. |
| El front reconoce el 409 por el detail (`CHECKOUT_STOCK_DETAIL`) y muestra el texto fijo en español | Agregar `status` al error de `apiFetch` (`ApiError`) | No toca el cliente HTTP compartido. Es una excepción acotada a la regla "mensajes de la API sin traducir": el texto del aviso lo fija la spec. |
| Casco sin stock: **`casco-linea-08`** ("Casco Trekking Allround", hoy id 29, stock 11), elegido por slug | `casco-linea-01` (id 22) o un casco nuevo | Es el último producto que se crea, así que queda fuera de los primeros 24 de `GET /products` (ids 1–24, todos con stock ≥ 3), que es lo que usa `getProductWithStock` en los tests del carrito. Es el 8.º casco, así que entra en la vista previa (muestra los primeros 8). Un casco nuevo quedaría 9.º y no se vería (hallazgo 4 del reviewer). Por slug y no por id, porque los ids dependen del escaneo de imágenes. |
| Seed idempotente: en cada corrida se fija `stock = 0` por slug (no se crea nada) | Crear el producto solo si no existe / un flag "ya aplicado" | Funciona igual con la base vacía o ya cargada, y si alguien cambió ese stock a mano, la siguiente corrida lo vuelve a dejar en 0. El resto del seed ya era idempotente (categorías, demo, cascos por slug). |
| `StockBadge` reutilizable | Repetir el JSX en 4 lugares | Mismo texto y estilo en tarjetas, detalle y carrito; la regla de accesibilidad (texto visible, no solo color) queda en un solo lugar. |

## Impacto en e2e

- Selectores / textos que cambian:
  - Link del menú "Todas las bicicletas" → "Todos los productos" (ningún spec lo usa).
  - Nombre accesible del link de la tarjeta sin stock: suma "Sin stock" (impacto aceptado; ningún spec lo usa).
  - Nuevos: región "Cascos destacados", textos "Sin stock" / "Stock insuficiente: quedan N", alerta y diálogo "Sin stock suficiente", link "Ir al carrito".
  - Se mantienen: heading "Productos", "Cascos", "Checkout", "Carrito"; botones "Añadir al carrito", "Quitar", "Pagar con Stripe"; textbox "Email"/"Contraseña", botón "Entrar".
- Respuestas de la API:
  - `CartItemOut` suma `has_enough_stock`. `cart-items.spec.ts` compara `cart.items` contra respuestas de `POST`/`PATCH`, que también traen el campo, así que sigue en verde. `cart.spec.ts` compara el carrito vacío `{ items: [], subtotal: "0" }`, que no cambia.
  - `POST /orders/checkout` puede responder 409 (nuevo). Ningún spec actual llama al checkout.
- Datos: `casco-linea-08` pasa a stock 0 después de correr el seed. `getProductWithStock` toma el primero con stock suficiente entre los primeros 24 (id 1, stock 10): no le afecta.
- Specs afectados: ninguno. Hay que volver a correr `python -m scripts.seed` en la base de Fernando para ver RF9.

## Estrategia de tests

- Vitest: `lib/stock.test.ts` (`isOutOfStock` con 1, 0 y -1; `cartLineStockLabel` con stock suficiente, 0, negativo e insuficiente con "quedan N"; `cartHasStockIssues` con carrito vacío, sin problemas y con una línea mala; `isCheckoutStockError` con el detail exacto y con otro mensaje).
- pytest:
  - unit: `test_stock.py` (regla pura).
  - integración: checkout 409 (detail exacto, sin orden, sin llamada a Stripe, carrito igual), checkout 200 con cantidad = stock, `has_enough_stock` en `GET /cart`, y `test_seed.py` (stock 0 por slug, idempotencia, resto sin tocar).
- Casos e2e sugeridos para que escriba Fernando después (dato nuevo en `e2e/data/products.ts`: `outOfStockProduct = { slug: "casco-linea-08", name: "Casco Trekking Allround" }`):
  - API (`e2e/tests/api/products.spec.ts`): `"GET /products?category_slug=cascos returns the out-of-stock helmet with stock 0"`.
  - API (`e2e/tests/api/cart-items.spec.ts`): `"POST /cart/items with the out-of-stock helmet returns 400"` y `"GET /cart returns has_enough_stock true for a line within stock"`. Usar `uniqueRegisterUser()`.
  - El 409 del checkout **no se puede armar por API**: ningún endpoint baja el stock y no se puede agregar al carrito un producto sin stock. Queda cubierto por pytest. En UI se puede simular con `page.route` sobre `/orders/checkout`.
  - UI (`e2e/tests/ui/catalog.spec.ts`): `"Cascos destacados shows Sin stock on the out-of-stock helmet"`, `"Cascos category shows Sin stock only on the out-of-stock helmet"`, `"Product detail without session shows Sin stock and no login invitation"`, `"Product detail with session disables Añadir al carrito when out of stock"`, `"Shop menu links to Todos los productos"`.
  - UI (`e2e/tests/ui/checkout.spec.ts`, con `page.route`): `"Checkout shows stock warning and disables payment when a line lacks stock"` (simulando `GET /cart` con `has_enough_stock: false`) y `"Checkout shows Sin stock suficiente dialog when payment is rejected with 409"`.
