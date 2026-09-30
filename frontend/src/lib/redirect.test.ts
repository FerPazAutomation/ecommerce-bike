import { describe, expect, it } from "vitest";
import { DEFAULT_AFTER_LOGIN, loginPathWithNext, safeNextPath } from "./redirect";

describe("safeNextPath", () => {
  it("usa /productos si no hay destino", () => {
    expect(safeNextPath(null)).toBe(DEFAULT_AFTER_LOGIN);
    expect(safeNextPath("")).toBe(DEFAULT_AFTER_LOGIN);
  });

  it("acepta rutas internas con query", () => {
    expect(safeNextPath("/carrito")).toBe("/carrito");
    expect(safeNextPath("/productos?categoria=montana")).toBe("/productos?categoria=montana");
  });

  it("rechaza destinos externos (open redirect)", () => {
    expect(safeNextPath("https://evil.com")).toBe(DEFAULT_AFTER_LOGIN);
    expect(safeNextPath("//evil.com")).toBe(DEFAULT_AFTER_LOGIN);
    expect(safeNextPath("/\\evil.com")).toBe(DEFAULT_AFTER_LOGIN);
  });

  it("evita volver al propio login", () => {
    expect(safeNextPath("/login")).toBe(DEFAULT_AFTER_LOGIN);
    expect(safeNextPath("/login?next=/carrito")).toBe(DEFAULT_AFTER_LOGIN);
  });
});

describe("loginPathWithNext", () => {
  it("codifica el destino en la query", () => {
    expect(loginPathWithNext("/productos/bici-1?x=1")).toBe("/login?next=%2Fproductos%2Fbici-1%3Fx%3D1");
  });

  it("agrega expired=1 cuando la sesión venció", () => {
    expect(loginPathWithNext("/carrito", { expired: true })).toBe("/login?expired=1&next=%2Fcarrito");
  });
});
