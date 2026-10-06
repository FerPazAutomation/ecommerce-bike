# E-bike Tucson

[![Tests](https://github.com/FerPazAutomation/ecommerce-bike/actions/workflows/tests.yml/badge.svg)](https://github.com/FerPazAutomation/ecommerce-bike/actions/workflows/tests.yml)

**EN —** Bike and e-bike e-commerce that I use as a real system under test for my QA Automation work.
React (Vite) + FastAPI + PostgreSQL, per-user cart and Stripe Checkout (sandbox).

| Test layer | Tool | Runs in CI |
|------------|------|------------|
| Backend API integration | pytest + TestClient (in-memory SQLite) | Yes, on every PR |
| Backend unit | pytest | Local |
| Frontend unit | Vitest | Yes, on every PR |
| API and UI end-to-end | Playwright + TypeScript ([`e2e/`](e2e)) | Local, against the running app |

Author: **Fernando Paz** · [Portfolio](https://fernando-qa-portfolio.vercel.app) · [LinkedIn](https://www.linkedin.com/in/fernandollanespaz/)

---

**ES —** E-commerce de bicicletas y e-bikes: **React (Vite)** + **FastAPI** + **PostgreSQL**, con carrito por usuario y checkout **Stripe** (sandbox).
Automatización de pruebas en tres capas: **pytest** (backend), **Vitest** (frontend) y **Playwright + TypeScript** (API y UI E2E).

## Requisitos

- Python 3.11+
- Node.js 20+
- **PostgreSQL** (recomendado vía [Docker Desktop](https://www.docker.com/products/docker-desktop/)) o instalación local (ver [`docs/GUIA_INICIO_CADA_SESION.md`](docs/GUIA_INICIO_CADA_SESION.md#trabajar-sin-docker)).

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
uvicorn app.main:application --reload --host 127.0.0.1 --port 8000
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

### Backend (pytest, SQLite en memoria — no requiere Docker)

```bash
cd backend
pytest
```

### Frontend (Vitest)

```bash
cd frontend
npm run test
```

### E2E / API real (Playwright + TypeScript)

Con API (y front si corrés UI) levantados:

```powershell
cd e2e
npm install
npx playwright install
npm run test:api
npm run test:ui
```

Datos de usuarios: [`e2e/data/users.ts`](e2e/data/users.ts). Usuario demo tras seed: `demo@example.com` / `demo1234`.

## Enlaces útiles (local)

| Qué | URL |
|-----|-----|
| Tienda | http://localhost:5173 |
| Salud API | http://127.0.0.1:8000/health |
| **Swagger** | http://127.0.0.1:8000/docs |
| ReDoc | http://127.0.0.1:8000/redoc |

## Documentación

- [`docs/GUIA_TESTERS.md`](docs/GUIA_TESTERS.md) — flujos, endpoints, usuario demo, capas de tests
- [`docs/GUIA_INICIO_CADA_SESION.md`](docs/GUIA_INICIO_CADA_SESION.md) — arranque diario y problemas frecuentes
- [`docs/TECNOLOGIAS.md`](docs/TECNOLOGIAS.md) — qué hace cada herramienta del stack
- [`AGENTS.md`](AGENTS.md) — flujo de trabajo y convenciones de los tests
