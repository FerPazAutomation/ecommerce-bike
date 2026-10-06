export const DEFAULT_AFTER_LOGIN = "/productos";

/**
 * Devuelve una ruta interna segura para redirigir después del login.
 * Rechaza URLs absolutas o protocol-relative (`//evil.com`) para evitar open redirects.
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next) return DEFAULT_AFTER_LOGIN;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return DEFAULT_AFTER_LOGIN;
  }
  if (next === "/login" || next.startsWith("/login?") || next.startsWith("/login/")) {
    return DEFAULT_AFTER_LOGIN;
  }
  return next;
}

export function loginPathWithNext(next: string, options: { expired?: boolean } = {}): string {
  const params = new URLSearchParams();
  if (options.expired) params.set("expired", "1");
  params.set("next", next);
  return `/login?${params.toString()}`;
}
