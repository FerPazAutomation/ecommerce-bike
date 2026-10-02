import { useState } from "react";
import { Link } from "react-router-dom";
import { FormField } from "../components/FormField";
import { useForm } from "../hooks/useForm";
import type { Rules } from "../lib/formValidation";
import { countDigits, validateEmail, validateMaxLength, validateRequired } from "../lib/validation";

type ServiceValues = {
  fullName: string;
  email: string;
  phone: string;
  bikeModel: string;
  dateFrom: string;
  dateTo: string;
  comments: string;
};

const COMMENTS_MAX = 2000;
const BIKE_MODEL_MAX = 100;
const PHONE_CHARS = /^[\d\s()+-]+$/;

/** Fecha local en formato `YYYY-MM-DD`, comparable como string con el valor de `<input type="date">`. */
function todayIso(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

const SERVICE_RULES: Rules<ServiceValues> = {
  fullName: [
    (v) => validateRequired(v, "Indicá tu nombre completo."),
    (v) => (v.trim().length < 4 ? "El nombre es demasiado corto." : undefined),
    (v) => (/\s/.test(v.trim()) ? undefined : "Incluí nombre y apellido (separados por un espacio)."),
  ],
  email: [validateEmail],
  phone: [
    (v) => validateRequired(v, "Indicá un teléfono de contacto."),
    (v) => (PHONE_CHARS.test(v.trim()) ? undefined : "Usá solo números, espacios, +, - y paréntesis."),
    (v) => (countDigits(v) < 8 ? "El teléfono debe tener al menos 8 dígitos." : undefined),
    (v) => (countDigits(v) > 15 ? "El teléfono no puede tener más de 15 dígitos." : undefined),
  ],
  bikeModel: [
    (v) => validateRequired(v, "Indicá el modelo de tu bicicleta."),
    (v) => (v.trim().length < 2 ? "Describí un poco más el modelo." : undefined),
    (v) => validateMaxLength(v.trim(), BIKE_MODEL_MAX, `El modelo no puede superar los ${BIKE_MODEL_MAX} caracteres.`),
  ],
  dateFrom: [
    (v) => validateRequired(v, "Elegí la fecha de inicio del turno."),
    (v) => (v < todayIso() ? "La fecha de inicio no puede ser anterior a hoy." : undefined),
  ],
  dateTo: [
    (v) => validateRequired(v, "Elegí la fecha de fin del turno."),
    (v, values) =>
      values.dateFrom && v < values.dateFrom ? "La fecha de fin no puede ser anterior al inicio." : undefined,
  ],
  comments: [
    (v) => validateMaxLength(v, COMMENTS_MAX, `Los comentarios no pueden superar los ${COMMENTS_MAX} caracteres.`),
  ],
};

const EMPTY_REQUEST: ServiceValues = {
  fullName: "",
  email: "",
  phone: "",
  bikeModel: "",
  dateFrom: "",
  dateTo: "",
  comments: "",
};

export function ServicePage() {
  const [sent, setSent] = useState(false);
  const form = useForm(EMPTY_REQUEST, SERVICE_RULES);
  const comments = form.field("comments");
  const commentsHintId = "svc-comments-count";
  const commentsErrorId = "svc-comments-error";

  return (
    <div className="container service-page-wrap">
      <h1>Servicio técnico y turnos</h1>
      <p style={{ color: "var(--muted)", maxWidth: "640px", marginTop: 0 }}>
        Completá el formulario para solicitar un turno de taller o una consulta. Te responderemos por email o teléfono.
      </p>

      <div className="service-page-card">
        {sent ? (
          <div className="service-success" role="status">
            <p style={{ marginTop: 0, fontWeight: 700 }}>Solicitud registrada (demo)</p>
            <p style={{ color: "var(--muted)", marginBottom: 0 }}>
              En un entorno real este envío iría al backend. Por ahora solo validamos los datos en el navegador.
            </p>
            <p style={{ marginTop: "1rem" }}>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  form.reset();
                  setSent(false);
                }}
              >
                Enviar otra solicitud
              </button>
            </p>
          </div>
        ) : (
          <form {...form.formProps(() => setSent(true))}>
            <FormField id="svc-fullName" label="Nombre completo" autoComplete="name" {...form.field("fullName")} />
            <FormField id="svc-email" label="Email" type="email" autoComplete="email" {...form.field("email")} />
            <FormField
              id="svc-phone"
              label="Teléfono de contacto"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="Ej. +54 9 11 1234-5678"
              {...form.field("phone")}
            />
            <FormField id="svc-bikeModel" label="Modelo de bici" {...form.field("bikeModel")} />

            <div className="service-date-row">
              <FormField
                id="svc-dateFrom"
                label="Fecha desde"
                type="date"
                min={todayIso()}
                {...form.field("dateFrom")}
              />
              <FormField
                id="svc-dateTo"
                label="Fecha hasta"
                type="date"
                min={form.values.dateFrom || todayIso()}
                {...form.field("dateTo")}
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="svc-comments">
                Comentarios <span style={{ color: "var(--muted)", fontWeight: 400 }}>(opcional)</span>
              </label>
              <textarea
                id="svc-comments"
                className={`input service-textarea${comments.error ? " input-invalid" : ""}`}
                rows={5}
                maxLength={COMMENTS_MAX}
                aria-invalid={comments.error ? true : undefined}
                aria-describedby={[commentsHintId, comments.error ? commentsErrorId : ""].filter(Boolean).join(" ")}
                name={comments.name}
                value={comments.value}
                ref={comments.ref}
                onChange={comments.onChange}
                onBlur={comments.onBlur}
              />
              <p id={commentsHintId} className="form-field-hint">
                {comments.value.length} / {COMMENTS_MAX}
              </p>
              {comments.error ? (
                <p id={commentsErrorId} className="form-field-error">
                  {comments.error}
                </p>
              ) : null}
            </div>

            <button type="submit" className="btn" style={{ marginTop: "0.5rem" }}>
              Enviar solicitud
            </button>
          </form>
        )}
      </div>

      <p style={{ marginTop: "1.25rem" }}>
        <Link to="/">Volver al inicio</Link>
      </p>
    </div>
  );
}
