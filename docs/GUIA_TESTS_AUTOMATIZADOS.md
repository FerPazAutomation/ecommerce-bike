# Guía para integrar tests automatizados (Python, pytest y Playwright)

Este documento explica **por qué** conviene automatizar pruebas, **qué estructura** suele usarse y **cómo** encajan **pytest** (API/backend) y **Playwright** (navegador / E2E) en un proyecto como el tuyo, para que puedas añadir tests después en la carpeta `tests` sin reinventar convenciones.

**Para quién está pensado:** perfil **QA manual** que aprende **automatización** orientado a empleos que piden **Python, pytest y Playwright**, con rutas de práctica en **ecommerce-bike**, referencias de documentación oficial y una introducción a **CI/CD** y **observabilidad** (logs / análisis con **Datadog** como ejemplo).

---

## 0. Estado actual en ecommerce-bike (léeme primero)

La práctica activa de E2E/API contra el stack real está en **`e2e/`** con **Playwright + TypeScript** (no pytest-playwright). Los tests de integración **in-process** del backend siguen en **pytest** (`backend/tests/`).

| Pieza | Dónde | Comando |
|-------|--------|---------|
| Integración API (SQLite) | `backend/tests/integration/` | `cd backend` → `pytest -m integration` |
| Smoke API + E2E UI | `e2e/tests/api/`, `e2e/tests/ui/` | `cd e2e` → `npm run test:api` / `npm test` |
| Datos de usuarios | `e2e/data/users.ts` | Importar en los specs |

**Enlaces locales**

| Qué | URL |
|-----|-----|
| Tienda | http://localhost:5173 |
| Salud | http://127.0.0.1:8000/health |
| Swagger | http://127.0.0.1:8000/docs |
| ReDoc | http://127.0.0.1:8000/redoc |

**Usuario demo** (después de `python -m scripts.seed` en `backend/`): `demo@example.com` / `demo1234`

Estructura Playwright TS:

```
e2e/
  playwright.config.ts     # projects: api (:8000) y ui (:5173)
  data/users.ts            # credenciales y factories
  tests/api/*.spec.ts      # request API (health, auth, …)
  tests/ui/*.spec.ts       # navegador + POM (próximos pasos)
```

El resto de esta guía (secciones 1+) sigue siendo válida como **mapa conceptual** (pirámide, pytest, CI, Datadog). Para el día a día de la rebuild Option A, usá la carpeta `e2e/` y [`GUIA_TESTERS.md`](GUIA_TESTERS.md).

---

## 1. Por qué automatizar tests

| Motivo | Qué ganas |
|--------|-----------|
| **Regresión** | Al cambiar código, un test falla si rompiste algo que antes funcionaba. |
| **Documentación viva** | Un test describe el comportamiento esperado (ej.: “login devuelve token”). |
| **Confianza para refactorizar** | Puedes reorganizar módulos sabiendo que la suite te avisa. |
| **Velocidad en CI** | Misma verificación repetible en cada push o merge, sin depender solo de prueba manual. |
| **Coste acotado** | El esfuerzo de escribir el test se paga con menos bugs en producción y menos retrabajo. |

La automatización **no sustituye** el criterio humano ni el diseño; **complementa** la revisión manual en flujos repetitivos y críticos (login, checkout, permisos, etc.).

---

## 2. Pirámide de tests (dónde encaja cada herramienta)

```
        /\
       /  \     E2E (pocos, lentos): Playwright — flujo real en navegador
      /____\
     /      \   Integración (varios): pytest + API — HTTP, BD, servicios
    /________\
   /          \  Unitarios (muchos, rápidos): funciones puras, validaciones
  /______________\
```

- **Unitarios**: piezas pequeñas aisladas (hash de contraseña, parsers, reglas de negocio).
- **Integración**: tu API con FastAPI `TestClient`, BD en memoria (como en `backend/tests/conftest.py`).
- **E2E (end-to-end)**: usuario “real” en el frontend contra backend levantado; aquí entra **Playwright**.

