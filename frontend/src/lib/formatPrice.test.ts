import { describe, expect, it } from "vitest";
import { formatPrice } from "./formatPrice";

/** Intl usa espacio duro (U+00A0) entre símbolo y número. */
const plain = (s: string) => s.replace(/\s/g, " ");

describe("formatPrice", () => {
  it("formatea strings Decimal de la API en dólares", () => {
    expect(plain(formatPrice("689.00"))).toBe("US$ 689,00");
    expect(plain(formatPrice("1234.5"))).toBe("US$ 1.234,50");
    expect(plain(formatPrice("0"))).toBe("US$ 0,00");
  });

  it("acepta números", () => {
    expect(plain(formatPrice(99.9))).toBe("US$ 99,90");
  });

  it("devuelve el valor original si no es numérico", () => {
    expect(formatPrice("abc")).toBe("abc");
  });

  it("no rompe con una moneda inválida", () => {
    expect(formatPrice("10", "not-a-currency")).toBe("NOT-A-CURRENCY 10.00");
  });
});
