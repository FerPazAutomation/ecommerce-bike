# 002 — Estado "Sin stock" en el catálogo y revalidación de stock en el checkout

Estado: implementada
Modo: producto
Pedido original: "Estado 'Sin stock' en el catálogo: etiqueta en la tarjeta y botón de agregar deshabilitado cuando stock = 0."
Ampliación (Fernando, al aprobar): "haría un check de stock hasta llegar a la última pantalla de pago [...] si hubo un cambio de que alguien se llevó el último, no lo deje avanzar o le dé un pop up [...] 'uno de tus productos ya no tiene stock, revisa tu carrito'. Otra cosa: en Tienda dice 'Todas las bicicletas' y debería decir 'Todos los productos' porque también trae los cascos."
Roadmap: `MEMORY.md` → "Catálogo: filtros en la URL y estado 'Sin stock' en tarjetas" (solo la parte de Sin stock).

## Problema / por qué

Hoy el catálogo muestra todas las tarjetas iguales, tengan o no stock: el usuario recién se entera de que un producto
no se puede comprar cuando entra al detalle. Además, en el detalle, un visitante sin sesión ve "Inicia sesión para
añadir al carrito" aunque el producto esté agotado, lo que lo lleva a loguearse para nada.
Más grave: el checkout no vuelve a validar el stock, así que se puede pagar un producto que se quedó sin stock después
de agregarlo al carrito (una compra errónea). Por último, el menú "Tienda" dice "Todas las bicicletas" aunque el
catálogo también trae cascos, y hoy ningún producto de los datos de demo tiene stock 0, así que el caso no se puede ver ni automatizar.

## Definiciones

- **Sin stock**: producto con stock menor o igual a 0 (el 0 es el caso normal; un negativo es un dato inválido que se trata igual).
- **Con stock**: producto con stock mayor o igual a 1.
- **Stock suficiente** (línea del carrito): el stock del producto es mayor o igual a la cantidad de la línea.
- **Aviso de stock** (texto fijo): "Uno o más productos de tu carrito ya no tienen stock suficiente. Revisá tu carrito."

## Requisitos funcionales

### Catálogo y detalle

- RF1: Mientras un producto esté sin stock (stock ≤ 0), el sistema deberá mostrar la etiqueta "Sin stock" en su tarjeta de la grilla de productos del catálogo, en cualquier vista de la grilla (catálogo completo, filtrado por categoría o resultado de búsqueda).
- RF2: Mientras un casco esté sin stock (stock ≤ 0), el sistema deberá mostrar la etiqueta "Sin stock" en su tarjeta de la vista previa "Cascos destacados" del catálogo.
- RF3: Mientras un producto tenga stock mayor o igual a 1, el sistema no deberá mostrar la etiqueta "Sin stock" en su tarjeta.
- RF4: El sistema deberá mantener visibles los productos sin stock en el catálogo, en el mismo orden que los demás, y su tarjeta deberá seguir llevando al detalle del producto.
- RF5: El sistema deberá anunciar el estado "Sin stock" de una tarjeta a los lectores de pantalla como texto, sin depender solo del color ni de un ícono.
- RF6: Mientras un usuario sin sesión vea el detalle de un producto sin stock (stock ≤ 0), el sistema deberá mostrar "Sin stock" y no deberá invitarlo a iniciar sesión para añadirlo al carrito.
- RF7: Mientras un usuario con sesión vea el detalle de un producto sin stock (stock ≤ 0), el sistema deberá mostrar "Sin stock" y el botón "Añadir al carrito" deshabilitado.
- RF8: El sistema deberá exponer la vista previa de cascos del catálogo como una región con el nombre accesible "Cascos destacados", localizable por rol y nombre.

### Datos de demostración

- RF9: Cuando se cargan los datos de demostración, el sistema deberá dejar con stock 0 exactamente uno de los cascos existentes que se muestran en "Cascos destacados", tanto con la base vacía como con la base ya cargada, sin modificar el stock de ningún otro producto.
- RF10: Si los datos de demostración se cargan más de una vez, entonces el sistema deberá terminar en el mismo estado: sin productos ni categorías duplicados y con el mismo casco en stock 0.

### Carrito y checkout (regla de negocio en la API; el front la refleja)