En **ecommerce-bike** ya tienes **tests de integración** con pytest marcados `@pytest.mark.integration` bajo `backend/tests/integration/`. Los tests **con Playwright** encajan como capa **E2E** o, si solo llamas a URLs sin UI, como “smoke” del stack completo.

---

## 3. Rol de cada herramienta en este stack

| Herramienta | Uso típico en tu proyecto |
|-------------|---------------------------|
| **Python** | Un solo lenguaje para backend, scripts y tests E2E. |
| **pytest** | Descubre tests (`test_*.py`), fixtures (`conftest.py`), marcadores (`integration`), reportes y plugins. |
| **Playwright** | Controla Chromium/Firefox/WebKit: navegar, clic, rellenar formularios, comprobar texto visible. |

**pytest** ya orquesta tus tests de API. **Playwright** se integra con pytest mediante el plugin oficial **`pytest-playwright`**: obtienes fixtures como `page`, `browser`, `context` y puedes fijar `base_url` para ir a tu frontend.

---

## 4. Estructura de carpetas recomendada

Puedes **mantener** lo que ya tienes y **añadir** una carpeta para E2E sin mezclar responsabilidades:

```
backend/
  tests/
    conftest.py              # fixtures API (client, db_session) — ya existente
    integration/
      test_auth_and_catalog.py
      test_cart_and_checkout.py
      services/                 # opcional: tests agrupados por “servicio” HTTP (ej. registro)
        test_register.py
    e2e/                     # opcional: E2E que asumen API + front levantados
      test_checkout_flow.py  # Playwright + pytest
```

**Alternativa** (tests E2E en la raíz del repo, si el front y el back se levantan juntos):

```
e2e/
  conftest.py                # base_url, playwright config
  test_catalog.py
```

Criterio práctico:

- Todo lo que use **`TestClient`** y la app FastAPI in-process → `backend/tests/integration/`.
- Todo lo que abra **navegador** → carpeta `e2e` (dentro de `backend/tests` o en raíz), con Playwright.

---

## 5. pytest: lo que ya aplica a tu proyecto

- **Descubrimiento**: archivos `test_*.py` y funciones `test_*`.
- **Configuración**: en `backend/pyproject.toml`, sección `[tool.pytest.ini_options]` (`testpaths`, `markers`).
- **Fixtures compartidas**: `backend/tests/conftest.py` (por ejemplo `client` con BD SQLite en memoria).

Para ejecutar solo integración:

```bash
cd backend
pytest -m integration
```

Para añadir un test nuevo: mismo patrón que `test_auth_and_catalog.py` (fixture `client`, asserts sobre `status_code` y JSON).

---

## 6. Playwright con pytest: instalación y configuración

### 6.1 Dependencias

En el entorno del backend (o un entorno `dev` dedicado a tests), instala:

```bash
pip install pytest-playwright playwright
playwright install
```

`playwright install` descarga los navegadores (Chromium, etc.). En CI suele ejecutarse una vez en el pipeline.

Añade a `pyproject.toml` bajo `[project.optional-dependencies] dev` (o grupo equivalente), por ejemplo:

```text
pytest-playwright>=0.4.0
playwright>=1.49.0
```

Luego `pip install -e ".[dev]"` o el comando que uses para instalar extras.

### 6.2 Configuración mínima en `pyproject.toml`

```toml
[tool.pytest.ini_options]
# ... lo que ya tienes ...
base_url = "http://127.0.0.1:5173"   # ejemplo: Vite; ajusta al puerto de tu frontend
```

O usa variable de entorno `PLAYWRIGHT_BASE_URL` si el puerto cambia entre entornos.

### 6.3 Ejemplo de test E2E (esqueleto)

