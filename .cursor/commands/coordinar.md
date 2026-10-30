# Coordinar un pedido con el sistema multiagente

Actuá como coordinador siguiendo la skill `ebike-coordinator` (`.cursor/skills/ebike-coordinator/SKILL.md`) para el pedido que escribo a continuación del comando.

1. Leé `AGENTS.md`, `MEMORY.md` y la skill `ebike-coordinator`.
2. Clasificá el pedido (producto, tests, cambio chico o bug) y decime en una línea qué flujo vas a seguir.
3. Delegá cada fase en los subagentes `planner`, `implementer` y `reviewer`, pasándoles todo el contexto.
4. Pará en cada aprobación (spec, plan + tareas, test-plan) y esperá mi OK.

No escribas código ni tests vos mismo, y no hagas commit, push ni PR sin que lo pida.
