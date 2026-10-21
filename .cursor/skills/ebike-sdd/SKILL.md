---
name: ebike-sdd
description: Spec Driven Development (SDD) en ecommerce-bike. Plantillas y reglas para specs/NNN-nombre/ (spec.md con requisitos EARS, plan.md, tasks.md y test-plan.md). Usar cuando el coordinador, el planner o el reviewer trabajen con specs, planes, tareas o planes de prueba.
---

# SDD en ecommerce-bike

Una petición = una carpeta `specs/NNN-nombre/`:

| Archivo | Quién lo escribe | Modo | Contenido |
|---------|------------------|------|-----------|
| `spec.md` | planner | producto | QUÉ y POR QUÉ: requisitos EARS, casos límite, aceptación |
| `plan.md` | planner | producto | CÓMO: archivos, decisiones, impacto en tests |
| `tasks.md` | planner (implementer marca `[x]`) | producto | Máx. 10 tareas en orden |
| `test-plan.md` | planner | tests | Casos de prueba a automatizar (los escribe Fernando) |

- `NNN`: siguiente número libre con 3 dígitos (`001`, `002`…). `nombre` en kebab-case (`001-filtros-catalogo`).
- Estados de `spec.md` y `test-plan.md`: `borrador` → `aprobada` (solo Fernando aprueba) → `implementada`.
- Fuente de reglas ("constitución"): `AGENTS.md` + decisiones de `MEMORY.md` + skills `ebike-*`.

## Requisitos EARS

Cada RF es una frase verificable con uno de estos patrones:

| Patrón | Forma |
|--------|-------|
| Ubicuo | El sistema deberá `<respuesta>`. |
| Evento | Cuando `<disparador>`, el sistema deberá `<respuesta>`. |
| Estado | Mientras `<estado>`, el sistema deberá `<respuesta>`. |
| No deseado | Si `<condición no deseada>`, entonces el sistema deberá `<respuesta>`. |
| Opcional | Donde `<característica>`, el sistema deberá `<respuesta>`. |

Ejemplo: *Cuando un usuario sin sesión abre `/carrito`, el sistema deberá redirigirlo a `/login?next=/carrito`.*

## Plantilla `spec.md`

```markdown
# NNN — <Título>

Estado: borrador
Modo: producto
Pedido original: "<palabras de Fernando>"

## Problema / por qué
<2-4 líneas>

## Requisitos funcionales
- RF1: <EARS>
- RF2: <EARS>

## Casos límite
- <caso> → <comportamiento esperado>

## Fuera de alcance
- <qué no se hace>

## Criterios de aceptación
- [ ] <verificable, ligado a RF>
```

## Plantilla `plan.md`

```markdown
# Plan — NNN <Título>

Spec: ./spec.md (aprobada)
Rama: feature/<tema>
Skills: ebike-feature-workflow + ebike-<específica>

## Cambios por archivo
| Archivo | Cambio | RF |
|---------|--------|----|

## Decisiones
| Decisión | Alternativa descartada | Por qué |
|----------|------------------------|---------|

## Impacto en e2e
- Selectores / textos que cambian: <lista o "ninguno">
- Specs afectados: <lista o "ninguno">

## Estrategia de tests
- Vitest: <lógica pura>
- pytest: <backend>
- Casos e2e sugeridos para que escriba Fernando: <lista>
```

## Plantilla `tasks.md`

```markdown
# Tareas — NNN <Título>

- [ ] T1: <tarea chica> (RF1)
  Hecho cuando: <verificable>
- [ ] T2: ...
```

## Plantilla `test-plan.md`

```markdown
# Test plan — NNN <Endpoint o pantalla>

Estado: borrador
Modo: tests
Spec destino: e2e/tests/<api|ui>/<recurso>.spec.ts
Datos: e2e/data/<archivo>.ts — usuario: users.demo | uniqueRegisterUser()
Reutilizar: <helpers / Page Objects>

## Comportamiento real observado
- <request o pasos> → <status + body / lo visible>

## Casos
| # | Test (comportamiento) | Datos | Esperado (status + body / UI) | Prioridad |
|---|-----------------------|-------|-------------------------------|-----------|
| 1 | "POST /cart/items without token returns 401" | sin header | 401 `{"detail":"Not authenticated"}` | Alta |

## Posibles bugs
- <evidencia o "ninguno">
```
