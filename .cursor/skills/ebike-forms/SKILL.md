---
name: ebike-forms
description: Estándares para construir y mejorar formularios del e-commerce e-bike (login, registro, recuperar contraseña, cuenta, servicio técnico, checkout) con accesibilidad, validación alineada a la API, advertencias por campo y buena testeabilidad. Usar cuando se trabaje en cualquier form, input, contraseña, validación o mensaje de error del frontend o de los schemas de e-bike.
---

# Formularios en e-bike

Seguir primero el flujo de `ebike-feature-workflow`.

## Formularios existentes

| Pantalla | Archivo | Endpoint | Validación |
|----------|---------|----------|------------|
| Login | `frontend/src/pages/LoginPage.tsx` | `POST /auth/login` | Email con formato + contraseña no vacía |
| Registro | `frontend/src/pages/LoginPage.tsx` (modo registro) | `POST /auth/register` | Nombre opcional ≤ 100, email, política de contraseña, repetir contraseña |
| Recuperar contraseña | `frontend/src/pages/ForgotPasswordPage.tsx` | `POST /auth/forgot-password` | Email |
| Cuenta (cambio de contraseña) | `frontend/src/pages/AccountPage.tsx` | `POST /auth/change-password` | Actual requerida, nueva con política y distinta de la actual, repetir |
| Servicio técnico | `frontend/src/pages/ServicePage.tsx` | Ninguno (solo front) | Nombre y apellido, email, teléfono 8–15 dígitos, modelo, fechas desde hoy y fin ≥ inicio, comentarios ≤ 2000 |

## Piezas reutilizables (usar siempre, no reinventar)

| Pieza | Archivo | Para qué |
|-------|---------|----------|
| `useForm(initialValues, rules)` | `frontend/src/hooks/useForm.ts` | Valores, errores visibles, foco al primer inválido, `reset()` |
| `Rules<V>` / `validateForm` | `frontend/src/lib/formValidation.ts` | Reglas declarativas por campo; reciben todos los valores (campos cruzados) |
| Validadores y mensajes | `frontend/src/lib/validation.ts` | Email, contraseña, confirmación, nombre, requerido, largo máximo |
| `FormField` | `frontend/src/components/FormField.tsx` | Label + input + ayuda + error con `aria-describedby` / `aria-invalid` |
| `PasswordField` | `frontend/src/components/PasswordField.tsx` | Botón Mostrar/Ocultar y, con `showRequirements`, lista de requisitos que se tilda |

```tsx
const RULES: Rules<Values> = {
  email: [validateEmail],
  password: [validateNewPassword],
  confirm: [(value, values) => validatePasswordConfirmation(values.password, value)],
};

const form = useForm({ email: "", password: "", confirm: "" }, RULES);

<form {...form.formProps((values) => mutation.mutate(values))}>
  <FormField label="Email" type="email" autoComplete="email" {...form.field("email")} />
  <PasswordField label="Contraseña" autoComplete="new-password" showRequirements {...form.field("password")} />
  <PasswordField label="Repetir contraseña" autoComplete="new-password" {...form.field("confirm")} />
</form>
```

- `formProps` aporta `noValidate`, `onSubmit` y un `onMouseDown` que evita que el botón submit robe el foco.
  Sin eso, el blur del input muestra su error, el botón se corre y el `click` se pierde (el envío no ocurre).
  Por el mismo motivo el botón Mostrar/Ocultar hace `preventDefault()` en `mousedown`.
- El orden de las claves en `rules` es el orden en que se mueve el foco: debe coincidir con el orden visual.
- Definir las reglas **fuera** del componente (constantes) salvo que dependan de estado (ej. modo login/registro).

## Cuándo aparece cada advertencia

1. Mientras el usuario escribe por primera vez, **no** se muestra error (no regañar antes de tiempo).
2. Al salir del campo (blur) se muestra el error de ese campo.
3. Al enviar se muestran todos y el foco va al primer campo inválido; no se llama a la API.
4. Una vez visible, el error se recalcula en vivo: desaparece apenas se corrige.
5. La lista de requisitos de contraseña sí se actualiza en vivo desde el primer carácter (es guía, no error).
6. El botón de envío **no** se deshabilita por validación (solo durante `isPending`): así el usuario ve qué falta.

## Política de validación (backend ↔ frontend espejo)

