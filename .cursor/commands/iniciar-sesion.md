# Iniciar sesión de trabajo

Prepará la sesión de trabajo en ecommerce-bike:

1. Leé `AGENTS.md` y `MEMORY.md`.
2. Verificá el entorno sin modificar nada:
   - `docker compose ps` (Postgres en 5433)
   - `http://127.0.0.1:8000/health` debe devolver `{"status":"ok"}`
   - `http://localhost:5173` debe responder 200
3. Mostrá `git status -sb` y la rama actual.
4. Respondé en pocas líneas:
   - Qué servicios están arriba y cuáles faltan (con el comando para levantarlos).
   - En qué paso del roadmap estamos según `MEMORY.md`.
   - Si hay cambios sin commitear, qué son y si corresponden al paso actual.
   - Cuál es la próxima acción concreta.

No escribas código ni hagas commits en este comando.
