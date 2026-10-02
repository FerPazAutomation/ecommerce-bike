import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import { FormField } from "../components/FormField";
import { PasswordField } from "../components/PasswordField";
import { useAuth } from "../hooks/useAuth";
import { useForm } from "../hooks/useForm";
import type { Rules } from "../lib/formValidation";
import { safeNextPath } from "../lib/redirect";
import {
  validateEmail,
  validateNewPassword,
  validateOptionalFullName,
  validatePasswordConfirmation,
  validateRequiredPassword,
} from "../lib/validation";

type TokenResponse = { access_token: string; token_type: string };
type Mode = "login" | "register";
type AuthValues = { fullName: string; email: string; password: string; confirm: string };

const REMEMBER_EMAIL_KEY = "ebike_remember_email";

/** Login no aplica la política de contraseña: solo pide que el campo no esté vacío. */
const LOGIN_RULES: Rules<AuthValues> = {
  email: [validateEmail],
  password: [validateRequiredPassword],
};

const REGISTER_RULES: Rules<AuthValues> = {
  fullName: [validateOptionalFullName],
  email: [validateEmail],
  password: [validateNewPassword],
  confirm: [(value, values) => validatePasswordConfirmation(values.password, value)],
};

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
  const [mode, setMode] = useState<Mode>(() =>
    searchParams.get("registro") === "1" ? "register" : "login",
  );
  const [storedEmail] = useState(readStoredEmail);
  const [rememberMe, setRememberMe] = useState(() => !!storedEmail);
  const form = useForm<AuthValues>(
    { fullName: "", email: storedEmail, password: "", confirm: "" },
    mode === "register" ? REGISTER_RULES : LOGIN_RULES,
  );

  const nextPath = safeNextPath(searchParams.get("next"));
  const sessionExpired = searchParams.get("expired") === "1";

  useEffect(() => {
    if (searchParams.get("registro") === "1") setMode("register");
  }, [searchParams]);

  const auth = useMutation({
    mutationFn: async ({ values, mode: m }: { values: AuthValues; mode: Mode }) => {
      const email = values.email.trim();
      if (m === "register") {
        await apiFetch("/auth/register", {
          method: "POST",
          auth: false,
          body: JSON.stringify({ email, password: values.password, full_name: values.fullName.trim() }),
        });
      }
      const t = await apiFetch<TokenResponse>("/auth/login", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ email, password: values.password }),
      });
      return { token: t, mode: m, email };
    },
    onSuccess: ({ token: t, mode: m, email }) => {
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
    form.reset({ ...form.values, confirm: "" });
    auth.reset();
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
        <form {...form.formProps((values) => auth.mutate({ values, mode }))}>
          {mode === "register" && (
            <FormField label="Nombre" autoComplete="name" hint="Opcional." {...form.field("fullName")} />
          )}
          <FormField label="Email" type="email" required autoComplete="email" {...form.field("email")} />
          <PasswordField
            label="Contraseña"
            required
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            showRequirements={mode === "register"}
            {...form.field("password")}
          />
          {mode === "register" && (
            <PasswordField
              label="Repetir contraseña"
              required
              autoComplete="new-password"
              {...form.field("confirm")}
            />
          )}

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
