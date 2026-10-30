# MEMORY.md — Estado y decisiones del proyecto

Memoria viva del proyecto. Se lee al empezar cada sesión y se actualiza al cerrar cada paso.
Reglas de trabajo: [`AGENTS.md`](AGENTS.md).

## Estado actual

- **Repo:** público en GitHub (`FerPazAutomation/ecommerce-bike`), recreado el 2026-10-05 con historial limpio. Rama remota: `main` (PRs #1, #2 y #3 mergeados).
- **Rama activa:** `test/cart-items-api` (sale de `main`).
- **Paso en curso (tests):** Carrito API **terminado** (7 tests en `e2e/tests/api/cart-items.spec.ts`, plan en `specs/001-cart-api/test-plan.md`). Falta PR `test/cart-items-api` → `main`.
- **Último verde (2026-10-29):** 18 tests Playwright (16 API + 2 UI), 16 pytest `-m integration`. Vitest (36) y `npm run build` sin cambios desde el 2026-09-30 (no se tocó el front).
- **Sistema multiagente:** coordinador (`/coordinar`, skill `ebike-coordinator`) + subagentes `planner`, `implementer`, `reviewer` en `.cursor/agents/`. Guía: [`docs/GUIA_AGENTES.md`](docs/GUIA_AGENTES.md). Primer uso real: flujo de tests del bloque Carrito API.

## Roadmap

- [x] Scaffold `e2e/` (Playwright + TS, projects `api` y `ui`)
- [x] Health API
- [x] Auth API: login OK, contraseña incorrecta, email inexistente, register + login
- [x] Login UI con Page Object (válido / inválido)
- [x] Retirar el E2E viejo en Python (primero archivado, después borrado; queda en el historial de git)
- [x] API protegida con token (`/cart`: sin token, token inválido, sin `Bearer`, token válido)
- [x] Helpers `getToken`, `authHeader` y `newUserToken` en `e2e/helpers/auth.ts`
- [x] **PR `practice/test-rebuild` → `main`**
- [x] Carrito API (agregar, sumar, reemplazar, borrar línea, ítem ajeno, errores de stock en POST y PATCH) — `test/cart-items-api`, falta PR
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
- [ ] Catálogo: filtros en la URL y estado "Sin stock" en tarjetas

### Casos UI nuevos para automatizar (los escribe Fernando)

- [ ] Login con email inválido o contraseña vacía → error por campo, sin llamar a la API
- [ ] Ir a `/carrito` sin sesión → login → vuelve a `/carrito`
- [ ] Token inválido en `localStorage` + `/carrito` → login con aviso "Tu sesión expiró"
- [ ] Checkout con carrito vacío → botón "Pagar con Stripe" deshabilitado
- [ ] Registro con contraseña débil (`abcdefghi`, `123456789`, `abcd1234`) → advertencia por campo, sin llamar a la API
- [ ] Registro con "Repetir contraseña" distinta → "Las contraseñas no coinciden"
- [ ] API: `POST /auth/register` con contraseña sin número → 422 con el mensaje de la política
- [ ] API: `POST /auth/change-password` con la misma contraseña → 422 "distinta de la actual"

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
- `GET /products` expone `stock` por producto. El carrito no descuenta stock (solo valida).
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
