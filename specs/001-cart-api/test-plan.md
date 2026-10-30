# Test plan — 001 Carrito API

Estado: implementada
Modo: tests
Pedido original: "seguir trabajando con el test de DELETE de api" → re-alcance: "¿hay que automatizar los 9 casos del DELETE? ¿un test-plan por cada endpoint?"
Rama: test/cart-items-api
Alcance: `POST /cart/items`, `PATCH /cart/items/{id}`, `DELETE /cart/items/{id}` (y `GET /cart` para verificar el estado después de cada acción).
Spec destino: `e2e/tests/api/cart-items.spec.ts` (mismo `test.describe('Cart Items API', ...)`)
Resumen: **19 filas** → Sí: **7** (4 escritos + 3 pendientes) · Opcional: **3** · No: **9**
Datos: sin archivos nuevos en `e2e/data/`. Usuario siempre `newUserToken()` (usa `uniqueRegisterUser()` por dentro), nunca `users.demo`: todos los casos modifican o afirman estado del carrito.
Reutilizar: `newUserToken`, `authHeader` (`e2e/helpers/auth.ts`); `getProductWithStock`, `addCartItem`, tipos `CartItem` y `Product` (`e2e/helpers/cart.ts`).
Crear: nada para los Sí. `getProductsWithStock` solo si se hace el opcional 8 (ver "Helper diferido").

## Decisiones

| Decisión | Alternativa descartada | Por qué |
|----------|------------------------|---------|
| **Un plan por bloque ("Carrito API")** y la suite automatiza un subconjunto priorizado por riesgo; el plan documenta qué no se automatiza y por qué (2026-10-23) | Un test-plan por endpoint (GET, POST, PATCH, DELETE) y automatizar todos los casos de cada uno | Los cuatro endpoints comparten router, auth (`get_current_user`) y datos (carrito del usuario). Separarlos repetía casos de 401 y de validación del framework que no agregan riesgo. Así queda una suite chica, de alto valor, y la cobertura descartada queda escrita (sirve para portfolio y para retomarla). |
| Se automatizan: happy path de cada endpoint + IDOR en DELETE + los dos errores de stock | Automatizar también 401 por endpoint, ids inválidos y doble borrado | Lo que más daño haría si se rompe es: que no funcione la operación, que un usuario toque el carrito de otro, o que se pueda pedir más de lo que hay. El resto es la misma dependencia o validación de FastAPI/Pydantic. |
| En los casos de stock, la cantidad se calcula como `product.stock + 1` con el producto que devuelve `getProductWithStock` | Hardcodear `11` (stock actual del producto 1) | El stock depende del seed y puede cambiar; con el valor leído en el mismo test el caso sigue siendo "uno más que el stock" aunque cambie la base. |
| El DELETE de la línea usa **quantity 2** | Quantity 1 | Con 1 no se distingue "borra la línea" de "resta una unidad"; mismo criterio que usan los tests de suma y reemplazo (cantidades distintas). |
| Opcional 8 usa un helper nuevo `getProductsWithStock(request, minStock, count)` — **diferido** | Filtrar `GET /products` inline en el test | Inline duplicaría la lógica de `getProductWithStock` y choca con la regla "2+ veces → helper" de `AGENTS.md`. Se escribe solo si se retoma el opcional 8. |

Decisiones anteriores que **dejan de estar vigentes** con el re-alcance: "mantener el caso de token inválido en DELETE" y "ids `999999999` y `0` como dos tests separados" (esos casos pasan a No).

**Cierre (2026-10-29):** 7 casos automatizados en `e2e/tests/api/cart-items.spec.ts` (suite API 16/16 en verde); los 3 opcionales y los 9 no automatizados quedan documentados en la tabla de casos para retomarlos más adelante.

## Código bajo prueba

- `backend/app/api/routers/cart.py`:
  - `add_item`: busca el producto activo (si no → 404 `"Product not found"`); si `stock < quantity` → 400 `"Not enough stock"`; si ya hay línea del mismo producto, suma y vuelve a validar (`existing + quantity > stock` → 400 `"Not enough stock"`).
  - `update_item`: busca `CartItem` por `id` **y** `user_id` (si no → 404 `"Cart item not found"`); si `quantity > stock` → 400 `"Not enough stock"`; si no, reemplaza la cantidad.
  - `delete_item`: mismo filtro por `id` y `user_id` (si no → 404); borra la fila entera → 204.
