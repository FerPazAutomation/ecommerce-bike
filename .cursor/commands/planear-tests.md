# Planear casos de prueba

Ayudame a planear los tests para el endpoint o la pantalla que indique a continuación del comando.

1. Leé `AGENTS.md` y `MEMORY.md`.
2. Explorá el comportamiento real:
   - API: leé el router en `backend/app/api/routers/` y el schema; probá los casos con requests reales contra `http://127.0.0.1:8000`.
   - UI: leé la página en `frontend/src/pages/` e identificá roles y nombres accesibles.
3. Devolvé una tabla de casos: nombre del test, datos, resultado esperado (status + body o lo visible en pantalla), prioridad.
   Incluí casos felices, negativos, límites y de seguridad (sin sesión, token inválido).
4. Indicá qué datos hacen falta en `e2e/data/` y si conviene usar `users.demo` o `uniqueRegisterUser()`.
5. Sugerí dónde va el spec y qué helper o Page Object reutilizar.

No escribas el código de los tests: los escribo yo (ver rol en `AGENTS.md`).
