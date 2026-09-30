import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import { FormField } from "../components/FormField";
import { useAuth } from "../hooks/useAuth";
import { safeNextPath } from "../lib/redirect";
import { validateEmail, validateNewPassword, validateRequiredPassword } from "../lib/validation";

type TokenResponse = { access_token: string; token_type: string };
type Mode = "login" | "register";
type FieldErrors = { email?: string; password?: string };

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
  const { login } = useAuth();
  const [email, setEmail] = useState(readStoredEmail);
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [mode, setMode] = useState<Mode>(() =>
    searchParams.get("registro") === "1" ? "register" : "login",
  );
  const [rememberMe, setRememberMe] = useState(() => !!readStoredEmail());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const nextPath = safeNextPath(searchParams.get("next"));
  const sessionExpired = searchParams.get("expired") === "1";

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
      login(t.access_token);
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
      navigate(nextPath, { replace: true });
    },
  });

  function switchMode(next: Mode) {
    setMode(next);
    setFieldErrors({});
    auth.reset();
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errors: FieldErrors = {
      email: validateEmail(email),
      password: mode === "register" ? validateNewPassword(password) : validateRequiredPassword(password),
    };
    setFieldErrors(errors);
    if (errors.email) {
      emailRef.current?.focus();
      return;
    }
    if (errors.password) {
      passwordRef.current?.focus();
      return;
    }
    auth.mutate();
  }

  const submitLabel = auth.isPending
    ? mode === "login"
      ? "Entrando…"
      : "Creando cuenta…"
    : mode === "login"
      ? "Entrar"
      : "Registrarse";

  return (
    <div className="container login-page-wrap">
      <h1>{mode === "login" ? "Iniciar sesión" : "Crear cuenta"}</h1>

      {sessionExpired && mode === "login" ? (
        <p className="form-notice" role="status">
          Tu sesión expiró. Iniciá sesión de nuevo para continuar.
        </p>
      ) : null}

      <div className="login-page-card">
        <form onSubmit={onSubmit} noValidate>
          {mode === "register" && (
            <FormField
              label="Nombre"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          )}
          <FormField
            ref={emailRef}
            label="Email"
            type="email"
            required
            autoComplete="email"
            value={email}
            error={fieldErrors.email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((x) => ({ ...x, email: undefined }));
            }}
          />
          <FormField
            ref={passwordRef}
            label="Contraseña"
            type="password"
            required
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            hint={mode === "register" ? "Más de 8 caracteres." : undefined}
            value={password}
            error={fieldErrors.password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((x) => ({ ...x, password: undefined }));
            }}
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
            {submitLabel}
          </button>
        </form>

        {auth.isError && (
          <p className="form-alert" role="alert">
            {(auth.error as Error).message}
          </p>
        )}
      </div>

      <p className="login-page-footnote">
        {mode === "login" ? (
          <>
            ¿Sin cuenta?{" "}
            <button type="button" className="login-text-link" onClick={() => switchMode("register")}>
              Regístrate
            </button>
          </>
        ) : (
          <>
            ¿Ya tienes cuenta?{" "}
            <button type="button" className="login-text-link" onClick={() => switchMode("login")}>
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
