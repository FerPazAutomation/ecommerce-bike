# MEMORY.md — Estado y decisiones del proyecto

Memoria viva del proyecto. Se lee al empezar cada sesión y se actualiza al cerrar cada paso.
Reglas de trabajo: [`AGENTS.md`](AGENTS.md).

## Estado actual

- **Repo:** público en GitHub (`FerPazAutomation/ecommerce-bike`), recreado el 2026-10-05 con historial limpio. Rama remota: `main` (PRs #1 a #4 mergeados; #4 = Carrito API + sistema multiagente).
- **Rama activa:** `sim/catalogo-sin-stock` (sale de `main`). **Sin commitear todavía.** Nació como simulación del flujo de producto, pero el trabajo es real y está aprobado: conviene renombrarla a `feature/catalogo-sin-stock` antes del PR.
- **Paso en curso (producto):** spec `specs/002-catalogo-sin-stock/` **implementada** (16 RF, 10 tareas, reviewer APROBADO). Próxima acción: commits + PR. Después, casos e2e de UI para Fernando (ver "Casos UI nuevos").
- **Último verde (2026-10-30):** Playwright 18 (16 API + 2 UI), Vitest 47, pytest 48 (27 unit + 21 integration), `npm run build` OK.
- **Sistema multiagente:** coordinador (`/coordinar`, skill `ebike-coordinator`) + subagentes `planner`, `implementer`, `reviewer` en `.cursor/agents/`. Guía: [`docs/GUIA_AGENTES.md`](docs/GUIA_AGENTES.md). Usado en el flujo de tests (Carrito API) y en el flujo de producto completo (spec 002). Regla nueva: chat nuevo al 65-80 % de contexto.

## Roadmap

- [x] Scaffold `e2e/` (Playwright + TS, projects `api` y `ui`)
- [x] Health API
- [x] Auth API: login OK, contraseña incorrecta, email inexistente, register + login
- [x] Login UI con Page Object (válido / inválido)
- [x] Retirar el E2E viejo en Python (primero archivado, después borrado; queda en el historial de git)
- [x] API protegida con token (`/cart`: sin token, token inválido, sin `Bearer`, token válido)
- [x] Helpers `getToken`, `authHeader` y `newUserToken` en `e2e/helpers/auth.ts`
- [x] **PR `practice/test-rebuild` → `main`**
- [x] Carrito API (agregar, sumar, reemplazar, borrar línea, ítem ajeno, errores de stock en POST y PATCH) — PR #4
- [ ] Opcionales de Carrito API (documentados en `specs/001-cart-api/test-plan.md`): borrar uno de dos ítems y recalcular subtotal (requiere helper `getProductsWithStock`), PATCH de ítem ajeno, POST que supera stock al sumar
- [ ] Catálogo / carrito UI
- [ ] Checkout (Stripe sandbox) — último, es el más frágil
- [ ] CI con GitHub Actions (`npm run test:api` primero)

### Producto (skills `ebike-*`)

- [x] Formularios accesibles: `FormField`, validación alineada a la API, errores con `role="alert"` (login, registro, recuperar)
- [x] Sesión: `AuthProvider` + `useAuth`, `RequireAuth`, `?next=`, 401 global con aviso, logout que limpia la caché
- [x] Precios con `formatPrice` (`US$ 689,00`) y etiquetas de categoría unificadas
- [x] Carrito (label y tope de cantidad, errores visibles) y checkout con resumen del pedido
- [x] Validación de formularios: política de contraseña en API y front (espejo), `useForm`, `PasswordField` con requisitos y Mostrar/Ocultar, "Repetir contraseña" en registro y cuenta, reglas de servicio técnico
- [ ] Homepage: partir `HomePage.tsx` en secciones y estados de carga/error/vacío
- [x] Catálogo "Sin stock" (spec 002): etiqueta en grilla y "Cascos destacados" (región accesible), detalle sin invitar a login, marca de stock en el carrito, checkout que revalida stock (alerta al entrar + diálogo si el pago da 409), menú "Todos los productos", seed con `casco-linea-08` en stock 0
- [ ] Catálogo: filtros en la URL
- [ ] Descontar stock al confirmar el pago (hoy ninguna compra descuenta stock: dos compradores pueden pagar la última unidad)
- [ ] Pendientes de la spec 002 (sección final de `spec.md`): foco al cerrar el diálogo, links "Ir al carrito" duplicados, test de `seed.run()` completo, assert de `has_enough_stock` en PATCH, input de cantidad con `max=0` en el carrito

### Casos UI nuevos para automatizar (los escribe Fernando)

- [ ] Login con email inválido o contraseña vacía → error por campo, sin llamar a la API
- [ ] Ir a `/carrito` sin sesión → login → vuelve a `/carrito`
- [ ] Token inválido en `localStorage` + `/carrito` → login con aviso "Tu sesión expiró"
- [ ] Checkout con carrito vacío → botón "Pagar con Stripe" deshabilitado
- [ ] Registro con contraseña débil (`abcdefghi`, `123456789`, `abcd1234`) → advertencia por campo, sin llamar a la API
- [ ] Registro con "Repetir contraseña" distinta → "Las contraseñas no coinciden"
- [ ] API: `POST /auth/register` con contraseña sin número → 422 con el mensaje de la política
- [ ] API: `POST /auth/change-password` con la misma contraseña → 422 "distinta de la actual"
- [ ] Catálogo: `casco-linea-08` muestra "Sin stock" en `getByRole('region', { name: 'Cascos destacados' })` y con `?categoria=cascos`; ningún otro producto la muestra
- [ ] Detalle de `casco-linea-08` sin sesión → "Sin stock" y sin "Inicia sesión para añadir al carrito"; con sesión → "Añadir al carrito" deshabilitado
- [ ] Checkout con 409 simulado (`page.route` sobre `POST /orders/checkout`) → diálogo "Sin stock suficiente"; buscar "Ir al carrito" **dentro** del diálogo (hay otro link igual en la alerta) y probar Escape con `page.keyboard.press`
- [ ] Menú "Tienda" → link "Todos los productos" lleva a `/productos`

## Decisiones tomadas

| Decisión | Por qué |
|----------|---------|
| Playwright + TypeScript para E2E y API (Opción A) | Un solo stack para API y UI; alineado con ofertas de QA Automation. |
| pytest queda solo para integración in-process | Ya funciona con SQLite en memoria; no se reescribe. |
| UI `baseURL` = `http://localhost:5173` | Vite escuchaba solo en IPv6 (`::1`); `127.0.0.1` fallaba. |
| API `baseURL` = `http://127.0.0.1:8000` | Uvicorn corre en `127.0.0.1`. |
| Usuario demo `demo@example.com` / `demo1234` | El seed viejo usaba `.test` y la API lo rechaza. |
| Emails únicos con `uniqueRegisterUser()` | Register falla con 400 si el email existe; evita choques entre corridas. |
| CVs y ficha fuera del repo | Datos personales; no tienen que ver con el proyecto. |
| Mejoras de producto en ramas `feature/<tema>` con skills `ebike-*` | Separar trabajo de producto del de tests y no romper los specs. |
| Sesión centralizada en `AuthProvider` (`useAuth()`), nunca `getToken()` en páginas | Un solo lugar para login, logout y 401. |
| Ante un 401, `AuthProvider` solo marca la sesión vencida; `RequireAuth` redirige | Dos navegaciones compitiendo perdían el `expired=1`. |
| Token vencido en página pública: se cierra la sesión sin redirigir | No sacar al usuario de la home o el catálogo. |
| Mensajes de error de la API sin traducir en el front | Los tests afirman el texto exacto (`"Incorrect email or password"`). |
| Política de contraseña: > 8 caracteres, ≤ 72 bytes, letra, número, sin espacios en los bordes | Formulario "serio" sin volverse hostil; mismas reglas y mensajes en `schemas/auth.py` y `lib/validation.ts`. |
| El login no aplica la política | Usuarios existentes (ej. `demo1234`) tienen que poder entrar. |
| Validación propia (`useForm`) sin react-hook-form ni zod | Forms chicos; no suma dependencias. |
| Sistema multiagente en Cursor: coordinador = chat principal (skill + `/coordinar`), subagentes en `.cursor/agents/` | Cursor no tiene agentes principales personalizados; los subagentes no pueden hablar con Fernando a mitad de tarea. |
| Un test-plan por **bloque** (no por endpoint), con columna "Automatizar Sí/No/Opcional" y motivo | Automatizar por riesgo, no por inercia; lo no automatizado queda documentado. |
| No repetir los 401 (sin token / token inválido) en cada endpoint del carrito | Misma dependencia `get_current_user`, ya probada en `cart.spec.ts`. |
| Cantidades de stock derivadas del dato real (`product.stock + 1`), nunca fijas | Un número fijo depende del seed y falla sin bug si cambia el producto. |
| Checkout revalida stock en el backend: 409 `"Not enough stock for some cart items"` (orden: Stripe 503 → carrito vacío 400 → stock 409) | Pagar sin stock es una compra errónea grave; 409 no se confunde con el 400 `"Not enough stock"` del carrito. |
| `has_enough_stock` por línea en las respuestas del carrito, calculado en el backend | Una sola regla (`services/stock.py`) para carrito y checkout; el front solo refleja. |
| Seed idempotente deja `casco-linea-08` en stock 0 | Dato reproducible para "Sin stock"; es el último producto, queda fuera de los 24 primeros que usan los tests del carrito y dentro de "Cascos destacados". |
| En borrados, cantidad 2 | Con 1 no se distingue "borra la línea" de "resta una unidad". |
| El reviewer señala cada corrección con nombre exacto del test + `archivo:línea` + código actual → esperado | Fernando corrige a mano; "test 4" o "el segundo DELETE" confunde. |

## Datos útiles de la API

- `POST /auth/login` → `{ access_token, token_type: "bearer" }`; credenciales malas → 401 `"Incorrect email or password"`.
- Rutas protegidas (`/cart`, `/orders`) con `Authorization: Bearer <token>`:
  - sin header o sin `Bearer` → 401 `"Not authenticated"`
  - token inválido → 401 `"Invalid token"`
  - usuario inexistente/inactivo → 401 `"User not found"`
- `GET /cart` → `{ items: [], subtotal: "0" }` — `subtotal` es **string** (Decimal).
- Carrito (`backend/app/api/routers/cart.py`), todas con token:
  - `POST /cart/items` `{ product_id, quantity }` → 200 con el ítem (`id`, `quantity`, `product`, `line_total`). Si el producto ya está, **suma** la cantidad (no duplica).
  - `PATCH /cart/items/{id}` `{ quantity }` → 200; **reemplaza** la cantidad.
  - `DELETE /cart/items/{id}` → 204 sin body.
  - Errores: producto inexistente → 404 `"Product not found"`; ítem inexistente o de otro usuario → 404 `"Cart item not found"`; cantidad > stock → 400 `"Not enough stock"`; `quantity < 1` o `product_id < 1` → 422.
  - Stock: `quantity == stock` → 200; `stock + 1` → 400 y no cambia nada (ni crea la línea ni modifica la cantidad). Un POST que **al sumarse** supera el stock también da 400.
  - `DELETE /cart/items/{id}` borra la **línea entera** (no una unidad). Id `0` o `-1` → 404 (no 422, a diferencia de `POST`); id no numérico → 422 `int_parsing`. La auth se valida antes que el id (sin token + `abc` → 401).
- `GET /products` expone `stock` por producto. El carrito no descuenta stock (solo valida). Las líneas del carrito traen `has_enough_stock` (bool).
- `POST /orders/checkout` con alguna línea sin stock suficiente → 409 `{"detail":"Not enough stock for some cart items"}`; no crea orden ni llama a Stripe. Requiere `STRIPE_SECRET_KEY` (sin ella da 503 antes).
- Producto sin stock fijo del seed: `casco-linea-08` ("Casco Trekking Allround"). La grilla de "todos los productos" no muestra cascos: se ven en "Cascos destacados" o con `?categoria=cascos`.
- `POST /auth/register` y `change-password` validan la política de contraseña → 422 con `detail[].msg` en español
  (Pydantic antepone `"Value error, "`). Contraseña actual incorrecta en `change-password` → 400.
- Swagger: http://127.0.0.1:8000/docs

## Errores conocidos (y su solución)

| Síntoma | Causa | Solución |
|---------|-------|----------|
| Front no abre en `127.0.0.1:5173` | Vite en IPv6 | Usar `localhost:5173` (o `host` en `vite.config.ts`). |
| Login 422 con email `.test` | email-validator rechaza dominios reservados | Usar `@example.com`. |
| Docker arriba pero la web no anda | Docker solo levanta Postgres | Levantar también API y front. |
| pytest abre navegadores / pide `--browser` | `addopts` viejo de pytest-playwright | No usar `addopts` de Playwright en `pyproject.toml`. |
| `expect(...).toEqual(...)` falla con `Received: Promise {}` | Falta `await` antes de `response.json()` / `.text()` | `expect(await response.json()).toEqual(...)`. |
| Tests UI fallan desde el agente con `Executable doesn't exist ... cursor-sandbox-cache` | El sandbox del agente cambia `PLAYWRIGHT_BROWSERS_PATH` | Correr sin sandbox y con `Remove-Item Env:PLAYWRIGHT_BROWSERS_PATH`. En la terminal de Fernando no pasa. |

## Registro de sesiones

- **2026-09-25** — PASO 1: health + auth API, `users.ts`, docs con Swagger y usuario demo, fix del seed.
- **2026-09-28** — Login UI con POM; commit y push de `e2e/`.
- **2026-09-29** — Limpieza del repo (legacy archivado, CVs fuera). Arranca API con token. Se crean `AGENTS.md` y `MEMORY.md`.
- **2026-09-30** — Se agregan skills de producto (`.cursor/skills/ebike-*`) y comandos de flujo (`.cursor/commands/`). `AGENTS.md` pasa a tener modo tests y modo producto.
- **2026-09-30** — Primera tanda de producto con las skills: formularios, sesión, precios, carrito y checkout. Se corrige una carrera de redirecciones en la sesión vencida.
- **2026-09-30** — Validación de formularios (skill `ebike-forms` actualizada): política de contraseña en la API y el front, `useForm`, `PasswordField`, confirmación de contraseña y reglas de servicio técnico.
- **2026-10-05** — Limpieza para publicar: legacy, scripts sueltos, dependencias y docs obsoletas fuera. CVs y foto borrados de todo el historial con `git filter-repo`; repo de GitHub recreado y ramas subidas limpias.
- **2026-10-20/21** — Sistema multiagente para Cursor (coordinador + `planner`, `implementer`, `reviewer`, skill `ebike-sdd`, guía `docs/GUIA_AGENTES.md`) en `chore/agentes-cursor`, mergeado en `test/cart-items-api`.
- **2026-10-21/29** — Carrito API cerrado con el flujo de tests multiagente: test-plan del bloque (`specs/001-cart-api/`), 4 tests nuevos (DELETE línea entera, DELETE ajeno, POST y PATCH > stock), 3 vueltas de revisión. Regla nueva del reviewer: nombre exacto + `archivo:línea`.
- **2026-10-30** — PR #4 mergeado. Primer flujo de producto completo con los 3 agentes (spec 002 "Sin stock"): 2 rondas de preguntas, revisión de spec con cambios, cambio de requisitos de Fernando (revalidar stock en checkout + menú "Todos los productos"), 10 tareas del implementer, validación APROBADA 16/16 RF. Regla nueva en `AGENTS.md`: chat nuevo al 65-80 % de contexto con traspaso en `MEMORY.md`.
