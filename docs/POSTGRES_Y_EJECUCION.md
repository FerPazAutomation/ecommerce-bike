# PostgreSQL y ejecución del proyecto (Windows)

La aplicación espera esta URL (definida en `backend/.env`):

```text
postgresql://ebike:ebike_dev@localhost:5433/ebike_tucson
```

**Por qué el puerto 5433:** en muchos equipos Windows ya hay un PostgreSQL instalado que escucha en **5432**. Si `DATABASE_URL` apunta a `localhost:5432`, la API puede estar hablando con **esa** instancia (usuario/contraseña distintos) en lugar del contenedor Docker, y verás fallos de autenticación o *Internal Server Error* al cargar la tienda. El `docker-compose.yml` publica la base del proyecto en **5433** del host para evitar ese choque.

## Opción recomendada: Docker Desktop + `docker compose`

1. Instala **Docker Desktop** para Windows: https://www.docker.com/products/docker-desktop/
2. Reinicia si el instalador lo pide y **abre Docker Desktop**; espera a que diga que el motor está en ejecución.
3. En la raíz del proyecto (`ecommerce-bike`):

```powershell
docker compose up -d
```

4. Comprueba que el puerto **5433** del host esté mapeado al contenedor (`docker compose ps` o `Test-NetConnection 127.0.0.1 -Port 5433`).

5. Backend (primera vez: venv e instalación):

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
copy .env.example .env
alembic upgrade head
python -m scripts.seed
uvicorn app.main:application --reload --host 127.0.0.1 --port 8000
```

6. Frontend (otra terminal):

```powershell
cd frontend
npm install
npm run dev
```

7. Abre **http://localhost:5173** en el navegador.

### Script automático

Desde la raíz del repo:

```powershell
.\scripts\iniciar-dev.ps1
```

(Requiere Docker en PATH y abre dos ventanas: API y Vite.)

## Opción sin Docker: PostgreSQL instalado en Windows

1. Instala PostgreSQL desde https://www.postgresql.org/download/windows/ (recuerda la contraseña del usuario `postgres`).
2. Abre **pgAdmin** o `psql` y ejecuta:

```sql
CREATE USER ebike WITH PASSWORD 'ebike_dev';
CREATE DATABASE ebike_tucson OWNER ebike;
```

3. Si usas **solo** PostgreSQL local (sin Docker), puedes usar `localhost:5432` en `DATABASE_URL` con el usuario y contraseña que hayas definido. Si usas **Docker** como en la opción recomendada, deja la URL con **5433** como en el ejemplo de arriba.
4. Sigue los pasos de migraciones, seed y `uvicorn` / `npm run dev` como en la opción Docker.

## Validar que todo responde

| Qué | URL |
|-----|-----|
| Tienda (UI) | http://localhost:5173 |
| API | http://127.0.0.1:8000/health |
| Swagger | http://127.0.0.1:8000/docs |
| ReDoc | http://127.0.0.1:8000/redoc |

Si `/health` devuelve `{"status":"ok"}`, la API y PostgreSQL están bien.

**Usuario demo** (seed): `demo@example.com` / `demo1234` — ver [`GUIA_TESTERS.md`](GUIA_TESTERS.md).

## Nota sobre la instalación por winget

Si `winget` pide aceptar contratos del Microsoft Store, ejecuta una vez en PowerShell **como usuario**:

```powershell
winget install -e --id Docker.DockerDesktop --source winget --accept-package-agreements --accept-source-agreements
```

El instalador de Docker puede pedir **permisos de administrador**; después de instalar, **reinicia** o inicia Docker Desktop manualmente.
