/**
 * Validaciones de formularios alineadas con `backend/app/schemas/auth.py`.
 * El cliente nunca es más estricto que la API: el backend sigue siendo la fuente de verdad.
 */

export const EMAIL_INVALID_MESSAGE = "Introduce un correo electrónico válido";
export const PASSWORD_TOO_SHORT_MESSAGE = "La contraseña debe tener más de 8 caracteres";
export const PASSWORD_REQUIRED_MESSAGE = "Ingresá tu contraseña";

/** La API exige más de 8 caracteres (no "8 o más"). */
export const PASSWORD_MIN_EXCLUSIVE = 8;

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: string): string | undefined {
  return EMAIL_SHAPE.test(value.trim()) ? undefined : EMAIL_INVALID_MESSAGE;
}

export function validateNewPassword(value: string): string | undefined {
  return value.length > PASSWORD_MIN_EXCLUSIVE ? undefined : PASSWORD_TOO_SHORT_MESSAGE;
}

export function validateRequiredPassword(value: string): string | undefined {
  return value.length > 0 ? undefined : PASSWORD_REQUIRED_MESSAGE;
}
