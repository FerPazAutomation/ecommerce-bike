import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch, setToken } from "../api/client";

type TokenResponse = { access_token: string; token_type: string };

const REMEMBER_EMAIL_KEY = "ebike_remember_email";

function readStoredEmail(): string {
  try {
    return localStorage.getItem(REMEMBER_EMAIL_KEY) ?? "";
  } catch {
    return "";
  }
}

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qc = useQueryClient();
  const [email, setEmail] = useState(readStoredEmail);
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [mode, setMode] = useState<"login" | "register">(() =>
    searchParams.get("registro") === "1" ? "register" : "login",
  );
  const [rememberMe, setRememberMe] = useState(() => !!readStoredEmail());

  useEffect(() => {
    if (searchParams.get("registro") === "1") setMode("register");
  }, [searchParams]);

  const auth = useMutation({
    mutationFn: async () => {
      if (mode === "register") {
        await apiFetch("/auth/register", {
          method: "POST",
          auth: false,
          body: JSON.stringify({ email, password, full_name: fullName }),
        });
      }
      const t = await apiFetch<TokenResponse>("/auth/login", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ email, password }),
      });
      return { token: t, mode };
    },
    onSuccess: ({ token: t, mode: m }) => {
      setToken(t.access_token);
      if (m === "login") {
        try {
          if (rememberMe) {
            localStorage.setItem(REMEMBER_EMAIL_KEY, email);
          } else {
            localStorage.removeItem(REMEMBER_EMAIL_KEY);
          }
        } catch {
          /* ignore */
        }
      }
      qc.invalidateQueries();
      navigate("/productos");
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    auth.mutate();
  }

  return (
    <div className="container login-page-wrap">
      <h1>{mode === "login" ? "Iniciar sesión" : "Crear cuenta"}</h1>

      <div className="login-page-card">
        <form onSubmit={onSubmit}>
          {mode === "register" && (
            <input
              className="input"
              placeholder="Nombre"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          )}
          <input
            className="input"
            type="email"
            required
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="input"
            type="password"
            required
            minLength={mode === "register" ? 9 : 1}
            placeholder={
              mode === "register" ? "Contraseña (más de 8 caracteres)" : "Contraseña"
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {mode === "login" && (
            <div className="login-form-extras">
              <label className="login-remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Recuérdame</span>
              </label>
              <Link to="/recuperar" className="login-forgot-link">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          )}

          <button type="submit" className="btn" disabled={auth.isPending}>
            {auth.isPending ? "…" : mode === "login" ? "Entrar" : "Registrarse"}
          </button>
        </form>

        {auth.isError && (
          <p style={{ color: "var(--danger)", marginTop: "0.75rem", marginBottom: 0 }}>
            {(auth.error as Error).message}
          </p>
        )}
      </div>

      <p className="login-page-footnote">
        {mode === "login" ? (
          <>
            ¿Sin cuenta?{" "}
            <button type="button" className="login-text-link" onClick={() => setMode("register")}>
              Regístrate
            </button>
          </>
        ) : (
          <>
            ¿Ya tienes cuenta?{" "}
            <button type="button" className="login-text-link" onClick={() => setMode("login")}>
              Inicia sesión
            </button>
          </>
        )}
      </p>
      <p style={{ marginTop: "0.5rem" }}>
        <Link to="/">Volver al inicio</Link>
      </p>
    </div>
  );
}
