import { describe, expect, it } from "vitest";
import {
  CHECKOUT_STOCK_DETAIL,
  OUT_OF_STOCK_LABEL,
  STOCK_WARNING_TEXT,
  cartHasStockIssues,
  cartLineStockLabel,
  isCheckoutStockError,
  isOutOfStock,
} from "./stock";

const line = (stock: number, hasEnoughStock: boolean) => ({
  has_enough_stock: hasEnoughStock,
  product: { stock },
});

describe("isOutOfStock", () => {
  it("considera con stock a partir de 1", () => {
    expect(isOutOfStock(1)).toBe(false);
    expect(isOutOfStock(10)).toBe(false);
  });

  it("considera sin stock a 0 y a un stock negativo", () => {
    expect(isOutOfStock(0)).toBe(true);
    expect(isOutOfStock(-1)).toBe(true);
  });
});

describe("cartLineStockLabel", () => {
  it("no marca una línea con stock suficiente", () => {
    expect(cartLineStockLabel(line(3, true))).toBeNull();
  });

  it("marca Sin stock con stock 0 o negativo", () => {
    expect(cartLineStockLabel(line(0, false))).toBe("Sin stock");
    expect(cartLineStockLabel(line(-2, false))).toBe("Sin stock");
  });

  it("marca Stock insuficiente con las unidades que quedan", () => {
    expect(cartLineStockLabel(line(1, false))).toBe("Stock insuficiente: quedan 1");
    expect(cartLineStockLabel(line(2, false))).toBe("Stock insuficiente: quedan 2");
  });
});

describe("cartHasStockIssues", () => {
  it("es false sin carrito o con el carrito vacío", () => {
    expect(cartHasStockIssues(undefined)).toBe(false);
    expect(cartHasStockIssues({ items: [] })).toBe(false);
  });

  it("es false si todas las líneas tienen stock suficiente", () => {
    expect(cartHasStockIssues({ items: [line(3, true), line(1, true)] })).toBe(false);
  });

  it("es true si alguna línea no tiene stock suficiente", () => {
    expect(cartHasStockIssues({ items: [line(3, true), line(0, false)] })).toBe(true);
  });
});

describe("isCheckoutStockError", () => {
  it("reconoce el detail exacto del 409 del checkout", () => {
    expect(isCheckoutStockError(new Error("Not enough stock for some cart items"))).toBe(true);
  });

  it("no confunde otros errores", () => {
    expect(isCheckoutStockError(new Error("Not enough stock"))).toBe(false);
    expect(isCheckoutStockError(new Error("Cart is empty"))).toBe(false);
    expect(isCheckoutStockError("Not enough stock for some cart items")).toBe(false);
    expect(isCheckoutStockError(null)).toBe(false);
  });
});

describe("textos de stock", () => {
  it("usa los textos fijos de la spec", () => {
    expect(OUT_OF_STOCK_LABEL).toBe("Sin stock");
    expect(CHECKOUT_STOCK_DETAIL).toBe("Not enough stock for some cart items");
    expect(STOCK_WARNING_TEXT).toBe(
      "Uno o más productos de tu carrito ya no tienen stock suficiente. Revisá tu carrito.",
    );
  });
});
