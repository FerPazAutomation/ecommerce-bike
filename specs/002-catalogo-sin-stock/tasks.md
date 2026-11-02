# Tareas — 002 Estado "Sin stock" en el catálogo y revalidación de stock en el checkout

- [x] T1: Regla de stock en el backend y campo `has_enough_stock` en las líneas del carrito (RF12)
  Hecho cuando: `pytest tests/unit/test_stock.py` pasa (stock = cantidad, mayor, menor, 0 y negativo); `GET /cart` de un usuario con una línea dentro del stock devuelve `has_enough_stock: true`; `cd e2e; npm run test:api` sigue en verde.

- [x] T2: Checkout rechaza con 409 si alguna línea no tiene stock suficiente (RF11)
  Hecho cuando: los tests nuevos de `test_cart_and_checkout.py` pasan (409 con `{"detail": "Not enough stock for some cart items"}`, sin orden nueva en `GET /orders`, `stripe.checkout.Session.create` sin llamar y `GET /cart` igual; 200 con cantidad = stock; `has_enough_stock` `false` en `GET /cart` cuando el stock bajó) y `pytest -m integration` sigue en verde.

- [x] T3: Seed deja `casco-linea-08` en stock 0 de forma idempotente (RF9, RF10)
  Hecho cuando: `tests/integration/test_seed.py` pasa; correr `python -m scripts.seed` dos veces sobre la base de Fernando deja exactamente un producto con stock 0 en `GET /products?limit=100` (`casco-linea-08`), la misma cantidad total de productos y el resto con el stock de antes; `npm run test:api` sigue en verde.

- [x] T4: Lógica pura de stock en el front y tipo `CartItem` actualizado (RF1–RF3, RF12–RF15)
  Hecho cuando: `lib/stock.ts` y `lib/stock.test.ts` existen, `npm run test` (Vitest) pasa con los casos de stock 1, 0 y -1, línea insuficiente con "quedan N" y el detail exacto del 409, y `npm run build` compila con `has_enough_stock` en `types.ts`.

- [x] T5: Etiqueta "Sin stock" en el catálogo y región "Cascos destacados" (RF1–RF5, RF8)
  Hecho cuando: `StockBadge` y `.badge--stock` existen; en `/productos` la región "Cascos destacados" se localiza por rol y nombre y muestra "Sin stock" solo en "Casco Trekking Allround"; en `/productos?categoria=cascos` y en la búsqueda "Trekking" la tarjeta también la muestra; el orden y los links no cambian; en escala de grises la etiqueta se sigue leyendo.

- [x] T6: Detalle sin stock: sin invitación a iniciar sesión (RF6, RF7)
  Hecho cuando: sin sesión, `/productos/casco-linea-08` muestra "Sin stock" y no muestra "Inicia sesión para añadir al carrito"; con un producto con stock la invitación sigue; con sesión, "Añadir al carrito" está deshabilitado en el casco sin stock y habilitado en uno con stock.

- [x] T7: Marca de stock en las líneas del carrito (RF13)
  Hecho cuando: con una línea con `has_enough_stock: false`, `/carrito` muestra "Sin stock" (stock ≤ 0) o "Stock insuficiente: quedan N" (0 < stock < cantidad) solo en esa línea; "Quitar" y el resto de la pantalla siguen igual. Verificado bajando el stock a mano en la base local o simulando la respuesta.

- [x] T8: Aviso al entrar al checkout y pago deshabilitado (RF14)
  Hecho cuando: con una línea sin stock suficiente, `/checkout` muestra una alerta (`role="alert"`) con "Uno o más productos de tu carrito ya no tienen stock suficiente. Revisá tu carrito." y el link "Ir al carrito", y "Pagar con Stripe" está deshabilitado; sin problemas de stock no hay alerta y el botón está habilitado.

- [x] T9: Diálogo "Sin stock suficiente" cuando el pago se rechaza con 409 (RF15)
  Hecho cuando: con un 409 en `POST /orders/checkout` (bajando el stock a mano después de entrar al checkout, o simulándolo), se abre el diálogo con nombre accesible "Sin stock suficiente", el foco va a "Ir al carrito", Escape y "Cerrar" lo cierran, "Ir al carrito" lleva a `/carrito`, no hay redirección a Stripe y el resumen se actualiza (aparece la alerta de T8). Otros errores del pago se siguen mostrando como hoy.

- [x] T10: Menú "Todos los productos" y verificación final (RF16)
  Hecho cuando: el menú "Tienda" y el menú lateral muestran "Todos los productos" y llevan a `/productos`; en verde: `cd frontend; npm run build; npm run test`, `cd backend; pytest` (unit + `-m integration`) y `cd e2e; npm run test:api; npm run test:ui`. Queda la lista de selectores tocados para el resumen y el riesgo "las compras no descuentan stock" para anotar en `MEMORY.md`.