- RF11: Cuando un usuario con sesión inicia el pago (`POST /orders/checkout`) y alguna línea del carrito con producto activo no tiene stock suficiente (incluye stock ≤ 0), el sistema deberá responder **409** con `{"detail": "Not enough stock for some cart items"}`, sin crear la orden, sin crear la sesión de pago y sin modificar el carrito.
- RF12: El sistema deberá indicar en cada línea del carrito que devuelve la API (`GET /cart` y las respuestas de `POST`/`PATCH /cart/items`) si tiene stock suficiente, mediante el campo booleano `has_enough_stock`, calculado con la misma regla que usa el checkout.
- RF13: Mientras una línea del carrito no tenga stock suficiente, el sistema deberá marcarla en la pantalla del carrito con "Sin stock" (stock ≤ 0) o "Stock insuficiente: quedan N" (0 < stock < cantidad), como texto legible por lectores de pantalla.
- RF14: Cuando un usuario entra a la pantalla de checkout y alguna línea de su carrito no tiene stock suficiente, el sistema deberá mostrar el aviso de stock como alerta, con un link "Ir al carrito", y deberá deshabilitar el botón "Pagar con Stripe".
- RF15: Si el pago se rechaza por falta de stock (RF11), entonces el sistema deberá mostrar un diálogo modal accesible titulado "Sin stock suficiente", con el aviso de stock y la acción "Ir al carrito", y deberá actualizar el resumen del pedido con el stock actual.

### Navegación

- RF16: El sistema deberá mostrar el link al catálogo completo del menú "Tienda" (escritorio) y del menú lateral (móvil) con el texto "Todos los productos".

## Casos límite

- Stock exactamente 1 → la tarjeta no muestra "Sin stock" y, en el detalle con sesión, "Añadir al carrito" está habilitado. Se verifica con tests unitarios de la lógica, no con datos de demo.
- Stock negativo (dato inválido) → se trata como sin stock: tarjeta con "Sin stock", detalle igual que con stock 0 y línea del carrito "Sin stock". Se verifica con tests unitarios, no con datos de demo.
- Stock 0 con sesión → tarjeta con "Sin stock"; en el detalle, "Sin stock" y "Añadir al carrito" deshabilitado (RF7).
- Stock 0 sin sesión → tarjeta con "Sin stock"; en el detalle, "Sin stock" y sin el texto "Inicia sesión para añadir al carrito" (RF6).
- Stock ≥ 1 sin sesión → el detalle sigue invitando a iniciar sesión para añadir al carrito (sin cambios).
- El casco sin stock en el catálogo completo → aparece en "Cascos destacados"; la grilla del catálogo completo no muestra cascos (comportamiento actual), así que en la grilla se ve al filtrar por la categoría Cascos o al buscarlo por nombre.
- Producto sin stock en una búsqueda o en una categoría filtrada → aparece en el resultado con la etiqueta, no se oculta.
- Base de Fernando ya cargada → al volver a cargar los datos de demo, el casco elegido pasa a stock 0 aunque ya existiera con otro stock.
- Línea con cantidad igual al stock → tiene stock suficiente: sin marca en el carrito, sin aviso en el checkout y el pago avanza.
- Varias líneas, una sola sin stock suficiente → el checkout se rechaza entero (409); el carrito marca solo esa línea.
- Producto inactivo en el carrito → no cuenta para la regla de stock (el checkout ya lo ignora hoy); comportamiento sin cambios.
- Carrito vacío → sigue respondiendo 400 `"Cart is empty"` (se evalúa antes que el stock).
- Stripe sin configurar → sigue respondiendo 503 `"Stripe is not configured (set STRIPE_SECRET_KEY)"` (se evalúa antes que el carrito, como hoy).
- El stock cambia entre que el usuario entra al checkout y aprieta "Pagar con Stripe" → la API rechaza con 409 y se muestra el diálogo (RF15).
- El usuario corrige el carrito (quita la línea o baja la cantidad) y vuelve al checkout → el aviso desaparece y el pago se habilita.
- Accesibilidad → las etiquetas son texto real en español, legibles por lectores de pantalla, y se distinguen por algo más que el color. El diálogo tiene rol de diálogo, nombre accesible ("Sin stock suficiente"), recibe el foco al abrirse y se cierra con Escape.
- Tests de carrito existentes → necesitan productos con stock ≥ 3 entre los primeros 24 de `GET /products`; como solo cambia un casco que queda fuera de esos 24, siguen encontrando productos. El campo nuevo `has_enough_stock` aparece igual en `POST`, `PATCH` y `GET /cart`, así que las comparaciones entre esas respuestas siguen coincidiendo, y el carrito vacío sigue siendo `{ items: [], subtotal: "0" }`.
- Nombre accesible del link de la tarjeta → **impacto aceptado**: en las tarjetas sin stock, el nombre del link incluye "Sin stock" además del nombre del producto. Ningún test actual depende de ese nombre.
- Otros nombres accesibles existentes (heading "Productos", heading "Cascos", heading "Checkout", botones "Añadir al carrito", "Quitar" y "Pagar con Stripe", link "Ver todos los cascos", link "Volver al carrito") → no cambian. El link "Todas las bicicletas" pasa a "Todos los productos" (RF16); ningún test actual lo usa.