```python
# backend/tests/e2e/test_home.py
import pytest
from playwright.sync_api import Page, expect


@pytest.mark.e2e
def test_home_loads(page: Page, base_url: str):
    page.goto(base_url)
    expect(page).to_have_title(/.*/)  # ajusta al título real de tu app
```

Define el marcador `e2e` en `[tool.pytest.ini_options] markers` igual que `integration`.

**Requisito**: con el test anterior, el **servidor del frontend (y si hace falta el backend)** debe estar **en marcha** antes de lanzar pytest, salvo que configures un fixture que arranque procesos (más avanzado). En desarrollo suele ser: terminal 1 — API; terminal 2 — `npm run dev`; terminal 3 — `pytest backend/tests/e2e`.

--- 

## 7. Buenas prácticas breves

1. **Tests deterministas**: datos de prueba fijos o limpieza entre tests; evita depender del orden.
2. **Selectores estables**: preferir `data-testid` o roles accesibles (`get_by_role`) frente a CSS frágil.
3. **Marcadores**: `@pytest.mark.integration` vs `@pytest.mark.e2e` para filtrar (`pytest -m e2e`).
4. **No duplicar todo**: la API ya cubierta en integración no hace falta repetirla en E2E salvo un flujo crítico de usuario.
5. **CI**: fase rápida (unit + integration) en cada commit; E2E en rama principal o nocturno si son lentos.

---

## 8. Resumen: qué integrar después en tu carpeta `tests`

| Objetivo | Dónde | Herramienta |
|----------|--------|-------------|
| Nuevo endpoint o regla en la API | `backend/tests/integration/` | pytest + `client` |
| Flujo completo en la tienda (carrito, pago simulado) | `backend/tests/e2e/` o `e2e/` | pytest + Playwright |
| Función pura o utilidad | `backend/tests/` (subcarpeta `unit/` o `integration/services/` si crece) | pytest |
| Lógica o componentes en el front | `frontend/src/**/*.test.{ts,tsx}` | Vitest (+ RTL para UI) |

Con esto tienes el mapa conceptual y los nombres concretos (pytest, Playwright, marcadores, carpetas) para ir añadiendo archivos en `tests` de forma ordenada y alineada con **ecommerce-bike**.

---

## 9. Paso a paso: qué tests añadir primero (backend y frontend)

Sigue este orden para **máximo valor con poco fricción**: primero lo que no necesita navegador ni servicios externos levantados a mano.

### Fase A — Backend (pytest)

| Paso | Dónde | Qué añadir | Por qué primero |
|------|--------|------------|-----------------|
| A1 | `backend/tests/integration/` | Tests de rutas que ya usan `client` (auth, catálogo, carrito) | Ya tienes plantilla; cada endpoint nuevo debería tener al menos un caso feliz + uno de error. |
| A2 | `backend/tests/integration/` | Endpoint público simple (ej. `GET /health`) | Comprueba que la app arranca y responde; útil en CI como smoke. |
| A3 | `backend/tests/unit/` (crear carpeta cuando toque) | Funciones puras: seguridad, validaciones, helpers sin HTTP | Rápidos; no montan BD si no hace falta. |
| A4 | `backend/tests/e2e/` + Playwright | Solo cuando quieras validar **flujo usuario + UI** contra API real | Más lento; requiere front (y API) en marcha o orquestación en CI. |

**Prioridad práctica:** mantener **integración API** al día con cada feature → luego **unit** donde el código sea fácil de aislar → **E2E** para 1–3 flujos críticos (login, añadir al carrito, checkout).

### Fase B — Frontend (Vitest + TypeScript)

| Paso | Dónde | Qué añadir | Por qué primero |
|------|--------|------------|-----------------|
| B1 | `frontend/src/**/**/*.test.ts` | Funciones puras (`lib/`, helpers, formateo) | Sin DOM; mismo runner que Vite; muy rápido. |
| B2 | `frontend/src/**/*.test.tsx` | Componentes con **React Testing Library** + `jsdom` | Comprueba que la UI renderiza textos, estados y eventos sin navegador real. |
| B3 | Playwright (pytest o `npx playwright test`) | Flujos completos multi-página | Cubre lo que unit + RTL no ven (routing real, cookies, red). |

