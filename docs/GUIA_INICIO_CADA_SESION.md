# Guía: arrancar el proyecto cada vez que enciendes la PC (Windows)

La app necesita **tres piezas** a la vez: **PostgreSQL** (normalmente en Docker), **API FastAPI** (puerto 8000) y **frontend Vite** (puerto 5173). Si falta una o el motor de Docker no está listo, verás errores en consola o la tienda no cargará datos.

## Requisitos (una sola vez por máquina)

| Herramienta | Para qué |
|-------------|----------|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Base PostgreSQL en contenedor |
| Python 3.11+ (con **Add to PATH**) | Backend |
| Node.js 20+ | Frontend (`npm`) |

Opcional en PowerShell, si al ejecutar scripts te sale error de **ejecución de scripts**:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

## Opción A — Todo en uno (recomendada)

1. Abre **Docker Desktop** y espera a que indique que el motor está en ejecución (**Engine running**).
2. Abre **PowerShell** y ve a la carpeta del proyecto (ajusta la ruta si hace falta):

```powershell
cd $HOME\Desktop\ecommerce-bike
```

3. Ejecuta:

```powershell
.\scripts\iniciar-dev.ps1
```

El script: levanta PostgreSQL (`docker compose`), aplica migraciones, semilla datos si aplica, y abre **dos ventanas nuevas** (API y `npm run dev`). Luego abre el navegador en **http://localhost:5173**.

## Opción B — Pasos manuales (dos terminales)

Útil si prefieres controlar cada servicio o depurar errores.

### 1) Docker y base de datos

Con Docker Desktop ya en marcha, en la **raíz del repo**:

```powershell
cd $HOME\Desktop\ecommerce-bike
docker compose up -d
```

### 2) Backend (terminal 1)

```powershell
cd $HOME\Desktop\ecommerce-bike\backend
.\.venv\Scripts\Activate.ps1
```

Si la primera vez no tienes entorno virtual:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
```

Asegúrate de tener `backend\.env` (copia desde `.env.example` si no existe). Migraciones y datos de prueba:

```powershell
alembic upgrade head
python -m scripts.seed
uvicorn app.main:application --reload --host 127.0.0.1 --port 8000
```

### 3) Frontend (terminal 2)

```powershell
cd $HOME\Desktop\ecommerce-bike\frontend
npm install
```

Solo la primera vez o tras borrar `node_modules`. Luego:

```powershell
npm run dev
```

Abre **http://localhost:5173**.

## Stripe (checkout de prueba, opcional)

Si en checkout ves **«Stripe is not configured (set STRIPE_SECRET_KEY)»**, abre `backend\.env` y asigna `STRIPE_SECRET_KEY` con tu clave secreta de **prueba** de Stripe (`sk_test_...`, panel **Developers → API keys**). Guarda el archivo y **reinicia** la ventana de `uvicorn`.

Para que el pedido pase a estado pagado tras pagar con la tarjeta de prueba `4242…`, hace falta el webhook: instala [Stripe CLI](https://stripe.com/docs/stripe-cli), ejecuta `stripe listen --forward-to http://127.0.0.1:8000/webhooks/stripe`, copia el secreto `whsec_...` a `STRIPE_WEBHOOK_SECRET` en `backend\.env` y reinicia la API. Más detalle en el README del repo.

## Comprobar que todo responde

| Qué | URL esperada |
|-----|----------------|
| Tienda | http://localhost:5173 |
| Salud API | http://127.0.0.1:8000/health → `{"status":"ok"}` |
| **Swagger** | http://127.0.0.1:8000/docs |
| ReDoc | http://127.0.0.1:8000/redoc |

## Usuario demo (login / Swagger / tests)

Tras el seed (`python -m scripts.seed` desde `backend/`):

| Campo | Valor |
|-------|--------|
| Email | `demo@example.com` |
| Password | `demo1234` |

En Swagger: `POST /auth/login` → **Authorize** con el `access_token`. Más detalle: [`GUIA_TESTERS.md`](GUIA_TESTERS.md).

## Problemas frecuentes

### «El motor de Docker no responde»

Abre Docker Desktop y espera 1–2 minutos; vuelve a ejecutar el script o `docker compose up -d`.

### Error de puerto (10048 / «solo se permite un uso…»)

Otro proceso ya usa **8000**, **5173** o **5433** (PostgreSQL de Docker en este repo). Cierra la ventana del `uvicorn` o de `npm run dev` anterior, o en el Administrador de tareas termina el proceso que ocupa el puerto.

### La web carga pero no hay productos / errores de red

Suele ser la API caída o CORS/URL: confirma **http://127.0.0.1:8000/health** y que `frontend\.env` tenga `VITE_API_URL=http://localhost:8000` (o el origen que uses).

### `python` o `npm` no se reconoce

Reinstala Python/Node marcando la opción de añadir al PATH, o cierra y vuelve a abrir PowerShell tras instalar.

### PowerShell antiguo y `&&`

En versiones antiguas de PowerShell, `&&` entre comandos puede fallar. Usa `;` o ejecuta los comandos en líneas separadas.

---

Más detalle sobre PostgreSQL y URLs: [POSTGRES_Y_EJECUCION.md](POSTGRES_Y_EJECUCION.md).
