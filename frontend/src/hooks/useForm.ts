import { type ChangeEvent, type FormEvent, type MouseEvent, useCallback, useRef, useState } from "react";
import { type FormErrors, type FormValues, type Rules, firstInvalidField, validateForm } from "../lib/formValidation";

type FieldElement = HTMLInputElement | HTMLTextAreaElement;

/**
 * Estado y validación de un formulario.
 * - El error de un campo se muestra al salir de él (blur) o al enviar.
 * - Una vez visible, se recalcula mientras se escribe, así la advertencia desaparece al corregir.
 * - Al enviar con errores, el foco va al primer campo inválido según el orden de `rules`.
 */
export function useForm<V extends FormValues>(initialValues: V, rules: Rules<V>) {
  const [values, setValues] = useState<V>(initialValues);
  const [touched, setTouched] = useState<Partial<Record<keyof V, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const refs = useRef<Partial<Record<keyof V, FieldElement | null>>>({});

  const errors: FormErrors<V> = validateForm(values, rules);
  const isValid = Object.keys(errors).length === 0;

  const setValue = useCallback((name: keyof V, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const visibleError = (name: keyof V) => (submitted || touched[name] ? errors[name] : undefined);

  function field(name: keyof V) {
    return {
      name: String(name),
      value: values[name],
      error: visibleError(name),
      ref: (el: FieldElement | null) => {
        refs.current[name] = el;
      },
      onChange: (e: ChangeEvent<FieldElement>) => setValue(name, e.target.value),
      onBlur: () => setTouched((prev) => (prev[name] ? prev : { ...prev, [name]: true })),
    };
  }

  function handleSubmit(onValid: (values: V) => void) {
    return (e: FormEvent) => {
      e.preventDefault();
      setSubmitted(true);
      const invalid = firstInvalidField(errors, Object.keys(rules) as (keyof V)[]);
      if (invalid) {
        refs.current[invalid]?.focus();
        return;
      }
      onValid(values);
    };
  }

  /**
   * Props para `<form>`. El `mousedown` en el botón submit no mueve el foco: si el input perdiera el foco,
   * su error aparecería, el botón se correría y el `click` caería fuera (el envío se perdería).
   */
  function formProps(onValid: (values: V) => void) {
    return {
      noValidate: true,
      onSubmit: handleSubmit(onValid),
      onMouseDown: (e: MouseEvent<HTMLFormElement>) => {
        if ((e.target as HTMLElement).closest('button[type="submit"]')) e.preventDefault();
      },
    };
  }

  function reset(nextValues: V = initialValues) {
    setValues(nextValues);
    setTouched({});
    setSubmitted(false);
  }

  return { values, errors, isValid, field, setValue, formProps, reset, visibleError };
}
