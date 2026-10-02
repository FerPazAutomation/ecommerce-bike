import { type InputHTMLAttributes, type ReactNode, forwardRef, useId } from "react";

export type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
  /** Control dentro del campo, a la derecha (ej. botón "Mostrar" de contraseña). */
  endAdornment?: ReactNode;
  /** Ids extra para `aria-describedby` (ej. la lista de requisitos pasada como `children`). */
  describedBy?: string;
  /** Contenido entre la ayuda y el error (ej. requisitos de contraseña). */
  children?: ReactNode;
};

/** Label visible + input + ayuda + error, vinculados con `htmlFor` y `aria-describedby`. */
export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(function FormField(
  { label, hint, error, endAdornment, describedBy: extraDescribedBy, children, id, className, ...inputProps },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, extraDescribedBy, errorId].filter(Boolean).join(" ") || undefined;
  const inputClass = ["input", error ? "input-invalid" : "", className ?? ""].filter(Boolean).join(" ");

  const input = (
    <input
      ref={ref}
      id={inputId}
      className={inputClass}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy}
      {...inputProps}
    />
  );

  return (
    <div className="form-field">
      <label className="form-label" htmlFor={inputId}>
        {label}
      </label>
      {endAdornment ? (
        <div className="form-field-control">
          {input}
          {endAdornment}
        </div>
      ) : (
        input
      )}
      {hint ? (
        <p id={hintId} className="form-field-hint">
          {hint}
        </p>
      ) : null}
      {children}
      {error ? (
        <p id={errorId} className="form-field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
});