**Prioridad práctica:** tests en **lib y hooks** → **páginas o componentes críticos** (formulario login, carrito) → **E2E** acotado.

### Comandos rápidos

```bash
# Backend (desde carpeta backend)
pytest -m integration

# Frontend (desde carpeta frontend)
npm install
npm run test
```

---

## 10. Ejemplos en el repo (para copiar estructura)

### 10.1 Backend — integración API

- **Archivo:** `backend/tests/integration/test_health.py`
- **Lenguaje:** Python 3.11+
- **Frameworks:** **pytest** (runner y aserciones), **FastAPI** `TestClient` (cliente HTTP contra la app en proceso).
- **Estructura:** el nombre del archivo empieza por `test_`; cada función `test_*` es un caso. La fixture **`client`** viene de `backend/tests/conftest.py` y inyecta BD SQLite en memoria y overrides de `get_db`.

Flujo del test: `client.get("/health")` → asserts sobre `status_code` y cuerpo JSON.

### 10.4 Backend — `test_auth_and_catalog.py` (desglose)

**Archivo:** `backend/tests/integration/test_auth_and_catalog.py`  
**Carpeta:** `backend/tests/integration/` — misma convención que el resto: tests que llaman a la API real en proceso con `TestClient` y la BD de prueba definida en `conftest.py`.

#### Cómo se construyeron los tests

1. **Una función = un escenario.** Cada `def test_*` es un caso independiente que pytest descubre y ejecuta por el prefijo `test_` en el nombre (convención pytest, configurada vía `testpaths` en `backend/pyproject.toml`).
2. **HTTP vía `client`.** Los endpoints se invocan con `client.post(...)`, `client.get(...)`, igual que haría un cliente externo. Las rutas incluyen el prefijo del router (`/auth/...`, `/categories`, `/products`) porque así están montadas en `app/main.py`.
3. **Datos en BD cuando hace falta.** Los tests de auth solo usan la API (el registro escribe en BD). El test de catálogo/productos **también** pide la fixture `db_session` para insertar `Category` y `Product` con SQLAlchemy antes de llamar a `GET /categories` y `GET /products`, así la respuesta no depende de seeds externos.

#### De dónde sale cada import

| Import | Origen | Para qué se usa aquí |
|--------|--------|----------------------|
| `pytest` | dependencia dev (`pyproject.toml`) | Marcadores (`@pytest.mark.integration`) y es el runner que ejecuta las funciones `test_*`. |
| `Session` | `sqlalchemy.orm` | Anotación de tipo del parámetro `db_session: Session` en `test_categories_and_products_filter`; indica que recibes una sesión SQLAlchemy. |
| `Category`, `Product` | `app.models` | Modelos ORM alineados con las tablas; se instancian y se guardan con `db_session.add` / `commit` para preparar datos de prueba. |

#### Por qué `@pytest.mark.integration`

- El marcador **`integration`** está **registrado** en `backend/pyproject.toml` dentro de `[tool.pytest.ini_options] markers`. Registrarlo evita advertencias de pytest y documenta el significado del tag.
- **Utilidad práctica:** podés filtrar solo estos tests con `pytest -m integration` (por ejemplo en CI, o para no mezclarlos con futuros tests unitarios o E2E).
- **Convención del repo:** todos los tests de esta carpeta que pegan a la API comparten el mismo marcador; no es obligatorio para que el test funcione, pero ordena la suite.

#### Fixtures: `client` y `db_session` (sin importarlas en el archivo)

