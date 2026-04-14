/**
 * Cliente HTTP hacia la API FastAPI.
 *
 * Por qué `Authorization: Bearer`: el backend valida el JWT en cada petición protegida
 * (carrito, checkout); el token se guarda en localStorage tras el login.
 */

const TOKEN_KEY = "ebike_token";

/**
 * Base de la API. En desarrollo, si no hay `VITE_API_URL`, se usa el proxy `/api` de Vite
 * hacia el backend (evita CORS y URLs incorrectas al abrir el front desde otra máquina).
 */
export function getApiBase(): string {
  const raw = import.meta.env.VITE_API_URL as string | undefined;
  if (raw != null && String(raw).trim() !== "") {
    return String(raw).replace(/\/$/, "");
  }
  if (import.meta.env.DEV) {
    return "/api";
  }
  return "http://127.0.0.1:8000";
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

/** Quita el JWT del almacenamiento local (p. ej. al cerrar sesión). */
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (options.auth !== false) {
    const t = getToken();
    if (t) headers.set("Authorization", `Bearer ${t}`);
  }
  const res = await fetch(`${getApiBase()}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const detail = (err as { detail?: unknown }).detail;
    let message: string;
    if (typeof detail === "string") {
      message = detail;
    } else if (Array.isArray(detail)) {
      message = detail
        .map((d: { msg?: string }) => d.msg)
        .filter(Boolean)
        .join(" ");
    } else {
      message = res.statusText;
    }
    throw new Error(message || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