- Orden de validación: auth → schema (422) → existencia/dueño (404) → stock (400). Un ítem ajeno con cantidad enorme da 404, no 400.
- Schemas (`backend/app/schemas/cart.py`): `product_id >= 1`, `quantity >= 1` → si no, 422.
- Auth: `get_current_user` (`backend/app/api/deps.py`), ya cubierta en `e2e/tests/api/cart.spec.ts` (sin token, sin `Bearer`, token inválido).

## Comportamiento real observado

**2026-10-21** (DELETE, usuarios nuevos A y B `planner-*@example.com`):

| Request | Status | Body |
|---------|--------|------|
| A borra su ítem (de 2) | 204 | vacío; `GET /cart` recalcula `subtotal` con el ítem que queda |
| A borra su último ítem (**qty 2**) | 204 | vacío; `GET /cart` → `{"items":[],"subtotal":"0"}` (borra la línea, no una unidad) |
| **B** borra el ítem de A | 404 | `{"detail":"Cart item not found"}`; el ítem de A sigue en su carrito |
| A borra dos veces / id `999999999` / `0` / `-1` / 20 dígitos | 404 | `{"detail":"Cart item not found"}` |
| id `abc` o `1.5` | 422 | `detail[0].type = "int_parsing"`, `loc = ["path","item_id"]` |
| Sin token / sin `Bearer` / `Bearer invalid-token` | 401 | `"Not authenticated"` / `"Not authenticated"` / `"Invalid token"`; el ítem sigue |
| `DELETE /cart/items` (sin id) | 405 | `{"detail":"Method Not Allowed"}` |

**2026-10-23** (stock, usuario nuevo `planner-a-*@example.com`, producto 1 con `stock: 10`, `price: "689.00"`):

| Request | Status | Body |
|---------|--------|------|
| `POST /cart/items` qty **11** (stock + 1), carrito vacío | 400 | `{"detail":"Not enough stock"}`; `GET /cart` → `{"items":[],"subtotal":"0"}` (no crea línea) |
| `POST /cart/items` qty **10** (== stock) | 200 | ítem con `quantity: 10`, `line_total: "6890.00"` (el límite se acepta) |
| `POST /cart/items` qty **1** más (merge 10 + 1 > 10) | 400 | `{"detail":"Not enough stock"}`; `GET /cart` sigue con `quantity: 10`, `subtotal: "6890.00"` |

**2026-10-26** (confirmado por el coordinador, usuarios nuevos `coord-*@example.com`, producto 1 con `stock: 10`):

| Request | Status | Body |
|---------|--------|------|
| `PATCH /cart/items/{id}` a **11** (stock + 1), ítem con quantity 1 | 400 | `{"detail":"Not enough stock"}`; `GET /cart` después: la cantidad sigue en 1 |
| `PATCH /cart/items/{id}` a **10** (== stock) | 200 | `quantity: 10`, `line_total: "6890.00"` (el límite se acepta) |
| **B** hace `PATCH` del ítem de A | 404 | `{"detail":"Cart item not found"}` |
| `POST /cart/items` con `product_id: 999999999` | 404 | `{"detail":"Product not found"}` |

**Pendiente de confirmar en vivo** (esperado según `add_item`; no afecta a ningún caso Sí):

| Request | Esperado según el código |
|---------|--------------------------|
| `POST` que por merge queda **exactamente** en el stock (5 + 5 con stock 10) | 200, `quantity: 10` |

## Casos

