import { useMutation } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

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
    send.mutate();
  }

  return (
    <div className="container login-page-wrap">
      <h1>Recuperar contraseña</h1>
      <p style={{ color: "var(--muted)", marginTop: "0.5rem" }}>
        Indica el correo de tu cuenta y, si está registrado, te enviaremos instrucciones.
      </p>

      {done ? (
        <p style={{ marginTop: "1.25rem" }}>
          Si existe una cuenta con ese correo, recibirás instrucciones para restablecer la contraseña. Revisa también la
          carpeta de spam.
        </p>
      ) : (
        <div className="login-page-card">
          <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.75rem" }}>
            <input
              className="input"
              type="email"
              required
              autoComplete="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" className="btn" disabled={send.isPending}>
              {send.isPending ? "…" : "Enviar instrucciones"}
            </button>
          </form>
        </div>
      )}

      {send.isError && (
        <p style={{ color: "var(--danger)", marginTop: "0.75rem" }}>{(send.error as Error).message}</p>
      )}

      <p style={{ marginTop: "1.25rem" }}>
        <Link to="/login">Volver a iniciar sesión</Link>
      </p>
    </div>
  );
}
