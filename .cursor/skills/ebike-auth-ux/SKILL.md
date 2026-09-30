---
name: ebike-auth-ux
description: Guía para mejorar autenticación y sesión en el e-commerce e-bike (login, registro, logout, recuperar contraseña, rutas protegidas, manejo del JWT y redirecciones). Usar cuando se trabaje en LoginPage, AccountPage, el token ebike_token, rutas que requieren sesión o errores 401 en el frontend de e-bike.
---

# Autenticación y sesión en e-bike

Seguir primero `ebike-feature-workflow`. Para los campos del formulario, aplicar también `ebike-forms`.

## Cómo funciona hoy

- `POST /auth/login` devuelve `{ access_token, token_type }`.
- El token se guarda en `localStorage` con la clave `ebike_token` (`setToken` / `getToken` / `clearToken` en `frontend/src/api/client.ts`).
- `apiFetch` agrega `Authorization: Bearer <token>` salvo que se pase `auth: false`.
- Login y registro comparten `LoginPage.tsx` (modo por estado o `?registro=1`). Tras el éxito navega a `/productos`.
- "Recuérdame" guarda solo el email (`ebike_remember_email`), no la contraseña ni el token.
- Varias páginas leen `getToken()` directo para decidir si hay sesión (`Layout`, `HomePage`, `CartPage`, `CheckoutPage`, `ProductDetailPage`).

## Mejoras prioritarias (proponer en este orden)

1. **Hook de sesión único**: `useAuth()` en `frontend/src/hooks/` que exponga `isLoggedIn`, `login`, `logout`, en vez de llamar `getToken()` en cada página.
2. **Redirección de vuelta**: si una ruta protegida manda a `/login`, guardar `?next=/carrito` y volver ahí tras el login (validar que `next` sea una ruta interna).
3. **401 global**: si la API responde 401 con token presente (vencido o inválido), limpiar el token, invalidar queries y llevar a `/login` con un aviso.
4. **Ruta protegida**: componente `RequireAuth` para `/carrito`, `/checkout`, `/cuenta` en lugar de chequeos sueltos.
5. **Logout completo**: `clearToken()` + `queryClient.clear()` para no mostrar datos del usuario anterior.

## Reglas de seguridad y UX

- Mensajes de error genéricos en login y recuperar contraseña: no revelar si el email existe.
- Nunca guardar la contraseña en `localStorage` ni loguearla.
- No decodificar el JWT en el front para tomar decisiones de permisos; la fuente de verdad es la API.
- El registro exitoso hace login automático (ya ocurre): mantener ese comportamiento.
- Mostrar estado de carga en el botón y evitar doble envío.

## Contratos que no se rompen

- Clave `ebike_token` en `localStorage` (la usa la app y puede usarla la automatización para sesión).
- Nombres accesibles del login usados por `e2e/pages/loginPage.ts`: textbox "Email", textbox "Contraseña", botón "Entrar".
- Destino tras login: `/productos` con heading "Productos" (lo afirma `e2e/tests/ui/login.spec.ts`). Si se agrega `?next=`, el destino por defecto sigue siendo `/productos`.

## Verificación

```powershell
cd e2e; npm run test:api; npm run test:ui
```
