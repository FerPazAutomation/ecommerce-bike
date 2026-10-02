/**
 * Validación declarativa de formularios: cada campo tiene una lista de reglas
 * y se reporta el primer mensaje que falle. Las reglas reciben todos los valores
 * para validar campos cruzados (ej. "repetir contraseña").
 */

export type FormValues = Record<string, string>;
export type Rule<V extends FormValues> = (value: string, values: V) => string | undefined;
export type Rules<V extends FormValues> = Partial<Record<keyof V, Rule<V>[]>>;
export type FormErrors<V extends FormValues> = Partial<Record<keyof V, string>>;

export function validateField<V extends FormValues>(
  name: keyof V,
  values: V,
  rules: Rules<V>,
): string | undefined {
  for (const rule of rules[name] ?? []) {
    const message = rule(values[name], values);
    if (message) return message;
  }
  return undefined;
}

export function validateForm<V extends FormValues>(values: V, rules: Rules<V>): FormErrors<V> {
  const errors: FormErrors<V> = {};
  for (const name of Object.keys(rules) as (keyof V)[]) {
    const message = validateField(name, values, rules);
    if (message) errors[name] = message;
  }
  return errors;
}

/** Primer campo con error según el orden visual del formulario (para mover el foco). */
export function firstInvalidField<V extends FormValues>(
  errors: FormErrors<V>,
  order: (keyof V)[],
): keyof V | undefined {
  return order.find((name) => errors[name]);
}