## Fuera de alcance

- Botón nuevo de agregar al carrito en las tarjetas del catálogo (opción 1b): las tarjetas siguen siendo un link al detalle.
- Etiqueta "Sin stock" en las tarjetas de destacados de la home (opción 2c): queda para el bloque de homepage.
- Ordenar al final u ocultar los productos sin stock (opción 4b).
- Aviso de "Últimas unidades" para stock bajo (opción 4c).
- Datos de demo extra con stock 1 o negativo: esos casos se cubren con tests unitarios.
- Descontar o reservar stock al pagar (ni al crear la orden ni en el webhook de Stripe).
- Ajustar o quitar automáticamente las líneas sin stock del carrito: el usuario decide.
- Bloquear el link "Ir al checkout" del carrito: el bloqueo está en el checkout.
- Filtros del catálogo reflejados en la URL (la otra mitad del ítem del roadmap).
- Cambios en las reglas de stock de `POST`/`PATCH /cart/items` (siguen con 400 `"Not enough stock"`).

## Riesgos detectados (para otro bloque)

- **Las compras no descuentan stock**: ningún endpoint lo descuenta (ni el carrito, ni el checkout, ni el webhook). Con esta spec, el checkout rechaza productos cuyo stock ya no alcanza, pero dos compradores pueden pagar a la vez la última unidad, porque pagar no la consume. El caso "alguien se llevó el último" solo queda cubierto del todo cuando el pago descuente stock. Se registra en `MEMORY.md` para decidir con Fernando.

## Decisiones de Fernando

| # | Pregunta | Decisión |
|---|----------|----------|
| 1 | ¿Botón de agregar en la tarjeta si hoy no existe? | Solo la etiqueta "Sin stock" en la tarjeta; no se agrega botón nuevo (1a). |
| 2 | ¿En qué tarjetas? | Grilla de `/productos` y vista previa "Cascos destacados" de `/productos`; la home queda fuera (2b). |
| 2b | ¿Ajuste en el detalle? | Sí, mínimo: si no hay stock, no invitar a iniciar sesión para comprar. |
| 3 | ¿Producto en el carrito que quedó sin stock? | Primero quedó fuera de alcance (3a); **reemplazada por la decisión 10**. |
| 4 | ¿Orden, visibilidad y texto? | Siguen visibles, mismo orden, texto exacto "Sin stock", igual que el detalle (4a). |
| 5 | ¿Cómo verificar si hoy no hay stock 0? | Los datos de demo cargan al menos un producto con stock 0; el detalle se define en el plan (5a). |
| 6 | ¿Cómo queda en stock 0 si la base ya tiene datos? | La carga de datos de demo deja en stock 0 un producto ya existente también con la base cargada, y es idempotente (correrla varias veces no duplica nada). |
| 7 | ¿Cuántos productos sin stock y cuál? | Uno solo: uno de los 8 cascos existentes, para que aparezca en la grilla (categoría Cascos o búsqueda) y en "Cascos destacados". La elección concreta va en el plan, sin afectar a los productos que usan los tests del carrito. |
| 8 | ¿Cómo verificar stock 1 y stock negativo? | Con tests unitarios de la lógica, sin datos extra. "Stock menor o igual a 0" = sin stock pasa a requisito explícito. |
| 9 | ¿Contrato de accesibilidad? | Se acepta que el nombre del link de la tarjeta incluya "Sin stock" (impacto aceptado). "Cascos destacados" pasa a ser una región con nombre accesible. |
| 10 | ¿El checkout revalida el stock? | Sí. Se revalida en la API al pagar y se avisa antes, al entrar al checkout. Si no hay stock suficiente no deja avanzar y muestra un aviso ("pop up") que manda a revisar el carrito; el carrito marca la línea afectada. |
| 11 | ¿Texto del menú "Tienda"? | "Todas las bicicletas" pasa a "Todos los productos", porque el catálogo también trae cascos. |
| 12 | ¿Aprobación? | Spec aprobada con los cambios 10 y 11; se implementa sin frenar en el plan (que igual queda escrito). |

## Criterios de aceptación

