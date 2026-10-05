/**
 * Credenciales y payloads de prueba para API / UI.
 * El usuario demo lo asegura el seed: `python -m scripts.seed` (desde backend/).
 *
 * Nota: no usar dominios `.test` — EmailStr / email-validator los rechaza (422).
 */

export const users = {
  /** Usuario sembrado en BD. Login feliz (UI y API). */
  demo: {
    email: "demo@example.com",
    password: "demo1234",
    full_name: "Demo Shopper",
  },
  /** Misma cuenta, contraseña incorrecta → 401. */
  invalid: {
    email: "demo@example.com",
    password: "wrong-password",
  },
  /** Email inexistente → 401. */
  unknown: {
    email: "nobody@example.com",
    password: "whatever1234",
  },
} as const;

/**
 * Datos para un usuario nuevo con email único (solo arma el objeto, no llama a la API).
 * El sufijo combina milisegundos + número aleatorio para que dos tests en paralelo no choquen.
 */
export function uniqueRegisterUser(suffix = `${Date.now()}-${Math.floor(Math.random() * 10_000)}`) {
  return {
    email: `qa.auto+${suffix}@example.com`,
    password: "TestPass1234",
    full_name: "QA Automation",
  };
}