| # | Endpoint | Test (comportamiento) | Esperado (status + body) | Prioridad | Automatizar | Estado | Motivo si No |
|---|----------|-----------------------|--------------------------|-----------|-------------|--------|--------------|
| 1 | POST + GET | "POST /cart/items adds a product and GET /cart returns the added product" | POST 200 con `product.id`, `quantity: 1`, `line_total` = precio. `GET /cart` 200, `items` = `[itemAdded]`, `subtotal` = `line_total` | Alta | Sí | escrito | — |
| 2 | POST + GET | "POST /cart/items with the same product twice sums the quantity" | Segundo POST 200, mismo `id`, `quantity` 1 + 2 = 3, `line_total` = precio × 3. `GET /cart` 200 con una sola línea | Alta | Sí | escrito | — |
| 3 | PATCH + GET | "PATCH /cart/items/{id} replaces the quantity" | PATCH 200, mismo `id`, `quantity` 3 (no 5), `line_total` = precio × 3. `GET /cart` 200 con esa línea | Alta | Sí | escrito | — |
| 4 | DELETE + GET | "DELETE /cart/items/{id} removes the whole line and GET /cart returns an empty cart" | Ítem con **quantity 2**. DELETE 204 y body vacío. `GET /cart` 200 `{ items: [], subtotal: "0" }` | Alta | Sí | escrito | — |
| 5 | DELETE + GET | "DELETE /cart/items/{id} of another user's item returns 404 and keeps the item" | DELETE con token del intruso → 404 `{ detail: "Cart item not found" }`. `GET /cart` del **dueño** 200, `items` = `[addedItem]` | Alta (seguridad / IDOR) | Sí | escrito | — |
| 6 | POST + GET | "POST /cart/items with quantity above stock returns 400 and keeps the cart empty" (nombre final; en el plan: "... returns 400") | POST con `quantity: product.stock + 1` → 400 `{ detail: "Not enough stock" }`. `GET /cart` 200 `{ items: [], subtotal: "0" }` | Alta | Sí | escrito | — |
| 7 | PATCH + GET | "PATCH /cart/items/{id} with quantity above stock returns 400 and keeps the quantity" | Ítem con quantity 1; PATCH a `product.stock + 1` → 400 `{ detail: "Not enough stock" }`. `GET /cart` 200, `items` = `[addedItem]` | Alta | Sí | escrito | — |
| 8 | DELETE + GET | "DELETE /cart/items/{id} removes only that item and recalculates the subtotal" | Dos productos distintos (qty 2 y 1); DELETE del de qty 2 → 204. `GET /cart` 200, `items` = `[keptItem]`, `subtotal` = `keptItem.line_total` | Media | Opcional | — | Diferido: necesita el helper nuevo `getProductsWithStock`. El caso 4 ya cubre "borra la línea"; este suma el recálculo con más de un ítem. |
| 9 | PATCH + GET | "PATCH /cart/items/{id} of another user's item returns 404 and keeps the item" | PATCH con token del intruso → 404 `{ detail: "Cart item not found" }`. `GET /cart` del dueño 200, `items` = `[addedItem]` | Media (seguridad) | Opcional | — | Mismo filtro `id + user_id` que el DELETE del caso 5; vale si se quiere cubrir IDOR en los dos endpoints que modifican. |
| 10 | POST + GET | "POST /cart/items that exceeds stock when merged returns 400 and keeps the quantity" | Ítem con `quantity: product.stock`; POST de 1 más → 400 `{ detail: "Not enough stock" }`. `GET /cart` 200, `items` = `[addedItem]` | Media | Opcional | — | Es una segunda validación de stock distinta (rama de merge, observada en vivo). Prioridad menor que el caso 6 porque el error y el mensaje son los mismos. |
| 11 | POST / PATCH / DELETE | "… without token returns 401" | 401 `{ detail: "Not authenticated" }` | Media | No | — | Misma dependencia `get_current_user` ya probada en `cart.spec.ts` con `GET /cart`. |
| 12 | POST / PATCH / DELETE | "… with invalid token returns 401" | 401 `{ detail: "Invalid token" }` | Media | No | — | Ídem 11. |
| 13 | POST / PATCH / DELETE | "… with token but without Bearer returns 401" | 401 `{ detail: "Not authenticated" }` | Baja | No | — | Ídem 11. |
| 14 | DELETE | "DELETE /cart/items/{id} twice returns 404 the second time" | 404 `{ detail: "Cart item not found" }` | Baja | No | — | Mismo camino que "id inexistente"; bajo riesgo. |
| 15 | DELETE | "DELETE /cart/items/{id} with a non-existent id returns 404" | 404 `{ detail: "Cart item not found" }` | Baja | No | — | El 404 por "no encontrado" ya se ejercita en el caso 5 (con más valor). |
| 16 | DELETE | "DELETE /cart/items/0 (or -1) returns 404" | 404 `{ detail: "Cart item not found" }` | Baja | No | — | Mismo camino que id inexistente; ver "Posibles bugs" (asimetría con POST). |
| 17 | DELETE | "DELETE /cart/items/abc returns 422" | 422, `detail[0].type = "int_parsing"` | Baja | No | — | Validación del framework (FastAPI/Pydantic), no lógica propia. |
| 18 | POST | "POST /cart/items with a non-existent product returns 404" | 404 `{ detail: "Product not found" }` | Baja | No | — | Camino simple sin estado; candidato a Opcional si se quiere cubrir cada error del router. |
| 19 | POST / PATCH | "… with quantity == stock is accepted" / "… with quantity 0 returns 422" | 200 / 422 | Baja | No | — | El borde lo fija el caso > stock (stock + 1 rechazado); `== stock` aceptado quedó observado en vivo. `quantity 0` es validación de Pydantic (`ge=1`). |

