---
name: ebike-forms
description: Estándares para construir y mejorar formularios del e-commerce e-bike (login, registro, recuperar contraseña, cuenta, servicio técnico, checkout) con accesibilidad, validación alineada a la API y buena testeabilidad. Usar cuando se trabaje en cualquier form, input, validación o mensaje de error del frontend de e-bike.
---

# Formularios en e-bike

Seguir primero el flujo de `ebike-feature-workflow`.

## Formularios existentes

| Pantalla | Archivo | Endpoint |
|----------|---------|----------|
| Login / registro | `frontend/src/pages/LoginPage.tsx` | `POST /auth/login`, `POST /auth/register` |
| Recuperar contraseña | `frontend/src/pages/ForgotPasswordPage.tsx` | `POST /auth/forgot-password` |
| Cuenta (cambio de contraseña) | `frontend/src/pages/AccountPage.tsx` | `POST /auth/change-password` |
| Servicio técnico | `frontend/src/pages/ServicePage.tsx` | Ninguno: solo front (`noValidate`, sin `apiFetch`) |

## Checklist de un formulario "de producción"

- [ ] Cada campo tiene `<label htmlFor>` visible (el placeholder **no** reemplaza al label).
- [ ] `type`, `name` y `autoComplete` correctos (`email`, `current-password`, `new-password`, `name`).
- [ ] Validación del cliente **igual** a la del backend (ver reglas abajo); nunca más laxa ni más estricta.
- [ ] Error por campo debajo del input, vinculado con `aria-describedby` y `aria-invalid`.
- [ ] Error general del envío en un contenedor con `role="alert"`.
- [ ] Botón de envío deshabilitado mientras `isPending` y con texto claro (no solo "…").
- [ ] Enviar con Enter funciona (`<form onSubmit>`, botón `type="submit"`).
- [ ] Al fallar, el foco va al primer campo inválido o al mensaje de error.
- [ ] Los estilos inline de error (`style={{ color: ... }}`) se reemplazan por una clase CSS reutilizable.

## Reglas de validación de la API (fuente de verdad: `backend/app/schemas/auth.py`)

| Campo | Regla backend | Qué mostrar en el front |
|-------|---------------|-------------------------|
| Email (register) | `validate_email`, rechaza dominios reservados (`.test`) | "Introduce un correo electrónico válido" |
| Email (login) | `EmailStr` | Mismo mensaje |
| Password (register / nueva) | más de 8 caracteres | "La contraseña debe tener más de 8 caracteres" |
| Credenciales malas | 401 `"Incorrect email or password"` | Mensaje genérico, sin revelar si el email existe |

Los errores 422 llegan como lista en `detail`; `apiFetch` ya los une en un solo mensaje. Si se necesita error **por campo**, mapear `detail[].loc` al nombre del campo en un helper de `lib/`.

## Patrón recomendado

- Extraer un componente `FormField` (label + input + error) en `frontend/src/components/` cuando lo usen 2+ formularios.
- Validaciones puras en `frontend/src/lib/validation.ts` con tests Vitest.
- No agregar librerías de formularios (react-hook-form, zod) sin proponerlo antes: los forms actuales son chicos.

## Testeabilidad

- Al agregar `<label>`, el nombre accesible debe seguir siendo el mismo que usan los specs ("Email", "Contraseña").
- Mensajes de error con texto estable: los specs los buscan con `getByText` o `getByRole("alert")`.
- Después del cambio correr `cd e2e; npm run test:ui`.
