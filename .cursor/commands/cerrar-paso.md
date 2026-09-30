# Cerrar el paso actual

Ayudame a cerrar el paso en el que estoy trabajando.

1. Corré las suites y reportá el resultado:
   - `cd e2e; npm test`
   - `cd backend; pytest -m integration`
   - si se tocó el frontend: `cd frontend; npm run build; npm run test`
2. Revisá `git status` y agrupá los cambios por tema. Marcá cualquier archivo que no debería commitearse
   (artefactos, `.env`, archivos personales, cambios ajenos al paso).
3. Proponé uno o más commits con archivos y mensaje (`test(e2e): ...`, `feat: ...`, `fix: ...`, `chore: ...`, `docs: ...`).
4. Actualizá `MEMORY.md`: estado actual, roadmap, decisiones nuevas, errores conocidos y una línea en el registro de sesiones.
5. Decime si con este paso se completa un bloque y conviene abrir PR a `main`.

No hagas commit, push ni PR: mostrame los comandos y los ejecuto yo, salvo que te lo pida explícitamente.
