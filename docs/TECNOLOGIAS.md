# Tecnologías del proyecto E-bike Tucson

Este documento resume **qué hace** cada herramienta o librería relevante en este repositorio. Está alineado con `backend/pyproject.toml`, `frontend/package.json` y `docker-compose.yml`.

---

## Infraestructura y datos

### Docker Compose

**Qué es:** formato declarativo para definir y levantar uno o varios contenedores como un “proyecto” (servicios, redes, volúmenes).

**En este proyecto:** el archivo `docker-compose.yml` arranca **solo la base de datos** PostgreSQL en un contenedor (imagen oficial `postgres:16-alpine`), publica el servicio en el host como **5433** (mapeo `5433:5432`) para no chocar con un PostgreSQL nativo en Windows que suele usar 5432, y persiste los datos en un volumen llamado `pgdata`. No hay contenedores definidos aquí para el backend ni el frontend; la API y la web se ejecutan normalmente en tu máquina (Python/Node).

### PostgreSQL

**Qué es:** base de datos relacional de código abierto, muy usada en producción.

**En este proyecto:** almacena usuarios, productos, pedidos, etc. El driver de Python se conecta mediante SQLAlchemy + `psycopg2-binary`.

---

## Backend (Python)

### Python (≥ 3.11)

Lenguaje en el que está escrita la API. La versión mínima está fijada en `pyproject.toml`.

### FastAPI

**Qué es:** framework web para construir APIs REST con tipado, validación automática de entrada/salida y documentación OpenAPI.

**En este proyecto:** define rutas, dependencias (por ejemplo sesión de base de datos) y respuestas JSON.

### Uvicorn (`uvicorn[standard]`)

**Qué es:** servidor ASGI que ejecuta aplicaciones como FastAPI.

**En este proyecto:** proceso que escucha peticiones HTTP y las entrega a FastAPI. La variante `standard` incluye dependencias útiles para desarrollo/rendimiento (por ejemplo soporte mejorado de event loop).

### SQLAlchemy

**Qué es:** ORM (mapeo objeto–relacional) y capa de acceso a datos para Python.

**En este proyecto:** modela tablas como clases Python, ejecuta consultas y transacciones sobre PostgreSQL.

### Alembic

**Qué es:** herramienta de migraciones de esquema para SQLAlchemy.

**En este proyecto:** versiona cambios en la base de datos (crear/alterar tablas) de forma reproducible entre entornos.

### psycopg2-binary

**Qué es:** adaptador PostgreSQL para Python (driver nativo compilado).

**En este proyecto:** es el conector que SQLAlchemy usa para hablar con PostgreSQL.

### bcrypt

**Qué es:** algoritmo de hash para contraseñas, diseñado para ser lento y resistente a fuerza bruta.

**En este proyecto:** almacena contraseñas de forma segura (no en texto plano).

### python-jose (con `cryptography`)

**Qué es:** librería para trabajar con JSON Web Tokens (JWT) y operaciones criptográficas relacionadas.

**En este proyecto:** emite y valida tokens de sesión/autenticación para usuarios autenticados.

### Pydantic Settings (`pydantic-settings`)

**Qué es:** carga configuración desde variables de entorno o archivos con validación de tipos.

**En este proyecto:** centraliza ajustes como URL de base de datos, claves de Stripe, secretos JWT, etc.

### python-multipart

**Qué es:** soporte para parsear formularios `multipart/form-data` en aplicaciones ASGI.

**En este proyecto:** necesario cuando la API recibe datos tipo formulario o subida de archivos (según las rutas que lo usen).

### Stripe (SDK Python)

**Qué es:** plataforma de pagos; el paquete `stripe` es el cliente oficial para crear sesiones de pago, consultar eventos, etc.

**En este proyecto:** crea sesiones de **Stripe Checkout** y procesa **webhooks** para confirmar pagos y actualizar el estado de los pedidos.

### email-validator

**Qué es:** validación de direcciones de correo según reglas estándar.

**En este proyecto:** suele usarse junto con Pydantic para validar emails en modelos de entrada.

---

## Herramientas de desarrollo (backend)

### HTTPX

Cliente HTTP moderno para Python, usado en tests para llamar a la API sin navegador.

### pytest, pytest-asyncio, pytest-cov

- **pytest:** framework de tests.
- **pytest-asyncio:** ejecuta tests asíncronos (compatibles con FastAPI).
- **pytest-cov:** informes de cobertura de código.

### Factory Boy

Genera datos de prueba (factories) para poblar modelos en tests de forma reproducible.

### setuptools (build)

Empaqueta el proyecto Python (`pyproject.toml` + `[tool.setuptools]`) para instalar el paquete `app` en modo editable si hace falta.

---

## Frontend (Node / navegador)

### Node.js y npm

Entorno de ejecución JavaScript y gestor de paquetes: instala dependencias (`package.json` / `package-lock.json`) y ejecuta scripts (`npm run dev`, `npm run build`).

### TypeScript

**Qué es:** JavaScript con tipos estáticos; se compila a JavaScript.

**En este proyecto:** todo el código fuente del frontend en `frontend/src` está pensado para tipado fuerte y mejor autocompletado.

### React y React DOM

**Qué es:** librería para construir interfaces con componentes y estado.

**En este proyecto:** páginas (catálogo, carrito, checkout, login, etc.) y componentes reutilizables.

### Vite

**Qué es:** herramienta de desarrollo y empaquetado: servidor de desarrollo muy rápido y build de producción basado en Rollup/esbuild.

**En este proyecto:** arranca el entorno local (`npm run dev`) y genera el bundle para despliegue (`npm run build`).

### @vitejs/plugin-react

Plugin de Vite que habilita Fast Refresh y compilación de JSX/TSX para React.

### TanStack React Query (`@tanstack/react-query`)

**Qué es:** gestión de estado **servidor** (caché, reintentos, sincronización) para datos que vienen de la API.

**En este proyecto:** evita duplicar lógica manual de `fetch`, loading y errores en los componentes.

### React Router (`react-router-dom`)

**Qué es:** enrutamiento del lado del cliente (URLs, navegación, rutas anidadas).

**En este proyecto:** define qué página se muestra según la ruta (`/`, `/productos`, `/carrito`, etc.).

### CSS (p. ej. `index.css`)

Estilos en cascada propios del proyecto (sin framework CSS obligatorio listado en `package.json`).

---

## Resumen rápido

| Área        | Rol principal                                      |
|------------|-----------------------------------------------------|
| Docker Compose | Levantar PostgreSQL en contenedor local        |
| PostgreSQL | Persistencia relacional                           |
| FastAPI + Uvicorn | API HTTP REST                              |
| SQLAlchemy + Alembic + psycopg2 | Datos y migraciones        |
| JWT + bcrypt | Autenticación y contraseñas                     |
| Stripe     | Pagos online y webhooks                           |
| React + TypeScript + Vite | Interfaz web moderna                  |
| React Query + React Router | Datos de API y navegación          |

Si añades más servicios (por ejemplo Redis, cola de trabajos o contenedores para la API), conviene actualizar este archivo junto con `docker-compose.yml` y las dependencias.
