import { type InputHTMLAttributes, forwardRef, useId } from "react";

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

/** Label visible + input + ayuda + error, vinculados con `htmlFor` y `aria-describedby`. */
export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(function FormField(
  { label, hint, error, id, className, ...inputProps },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const inputClass = ["input", error ? "input-invalid" : "", className ?? ""].filter(Boolean).join(" ");

  return (
    <div className="form-field">
      <label className="form-label" htmlFor={inputId}>
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        className={inputClass}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...inputProps}
      />
      {hint ? (
        <p id={hintId} className="form-field-hint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="form-field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
});