- [ ] RF1: con los datos de demo cargados, la tarjeta del casco sin stock muestra "Sin stock" en la grilla al filtrar por la categoría Cascos y al buscarlo por nombre. Un test unitario confirma que la lógica considera sin stock a stock 0 y a stock negativo.
- [ ] RF2: en `/productos`, dentro de la región "Cascos destacados", la tarjeta del casco sin stock muestra "Sin stock".
- [ ] RF3: con los datos de demo, ninguna otra tarjeta del catálogo muestra "Sin stock". Un test unitario confirma que la lógica considera con stock a stock 1.
- [ ] RF4: el casco sin stock aparece en la misma posición que antes del cambio y al hacer clic en su tarjeta se abre su detalle.
- [ ] RF5: en el árbol de accesibilidad del navegador (o con un lector de pantalla), la tarjeta sin stock expone el texto "Sin stock"; con la pantalla en escala de grises la etiqueta sigue siendo distinguible.
- [ ] RF6: sin sesión, el detalle del casco sin stock muestra "Sin stock" y no muestra "Inicia sesión para añadir al carrito"; en el detalle de un producto con stock la invitación sigue apareciendo.
- [ ] RF7: con sesión, el detalle del casco sin stock muestra "Sin stock" y el botón "Añadir al carrito" está deshabilitado.
- [ ] RF8: en `/productos`, la vista previa de cascos se puede localizar como región por el nombre accesible "Cascos destacados".
- [ ] RF9: después de cargar los datos de demo sobre una base vacía y también sobre la base ya cargada, `GET /products?limit=100` devuelve exactamente un producto con stock 0 (un casco de la vista previa) y el resto con el mismo stock que tenían antes.
- [ ] RF10: después de cargar los datos de demo dos veces seguidas, la cantidad total de productos no cambia y el mismo casco sigue en stock 0.
- [ ] RF11: con una línea cuya cantidad supera el stock (o con stock 0), `POST /orders/checkout` responde 409 `{"detail": "Not enough stock for some cart items"}`, `GET /orders` no muestra una orden nueva, no se llama a Stripe y `GET /cart` devuelve el mismo carrito. Con cantidad igual al stock, el checkout responde 200 como hoy.
- [ ] RF12: `GET /cart` devuelve `has_enough_stock: true` en una línea con cantidad ≤ stock y `false` cuando la cantidad supera el stock o el stock es ≤ 0; `POST` y `PATCH /cart/items` devuelven el mismo campo.
- [ ] RF13: en `/carrito`, la línea sin stock suficiente muestra "Sin stock" o "Stock insuficiente: quedan N" según corresponda, y las demás líneas no muestran marca.
- [ ] RF14: al entrar a `/checkout` con una línea sin stock suficiente se ve una alerta con el aviso de stock y el link "Ir al carrito", y el botón "Pagar con Stripe" está deshabilitado. Sin problemas de stock no hay alerta y el botón está habilitado.
- [ ] RF15: si el stock baja después de entrar al checkout, al apretar "Pagar con Stripe" se abre un diálogo "Sin stock suficiente" con el aviso de stock y "Ir al carrito", que lleva a `/carrito`; no hay redirección a Stripe.
- [ ] RF16: el menú "Tienda" (escritorio) y el menú lateral (móvil) muestran "Todos los productos" y llevan a `/productos`; "Todas las bicicletas" ya no aparece.
- [ ] Los specs de `e2e/` existentes (incluidos los del carrito), los tests de Vitest y los de pytest siguen pasando sin cambiar selectores.

## Pendientes tras la validación

Validación del reviewer: APROBADO (16/16 RF, todas las suites en verde). Quedan para otro paso:

1. **Escape del diálogo (RF15)**: confirmar con teclas reales en un spec de UI que Escape cierra el diálogo "Sin stock suficiente".
2. **Accesibilidad del diálogo (RF15)**: con el diálogo abierto hay dos links "Ir al carrito" (el de la alerta y el del diálogo), y al cerrarlo el foco queda en `body` en lugar de volver a "Pagar con Stripe".
3. **Test del seed**: falta un test de la carga completa de datos de demo (`run()`), no solo de la función que deja el casco en stock 0 (RF9, RF10).
4. **pytest de `PATCH /cart/items`**: falta afirmar `has_enough_stock` en la respuesta de `PATCH` (RF12).
5. **Riesgo: pagar no descuenta stock.** Ningún endpoint lo descuenta, así que dos compradores pueden pagar a la vez la última unidad. Hay que decidirlo con Fernando en otro bloque.
6. **Bug previo (no lo introdujo esta spec)**: en `/carrito`, con un producto en stock 0, el input de cantidad queda con `max=0` y `min=1`, un rango imposible.
