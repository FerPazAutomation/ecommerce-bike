import { forwardRef, useId, useState } from "react";
import { passwordRequirements } from "../lib/validation";
import { FormField, type FormFieldProps } from "./FormField";

type PasswordFieldProps = Omit<FormFieldProps, "type" | "endAdornment" | "describedBy" | "children"> & {
  /** Lista de requisitos que se tilda mientras se escribe. Solo para contraseñas nuevas. */
  showRequirements?: boolean;
};

export function PasswordRequirements({ id, value }: { id: string; value: string }) {
  return (
    <ul id={id} className="password-rules">
      {passwordRequirements(value).map((rule) => (
        <li key={rule.id} className={rule.met ? "password-rule is-met" : "password-rule"}>
          <span className="password-rule-icon" aria-hidden>
            {rule.met ? "✓" : "•"}
          </span>
          {rule.label}
          <span className="visually-hidden">{rule.met ? " (cumplido)" : " (pendiente)"}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Campo de contraseña con botón Mostrar/Ocultar.
 * El botón usa texto visible (sin `aria-label` con "contraseña") para no competir con el label del input.
 */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(function PasswordField(
  { showRequirements = false, id, value, ...props },
  ref,
) {
  const [visible, setVisible] = useState(false);
  const autoId = useId();
  const inputId = id ?? autoId;
  const requirementsId = `${inputId}-requirements`;

  return (
    <FormField
      ref={ref}
      id={inputId}
      type={visible ? "text" : "password"}
      spellCheck={false}
      autoCapitalize="none"
      value={value}
      describedBy={showRequirements ? requirementsId : undefined}
      endAdornment={
        <button
          type="button"
          className="password-toggle"
          aria-controls={inputId}
          aria-pressed={visible}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? "Ocultar" : "Mostrar"}
        </button>
      }
      {...props}
    >
      {showRequirements ? <PasswordRequirements id={requirementsId} value={String(value ?? "")} /> : null}
    </FormField>
  );
});
