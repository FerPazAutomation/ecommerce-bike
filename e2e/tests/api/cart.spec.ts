import { test, expect } from "@playwright/test";
import { authHeader, newUserToken } from "../../helpers/auth";

// Cada test prueba un control de `get_current_user` (backend/app/api/deps.py):
// 1) ¿hay header con esquema Bearer?  2) ¿el JWT es válido?  3) ¿el usuario existe?
test.describe("Cart API - authentication", () => {
  test("GET /cart without token returns 401", async ({ request }) => {
    // Sin header Authorization → falla el control 1.
    const response = await request.get("/cart");

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ detail: "Not authenticated" });
  });

  test("GET /cart with token but without Bearer returns 401", async ({ request }) => {
    const token = await newUserToken(request);

    // Token real pero sin la palabra "Bearer" → la API ni intenta leerlo (control 1).
    const response = await request.get("/cart", {
      headers: { Authorization: token },
    });

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ detail: "Not authenticated" });
  });

  test("GET /cart with invalid token returns 401", async ({ request }) => {
    // Esquema correcto pero el token no es un JWT firmado por la API → falla el control 2.
    const response = await request.get("/cart", {
      headers: authHeader("invalid-token"),
    });

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ detail: "Invalid token" });
  });

  test("GET /cart with valid token returns an empty cart for a new user", async ({ request }) => {
    // Usuario recién creado → su carrito tiene que estar vacío.
    const token = await newUserToken(request);

    const response = await request.get("/cart", {
      headers: authHeader(token),
    });

    expect(response.status()).toBe(200);
    // `subtotal` llega como string porque la API lo serializa como Decimal.
    expect(await response.json()).toEqual({ items: [], subtotal: "0" });
  });
});
