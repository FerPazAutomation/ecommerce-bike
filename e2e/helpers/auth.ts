import { type APIRequestContext, expect } from "@playwright/test";
import { uniqueRegisterUser } from "../data/users";

/** Hace login y devuelve el JWT (`access_token`) del usuario indicado. */
export async function getToken(request: APIRequestContext, email: string, password: string): Promise<string> {
  // POST /auth/login → 200 { access_token, token_type: "bearer" }
  const response = await request.post("/auth/login", {
    data: { email, password },
  });
  // Si el login falla, el test se corta acá con un mensaje claro en vez de fallar más adelante.
  expect(response.status(), "login en getToken").toBe(200);
  return (await response.json()).access_token as string;
}

/** Arma el header que piden las rutas protegidas: `Authorization: Bearer <token>`. */
export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

/**
 * Registra un usuario nuevo y devuelve su token.
 * Usarlo cuando el test necesita un carrito propio y vacío (no comparte estado con otros tests).
 */
export async function newUserToken(request: APIRequestContext): Promise<string> {
  // Solo arma datos (email único + contraseña); todavía no toca la API.
  const user = uniqueRegisterUser();

  // POST /auth/register → crea el usuario en la base.
  const response = await request.post("/auth/register", {
    data: { email: user.email, password: user.password },
  });
  expect(response.status(), "registro en newUserToken").toBe(200);

  // Login con ese mismo usuario para obtener su token.
  return getToken(request, user.email, user.password);
}
