/**
 * Validadores de campos. Las reglas de contraseña, email y nombre son espejo de
 * `backend/app/schemas/auth.py`: si cambia una regla o un mensaje, cambiarlo en los dos lados.
 * El cliente nunca rechaza algo que la API acepta; la API sigue siendo la fuente de verdad.
 */

export const EMAIL_REQUIRED_MESSAGE = "Ingresá tu email";
export const EMAIL_INVALID_MESSAGE = "Introduce un correo electrónico válido";
export const EMAIL_TOO_LONG_MESSAGE = "El email no puede superar los 254 caracteres";

export const PASSWORD_REQUIRED_MESSAGE = "Ingresá tu contraseña";
export const CURRENT_PASSWORD_REQUIRED_MESSAGE = "Ingresá tu contraseña actual";
export const PASSWORD_TOO_SHORT_MESSAGE = "La contraseña debe tener más de 8 caracteres";
export const PASSWORD_TOO_LONG_MESSAGE = "La contraseña no puede superar los 72 caracteres";
export const PASSWORD_NEEDS_LETTER_MESSAGE = "La contraseña debe incluir al menos una letra";
export const PASSWORD_NEEDS_DIGIT_MESSAGE = "La contraseña debe incluir al menos un número";
export const PASSWORD_EDGE_SPACES_MESSAGE = "La contraseña no puede empezar ni terminar con espacios";
export const PASSWORD_SAME_AS_CURRENT_MESSAGE = "La nueva contraseña debe ser distinta de la actual";
export const PASSWORD_CONFIRM_REQUIRED_MESSAGE = "Repetí la contraseña";
export const PASSWORD_MISMATCH_MESSAGE = "Las contraseñas no coinciden";

export const FULL_NAME_TOO_LONG_MESSAGE = "El nombre no puede superar los 100 caracteres";

/** La API exige más de 8 caracteres (no "8 o más"). */
export const PASSWORD_MIN_EXCLUSIVE = 8;
/** Límite de bcrypt, medido en bytes UTF-8 igual que el backend. */
export const PASSWORD_MAX_BYTES = 72;
export const EMAIL_MAX_LENGTH = 254;
export const FULL_NAME_MAX = 100;

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HAS_LETTER = /\p{L}/u;
const HAS_DIGIT = /\p{Nd}/u;

const byteLength = (value: string) => new TextEncoder().encode(value).length;
/** Cuenta caracteres como Python (`len`): un emoji es 1, no 2 unidades UTF-16. */
const charLength = (value: string) => [...value].length;

export function validateRequired(value: string, message: string): string | undefined {
  return value.trim() ? undefined : message;
}

export function validateMaxLength(value: string, max: number, message: string): string | undefined {
  return value.length > max ? message : undefined;
}

export function validateEmail(value: string): string | undefined {
  const email = value.trim();
  if (!email) return EMAIL_REQUIRED_MESSAGE;
  if (email.length > EMAIL_MAX_LENGTH) return EMAIL_TOO_LONG_MESSAGE;
  return EMAIL_SHAPE.test(email) ? undefined : EMAIL_INVALID_MESSAGE;
}

/** Login: solo exige que no esté vacía (no aplicar la política a contraseñas ya existentes). */
export function validateRequiredPassword(value: string): string | undefined {
  return value.length > 0 ? undefined : PASSWORD_REQUIRED_MESSAGE;
}

export type PasswordRequirement = { id: "length" | "letter" | "digit"; label: string; met: boolean };

/** Requisitos visibles en la lista que se tilda mientras se escribe. */
export function passwordRequirements(value: string): PasswordRequirement[] {
  return [
    { id: "length", label: "Más de 8 caracteres", met: charLength(value) > PASSWORD_MIN_EXCLUSIVE },
    { id: "letter", label: "Al menos una letra", met: HAS_LETTER.test(value) },
    { id: "digit", label: "Al menos un número", met: HAS_DIGIT.test(value) },
  ];
}

/** Registro y contraseña nueva: mismo orden de chequeo que `check_password_policy` del backend. */
export function validateNewPassword(value: string): string | undefined {
  if (!value) return PASSWORD_REQUIRED_MESSAGE;
  if (charLength(value) <= PASSWORD_MIN_EXCLUSIVE) return PASSWORD_TOO_SHORT_MESSAGE;
  if (byteLength(value) > PASSWORD_MAX_BYTES) return PASSWORD_TOO_LONG_MESSAGE;
  if (!HAS_LETTER.test(value)) return PASSWORD_NEEDS_LETTER_MESSAGE;
  if (!HAS_DIGIT.test(value)) return PASSWORD_NEEDS_DIGIT_MESSAGE;
  if (value !== value.trim()) return PASSWORD_EDGE_SPACES_MESSAGE;
  return undefined;
}

export function validatePasswordConfirmation(password: string, confirmation: string): string | undefined {
  if (!confirmation) return PASSWORD_CONFIRM_REQUIRED_MESSAGE;
  return password === confirmation ? undefined : PASSWORD_MISMATCH_MESSAGE;
}

export function validateDifferentPassword(current: string, next: string): string | undefined {
  return next && next === current ? PASSWORD_SAME_AS_CURRENT_MESSAGE : undefined;
}

/** Nombre opcional en el registro; si viene, se recorta y no puede pasar de 100 caracteres. */
export function validateOptionalFullName(value: string): string | undefined {
  return charLength(value.trim()) > FULL_NAME_MAX ? FULL_NAME_TOO_LONG_MESSAGE : undefined;
}

export function countDigits(value: string): number {
  return (value.match(/\d/g) ?? []).length;
}
