import { useMutation } from "@tanstack/react-query";
import { FormEvent, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client";
import { FormField } from "../components/FormField";
import { validateEmail } from "../lib/validation";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [done, setDone] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  const send = useMutation({
    mutationFn: () =>
      apiFetch<{ message: string }>("/auth/forgot-password", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ email }),
      }),
    onSuccess: () => setDone(true),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const error = validateEmail(email);
    setEmailError(error);
    if (error) {
      emailRef.current?.focus();
      return;
    }
    send.mutate();
  }

  return (
    <div className="container login-page-wrap">
      <h1>Recuperar contraseña</h1>
      <p style={{ color: "var(--muted)", marginTop: "0.5rem" }}>
        Indica el correo de tu cuenta y, si está registrado, te enviaremos instrucciones.
      </p>

      {done ? (
        <p className="form-notice" role="status">
          Si existe una cuenta con ese correo, recibirás instrucciones para restablecer la contraseña. Revisa también la
          carpeta de spam.
        </p>
      ) : (
        <div className="login-page-card">
          <form onSubmit={onSubmit} noValidate>
            <FormField
              ref={emailRef}
              label="Correo electrónico"
              type="email"
              required
              autoComplete="email"
              value={email}
              error={emailError}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(undefined);
              }}
            />
            <button type="submit" className="btn" disabled={send.isPending}>
              {send.isPending ? "Enviando…" : "Enviar instrucciones"}
            </button>
          </form>
          {send.isError && (
            <p className="form-alert" role="alert">
              {(send.error as Error).message}
            </p>
          )}
        </div>
      )}

      <p style={{ marginTop: "1.25rem" }}>
        <Link to="/login">Volver a iniciar sesión</Link>
      </p>
    </div>
  );
}
