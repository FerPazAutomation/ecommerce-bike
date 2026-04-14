# E-bike Tucson

E-commerce de bicicletas y e-bikes: **React (Vite)** + **FastAPI** + **PostgreSQL**, con carrito por usuario, checkout **Stripe** (sandbox) y pruebas **pytest**.

## Requisitos

- Python 3.11+
- Node.js 20+
- **PostgreSQL** (recomendado vía [Docker Desktop](https://www.docker.com/products/docker-desktop/)) o instalación local; guía detallada: [`docs/POSTGRES_Y_EJECUCION.md`](docs/POSTGRES_Y_EJECUCION.md).

## Inicio rápido (Windows, PowerShell)

Con Docker ya instalado y en ejecución, en la raíz del proyecto:

```powershell
.\scripts\iniciar-dev.ps1
```

Guía paso a paso para cada sesión (Docker, puertos, errores típicos): [`docs/GUIA_INICIO_CADA_SESION.md`](docs/GUIA_INICIO_CADA_SESION.md).

## 1. Base de datos

```bash
docker compose up -d
```

Credenciales por defecto (ver [`docker-compose.yml`](docker-compose.yml)): usuario `ebike`, contraseña `ebike_dev`, base `ebike_tucson`.

## 2. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -e ".[dev]"
copy .env.example .env
alembic upgrade head
python -m scripts.seed
uvicorn app.main:application --reload --host 0.0.0.0 --port 8000
```

Variables opcionales en `.env`: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `FRONTEND_URL`.

### Stripe (modo prueba / checkout)

1. Crea cuenta en [Stripe](https://stripe.com) y entra en **Developers → API keys**.
2. Copia la **Secret key** de prueba (`sk_test_...`) en `backend/.env` como `STRIPE_SECRET_KEY=...` (sin comillas).
3. Reinicia la API (`uvicorn`). El botón «Pagar con Stripe» debe redirigir al Checkout alojado por Stripe.
4. Tarjeta de prueba: `4242 4242 4242 4242`, cualquier CVC y fecha futura.
5. Para que el pedido quede **pagado** en la base de datos, el evento `checkout.session.completed` debe llegar al webhook: en local usa [Stripe CLI](https://stripe.com/docs/stripe-cli) (`stripe login` una vez), luego `stripe listen --forward-to http://127.0.0.1:8000/webhooks/stripe`, pega el `whsec_...` en `STRIPE_WEBHOOK_SECRET` y vuelve a reiniciar la API.

## 3. Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Abre `http://localhost:5173`.

## 4. Tests

```bash
cd backend
pytest
```

Los tests usan SQLite en memoria (no requieren Docker).

## Documentación para testers

Ver [`docs/GUIA_TESTERS.md`](docs/GUIA_TESTERS.md).