Fuente de verdad: `backend/app/schemas/auth.py`. Espejo en `frontend/src/lib/validation.ts`.
**Si cambia una regla o un mensaje, cambiarlo en los dos archivos y en sus tests en el mismo commit.**

| Campo | Regla (en este orden) | Mensaje |
|-------|------------------------|---------|
| Email | requerido (solo front) | "Ingresá tu email" |
| Email | ≤ 254 caracteres (solo front) | "El email no puede superar los 254 caracteres" |
| Email | formato (`validate_email` en la API, regex simple en el front) | "Introduce un correo electrónico válido" |
| Contraseña nueva | requerida (solo front) | "Ingresá tu contraseña" |
| Contraseña nueva | más de 8 caracteres | "La contraseña debe tener más de 8 caracteres" |
| Contraseña nueva | ≤ 72 bytes UTF-8 (límite de bcrypt) | "La contraseña no puede superar los 72 caracteres" |
| Contraseña nueva | al menos una letra | "La contraseña debe incluir al menos una letra" |
| Contraseña nueva | al menos un número | "La contraseña debe incluir al menos un número" |
| Contraseña nueva | sin espacios al inicio o al final | "La contraseña no puede empezar ni terminar con espacios" |
| Cambio de contraseña | nueva ≠ actual (422 en la API) | "La nueva contraseña debe ser distinta de la actual" |
| Repetir contraseña | requerida y igual (solo front) | "Repetí la contraseña" / "Las contraseñas no coinciden" |
| Nombre (registro) | opcional, se recorta, ≤ 100 | "El nombre no puede superar los 100 caracteres" |
| Login | email con formato + contraseña no vacía | La API responde 401 `"Incorrect email or password"` |

Detalles que hay que respetar para que el espejo sea exacto:

- Contar caracteres como Python (`[...value].length`, no `value.length`): un emoji es 1 carácter.
- El máximo de contraseña se mide en **bytes** (`TextEncoder`), el mínimo en caracteres.
- Letra = `\p{L}` / `str.isalpha()`; número = `\p{Nd}` / `str.isdecimal()` (no `isdigit()`, que acepta "²").
- **Nunca** aplicar la política al login: hay contraseñas viejas válidas que no la cumplen (ej. `demo1234`).
- La API sigue validando todo: el front evita viajes inútiles, no reemplaza al backend.
- Pydantic antepone `"Value error, "` a los mensajes 422; `apiFetch` lo quita.

## Checklist de un formulario "de producción"

- [ ] Usa `useForm` + `FormField` / `PasswordField` (no `useState` por campo ni markup propio).
- [ ] Cada campo tiene label visible (el placeholder **no** reemplaza al label).
- [ ] `type`, `name` y `autoComplete` correctos (`email`, `current-password`, `new-password`, `name`, `tel`).
- [ ] `<form {...form.formProps(onValid)}>` (incluye `noValidate`: los mensajes son nuestros, no los globos del navegador).
- [ ] Contraseñas nuevas: `showRequirements` + campo "Repetir…".
- [ ] Datos enviados normalizados (email y nombre con `trim()`; la contraseña **no** se recorta).
- [ ] Error general del envío (respuesta de la API) en `.form-alert` con `role="alert"`.
- [ ] Botón de envío deshabilitado solo mientras `isPending`, con texto claro ("Guardando…").
- [ ] Tests Vitest para cada validador nuevo (casos que pasan y que fallan, bordes).
- [ ] Si la regla existe en la API: test pytest del 422 y del mensaje.

## Testeabilidad

- Nombres accesibles estables: "Email", "Contraseña", "Repetir contraseña", "Nueva contraseña", botón "Entrar".
- En registro y cuenta hay varios campos que contienen "contraseña": usar `{ exact: true }` en los locators
  (`getByRole("textbox", { name: "Contraseña", exact: true })`).
- El botón Mostrar/Ocultar tiene texto visible, sin `aria-label`, para no chocar con `getByLabel("Contraseña")`.
  Estado en `aria-pressed`.
- Los errores por campo son texto estable debajo del input: buscarlos con `getByText("…")` o verificar
  `toHaveAttribute("aria-invalid", "true")` en el input.
- Después del cambio correr `cd e2e; npm run test:ui` y `cd frontend; npm run test`.
