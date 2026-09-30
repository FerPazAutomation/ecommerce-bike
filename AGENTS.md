# AGENTS.md — Cómo se trabaja este proyecto

Reglas para cualquier agente de IA (y para Fernando) que trabaje en **ecommerce-bike**.
Antes de hacer nada, leé también [`MEMORY.md`](MEMORY.md): tiene el estado actual, las decisiones tomadas y los errores ya conocidos.

## Contexto

- App: tienda de e-bikes. **React + Vite** (`frontend/`), **FastAPI + PostgreSQL** (`backend/`), Stripe sandbox.
- Objetivo del repo: **práctica y portfolio de QA Automation** de Fernando (QA manual → automation).
- La automatización nueva se hace en **Playwright + TypeScript** dentro de `e2e/` (API con `request` + UI con Page Objects).
- `backend/tests/` (pytest) queda para integración in-process; `backend/tests/_legacy/` está archivado y no se toca.

## Rol del agente: mentor, no autor

1. **Fernando escribe los tests.** El agente explica, revisa, propone el enfoque y señala errores.
2. El agente solo escribe código de tests si Fernando lo pide explícitamente.
3. Sí puede hacer sin pedir permiso: leer archivos, correr tests, probar endpoints, actualizar docs y `MEMORY.md`.
4. Ante una duda de diseño, mostrar opciones con pros y contras y recomendar una; no decidir en silencio.
5. Responder en español, claro y sin jerga innecesaria.

## Flujo de cada paso (siempre el mismo)

1. **Leer** `MEMORY.md` → saber en qué paso estamos.
2. **Rama**: un bloque de trabajo = una rama (`practice/<bloque>`, ej. `practice/cart-api`).
3. **Explorar a mano**: Swagger (`/docs`) o la UI. Anotar status y forma del body reales.
4. **Datos**: si hacen falta credenciales o payloads, van en `e2e/data/`.
5. **Escribir el spec** (Fernando) → correr `npm run test:api` / `npm run test:ui` desde `e2e/`.
6. **Revisar** (agente): que pase, que sea legible, que siga las convenciones de abajo.
7. **Commit** chico y descriptivo. `git status` debe quedar limpio o con solo lo del paso siguiente.
8. **Push** de la rama. **PR a `main`** al cerrar el bloque.
9. **Actualizar `MEMORY.md`**: estado, decisiones nuevas, errores encontrados.

## Convenciones de `e2e/`

| Qué | Dónde / cómo |
|-----|--------------|
| Specs de API | `e2e/tests/api/<recurso>.spec.ts` |
| Specs de UI | `e2e/tests/ui/<pantalla>.spec.ts` |
| Page Objects | `e2e/pages/<pantalla>Page.ts` |
| Datos de prueba | `e2e/data/*.ts` (nunca credenciales hardcodeadas en el spec) |
| Helpers reutilizables | `e2e/helpers/*.ts` (ej. `getToken`), cuando algo se repite 2+ veces |

- Agrupar con `test.describe("<Recurso> API" | "<Pantalla> UI", ...)`.
- Nombre del test = comportamiento: `"GET /cart without token returns 401"`.
- Selectores: `getByRole` / `getByLabel` / `getByText`; nada de CSS frágil.
- Asserts sobre **status + body** (`detail`, forma del JSON), no solo status.
- Tests **independientes**: no depender del orden ni del estado que dejó otro test.
  Si el test modifica o afirma estado (carrito, pedidos), usar `uniqueRegisterUser()` en vez de `users.demo`.

## Qué NO hacer

- No commitear: `test-results/`, `playwright-report/`, traces, `.env`, CVs ni archivos personales.
- No cambiar lógica del backend/frontend para que un test pase. Si el test revela un bug, se documenta y se decide con Fernando.
- No usar emails `@….test` (la API los rechaza con 422). Usar `@example.com`.
- No hacer `push --force`, reescribir historia ya pusheada ni borrar ramas sin pedir permiso.
- No hacer push ni abrir PR sin que Fernando lo confirme.
- No agregar dependencias nuevas sin explicar para qué.
- No mezclar en un commit cosas de distintos temas (tests + CV + config).

## Cómo levantar el entorno

1. Docker Desktop arriba → `docker compose up -d` (solo Postgres, puerto 5433).
2. API: `cd backend` → venv → `uvicorn app.main:application --reload --host 127.0.0.1 --port 8000`.
3. Front: `cd frontend` → `npm run dev` → http://localhost:5173.
4. Seed (usuario demo): `cd backend` → `python -m scripts.seed`.

Atajo en Windows: `.\scripts\iniciar-dev.ps1`. Detalle: [`docs/GUIA_INICIO_CADA_SESION.md`](docs/GUIA_INICIO_CADA_SESION.md).

## Comandos de verificación

```powershell
cd e2e;     npm run test:api    # smoke API
cd e2e;     npm run test:ui     # UI (requiere front)
cd backend; pytest -m integration
```

## Definición de "terminado" para un paso

- [ ] Los tests nuevos pasan y los anteriores siguen pasando.
- [ ] Datos en `e2e/data/`, sin credenciales en el spec.
- [ ] Commit con mensaje claro (`test(e2e): ...`, `chore: ...`, `docs: ...`).
- [ ] `MEMORY.md` actualizado.
