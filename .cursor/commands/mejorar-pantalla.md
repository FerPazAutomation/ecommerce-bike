# Mejorar una pantalla o funcionalidad

Quiero mejorar la parte de la app que indique a continuación del comando (ej. login, homepage, carrito).

1. Aplicá la skill `ebike-feature-workflow` y la skill específica que corresponda:
   formularios → `ebike-forms`, login/sesión → `ebike-auth-ux`, home → `ebike-homepage`, catálogo/carrito/checkout → `ebike-catalog-cart`.
2. Analizá el estado actual (código + comportamiento en `http://localhost:5173`).
3. Proponé una lista corta de mejoras priorizadas por impacto y esfuerzo, indicando:
   - qué archivos se tocan
   - qué specs de `e2e/` podrían verse afectados
4. **Esperá mi confirmación** antes de implementar.
5. Al implementar: rama `feature/<tema>`, cambios chicos, y verificación completa
   (`npm run build` y `npm run test` en frontend, `pytest -m integration`, `npm test` en e2e).
6. Terminá con un resumen de cambios, pendientes y propuesta de mensaje de commit. No hagas commit ni push sin que lo pida.
