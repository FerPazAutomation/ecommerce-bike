# Revisar un test

Revisá el spec que tengo abierto o el que indique a continuación del comando.

1. Corré solo ese archivo: `cd e2e; npx playwright test <ruta> --reporter=list`.
2. Revisalo contra las convenciones de `AGENTS.md`:
   - datos desde `e2e/data/`, sin credenciales hardcodeadas
   - `test.describe` y nombres que describen el comportamiento
   - asserts sobre status **y** body (o estado visible en UI)
   - selectores accesibles (`getByRole`, `getByLabel`)
   - independencia: no depende del orden ni del estado compartido del usuario demo
   - repetición que convenga pasar a un helper o Page Object
3. Respondé con:
   - Resultado de la corrida (pasa / falla y por qué).
   - Lo que está bien (breve).
   - Mejoras ordenadas por importancia, cada una con el motivo.
   - Casos que faltan cubrir.

No reescribas el archivo: mostrá fragmentos cortos solo si ayudan a entender una mejora.
