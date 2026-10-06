---
name: ebike-feature-workflow
description: Flujo base para implementar mejoras de producto mantenibles en el e-commerce e-bike (frontend React/Vite y backend FastAPI) sin romper los tests. Usar cuando se pida mejorar, rediseñar o agregar una funcionalidad en e-bike (formularios, login, homepage, catálogo, carrito, checkout), antes de aplicar las skills específicas.
---

# Flujo de mejora de producto (e-bike)

Base común para todas las skills `ebike-*`. Leer `AGENTS.md` y `MEMORY.md` antes de empezar.

## Cuándo aplica

En **modo producto**: Fernando pide explícitamente mejorar o construir algo de la app.
En **modo tests** el agente solo guía (ver `AGENTS.md`); no implementar código de tests sin pedido.

## Pasos

```
- [ ] 1. Entender: leer la pantalla/endpoint actual y probarla en el navegador o Swagger
- [ ] 2. Proponer: lista corta de mejoras priorizadas (impacto vs esfuerzo); esperar OK
- [ ] 3. Rama: feature/<tema> (ej. feature/login-a11y) desde main o la rama activa acordada
- [ ] 4. Implementar en cambios chicos, uno por concepto
- [ ] 5. Verificar: build + tests (abajo)
- [ ] 6. Resumir qué cambió, qué selectores de test se tocaron y qué quedó pendiente
- [ ] 7. Actualizar MEMORY.md (decisiones y roadmap)
```

## Reglas de mantenibilidad

- **Reutilizar antes que crear**: revisar `frontend/src/components`, `lib/`, `hooks/` y `api/client.ts`.
- Toda llamada HTTP pasa por `apiFetch` (`frontend/src/api/client.ts`); no usar `fetch` suelto.
- Datos del servidor con **React Query** (`useQuery` / `useMutation`) y `queryKey` descriptivas.
- Lógica pura (formateo, validación, selección) en `frontend/src/lib/*.ts` con test Vitest al lado.
- Tipos compartidos en `frontend/src/types.ts`; alinearlos con los schemas de `backend/app/schemas/`.
- Reglas de negocio (validaciones, precios, stock) viven en el **backend**; el front las refleja, no las reemplaza.
- Textos de UI en español rioplatense neutro y consistentes entre pantallas.

## Contrato con los tests (no romper)

- Mantener los **nombres accesibles** que usan los specs de `e2e/` (ej. textbox "Email", "Contraseña", botón "Entrar", heading "Productos").
- Si un cambio obliga a modificar un selector, avisarlo explícitamente y listar los specs afectados.
- Preferir agregar `<label>` / `aria-*` antes que `data-testid`; usar `data-testid` solo si no hay rol accesible razonable.
- No cambiar respuestas de la API (status, `detail`, forma del JSON) sin acordarlo: rompe tests y el front.

## Verificación

```powershell
cd frontend; npm run build; npm run test
cd backend;  pytest -m integration
cd e2e;      npm test
```

Todo debe quedar en verde. Si algo falla por el cambio, se arregla antes de dar el paso por terminado.

## Skills relacionadas

- Formularios: `ebike-forms`
- Login, registro y sesión: `ebike-auth-ux`
- Homepage: `ebike-homepage`
- Catálogo, carrito y checkout: `ebike-catalog-cart`