Las filas 11-13 agrupan los tres endpoints para no repetir el mismo motivo; si algún día se automatizan, sería un test por endpoint.

## Notas para escribir los pendientes

- **Stock sin hardcodear (casos 6 y 7)**: `const product = await getProductWithStock(request, 1);` y usar `product.stock + 1` como cantidad. En el caso 7 también sirve `addedItem.product.stock` (lo devuelve el POST). No poner `11` ni ningún número fijo: el stock depende del seed.
- **Qué afirmar además del 400 (casos 6 y 7)**: el `GET /cart` posterior es lo que da valor — que no se creó la línea (caso 6: `{ items: [], subtotal: "0" }`) o que la cantidad no cambió (caso 7: `items` igual a `[addedItem]`). Afirmar el body con `toEqual({ detail: 'Not enough stock' })`, no solo el status.
- **Caso 7, cantidad inicial 1**: además del 400, conviene afirmar con un `GET /cart` posterior que la cantidad **no cambió** (sigue en 1, observado en vivo el 2026-10-26). Con `toEqual([addedItem])` se compara también `quantity` y `line_total`; si un PATCH rechazado llegara a guardar la cantidad igual, solo este assert lo detecta.
- **Caso 5 (IDOR)**: dos `newUserToken` (dueño e intruso). El 404 (y no 403) es intencional en el router: no revela si el id existe en el carrito de otro. Vale un comentario corto en el test.
- **Caso 4 (en revisión)**: hoy el archivo en disco tiene el test como `'DELETE /cart/items/{id} removes the item from the cart'` con `addCartItem(..., 1)` y `getProductWithStock(request, 1)`. Para que pruebe "borra la línea entera" debería usar quantity **2** (y `getProductWithStock(request, 2)`), y conviene el nombre de la tabla. Opcional: afirmar el body vacío del 204 con `await removeResponse.text()` igual a `''` (no llamar a `.json()` con body vacío).
- **Ids**: nunca hardcodear ids de `CartItem` (son autoincrementales y globales); usar `addedItem.id`.
- **`toEqual([item])` compara también `product` (precio y stock)**: riesgo bajo de falso fallo si alguien corre el seed o un checkout en medio de la corrida. Mismo criterio que los tests existentes; si da flaky, comparar `id`, `quantity` y `line_total`.
- Estilo: igual que los tests existentes del archivo (comentarios `(Arrange step)` / `(Act step)` / `(Assert step)`, comillas simples, 4 espacios).
- **Orden sugerido**: 5 (DELETE de otro usuario) → 6 (POST > stock) → 7 (PATCH > stock). Después, si hay tiempo, los opcionales 9 → 10 → 8.

## Helper diferido: `getProductsWithStock` (solo para el opcional 8)

- Firma: `getProductsWithStock(request: APIRequestContext, minStock: number, count: number): Promise<Product[]>` en `e2e/helpers/cart.ts`.
- Hace `GET /products` y afirma 200 con mensaje (como `getProductWithStock`); devuelve los primeros `count` productos **distintos** con `stock >= minStock`; si hay menos, falla con un mensaje claro (ej. `Expected 2 products with stock >= 2, found 1`).
- Paginación: `GET /products` devuelve 24 por defecto (`limit` máximo 100; el seed actual tiene 29). Para 2 productos alcanza la primera página.
- Sugerencia: `getProductWithStock` podría pasar a ser `(await getProductsWithStock(request, minStock, 1))[0]`; si se hace, volver a correr todo `cart-items.spec.ts`.

## Posibles bugs

- Ninguno bloqueante. Observaciones para decidir con Fernando (no tocar el backend):
  - **Validación inconsistente con POST**: `POST /cart/items` con `product_id < 1` da 422, pero `DELETE /cart/items/0` y `/-1` dan 404 (el `item_id` del path no tiene `ge=1`). Asimétrico, no incorrecto.
  - **Formato del subtotal**: con ítems llega con dos decimales (`"840.00"`) y vacío llega `"0"` (no `"0.00"`). Ya afirmado en `cart.spec.ts`; los casos 4 y 6 dependen de que siga siendo `"0"`.
  - **El carrito no reserva stock**: dos usuarios pueden tener cada uno `quantity == stock` del mismo producto (la validación es por carrito, no global). Es una decisión de diseño conocida (`MEMORY.md`: "el carrito no descuenta stock"); el control real tendría que estar en el checkout. No se prueba en este bloque.
  - **Header del 204**: trae `content-type: application/json` sin body. Inofensivo; no afirmar sobre ese header.
