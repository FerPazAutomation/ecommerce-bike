# Guía para testers y QA (E-bike Tucson)

Dónde está cada cosa, **enlaces locales**, **usuario demo** y flujos a probar.

## Enlaces locales (con API + front levantados)

| Qué | URL |
|-----|-----|
| **Tienda (UI)** | http://localhost:5173 |
| **Salud API** | http://127.0.0.1:8000/health → `{"status":"ok"}` |
| **Swagger (OpenAPI interactivo)** | http://127.0.0.1:8000/docs |
| **ReDoc** | http://127.0.0.1:8000/redoc |
| **OpenAPI JSON** | http://127.0.0.1:8000/openapi.json |

En Swagger: probá `POST /auth/login` → copiá `access_token` → botón **Authorize** → pegá el token (sin `Bearer `).

Cómo arrancar Docker + API + front: [`GUIA_INICIO_CADA_SESION.md`](GUIA_INICIO_CADA_SESION.md).

## Usuario demo (seed)

Tras migraciones, desde `backend/`:

```powershell
python -m scripts.seed
```

| Campo | Valor |
|-------|--------|
| Email | `demo@example.com` |
| Password | `demo1234` |
| Nombre | Demo Shopper |

Usalo en la UI (Login) y en Swagger / tests. El seed **crea o actualiza** este usuario aunque la BD ya tenga catálogo.

> No uses emails `@….test`: el validador de la API los rechaza con **422**.

## Estructura del monorepo

| Carpeta | Rol |
|--------|-----|
| [`frontend/`](../frontend/) | React (Vite): pantallas, formularios, HTTP al backend. |
| [`backend/`](../backend/) | FastAPI: API REST, JWT, PostgreSQL, Stripe. |
| [`e2e/`](../e2e/) | Playwright + TypeScript: smoke API y E2E UI. |
| [`docs/`](../docs/) | Documentación. |

## Flujo de autenticación (JWT)

1. `POST /auth/login` con JSON `{ "email", "password" }`.
2. Respuesta: `{ "access_token": "...", "token_type": "bearer" }`.
3. El front guarda el token (`localStorage`, clave `ebike_token`) y envía `Authorization: Bearer <token>` en `/cart`, `/orders/...`.

**Casos sugeridos:** login OK (demo), contraseña incorrecta (401), `/cart` sin token (401), register + login.

## Flujo carrito → pedido → pago (Stripe sandbox)

1. Usuario autenticado: `POST /cart/items`.
2. `POST /orders/checkout` → pedido `pending` + `checkout_url` Stripe.
3. Pago con tarjeta de prueba `4242 4242 4242 4242`.
4. Webhook `POST /webhooks/stripe` marca pedido `paid` y vacía carrito.

Local: `stripe listen --forward-to http://127.0.0.1:8000/webhooks/stripe` (detalle en el README).

## Endpoints útiles

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/health` | No | Salud del servicio. |
| POST | `/auth/register` | No | Alta de usuario. |
| POST | `/auth/login` | No | Obtiene JWT. |
| GET | `/categories` | No | Categorías. |
| GET | `/products` | No | `?q=`, `?category_slug=`, paginación. |
| GET | `/products/{slug}` | No | Detalle. |
| GET | `/cart` | Sí | Carrito. |
| POST | `/cart/items` | Sí | Añadir/merge cantidad. |
| PATCH | `/cart/items/{id}` | Sí | Actualizar cantidad. |
| DELETE | `/cart/items/{id}` | Sí | Quitar línea. |
| POST | `/orders/checkout` | Sí | Pedido + sesión Stripe. |
| GET | `/orders/{id}` | Sí | Detalle del pedido. |
| POST | `/webhooks/stripe` | Firma Stripe | Confirmación de pago. |

## Automatización

### Backend (pytest, integración in-process)

```powershell
cd backend
pytest -m integration
```

### E2E / API contra stack real (Playwright + TypeScript)

Credenciales centralizadas en [`e2e/data/users.ts`](../e2e/data/users.ts).

```powershell
cd e2e
npm install
npx playwright install
npm run test:api    # health + auth
npm run test:ui     # cuando existan specs UI
npm test            # todo
```

Requiere API en `:8000` (y front en `:5173` para UI). Guía larga: [`GUIA_TESTS_AUTOMATIZADOS.md`](GUIA_TESTS_AUTOMATIZADOS.md).