- **No hace falta** `from conftest import client`: pytest **inyecta** automáticamente las fixtures declaradas como parámetros de la función de test.
- **`client`** — definida en `backend/tests/conftest.py`: crea tablas en SQLite en memoria, abre una `Session`, hace **override** de la dependencia FastAPI `get_db` para que cada petición HTTP use **esa misma sesión**, y envuelve la app en `TestClient`. Así lo que escribe el endpoint y lo que leés con `db_session` en el mismo test comparten contexto de BD cuando ambos fixtures se usan juntos (el `client` depende de `db_session`).
- **`db_session`** — misma `conftest.py`: sesión SQLAlchemy para preparar o inspeccionar datos en tests que no quieren depender solo de llamadas HTTP previas.

#### Resumen por test en el archivo

| Función | Qué comprueba |
|---------|----------------|
| `test_register_and_login` | Registro 200, luego login 200 y presencia de `access_token` en el JSON. |
| `test_forgot_password_always_ok` | `POST /auth/forgot-password` responde 200 con cuerpo que incluye `message` (diseño que no revela si el email existe). |
| `test_login_fails_wrong_password` | Tras registrar usuario, login con contraseña incorrecta devuelve 401. |
| `test_categories_and_products_filter` | Semilla categoría y producto, luego lista categorías, búsqueda por `q` y filtro por `category_slug`. |

Para un ejemplo más acotado solo de registro (200 / duplicado 400), ver también `backend/tests/integration/services/test_register.py`.

### 10.2 Frontend — unitario (sin React en el ejemplo)

- **Archivo:** `frontend/src/lib/categoryLabels.test.ts`
- **Lenguaje:** TypeScript
- **Frameworks:** **Vitest** (compatible con Vite; usa el mismo `vite.config.ts` con bloque `test`).
- **Estructura:** convención `*.test.ts` junto al código fuente; `describe` / `it` / `expect` importados desde `vitest`; el módulo bajo prueba se importa con ruta relativa (`./categoryLabels`).

Cuando pruebes **componentes** `.tsx`, añade `@testing-library/react` y en `vite.config.ts` cambia `test.environment` a `"jsdom"`.

### 10.3 E2E — recordatorio

- **Lenguaje:** Python en el repo si usas **pytest-playwright**; o TypeScript con el CLI oficial de Playwright.
- **Framework:** **Playwright** controla el navegador; los selectores estables (`get_by_role`, `data-testid`) son clave.

Ejemplo mínimo sigue en la sección 6.3 de esta guía; el marcador `@pytest.mark.e2e` permite `pytest -m e2e` sin mezclar con integración.

---

## 11. De QA manual a automatización: mapa de aprendizaje intensivo

Tu ventaja como **QA manual** es que ya piensas en **casos de prueba, datos, riesgos y flujos**. La automatización añade **código repetible** y **feedback rápido**. Para encajar con ofertas que piden **Playwright + Python + pytest**, conviene dominar en este orden:

| Orden | Tema | Por qué |
|-------|------|---------|
| 1 | **pytest** + tests de API (`TestClient`) | Más rápidos que E2E; enseñan Python, asserts, fixtures, `conftest.py`. |
| 2 | **Playwright** con **pytest-playwright** | Mismo runner que la API; aprendes selectores, `expect`, trazas, CI. |
| 3 | **Marcadores y carpetas** (`integration`, `e2e`, `unit`) | Cómo filtrar suites y hablar el mismo idioma que devs y CI. |
| 4 | **CI/CD** (GitHub Actions u otro) | Donde el valor de la automatización se demuestra en cada commit. |
| 5 | **Observabilidad** (logs, APM, trazas) | En muchos equipos QA/SDET participan en **monitoreo post-release** y correlación fallo ↔ log. |

**Práctica en este repo:** cada semana, añade al menos **un test de integración** nuevo o **un E2E** corto bajo `backend/tests/e2e/`, y ejecuta la suite localmente antes de subir cambios.

---

