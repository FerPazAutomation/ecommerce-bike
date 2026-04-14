/**
 * Ejemplo de test unitario en el frontend (sin navegador).
 *
 * Lenguaje: TypeScript.
 * Framework: Vitest (runner integrado con Vite).
 * Estructura: *.test.ts junto al módulo o en __tests__/; import explícito de describe/it/expect.
 */
import { describe, expect, it } from "vitest";
import { categorySlugLabel } from "./categoryLabels";

describe("categorySlugLabel", () => {
  it("devuelve la etiqueta en español para slugs conocidos", () => {
    expect(categorySlugLabel("montana")).toBe("Montaña");
    expect(categorySlugLabel("ciudad")).toBe("Ciudad");
  });

  it("devuelve el slug si no hay etiqueta", () => {
    expect(categorySlugLabel("desconocido")).toBe("desconocido");
  });
});
