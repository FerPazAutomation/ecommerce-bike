import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";

type FieldErrors = Partial<Record<"fullName" | "email" | "phone" | "bikeModel" | "dateFrom" | "dateTo" | "comments", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function countDigits(s: string): number {
  return (s.match(/\d/g) ?? []).length;
}

function validate(values: {
  fullName: string;
  email: string;
  phone: string;
  bikeModel: string;
  dateFrom: string;
  dateTo: string;
  comments: string;
}): FieldErrors {
  const e: FieldErrors = {};
  const name = values.fullName.trim();
  if (!name) e.fullName = "Indicá tu nombre completo.";
  else if (name.length < 4) e.fullName = "El nombre es demasiado corto.";
  else if (!/\s/.test(name)) e.fullName = "Incluí nombre y apellido (separados por un espacio).";

  const mail = values.email.trim();
  if (!mail) e.email = "Indicá un email.";
  else if (!EMAIL_RE.test(mail)) e.email = "El email no tiene un formato válido.";

  const phone = values.phone.trim();
  if (!phone) e.phone = "Indicá un teléfono de contacto.";
  else if (countDigits(phone) < 8) e.phone = "El teléfono debe tener al menos 8 dígitos.";

  const model = values.bikeModel.trim();
  if (!model) e.bikeModel = "Indicá el modelo de tu bicicleta.";
  else if (model.length < 2) e.bikeModel = "Describí un poco más el modelo.";

  if (!values.dateFrom) e.dateFrom = "Elegí la fecha de inicio del turno.";
  if (!values.dateTo) e.dateTo = "Elegí la fecha de fin del turno.";
  if (!e.dateFrom && !e.dateTo && values.dateFrom && values.dateTo) {
    const a = new Date(values.dateFrom);
    const b = new Date(values.dateTo);
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) {
      e.dateFrom = "Fecha no válida.";
    } else if (b < a) {
      e.dateTo = "La fecha de fin no puede ser anterior al inicio.";
    }
  }

  if (values.comments.length > 2000) e.comments = "Los comentarios no pueden superar los 2000 caracteres.";

  return e;
}

export function ServicePage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bikeModel, setBikeModel] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [comments, setComments] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sent, setSent] = useState(false);

  function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    setSent(false);
    const next = validate({ fullName, email, phone, bikeModel, dateFrom, dateTo, comments });
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSent(true);
  }

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
              <button type="button" className="btn-ghost" onClick={() => setSent(false)}>
                Enviar otra solicitud
              </button>
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <label className="form-label" htmlFor="svc-fullName">
              Nombre completo
            </label>
            <input
              id="svc-fullName"
              className={`input${errors.fullName ? " input-invalid" : ""}`}
              autoComplete="name"
              value={fullName}
              onChange={(c) => {
                setFullName(c.target.value);
                if (errors.fullName) setErrors((x) => ({ ...x, fullName: undefined }));
              }}
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? "err-fullName" : undefined}
            />
            {errors.fullName && (
              <p id="err-fullName" className="form-field-error" role="alert">
                {errors.fullName}
              </p>
            )}

            <label className="form-label" htmlFor="svc-email">
              Email
            </label>
            <input
              id="svc-email"
              type="email"
              className={`input${errors.email ? " input-invalid" : ""}`}
              autoComplete="email"
              value={email}
              onChange={(c) => {
                setEmail(c.target.value);
                if (errors.email) setErrors((x) => ({ ...x, email: undefined }));
              }}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "err-email" : undefined}
            />
            {errors.email && (
              <p id="err-email" className="form-field-error" role="alert">
                {errors.email}
              </p>
            )}

            <label className="form-label" htmlFor="svc-phone">
              Teléfono de contacto
            </label>
            <input
              id="svc-phone"
              type="tel"
              className={`input${errors.phone ? " input-invalid" : ""}`}
              autoComplete="tel"
              inputMode="tel"
              placeholder="Ej. +54 9 11 1234-5678"
              value={phone}
              onChange={(c) => {
                setPhone(c.target.value);
                if (errors.phone) setErrors((x) => ({ ...x, phone: undefined }));
              }}
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? "err-phone" : undefined}
            />
            {errors.phone && (
              <p id="err-phone" className="form-field-error" role="alert">
                {errors.phone}
              </p>
            )}

            <label className="form-label" htmlFor="svc-bikeModel">
              Modelo de bici
            </label>
            <input
              id="svc-bikeModel"
              className={`input${errors.bikeModel ? " input-invalid" : ""}`}
              value={bikeModel}
              onChange={(c) => {
                setBikeModel(c.target.value);
                if (errors.bikeModel) setErrors((x) => ({ ...x, bikeModel: undefined }));
              }}
              aria-invalid={!!errors.bikeModel}
              aria-describedby={errors.bikeModel ? "err-bikeModel" : undefined}
            />
            {errors.bikeModel && (
              <p id="err-bikeModel" className="form-field-error" role="alert">
                {errors.bikeModel}
              </p>
            )}

            <div className="service-date-row">
              <div>
                <label className="form-label" htmlFor="svc-dateFrom">
                  Fecha desde
                </label>
                <input
                  id="svc-dateFrom"
                  type="date"
                  className={`input${errors.dateFrom ? " input-invalid" : ""}`}
                  value={dateFrom}
                  onChange={(c) => {
                    setDateFrom(c.target.value);
                    if (errors.dateFrom) setErrors((x) => ({ ...x, dateFrom: undefined }));
                  }}
                  aria-invalid={!!errors.dateFrom}
                  aria-describedby={errors.dateFrom ? "err-dateFrom" : undefined}
                />
                {errors.dateFrom && (
                  <p id="err-dateFrom" className="form-field-error" role="alert">
                    {errors.dateFrom}
                  </p>
                )}
              </div>
              <div>
                <label className="form-label" htmlFor="svc-dateTo">
                  Fecha hasta
                </label>
                <input
                  id="svc-dateTo"
                  type="date"
                  className={`input${errors.dateTo ? " input-invalid" : ""}`}
                  value={dateTo}
                  onChange={(c) => {
                    setDateTo(c.target.value);
                    if (errors.dateTo) setErrors((x) => ({ ...x, dateTo: undefined }));
                  }}
                  aria-invalid={!!errors.dateTo}
                  aria-describedby={errors.dateTo ? "err-dateTo" : undefined}
                />
                {errors.dateTo && (
                  <p id="err-dateTo" className="form-field-error" role="alert">
                    {errors.dateTo}
                  </p>
                )}
              </div>
            </div>

            <label className="form-label" htmlFor="svc-comments">
              Comentarios <span style={{ color: "var(--muted)", fontWeight: 400 }}>(opcional)</span>
            </label>
            <textarea
              id="svc-comments"
              className={`input service-textarea${errors.comments ? " input-invalid" : ""}`}
              rows={5}
              maxLength={2000}
              value={comments}
              onChange={(c) => {
                setComments(c.target.value);
                if (errors.comments) setErrors((x) => ({ ...x, comments: undefined }));
              }}
              aria-invalid={!!errors.comments}
              aria-describedby={errors.comments ? "err-comments" : undefined}
            />
            <p style={{ margin: "-0.35rem 0 0.5rem", fontSize: "0.85rem", color: "var(--muted)" }}>
              {comments.length} / 2000
            </p>
            {errors.comments && (
              <p id="err-comments" className="form-field-error" role="alert">
                {errors.comments}
              </p>
            )}

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