## 12. Documentación y recursos oficiales (prioridad alta)

| Tema | Enlace | Uso |
|------|--------|-----|
| pytest (conceptos, fixtures, marcadores) | [docs.pytest.org](https://docs.pytest.org/en/stable/) | Referencia diaria; lee “Getting started” y “How to use fixtures”. |
| Playwright (Python) | [playwright.dev/python](https://playwright.dev/python/docs/intro) | API sync/async, `expect`, locators, debugging. |
| pytest-playwright | [pytest-playwright.readthedocs.io](https://pytest-playwright.readthedocs.io/) | Fixtures `page`, `browser`, `base_url`, opciones CI. |
| FastAPI testing | [fastapi.tiangolo.com/tutorial/testing](https://fastapi.tiangolo.com/tutorial/testing/) | `TestClient`, overrides de dependencias. |
| Vitest | [vitest.dev](https://vitest.dev/guide/) | Tests en el frontend del proyecto. |
| Datadog Learning | [learn.datadoghq.com](https://learn.datadoghq.com/) | Cursos gratuitos de logs, APM, RUM (cuenta gratuita/trial). |

**Comunidad y calidad:** busca en GitHub proyectos open source con `pytest` + `playwright` en `.github/workflows` para ver pipelines reales.

---

## 13. Dónde ejecutar tests y cómo ver el detalle (terminal)

**Directorio de trabajo:** siempre la carpeta del **backend** (`backend/`) o del **frontend** (`frontend/`), no la raíz del monorepo, salvo que indiques rutas completas.

En **Windows PowerShell** no uses `&&` en versiones antiguas; usa `;` o dos líneas (`cd` y luego el comando).

### 13.1 Backend — pytest

```powershell
cd backend

# Archivo completo
python -m pytest tests/integration/test_health.py -v

# Una sola función (node id)
python -m pytest tests/integration/test_health.py::test_health_returns_ok -v

# Por palabra en el nombre del test
python -m pytest -k "health" -v

# Por marcador
python -m pytest -m integration -v
python -m pytest -m e2e -v
```

| Necesidad | Opción |
|-----------|--------|
| Más detalle por test | `-v` o `-vv` |
| Ver `print()` y logs en consola | `-s` |
| Traceback largo al fallar | `--tb=long` |
| Parar en el primer fallo | `-x` |
| Solo re-ejecutar los que fallaron antes | `--lf` |
| Depurar al fallar (pdb) | `--pdb` |

**Cobertura** (tienes `pytest-cov` en `[project.optional-dependencies] dev`):

```powershell
python -m pytest tests/integration/ -m integration --cov=app --cov-report=term-missing --cov-report=html
```

Se genera `htmlcov/index.html` (ábrelo en el navegador): **evidencia** de qué líneas de `app/` ejecutó la suite.

### 13.2 Frontend — Vitest

```powershell
cd frontend
npx vitest run src/lib/categoryLabels.test.ts
npx vitest run --reporter=verbose
npx vitest run -t "devuelve la etiqueta"
```

`npm run test:watch` mantiene Vitest escuchando cambios (ideal para practicar).

### 13.3 E2E — Playwright (pytest)

Con **frontend** (y API si la página lo llama) **en marcha** según `base_url` en `pyproject.toml`:

```powershell
cd backend
python -m pytest tests/e2e/ -m e2e -v --headed
```

`--headed` muestra el navegador (depende de versión de pytest-playwright; alternativa: variable `PWDEBUG=1` para depuración). Para **trazas** y reportes HTML nativos de Playwright, consulta la documentación de “trace viewer” en [Playwright Trace](https://playwright.dev/python/docs/trace-viewer).

---

## 14. Herramientas extra para reportes y “evidencias” (sin sustituir pytest/Vitest)

No necesitas otro **framework de tests**; sí puedes sumar **reportes** y **dashboards**.

| Herramienta | Qué aporta | Cuándo usarla |
|-------------|------------|---------------|
| **pytest-cov** | Cobertura de código | Ver qué falta probar; muy valorado en entrevistas. |
| **pytest-html** | Informe HTML con resultados por test | Adjuntar a tickets o CI como artefacto. |
| **Allure** (allure-pytest) | Reportes visuales, historial, severidades | Equipos que ya usan Allure en CI. |
| **Playwright HTML report** | Reporte de ejecución E2E | Tras `pytest` con plugins o CLI de Playwright según configuración. |

Instalación ejemplo (solo si la quieres probar): `pip install pytest-html` y luego `python -m pytest ... --html=report.html --self-contained-html`.

**IDE:** en VS Code / Cursor, la extensión **Python** + descubrimiento de tests pytest y la de **Playwright** aceleran ejecución y depuración desde el editor.

---

## 15. Crear un test desde cero en este proyecto (checklist)

Usa esta lista cada vez que practiques; así internalizas el flujo completo.

### Test de integración API (pytest)

1. Abre `backend/tests/conftest.py` y recuerda qué fixtures existen (`client`, `db_session`).
2. Crea `backend/tests/integration/test_mi_feature.py` (nombre descriptivo).
3. Escribe `def test_escenario_feliz(client):` y llama al endpoint con `client.get/post/...`.
4. Aserciones: `assert response.status_code == 200` y campos del JSON.
5. Añade `@pytest.mark.integration`.
6. Ejecuta: `python -m pytest tests/integration/test_mi_feature.py -vv`.

### Test E2E (Playwright + pytest)

1. Arranca API (`uvicorn`) y frontend (`npm run dev`) si la página lo requiere.
2. Crea `backend/tests/e2e/test_flujo_x.py`.
3. Usa fixtures `page` y `base_url`; `page.goto(base_url + "/ruta")`.
4. Localiza elementos con `page.get_by_role(...)`, `get_by_test_id(...)`, etc.
5. `expect(...)` para aserciones auto-espera.
6. Marca `@pytest.mark.e2e` y ejecuta `python -m pytest tests/e2e/ -m e2e -v`.

### Test frontend (Vitest)

1. Coloca `algo.test.ts` junto al módulo en `frontend/src/`.
2. `import { describe, it, expect } from "vitest"`.
3. Ejecuta `npm run test` desde `frontend/`.

---

## 16. CI/CD: qué es y cómo encaja aquí

**Integración continua (CI):** cada push o pull request ejecuta **build + tests** automáticamente. **Entrega continua (CD):** despliegue automático o semi-automático a un entorno si CI pasa.

**Objetivo para tu perfil:** leer un `workflow` YAML, entender **jobs**, **steps**, **artefactos** (reportes HTML, coverage) y **fallos en rojo** que bloquean merge.

En este repo hay un workflow de ejemplo en **`.github/workflows/tests.yml`** (GitHub Actions). Resume así:

- Job **backend-integration:** Python 3.12, `pip install -e ".[dev]"`, `pytest -m integration` con **JUnit XML** (`junit-backend.xml`) subido como **artefacto** para revisión o integración con otras herramientas.
- Job **frontend-unit:** Node 20, `npm ci`, `npm run test` (Vitest).
- **E2E con Playwright** no está en este workflow por defecto (más tiempo y suelen necesitarse API + front en marcha); añádelo en un job aparte o con `docker-compose` si tu equipo lo pide.

**Práctica:** sube el repo a GitHub, abre un PR de prueba que solo añada un test y revisa la pestaña **Actions** y los **artefactos** del job.

**Sin GitHub:** los mismos comandos del workflow puedes ejecutarlos en local o en GitLab CI / Azure Pipelines traduciendo la sintaxis YAML.

---

## 17. Logs, observabilidad y Datadog (visión QA / SDET)

En empresas con producto en la nube, **QA** y **automation** a menudo colaboran con **SRE/DevOps** usando una plataforma como **Datadog** (u otra: New Relic, Grafana Cloud, etc.). No sustituye los tests; **complementa** el análisis cuando algo falla en **staging o producción**.

### 17.1 Conceptos que conviene estudiar

| Concepto | Qué es | Relación con tu rol |
|----------|--------|---------------------|
| **Logs** | Líneas estructuradas (JSON) con timestamp, nivel, mensaje, `request_id` | Buscar el error que vio el usuario; filtrar por endpoint o status. |
| **APM / Traces** | Trazas distribuidas por servicios | Ver qué función o query fue lenta en un flujo. |
| **RUM** | Real User Monitoring en el navegador | Errores JS, rendimiento percibido (relacionado con calidad UX). |
| **Synthetics / Monitors** | Checks programados o alertas | Similar filosofía a tests automatizados, pero contra entornos reales 24/7. |

### 17.2 Cómo practicar sin empresa (Datadog)

1. Crea una cuenta de **prueba** / **free trial** en [Datadog](https://www.datadoghq.com/) y completa módulos en [learn.datadoghq.com](https://learn.datadoghq.com/).
2. En local, el **Agent** de Datadog puede enviar logs de archivos o de **stdout** si rediriges salida; en desarrollo suele bastar **logging estructurado** (JSON) a consola para aprender el formato que luego indexan las herramientas.
3. En **Python/FastAPI**, el siguiente paso natural es configurar `logging` con formato JSON y un **middleware** que genere **request id** por petición; en producción el agente o el forwarder envía eso a Datadog. El paquete **`ddtrace`** (APM) instrumenta FastAPI si el equipo lo usa; no es obligatorio para aprender conceptos de logs.

### 17.3 Qué podrías añadir más adelante en este proyecto (idea de práctica)

- Middleware que loguee método, ruta, status y duración en **JSON**.
- Variable de entorno `DD_ENV`, `DD_SERVICE` (estándar Datadog) leída en config para etiquetar logs cuando exista agente.
- En CI, publicar **junit.xml** de pytest (`--junitxml=report.xml`) y subirlo como artefacto: muchas plataformas muestran tendencia de fallos.

Esto te prepara para entrevistas donde pregunten: *“¿Cómo relacionarías un fallo de test E2E con un error en logs?”* — Respuesta típica: **timestamp**, **request id** o **trace id**, mismo **usuario de prueba** o **entorno**, y búsqueda en el sistema de logs.

---

## 18. Plan de práctica intensiva sugerido (4 semanas base)

| Semana | Enfoque | Entregable en ecommerce-bike |
|--------|---------|------------------------------|
| 1 | pytest: fixtures, marcadores, 5 tests API nuevos o ampliados | Archivos en `tests/integration/` |
| 2 | Playwright: 3 E2E (home, login, catálogo) con selectores estables | `tests/e2e/` |
| 3 | CI: workflow que ejecute integration + Vitest; leer logs del pipeline | PR verde |
| 4 | Coverage + un reporte HTML; leer docs Datadog Learning (logs) | `htmlcov` o pytest-html; notas en tu portfolio |

Ajusta la intensidad según tus horas; lo importante es **repetir el ciclo** escribir → ejecutar → corregir → commitear.

---

## 19. Resumen ejecutivo

- **Ejecutás** tests desde `backend/` o `frontend/`; **pytest** y **Vitest** son el núcleo; el **detalle** sale de `-vv`, `-s`, `--tb=long`, **coverage** y reportes HTML opcionales.
- **Aprendizaje intensivo:** documentación oficial (sección 12) + práctica sistemática en este repo (secciones 15 y 18).
- **CI/CD:** automatizar lo mismo que hacés en local; artefactos para evidencias.
- **Datadog (u otra):** logs y trazas para **después** del deploy; habilidad distinta pero **complementaria** a pytest/Playwright para perfiles QA avanzados y SDET.
