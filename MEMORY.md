# MEMORY.md — Estado y decisiones del proyecto

Memoria viva del proyecto. Se lee al empezar cada sesión y se actualiza al cerrar cada paso.
Reglas de trabajo: [`AGENTS.md`](AGENTS.md).

## Estado actual

- **Rama activa:** `practice/test-rebuild` (pusheada a `origin`).
- **Paso en curso:** API protegida con token (`e2e/tests/api/cart.spec.ts`).
- **Último verde:** 7 tests Playwright (5 API + 2 UI) y 13 tests `pytest -m integration`.

## Roadmap

- [x] Scaffold `e2e/` (Playwright + TS, projects `api` y `ui`)
- [x] Health API
- [x] Auth API: login OK, contraseña incorrecta, email inexistente, register + login
- [x] Login UI con Page Object (válido / inválido)
- [x] Archivar E2E viejo en Python (`backend/tests/_legacy/`)
- [ ] API protegida con token (`/cart`: sin token, token inválido, sin `Bearer`, token válido)
- [ ] Helper `getToken` en `e2e/helpers/auth.ts`
- [ ] **PR `practice/test-rebuild` → `main`**
- [ ] Carrito API (agregar, actualizar, borrar ítems)
- [ ] Catálogo / carrito UI
- [ ] Checkout (Stripe sandbox) — último, es el más frágil
- [ ] CI con GitHub Actions (`npm run test:api` primero)

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

## Datos útiles de la API

- `POST /auth/login` → `{ access_token, token_type: "bearer" }`; credenciales malas → 401 `"Incorrect email or password"`.
- Rutas protegidas (`/cart`, `/orders`) con `Authorization: Bearer <token>`:
  - sin header o sin `Bearer` → 401 `"Not authenticated"`
  - token inválido → 401 `"Invalid token"`
  - usuario inexistente/inactivo → 401 `"User not found"`
- `GET /cart` → `{ items: [], subtotal: "0" }` — `subtotal` es **string** (Decimal).
- Swagger: http://127.0.0.1:8000/docs

## Errores conocidos (y su solución)

| Síntoma | Causa | Solución |
|---------|-------|----------|
| Front no abre en `127.0.0.1:5173` | Vite en IPv6 | Usar `localhost:5173` (o `host` en `vite.config.ts`). |
| Login 422 con email `.test` | email-validator rechaza dominios reservados | Usar `@example.com`. |
| Docker arriba pero la web no anda | Docker solo levanta Postgres | Levantar también API y front. |
| pytest abre navegadores / pide `--browser` | `addopts` viejo de pytest-playwright | No usar `addopts` de Playwright en `pyproject.toml`. |

## Registro de sesiones

- **2026-09-25** — PASO 1: health + auth API, `users.ts`, docs con Swagger y usuario demo, fix del seed.
- **2026-09-28** — Login UI con POM; commit y push de `e2e/`.
- **2026-09-29** — Limpieza del repo (legacy archivado, CVs fuera). Arranca API con token. Se crean `AGENTS.md` y `MEMORY.md`.
