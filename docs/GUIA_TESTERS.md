# Guía para testers y QA (E-bike Tucson)

Este documento resume **dónde está cada cosa** y **qué flujos probar** sin necesidad de leer todo el código.

## Estructura del monorepo

| Carpeta | Rol |
|--------|-----|
| [`frontend/`](../frontend/) | React (Vite): pantallas, formularios, llamadas HTTP al backend. |
| [`backend/`](../backend/) | FastAPI: API REST, JWT, base de datos, integración Stripe. |
| [`docs/`](../docs/) | Documentación (este archivo). |

## Flujo de autenticación (JWT)

1. El usuario envía email/contraseña a `POST /auth/login`.
2. La API responde con `access_token` (JWT).
3. El frontend guarda el token (localStorage, clave `ebike_token`) y envía `Authorization: Bearer <token>` en rutas protegidas (`/cart`, `/orders/...`).

**Casos de prueba API sugeridos:** login correcto, contraseña incorrecta, acceso a `/cart` sin token (401).

## Flujo carrito → pedido → pago (Stripe sandbox)

1. Usuario autenticado añade líneas con `POST /cart/items`.
2. `POST /orders/checkout` crea un pedido `pending` y devuelve `checkout_url` de Stripe Checkout.
3. El usuario paga en Stripe (tarjetas de prueba).
4. Stripe llama a `POST /webhooks/stripe` con un evento firmado; el backend marca el pedido como `paid` y vacía el carrito.

**Nota local:** el webhook requiere que Stripe pueda alcanzar tu máquina (p. ej. `stripe listen --forward-to localhost:8000/webhooks/stripe`) o un túnel (ngrok).

## Endpoints útiles

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/health` | No | Salud del servicio. |
| POST | `/auth/register` | No | Alta de usuario. |
| POST | `/auth/login` | No | Obtiene JWT. |
| GET | `/categories` | No | Categorías para el menú. |
| GET | `/products` | No | `?q=`, `?category_slug=`, paginación. |
| GET | `/products/{slug}` | No | Detalle. |
| GET | `/cart` | Sí | Carrito del usuario. |
| POST | `/cart/items` | Sí | Añadir/merge cantidad. |
| PATCH | `/cart/items/{id}` | Sí | Actualizar cantidad. |
| DELETE | `/cart/items/{id}` | Sí | Quitar línea. |
| POST | `/orders/checkout` | Sí | Crea pedido y sesión Stripe. |
| GET | `/orders/{id}` | Sí | Detalle del pedido del usuario. |
| POST | `/webhooks/stripe` | Firma Stripe | Confirmación de pago. |

## Automatización en Python

En [`backend/tests/`](../backend/tests/) hay pruebas con **pytest** y `TestClient`: capa de integración sobre la API (sin navegador). Comando típico (desde `backend/`):

```bash
pytest -m integration
```

Marcas: `@pytest.mark.integration` (ampliable con `unit`, `slow`, etc.).

## Datos demo (seed)

Tras migraciones, ejecutar desde `backend/`:

```bash
python -m scripts.seed
```

Usuario opcional: `demo@ebiketucson.test` / `demo1234` (si el seed lo crea).
